import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let serviceClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

export function getAnonSupabase(): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
