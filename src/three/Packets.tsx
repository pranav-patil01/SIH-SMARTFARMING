/**
 * src/three/Packets.tsx
 * Animated glowing data packets traveling along Catmull-Rom curved splines:
 * - Uplink (Blue): Sensors/ESP32 -> Cloud
 * - Downlink (Orange): Cloud Decision -> ESP32
 * - SMS Fallback (Purple): ESP32 -> Farmer Phone
 * - Safety Alert (Red): Edge Interlock -> Cloud/App
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/store/useSim';
import { PACKET_COLORS } from '@/sim/network';

export const Packets: React.FC = () => {
  const { snapshot } = useSimStore();
  const isOnline = snapshot.esp32.connectivity === 'online';

  // Define 3D Catmull-Rom Spline Paths
  const { uplinkCurve, downlinkCurve, smsCurve } = useMemo(() => {
    // Uplink curve: from PumpHouse / ESP32 [3.2, 1.4, 16.8] to Cloud Island [18, 19, -19]
    const upPoints = [
      new THREE.Vector3(3.2, 1.4, 16.8),
      new THREE.Vector3(6, 12, 5),
      new THREE.Vector3(12, 18, -10),
      new THREE.Vector3(18, 19, -19),
    ];
    const upCurve = new THREE.CatmullRomCurve3(upPoints);

    // Downlink curve: from Cloud Island [22, 19, -21] back down to ESP32
    const downPoints = [
      new THREE.Vector3(22, 19, -21),
      new THREE.Vector3(15, 14, -5),
      new THREE.Vector3(8, 8, 8),
      new THREE.Vector3(3.2, 1.4, 16.8),
    ];
    const downCurve = new THREE.CatmullRomCurve3(downPoints);

    // SMS curve: from ESP32 [3.2, 1.4, 16.8] to Farmer Avatar [-12, 1.5, 20]
    const smsPoints = [
      new THREE.Vector3(3.2, 1.4, 16.8),
      new THREE.Vector3(-4, 4, 18),
      new THREE.Vector3(-12, 1.5, 20),
    ];
    const sCurve = new THREE.CatmullRomCurve3(smsPoints);

    return { uplinkCurve: upCurve, downlinkCurve: downCurve, smsCurve: sCurve };
  }, []);

  // Visual Path Tubes Geometry
  const uplinkTubeGeo = useMemo(() => new THREE.TubeGeometry(uplinkCurve, 40, 0.05, 8, false), [uplinkCurve]);
  const downlinkTubeGeo = useMemo(() => new THREE.TubeGeometry(downlinkCurve, 40, 0.05, 8, false), [downlinkCurve]);

  return (
    <group>
      {/* Visual Guide Wire Tubes */}
      <mesh geometry={uplinkTubeGeo}>
        <meshStandardMaterial
          color={isOnline ? '#2F80ED' : '#546E7A'}
          emissive={isOnline ? '#2F80ED' : '#000000'}
          emissiveIntensity={isOnline ? 0.3 : 0}
          transparent
          opacity={isOnline ? 0.4 : 0.15}
          wireframe={!isOnline}
        />
      </mesh>

      <mesh geometry={downlinkTubeGeo}>
        <meshStandardMaterial
          color={isOnline ? '#F2994A' : '#546E7A'}
          emissive={isOnline ? '#F2994A' : '#000000'}
          emissiveIntensity={isOnline ? 0.3 : 0}
          transparent
          opacity={isOnline ? 0.4 : 0.15}
          wireframe={!isOnline}
        />
      </mesh>

      {/* Animated Glowing Packet Meshes */}
      {snapshot.packets.map((pkt) => {
        const curve =
          pkt.type === 'sms'
            ? smsCurve
            : pkt.type === 'downlink'
            ? downlinkCurve
            : uplinkCurve;
        return <AnimatedPacket key={pkt.id} curve={curve} packet={pkt} />;
      })}
    </group>
  );
};

const AnimatedPacket: React.FC<{
  curve: THREE.CatmullRomCurve3;
  packet: any;
}> = ({ curve, packet }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && packet.active) {
      const point = curve.getPointAt(Math.min(1.0, packet.progress));
      meshRef.current.position.copy(point);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshBasicMaterial color={packet.color} />
      {/* Trailing glow halo */}
      <pointLight color={packet.color} intensity={1.5} distance={2.5} />
    </mesh>
  );
};
