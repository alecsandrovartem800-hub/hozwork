import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || 'https://srqmqyldxmbdjxqjevxa.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Telegram
  telegramSupportToken: process.env.TELEGRAM_SUPPORT_BOT_TOKEN || '8749256757:AAFdnrV4xMzsH_nsC6zBZu2bBfmD4vUTSyA',
  telegramOrderToken: process.env.TELEGRAM_ORDER_BOT_TOKEN || '8569759144:AAEpmyJthuhgJ2qCAFt_jz63TN1lwlnYHIs',
  telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  
  // Encryption seed
  serverSecret: process.env.SERVER_SECRET || 'rnd_6mHD2EtlSbhqxrUQrPQRm0EzUcww',
};
