import { Bot, InlineKeyboard, Context } from 'grammy';
import { config } from '../config';
import { getSupabase } from '../supabase';
import { emitMasterCall } from '../socket';

let supportBot: Bot | null = null;

// Store admin chat ID in DB when they /start
async function saveAdminChatId(chatId: number) {
  const db = getSupabase();
  // Store as a setting or update profiles
  // For simplicity, store in atmosphere_settings as admin_chat_id
  await db
    .from('atmosphere_settings')
    .upsert({
      setting_key: 'admin_telegram_chat_id',
      setting_value: String(chatId),
      setting_type: 'text',
      label: 'Telegram Chat ID администратора',
      sort_order: 99,
    }, { onConflict: 'setting_key' });
  
  console.log(`[SupportBot] Admin chat ID saved: ${chatId}`);
}

async function getAdminChatId(): Promise<number | null> {
  // First check env
  if (config.telegramAdminChatId) {
    return parseInt(config.telegramAdminChatId);
  }
  
  // Then check DB
  const db = getSupabase();
  const { data } = await db
    .from('atmosphere_settings')
    .select('setting_value')
    .eq('setting_key', 'admin_telegram_chat_id')
    .single();
  
  return data ? parseInt(data.setting_value) : null;
}

const MASTER_KEYWORDS = ['мастер', 'позвать', 'вызвать', 'кальянщик', 'hookah', 'позовите', 'вызовите'];

function isMasterCall(text: string): boolean {
  const lower = text.toLowerCase();
  return MASTER_KEYWORDS.some((kw) => lower.includes(kw));
}

export function initSupportBot() {
  if (!config.telegramSupportToken) {
    console.warn('[SupportBot] No token provided, skipping');
    return;
  }

  supportBot = new Bot(config.telegramSupportToken);

  // /start command — registers admin
  supportBot.command('start', async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Save this chat as admin
    await saveAdminChatId(chatId);

    await ctx.reply(
      '🌿 *SPORT LOUNGE — Бот поддержки*\n\n' +
      '✅ Вы зарегистрированы как администратор.\n' +
      'Все сообщения от гостей будут приходить сюда.\n\n' +
      'Команды:\n' +
      '/status — текущий статус\n' +
      '/masters — список мастеров',
      { parse_mode: 'Markdown' }
    );
  });

  // /status command
  supportBot.command('status', async (ctx: Context) => {
    const db = getSupabase();
    const { count: activeOrders } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'assigned', 'preparing', 'ready', 'serving']);

    const { count: freeMasters } = await db
      .from('masters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'free');

    await ctx.reply(
      `📊 *Статус SPORT LOUNGE*\n\n` +
      `🔥 Активных заказов: ${activeOrders || 0}\n` +
      `👨‍🍳 Свободных мастеров: ${freeMasters || 0}`,
      { parse_mode: 'Markdown' }
    );
  });

  // /masters command
  supportBot.command('masters', async (ctx: Context) => {
    const db = getSupabase();
    const { data: masters } = await db
      .from('masters')
      .select('name, status, completed_today');

    if (!masters || masters.length === 0) {
      await ctx.reply('Нет зарегистрированных мастеров');
      return;
    }

    const statusEmoji: Record<string, string> = {
      free: '🟢',
      busy: '🔴',
      offline: '⚫',
    };

    const list = masters
      .map((m) => `${statusEmoji[m.status] || '⚪'} ${m.name} — ${m.status} (сегодня: ${m.completed_today})`)
      .join('\n');

    await ctx.reply(`👨‍🍳 *Мастера*\n\n${list}`, { parse_mode: 'Markdown' });
  });

  // Handle all text messages from guests
  supportBot.on('message:text', async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    const text = ctx.message?.text || '';
    const from = ctx.from;
    if (!chatId || !from) return;

    const adminChatId = await getAdminChatId();

    // If message is from admin — it's a reply to guest
    if (adminChatId && chatId === adminChatId) {
      // Check if replying to a forwarded message
      const replyTo = ctx.message?.reply_to_message;
      if (replyTo) {
        // Extract guest chat ID from the forwarded message text
        const match = replyTo.text?.match(/ID: (\d+)/);
        if (match) {
          const guestChatId = parseInt(match[1]);
          try {
            await supportBot!.api.sendMessage(
              guestChatId,
              `💬 *Ответ от SPORT LOUNGE:*\n\n${text}`,
              { parse_mode: 'Markdown' }
            );
            await ctx.reply('✅ Ответ отправлен гостю');
          } catch (e) {
            await ctx.reply('❌ Не удалось отправить ответ гостю');
          }
        }
      }
      return;
    }

    // Save message to DB
    const db = getSupabase();
    const isMasterReq = isMasterCall(text);

    await db.from('support_messages').insert({
      telegram_user_id: from.id,
      telegram_username: from.username || null,
      telegram_first_name: from.first_name || null,
      direction: 'incoming',
      message_text: text,
      is_master_call: isMasterReq,
    });

    // Send to admin
    if (!adminChatId) {
      await ctx.reply('⏳ Администратор пока не подключён. Ваше сообщение сохранено.');
      return;
    }

    if (isMasterReq) {
      // MASTER CALL — urgent notification
      const keyboard = new InlineKeyboard()
        .text('✅ Отправить мастера', `send_master_${from.id}`);

      await supportBot!.api.sendMessage(
        adminChatId,
        `🚨🚨🚨 *ВЫЗОВ МАСТЕРА* 🚨🚨🚨\n\n` +
        `👤 Гость: ${from.first_name || 'Неизвестный'} (@${from.username || 'N/A'})\n` +
        `💬 Сообщение: ${text}\n` +
        `🆔 ID: ${from.id}\n\n` +
        `⏰ ${new Date().toLocaleTimeString('ru-RU')}`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );

      // Emit real-time event to admin panel
      emitMasterCall({
        guest_name: from.first_name || 'Гость',
        guest_username: from.username,
        message: text,
        timestamp: new Date().toISOString(),
      });

      await ctx.reply(
        '✅ Мастер уже вызван! Ожидайте, он скоро подойдёт.\n\n' +
        'Если нужна другая помощь, просто напишите.'
      );
    } else {
      // Regular support message
      await supportBot!.api.sendMessage(
        adminChatId,
        `💬 *Сообщение от гостя*\n\n` +
        `👤 ${from.first_name || 'Неизвестный'} (@${from.username || 'N/A'})\n` +
        `💬 ${text}\n` +
        `🆔 ID: ${from.id}\n\n` +
        `_Ответьте на это сообщение, чтобы ответить гостю_`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply('✅ Ваше сообщение отправлено. Мы скоро ответим!');
    }
  });

  // Handle callback queries (inline buttons)
  supportBot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('send_master_')) {
      const guestId = parseInt(data.replace('send_master_', ''));

      try {
        await supportBot!.api.sendMessage(
          guestId,
          '🌿 Мастер уже идёт к вам! Пожалуйста, подождите пару минут.'
        );
        await ctx.answerCallbackQuery({ text: '✅ Гость уведомлён' });
        await ctx.editMessageText(
          ctx.callbackQuery.message?.text + '\n\n✅ Мастер отправлен',
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        await ctx.answerCallbackQuery({ text: '❌ Ошибка отправки' });
      }
    }
  });

  // Start polling
  supportBot.start({
    onStart: () => console.log('[SupportBot] Started polling'),
  });

  console.log('[SupportBot] Initialized');
}

export function stopSupportBot() {
  if (supportBot) {
    supportBot.stop();
    console.log('[SupportBot] Stopped');
  }
}
