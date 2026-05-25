'use client';

import React from 'react';
import { WalletConnect } from './WalletConnect';
import { BalanceBox } from './BalanceBox';
import { Compass } from 'lucide-react';
import { RIGLOB_CONFIG } from '@/config/riglob';

interface NavbarProps {
  onOpenModal: () => void;
  showAddButton: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenModal, showAddButton }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Brand Area */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
            <Compass className="w-6 h-6 text-[#00ff66] animate-[pulse_3s_infinite]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-1.5 leading-none">
              {RIGLOB_CONFIG.appName}
              <span className="text-[#00ff66] font-extrabold text-neon-glow">.</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">
              {RIGLOB_CONFIG.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Controls Area */}
        <div className="flex items-center gap-3">
          {showAddButton && (
            <button
              onClick={onOpenModal}
              className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-[#00ff66] bg-[#00ff66] text-black font-extrabold text-xs md:text-sm shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] transition-all duration-300 transform hover:scale-[1.02] shrink-0"
            >
              Pin Yourself
            </button>
          )}
          <BalanceBox />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};
