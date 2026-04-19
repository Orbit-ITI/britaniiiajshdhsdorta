// ============================================================
// src/lib/api.ts — REST client
// ============================================================

const BASE = '';

export function getToken(): string | null {
  return localStorage.getItem('empire_token');
}
export function setToken(token: string): void {
  localStorage.setItem('empire_token', token);
}
export function clearToken(): void {
  localStorage.removeItem('empire_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = 'Ошибка сервера';
    try { message = (await res.json()).message; } catch {}
    throw new Error(message);
  }

  return res.json() as T;
}

export const api = {
  get:    <T>(path: string)                 => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)                 => request<T>('DELETE', path),
};
