/**
 * src/ui/InfoCard.tsx
 * Digital Twin Inspector & Diagnostics Panel.
 * Renders in the right sidebar of the simulator grid.
 * When a 3D object is selected -> shows detailed live telemetry, schematics & specs.
 * When nothing is selected -> shows Farm Deep Dive, Hardware Nodes Quick-Selector & ET₀ Breakdown.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { 
  X, Info, CheckCircle2, ShieldCheck, Activity, Cpu, 
  Droplets, Zap, Radio, Sun, Wind, Thermometer, Compass,
  Layers, ArrowRight, Gauge, AlertTriangle
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

export const InfoCard: React.FC = () => {
  const { 
    selectedObject, setSelectedObject, snapshot, 
    setCameraPreset, setXrayPumpHouse 
  } = useSimStore();

  const handleSelectQuickNode = (type: string, preset: any, xray = false) => {
    soundFx.playClick();
    setCameraPreset(preset);
    setXrayPumpHouse(xray);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DETAIL VIEW (When an object is selected in 3D scene)
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedObject) {
    return (
      <div className="flex flex-col gap-3 p-3 text-white animate-in fade-in duration-200">
        {/* Header with Title & Close button */}
        <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedObject.type}</span>
            </div>
            <h3 className="font-bold text-base text-white mt-0.5 leading-tight">
              {selectedObject.title}
            </h3>
            <p className="text-[11px] text-gray-400 font-medium">
              {selectedObject.subtitle}
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedObject(null);
            }}
            className="p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Pill */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Operational Status</span>
            <span className="text-xs font-semibold text-emerald-300">
              {selectedObject.liveStatus}
            </span>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            System Overview
          </span>
          <p className="text-xs text-gray-300 leading-relaxed">
            {selectedObject.description}
          </p>
        </div>

        {/* Technical Specs Grid */}
        {selectedObject.specs && selectedObject.specs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Telemetry &amp; Hardware Specs
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {selectedObject.specs.map((spec, idx) => (
                <div key={idx} className="bg-black/40 p-2 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 truncate">{spec.label}</span>
                  <span className="text-xs font-bold text-gray-200 font-mono mt-0.5 truncate">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls for Selected Object */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Diagnostic Actions
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundFx.playSuccess();
              }}
              className="px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ping Telemetry</span>
            </button>
            <button
              onClick={() => {
                setSelectedObject(null);
              }}
              className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>Back to Overview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DEFAULT VIEW: DIGITAL TWIN INSPECTOR & TELEMETRY HUB
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 p-3 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">
            Digital Twin Inspector
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          LIVE
        </span>
      </div>

      {/* 3D Hardware Quick Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Quick Focus Hardware Nodes</span>
          <span className="text-[9px] text-emerald-400 font-normal">Click to Inspect</span>
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleSelectQuickNode('pump', 'pumphouse', true)}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/40 text-left transition flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-gray-200 truncate">ESP32 &amp; Pump</div>
              <div className="text-[9px] text-gray-400 truncate">Main Relay / RTOS</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectQuickNode('cloud', 'cloud')}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/40 text-left transition flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              <Radio className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-gray-200 truncate">MQTT Broker</div>
              <div className="text-[9px] text-gray-400 truncate">Cloud AI Server</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectQuickNode('zone1', 'zone1')}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-amber-500/40 text-left transition flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-gray-200 truncate">Zone 1: Wheat</div>
              <div className="text-[9px] text-gray-400 truncate">FDR Capacitive Node</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectQuickNode('zone2', 'zone2')}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/40 text-left transition flex items-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-gray-200 truncate">Zone 2: Cane</div>
              <div className="text-[9px] text-gray-400 truncate">Solenoid &amp; Flow</div>
            </div>
          </button>
        </div>
      </div>

      {/* Hargreaves ET₀ Physics Engine Calculation */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>ET₀ Hargreaves Engine</span>
          </span>
          <span className="text-xs font-mono font-bold text-amber-300">
            {(snapshot.et0TodayMm ?? 4.2).toFixed(2)} mm/day
          </span>
        </div>
        <p className="text-[10px] text-gray-400 leading-tight">
          Calculates reference evapotranspiration based on solar extraterrestrial radiation (Ra), temperature delta (Tmax - Tmin), and crop coefficient (Kc).
        </p>
        <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono">
          <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
            <div className="text-[8px] text-gray-400">T_MAX</div>
            <div className="text-[11px] text-white font-bold">{Math.round(snapshot.weather.tmax ?? 34)}°C</div>
          </div>
          <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
            <div className="text-[8px] text-gray-400">T_MIN</div>
            <div className="text-[11px] text-white font-bold">{Math.round(snapshot.weather.tmin ?? 22)}°C</div>
          </div>
          <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
            <div className="text-[8px] text-gray-400">SOLAR Ra</div>
            <div className="text-[11px] text-amber-300 font-bold">{(snapshot.weather.solarRadiationMj ?? 18.5).toFixed(1)} MJ</div>
          </div>
        </div>
      </div>

      {/* Hardware Safety Interlock Health */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edge Fail-Safe Interlocks</span>
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${snapshot.pump.pumpFault ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {snapshot.pump.pumpFault ? 'CIRCUIT TRIPPED' : 'ARMED'}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Pump Dry-Run Protection</span>
            <span className={`font-mono font-bold ${snapshot.pump.dryRunDetected ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {snapshot.pump.dryRunDetected ? 'FAIL (NO WATER)' : 'PASS (WATER OK)'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-gray-400">Groundwater Reservoir Level</span>
            <span className="font-mono font-bold text-cyan-300">
              {Math.round((snapshot.tank.levelFraction ?? 0.8) * 100)}% ({Math.round(snapshot.tank.currentLevelL ?? 40000).toLocaleString()} L)
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400">Offline Fallback Rule</span>
            <span className="font-mono font-bold text-purple-300">
              {snapshot.esp32.localRulesActive ? 'Local Fallback ACTIVE' : 'ESP32 Cloud Synced'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Hint */}
      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-[10px] text-gray-300 leading-tight">
          Click any 3D sensor pole, crop zone, pump pipe, or solar inverter in the viewport to inspect live packet streams &amp; specs.
        </p>
      </div>
    </div>
  );
};
