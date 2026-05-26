-- RIGLOB DATABASE SETUP SQL SCRIPT
-- Copy and paste this script directly into your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query) and click Run.

-- 1. Create the pins table
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  profile_image_url TEXT NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  device_hash TEXT
);

-- 2. Configure Row Level Security (RLS) to allow public reads and writes
-- This disables RLS, and sets up explicit permissive policies so that client-side connections can insert and query pins cleanly.
ALTER TABLE public.pins DISABLE ROW LEVEL SECURITY;

-- If RLS is enabled or enforced by Supabase, define permissive public policies:
DROP POLICY IF EXISTS "Allow public read access" ON public.pins;
DROP POLICY IF EXISTS "Allow public insert access" ON public.pins;

CREATE POLICY "Allow public read access" ON public.pins FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.pins FOR INSERT WITH CHECK (true);

-- 3. Create search index for fast query lookups on wallet addresses
CREATE INDEX IF NOT EXISTS pins_wallet_idx ON public.pins (wallet_address);

-- 4. Configure Realtime Replication for table updates
-- This enables live, real-time additions of new pins to the globe across all connected users without refreshing!
ALTER TABLE public.pins REPLICA IDENTITY FULL;

-- If this publication doesn't exist, we skip or it will auto-add. Run this to add the table to the replication channel:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pins;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add table to supabase_realtime publication. You can manually enable it in Supabase Dashboard -> Database -> Replication';
END $$;
