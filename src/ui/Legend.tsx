/**
 * src/ui/Legend.tsx
 * Viewport Overlay: Packet Colors & 3D Map Legend.
 * Nests neatly inside the 3D viewport without blocking controls.
 */

import React, { useState } from 'react';
import { PACKET_COLORS } from '@/sim/network';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export const Legend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-2 text-white flex flex-col gap-1.5 max-w-xs transition-all pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-200 hover:text-white"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>3D Map Legend &amp; Network Streams</span>
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2 pt-1.5 border-t border-white/10 text-[10px]">
          {/* Packet types */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">MQTT Data Streams</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow shrink-0" style={{ backgroundColor: PACKET_COLORS.uplink }} />
              <span className="text-gray-300">Blue: Sensor Uplink Telemetry (JSON)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow shrink-0" style={{ backgroundColor: PACKET_COLORS.downlink }} />
              <span className="text-gray-300">Orange: AI Cloud Valve Commands</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow shrink-0" style={{ backgroundColor: PACKET_COLORS.alert }} />
              <span className="text-gray-300">Red: Emergency Interlock Trip</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow shrink-0" style={{ backgroundColor: PACKET_COLORS.sms }} />
              <span className="text-gray-300">Purple: GSM SIM800L Direct SMS</span>
            </div>
          </div>

          {/* Farm Zones */}
          <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Crop Fields</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#C8A86B] shrink-0" />
              <span className="text-gray-300">Zone 1: Wheat (Kc = 1.15)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#4CAF50] shrink-0" />
              <span className="text-gray-300">Zone 2: Sugarcane (Kc = 1.25)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#8BC34A] shrink-0" />
              <span className="text-gray-300">Zone 3: Vegetables (Kc = 0.95)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
