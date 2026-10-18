// apps/buyer-web/src/api.ts
export const API_BASE = 'https://wholesale-api.dnjstjqppk.workers.dev/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('wholesale_buyer_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWJ1eWVyLTAwMSIsImVtYWlsIjoiYnV5ZXJAd2hvbGVzYWxlLmludGVybmFsIiwib3JnX2lkIjoiMjIyMjIyMjItMjIyMi0yMjIyLTIyMjItMjIyMjIyMjIyMjIyIiwicm9sZSI6IkJVWUVSX1BVUkNIQVNFUiIsImlhdCI6MTc5MjMzNTA4OSwiZXhwIjoxODIzODcxMDg5fQ.iV-2rOmZUoqVkQQEEzAIq3H3Jh8wDATw-uwQ0paFydM';
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

