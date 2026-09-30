/**
 * src/three/CloudIsland.tsx
 * Floating Cloud Platform "Server Island" in the sky visualizing the backend:
 * - MQTT Broker Node (EMQX / Mosquitto)
 * - ET₀ Evapotranspiration Calculator (Hargreaves / Penman–Monteith)
 * - Decision & Scheduling Engine
 * - AI/ML Predictive & Anomaly Model
 * - TimescaleDB & PostgreSQL Telemetry Store
 * - Alert & SMS Notification Dispatcher
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSimStore } from '@/store/useSim';

export const CloudIsland: React.FC = () => {
  const { snapshot, setSelectedObject } = useSimStore();
  const islandRef = useRef<THREE.Group>(null);

  // Floating gentle bobbing
  useFrame(({ clock }) => {
    if (islandRef.current) {
      islandRef.current.position.y = 18 + Math.sin(clock.getElapsedTime() * 0.8) * 0.5;
    }
  });

  const step = snapshot.cloudStepIndex;

  return (
    <group ref={islandRef} position={[20, 18, -20]}>
      {/* ── Island Base Platform (Floating Glassmorphism Polygonal Base) ── */}
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject({
            id: 'cloud_platform',
            type: 'cloud',
            title: 'AgriSense Autonomous Cloud Platform',
            subtitle: 'Scalable Microservices Architecture for Smart India Hackathon',
            specs: [
              { label: 'MQTT Ingestion', value: 'EMQX Cluster (< 20ms)' },
              { label: 'ET₀ Math Engine', value: 'Hargreaves / FAO-56' },
              { label: 'Time-Series DB', value: 'TimescaleDB / Postgres' },
              { label: 'Predictive ML', value: 'Lightweight Regression' },
            ],
            liveStatus: 'Cloud Services Operational · 99.9% Uptime',
            description: 'Receives field telemetry over MQTT, computes daily crop water deficits from weather feeds, runs AI anomaly detection, and sends optimized downlink valve commands.',
          });
        }}
      >
        <cylinderGeometry args={[7, 5, 1.5, 8]} />
        <meshStandardMaterial
          color="#0F2814"
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Island Glowing Trim */}
      <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.8, 7.1, 8]} />
        <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} />
      </mesh>

      {/* Floating 3D Title */}
      <Html position={[0, 4.5, 0]} center distanceFactor={30}>
        <div className="bg-black/90 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-500/40 text-xs font-bold text-emerald-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>☁ AgriSense Cloud Brain</span>
        </div>
      </Html>

      {/* ── Server Rack Modules ── */}

      {/* 1. MQTT Broker Rack */}
      <ServerRack
        position={[-3.5, 1.4, -1]}
        name="MQTT Broker"
        subtitle="EMQX Ingest"
        isActive={step === 2 || step === 5}
        color="#2F80ED"
        onClick={() => {
          setSelectedObject({
            id: 'mod_mqtt',
            type: 'cloud',
            title: 'MQTT Broker Cluster (EMQX)',
            subtitle: 'Ultra-low bandwidth IoT Telemetry Pipeline',
            specs: [
              { label: 'Protocol', value: 'MQTT v5.0 / TLS' },
              { label: 'Throughput', value: '10,000 msg/sec' },
              { label: 'Topic (Uplink)', value: 'agrisense/farm1/telemetry' },
              { label: 'Topic (Downlink)', value: 'agrisense/farm1/command' },
            ],
            liveStatus: 'Active Broker · Streaming JSON Telemetry',
            description: 'Handles lightweight telemetry packets from field ESP32 nodes and publishes actuation commands back to zone solenoids.',
          });
        }}
      />

      {/* 2. ET0 & Agronomic Engine */}
      <ServerRack
        position={[-1.2, 1.4, -2.5]}
        name="ET₀ Calculator"
        subtitle="Hargreaves Math"
        isActive={step === 3}
        color="#F2B33D"
        onClick={() => {
          setSelectedObject({
            id: 'mod_et0',
            type: 'cloud',
            title: 'ET₀ Reference Evapotranspiration Engine',
            subtitle: 'Agronomic Water Balance Calculator',
            specs: [
              { label: 'Formula', value: 'Hargreaves-Samani (1985)' },
              { label: 'Latitude', value: '18.5°N (Pune)' },
              { label: 'ET₀ Value Today', value: `${snapshot.et0TodayMm.toFixed(2)} mm/day` },
              { label: 'Crop Kc Lookup', value: 'FAO-56 Table 12' },
            ],
            liveStatus: 'Computing dynamic ETc = ET₀ × Kc',
            description: 'Calculates the atmospheric evaporative demand using solar radiation and temperature variance to estimate exact millimetres of crop water consumption.',
          });
        }}
      />

      {/* 3. Decision & Scheduling Engine */}
      <ServerRack
        position={[1.5, 1.4, -2.5]}
        name="Decision Engine"
        subtitle="Zone Scheduler"
        isActive={step === 4}
        color="#10B981"
        onClick={() => {
          setSelectedObject({
            id: 'mod_decision',
            type: 'cloud',
            title: 'Autonomous Irrigation Decision Engine',
            subtitle: 'Multi-variable priority and rainfall gatekeeper',
            specs: [
              { label: 'Rain Gatekeeper', value: 'Skip if P(rain) > 60%' },
              { label: 'Scarcity Logic', value: 'Vulnerability Ranking' },
              { label: 'Resolution', value: 'Zone-by-zone' },
              { label: 'Downlink Delay', value: '< 200 ms' },
            ],
            liveStatus: snapshot.latestDecision?.overallReason || 'Evaluating rules',
            description: 'Transparent rule-based scheduler that checks rainfall forecasts, tank level, and soil deficit to make water-conserving decisions.',
          });
        }}
      />

      {/* 4. AI/ML Predictor & Anomaly Detector */}
      <ServerRack
        position={[3.5, 1.4, -1]}
        name="AI / ML Engine"
        subtitle="Anomaly & 6h Forecast"
        isActive={step === 3 || step === 7}
        color="#9B51E0"
        onClick={() => {
          setSelectedObject({
            id: 'mod_ml',
            type: 'cloud',
            title: 'AI / Machine Learning Intelligence Layer',
            subtitle: 'Soil moisture trend forecasting & anomaly detection',
            specs: [
              { label: 'Model Type', value: 'Linear / Gradient Boost' },
              { label: 'Prediction Horizon', value: 'Next 6 Hours' },
              { label: 'Anomaly Scope', value: 'Sensor Drift / Pipe Burst' },
              { label: 'Confidence Score', value: '94% Confidence' },
            ],
            liveStatus: 'Model active · Continuous feature validation',
            description: 'Predicts future soil depletion and cross-validates live flow vs current readings to immediately flag burst pipes or corroded sensors.',
          });
        }}
      />

      {/* 5. TimescaleDB Store */}
      <ServerRack
        position={[0, 1.4, 1.8]}
        name="TimescaleDB"
        subtitle="Time-Series DB"
        isActive={step === 6}
        color="#00E5FF"
        onClick={() => {
          setSelectedObject({
            id: 'mod_db',
            type: 'cloud',
            title: 'TimescaleDB & PostgreSQL Storage',
            subtitle: 'High-compression historical telemetry store',
            specs: [
              { label: 'Engine', value: 'PostgreSQL + TimescaleDB' },
              { label: 'Data Retention', value: '3 Years Continuous' },
              { label: 'Aggregation', value: 'Hypertable Rollups' },
              { label: 'Sync State', value: 'Replaying offline buffer' },
            ],
            liveStatus: 'Recording 24-hour historical trend lines',
            description: 'Stores sensor records, irrigation events, and energy consumption for seasonal benchmarking and agronomic reporting.',
          });
        }}
      />
    </group>
  );
};

const ServerRack: React.FC<{
  position: [number, number, number];
  name: string;
  subtitle: string;
  isActive: boolean;
  color: string;
  onClick: () => void;
}> = ({ position, name, subtitle, isActive, color, onClick }) => {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Rack Casing */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 2.2, 0.9]} />
        <meshStandardMaterial
          color="#1A202C"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Glowing Front Grille */}
      <mesh position={[0, 0, 0.46]}>
        <planeGeometry args={[1.2, 1.9]} />
        <meshStandardMaterial
          color={isActive ? color : '#2D3748'}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.8 : 0}
          roughness={0.2}
        />
      </mesh>

      {/* Floating Mini Tag */}
      <Html position={[0, 1.4, 0]} center distanceFactor={22}>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow cursor-pointer transition-all ${
          isActive
            ? 'bg-white text-black font-extrabold scale-110 shadow-lg'
            : 'bg-black/70 text-gray-300'
        }`}>
          {name}
        </div>
      </Html>
    </group>
  );
};
