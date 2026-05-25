import { createClient } from '@supabase/supabase-js';
import { RIGLOB_CONFIG } from '@/config/riglob';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || RIGLOB_CONFIG.supabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || RIGLOB_CONFIG.supabaseAnonKey;

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
