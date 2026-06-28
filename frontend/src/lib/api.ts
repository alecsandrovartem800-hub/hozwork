const API_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

async function request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

export const api = {
  // Orders
  getOrders: (status?: string) =>
    request<{ orders: any[]; count: number }>(`/api/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id: string) => request<any>(`/api/orders/${id}`),
  createOrder: (data: any, token?: string) =>
    request<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }, token),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  setOrderPrice: (id: string, price_tier: number) =>
    request<any>(`/api/orders/${id}/price`, { method: 'PATCH', body: JSON.stringify({ price_tier }) }),
  getQueue: () => request<any>('/api/orders/queue'),

  // Tobacco
  getBrands: () => request<any[]>('/api/tobacco/brands'),
  getFlavors: (all?: boolean) =>
    request<any[]>(`/api/tobacco/flavors${all ? '?all=true' : ''}`),
  getFlavorsByBrand: () => request<any[]>('/api/tobacco/flavors/by-brand'),
  addStock: (flavorId: number, grams: number) =>
    request<any>(`/api/tobacco/flavors/${flavorId}/add-stock`, {
      method: 'POST', body: JSON.stringify({ grams }),
    }),
  updateFlavor: (id: number, data: any) =>
    request<any>(`/api/tobacco/flavors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Restock
  getRestockRequests: (status?: string) =>
    request<any[]>(`/api/restock${status ? `?status=${status}` : ''}`),
  fulfillRestock: (id: number, grams?: number) =>
    request<any>(`/api/restock/${id}/fulfill`, { method: 'POST', body: JSON.stringify({ grams }) }),
  dismissRestock: (id: number) =>
    request<any>(`/api/restock/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'dismissed' }) }),

  // Masters
  getMasters: () => request<any[]>('/api/masters'),
  createMaster: (name: string) =>
    request<any>('/api/masters', { method: 'POST', body: JSON.stringify({ name }) }),
  updateMaster: (id: string, data: any) =>
    request<any>(`/api/masters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => request<any>('/api/dashboard'),
  getClients: () => request<any[]>('/api/dashboard/clients'),
  setClientPrice: (id: string, personal_price: number) =>
    request<any>(`/api/dashboard/clients/${id}/price`, {
      method: 'PATCH', body: JSON.stringify({ personal_price }),
    }),

  // Atmosphere
  getAtmosphere: () => request<any[]>('/api/atmosphere'),
  updateAtmosphere: (key: string, value: string) =>
    request<any>(`/api/atmosphere/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),

  // Smart Features
  getSmartFeatures: () => request<any[]>('/api/smart'),
  toggleFeature: (key: string, is_enabled: boolean) =>
    request<any>(`/api/smart/${key}`, { method: 'PATCH', body: JSON.stringify({ is_enabled }) }),
  updateFeatureConfig: (key: string, config: any) =>
    request<any>(`/api/smart/${key}`, { method: 'PATCH', body: JSON.stringify({ config }) }),

  // Liquids
  getLiquids: () => request<any[]>('/api/liquids'),

  // Users Auth & Profile (Express proxy API)
  getCurrentUser: (token: string) => request<any>('/api/users/me', { method: 'GET' }, token),
  getUserOrders: (token: string) => request<any[]>('/api/users/me/orders', { method: 'GET' }, token),
  getUserMixes: (token: string) => request<any[]>('/api/users/me/mixes', { method: 'GET' }, token),
  saveUserMix: (token: string, data: any) =>
    request<any>('/api/users/me/mixes', { method: 'POST', body: JSON.stringify(data) }, token),
  deleteUserMix: (token: string, id: number) =>
    request<any>(`/api/users/me/mixes/${id}`, { method: 'DELETE' }, token),

  // AI Mixologist
  generateAiMix: () => request<any>('/api/ai/mix', { method: 'GET' }),
};
