// apps/partner-web/src/api.ts
export const API_BASE = 'https://wholesale-api.dnjstjqppk.workers.dev/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('wholesale_partner_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXN1cHBsaWVyLTAwMSIsImVtYWlsIjoic3VwcGxpZXJAd2hvbGVzYWxlLmludGVybmFsIiwib3JnX2lkIjoiMTExMTExMTEtMTExMS0xMTExLTExMTEtMTExMTExMTExMTExIiwicm9sZSI6IlNVUFBMSUVSX1NBTEVTIiwiaWF0IjoxNzkyMzM1MDg5LCJleHAiOjE4MjM4NzEwODl9.16kLdOlLaYFxwYUQ8iclSlLF6GpijvZkp2x9s12KB-w';
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

