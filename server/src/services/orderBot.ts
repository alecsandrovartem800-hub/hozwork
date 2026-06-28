import { Bot, InlineKeyboard } from 'grammy';
import { config } from '../config';
import { getSupabase } from '../supabase';
import { updateOrderStatus, setOrderPrice } from './orderEngine';

let orderBot: Bot | null = null;

async function getAdminChatId(): Promise<number | null> {
  if (config.telegramAdminChatId) {
    return parseInt(config.telegramAdminChatId);
  }
  const db = getSupabase();
  const { data } = await db
    .from('atmosphere_settings')
    .select('setting_value')
    .eq('setting_key', 'admin_telegram_chat_id')
    .single();
  return data ? parseInt(data.setting_value) : null;
}

export function initOrderBot() {
  if (!config.telegramOrderToken) {
    console.warn('[OrderBot] No token provided, skipping');
    return;
  }

  orderBot = new Bot(config.telegramOrderToken);

  // /start — register for order notifications
  orderBot.command('start', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Also save admin chat ID here
    const db = getSupabase();
    await db
      .from('atmosphere_settings')
      .upsert({
        setting_key: 'admin_telegram_chat_id',
        setting_value: String(chatId),
        setting_type: 'text',
        label: 'Telegram Chat ID администратора',
        sort_order: 99,
      }, { onConflict: 'setting_key' });

    await ctx.reply(
      '🔔 *SPORT LOUNGE — Уведомления о заказах*\n\n' +
      '✅ Вы подписаны на уведомления.\n' +
      'Новые заказы будут приходить сюда автоматически.\n\n' +
      'Вы можете подтверждать и отменять заказы прямо из Telegram!',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle callback queries (confirm/cancel/price buttons)
  orderBot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('confirm_')) {
      const orderId = data.replace('confirm_', '');
      try {
        await updateOrderStatus(orderId, 'preparing');
        await ctx.answerCallbackQuery({ text: '✅ Заказ подтверждён!' });
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка' });
      }
    }

    if (data.startsWith('cancel_')) {
      const orderId = data.replace('cancel_', '');
      try {
        await updateOrderStatus(orderId, 'cancelled');
        await ctx.answerCallbackQuery({ text: '❌ Заказ отменён' });
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка' });
      }
    }

    if (data.startsWith('ready_')) {
      const orderId = data.replace('ready_', '');
      try {
        await updateOrderStatus(orderId, 'ready');
        await ctx.answerCallbackQuery({ text: '✅ Кальян готов!' });
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка' });
      }
    }

    if (data.startsWith('complete_')) {
      const orderId = data.replace('complete_', '');
      try {
        await updateOrderStatus(orderId, 'completed');
        await ctx.answerCallbackQuery({ text: '✅ Заказ завершён!' });
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка' });
      }
    }

    // Price tier buttons
    if (data.startsWith('price_')) {
      const parts = data.split('_');
      const price = parseInt(parts[1]);
      const orderId = parts.slice(2).join('_');
      try {
        await setOrderPrice(orderId, price);
        await ctx.answerCallbackQuery({ text: `💰 Цена установлена: ${price}₽` });
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка' });
      }
    }
  });

  orderBot.start({
    onStart: () => console.log('[OrderBot] Started polling'),
  });

  console.log('[OrderBot] Initialized');
}

