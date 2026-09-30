/**
 * src/three/Crops.tsx
 * Thousands of instanced crops using InstancedMesh with procedural geometry,
 * dynamic wind animation, and moisture stress color adaptation.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/store/useSim';
import { SIM_CONFIG } from '@/config/project';

const dummy = new THREE.Object3D();
const colorHelper = new THREE.Color();

export const Crops: React.FC = () => {
  const { snapshot, quality, setSelectedObject } = useSimStore();

  const countPerZone = quality === 'high' ? 800 : quality === 'med' ? 400 : 150;

  return (
    <group>
      {/* Zone 1: Wheat Field */}
      <WheatField 
        zoneId="z1" 
        count={countPerZone} 
        center={[-18, 0, -5]} 
        size={[18, 28]} 
      />

      {/* Zone 2: Sugarcane Field */}
      <SugarcaneField 
        zoneId="z2" 
        count={Math.floor(countPerZone * 0.7)} 
        center={[3, 0, -8]} 
        size={[16, 26]} 
      />

      {/* Zone 3: Vegetables Field */}
      <VegetableField 
        zoneId="z3" 
        count={Math.floor(countPerZone * 0.8)} 
        center={[19, 0, 4]} 
        size={[14, 24]} 
      />
    </group>
  );
};

/* ── 1. Wheat Field (Instanced Slender Stalks) ── */
const WheatField: React.FC<{ zoneId: string; count: number; center: [number, number, number]; size: [number, number] }> = ({
  zoneId, count, center, size
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { snapshot, setSelectedObject } = useSimStore();
  const zone = snapshot.zones.find((z) => z.id === zoneId);

  // Procedural wheat stalk geometry
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.04, 0.08, 1.4, 5);
    geo.translate(0, 0.7, 0);
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
    });
  }, []);

  // Compute instance positions
  const instances = useMemo(() => {
    const arr: { x: number; z: number; rotY: number; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = center[0] + (Math.random() - 0.5) * size[0];
      const z = center[2] + (Math.random() - 0.5) * size[1];
      const rotY = Math.random() * Math.PI * 2;
      const scale = 0.8 + Math.random() * 0.4;
      arr.push({ x, z, rotY, scale });
    }
    return arr;
  }, [count, center, size]);

  // Update instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const health = zone?.plantHealth ?? 1.0;
    const isWilted = health < 0.3;

    // Healthy golden green vs stressed dry yellow
    const baseHex = isWilted ? '#B58D3D' : health > 0.8 ? '#85A33D' : '#D4AF37';
    colorHelper.set(baseHex);

    instances.forEach((inst, i) => {
      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set(0, inst.rotY, 0);
      dummy.scale.set(inst.scale, inst.scale * Math.max(0.6, health), inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colorHelper);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances, zone?.plantHealth]);

  // Wind sway animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 2.5;
    const windTilt = Math.sin(t) * 0.08;
    meshRef.current.rotation.z = windTilt;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        setSelectedObject({
          id: 'crop_wheat',
          type: 'zone',
          title: 'Zone 1: Triticum Aestivum (Wheat)',
          subtitle: 'Kharif/Rabi Cereal Crop',
          specs: [
            { label: 'Crop Kc (Mid)', value: '1.15' },
            { label: 'Root Depth', value: '40 cm' },
            { label: 'Moisture Target', value: '30%' },
            { label: 'Drip Spacing', value: '45 cm' },
          ],
          liveStatus: `Soil Moisture: ${zone?.soilMoisturePct.toFixed(1)}% | Health: ${Math.round((zone?.plantHealth ?? 1) * 100)}%`,
          description: 'High-yield wheat plot irrigated via precision surface drip lateral lines. Monitored for heat-induced evapotranspiration spikes.',
        });
      }}
    />
  );
};

