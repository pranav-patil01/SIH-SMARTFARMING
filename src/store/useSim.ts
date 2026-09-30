/**
 * src/store/useSim.ts
 * Global Zustand Store connecting AgriSense pure simulation engine to React UI and 3D Scene.
 */

import { create } from 'zustand';
import { AgriSenseSimEngine } from '@/sim/engine';
import { SimulationSnapshot, ScenarioId } from '@/sim/types';

export type CameraPreset = 'overview' | 'zone1' | 'zone2' | 'zone3' | 'pumphouse' | 'cloud' | 'farmer';

export interface SelectedObjectInfo {
  id: string;
  type: 'sensor' | 'controller' | 'actuator' | 'cloud' | 'zone' | 'avatar';
  title: string;
  subtitle: string;
  specs: { label: string; value: string }[];
  liveStatus: string;
  description: string;
}

export interface TimeSeriesPoint {
  time: string;
  hour: number;
  et0: number;
  z1Moisture: number;
  z2Moisture: number;
  z3Moisture: number;
  flowRate: number;
  currentA: number;
}

interface SimStoreState {
  engine: AgriSenseSimEngine;
  snapshot: SimulationSnapshot;
  
  // UI & 3D Interaction
  cameraPreset: CameraPreset;
  selectedObject: SelectedObjectInfo | null;
  xrayPumpHouse: boolean;
  activeTab: 'hud' | 'phone' | 'analytics' | 'log';
  phoneScreen: 'today' | 'savings' | 'zones' | 'alerts' | 'control' | 'reports';
  
  // Guided Tour
  isTourActive: boolean;
  tourStep: number;
  
  // Settings & Audio
  soundEnabled: boolean;
  quality: 'low' | 'med' | 'high';
  reduceMotion: boolean;
  postProcessing: boolean;
  history: TimeSeriesPoint[];

  // Actions
  tick: () => void;
  setSpeed: (speed: number) => void;
  togglePause: () => void;
  setScenario: (id: ScenarioId) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSelectedObject: (obj: SelectedObjectInfo | null) => void;
  setXrayPumpHouse: (open: boolean) => void;
  toggleXrayPumpHouse: () => void;
  setActiveTab: (tab: 'hud' | 'phone' | 'analytics' | 'log') => void;
  setPhoneScreen: (screen: 'today' | 'savings' | 'zones' | 'alerts' | 'control' | 'reports') => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  toggleSound: () => void;
  setQuality: (q: 'low' | 'med' | 'high') => void;
  togglePostProcessing: () => void;
  toggleReduceMotion: () => void;
  manualOverrideZone: (zoneId: string, turnOn: boolean) => void;
  resetSim: () => void;
}

const initialEngine = new AgriSenseSimEngine();

