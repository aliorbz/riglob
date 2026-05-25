'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/lib/wallet';
import { LogOut, Wallet, Loader2, ChevronDown } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
  };

  const getShortAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00ff66]/30 bg-black/40 text-gray-400 font-mono text-sm select-none"
      >
        <Loader2 className="w-4 h-4 animate-spin text-[#00ff66]" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00ff66]/40 bg-[#00ff66]/10 text-white font-mono text-sm shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:border-[#00ff66]/70 hover:shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all duration-300"
        >
          <div className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
          {getShortAddress(address)}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-md p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-50 animate-[slideIn_0.15s_ease-out]">
            <div className="px-3 py-2 text-xs text-gray-500 font-mono border-b border-white/5 select-none">
              Connected Wallet
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors font-medium mt-1"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00ff66]/40 bg-black/40 hover:bg-[#00ff66]/5 text-white font-mono text-sm shadow-[0_0_10px_rgba(0,255,102,0.05)] hover:border-[#00ff66] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all duration-300"
    >
      <Wallet className="w-4 h-4 text-[#00ff66]" />
      Connect Wallet
    </button>
  );
};
