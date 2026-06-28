import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/liquids
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('liquids')
      .select('*')
      .eq('is_available', true)
      .order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
