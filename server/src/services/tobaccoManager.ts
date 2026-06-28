import { getSupabase } from '../supabase';
import { emitRestockAlert } from '../socket';

// Deduct tobacco stock after an order is completed
export async function deductTobacco(orderId: string) {
  const db = getSupabase();

  // Get order items with flavor details
  const { data: items } = await db
    .from('order_items')
    .select('flavor_id, grams')
    .eq('order_id', orderId);

  if (!items || items.length === 0) return;

  for (const item of items) {
    // Get current stock
    const { data: flavor } = await db
      .from('tobacco_flavors')
      .select('id, stock_grams, min_threshold_grams, name, brand_id')
      .eq('id', item.flavor_id)
      .single();

    if (!flavor) continue;

    const newStock = Math.max(0, flavor.stock_grams - item.grams);

    // Update stock (trigger will auto-hide if 0)
    await db
      .from('tobacco_flavors')
      .update({ stock_grams: newStock })
      .eq('id', flavor.id);

    // Check if below threshold — create restock request
    if (newStock < flavor.min_threshold_grams) {
      await checkAndCreateRestockRequest(flavor.id);
    }
  }
}

// Check if restock request needs to be created
async function checkAndCreateRestockRequest(flavorId: number) {
  const db = getSupabase();

  // Check if auto_restock is enabled
  const { data: feature } = await db
    .from('smart_features')
    .select('is_enabled')
    .eq('feature_key', 'auto_restock')
    .single();

  if (!feature?.is_enabled) return;

  // Check if there's already a pending request for this flavor
  const { data: existing } = await db
    .from('restock_requests')
    .select('id')
    .eq('flavor_id', flavorId)
    .eq('status', 'pending')
    .limit(1);

  if (existing && existing.length > 0) return; // Already has pending request

  // Get flavor details
  const { data: flavor } = await db
    .from('tobacco_flavors')
    .select(`
      id, name, stock_grams, min_threshold_grams,
      brand:tobacco_brands(name)
    `)
    .eq('id', flavorId)
    .single();

  if (!flavor) return;

  const brandName = (flavor as any).brand?.name || 'Unknown';

  // Create restock request
  const { data: request } = await db
    .from('restock_requests')
    .insert({
      flavor_id: flavorId,
      brand_name: brandName,
      flavor_name: flavor.name,
      current_stock_grams: flavor.stock_grams,
      threshold_grams: flavor.min_threshold_grams,
      requested_grams: 500, // Default restock amount
      status: 'pending',
    })
    .select()
    .single();

  console.log(`[TobaccoManager] Auto-restock request created for ${brandName} ${flavor.name}`);

  // Emit real-time alert to admin
  emitRestockAlert({
    ...request,
    brand_name: brandName,
    flavor_name: flavor.name,
  });
}

// Fulfill a restock request — add stock and close the request
export async function fulfillRestock(requestId: number, actualGrams?: number) {
  const db = getSupabase();

  const { data: request } = await db
    .from('restock_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) throw new Error('Restock request not found');

  const addGrams = actualGrams || request.requested_grams;

  // Get current stock
  const { data: flavor } = await db
    .from('tobacco_flavors')
    .select('stock_grams')
    .eq('id', request.flavor_id)
    .single();

  if (!flavor) throw new Error('Flavor not found');

  // Add stock and make visible again
  await db
    .from('tobacco_flavors')
    .update({
      stock_grams: flavor.stock_grams + addGrams,
      is_visible: true,
    })
    .eq('id', request.flavor_id);

  // Close the request
  await db
    .from('restock_requests')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  console.log(`[TobaccoManager] Restock fulfilled: +${addGrams}g for request #${requestId}`);

  return { added_grams: addGrams, request_id: requestId };
}

// Manual stock addition (admin adds tobacco)
export async function addStock(flavorId: number, grams: number) {
  const db = getSupabase();

  const { data: flavor } = await db
    .from('tobacco_flavors')
    .select('stock_grams')
    .eq('id', flavorId)
    .single();

  if (!flavor) throw new Error('Flavor not found');

  await db
    .from('tobacco_flavors')
    .update({
      stock_grams: flavor.stock_grams + grams,
      is_visible: true,
    })
    .eq('id', flavorId);

  return { new_stock: flavor.stock_grams + grams };
}
