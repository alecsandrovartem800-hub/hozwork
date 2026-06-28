import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';
import { fulfillRestock } from '../services/tobaccoManager';

const router = Router();

// GET /api/restock — list restock requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { status } = req.query;

    let query = db
      .from('restock_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/restock/:id/fulfill — fulfill restock (add to stock + close request)
router.post('/:id/fulfill', async (req: Request, res: Response) => {
  try {
    const { grams } = req.body;
    const result = await fulfillRestock(parseInt(req.params.id), grams);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/restock/:id — update request status (dismiss, etc.)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { status } = req.body;
    const { data, error } = await db
      .from('restock_requests')
      .update({ status })
      .eq('id', parseInt(req.params.id))
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
