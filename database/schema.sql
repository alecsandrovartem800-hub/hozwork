-- ============================================
-- SPORT LOUNGE — Database Schema
-- Autonomous Hookah Lounge Management System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL DEFAULT '',
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'master', 'client')),
    personal_price INTEGER NOT NULL DEFAULT 750 CHECK (personal_price IN (500, 750, 1000)),
    telegram_chat_id BIGINT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. MASTERS (hookah masters)
-- ============================================
CREATE TABLE IF NOT EXISTS public.masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- keeps compatibility with existing queries using profile_id
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('free', 'busy', 'offline')),
    current_order_id UUID,
    completed_today INTEGER NOT NULL DEFAULT 0,
    total_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. TOBACCO BRANDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tobacco_brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    country TEXT,
    logo_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. TOBACCO FLAVORS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tobacco_flavors (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES public.tobacco_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'fruity' CHECK (category IN ('fruity', 'berry', 'citrus', 'mint', 'spicy', 'sweet', 'floral', 'exotic', 'classic')),
    stock_grams NUMERIC(10,1) NOT NULL DEFAULT 0,
    min_threshold_grams NUMERIC(10,1) NOT NULL DEFAULT 100,
    price_per_gram NUMERIC(6,2) NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(brand_id, name)
);

-- ============================================
-- 5. LIQUIDS (base liquids for hookah)
-- ============================================
CREATE TABLE IF NOT EXISTS public.liquids (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- 6. ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    guest_telegram_id BIGINT,
    table_number INTEGER,
    liquid_id INTEGER REFERENCES public.liquids(id),
    master_id UUID REFERENCES public.masters(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- ожидает назначения мастера
        'assigned',     -- мастер назначен
        'preparing',    -- мастер готовит
        'ready',        -- кальян готов
        'serving',      -- подан гостю
        'completed',    -- завершён
        'cancelled'     -- отменён
    )),
    price_tier INTEGER NOT NULL DEFAULT 750 CHECK (price_tier IN (500, 750, 1000)),
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,
    telegram_message_id BIGINT,
    auto_cancel_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- 7. ORDER ITEMS (mix components)
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    flavor_id INTEGER NOT NULL REFERENCES public.tobacco_flavors(id),
    grams NUMERIC(6,1) NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. RESTOCK REQUESTS (auto-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS public.restock_requests (
    id SERIAL PRIMARY KEY,
    flavor_id INTEGER NOT NULL REFERENCES public.tobacco_flavors(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    flavor_name TEXT NOT NULL,
    current_stock_grams NUMERIC(10,1) NOT NULL,
    threshold_grams NUMERIC(10,1) NOT NULL,
    requested_grams NUMERIC(10,1) NOT NULL DEFAULT 500,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'fulfilled', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fulfilled_at TIMESTAMPTZ
);

-- ============================================
-- 9. ATMOSPHERE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.atmosphere_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type TEXT NOT NULL DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'color', 'select')),
    label TEXT NOT NULL,
    description TEXT,
    options JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 10. SMART FEATURES (toggles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.smart_features (
    id SERIAL PRIMARY KEY,
    feature_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 11. SUPPORT CHATS
-- ============================================
CREATE TABLE IF NOT EXISTS public.support_messages (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_text TEXT NOT NULL,
    is_master_call BOOLEAN NOT NULL DEFAULT false,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 12. KPI SNAPSHOTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_orders INTEGER NOT NULL DEFAULT 0,
    completed_orders INTEGER NOT NULL DEFAULT 0,
    cancelled_orders INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
    avg_preparation_minutes NUMERIC(6,1) NOT NULL DEFAULT 0,
    unique_guests INTEGER NOT NULL DEFAULT 0,
    top_flavor_id INTEGER REFERENCES public.tobacco_flavors(id),
    top_flavor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(snapshot_date)
);

-- ============================================
-- 13. USER SAVED MIXES (favourite mixes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_mixes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_mix_items (
    id SERIAL PRIMARY KEY,
    mix_id INTEGER NOT NULL REFERENCES public.user_mixes(id) ON DELETE CASCADE,
    flavor_id INTEGER NOT NULL REFERENCES public.tobacco_flavors(id) ON DELETE CASCADE,
    grams NUMERIC(6,1) NOT NULL DEFAULT 10
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON public.users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_masters_status ON public.masters(status);
CREATE INDEX IF NOT EXISTS idx_tobacco_flavors_brand ON public.tobacco_flavors(brand_id);
CREATE INDEX IF NOT EXISTS idx_tobacco_flavors_visible ON public.tobacco_flavors(is_visible);
CREATE INDEX IF NOT EXISTS idx_tobacco_flavors_stock ON public.tobacco_flavors(stock_grams);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_master ON public.orders(master_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restock_status ON public.restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_telegram ON public.support_messages(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_date ON public.kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_mixes_user ON public.user_mixes(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_tobacco_flavors_updated_at
    BEFORE UPDATE ON public.tobacco_flavors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_atmosphere_updated_at
    BEFORE UPDATE ON public.atmosphere_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_smart_features_updated_at
    BEFORE UPDATE ON public.smart_features
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on user signup (updated to users table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar, role, personal_price)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        'client',
        750
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-hide flavors when stock reaches 0
CREATE OR REPLACE FUNCTION public.auto_hide_empty_flavors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_grams <= 0 THEN
        NEW.is_visible = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_hide_flavors
    BEFORE UPDATE OF stock_grams ON public.tobacco_flavors
    FOR EACH ROW EXECUTE FUNCTION public.auto_hide_empty_flavors();

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restock_requests;
