/**
 * src/three/Terrain.tsx
 * Procedural 60×60m farm terrain with dynamic zone moisture darkening,
 * crisp field borders, and high-visibility 3D floating zone title badges.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { createNoise2D } from 'simplex-noise';
import { useSimStore } from '@/store/useSim';
import { SIM_CONFIG } from '@/config/project';

export const Terrain: React.FC = () => {
  const { snapshot, setSelectedObject } = useSimStore();
  const noise2D = useMemo(() => createNoise2D(), []);

  const { geometry } = useMemo(() => {
    const size = SIM_CONFIG.FARM_SIZE;
    const segs = SIM_CONFIG.TERRAIN_SEGMENTS;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Subtle natural ground undulation
      const y = noise2D(x * 0.03, z * 0.03) * SIM_CONFIG.TERRAIN_AMPLITUDE;
      pos.setY(i, y);

      colors[i * 3] = 0.52;
      colors[i * 3 + 1] = 0.42;
      colors[i * 3 + 2] = 0.28;
    }

    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geo };
  }, [noise2D]);

  // Dynamically darken soil based on zone moisture
  const dynamicGeometry = useMemo(() => {
    const geo = geometry.clone();
    const colorAttr = geo.attributes.color;
    const pos = geo.attributes.position;

    const z1 = snapshot.zones.find((z) => z.id === 'z1');
    const z2 = snapshot.zones.find((z) => z.id === 'z2');
    const z3 = snapshot.zones.find((z) => z.id === 'z3');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let moisture = 0.25;
      if (x < -5) {
        moisture = z1?.soilMoisture ?? 0.28;
      } else if (x >= -5 && x < 12) {
        moisture = z2?.soilMoisture ?? 0.32;
      } else {
        moisture = z3?.soilMoisture ?? 0.25;
      }

      // Smooth soil wetness gradient
      const wetness = THREE.MathUtils.clamp((moisture - 0.10) / 0.35, 0, 1);
      const r = THREE.MathUtils.lerp(0.58, 0.22, wetness);
      const g = THREE.MathUtils.lerp(0.46, 0.17, wetness);
      const b = THREE.MathUtils.lerp(0.32, 0.09, wetness);

      colorAttr.setXYZ(i, r, g, b);
    }
    colorAttr.needsUpdate = true;
    return geo;
  }, [geometry, snapshot.zones]);

  const z1 = snapshot.zones.find((z) => z.id === 'z1');
  const z2 = snapshot.zones.find((z) => z.id === 'z2');
  const z3 = snapshot.zones.find((z) => z.id === 'z3');

  return (
    <group>
      {/* Main Ground Mesh */}
      <mesh
        geometry={dynamicGeometry}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject({
            id: 'terrain_farm',
            type: 'zone',
            title: '60×60m Precision Agriculture Plot',
            subtitle: 'Loamy soil with dynamic moisture absorption',
            specs: [
              { label: 'Total Area', value: '3,600 m²' },
              { label: 'Soil Type', value: 'Clay Loam' },
              { label: 'Field Capacity', value: '35% Vol.' },
              { label: 'Wilting Point', value: '10% Vol.' },
            ],
            liveStatus: 'Soil moisture updating in real time per zone water balance',
            description: 'The terrain darkens dynamically as drip irrigation or effective rainfall infiltrates the root zone.',
          });
        }}
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {/* ── High-Visibility Floating 3D Zone Name Banners ── */}
      <ZoneBanner
        position={[-18, 3.2, -18]}
        title="🌾 Zone 1: Wheat"
        cropInfo="Kc: 1.15 · Drip Lateral"
        moisture={z1?.soilMoisturePct ?? 28}
        isIrrigating={z1?.valveOpen && snapshot.pump.isOn}
        color="#F59E0B"
      />

      <ZoneBanner
        position={[3, 3.2, -21]}
        title="🎋 Zone 2: Sugarcane"
        cropInfo="Kc: 1.25 · Subsurface Drip"
        moisture={z2?.soilMoisturePct ?? 32}
        isIrrigating={z2?.valveOpen && snapshot.pump.isOn}
        color="#10B981"
      />

      <ZoneBanner
        position={[19, 3.2, -9]}
        title="🥦 Zone 3: Vegetables"
        cropInfo="Kc: 1.05 · Micro-Sprinkler"
        moisture={z3?.soilMoisturePct ?? 25}
        isIrrigating={z3?.valveOpen && snapshot.pump.isOn}
        color="#06B6D4"
      />

      {/* Sub-Zone Boundary Furrows / Pathway Divider Ribbons */}
      <mesh position={[-5, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.4, 58]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      <mesh position={[12, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.4, 58]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>

      {/* Perimeter Fence Posts & Wire */}
      <FarmFence size={SIM_CONFIG.FARM_SIZE} />
    </group>
  );
};

const ZoneBanner: React.FC<{
  position: [number, number, number];
  title: string;
  cropInfo: string;
  moisture: number;
  isIrrigating?: boolean;
  color: string;
}> = ({ position, title, cropInfo, moisture, isIrrigating, color }) => {
  return (
    <group position={position}>
      {/* Mini Support Pin */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#455A64" metalness={0.7} />
      </mesh>

      <Html center distanceFactor={28} className="pointer-events-none select-none">
        <div className="flex flex-col items-center">
          <div className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-300 flex flex-col items-center gap-0.5 whitespace-nowrap ${
            isIrrigating
              ? 'bg-blue-950/95 border-blue-400 text-white shadow-blue-500/40 ring-2 ring-blue-400/50 scale-105 animate-pulse'
              : 'bg-black/85 border-white/20 text-gray-100 shadow-black/60'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shadow" style={{ backgroundColor: color }} />
              <span className="font-bold text-xs tracking-wide">{title}</span>
              {isIrrigating && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500 text-white animate-bounce">
                  WATERING
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-300">
              <span>{cropInfo}</span>
              <span className="text-emerald-400 font-bold">· {moisture.toFixed(1)}% θ</span>
            </div>
          </div>
          {/* Arrow indicator */}
          <div className="w-2.5 h-2.5 bg-black/85 rotate-45 -mt-1 border-r border-b border-white/20" />
        </div>
      </Html>
    </group>
  );
};

const FarmFence: React.FC<{ size: number }> = ({ size }) => {
  const half = size / 2;
  const posts = useMemo(() => {
    const arr: [number, number, number][] = [];
    const step = 6;
    for (let x = -half; x <= half; x += step) {
      arr.push([x, 0.6, -half]);
      arr.push([x, 0.6, half]);
    }
    for (let z = -half; z <= half; z += step) {
      arr.push([-half, 0.6, z]);
      arr.push([half, 0.6, z]);
    }
    return arr;
  }, [half]);

  return (
    <group>
      {posts.map((pos, idx) => (
        <mesh key={idx} position={pos} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};
