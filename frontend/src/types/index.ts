export interface TobaccoBrand {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface TobaccoFlavor {
  id: number;
  brand_id: number;
  name: string;
  description?: string;
  category: string;
  stock_grams: number;
  min_threshold_grams: number;
  is_visible: boolean;
  image_url?: string;
  brand?: TobaccoBrand;
}

export interface BrandWithFlavors extends TobaccoBrand {
  flavors: TobaccoFlavor[];
}

export interface Liquid {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_available: boolean;
  sort_order: number;
}

export interface Master {
  id: string;
  name: string;
  status: 'free' | 'busy' | 'offline';
  current_order_id?: string;
  completed_today: number;
  total_completed: number;
}

export interface OrderItem {
  id: number;
  order_id: string;
  flavor_id: number;
  grams: number;
  flavor?: {
    name: string;
    brand?: { name: string };
  };
}

export interface Order {
  id: string;
  guest_name: string;
  guest_phone?: string;
  guest_telegram_id?: number;
  table_number?: number;
  liquid_id?: number;
  master_id?: string;
  status: 'pending' | 'assigned' | 'preparing' | 'ready' | 'serving' | 'completed' | 'cancelled';
  price_tier: number;
  total_price: number;
  notes?: string;
  queue_position?: number;
  estimated_wait_minutes?: number;
  telegram_message_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  liquid?: { name: string; icon?: string };
  master?: { name: string; status: string };
  items?: OrderItem[];
}

export interface RestockRequest {
  id: number;
  flavor_id: number;
  brand_name: string;
  flavor_name: string;
  current_stock_grams: number;
  threshold_grams: number;
  requested_grams: number;
  status: 'pending' | 'ordered' | 'fulfilled' | 'dismissed';
  created_at: string;
  fulfilled_at?: string;
}

export interface AtmosphereSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'number' | 'boolean' | 'color' | 'select';
  label: string;
  description?: string;
  options?: any;
  sort_order: number;
}

export interface SmartFeature {
  id: number;
  feature_key: string;
  label: string;
  description?: string;
  is_enabled: boolean;
  config: Record<string, any>;
  sort_order: number;
}

export interface QueueInfo {
  pending: any[];
  pendingCount: number;
  activeCount: number;
}

export interface DashboardData {
  today: {
    orders: number;
    completed: number;
    cancelled: number;
    revenue: number;
    active: number;
  };
  masters: {
    total: number;
    free: number;
    busy: number;
    list: Master[];
  };
  tobacco: {
    lowStock: TobaccoFlavor[];
    pendingRestocks: number;
  };
  recentOrders: Order[];
  kpiHistory: any[];
}

export interface ClientProfile {
  id: string;
  full_name: string;
  phone?: string;
  role: string;
  price_tier: number;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  assigned: 'Мастер назначен',
  preparing: 'Готовится',
  ready: 'Готов',
  serving: 'Подан',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const STATUS_EMOJI: Record<string, string> = {
  pending: '🟡',
  assigned: '🔵',
  preparing: '🟠',
  ready: '🟢',
  serving: '✨',
  completed: '✅',
  cancelled: '❌',
};

export const CATEGORY_LABELS: Record<string, string> = {
  fruity: 'Фруктовый',
  berry: 'Ягодный',
  citrus: 'Цитрусовый',
  mint: 'Мятный',
  spicy: 'Пряный',
  sweet: 'Сладкий',
  floral: 'Цветочный',
  exotic: 'Экзотический',
  classic: 'Классический',
};
