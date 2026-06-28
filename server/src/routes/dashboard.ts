import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/dashboard — KPI data
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Today's orders
    const { count: todayOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`);

    const { count: completedToday } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`);

    const { count: cancelledToday } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('created_at', `${today}T00:00:00`);

    // Active orders
    const { count: activeOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'assigned', 'preparing', 'ready', 'serving']);

    // Today's revenue
    const { data: revenueData } = await db
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`);

    const todayRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

    // Masters
    const { data: masters } = await db.from('masters').select('*');
    const freeMasters = (masters || []).filter((m: any) => m.status === 'free').length;
    const busyMasters = (masters || []).filter((m: any) => m.status === 'busy').length;

    // Low stock flavors
    const { data: lowStock } = await db
      .from('tobacco_flavors')
      .select('id, name, stock_grams, min_threshold_grams, brand:tobacco_brands(name)')
      .lt('stock_grams', 100);

    // Pending restock requests
    const { count: pendingRestocks } = await db
      .from('restock_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Recent orders
    const { data: recentOrders } = await db
      .from('orders')
      .select(`
        *,
        liquid:liquids(name, icon),
        master:masters(name),
        items:order_items(id, grams, flavor:tobacco_flavors(name, brand:tobacco_brands(name)))
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Top flavors today
    const { data: topFlavorsData } = await db
      .from('order_items')
      .select('flavor_id, grams, flavor:tobacco_flavors(name, brand:tobacco_brands(name)), order:orders!inner(created_at, status)')
      .gte('order.created_at', `${today}T00:00:00`)
      .eq('order.status', 'completed');

    // KPI history (last 7 days)
    const { data: kpiHistory } = await db
      .from('kpi_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(7);

    res.json({
      today: {
        orders: todayOrders || 0,
        completed: completedToday || 0,
        cancelled: cancelledToday || 0,
        revenue: todayRevenue,
        active: activeOrders || 0,
      },
      masters: {
        total: (masters || []).length,
        free: freeMasters,
        busy: busyMasters,
        list: masters || [],
      },
      tobacco: {
        lowStock: lowStock || [],
        pendingRestocks: pendingRestocks || 0,
      },
      recentOrders: recentOrders || [],
      kpiHistory: kpiHistory || [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dashboard/clients
router.get('/clients', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('total_orders', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/dashboard/clients/:id/price — set client price tier
router.patch('/clients/:id/price', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { price_tier } = req.body;
    if (![500, 750, 1000].includes(price_tier)) {
      return res.status(400).json({ error: 'Invalid price tier' });
    }
    const { data, error } = await db
      .from('profiles')
      .update({ price_tier })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
