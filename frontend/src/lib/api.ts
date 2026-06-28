const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

// Orders
export const api = {
  // Orders
  getOrders: (status?: string) =>
    request<{ orders: any[]; count: number }>(`/api/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id: string) => request<any>(`/api/orders/${id}`),
  createOrder: (data: any) =>
    request<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
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
  setClientPrice: (id: string, price_tier: number) =>
    request<any>(`/api/dashboard/clients/${id}/price`, {
      method: 'PATCH', body: JSON.stringify({ price_tier }),
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
};