// Send a new order card to admin
export async function notifyNewOrder(order: any) {
  if (!orderBot) return;

  const adminChatId = await getAdminChatId();
  if (!adminChatId) {
    console.warn('[OrderBot] No admin chat ID configured');
    return;
  }

  const mixItems = order.items
    ?.map((item: any) => {
      const brandName = item.flavor?.brand?.name || '';
      const flavorName = item.flavor?.name || '';
      return `  • ${brandName} ${flavorName} (${item.grams}г)`;
    })
    .join('\n') || '  Не указан';

  const liquidName = order.liquid?.name || 'Не выбрана';
  const liquidIcon = order.liquid?.icon || '💧';

  const statusEmoji: Record<string, string> = {
    pending: '🟡',
    assigned: '🔵',
    preparing: '🟠',
    ready: '🟢',
    serving: '✨',
    completed: '✅',
    cancelled: '❌',
  };

  const text =
    `📋 *НОВЫЙ ЗАКАЗ*\n\n` +
    `👤 *Гость:* ${order.guest_name}\n` +
    `${order.table_number ? `🪑 *Стол:* ${order.table_number}\n` : ''}` +
    `📞 ${order.guest_phone || 'Не указан'}\n\n` +
    `🍃 *Микс:*\n${mixItems}\n\n` +
    `${liquidIcon} *Жидкость:* ${liquidName}\n` +
    `${order.notes ? `📝 *Заметки:* ${order.notes}\n` : ''}` +
    `\n${statusEmoji[order.status] || '⚪'} *Статус:* ${order.status}\n` +
    `💰 *Цена:* ожидает назначения\n\n` +
    `⏰ ${new Date(order.created_at).toLocaleString('ru-RU')}`;

  const keyboard = new InlineKeyboard()
    .text('✅ Подтвердить', `confirm_${order.id}`)
    .text('❌ Отменить', `cancel_${order.id}`)
    .row()
    .text('500₽', `price_500_${order.id}`)
    .text('750₽', `price_750_${order.id}`)
    .text('1000₽', `price_1000_${order.id}`);

  try {
    const sent = await orderBot.api.sendMessage(adminChatId, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    // Save telegram message ID for later editing
    const db = getSupabase();
    await db
      .from('orders')
      .update({ telegram_message_id: sent.message_id })
      .eq('id', order.id);
  } catch (e) {
    console.error('[OrderBot] Failed to send notification:', e);
  }
}

// Update existing order message with new status
export async function updateOrderMessage(order: any) {
  if (!orderBot || !order.telegram_message_id) return;

  const adminChatId = await getAdminChatId();
  if (!adminChatId) return;

  const mixItems = order.items
    ?.map((item: any) => {
      const brandName = item.flavor?.brand?.name || '';
      const flavorName = item.flavor?.name || '';
      return `  • ${brandName} ${flavorName} (${item.grams}г)`;
    })
    .join('\n') || '  Не указан';

  const liquidName = order.liquid?.name || 'Не выбрана';
  const liquidIcon = order.liquid?.icon || '💧';
  const masterName = order.master?.name || 'Не назначен';

  const statusEmoji: Record<string, string> = {
    pending: '🟡',
    assigned: '🔵',
    preparing: '🟠',
    ready: '🟢',
    serving: '✨',
    completed: '✅',
    cancelled: '❌',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    assigned: 'Мастер назначен',
    preparing: 'Готовится',
    ready: 'Готов',
    serving: 'Подан',
    completed: 'Завершён',
    cancelled: 'Отменён',
  };

  const text =
    `📋 *ЗАКАЗ*\n\n` +
    `👤 *Гость:* ${order.guest_name}\n` +
    `${order.table_number ? `🪑 *Стол:* ${order.table_number}\n` : ''}` +
    `👨‍🍳 *Мастер:* ${masterName}\n\n` +
    `🍃 *Микс:*\n${mixItems}\n\n` +
    `${liquidIcon} *Жидкость:* ${liquidName}\n\n` +
    `${statusEmoji[order.status] || '⚪'} *Статус:* ${statusLabels[order.status] || order.status}\n` +
    `💰 *Цена:* ${order.total_price || order.price_tier}₽\n\n` +
    `⏰ ${new Date(order.created_at).toLocaleString('ru-RU')}`;

  // Dynamic buttons based on status
  let keyboard = new InlineKeyboard();

  switch (order.status) {
    case 'pending':
      keyboard
        .text('✅ Подтвердить', `confirm_${order.id}`)
        .text('❌ Отменить', `cancel_${order.id}`)
        .row()
        .text('500₽', `price_500_${order.id}`)
        .text('750₽', `price_750_${order.id}`)
        .text('1000₽', `price_1000_${order.id}`);
      break;
    case 'assigned':
    case 'preparing':
      keyboard
        .text('✅ Готов', `ready_${order.id}`)
        .text('❌ Отменить', `cancel_${order.id}`)
        .row()
        .text('500₽', `price_500_${order.id}`)
        .text('750₽', `price_750_${order.id}`)
        .text('1000₽', `price_1000_${order.id}`);
      break;
    case 'ready':
    case 'serving':
      keyboard.text('✅ Завершить', `complete_${order.id}`);
      break;
    // No buttons for completed/cancelled
  }

  try {
    await orderBot.api.editMessageText(adminChatId, order.telegram_message_id, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (e) {
    // Message might be too old to edit — send new one
    console.warn('[OrderBot] Could not edit message, sending new one');
  }
}

export function stopOrderBot() {
  if (orderBot) {
    orderBot.stop();
    console.log('[OrderBot] Stopped');
  }
}
