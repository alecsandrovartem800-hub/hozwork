export type OrderStatus =
  | 'pending'
  | 'deposit_paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type UserRole = 'client' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  delivery_address?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  deposit_percent: number;
  is_active: boolean;
  sku: string;
  weight?: number;
  brand: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  email: string;
  status: OrderStatus;
  total_amount: number;
  deposit_amount: number;
  delivery_address: string;
  comment: string;
  phone: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface Deposit {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';
  payment_provider_id?: string;
  payment_method?: string;
  created_at: string;
}

export interface Message {
  id: string;
  order_id: string;
  user_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
}
