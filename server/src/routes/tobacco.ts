import { Router, Request, Response } from 'express';
import { getSupabase } from '../supabase';
import { addStock } from '../services/tobaccoManager';

const router = Router();

// GET /api/tobacco/brands
router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('tobacco_brands').select('*').order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tobacco/flavors — all flavors (admin sees all, client sees visible only)
router.get('/flavors', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { all } = req.query;
    
    let query = db
      .from('tobacco_flavors')
      .select('*, brand:tobacco_brands(name, country)')
      .order('name');

    // Client sees only visible, admin can see all
    if (!all) {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tobacco/flavors/by-brand — grouped by brand
router.get('/flavors/by-brand', async (_req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data: brands } = await db
      .from('tobacco_brands')
      .select('*, flavors:tobacco_flavors(*)') 
      .eq('is_active', true)
      .order('sort_order');
    
    // Filter visible flavors only for client
    const result = (brands || []).map((brand: any) => ({
      ...brand,
      flavors: (brand.flavors || []).filter((f: any) => f.is_visible && f.stock_grams > 0),
    })).filter((b: any) => b.flavors.length > 0);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tobacco/flavors — add new flavor
router.post('/flavors', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('tobacco_flavors').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/tobacco/flavors/:id — update flavor
router.patch('/flavors/:id', async (req: Request, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('tobacco_flavors')
      .update(req.body)
      .eq('id', parseInt(req.params.id))
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tobacco/flavors/:id/add-stock — add stock manually
router.post('/flavors/:id/add-stock', async (req: Request, res: Response) => {
  try {
    const { grams } = req.body;
    if (!grams || grams <= 0) return res.status(400).json({ error: 'grams must be positive' });

    const result = await addStock(parseInt(req.params.id), grams);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
