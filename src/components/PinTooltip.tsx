'use client';

import React from 'react';
import { PinData } from '@/lib/supabase';
import { ROLE_CONFIGS, DiscordRole } from '@/config/riglob';
import { MapPin, Wallet } from 'lucide-react';

interface PinTooltipProps {
  hoverData: {
    pin: PinData;
    x: number;
    y: number;
  };
}

export const PinTooltip: React.FC<PinTooltipProps> = ({ hoverData }) => {
  const { pin, x, y } = hoverData;
  const roleStyle = ROLE_CONFIGS[pin.role as DiscordRole] || ROLE_CONFIGS['None'];

  const getShortAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div
      className={`fixed z-[9999] pointer-events-none rounded-xl border p-3 flex items-center gap-3 backdrop-blur-md bg-zinc-950/90 text-white shadow-2xl transition-all duration-75 select-none role-glow-${pin.role}`}
      style={{
        left: `${x + 15}px`,
        top: `${y + 15}px`,
      }}
    >
      {/* Avatar inside Tooltip */}
      <div
        className="w-10 h-10 rounded-full overflow-hidden border shrink-0 bg-zinc-900"
        style={{ borderColor: roleStyle.color }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pin.profile_image_url}
          alt={pin.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(pin.wallet_address)}`;
          }}
        />
      </div>

      {/* Info Container */}
      <div className="flex flex-col min-w-[120px] max-w-[180px]">
        <div className="text-xs font-black truncate leading-tight tracking-wide">{pin.name}</div>
        <div className="mt-0.5 select-none">
          <span className={`${roleStyle.badgeClass} scale-90 origin-left inline-block`}>
            {pin.role}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-1">
          <MapPin className="w-2.5 h-2.5 text-gray-500 shrink-0" />
          <span className="truncate leading-none">{pin.location_name}</span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono mt-0.5">
          <Wallet className="w-2.5 h-2.5 text-gray-600 shrink-0" />
          <span className="leading-none">{getShortAddress(pin.wallet_address)}</span>
        </div>
      </div>
    </div>
  );
};
