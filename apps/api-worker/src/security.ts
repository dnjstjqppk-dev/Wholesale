import { users, organizations } from './store';

export interface RuntimeConfig {
  JWT_SECRET?: string;
  PAYMENT_WEBHOOK_SECRET?: string;
  DEMO_MODE?: string;
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
}
const configs = new WeakMap<Request, RuntimeConfig>();
export function configureRequest(request: Request, config: RuntimeConfig) { configs.set(request, config); }
export function configFor(request: Request): RuntimeConfig { return configs.get(request) || {}; }
export class DomainError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function check(condition: unknown, status: number, code: string, message: string): asserts condition {
  if (!condition) throw new DomainError(status, code, message);
}
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export async function digest(text: string) { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(text))); }
function encode(value: unknown) {
  return btoa(String.fromCharCode(...encoder.encode(JSON.stringify(value)))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function decode(value: string): any {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
}
async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage);
}
export async function signJwt(payload: Record<string, unknown>, request: Request) {
  const secret = configFor(request).JWT_SECRET;
  check(secret && secret.length >= 32, 503, 'AUTH_NOT_CONFIGURED', 'Authentication secret is not configured');
  const now = Math.floor(Date.now() / 1000);
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ ...payload, iss: 'wholesale', aud: 'wholesale-web', iat: now, exp: now + 3600 })}`;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, ['sign']), encoder.encode(data));
  return `${data}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}
export async function getAuthContext(request: Request, ..._legacy: unknown[]): Promise<{ user: any; org: any } | null> {
  try {
    const secret = configFor(request).JWT_SECRET;
    if (!secret || secret.length < 32) return null;
    const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    if (decode(header).alg !== 'HS256') return null;
    const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC', await hmacKey(secret, ['verify']), sig, encoder.encode(`${header}.${payload}`))) return null;
    const claims = decode(payload);
    if (claims.iss !== 'wholesale' || claims.aud !== 'wholesale-web' || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    const user = [...users.values()].find(u => u.id === claims.sub);
    if (!user || user.status === 'DISABLED' || user.active_organization_id !== claims.org_id || user.role !== claims.role) return null;
    const org = organizations.get(user.active_organization_id);
    return org ? { user, org } : null;
  } catch { return null; }
}
export async function requireAuth(request: Request) {
  const ctx = await getAuthContext(request);
  check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  return ctx;
}
export function requireRole(ctx: { user: any }, ...roles: string[]) {
  check(roles.includes(ctx.user.role), 403, 'FORBIDDEN', '이 작업을 수행할 권한이 없습니다.');
}
export async function hashPassword(password: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer)) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 100000, salt: encoder.encode(salt) }, key, 256);
  return `pbkdf2-sha256$100000$${salt}$${hex(bits)}`;
}
export async function verifyPassword(password: string, stored: string) {
  const salt = stored?.split('$')[2];
  if (!salt) return false;
  const result = await hashPassword(password, salt);
  if (result.length !== stored.length) return false;
  let difference = 0;
  for (let i = 0; i < result.length; i++) difference |= result.charCodeAt(i) ^ stored.charCodeAt(i);
  return difference === 0;
}
export async function verifyWebhook(raw: string, timestamp: string, signature: string, secret: string) {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/../g)!, s => parseInt(s, 16));
  return crypto.subtle.verify('HMAC', await hmacKey(secret, ['verify']), bytes, encoder.encode(`${timestamp}.${raw}`));
}
