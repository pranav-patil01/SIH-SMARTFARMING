/**
 * src/ui/ControlPanel.tsx
 * Simulation Speed, Camera Presets, and Hardware Diagnostic Controls.
 */

import React from 'react';
import { useSimStore, CameraPreset } from '@/store/useSim';
import { useI18n } from '@/i18n';
import { 
  Play, Pause, RotateCcw, Video, 
  Sliders, X
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

export const ControlPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    snapshot, togglePause, setSpeed, resetSim, 
    cameraPreset, setCameraPreset, xrayPumpHouse, toggleXrayPumpHouse,
    quality, setQuality, postProcessing, togglePostProcessing,
    reduceMotion, toggleReduceMotion
  } = useSimStore();
  const { t } = useI18n();

  const isPaused = snapshot.isPaused;
  const currentSpeed = snapshot.speed;

  const cameraPresets: { id: CameraPreset; label: string }[] = [
    { id: 'overview', label: 'Farm Overview' },
    { id: 'zone1', label: 'Zone 1 (Wheat)' },
    { id: 'zone2', label: 'Zone 2 (Cane)' },
    { id: 'zone3', label: 'Zone 3 (Veg)' },
    { id: 'pumphouse', label: 'Pump & ESP32' },
    { id: 'cloud', label: 'Cloud Server' },
    { id: 'farmer', label: 'Farmer Node' },
  ];

  return (
    <div className="flex flex-col gap-3.5 pb-3 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">
            Simulation Controls
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFx.playClick();
              resetSim();
            }}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Reset</span>
          </button>
          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1 rounded-lg bg-black/40 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Play / Pause & Speed Multiplier */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            soundFx.playClick();
            togglePause();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition active:scale-95 ${
            isPaused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
          <span>{isPaused ? 'Resume Sim' : 'Pause Sim'}</span>
        </button>

        {/* Speed Buttons */}
        <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/10 gap-1">
          {[1, 10, 60].map((s) => (
            <button
              key={s}
              onClick={() => {
                soundFx.playClick();
                setSpeed(s);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                currentSpeed === s
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* 2. 3D Camera Angles */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
          <Video className="w-3.5 h-3.5 text-blue-400" />
          <span>Camera View Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {cameraPresets.map((cam) => (
            <button
              key={cam.id}
              onClick={() => {
                soundFx.playClick();
                setCameraPreset(cam.id);
              }}
              className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-semibold border transition ${
                cameraPreset === cam.id
                  ? 'bg-blue-600/40 border-blue-400 text-white font-bold shadow-lg shadow-blue-500/20'
                  : 'bg-black/30 border-white/5 text-gray-300 hover:bg-black/50'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Diagnostic Overlays */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300 font-medium">ESP32 Hardware Cutaway</span>
          <button
            onClick={() => {
              soundFx.playClick();
              toggleXrayPumpHouse();
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              xrayPumpHouse
                ? 'bg-emerald-600/40 border-emerald-400 text-emerald-300'
                : 'bg-black/30 border-white/10 text-gray-400'
            }`}
          >
            {xrayPumpHouse ? 'X-Ray OPEN' : 'X-Ray CLOSED'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300 font-medium">Render Quality</span>
          <div className="flex bg-black/40 rounded-xl p-0.5 border border-white/10">
            {(['low', 'med', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-lg ${
                  quality === q ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300 font-medium">Post-Processing Bloom</span>
          <button
            onClick={() => {
              soundFx.playClick();
              togglePostProcessing();
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
              postProcessing
                ? 'bg-emerald-600/40 border-emerald-400 text-emerald-300'
                : 'bg-black/30 border-white/10 text-gray-400'
            }`}
          >
            {postProcessing ? 'Bloom ON' : 'Bloom OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
