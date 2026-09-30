/**
 * src/three/Farmer.tsx
 * Low-poly stylized Indian farmer avatar holding a smartphone with live alert notifications.
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSimStore } from '@/store/useSim';
import { Smartphone, Bell } from 'lucide-react';

export const Farmer: React.FC = () => {
  const { snapshot, setSelectedObject } = useSimStore();
  const phoneGlowRef = useRef<THREE.PointLight>(null);

  const hasSms = snapshot.alerts.some((a) => a.type === 'sms');
  const latestAlert = snapshot.alerts[0];

  return (
    <group
      position={[-12, 0, 20]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedObject({
          id: 'farmer_avatar',
          type: 'avatar',
          title: 'Farmer User Node (Kisan Interface)',
          subtitle: 'Mobile application interface (Marathi / Hindi / English)',
          specs: [
            { label: 'Network', value: '4G LTE / 2G SMS Backup' },
            { label: 'Language', value: 'Multilingual Voice/Text' },
            { label: 'Last SMS', value: hasSms ? 'Received Dry-Run Alert' : 'No Critical Alerts' },
            { label: 'Manual Control', value: 'Full Override Authority' },
          ],
          liveStatus: 'Connected via AgriSense Farmer Mobile Application',
          description: 'Represents the smallholder farmer accessing real-time soil advisories, water savings metrics, and receiving fail-safe SMS notifications during power or cellular network drops.',
        });
      }}
    >
      {/* ── Low-poly Farmer Geometry ── */}
      
      {/* Legs (Dhoti / Trousers) */}
      <mesh position={[-0.15, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.9, 8]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>
      <mesh position={[0.15, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.9, 8]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>

      {/* Torso (Traditional Kurta) */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.75, 0.3]} />
        <meshStandardMaterial color="#FF9800" roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>

      {/* Turban / Pheta */}
      <mesh position={[0, 2.02, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.22, 0.18, 12]} />
        <meshStandardMaterial color="#D84315" roughness={0.8} />
      </mesh>

      {/* Right Arm holding phone forward */}
      <mesh position={[0.3, 1.35, 0.25]} rotation={[Math.PI / 4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
        <meshStandardMaterial color="#FF9800" />
      </mesh>

      {/* Smartphone in hand */}
      <group position={[0.3, 1.5, 0.45]} rotation={[-Math.PI / 6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.22, 0.02]} />
          <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Glowing Screen */}
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.1, 0.18]} />
          <meshBasicMaterial color="#00E676" />
        </mesh>
        <pointLight ref={phoneGlowRef} color="#00E676" intensity={0.5} distance={1.5} />
      </group>

      {/* Floating Notification Speech Bubble above Farmer */}
      <Html position={[0, 2.6, 0]} center distanceFactor={20}>
        <div className="flex flex-col items-center pointer-events-none">
          {latestAlert ? (
            <div className="bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-500/40 shadow-2xl text-[11px] text-white flex items-center gap-1.5 whitespace-nowrap animate-bounce">
              <span className="text-emerald-400 font-bold">📲</span>
              <span className="font-semibold">{latestAlert.title}</span>
            </div>
          ) : (
            <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[10px] text-emerald-300 font-semibold shadow-lg whitespace-nowrap">
              🌾 Kisan App Synced
            </div>
          )}
          {/* Bubble tail */}
          <div className="w-2 h-2 bg-black/90 rotate-45 -mt-1 border-r border-b border-white/20" />
        </div>
      </Html>
    </group>
  );
};
