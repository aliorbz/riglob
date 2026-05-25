'use client';

import React from 'react';
import { useWallet } from '@/lib/wallet';
import { AlertCircle, Wallet } from 'lucide-react';
import { RIGLOB_CONFIG } from '@/config/riglob';

export const BalanceBox: React.FC = () => {
  const { isConnected, balance, isCorrectNetwork, switchNetwork } = useWallet();

  if (!isConnected) return null;

  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchNetwork}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 text-xs font-mono font-bold animate-pulse uppercase tracking-wider"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Add Network
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#00ff66]/30 bg-[#00ff66]/5 shadow-[0_0_15px_rgba(0,255,102,0.05)] text-xs font-mono select-none">
      <Wallet className="w-3.5 h-3.5 text-[#00ff66]" />
      <span className="text-gray-400">Balance:</span>
      <span className="text-white font-bold">
        {balance} <span className="text-[#00ff66]">{RIGLOB_CONFIG.ritualChain.nativeCurrency.symbol}</span>
      </span>
    </div>
  );
};
