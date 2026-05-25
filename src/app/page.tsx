'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { WalletProvider, useWallet } from '@/lib/wallet';
import { supabase, PinData } from '@/lib/supabase';
import { ToastProvider, useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { UserDetailPanel } from '@/components/UserDetailPanel';
import { RoleLegend } from '@/components/RoleLegend';
import { SearchPanel } from '@/components/SearchPanel';
import { AddPinModal } from '@/components/AddPinModal';
import { PinTooltip } from '@/components/PinTooltip';
import { Compass } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Fetch pins from Supabase
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

  // 2. Screen responsive default sidebars
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Auto-collapse sidebar on mobile screens for clean immersive map view
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  }, []);

  // Determine if this user (by connected wallet address) has already submitted a pin
  const hasPinned = useMemo(() => {
    if (isConnected && address && dbPins.length > 0) {
      return dbPins.some((p) => p.wallet_address.toLowerCase() === address.toLowerCase());
    }
    return false;
  }, [isConnected, address, dbPins]);

  const handleOpenModal = () => {
    if (isConnected && address && dbPins.some(p => p.wallet_address.toLowerCase() === address.toLowerCase())) {
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
      <Navbar onOpenModal={handleOpenModal} showAddButton={isConnected && !hasPinned} />

      {/* Fullscreen 3D Globe */}
      <div className="absolute inset-0 w-full h-full z-10">
        <GlobeScene
          pins={dbPins}
          selectedPin={selectedPin}
          onSelectPin={setSelectedPin}
          onHoverPin={setHoveredPin}
        />
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredPin && <PinTooltip hoverData={hoveredPin} />}

      {/* Slide-out peeking button at the left edge when collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-0 top-[35%] z-30 flex items-center gap-2 pl-4 pr-3 py-3.5 rounded-r-2xl border-y border-r border-[#00ff66]/30 bg-black/85 text-white backdrop-blur-md hover:bg-zinc-900 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:shadow-[0_0_25px_rgba(0,255,102,0.35)] group border-l-0 pointer-events-auto"
        >
          <Compass className="w-5 h-5 text-[#00ff66] animate-[spin_8s_linear_infinite]" />
          <span className="text-[10px] font-bold font-mono tracking-widest uppercase hidden md:inline group-hover:text-[#00ff66] transition-colors">
            Open Console
          </span>
        </button>
      )}

      {/* Floating Left Dashboard Sidebar Container with smooth translate class transition */}
      <div 
        className={`absolute left-6 top-24 md:top-28 z-20 w-[340px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-140px)] overflow-y-auto flex flex-col gap-4 pointer-events-auto pr-2 scrollbar-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-[120%] opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Dashboard Title & Collapse Handler */}
        <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl w-full border-[#00ff66]/15 bg-black/65 backdrop-blur-md">
          <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#00ff66] animate-[spin_8s_linear_infinite]" />
            RiGlob Console
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-[10px] font-bold font-mono text-gray-400 hover:text-[#00ff66] transition-colors border border-white/10 hover:border-[#00ff66]/30 px-2.5 py-1.5 rounded-xl bg-white/5"
          >
            COLLAPSE PANEL
          </button>
        </div>

        {/* Profile / Stats Inspection Panel */}
        <UserDetailPanel
          selectedPin={selectedPin}
          connectedWallet={address || undefined}
          totalPins={dbPins.length}
          onClearSelection={handleClearSelection}
          onFocusPin={setSelectedPin}
          onOpenPinModal={handleOpenModal}
          hasPinnedUser={hasPinned}
        />

        {/* Discord Role Color Guide */}
        <RoleLegend pins={dbPins} />

        {/* Search Panel */}
        <SearchPanel pins={dbPins} onSelectPin={setSelectedPin} />
      </div>

      {/* Welcome & Wallet Hints Overlay for First-load / Disconnected */}
      {!isConnected && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-[#00ff66]/20 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.8)] max-w-[90vw] text-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-gray-300">
            Connect wallet to pin yourself and register Discord roles.
          </span>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 glass-panel px-6 py-3 rounded-full flex items-center gap-3 border-red-500/30 bg-red-950/20 text-red-400 font-mono text-xs shadow-[0_0_20px_rgba(0,0,0,0.8)] max-w-[90vw] text-center justify-center">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Switch to Ritual Testnet in your wallet to interact.</span>
        </div>
      )}

      {/* Floating Action Button for Mobile Users */}
      {isConnected && !hasPinned && (
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
