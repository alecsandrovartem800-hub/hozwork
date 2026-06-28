import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// GET /api/atmosphere — get all settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('atmosphere_settings')
      .select('*')
      .not('setting_key', 'eq', 'admin_telegram_chat_id')
      .order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/atmosphere/:key — update a setting
router.patch('/:key', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { value } = req.body;
    const { data, error } = await db
      .from('atmosphere_settings')
      .update({ setting_value: String(value) })
      .eq('setting_key', req.params.key)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
