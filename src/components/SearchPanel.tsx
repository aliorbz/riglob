'use client';

import React, { useState } from 'react';
import { PinData } from '@/lib/supabase';
import { ROLE_CONFIGS, DiscordRole } from '@/config/riglob';
import { Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchPanelProps {
  pins: PinData[];
  onSelectPin: (pin: PinData) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ pins, onSelectPin }) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredPins = React.useMemo(() => {
    if (!query.trim()) return [];
    return pins.filter(pin => 
      pin.name.toLowerCase().includes(query.toLowerCase()) || 
      pin.location_name.toLowerCase().includes(query.toLowerCase()) ||
      pin.role.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Limit to top 5 results for sleek UI
  }, [pins, query]);

  return (
    <div className="glass-panel rounded-2xl p-4 w-full select-none">
      <div 
        className="flex items-center justify-between cursor-pointer group border-b border-white/5 pb-3 mb-3.5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-[#00ff66]" />
          <h3 className="text-gray-400 text-xs font-bold font-mono tracking-wider uppercase group-hover:text-white transition-colors">
            Search Ritualists
          </h3>
        </div>
        <span className="text-gray-500 group-hover:text-white transition-colors p-0.5 rounded hover:bg-white/5">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, location or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-zinc-950/80 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff66]/60 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
          </div>

          {query.trim() && filteredPins.length === 0 && (
            <div className="text-[10px] text-gray-500 font-mono text-center py-2">
              No Ritualists found.
            </div>
          )}

          {filteredPins.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {filteredPins.map((pin) => {
                const config = ROLE_CONFIGS[pin.role as DiscordRole] || ROLE_CONFIGS['None'];
                return (
                  <div
                    key={pin.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onSelectPin(pin);
                      setQuery(''); // Reset query after select
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-white/5 hover:border-[#00ff66]/30 bg-white/[0.01] hover:bg-[#00ff66]/5 cursor-pointer transition-all duration-300"
                  >
                    <div 
                      className="w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center shrink-0"
                      style={{ borderColor: config.color }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={pin.profile_image_url || 'https://via.placeholder.com/40'} 
                        alt={pin.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${pin.wallet_address}`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate leading-tight">
                        {pin.name}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono flex items-center gap-1 mt-0.5 truncate leading-none">
                        <MapPin className="w-2.5 h-2.5 text-[#00ff66] shrink-0" />
                        <span className="truncate">{pin.location_name}</span>
                      </div>
                    </div>
                    <span className="bg-zinc-800/80 text-gray-300 px-1.5 py-0.5 rounded text-[8px] border border-white/10 shrink-0 font-medium">
                      {pin.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
