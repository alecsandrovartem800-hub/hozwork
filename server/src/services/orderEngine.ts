import { getSupabase } from '../supabase';
import { emitOrderUpdate, emitNewOrder, emitQueueUpdate } from '../socket';
import { notifyNewOrder, updateOrderMessage } from './orderBot';
import { deductTobacco } from './tobaccoManager';

interface CreateOrderInput {
  guest_name: string;
  guest_phone?: string;
  guest_telegram_id?: number;
  table_number?: number;
  liquid_id?: number;
  notes?: string;
  items: { flavor_id: number; grams: number }[];
}

// Create a new order and auto-assign master if enabled
export async function createOrder(input: CreateOrderInput) {
  const db = getSupabase();
  
  // Create the order (price_tier defaults to 750, admin sets it later)
  const { data: order, error } = await db
    .from('orders')
    .insert({
      guest_name: input.guest_name,
      guest_phone: input.guest_phone || null,
      guest_telegram_id: input.guest_telegram_id || null,
      table_number: input.table_number || null,
      liquid_id: input.liquid_id || null,
      notes: input.notes || null,
      status: 'pending',
      price_tier: 750, // Default, admin changes after
      auto_cancel_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error || !order) throw new Error(`Failed to create order: ${error?.message}`);

  // Insert order items (mix components)
  if (input.items.length > 0) {
    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      flavor_id: item.flavor_id,
      grams: item.grams,
    }));
    await db.from('order_items').insert(orderItems);
  }

  // Fetch full order with items for notifications
  const fullOrder = await getOrderWithItems(order.id);

  // Check if auto_assign is enabled
  const { data: autoAssign } = await db
    .from('smart_features')
    .select('is_enabled')
    .eq('feature_key', 'auto_assign')
    .single();

  if (autoAssign?.is_enabled) {
    await tryAssignMaster(order.id);
  }

  // Emit real-time events
  emitNewOrder(fullOrder);
  emitQueueUpdate(await getQueueInfo());

  // Send Telegram notification
  try {
    await notifyNewOrder(fullOrder);
  } catch (e) {
    console.error('[OrderEngine] Telegram notify failed:', e);
  }

  return fullOrder;
}

// Try to assign a free master to the order
export async function tryAssignMaster(orderId: string) {
  const db = getSupabase();

  // Find a free master
  const { data: freeMaster } = await db
    .from('masters')
    .select('*')
    .eq('status', 'free')
    .limit(1)
    .single();

  if (!freeMaster) {
    // All masters busy — calculate wait time
    const waitMinutes = await calculateWaitTime();
    await db
      .from('orders')
      .update({ estimated_wait_minutes: waitMinutes })
      .eq('id', orderId);

    const updated = await getOrderWithItems(orderId);
    emitOrderUpdate(orderId, updated);
    return null;
  }

  // Assign master
  await db
    .from('orders')
    .update({ master_id: freeMaster.id, status: 'assigned' })
    .eq('id', orderId);

  await db
    .from('masters')
    .update({ status: 'busy', current_order_id: orderId })
    .eq('id', freeMaster.id);

  const updated = await getOrderWithItems(orderId);
  emitOrderUpdate(orderId, updated);

  try {
    await updateOrderMessage(updated);
  } catch (e) {
    console.error('[OrderEngine] Telegram update failed:', e);
  }

  return freeMaster;
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string, priceTier?: number) {
  const db = getSupabase();

  const updateData: any = { status };
  if (priceTier) updateData.price_tier = priceTier;
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.auto_cancel_at = null;
  }
  if (status === 'cancelled') {
    updateData.auto_cancel_at = null;
  }
  // Reset auto-cancel timer on any status change
  if (!['completed', 'cancelled'].includes(status)) {
    updateData.auto_cancel_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  }

  await db.from('orders').update(updateData).eq('id', orderId);

  // If completed or cancelled, free the master and process next in queue
  if (['completed', 'cancelled'].includes(status)) {
    const { data: order } = await db
      .from('orders')
      .select('master_id')
      .eq('id', orderId)
      .single();

    if (order?.master_id) {
      // Update master stats
      if (status === 'completed') {
        const { data: master } = await db
          .from('masters')
          .select('completed_today, total_completed')
          .eq('id', order.master_id)
          .single();

        await db
          .from('masters')
          .update({
            status: 'free',
            current_order_id: null,
            completed_today: (master?.completed_today || 0) + 1,
            total_completed: (master?.total_completed || 0) + 1,
          })
          .eq('id', order.master_id);
      } else {
        await db
          .from('masters')
          .update({ status: 'free', current_order_id: null })
          .eq('id', order.master_id);
      }

      // Process next order in queue
      await processQueue();
    }

    // Deduct tobacco if completed
    if (status === 'completed') {
      try {
        await deductTobacco(orderId);
      } catch (e) {
        console.error('[OrderEngine] Tobacco deduct failed:', e);
      }
    }
  }

  const updated = await getOrderWithItems(orderId);
  emitOrderUpdate(orderId, updated);
  emitQueueUpdate(await getQueueInfo());

  try {
    await updateOrderMessage(updated);
  } catch (e) {
    console.error('[OrderEngine] Telegram update failed:', e);
  }

  return updated;
}