/* ── 2. Sugarcane Field (Tall, dense canes) ── */
const SugarcaneField: React.FC<{ zoneId: string; count: number; center: [number, number, number]; size: [number, number] }> = ({
  zoneId, count, center, size
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { snapshot, setSelectedObject } = useSimStore();
  const zone = snapshot.zones.find((z) => z.id === zoneId);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.12, 0.16, 2.8, 6);
    geo.translate(0, 1.4, 0);
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.1,
    });
  }, []);

  const instances = useMemo(() => {
    const arr: { x: number; z: number; rotY: number; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = center[0] + (Math.random() - 0.5) * size[0];
      const z = center[2] + (Math.random() - 0.5) * size[1];
      const rotY = Math.random() * Math.PI * 2;
      const scale = 0.85 + Math.random() * 0.35;
      arr.push({ x, z, rotY, scale });
    }
    return arr;
  }, [count, center, size]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const health = zone?.plantHealth ?? 1.0;
    const hex = health > 0.8 ? '#2E7D32' : health > 0.4 ? '#558B2F' : '#827717';
    colorHelper.set(hex);

    instances.forEach((inst, i) => {
      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set(0, inst.rotY, 0);
      dummy.scale.set(inst.scale, inst.scale * Math.max(0.7, health), inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colorHelper);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances, zone?.plantHealth]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 1.8;
    meshRef.current.rotation.x = Math.sin(t) * 0.04;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        setSelectedObject({
          id: 'crop_sugarcane',
          type: 'zone',
          title: 'Zone 2: Saccharum Officinarum (Sugarcane)',
          subtitle: 'High Water-Requirement Cash Crop',
          specs: [
            { label: 'Crop Kc (Mid)', value: '1.25' },
            { label: 'Growth Stage', value: 'Grand Growth' },
            { label: 'Daily Water Need', value: '~6.5 mm/d' },
            { label: 'Sensor In-Line', value: 'YF-S201 Flow' },
          ],
          liveStatus: `Soil Moisture: ${zone?.soilMoisturePct.toFixed(1)}% | Health: ${Math.round((zone?.plantHealth ?? 1) * 100)}%`,
          description: 'Tall cane rows with high transpiration rates. Precision subsurface drip feeds root beds without surface evaporation loss.',
        });
      }}
    />
  );
};

/* ── 3. Vegetable Field (Bushy lush crops) ── */
const VegetableField: React.FC<{ zoneId: string; count: number; center: [number, number, number]; size: [number, number] }> = ({
  zoneId, count, center, size
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { snapshot, setSelectedObject } = useSimStore();
  const zone = snapshot.zones.find((z) => z.id === zoneId);

  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.45, 1);
    geo.translate(0, 0.4, 0);
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.05,
    });
  }, []);

  const instances = useMemo(() => {
    const arr: { x: number; z: number; rotY: number; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = center[0] + (Math.random() - 0.5) * size[0];
      const z = center[2] + (Math.random() - 0.5) * size[1];
      const rotY = Math.random() * Math.PI * 2;
      const scale = 0.75 + Math.random() * 0.5;
      arr.push({ x, z, rotY, scale });
    }
    return arr;
  }, [count, center, size]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const health = zone?.plantHealth ?? 1.0;
    const hex = health > 0.8 ? '#43A047' : health > 0.4 ? '#7CB342' : '#9E9D24';
    colorHelper.set(hex);

    instances.forEach((inst, i) => {
      dummy.position.set(inst.x, 0, inst.z);
      dummy.rotation.set(0, inst.rotY, 0);
      dummy.scale.set(inst.scale, inst.scale * Math.max(0.6, health), inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, colorHelper);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances, zone?.plantHealth]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        setSelectedObject({
          id: 'crop_veg',
          type: 'zone',
          title: 'Zone 3: Horticultural Vegetables',
          subtitle: 'Tomato & Brassica Mixed Horticulture',
          specs: [
            { label: 'Crop Kc (Mid)', value: '1.05' },
            { label: 'Root Depth', value: '30 cm' },
            { label: 'Moisture Target', value: '32%' },
            { label: 'Sensor Node', value: 'FC-28 Soil Probe' },
          ],
          liveStatus: `Soil Moisture: ${zone?.soilMoisturePct.toFixed(1)}% | Health: ${Math.round((zone?.plantHealth ?? 1) * 100)}%`,
          description: 'Shallow-rooted vegetables highly susceptible to moisture stress. Regulated with micro-drip emitters and FC-28 probe cross-checks.',
        });
      }}
    />
  );
};
