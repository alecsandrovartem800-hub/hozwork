-- ============================================
-- HOZWORK — Полная схема базы данных
-- Supabase PostgreSQL
-- ============================================

-- Таблица профилей пользователей (расширение auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price > 0),
  deposit_percent int NOT NULL DEFAULT 30 CHECK (deposit_percent BETWEEN 1 AND 100),
  category text NOT NULL,
  sku text UNIQUE,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  total_deposit numeric NOT NULL CHECK (total_deposit > 0),
  status text DEFAULT 'awaiting_fulfillment' 
    CHECK (status IN ('awaiting_fulfillment', 'shipped', 'completed')),
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  customer_email text
);

-- Таблица позиций заказа
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products NOT NULL,
  product_name text NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  price_at_time numeric NOT NULL CHECK (price_at_time > 0),
  deposit_percent_at_time int NOT NULL DEFAULT 30
);

-- Таблица залогов (транзакции оплаты)
CREATE TABLE IF NOT EXISTS public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_provider_id text,
  status text DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Таблица сообщений чата
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users NOT NULL,
  sender_role text DEFAULT 'client' CHECK (sender_role IN ('client', 'admin')),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Таблица событий аналитики
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'page_view', 'add_to_cart', 'checkout', 'deposit_paid'
  user_id uuid REFERENCES auth.users,
  product_id uuid REFERENCES public.products,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Таблица A/B тестов
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  variant text NOT NULL, -- 'A' или 'B'
  converted boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Индексы для производительности
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- ============================================
-- Функция для автоматического создания профиля при регистрации
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер: автоматическое создание профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Включение Realtime для таблицы сообщений
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
