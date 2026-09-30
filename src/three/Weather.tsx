/**
 * src/three/Weather.tsx
 * Dynamic Sky system, diurnal sun movement, procedural clouds, and responsive precipitation.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/store/useSim';

export const Weather: React.FC = () => {
  const { snapshot } = useSimStore();
  const rainRef = useRef<THREE.Points>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  const { weather } = snapshot;
  const hour = weather.hourOfDay; // 0..24

  // Sun position based on simulated time of day
  const sunElevation = Math.sin(((hour - 6) / 12) * Math.PI);
  const sunPosition: [number, number, number] = [
    Math.cos((hour / 24) * 2 * Math.PI) * 45,
    Math.max(4, sunElevation * 42),
    Math.sin((hour / 24) * 2 * Math.PI) * 45,
  ];

  // Procedural Rain Particles (active during rain scenarios)
  const rainData = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 65;
      pos[i * 3 + 1] = Math.random() * 38;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: geo, count };
  }, []);

  useFrame((_, delta) => {
    // Rain falling animation
    if (rainRef.current && (weather.isRaining || weather.rainMmH > 0)) {
      const posAttr = rainRef.current.geometry.attributes.position;
      for (let i = 0; i < rainData.count; i++) {
        let y = posAttr.getY(i) - 40 * delta;
        if (y < 0) y = 38;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // Clouds drifting slowly
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group>
      {/* ── Outdoor Sunlight Directional Light ── */}
      <directionalLight
        position={sunPosition}
        intensity={sunElevation > 0 ? 1.8 : 0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
        color={sunElevation < 0.2 ? '#FFB74D' : '#FFFDE7'}
      />

      {/* Hemisphere Natural Ambient Sky Light */}
      <hemisphereLight
        color="#E8F5E9"
        groundColor="#3E2723"
        intensity={sunElevation > 0 ? 0.75 : 0.35}
      />

      {/* Sun Sphere Mesh */}
      <mesh position={sunPosition}>
        <sphereGeometry args={[2.8, 16, 16]} />
        <meshBasicMaterial color="#FFF59D" />
      </mesh>

      {/* ── Procedural Drifting Clouds ── */}
      <group ref={cloudsRef} position={[0, 30, 0]}>
        <CloudCluster position={[-18, 0, -12]} scale={1.3} />
        <CloudCluster position={[20, 2, 10]} scale={1.6} />
        <CloudCluster position={[2, -1, 24]} scale={1.2} />
        <CloudCluster position={[-10, 3, 20]} scale={1.4} />
      </group>

      {/* ── Falling Rain Particles ── */}
      {(weather.isRaining || weather.rainMmH > 0) && (
        <points ref={rainRef} geometry={rainData.geometry}>
          <pointsMaterial
            color="#81D4FA"
            size={0.14}
            transparent
            opacity={0.75}
          />
        </points>
      )}
    </group>
  );
};

const CloudCluster: React.FC<{ position: [number, number, number]; scale: number }> = ({ position, scale }) => {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[3.2, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.88} />
      </mesh>
      <mesh position={[2.4, -0.3, 0]}>
        <sphereGeometry args={[2.4, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.88} />
      </mesh>
      <mesh position={[-2.2, -0.2, 0.6]}>
        <sphereGeometry args={[2.6, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.88} />
      </mesh>
    </group>
  );
};
