/**
 * src/ui/ScenarioBar.tsx
 * Bottom Edge Failure & Simulation Scenario Bar.
 * Rendered inline inside the bottom grid slot of simulate/page.tsx.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { useI18n } from '@/i18n';
import { ScenarioId } from '@/sim/types';
import { SCENARIOS } from '@/sim/scenarios';
import { 
  Flame, CloudRain, Wrench, ShieldAlert, WifiOff, 
  Layers, AlertCircle, Smartphone, RotateCcw, Sparkles 
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

const SCENARIO_BUTTONS: { id: ScenarioId; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'heatwave', icon: Flame, color: 'hover:border-amber-500 hover:text-amber-400' },
  { id: 'rain_forecast', icon: CloudRain, color: 'hover:border-blue-400 hover:text-blue-300' },
  { id: 'pipe_leak', icon: Wrench, color: 'hover:border-red-500 hover:text-red-400' },
  { id: 'pump_dry_run', icon: ShieldAlert, color: 'hover:border-rose-500 hover:text-rose-400' },
  { id: 'internet_outage', icon: WifiOff, color: 'hover:border-yellow-400 hover:text-yellow-300' },
  { id: 'water_scarcity', icon: Layers, color: 'hover:border-purple-400 hover:text-purple-300' },
  { id: 'sensor_drift', icon: AlertCircle, color: 'hover:border-orange-400 hover:text-orange-300' },
  { id: 'manual_override', icon: Smartphone, color: 'hover:border-emerald-400 hover:text-emerald-300' },
];

export const ScenarioBar: React.FC = () => {
  const { snapshot, setScenario, setCameraPreset, setXrayPumpHouse } = useSimStore();
  const { t } = useI18n();

  const handleTrigger = (id: ScenarioId) => {
    soundFx.playClick();
    setScenario(id);
    if (id === 'pipe_leak') {
      setCameraPreset('zone2');
      setXrayPumpHouse(false);
    } else if (id === 'pump_dry_run' || id === 'internet_outage') {
      setCameraPreset('pumphouse');
      setXrayPumpHouse(true);
    } else if (id === 'sensor_drift') {
      setCameraPreset('zone3');
      setXrayPumpHouse(false);
    } else if (id === 'water_scarcity') {
      setCameraPreset('overview');
      setXrayPumpHouse(false);
    } else if (id === 'manual_override') {
      setCameraPreset('zone1');
      setXrayPumpHouse(false);
    }
  };

  return (
    <div className="w-full bg-[#060E08] border-t border-white/5 px-3 py-2 text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        {/* Top meta strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>SIH 2026 Scenario Demonstrations</span>
            </span>
            {snapshot.activeScenario !== 'none' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5">
                <span>Active: {SCENARIOS[snapshot.activeScenario]?.name}</span>
                <span className="font-mono text-white">({Math.round(snapshot.scenarioProgress * 100)}%)</span>
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 hidden sm:inline">
                Click any stress test to trigger live IoT edge anomalies &amp; safety responses
              </span>
            )}
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setScenario('none');
              setCameraPreset('overview');
              setXrayPumpHouse(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-semibold border border-white/10 transition"
            title="Reset to Normal State"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Reset Normal Mode</span>
          </button>
        </div>

        {/* 8 Scenario Trigger Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {SCENARIO_BUTTONS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = snapshot.activeScenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleTrigger(s.id)}
                className={`flex items-center sm:flex-col justify-center gap-1.5 sm:gap-0.5 py-1.5 px-2 rounded-xl text-center transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/80 scale-[1.02]'
                    : `bg-black/40 border-white/5 text-gray-300 ${s.color} hover:bg-black/70 hover:scale-[1.01]`
                }`}
                title={SCENARIOS[s.id]?.description || s.id}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-300' : 'text-gray-400'}`} />
                <span className="text-[10px] font-bold truncate">
                  {idx + 1}. {s.id.split('_').join(' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
