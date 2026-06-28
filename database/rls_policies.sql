-- ============================================
-- SPORT LOUNGE — Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tobacco_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tobacco_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atmosphere_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mix_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS
-- ============================================
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
    ON public.users FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Service role full access users"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- MASTERS
-- ============================================
CREATE POLICY "Anyone can view masters"
    ON public.masters FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage masters"
    ON public.masters FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access masters"
    ON public.masters FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- TOBACCO BRANDS
-- ============================================
CREATE POLICY "Anyone can view active brands"
    ON public.tobacco_brands FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can view all brands"
    ON public.tobacco_brands FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage brands"
    ON public.tobacco_brands FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access brands"
    ON public.tobacco_brands FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- TOBACCO FLAVORS
-- ============================================
CREATE POLICY "Anyone can view visible flavors"
    ON public.tobacco_flavors FOR SELECT
    USING (is_visible = true);

CREATE POLICY "Admins can view all flavors"
    ON public.tobacco_flavors FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage flavors"
    ON public.tobacco_flavors FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access flavors"
    ON public.tobacco_flavors FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- LIQUIDS
-- ============================================
CREATE POLICY "Anyone can view available liquids"
    ON public.liquids FOR SELECT
    USING (is_available = true);

CREATE POLICY "Admins can manage liquids"
    ON public.liquids FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access liquids"
    ON public.liquids FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- ORDERS
-- ============================================
CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL); -- Allow viewing if it is guest order or own order

CREATE POLICY "Admins can manage all orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access orders"
    ON public.orders FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE POLICY "Anyone can view order items"
    ON public.order_items FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access order_items"
    ON public.order_items FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- RESTOCK REQUESTS
-- ============================================
CREATE POLICY "Admins can view restock requests"
    ON public.restock_requests FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage restock requests"
    ON public.restock_requests FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access restock"
    ON public.restock_requests FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- ATMOSPHERE SETTINGS
-- ============================================
CREATE POLICY "Anyone can view atmosphere"
    ON public.atmosphere_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage atmosphere"
    ON public.atmosphere_settings FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access atmosphere"
    ON public.atmosphere_settings FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SMART FEATURES
-- ============================================
CREATE POLICY "Anyone can view smart features"
    ON public.smart_features FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage smart features"
    ON public.smart_features FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access smart"
    ON public.smart_features FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SUPPORT MESSAGES
-- ============================================
CREATE POLICY "Admins can view support messages"
    ON public.support_messages FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can manage support messages"
    ON public.support_messages FOR ALL
    USING (public.is_admin());

CREATE POLICY "Service role full access support"
    ON public.support_messages FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- KPI SNAPSHOTS
-- ============================================
CREATE POLICY "Admins can view KPI"
    ON public.kpi_snapshots FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Service role full access kpi"
    ON public.kpi_snapshots FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- USER SAVED MIXES
-- ============================================
CREATE POLICY "Users can manage own mixes"
    ON public.user_mixes FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user mixes"
    ON public.user_mixes FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Service role full access user_mixes"
    ON public.user_mixes FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can manage own mix items"
    ON public.user_mix_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_mixes
            WHERE id = mix_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access user_mix_items"
    ON public.user_mix_items FOR ALL
    USING (auth.role() = 'service_role');
