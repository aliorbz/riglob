'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { WalletProvider, useWallet } from '@/lib/wallet';
import { supabase, PinData } from '@/lib/supabase';
import { RIGLOB_CONFIG, DiscordRole } from '@/config/riglob';
import { ToastProvider, useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { UserDetailPanel } from '@/components/UserDetailPanel';
import { RoleLegend } from '@/components/RoleLegend';
import { AddPinModal } from '@/components/AddPinModal';
import { PinTooltip } from '@/components/PinTooltip';
import { Compass, ToggleLeft, ToggleRight, Sparkles, HelpCircle } from 'lucide-react';

// Dynamically import the Globe component to disable Server-Side Rendering (SSR)
// This is critical as Three.js/Globe.gl references the browser 'window' and 'document' objects.
const GlobeScene = dynamic(() => import('@/components/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black select-none">
      <Compass className="w-12 h-12 text-[#00ff66] animate-spin mb-4" />
      <span className="text-sm font-mono text-gray-500 uppercase tracking-widest animate-pulse">
        Initializing 3D Space...
      </span>
    </div>
  ),
});

// Main dashboard UI logic
function MainDashboard() {
  const { address, isConnected, isCorrectNetwork } = useWallet();
  const { toast } = useToast();

  // App States
  const [dbPins, setDbPins] = useState<PinData[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ pin: PinData; x: number; y: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mockModeEnabled, setMockModeEnabled] = useState(RIGLOB_CONFIG.mockMode);
  const [deviceSubmitted, setDeviceSubmitted] = useState(false);

  // 1. Generate 20 Mock Pins for local testing
  const mockPins = useMemo<PinData[]>(() => {
    const mockLocations = [
      { name: 'London, United Kingdom', lat: 51.5074, lng: -0.1278 },
      { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
      { name: 'San Francisco, United States', lat: 37.7749, lng: -122.4194 },
      { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
      { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
      { name: 'New York, United States', lat: 40.7128, lng: -74.0060 },
      { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
      { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241 },
      { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729 },
      { name: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.9426 },
      { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
      { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
      { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
      { name: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
      { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
      { name: 'Dubai, United Arab Emirates', lat: 25.2048, lng: 55.2708 },
      { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
      { name: 'Moscow, Russia', lat: 55.7558, lng: 37.6173 },
      { name: 'Auckland, New Zealand', lat: -36.8485, lng: 174.7633 },
    ];

    const roles: DiscordRole[] = ['Mod', 'Radiant Ritualist', 'Zealot', 'Ritualist', 'Ritty', 'Bitty', 'None'];
    const names = [
      'Zenith', 'Nebula', 'Aether', 'Vortex', 'Pulse', 'Cipher', 'Catalyst', 'Onyx', 'Helix', 'Solace',
      'Epoch', 'Quantum', 'Vector', 'Spectra', 'Genesis', 'Titan', 'Arcane', 'Nova', 'Lumen', 'Phobos'
    ];

    return mockLocations.map((loc, idx) => {
      const role = roles[idx % roles.length];
      const name = names[idx];
      const address = `0xmock${idx}f882ad3038b30efba88c1221ef${idx}`;

      return {
        id: `mock-${idx}`,
        name,
        role,
        location_name: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
        profile_image_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
        wallet_address: address,
        tx_hash: 'mock',
        created_at: new Date(Date.now() - idx * 3600000).toISOString(),
      };
    });
  }, []);

  // 2. Fetch pins from Supabase
  const fetchDbPins = async () => {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setDbPins(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Could not load database pins (database connection setup pending):', msg);
    }
  };

  useEffect(() => {
    fetchDbPins();

    // Subscribe to Postgres changes on pins table in real-time
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pins' },
        (payload) => {
          const newPin = payload.new as PinData;
          setDbPins((prev) => {
            if (prev.some((p) => p.id === newPin.id || p.wallet_address === newPin.wallet_address)) {
              return prev;
            }
            return [newPin, ...prev];
          });
          toast('success', `A new Ritualist joined! Welcome ${newPin.name} from ${newPin.location_name}!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // 3. Client checks: device registration & pop up modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSubmitted = localStorage.getItem('riglob_has_submitted') === 'true';
      setDeviceSubmitted(hasSubmitted);

      // Open Modal on first load if they haven't pinned themselves yet
      if (!hasSubmitted) {
        const timer = setTimeout(() => {
          setIsModalOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Combine database pins and mock pins based on toggle state
  const displayedPins = useMemo(() => {
    if (mockModeEnabled) {
      // Merge: unique by wallet address
      const dbAddresses = new Set(dbPins.map((p) => p.wallet_address.toLowerCase()));
      const filteredMock = mockPins.filter((mp) => !dbAddresses.has(mp.wallet_address.toLowerCase()));
      return [...dbPins, ...filteredMock];
    }
    return dbPins;
  }, [dbPins, mockPins, mockModeEnabled]);

  const handleOpenModal = () => {
    if (deviceSubmitted) {
      toast('error', 'This device has already pinned itself on RiGlob.');
      return;
    }
    if (isConnected && dbPins.some(p => p.wallet_address.toLowerCase() === address?.toLowerCase())) {
      toast('error', 'This wallet has already pinned itself.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedPin(null);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none text-white font-sans">
      {/* Background Cyber Grids & Particles */}
      <div className="absolute inset-0 cyber-grid z-0" />
      <div className="absolute inset-0 scanlines z-0 opacity-10" />

      {/* Header Navbar */}
      <Navbar onOpenModal={handleOpenModal} showAddButton={!deviceSubmitted} />

      {/* Fullscreen 3D Globe */}
      <div className="absolute inset-0 w-full h-full z-10">
        <GlobeScene
          pins={displayedPins}
          onSelectPin={setSelectedPin}
          onHoverPin={setHoveredPin}
        />
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredPin && <PinTooltip hoverData={hoveredPin} />}

      {/* Floating Left Dashboard Sidebar */}
      <div className="absolute left-6 top-28 z-20 w-80 max-h-[calc(100vh-140px)] overflow-y-auto flex flex-col gap-4 pointer-events-auto pr-2 scrollbar-none">
        
        {/* Profile / Stats Inspection Panel */}
        <UserDetailPanel
          selectedPin={selectedPin}
          connectedWallet={address || undefined}
          totalPins={displayedPins.length}
          onClearSelection={handleClearSelection}
        />

        {/* Discord Role Color Guide */}
        <RoleLegend />

        {/* Local Mock Configuration Panel */}
        <div className="glass-panel rounded-2xl p-4 w-full">
          <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
            Environment Settings
          </h3>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-gray-300 font-medium">Render Mock Pins (20)</span>
            <button
              onClick={() => {
                setMockModeEnabled(!mockModeEnabled);
                toast('info', `Mock pins ${!mockModeEnabled ? 'enabled' : 'disabled'}.`);
              }}
              className="text-[#00ff66] hover:text-[#33ff88] transition-colors focus:outline-none"
            >
              {mockModeEnabled ? (
                <ToggleRight className="w-9 h-9 text-[#00ff66]" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-gray-600" />
              )}
            </button>
          </div>
          {deviceSubmitted && (
            <div className="mt-2.5 pt-2.5 border-t border-white/5 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              This browser/device has registered a pin.
            </div>
          )}
        </div>
      </div>

      {/* Welcome & Wallet Hints Overlay for First-load / Disconnected */}
      {!isConnected && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-[#00ff66]/20 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-mono text-gray-300">
            Connect wallet to pin yourself and register Discord roles.
          </span>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-red-500/30 bg-red-950/20 text-red-400 font-mono text-xs shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Switch to Ritual Testnet in your wallet to interact.</span>
        </div>
      )}

      {/* Floating Action Button for Mobile Users */}
      {!deviceSubmitted && (
        <div className="absolute bottom-6 right-6 z-20 md:hidden">
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#00ff66] bg-[#00ff66] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(0,255,102,0.4)]"
          >
            Pin Yourself
          </button>
        </div>
      )}

      {/* Pin Submission Modal */}
      <AddPinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDbPins}
      />
    </main>
  );
}

// Layout wrapper supplying context providers
export default function Page() {
  return (
    <ToastProvider>
      <WalletProvider>
        <MainDashboard />
      </WalletProvider>
    </ToastProvider>
  );
}
