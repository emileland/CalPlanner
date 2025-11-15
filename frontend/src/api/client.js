import { useAuthStore } from '../store/authStore.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const buildHeaders = (hasBody, customHeaders = {}) => {
  const headers = { ...customHeaders };
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = useAuthStore.getState().token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const request = async (path, { method = 'GET', body, headers, ...rest } = {}) => {
  const hasBody = body !== undefined && body !== null;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(hasBody, headers),
      body: hasBody ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch (error) {
    throw new Error('Serveur injoignable');
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = payload?.error || 'Une erreur est survenue';
    throw new Error(errorMessage);
  }

  return payload;
};

export const authApi = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: credentials,
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: payload,
    }),
  me: () => request('/users/me'),
};

export const projectApi = {
  list: () => request('/projects'),
  create: (payload) =>
    request('/projects', {
      method: 'POST',
      body: payload,
    }),
  getById: (projectId) => request(`/projects/${projectId}`),
  update: (projectId, payload) =>
    request(`/projects/${projectId}`, {
      method: 'PUT',
      body: payload,
    }),
  regenerateIcsToken: (projectId) =>
    request(`/projects/${projectId}/ics/token`, {
      method: 'POST',
    }),
  exportIcs: async (projectId) => {
    const response = await fetch(`${API_BASE}/projects/${projectId}/ics`, {
      headers: buildHeaders(false),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error || 'Impossible de générer le fichier ICS';
      throw new Error(message);
    }
    return response.blob();
  },
  listEvents: (projectId, { viewStart, viewEnd } = {}) => {
    const params = new URLSearchParams();
    if (viewStart) {
      params.append('viewStart', viewStart);
    }
    if (viewEnd) {
      params.append('viewEnd', viewEnd);
    }
    const suffix = params.toString();
    return request(`/projects/${projectId}/events${suffix ? `?${suffix}` : ''}`);
  },
};

export const calendarApi = {
  list: (projectId) => request(`/projects/${projectId}/calendars`),
  create: (projectId, payload) =>
    request(`/projects/${projectId}/calendars`, {
      method: 'POST',
      body: payload,
    }),
  update: (projectId, calendarId, payload) =>
    request(`/projects/${projectId}/calendars/${calendarId}`, {
      method: 'PATCH',
      body: payload,
    }),
  remove: (projectId, calendarId) =>
    request(`/projects/${projectId}/calendars/${calendarId}`, {
      method: 'DELETE',
    }),
  sync: (projectId, calendarId) =>
    request(`/projects/${projectId}/calendars/${calendarId}/sync`, {
      method: 'POST',
    }),
};

export const moduleApi = {
  list: (projectId, calendarId) =>
    request(`/projects/${projectId}/calendars/${calendarId}/modules`),
  setAll: (projectId, calendarId, isSelected) =>
    request(`/projects/${projectId}/calendars/${calendarId}/modules`, {
      method: 'PATCH',
      body: { isSelected },
    }),
  toggle: (projectId, calendarId, moduleId, isSelected) =>
    request(`/projects/${projectId}/calendars/${calendarId}/modules/${moduleId}`, {
      method: 'PATCH',
      body: { isSelected },
    }),
};

export default request;
