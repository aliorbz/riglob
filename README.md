# RiGlob - Ritual Community World Map

RiGlob is a dark, futuristic Web3 3D globe visualization platform designed for members of the Ritual Discord community. Users can connect their wallet, input their alias, select their community role, select their location via real-time autocomplete suggestions, and pin themselves onto a rotating 3D Earth map by paying a 0.001 RITUAL native test token fee.

---

## Technical Stack
- **Framework**: React / Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **3D Engine**: Three.js & `react-globe.gl`
- **Web3 Connection**: Wagmi v2 & Viem v2
- **Database**: Supabase (Database & Realtime PostgreSQL Subscriptions)
- **Geocoding**: OpenStreetMap Nominatim API (Free / Keyless)

---

## Quick Start (Local Run)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-api-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> **Mock Mode is Enabled by Default**: The application loads with 20 pre-populated mock pins across the globe. You can connect a dummy wallet or input files without paying actual tokens to test visual behaviors immediately. Toggle `Render Mock Pins` at the bottom of the sidebar or disable it in `src/config/riglob.ts`.

---

## Supabase Database Setup

### 1. Database Table Creation
Execute the following SQL code in the **Supabase SQL Editor** to create the `pins` table and set up indexes:

```sql
-- Create pins table
create table public.pins (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  profile_image_url text not null, -- Stores Supabase URL or fallback Base64 string
  wallet_address text not null unique,
  tx_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_hash text
);

-- Disable Row Level Security (RLS) to allow public writes
alter table public.pins disable row level security;

-- If RLS is enabled or enforced, define explicit public insert and select policies:
drop policy if exists "Allow public read access" on public.pins;
drop policy if exists "Allow public insert access" on public.pins;
create policy "Allow public read access" on public.pins for select using (true);
create policy "Allow public insert access" on public.pins for insert with check (true);

-- Index search for wallet addresses
create index pins_wallet_idx on public.pins (wallet_address);

-- Enable Realtime Subscriptions
alter table public.pins replica identity full;
```

To configure Realtime, navigate to **Database** -> **Replication** in the Supabase Dashboard, toggle **Source: public** (under Table Replication), and check the box next to `pins`. Alternatively, run this query if you have database publication administration rights:
```sql
alter publication supabase_realtime add table pins;
```

### 2. Storage Bucket Creation (Optional Avatar Storage)
To enable storage of image file uploads rather than falling back to Base64 in rows:
1. Navigate to **Storage** in your Supabase Dashboard.
2. Click **New Bucket** and name it `profile-pictures`.
3. Set the bucket privacy toggle to **Public**.
4. Set storage security policies (RLS) to allow inserts:
   - **Allowed operations**: Select/Read (SELECT), Insert/Write (INSERT)
   - **Target audience**: Public / Anon / Authenticated

*If the storage bucket is missing or throws permission errors, the frontend will automatically catch it and fall back to encoding avatars as Base64 strings directly in the database row, guaranteeing that submissions still complete successfully.*

---

## Web3 & Configuration Details

To configure settings like the recipient wallet, network RPC, or fee value, modify `src/config/riglob.ts`:

```typescript
export const RIGLOB_CONFIG = {
  appName: 'RiGlob',
  
  // Ritual Testnet Network Config
  ritualChain: {
    id: 1979,
    name: 'Ritual',
    ...
  },

  // Fee and Receiver
  submitFeeEth: '0.001', // Submission cost in RITUAL
  adminReceiverWallet: '0x2483e02233bd992ac1B8Ec5006320C726B6377fA', // Configured receiver address
  
  // Toggle mock pins on startup
  mockMode: true,
};
```

### Supported Discord Roles & Colors
Roles are assigned glowing markers on the 3D globe:
- **Mod**: Animated shifting spectrum gradient (Pink → Orange → Blue)
- **Radiant Ritualist**: Golden orange glow
- **Zealot**: Bluish purple glow
- **Ritualist**: Neon green glow
- **Ritty**: Purple glow
- **Bitty**: Blue glow
- **None**: Silver glow

---

## Optional: Smart Contract Deployment

If you prefer to lock transaction validation through a smart contract rather than direct transfer, deploy `contracts/RiGlobRegistry.sol` using Hardhat, Foundry, or Remix.

### Deploy Parameters:
- **Network**: Ritual Testnet (Chain ID 1979)
- **RPC URL**: `https://rpc.ritualfoundation.org`
- **Native Currency**: `RITUAL`

### Integration:
Once deployed, replace the direct transfer address in `src/config/riglob.ts` with the contract address and update the transaction execution method in `src/components/AddPinModal.tsx` to execute `submitPin(string memory metadataId)`.
