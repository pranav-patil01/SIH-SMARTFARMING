'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Hud } from '@/ui/Hud';
import { Dashboard } from '@/ui/Dashboard';
import { ControlPanel } from '@/ui/ControlPanel';
import { ScenarioBar } from '@/ui/ScenarioBar';
import { EventLog } from '@/ui/EventLog';
import { InfoCard } from '@/ui/InfoCard';
import { TourOverlay } from '@/ui/TourOverlay';
import { Legend } from '@/ui/Legend';
import { PhoneFrame } from '@/ui/PhoneApp/PhoneFrame';
import { useSimStore } from '@/store/useSim';
import { 
  Smartphone, Sliders, Bell, LayoutDashboard, 
  Keyboard, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

// Dynamically import Three.js scene with SSR disabled for optimal bundle splitting
const Scene3D = dynamic(
  () => import('@/three/Scene').then((mod) => mod.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050A08] text-emerald-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        <span className="font-bold text-sm tracking-wide">Initializing AgriSense 3D Farm...</span>
      </div>
    ),
  }
);

type LeftTab = 'dashboard' | 'phone' | 'controls' | 'log';

function SimulatorContent() {
  const { 
    startTour, isTourActive, nextTourStep, prevTourStep, 
    togglePause, setScenario, resetSim 
  } = useSimStore();
  const searchParams = useSearchParams();

  const [leftTab, setLeftTab] = useState<LeftTab>('dashboard');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Auto-start tour if URL query contains ?tour=true
  useEffect(() => {
    if (searchParams && searchParams.get('tour') === 'true') {
      startTour();
    }
  }, [searchParams, startTour]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 't' || e.key === 'T') {
        startTour();
      } else if (e.key === 'ArrowRight' && isTourActive) {
        nextTourStep();
      } else if (e.key === 'ArrowLeft' && isTourActive) {
        prevTourStep();
      } else if (e.key === '?') {
        setShowShortcuts((prev) => !prev);
      } else if (e.key >= '1' && e.key <= '8') {
        const scenarioKeys = [
          'heatwave', 'rain_forecast', 'pipe_leak', 'pump_dry_run',
          'internet_outage', 'water_scarcity', 'sensor_drift', 'manual_override'
        ] as const;
        const idx = parseInt(e.key, 10) - 1;
        if (scenarioKeys[idx]) {
          setScenario(scenarioKeys[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, startTour, nextTourStep, prevTourStep, isTourActive, setScenario]);

  const leftPanelWidth = leftOpen ? 'minmax(300px, 320px)' : '0px';
  const rightPanelWidth = rightOpen ? 'minmax(280px, 320px)' : '0px';

  const leftTabs: { id: LeftTab; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Telemetry' },
    { id: 'phone', icon: Smartphone, label: 'Farmer App' },
    { id: 'controls', icon: Sliders, label: 'Controls' },
    { id: 'log', icon: Bell, label: 'Events' },
  ];

  return (
    <main 
      className="w-screen h-screen overflow-hidden bg-[#050A08] select-none"
      style={{
        display: 'grid',
        gridTemplateRows: '56px minmax(0, 1fr) auto',
        gridTemplateColumns: `${leftOpen ? '320px' : '48px'} minmax(0, 1fr) ${rightOpen ? '310px' : '0px'}`,
        gridTemplateAreas: `
          "header header header"
          "left viewport right"
          "bottom bottom bottom"
        `,
      }}
    >
      {/* ═══ 1. HEADER ═══ */}
      <div style={{ gridArea: 'header' }} className="z-20">
        <Hud />
      </div>

      {/* ═══ 2. LEFT SIDEBAR ═══ */}
      <div 
        style={{ gridArea: 'left' }} 
        className="z-10 flex overflow-hidden border-r border-white/5 bg-[#060E08]"
      >
        {/* Tab strip */}
        <div className="flex flex-col items-center py-2 gap-1.5 w-12 shrink-0 bg-[#050A08] border-r border-white/5">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = leftOpen && leftTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  if (leftTab === tab.id && leftOpen) {
                    setLeftOpen(false);
                  } else {
                    setLeftTab(tab.id);
                    setLeftOpen(true);
                  }
                }}
                className={`p-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <Icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2.5 rounded-xl text-gray-600 hover:text-gray-400 hover:bg-white/5 transition"
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Panel content */}
        {leftOpen && (
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar p-3">
            {leftTab === 'dashboard' && <Dashboard />}
            {leftTab === 'phone' && <PhoneFrame />}
            {leftTab === 'controls' && <ControlPanel />}
            {leftTab === 'log' && <EventLog />}
          </div>
        )}
      </div>

      {/* ═══ 3. CENTER 3D VIEWPORT ═══ */}
      <div style={{ gridArea: 'viewport' }} className="relative z-0 min-w-0 min-h-0">
        <Scene3D />

        {/* Tour overlay appears over viewport */}
        <TourOverlay />

        {/* Right sidebar toggle button */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-gray-300 hover:text-white backdrop-blur-md transition shadow-lg flex items-center gap-1 text-[11px] font-semibold"
          title={rightOpen ? "Collapse Inspector Panel" : "Open Inspector Panel"}
          aria-label={rightOpen ? "Collapse Inspector Panel" : "Open Inspector Panel"}
        >
          {rightOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span className="hidden sm:inline">{rightOpen ? "Collapse" : "Inspector"}</span>
        </button>

        {/* Legend floats over bottom-left of viewport */}
        <div className="absolute bottom-2 left-2 z-10">
          <Legend />
        </div>

        {/* Simulation label */}
        <div className="absolute bottom-2 right-2 z-10">
          <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-[9px] text-gray-400 font-medium backdrop-blur-sm">
            SIMULATION — ILLUSTRATIVE VALUES
          </div>
        </div>
      </div>

      {/* ═══ 4. RIGHT SIDEBAR — ZONE INSPECTOR ═══ */}
      {rightOpen && (
        <div 
          style={{ gridArea: 'right' }}
          className="z-10 overflow-y-auto overflow-x-hidden custom-scrollbar border-l border-white/5 bg-[#060E08]"
        >
          <InfoCard />
        </div>
      )}

      {/* ═══ 5. BOTTOM BAR ═══ */}
      <div style={{ gridArea: 'bottom' }} className="z-20">
        {!isTourActive && <ScenarioBar />}
      </div>

      {/* ═══ 6. KEYBOARD SHORTCUTS MODAL ═══ */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-[#0A1A0F] border border-emerald-500/30 rounded-2xl p-5 max-w-md w-full shadow-2xl text-white flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Play / Pause', 'Space'],
                ['Start Tour', 'T'],
                ['Next Step', '→'],
                ['Prev Step', '←'],
              ].map(([label, key]) => (
                <div key={label} className="bg-black/30 p-2.5 rounded-xl flex justify-between items-center border border-white/5">
                  <span className="text-gray-400">{label}:</span>
                  <span className="font-mono font-bold text-emerald-300 bg-black/50 px-2 py-0.5 rounded">{key}</span>
                </div>
              ))}
              <div className="bg-black/30 p-2.5 rounded-xl flex justify-between items-center border border-white/5 col-span-2">
                <span className="text-gray-400">Trigger Scenarios (1 to 8):</span>
                <span className="font-mono font-bold text-emerald-300 bg-black/50 px-2 py-0.5 rounded">Keys 1 – 8</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SimulatorPage() {
  return (
    <React.Suspense fallback={
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050A08] text-emerald-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        <span className="font-bold text-sm">Loading AgriSense Simulator...</span>
      </div>
    }>
      <SimulatorContent />
    </React.Suspense>
  );
}
