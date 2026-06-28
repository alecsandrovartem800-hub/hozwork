import { Router, Request, Response } from 'express';
import { createOrder, updateOrderStatus, setOrderPrice, getOrderWithItems, getQueueInfo } from '../services/orderEngine';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/orders — list all orders (with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { status, limit = '50', offset = '0' } = req.query;

    let query = db
      .from('orders')
      .select(`
        *,
        liquid:liquids(name, icon),
        master:masters(name, status),
        items:order_items(
          id, grams,
          flavor:tobacco_flavors(name, brand:tobacco_brands(name))
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ orders: data, count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders/queue — get queue info
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const queue = await getQueueInfo();
    res.json(queue);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders/:id — get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await getOrderWithItems(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/orders — create new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, guest_name, guest_phone, guest_telegram_id, table_number, liquid_id, notes, items } = req.body;

    if (!guest_name) return res.status(400).json({ error: 'guest_name is required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'items are required' });

    const order = await createOrder({
      user_id,
      guest_name,
      guest_phone,
      guest_telegram_id,
      table_number,
      liquid_id,
      notes,
      items,
    });

    res.status(201).json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/orders/:id/status — update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const order = await updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/orders/:id/price — set price tier (admin)
router.patch('/:id/price', async (req: Request, res: Response) => {
  try {
    const { price_tier } = req.body;
    if (![500, 750, 1000].includes(price_tier)) {
      return res.status(400).json({ error: 'price_tier must be 500, 750, or 1000' });
    }

    const order = await setOrderPrice(req.params.id, price_tier);
    res.json(order);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
