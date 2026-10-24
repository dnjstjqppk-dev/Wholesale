// apps/admin-web/src/api.ts
// Dynamic Authentication Session & API Client for Admin Web Console (Platform Operations)

export const API_BASE = 'https://wholesale-api.dnjstjqppk.workers.dev/v1';

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: {
    id: string;
    legal_name: string;
    business_number?: string;
    country?: string;
    is_verified_supplier?: boolean;
  };
}

export function getAuthToken(): string | null {
  return localStorage.getItem('wholesale_admin_token');
}

export function setAuthSession(token: string, user: UserSession): void {
  localStorage.setItem('wholesale_admin_token', token);
  localStorage.setItem('wholesale_admin_user', JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem('wholesale_admin_token');
  localStorage.removeItem('wholesale_admin_user');
}

export function getCurrentUser(): UserSession {
  const stored = localStorage.getItem('wholesale_admin_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return {
    id: 'user-admin-001',
    email: 'admin@wholesale.internal',
    full_name: 'Super Platform Administrator',
    role: 'PLATFORM_ADMIN',
    organization: {
      id: '00000000-0000-0000-0000-000000000000',
      legal_name: 'WHOLESALE Platform Governance Corp.',
      business_number: '000-00-00000',
      country: 'KR',
    },
  };
}

export async function loginUser(email: string, password: string): Promise<UserSession> {
  const res = await apiRequest<{ access_token: string; user: any; organization: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const session: UserSession = {
    ...res.user,
    organization: res.organization,
  };
  setAuthSession(res.access_token, session);
  return session;
}

export async function switchAdminUser(email: 'admin@wholesale.internal' | 'finance@wholesale.internal'): Promise<UserSession> {
  clearAuthSession();
  const res = await apiRequest<{ access_token: string; user: any; organization: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'Password123!',
    }),
  });
  const session: UserSession = {
    ...res.user,
    organization: res.organization,
  };
  setAuthSession(res.access_token, session);
  return session;
}

export async function ensureActiveSession(): Promise<string> {
  let token = getAuthToken();
  if (!token) {
    const res = await apiRequest<{ access_token: string; user: any; organization: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@wholesale.internal',
        password: 'Password123!',
      }),
    });
    setAuthSession(res.access_token, {
      ...res.user,
      organization: res.organization,
    });
    token = res.access_token;
  }
  return token;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getAuthToken();
  if (!token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    try {
      token = await ensureActiveSession();
    } catch (e) {
      console.warn('Session init warning:', e);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = data?.detail || data?.title || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }
  return data as T;
}
