import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/masters
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('masters').select('*').order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/masters
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await db.from('masters').insert({ name, status: 'free' }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/masters/:id — update status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { status, name } = req.body;
    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (status === 'offline') {
      updateData.current_order_id = null;
    }

    const { data, error } = await db.from('masters').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/masters/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { error } = await db.from('masters').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
