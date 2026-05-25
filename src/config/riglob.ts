export const RIGLOB_CONFIG = {
  appName: 'RiGlob',
  appSubtitle: 'Ritual community world map',
  
  // Ritual Testnet Network Config
  ritualChain: {
    id: 1979,
    name: 'Ritual',
    network: 'ritual',
    nativeCurrency: {
      name: 'RITUAL',
      symbol: 'RITUAL',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://rpc.ritualfoundation.org'] },
      public: { http: ['https://rpc.ritualfoundation.org'] },
    },
    blockExplorers: {
      default: { name: 'Ritual Explorer', url: 'https://explorer.ritualfoundation.org' },
    },
  },
  // Fee and Receiver
  submitFeeEth: '0.001', // in RITUAL (equivalent to ether in viem parsing)
  adminReceiverWallet: '0x2483e02233bd992ac1B8Ec5006320C726B6377fA', // Configured receiver address
  
  // Supabase (can be overriden by process.env)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-project.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Development Mode Settings
  mockMode: false, // Set to true to load 20 mock pins and test without wallet/transactions
};

export type DiscordRole = 'Mod' | 'Radiant Ritualist' | 'Zealot' | 'Ritualist' | 'Ritty' | 'Bitty' | 'None';

export interface RoleStyle {
  name: DiscordRole;
  color: string;      // Base color used for standard rendering
  glowColor: string;  // CSS drop shadow glow color
  markerClass: string;
  badgeClass: string;
}

export const ROLE_CONFIGS: Record<DiscordRole, RoleStyle> = {
  'Mod': {
    name: 'Mod',
    color: '#ff007f',
    glowColor: 'rgba(255, 0, 127, 0.8)',
    markerClass: 'marker-mod animate-[spin_4s_linear_infinite]', // Dynamic rainbow-like behavior defined in CSS
    badgeClass: 'bg-gradient-to-r from-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-pink-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradientShift_3s_linear_infinite] font-extrabold shadow-[0_0_12px_rgba(255,0,127,0.5)] border border-pink-500/30 px-2 py-0.5 rounded text-xs'
  },
  'Radiant Ritualist': {
    name: 'Radiant Ritualist',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    markerClass: 'marker-radiant animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]',
    badgeClass: 'bg-amber-950/50 text-amber-400 border border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)] px-2 py-0.5 rounded text-xs font-bold'
  },
  'Zealot': {
    name: 'Zealot',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.8)',
    markerClass: 'marker-zealot',
    badgeClass: 'bg-violet-950/50 text-violet-400 border border-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.3)] px-2 py-0.5 rounded text-xs font-semibold'
  },
  'Ritualist': {
    name: 'Ritualist',
    color: '#00ff66',
    glowColor: 'rgba(0, 255, 102, 0.8)',
    markerClass: 'marker-ritualist',
    badgeClass: 'bg-emerald-950/50 text-emerald-400 border border-emerald-400/50 shadow-[0_0_8px_rgba(0,255,102,0.3)] px-2 py-0.5 rounded text-xs font-semibold'
  },
  'Ritty': {
    name: 'Ritty',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.6)',
    markerClass: 'marker-ritty',
    badgeClass: 'bg-purple-950/50 text-purple-300 border border-purple-300/30 px-2 py-0.5 rounded text-xs font-medium'
  },
  'Bitty': {
    name: 'Bitty',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    markerClass: 'marker-bitty',
    badgeClass: 'bg-blue-950/50 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded text-xs font-medium'
  },
  'None': {
    name: 'None',
    color: '#9ca3af',
    glowColor: 'rgba(156, 163, 175, 0.4)',
    markerClass: 'marker-none',
    badgeClass: 'bg-zinc-900 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded text-xs'
  }
};

export const ROLE_ORDER: DiscordRole[] = [
  'Mod',
  'Radiant Ritualist',
  'Zealot',
  'Ritualist',
  'Ritty',
  'Bitty',
  'None'
];
