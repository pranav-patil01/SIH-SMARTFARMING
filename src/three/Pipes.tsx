/**
 * src/three/Pipes.tsx
 * High-visibility pipe network with glowing water flow pulses,
 * micro-drip emitters along crop rows, and burst leak spray particles.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/store/useSim';

export const Pipes: React.FC = () => {
  const { snapshot, setSelectedObject } = useSimStore();
  const leakSprayRef = useRef<THREE.Points>(null);
  const flowGlowRef = useRef<THREE.Mesh>(null);

  const isPumpOn = snapshot.pump.isOn;
  const z1 = snapshot.zones.find((z) => z.id === 'z1');
  const z2 = snapshot.zones.find((z) => z.id === 'z2');
  const z3 = snapshot.zones.find((z) => z.id === 'z3');

  // Leak water spray particle system
  const leakParticles = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      vels[i * 3] = (Math.random() - 0.5) * 5;
      vels[i * 3 + 1] = 3 + Math.random() * 6;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: geo, velocities: vels, count };
  }, []);

  // Animate leak spray and water flow pulse
  useFrame(({ clock }, delta) => {
    if (leakSprayRef.current && z2?.leakSprayActive) {
      const posAttr = leakSprayRef.current.geometry.attributes.position;
      const vels = leakParticles.velocities;
      for (let i = 0; i < leakParticles.count; i++) {
        let x = posAttr.getX(i) + vels[i * 3] * delta;
        let y = posAttr.getY(i) + vels[i * 3 + 1] * delta;
        let z = posAttr.getZ(i) + vels[i * 3 + 2] * delta;
        vels[i * 3 + 1] -= 9.8 * delta; // gravity

        if (y < 0) {
          x = 0;
          y = 0.2;
          z = 0;
          vels[i * 3 + 1] = 3 + Math.random() * 6;
        }

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ── Main Distribution Manifold Pipe (from Pump House) ── */}
      <mesh position={[1, 0.25, 12]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 16, 16]} />
        <meshStandardMaterial
          color={isPumpOn ? '#0288D1' : '#37474F'}
          roughness={0.3}
          metalness={0.7}
          emissive={isPumpOn ? '#00B0FF' : '#000000'}
          emissiveIntensity={isPumpOn ? 0.6 : 0}
        />
      </mesh>

      {/* ── Lateral Line to Zone 1 (Wheat) ── */}
      <PipeBranch
        start={[1, 0.25, 12]}
        end={[-18, 0.15, -5]}
        isActive={isPumpOn && (z1?.valveOpen ?? false)}
        valvePosition={[-8, 0.35, 6]}
        zoneName="Zone 1 (Wheat)"
      />

      {/* ── Lateral Line to Zone 2 (Sugarcane) ── */}
      <PipeBranch
        start={[1, 0.25, 12]}
        end={[3, 0.15, -8]}
        isActive={isPumpOn && (z2?.valveOpen ?? false)}
        valvePosition={[2, 0.35, 4]}
        zoneName="Zone 2 (Sugarcane)"
      />

      {/* Leak spray erupting on Zone 2 pipe when leak is active */}
      {z2?.leakSprayActive && (
        <group position={[2, 0.4, 4]}>
          <points ref={leakSprayRef} geometry={leakParticles.geometry}>
            <pointsMaterial
              color="#00E5FF"
              size={0.18}
              transparent
              opacity={0.85}
            />
          </points>
          {/* Warning Pulsing Ring */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 1.0, 24]} />
            <meshBasicMaterial color="#FF1744" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* ── Lateral Line to Zone 3 (Vegetables) ── */}
      <PipeBranch
        start={[1, 0.25, 12]}
        end={[19, 0.15, 4]}
        isActive={isPumpOn && (z3?.valveOpen ?? false)}
        valvePosition={[10, 0.35, 8]}
        zoneName="Zone 3 (Vegetables)"
      />

      {/* Micro-Drip Emitter Lines in each zone when irrigating */}
      {z1?.valveOpen && isPumpOn && <DripLaterals center={[-18, 0.1, -5]} size={[16, 24]} />}
      {z2?.valveOpen && isPumpOn && <DripLaterals center={[3, 0.1, -8]} size={[14, 22]} />}
      {z3?.valveOpen && isPumpOn && <DripLaterals center={[19, 0.1, 4]} size={[12, 20]} />}
    </group>
  );
};

const DripLaterals: React.FC<{ center: [number, number, number]; size: [number, number] }> = ({ center, size }) => {
  const lines = useMemo(() => {
    const arr: [number, number, number][] = [];
    const step = 4;
    for (let x = center[0] - size[0] / 2; x <= center[0] + size[0] / 2; x += step) {
      arr.push([x, center[1], center[2]]);
    }
    return arr;
  }, [center, size]);

  return (
    <group>
      {lines.map((pos, idx) => (
        <mesh key={idx} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, size[1], 8]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00B0FF"
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

const PipeBranch: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  isActive: boolean;
  valvePosition: [number, number, number];
  zoneName: string;
}> = ({ start, end, isActive, valvePosition, zoneName }) => {
  const { setSelectedObject } = useSimStore();

  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <group>
      {/* Pipe Cylinder */}
      <mesh
        position={[midX, 0.2, midZ]}
        rotation={[0, -angle + Math.PI / 2, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.12, 0.12, length, 14]} />
        <meshStandardMaterial
          color={isActive ? '#00E5FF' : '#455A64'}
          roughness={0.3}
          metalness={0.6}
          emissive={isActive ? '#00B0FF' : '#000000'}
          emissiveIntensity={isActive ? 0.7 : 0}
        />
      </mesh>

      {/* Solenoid Zone Valve & Flow Meter Node */}
      <group
        position={valvePosition}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject({
            id: `valve_${zoneName}`,
            type: 'actuator',
            title: `12V Solenoid Zone Valve & Flow Sensor (${zoneName})`,
            subtitle: 'Pilot-operated diaphragm valve with inline pulse hall-sensor',
            specs: [
              { label: 'Voltage', value: '12V DC Relay-Driven' },
              { label: 'Flow Meter', value: 'YF-S201 (450 pulses/L)' },
              { label: 'State', value: isActive ? 'VALVE OPEN (Flowing)' : 'VALVE CLOSED (Isolated)' },
              { label: 'Response', value: '< 100 ms' },
            ],
            liveStatus: isActive ? 'Water flowing at ~600 L/min' : 'Line static / pressurized',
            description: 'Individual zone control valve managed by the ESP32 edge relay bank. Equipped with inline YF-S201 flow sensor to verify water movement and detect burst leaks.',
          });
        }}
      >
        {/* Brass Valve Body */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#FFA000" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Solenoid Coil Cylinder */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.3, 12]} />
          <meshStandardMaterial color="#212121" roughness={0.4} />
        </mesh>
        {/* Status Indicator LED */}
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color={isActive ? '#00E676' : '#757575'} />
        </mesh>
      </group>
    </group>
  );
};
