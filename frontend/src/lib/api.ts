import { Product, Order, OrderStatus } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function fetchBackend(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Произошла ошибка при запросе к серверу';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  // Для PDF-файлов или других бинарных ответов
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  products: {
    list: async (params: { category?: string; search?: string; sort?: string; page?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.search) query.set('search', params.search);
      if (params.sort) query.set('sort', params.sort);
      if (params.page) query.set('page', params.page.toString());
      return fetchBackend(`/api/v1/products/?${query.toString()}`);
    },
    get: async (id: string): Promise<Product> => {
      return fetchBackend(`/api/v1/products/${id}`);
    },
    create: async (data: Partial<Product>, token: string): Promise<Product> => {
      return fetchBackend('/api/v1/products/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Product>, token: string): Promise<Product> => {
      return fetchBackend(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string, token: string): Promise<{ message: string }> => {
      return fetchBackend(`/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
  orders: {
    create: async (
      data: {
        items: { product_id: string; quantity: number }[];
        delivery_address: string;
        phone: string;
        comment: string;
      },
      token: string
    ): Promise<Order> => {
      return fetchBackend('/api/v1/orders/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
    },
    list: async (token: string): Promise<{ total: number; page: number; size: number; items: Order[] }> => {
      return fetchBackend('/api/v1/orders/', {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    get: async (id: string, token: string): Promise<Order> => {
      return fetchBackend(`/api/v1/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    updateStatus: async (id: string, status: OrderStatus, token: string): Promise<Order> => {
      return fetchBackend(`/api/v1/orders/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
    },
  },
  recommendations: {
    get: async (productId: string): Promise<Product[]> => {
      return fetchBackend(`/api/v1/recommendations/${productId}`);
    },
    getGraph: async (productId: string): Promise<Product[]> => {
      return fetchBackend(`/api/v1/recommendations/graph/${productId}`);
    },
  },
  analytics: {
    dashboard: async (token: string) => {
      return fetchBackend('/api/v1/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    sales: async (days: number, token: string) => {
      return fetchBackend(`/api/v1/analytics/sales?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
  reports: {
    invoice: async (orderId: string, token: string): Promise<Blob> => {
      return fetchBackend(`/api/v1/reports/invoice/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    seo: async (productId: string, token: string) => {
      return fetchBackend(`/api/v1/reports/seo/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
};
