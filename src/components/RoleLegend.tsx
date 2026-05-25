'use client';

import React, { useState } from 'react';
import { ROLE_CONFIGS, ROLE_ORDER } from '@/config/riglob';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const RoleLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-panel rounded-2xl p-4 w-full select-none transition-all duration-300">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-[#00ff66] text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse"></span>
          Discord Role Legend
        </h3>
        <span className="text-gray-400 group-hover:text-[#00ff66] transition-colors p-0.5 rounded hover:bg-white/5">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>
      
      {isExpanded && (
        <div className="flex flex-col gap-2 mt-3 animate-[fadeIn_0.2s_ease-out]">
          {ROLE_ORDER.map((role) => {
            const config = ROLE_CONFIGS[role];
            const isMod = role === 'Mod';
            
            return (
              <div key={role} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-b-0">
                <div className="flex items-center gap-2.5">
                  {/* Pin Color Indicator */}
                  <div className="relative w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black/40">
                    <div
                      className={`w-2 h-2 rounded-full ${isMod ? 'animate-[pulse_1.5s_infinite]' : ''}`}
                      style={{
                        background: isMod 
                          ? 'linear-gradient(135deg, #ff007f, #fbbf24, #00ff66, #3b82f6)' 
                          : config.color,
                        boxShadow: `0 0 8px ${config.color}`,
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full border border-current opacity-30 animate-pulse"
                      style={{ color: config.color }}
                    />
                  </div>
                  <span className="text-gray-300 font-medium text-xs">{role}</span>
                </div>
                
                {/* Badge Preview */}
                <span className={config.badgeClass}>
                  {role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

