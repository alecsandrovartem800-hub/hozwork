import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/smart — get all smart features
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('smart_features').select('*').order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/smart/:key — toggle a feature
router.patch('/:key', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { is_enabled, config: cfg } = req.body;
    const updateData: any = {};
    if (typeof is_enabled === 'boolean') updateData.is_enabled = is_enabled;
    if (cfg) updateData.config = cfg;

    const { data, error } = await db
      .from('smart_features')
      .update(updateData)
      .eq('feature_key', req.params.key)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
