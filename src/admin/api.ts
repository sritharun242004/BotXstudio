import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";

const BASE = "/api/admin";

export const adminApi = {
  getDashboard: () => apiGet(`${BASE}/dashboard`),
  getUsers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiGet(`${BASE}/users${qs}`);
  },
  addAdmin: (email: string, permissions: Record<string, boolean>) =>
    apiPost(`${BASE}/users/add-admin`, { email, permissions }),
  updatePermissions: (userId: string, permissions: Record<string, boolean>) =>
    apiPatch(`${BASE}/users/update-permissions`, { userId, permissions }),
  deleteUser: (id: string) => apiDelete(`${BASE}/users/${id}`),

  getApiLogs: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiGet(`${BASE}/api-logs${qs}`);
  },
  getSystemLogs: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiGet(`${BASE}/system-logs${qs}`);
  },
  getCosts: () => apiGet(`${BASE}/costs`),

  getApiKey: () => apiGet(`${BASE}/api-key`),
  setApiKey: (apiKey: string) => apiPost(`${BASE}/api-key`, { apiKey }),
  testApiKey: () => apiPost(`${BASE}/api-key/test`),

  getTemplates: (category?: string) => {
    const qs = category ? `?category=${category}` : "";
    return apiGet(`${BASE}/templates${qs}`);
  },
  createTemplate: (data: {
    title: string;
    category: string;
    base64Data: string;
    filename: string;
    mimeType: string;
    metadata?: Record<string, string>;
  }) => apiPost(`${BASE}/templates`, data),
  deleteTemplate: (id: string) => apiDelete(`${BASE}/templates/${id}`),

  getDisabledTemplates: () => apiGet(`${BASE}/templates/static/disabled`),
  disableStaticTemplate: (templateId: string, category: string) =>
    apiPost(`${BASE}/templates/static/disable`, { templateId, category }),
  enableStaticTemplate: (templateId: string) =>
    apiDelete(`${BASE}/templates/static/disable/${encodeURIComponent(templateId)}`),

  getImageControl: () => apiGet(`${BASE}/image-control`),
  updateImageControl: (settings: Record<string, string>) => apiPatch(`${BASE}/image-control`, settings),

  getModerationImages: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiGet(`${BASE}/moderation/images${qs}`);
  },
  removeModerationImage: (id: string) => apiDelete(`${BASE}/moderation/images/${id}`),

  getSettings: () => apiGet(`${BASE}/settings`),
  updateSettings: (settings: Record<string, string>) => apiPatch(`${BASE}/settings`, settings),
};
