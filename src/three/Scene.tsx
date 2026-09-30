/**
 * src/three/Scene.tsx
 * Master Three.js Scene embedding Canvas, lighting, shadows, and post-processing.
 */

'use client';

import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { PerformanceMonitor } from '@react-three/drei';
import { Terrain } from './Terrain';
import { Crops } from './Crops';
import { PumpHouse } from './PumpHouse';
import { Pipes } from './Pipes';
import { Sensors } from './Sensors';
import { Weather } from './Weather';
import { CloudIsland } from './CloudIsland';
import { Packets } from './Packets';
import { Farmer } from './Farmer';
import { CameraRig } from './CameraRig';
import { useSimStore } from '@/store/useSim';

export const Scene: React.FC = () => {
  const { 
    tick, snapshot, quality, setQuality, 
    postProcessing, reduceMotion 
  } = useSimStore();

  // Tick the simulation engine continuously
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const interval = 200 / (snapshot.speed || 1);

    const loop = (time: number) => {
      if (time - lastTime >= interval) {
        tick();
        lastTime = time;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick, snapshot.speed]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-sky-950 via-slate-900 to-emerald-950">
      <Canvas
        shadows
        camera={{ position: [0, 32, 42], fov: 45 }}
        dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PerformanceMonitor
          onDecline={() => {
            if (quality === 'high') setQuality('med');
            else if (quality === 'med') setQuality('low');
          }}
        />

        <Suspense fallback={null}>
          {/* Environment & Weather */}
          <Weather />

          {/* Camera Controller */}
          <CameraRig />

          {/* 3D Farm Layout Components */}
          <Terrain />
          <Crops />
          <PumpHouse />
          <Pipes />
          <Sensors />
          <CloudIsland />
          <Packets />
          <Farmer />

          {/* Post-Processing Effects */}
          {postProcessing && !reduceMotion && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.4}
                luminanceThreshold={0.7}
                luminanceSmoothing={0.3}
              />
              <Vignette eskil={false} offset={0.15} darkness={0.6} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