// Set price tier for an order (admin action)
export async function setOrderPrice(orderId: string, priceTier: number) {
  const db = getSupabase();
  await db
    .from('orders')
    .update({ price_tier: priceTier, total_price: priceTier })
    .eq('id', orderId);

  const updated = await getOrderWithItems(orderId);
  emitOrderUpdate(orderId, updated);
  return updated;
}

// Process the queue — assign next pending order to any free master
async function processQueue() {
  const db = getSupabase();

  const { data: pendingOrders } = await db
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (pendingOrders && pendingOrders.length > 0) {
    await tryAssignMaster(pendingOrders[0].id);
  }
}

// Calculate estimated wait time based on current busy masters
async function calculateWaitTime(): Promise<number> {
  const db = getSupabase();

  const { data: config } = await db
    .from('smart_features')
    .select('config')
    .eq('feature_key', 'queue_estimation')
    .single();

  const avgPrepMinutes = config?.config?.avg_prep_minutes || 15;

  const { count } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'assigned', 'preparing']);

  return (count || 1) * avgPrepMinutes;
}

// Get full order with items, master info, liquid info
export async function getOrderWithItems(orderId: string) {
  const db = getSupabase();

  const { data: order } = await db
    .from('orders')
    .select(`
      *,
      liquid:liquids(name, icon),
      master:masters(name, status),
      items:order_items(
        id, grams,
        flavor:tobacco_flavors(
          name,
          brand:tobacco_brands(name)
        )
      )
    `)
    .eq('id', orderId)
    .single();

  return order;
}

// Get queue info for real-time display
export async function getQueueInfo() {
  const db = getSupabase();

  const { data: pending, count: pendingCount } = await db
    .from('orders')
    .select('id, guest_name, created_at, estimated_wait_minutes', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { count: activeCount } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['assigned', 'preparing', 'ready']);

  return {
    pending: pending || [],
    pendingCount: pendingCount || 0,
    activeCount: activeCount || 0,
  };
}

// Auto-cancel stale orders (called periodically)
export async function autoCancelStaleOrders() {
  const db = getSupabase();

  const { data: feature } = await db
    .from('smart_features')
    .select('is_enabled')
    .eq('feature_key', 'auto_cancel')
    .single();

  if (!feature?.is_enabled) return;

  const now = new Date().toISOString();
  const { data: staleOrders } = await db
    .from('orders')
    .select('id')
    .eq('status', 'pending')
    .lt('auto_cancel_at', now);

  if (!staleOrders || staleOrders.length === 0) return;

  for (const order of staleOrders) {
    console.log(`[OrderEngine] Auto-cancelling stale order: ${order.id}`);
    await updateOrderStatus(order.id, 'cancelled');
  }
}
