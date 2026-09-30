/**
 * src/three/PumpHouse.tsx
 * Pump house with water storage tank, heavy 3-phase pump, motor contactor,
 * and ESP32 Edge Gateway enclosure with X-Ray cutaway capability.
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSimStore } from '@/store/useSim';

export const PumpHouse: React.FC = () => {
  const { snapshot, xrayPumpHouse, toggleXrayPumpHouse, setSelectedObject } = useSimStore();
  const tankWaterRef = useRef<THREE.Mesh>(null);
  const pumpImpellerRef = useRef<THREE.Group>(null);

  const tankFraction = snapshot.tank.levelFraction;
  const isPumpOn = snapshot.pump.isOn;

  // Spin pump rotor when pump is ON
  useFrame((_, delta) => {
    if (pumpImpellerRef.current && isPumpOn) {
      pumpImpellerRef.current.rotation.z += delta * 25;
    }
  });

  return (
    <group position={[-2, 0, 18]}>
      {/* ── 1. Water Storage Reservoir Tank ── */}
      <group position={[-6, 0, 0]}>
        {/* Concrete Foundation */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <cylinderGeometry args={[3.2, 3.4, 0.4, 32]} />
          <meshStandardMaterial color="#78909C" roughness={0.9} />
        </mesh>

        {/* Tank Cylindrical Wall (translucent to see water level) */}
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.8, 2.8, 4.2, 32, 1, true]} />
          <meshStandardMaterial
            color="#37474F"
            roughness={0.4}
            metalness={0.3}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Tank Roof */}
        <mesh position={[0, 4.7, 0]} castShadow>
          <coneGeometry args={[3.0, 0.8, 32]} />
          <meshStandardMaterial color="#263238" roughness={0.7} />
        </mesh>

        {/* Animated Water Level Cylinder */}
        <mesh
          ref={tankWaterRef}
          position={[0, 0.4 + (4.0 * tankFraction) / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedObject({
              id: 'reservoir_tank',
              type: 'actuator',
              title: '50,000L Farm Groundwater Reservoir',
              subtitle: 'Borewell buffer & rainwater harvesting tank',
              specs: [
                { label: 'Capacity', value: '50,000 Litres' },
                { label: 'Current Level', value: `${(tankFraction * 100).toFixed(0)}% (${Math.round(snapshot.tank.currentLevelL)} L)` },
                { label: 'Inflow Recharge', value: '80 L/min' },
                { label: 'Scarcity Mode', value: snapshot.tank.isScarcityMode ? 'ACTIVE (<20%)' : 'Standby' },
              ],
              liveStatus: snapshot.tank.isScarcityMode ? '⚠ Low Storage — Prioritising Zone 1' : 'Storage Normal',
              description: 'Primary water reservoir fed by farm borewell. Automatically triggers scarcity mode prioritization when storage drops below 20%.',
            });
          }}
        >
          <cylinderGeometry args={[2.75, 2.75, Math.max(0.2, 4.0 * tankFraction), 32]} />
          <meshStandardMaterial
            color="#29B6F6"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* ── 2. Pump House Building ── */}
      <group position={[2, 0, 0]}>
        {/* Concrete Slab Floor */}
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[5, 0.3, 4.5]} />
          <meshStandardMaterial color="#9E9E9E" roughness={0.9} />
        </mesh>

        {/* Walls & Roof (Hidden or translucent in X-Ray mode) */}
        {!xrayPumpHouse && (
          <group>
            {/* Main Brick / Plaster Walls */}
            <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.6, 2.7, 4.1]} />
              <meshStandardMaterial color="#CFD8DC" roughness={0.8} />
            </mesh>
            {/* Pitched Roof */}
            <mesh position={[0, 3.4, 0]} castShadow>
              <coneGeometry args={[3.8, 1.2, 4]} />
              <meshStandardMaterial color="#D32F2F" roughness={0.7} />
            </mesh>
            {/* Wooden Door */}
            <mesh position={[0, 1.3, 2.06]} castShadow>
              <boxGeometry args={[1.2, 2.2, 0.08]} />
              <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* X-Ray Cutaway Frame (Visible when X-Ray is ON) */}
        {xrayPumpHouse && (
          <group>
            {/* Wireframe boundary */}
            <lineSegments position={[0, 1.65, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(4.6, 2.7, 4.1)]} />
              <lineBasicMaterial color="#10B981" linewidth={2} />
            </lineSegments>
          </group>
        )}

        {/* ── 3. Internal Hardware Machinery ── */}
        
        {/* Centrifugal Water Pump (3.7 kW / 5 HP) */}
        <group
          position={[-1, 0.6, 0]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedObject({
              id: 'pump_machinery',
              type: 'actuator',
              title: '5 HP (3.7 kW) Centrifugal Irrigation Pump',
              subtitle: 'Submersible suction with 3-phase induction motor',
              specs: [
                { label: 'Rated Power', value: '3.7 kW (5 HP)' },
                { label: 'Flow Capacity', value: '600 Litres/min' },
                { label: 'Current Draw', value: `${snapshot.pump.currentA.toFixed(1)} A` },
                { label: 'Motor Health', value: snapshot.pump.pumpFault ? 'TRIPPED / FAULT' : 'Healthy' },
              ],
              liveStatus: snapshot.pump.isOn ? '⚡ Motor Running (1440 RPM)' : 'Motor Idle',
              description: 'High-volume pump delivering water to zone manifolds. Equipped with ACS712 current sensing for instant sub-second dry-run cutoff.',
            });
          }}
        >
          {/* Pump Motor Casing */}
          <mesh castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 1.1, 16]} />
            <meshStandardMaterial color={isPumpOn ? '#1E88E5' : '#455A64'} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Volute / Impeller housing */}
          <group ref={pumpImpellerRef} position={[0, 0, 0.7]}>
            <mesh castShadow>
              <torusGeometry args={[0.4, 0.15, 12, 24]} />
              <meshStandardMaterial color="#37474F" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          {/* Pressure Gauge */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </group>

        {/* ── 4. ESP32 Field Enclosure (IP65 Panel) ── */}
        <group
          position={[1.2, 1.4, -1.2]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedObject({
              id: 'esp32_gateway',
              type: 'controller',
              title: 'AgriSense ESP32 Edge Gateway & Safety Box',
              subtitle: 'Custom dual-core embedded edge controller',
              specs: [
                { label: 'MCU', value: 'ESP32 Dual-Core 240MHz' },
                { label: 'Cellular Modem', value: 'SIM800L 2G/GSM' },
                { label: 'Local Storage', value: 'MicroSD SPI 16GB' },
                { label: 'Backup Battery', value: '18650 Li-Ion 3.7V (98%)' },
                { label: 'Safety Tripping', value: '< 2.0 Seconds Local' },
              ],
              liveStatus: snapshot.esp32.connectivity === 'online' ? 'MQTT Cloud Synced (0 ms buffer)' : 'LOCAL OFFLINE HYSTERESIS ACTIVE',
              description: 'Dual-core ESP32 executes safety interlocks independently of cloud connectivity. Queues telemetry to MicroSD buffer during outages and transmits critical SMS via SIM800L.',
            });
          }}
        >
          {/* Enclosure Box */}
          <mesh castShadow>
            <boxGeometry args={[1.0, 1.2, 0.4]} />
            <meshStandardMaterial
              color="#2E7D32"
              roughness={0.3}
              transparent={xrayPumpHouse}
              opacity={xrayPumpHouse ? 0.3 : 1.0}
            />
          </mesh>

          {/* Detailed Internal Circuit Components (Visible inside) */}
          <group position={[0, 0, 0.05]}>
            {/* ESP32 PCB (Blue board) */}
            <mesh position={[-0.2, 0.2, 0]}>
              <boxGeometry args={[0.3, 0.45, 0.04]} />
              <meshStandardMaterial color="#0D47A1" />
            </mesh>
            {/* SIM800L Modem (Red PCB) */}
            <mesh position={[0.2, 0.2, 0]}>
              <boxGeometry args={[0.25, 0.3, 0.04]} />
              <meshStandardMaterial color="#C62828" />
            </mesh>
            {/* 4-Channel Relay Module (Blue cubes) */}
            <mesh position={[-0.2, -0.25, 0]}>
              <boxGeometry args={[0.35, 0.3, 0.06]} />
              <meshStandardMaterial color="#1565C0" />
            </mesh>
            {/* 18650 Li-Ion Battery Cylinder */}
            <mesh position={[0.2, -0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
              <meshStandardMaterial color="#00C853" />
            </mesh>
            {/* Flashing Status LED */}
            <mesh position={[0, 0.45, 0.2]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshBasicMaterial color={snapshot.esp32.connectivity === 'online' ? '#00E676' : '#FFD600'} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
