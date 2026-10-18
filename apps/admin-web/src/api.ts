// apps/admin-web/src/api.ts
export const API_BASE = 'https://wholesale-api.dnjstjqppk.workers.dev/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('wholesale_admin_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5Ad2hvbGVzYWxlLmludGVybmFsIiwib3JnX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwicm9sZSI6IlBMQVRGT1JNX0FETUlOIiwiaWF0IjoxNzkyMzM1MDg5LCJleHAiOjE4MjM4NzEwODl9.NHleIkXGqAddcxnci8eTz1MabUZ9sYBWGLj--isxUzk';
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
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

