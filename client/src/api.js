const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const TOKEN_KEY = 'agriinsight_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* localStorage tidak tersedia */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage tidak tersedia */
  }
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Tidak dapat menghubungi server. Periksa koneksi Anda.');
  }

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const error = new Error(body?.error || `Permintaan gagal (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return body;
}

export const api = {
  health: () => request('/health'),

  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  changePassword: (data) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  listPlans: async () => (await request('/plans')).data || [],
  createPlan: async (data) =>
    (await request('/plans', { method: 'POST', body: JSON.stringify(data) })).data,
  updatePlan: async (id, data) =>
    (await request('/plans', { method: 'PATCH', body: JSON.stringify({ id, ...data }) })).data,
  deletePlan: async (id) => request(`/plans?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  summary: async () => (await request('/summary')).data,
};
