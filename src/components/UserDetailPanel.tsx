'use client';

import React from 'react';
import { PinData } from '@/lib/supabase';
import { ROLE_CONFIGS, DiscordRole } from '@/config/riglob';
import { MapPin, Wallet, Link2, X, Compass, Award } from 'lucide-react';

interface UserDetailPanelProps {
  selectedPin: PinData | null;
  connectedWallet: string | undefined;
  totalPins: number;
  onClearSelection: () => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  selectedPin,
  connectedWallet,
  totalPins,
  onClearSelection,
}) => {
  const getShortAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (selectedPin) {
    const roleStyle = ROLE_CONFIGS[selectedPin.role as DiscordRole] || ROLE_CONFIGS['None'];

    return (
      <div className="glass-panel rounded-2xl p-5 w-full relative overflow-hidden animate-[slideIn_0.2s_ease-out]">
        {/* Glow effect matching role */}
        <div
          className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ backgroundColor: roleStyle.color }}
        />

        {/* Deselect Button */}
        <button
          onClick={onClearSelection}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Selected Profile Header */}
        <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase mb-4 flex items-center gap-1.5 select-none">
          <Compass className="w-3.5 h-3.5 text-[#00ff66]" />
          Ritualist Profile
        </h3>

        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center mt-2">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-2 mb-3 bg-zinc-950 flex items-center justify-center"
            style={{
              borderColor: roleStyle.color,
              boxShadow: `0 0 15px ${roleStyle.glowColor}`,
            }}
          >
            {selectedPin.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPin.profile_image_url}
                alt={selectedPin.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Award className="w-10 h-10 text-gray-600" />
            )}
          </div>

          <h2 className="text-white text-lg font-bold tracking-wide max-w-full truncate px-2">
            {selectedPin.name}
          </h2>
          
          <div className="mt-1.5 select-none">
            <span className={roleStyle.badgeClass}>{selectedPin.role}</span>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="mt-5 space-y-3 font-mono text-xs border-t border-white/5 pt-4">
          {/* Location */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase select-none">Location</div>
              <div className="text-gray-200 mt-0.5 font-sans leading-tight">{selectedPin.location_name}</div>
            </div>
          </div>

          {/* Wallet */}
          <div className="flex items-start gap-2.5">
            <Wallet className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 uppercase select-none">Wallet Address</div>
              <div className="text-gray-300 mt-0.5 font-bold hover:text-white transition-colors">
                <a
                  href={`https://explorer.ritualfoundation.org/address/${selectedPin.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 group"
                >
                  {getShortAddress(selectedPin.wallet_address)}
                  <Link2 className="w-3 h-3 text-gray-500 group-hover:text-[#00ff66] transition-colors" />
                </a>
              </div>
            </div>
          </div>

          {/* Tx Hash */}
          {selectedPin.tx_hash && selectedPin.tx_hash !== 'mock' && (
            <div className="flex items-start gap-2.5">
              <Link2 className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] text-gray-500 uppercase select-none">On-chain Tx</div>
                <div className="text-[#00ff66]/80 mt-0.5 font-bold hover:text-[#00ff66] transition-colors">
                  <a
                    href={`https://explorer.ritualfoundation.org/tx/${selectedPin.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5"
                  >
                    View Explorer
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Deselected/Default State
  return (
    <div className="glass-panel rounded-2xl p-5 w-full relative overflow-hidden select-none">
      <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase mb-4 flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 text-[#00ff66]" />
        Ritual Dashboard
      </h3>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 uppercase font-mono">Total Pins</div>
          <div className="text-2xl font-black text-[#00ff66] mt-1 drop-shadow-[0_0_8px_rgba(0,255,102,0.3)] leading-none">
            {totalPins}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
          <div className="text-[10px] text-gray-500 uppercase font-mono">My Status</div>
          <div className="text-[11px] font-bold text-gray-300 mt-2 leading-none flex items-center gap-1.5">
            {connectedWallet ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]"></span>
                Connected
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Disconnected
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl border border-dashed border-[#00ff66]/20 bg-[#00ff66]/5 text-center">
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          Click any glowing pin on the globe to inspect community member details and transaction records.
        </p>
      </div>
    </div>
  );
};
