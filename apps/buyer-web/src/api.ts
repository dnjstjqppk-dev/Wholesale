// apps/buyer-web/src/api.ts
// Dynamic Authentication Session & API Client for Buyer Console

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
  return localStorage.getItem('wholesale_buyer_token');
}

export async function switchBuyerUser(email: 'buyer@wholesale.internal' | 'approver@wholesale.internal'): Promise<UserSession> {
  clearAuthSession();
  return loginUser(email, 'Password123!');
}

export function setAuthSession(token: string, user: UserSession): void {
  localStorage.setItem('wholesale_buyer_token', token);
  localStorage.setItem('wholesale_buyer_user', JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem('wholesale_buyer_token');
  localStorage.removeItem('wholesale_buyer_user');
}

export function getCurrentUser(): UserSession {
  const stored = localStorage.getItem('wholesale_buyer_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return {
    id: 'user-buyer-001',
    email: 'buyer@wholesale.internal',
    full_name: 'Metro Wholesale Purchaser',
    role: 'BUYER_PURCHASER',
    organization: {
      id: '22222222-2222-2222-2222-222222222222',
      legal_name: 'Metro Wholesale Imports LLC',
      business_number: '987-65-43210',
      country: 'US',
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

export async function ensureActiveSession(): Promise<string> {
  let token = getAuthToken();
  if (!token) {
    const res = await apiRequest<{ access_token: string; user: any; organization: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'buyer@wholesale.internal',
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
    // Proactively get token
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