export const useSimStore = create<SimStoreState>((set, get) => ({
  engine: initialEngine,
  snapshot: initialEngine.getSnapshot(),
  
  cameraPreset: 'overview',
  selectedObject: null,
  xrayPumpHouse: false,
  activeTab: 'hud',
  phoneScreen: 'today',
  
  isTourActive: false,
  tourStep: 0,
  
  soundEnabled: true,
  quality: 'high',
  reduceMotion: false,
  postProcessing: true,
  history: [
    { time: '06:00', hour: 6, et0: 3.2, z1Moisture: 28, z2Moisture: 32, z3Moisture: 25, flowRate: 0, currentA: 0 },
    { time: '07:00', hour: 7, et0: 4.1, z1Moisture: 27.8, z2Moisture: 31.6, z3Moisture: 24.8, flowRate: 0, currentA: 0 },
    { time: '08:00', hour: 8, et0: 5.4, z1Moisture: 27.5, z2Moisture: 31.2, z3Moisture: 24.5, flowRate: 600, currentA: 16 },
  ],

  tick: () => {
    const { engine, history } = get();
    const snap = engine.tick();
    
    // Update time-series history every 15 simulated minutes
    let newHistory = history;
    if (snap.simMinute % 15 === 0) {
      const z1 = snap.zones.find(z => z.id === 'z1');
      const z2 = snap.zones.find(z => z.id === 'z2');
      const z3 = snap.zones.find(z => z.id === 'z3');
      const newPt: TimeSeriesPoint = {
        time: snap.timeOfDayFormatted,
        hour: snap.weather.hourOfDay,
        et0: Math.round(snap.et0TodayMm * 10) / 10,
        z1Moisture: Math.round((z1?.soilMoisturePct ?? 28) * 10) / 10,
        z2Moisture: Math.round((z2?.soilMoisturePct ?? 32) * 10) / 10,
        z3Moisture: Math.round((z3?.soilMoisturePct ?? 25) * 10) / 10,
        flowRate: snap.pump.isOn ? 600 : 0,
        currentA: snap.pump.currentA,
      };
      newHistory = [...history.slice(-24), newPt];
    }

    set({ snapshot: snap, history: newHistory });
  },

  setSpeed: (speed) => {
    const { engine } = get();
    engine.setSpeed(speed);
    set({ snapshot: engine.getSnapshot() });
  },

  togglePause: () => {
    const { engine, snapshot } = get();
    const nextPause = !snapshot.isPaused;
    engine.setPaused(nextPause);
    set({ snapshot: engine.getSnapshot() });
  },

  setScenario: (id) => {
    const { engine } = get();
    engine.setScenario(id);
    set({ snapshot: engine.getSnapshot() });
  },

  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  setXrayPumpHouse: (open) => set({ xrayPumpHouse: open }),
  toggleXrayPumpHouse: () => set((state) => ({ xrayPumpHouse: !state.xrayPumpHouse })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPhoneScreen: (screen) => set({ phoneScreen: screen }),

  startTour: () => {
    set({ isTourActive: true, tourStep: 0, cameraPreset: 'overview' });
  },

  nextTourStep: () => {
    const { tourStep } = get();
    const next = tourStep + 1;
    if (next < 9) {
      const presets: CameraPreset[] = [
        'overview',   // 0: Problem
        'zone1',      // 1: Zones
        'zone2',      // 2: Sensors
        'pumphouse',  // 3: ESP32
        'cloud',      // 4: MQTT
        'cloud',      // 5: Decision
        'zone3',      // 6: Actuation
        'pumphouse',  // 7: Safety
        'overview',   // 8: Impact
      ];
      set({ tourStep: next, cameraPreset: presets[next] });
      if (next === 3 || next === 7) {
        set({ xrayPumpHouse: true });
      } else {
        set({ xrayPumpHouse: false });
      }
    } else {
      set({ isTourActive: false, tourStep: 0, cameraPreset: 'overview', xrayPumpHouse: false });
    }
  },

  prevTourStep: () => {
    const { tourStep } = get();
    if (tourStep > 0) {
      const prev = tourStep - 1;
      const presets: CameraPreset[] = [
        'overview',   // 0: Problem
        'zone1',      // 1: Zones
        'zone2',      // 2: Sensors
        'pumphouse',  // 3: ESP32
        'cloud',      // 4: MQTT
        'cloud',      // 5: Decision
        'zone3',      // 6: Actuation
        'pumphouse',  // 7: Safety
        'overview',   // 8: Impact
      ];
      set({ 
        tourStep: prev, 
        cameraPreset: presets[prev],
        xrayPumpHouse: prev === 3 || prev === 7 
      });
    }
  },

  skipTour: () => set({ isTourActive: false, tourStep: 0, cameraPreset: 'overview', xrayPumpHouse: false }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setQuality: (q) => set({ quality: q }),
  togglePostProcessing: () => set((state) => ({ postProcessing: !state.postProcessing })),
  toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),

  manualOverrideZone: (zoneId, turnOn) => {
    const { engine } = get();
    engine.triggerManualOverride(zoneId, turnOn);
    set({ snapshot: engine.getSnapshot() });
  },

  resetSim: () => {
    const freshEngine = new AgriSenseSimEngine();
    set({
      engine: freshEngine,
      snapshot: freshEngine.getSnapshot(),
      cameraPreset: 'overview',
      selectedObject: null,
      xrayPumpHouse: false,
      isTourActive: false,
      tourStep: 0,
    });
  },
}));
