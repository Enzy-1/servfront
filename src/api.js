const configuredApi = import.meta.env.VITE_API_URL;
if (import.meta.env.PROD && !configuredApi) {
  throw new Error('Configura VITE_API_URL con la URL del backend antes de compilar para producción');
}

export const API = (configuredApi || '/api').replace(/\/+$/, '');

export function getToken() {
  return localStorage.getItem('servtec_token');
}

export function setSession(token, user) {
  localStorage.setItem('servtec_token', token);
  localStorage.setItem('servtec_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('servtec_token');
  localStorage.removeItem('servtec_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('servtec_user') || 'null');
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const { responseType, ...requestOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(requestOptions.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...requestOptions, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || 'Error de servidor');
    err.status = res.status;
    throw err;
  }
  return responseType === 'blob' ? res.blob() : res.json().catch(() => ({}));
}
