import { createClient } from '@supabase/supabase-js';
import { RIGLOB_CONFIG } from '@/config/riglob';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || RIGLOB_CONFIG.supabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || RIGLOB_CONFIG.supabaseAnonKey;

// Sanitize URL to ensure it doesn't contain a trailing /rest/v1/ or slash which would cause "Invalid path specified in request URL" errors
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').trim();
  supabaseUrl = supabaseUrl.replace(/\/$/, '').trim();
}

// Create a single supabase client instance for the client-side of the application
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PinData {
  id: string;
  name: string;
  role: string;
  location_name: string;
  latitude: number;
  longitude: number;
  profile_image_url: string;
  wallet_address: string;
  tx_hash: string;
  created_at: string;
  device_hash?: string;
}
