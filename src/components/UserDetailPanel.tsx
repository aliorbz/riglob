'use client';

import React, { useState } from 'react';
import { PinData } from '@/lib/supabase';
import { ROLE_CONFIGS, DiscordRole } from '@/config/riglob';
import { MapPin, Wallet, Link2, X, Compass, Award, ChevronUp, ChevronDown, Calendar, Eye, Sparkles } from 'lucide-react';

interface UserDetailPanelProps {
  selectedPin: PinData | null;
  connectedWallet: string | undefined;
  totalPins: number;
  onClearSelection: () => void;
  onFocusPin?: (pin: PinData) => void;
  onOpenPinModal?: () => void;
  hasPinnedUser?: boolean;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  selectedPin,
  connectedWallet,
  totalPins,
  onClearSelection,
  onFocusPin,
  onOpenPinModal,
  hasPinnedUser = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getShortAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  if (selectedPin) {
    const roleStyle = ROLE_CONFIGS[selectedPin.role as DiscordRole] || ROLE_CONFIGS['None'];

    return (
      <div className="glass-panel rounded-2xl p-5 w-full relative overflow-hidden border-[#00ff66]/30 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
        {/* Glow effect matching role */}
        <div
          className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ backgroundColor: roleStyle.color }}
        />

        {/* Header with Collapse Toggles & Close */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
          <div 
            className="flex items-center gap-1.5 cursor-pointer group flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Compass className="w-3.5 h-3.5 text-[#00ff66]" />
            <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase group-hover:text-white transition-colors">
              Ritualist Profile
            </h3>
            <span className="text-gray-500 group-hover:text-white transition-colors">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 ml-2"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && (
          <div className="animate-[fadeIn_0.2s_ease-out] space-y-4">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center text-center mt-1">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2 mb-3 bg-zinc-950 flex items-center justify-center relative group-hover:scale-105 transition-transform"
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
            <div className="space-y-3.5 font-mono text-xs border-t border-white/5 pt-4">
              {/* Location */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 uppercase select-none">Location</div>
                  <div className="text-gray-200 mt-0.5 font-sans leading-tight">{selectedPin.location_name}</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    Lat: {selectedPin.latitude.toFixed(4)}°, Lng: {selectedPin.longitude.toFixed(4)}°
                  </div>
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

              {/* Joining Date */}
              {selectedPin.created_at && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-500 uppercase select-none">Registered On</div>
                    <div className="text-gray-300 mt-0.5">{formatDate(selectedPin.created_at)}</div>
                  </div>
                </div>
              )}

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

            {/* Quick Action - Re-focus Camera on Globe */}
            {onFocusPin && (
              <button
                onClick={() => onFocusPin(selectedPin)}
                className="w-full mt-2 py-2 px-3 rounded-xl border border-white/10 hover:border-[#00ff66]/40 bg-zinc-950/50 hover:bg-[#00ff66]/5 text-[10px] font-bold text-gray-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 font-mono uppercase"
              >
                <Eye className="w-3.5 h-3.5 text-[#00ff66]" />
                Locate on Globe
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Deselected/Default State
  return (
    <div className="glass-panel rounded-2xl p-5 w-full relative overflow-hidden select-none">
      <div 
        className="flex items-center justify-between cursor-pointer group border-b border-white/5 pb-3 mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#00ff66]" />
          <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase group-hover:text-white transition-colors">
            Ritual Dashboard
          </h3>
        </div>
        <span className="text-gray-500 group-hover:text-white transition-colors p-0.5 rounded hover:bg-white/5">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {isExpanded && (
        <div className="animate-[fadeIn_0.2s_ease-out] space-y-4">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse"></span>
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

          {/* Prominent Action Call inside Dashboard when connected but not pinned */}
          {connectedWallet && !hasPinnedUser && onOpenPinModal && (
            <div className="pt-2 animate-[pulse_3s_infinite]">
              <button
                onClick={onOpenPinModal}
                className="w-full py-3 px-4 rounded-xl border border-[#00ff66] bg-[#00ff66] text-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.6)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                Pin Yourself Now
              </button>
            </div>
          )}

          <div className="p-3.5 rounded-xl border border-dashed border-[#00ff66]/20 bg-[#00ff66]/5 text-center">
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Click any glowing pin on the globe to inspect community member details and transaction records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
