import { users, organizations, buyerProfiles, logAudit } from './store';
import { check, hashPassword, verifyPassword, signJwt, requireAuth, requireRole } from './security';
import { jsonResponse } from './response';

export function profileFor(ctx: { user: any; org: any }) {
  let profile = buyerProfiles.get(ctx.org.id);
  if (!profile) {
    profile = { organization_id: ctx.org.id, legal_name: ctx.org.legal_name, business_number: ctx.org.business_number || '', ein_vat: '', contact_person: ctx.user.full_name, contact_email: ctx.user.email, contact_phone: '', annual_purchasing_volume_usd: 0, primary_industry: '', tax_exemption_status: 'NOT_APPLIED', addresses: [], sub_accounts: [] } as any;
    buyerProfiles.set(ctx.org.id, profile!);
  }
  return profile!;
}
async function session(user: any, request: Request, status = 200) {
  const org = organizations.get(user.active_organization_id);
  const token = await signJwt({ sub: user.id, org_id: org.id, role: user.role }, request);
  return jsonResponse({ access_token: token, token_type: 'Bearer', expires_in: 3600, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, organization: org }, status);
}
export async function handleAuth(request: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;
  if (!path.startsWith('/v1/auth/')) return null;
  if (request.method === 'POST' && (path === '/v1/auth/login' || path === '/v1/auth/register')) {
    const body: any = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && typeof body.password === 'string', 400, 'INVALID_CREDENTIALS', '유효한 이메일과 비밀번호를 입력하세요.');
    if (path.endsWith('/login')) {
      const user = users.get(email);
      check(user && user.status !== 'DISABLED' && await verifyPassword(body.password, user.password_hash), 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
      return session(user, request);
    }
    check(!users.has(email), 409, 'EMAIL_EXISTS', '이미 가입된 이메일입니다.');
    check(body.password.length >= 12 && body.password.length <= 256, 400, 'WEAK_PASSWORD', '비밀번호는 12~256자로 입력하세요.');
    check(typeof body.company_name === 'string' && body.company_name.trim(), 400, 'COMPANY_REQUIRED', '회사명을 입력하세요.');
    check(!body.role_capability || ['BUYER', 'BUYER_CORP', 'SUPPLIER'].includes(body.role_capability), 400, 'INVALID_ROLE', '구매사 또는 공급사로 가입하세요.');
    const org = { id: crypto.randomUUID(), legal_name: body.company_name.trim(), business_number: String(body.business_number || ''), country: String(body.country || 'KR'), business_type: body.role_capability === 'SUPPLIER' ? 'MANUFACTURER' : 'BUYER_CORP', is_verified_supplier: false };
    const user = { id: crypto.randomUUID(), email, password_hash: await hashPassword(body.password), full_name: String(body.full_name || email.split('@')[0]), active_organization_id: org.id, role: body.role_capability === 'SUPPLIER' ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER' };
    organizations.set(org.id, org);
    users.set(email, user);
    profileFor({ user, org });
    logAudit('ACCOUNT_REGISTERED', user.id, user.role, 'ORGANIZATION', org.id, 'Registered unverified organization');
    return session(user, request, 201);
  }
  const ctx = await requireAuth(request);
  if (path === '/v1/auth/me' && request.method === 'GET') {
    const { id, email, full_name, role } = ctx.user;
    return jsonResponse({ user: { id, email, full_name, role }, organization: ctx.org });
  }
  const profile = profileFor(ctx);
  if (path === '/v1/auth/profile') {
    if (request.method === 'GET') return jsonResponse(profile);
    if (request.method === 'PUT') {
      const body: any = await request.json();
      for (const key of ['legal_name', 'business_number', 'ein_vat', 'contact_person', 'contact_email', 'contact_phone', 'primary_industry']) {
        if (typeof body[key] === 'string') (profile as any)[key] = body[key].trim();
      }
      ctx.org.legal_name = profile.legal_name;
      ctx.org.business_number = profile.business_number;
      logAudit('PROFILE_UPDATED', ctx.user.id, ctx.user.role, 'ORGANIZATION', ctx.org.id, 'Corporate profile updated');
      return jsonResponse(profile);
    }
  }
  if (path === '/v1/auth/profile/addresses' && request.method === 'POST') {
    const body: any = await request.json();
    check(body.recipient_name && body.address_line1 && body.country && body.city, 400, 'ADDRESS_REQUIRED', '수령인, 국가, 도시, 주소를 입력하세요.');
    check(['SHIPPING', 'BILLING'].includes(body.type || 'SHIPPING'), 400, 'INVALID_ADDRESS_TYPE', 'Invalid address type');
    const address = { id: crypto.randomUUID(), type: body.type || 'SHIPPING', is_default: body.is_default === true, recipient_name: String(body.recipient_name), phone: String(body.phone || ''), country: String(body.country), address_line1: String(body.address_line1), address_line2: String(body.address_line2 || ''), city: String(body.city), state_province: String(body.state_province || ''), postal_code: String(body.postal_code || '') };
    if (address.is_default) profile.addresses.forEach(a => { if (a.type === address.type) a.is_default = false; });
    profile.addresses.push(address);
    return jsonResponse(address, 201);
  }
  const address = path.match(/^\/v1\/auth\/profile\/addresses\/([^/]+)$/);
  if (address && request.method === 'DELETE') {
    check(profile.addresses.some(a => a.id === address[1]), 404, 'NOT_FOUND', '주소를 찾을 수 없습니다.');
    profile.addresses = profile.addresses.filter(a => a.id !== address[1]);
    return jsonResponse({ success: true });
  }
  if (path === '/v1/auth/profile/sub-accounts' && request.method === 'POST') {
    requireRole(ctx, 'BUYER_APPROVER', 'PLATFORM_ADMIN');
    check(false, 501, 'INVITATION_PROVIDER_REQUIRED', '초대 메일 인증 연동 후 계정을 추가할 수 있습니다.');
  }
  check(false, 404, 'NOT_FOUND', '인증 경로를 찾을 수 없습니다.');
}
