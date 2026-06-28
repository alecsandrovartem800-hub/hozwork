import { Router, Response, NextFunction } from 'express';
import { getSupabase } from '../supabase';

const router = Router();

// Middleware to authenticate Supabase User Token
export async function requireAuth(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    
    const db = getSupabase();
    const { data: { user }, error } = await db.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}

// GET /api/users/me — Get user profile info
router.get('/me', requireAuth, async (req: any, res: Response) => {
  try {
    const db = getSupabase();
    let { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!data) {
      console.log(`[UsersRoute] Profile not found for ${req.user.id}, auto-creating...`);
      const { data: newUser, error: insertError } = await db
        .from('users')
        .insert({
          id: req.user.id,
          email: req.user.email,
          name: req.user.user_metadata?.full_name || req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'Гость',
          avatar: req.user.user_metadata?.avatar_url || null,
          role: 'client',
          total_orders: 0,
          total_spent: 0
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('[UsersMe] Failed to auto-create user profile:', insertError);
      } else if (newUser) {
        data = newUser;
      }
    }

    if (error && !data) throw error;

    // Fallback if db record creation still failed (e.g. database schema constraint issues)
    if (!data) {
      data = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.full_name || req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'Гость',
        avatar: req.user.user_metadata?.avatar_url || null,
        role: 'client',
        total_orders: 0,
        total_spent: 0
      };
    }

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/orders — Get user's order history
router.get('/me/orders', requireAuth, async (req: any, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
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
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/mixes — Get user's saved favourite mixes
router.get('/me/mixes', requireAuth, async (req: any, res: Response) => {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('user_mixes')
      .select(`
        id, name, description, created_at,
        items:user_mix_items(
          id, grams,
          flavor:tobacco_flavors(
            id, name, description, category,
            brand:tobacco_brands(name)
          )
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/users/me/mixes — Save a new mix to user's profile
router.post('/me/mixes', requireAuth, async (req: any, res: Response) => {
  try {
    const db = getSupabase();
    const { name, description, items } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'items are required' });

    // 1. Create the mix entry
    const { data: mix, error: mixError } = await db
      .from('user_mixes')
      .insert({
        user_id: req.user.id,
        name,
        description: description || null
      })
      .select()
      .single();

    if (mixError || !mix) throw new Error(mixError?.message || 'Failed to create mix');

    // 2. Insert components/items
    const mixItems = items.map((item: any) => ({
      mix_id: mix.id,
      flavor_id: item.flavor_id,
      grams: item.grams
    }));

    const { error: itemsError } = await db
      .from('user_mix_items')
      .insert(mixItems);

    if (itemsError) throw itemsError;

    // 3. Return the created mix with items
    const { data: fullMix } = await db
      .from('user_mixes')
      .select(`
        id, name, description, created_at,
        items:user_mix_items(
          id, grams,
          flavor:tobacco_flavors(
            id, name, description, category,
            brand:tobacco_brands(name)
          )
        )
      `)
      .eq('id', mix.id)
      .single();

    res.status(201).json(fullMix);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/users/me/mixes/:id — Delete a saved mix
router.delete('/me/mixes/:id', requireAuth, async (req: any, res: Response) => {
  try {
    const db = getSupabase();
    // Supabase RLS policies will automatically ensure users can only delete their own mixes
    const { error } = await db
      .from('user_mixes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
