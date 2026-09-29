import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
});

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const codesApi = {
  list: (params) => api.get('/codes', { params }).then(r => r.data),
  listAdmin: (token, params) => api.get('/codes', { params, ...authHeader(token) }).then(r => r.data),
  get: (id) => api.get(`/codes/${id}`).then(r => r.data),
  submit: (data) => api.post('/codes/submit', data).then(r => r.data),
  create: (data, token) => api.post('/codes', data, authHeader(token)).then(r => r.data),
  update: (id, data, token) => api.put(`/codes/${id}`, data, authHeader(token)).then(r => r.data),
  remove: (id, token) => api.delete(`/codes/${id}`, authHeader(token)).then(r => r.data),
  report: (id) => api.patch(`/codes/${id}/report`).then(r => r.data),
  approve: (id, token) => api.patch(`/codes/${id}/approve`, {}, authHeader(token)).then(r => r.data),
};

export const weaponsApi = {
  list: (params) => api.get('/weapons', { params }).then(r => r.data),
  get: (slug) => api.get(`/weapons/${slug}`).then(r => r.data),
  create: (data, token) => api.post('/weapons', data, authHeader(token)).then(r => r.data),
  update: (id, data, token) => api.put(`/weapons/${id}`, data, authHeader(token)).then(r => r.data),
  remove: (id, token) => api.delete(`/weapons/${id}`, authHeader(token)).then(r => r.data),
  addLoadout: (id, data, token) => api.post(`/weapons/${id}/loadouts`, data, authHeader(token)).then(r => r.data),
};

export const tipsApi = {
  list: (params) => api.get('/tips', { params }).then(r => r.data),
  get: (slug) => api.get(`/tips/${slug}`).then(r => r.data),
  create: (data, token) => api.post('/tips', data, authHeader(token)).then(r => r.data),
  update: (id, data, token) => api.put(`/tips/${id}`, data, authHeader(token)).then(r => r.data),
  remove: (id, token) => api.delete(`/tips/${id}`, authHeader(token)).then(r => r.data),
};

export const settingsApi = {
  getSensitivity: (params) => api.get('/settings/sensitivity', { params }).then(r => r.data),
  getHud: (params) => api.get('/settings/hud', { params }).then(r => r.data),
  addSensitivity: (data, token) => api.post('/settings/sensitivity', data, authHeader(token)).then(r => r.data),
  addHud: (data, token) => api.post('/settings/hud', data, authHeader(token)).then(r => r.data),
  deleteSensitivity: (id, token) => api.delete(`/settings/sensitivity/${id}`, authHeader(token)).then(r => r.data),
  deleteHud: (id, token) => api.delete(`/settings/hud/${id}`, authHeader(token)).then(r => r.data),
};

export const searchApi = {
  search: (q) => api.get('/search', { params: { q } }).then(r => r.data),
};

export const profilesApi = {
  get: (uid) => api.get(`/profiles/${encodeURIComponent(uid)}`).then(r => r.data),
  save: (data) => api.post('/profiles', data).then(r => r.data),
  remove: (uid) => api.delete(`/profiles/${encodeURIComponent(uid)}`).then(r => r.data),
};

export const codmPlayerApi = {
  lookup: (uid) => api.get(`/codm-player/${encodeURIComponent(uid)}`).then(r => r.data),
};

export const tournamentsApi = {
  list: () => api.get('/tournaments').then(r => r.data),
  get: (id) => api.get(`/tournaments/${id}`).then(r => r.data),
  getMatches: (id) => api.get(`/tournaments/${id}/matches`).then(r => r.data),
  getStats: (id) => api.get(`/tournaments/${id}/stats`).then(r => r.data),
  reportMatch: (id, mid, data, token) => api.put(`/tournaments/${id}/matches/${mid}`, data, authHeader(token)).then(r => r.data),
  register: (id, data) => api.post(`/tournaments/${id}/register`, data).then(r => r.data),
  removeParticipant: (id, pid, token) => api.delete(`/tournaments/${id}/participants/${pid}`, authHeader(token)).then(r => r.data),
  create: (data, token) => api.post('/tournaments', data, authHeader(token)).then(r => r.data),
  start: (id, token) => api.post(`/tournaments/${id}/start`, {}, authHeader(token)).then(r => r.data),
  finalize: (id, token) => api.post(`/tournaments/${id}/finalize`, {}, authHeader(token)).then(r => r.data),
};

export default api;
