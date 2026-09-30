/**
 * src/three/Sensors.tsx
 * Physical sensor nodes placed across farm zones with floating 3D labels
 * and click-to-inspect specification popups.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import { useSimStore } from '@/store/useSim';

export const Sensors: React.FC = () => {
  const { snapshot, setSelectedObject } = useSimStore();

  const z1 = snapshot.zones.find((z) => z.id === 'z1');
  const z2 = snapshot.zones.find((z) => z.id === 'z2');
  const z3 = snapshot.zones.find((z) => z.id === 'z3');

  return (
    <group>
      {/* ── 1. Zone 1: FC-28 Soil Moisture Sensor Node ── */}
      <SoilProbeNode
        position={[-16, 0, -2]}
        zoneName="Zone 1 (Wheat)"
        moisturePct={z1?.soilMoisturePct ?? 28}
        isDrifting={z1?.sensors.soilMoistureSensor.isDrifting ?? false}
        onClick={() => {
          setSelectedObject({
            id: 'sensor_fc28_z1',
            type: 'sensor',
            title: 'FC-28 Soil Moisture Sensor Probe (Zone 1)',
            subtitle: 'Capacitive/Resistive in-situ soil moisture transducer',
            specs: [
              { label: 'Operating Voltage', value: '3.3V / 5V DC' },
              { label: 'Signal Output', value: '0 - 3.3V Analog (ADC)' },
              { label: 'Measurement', value: `${(z1?.soilMoisturePct ?? 28).toFixed(1)}% Volumetric` },
              { label: 'Calibration', value: 'Dry (0%) - Sat (45%)' },
            ],
            liveStatus: 'Probe Nominal · Reading every 10s',
            description: 'Embedded directly into the wheat root zone (depth 20cm). Feeds real-time soil hydration data to the local ESP32 ADC channel.',
          });
        }}
      />

      {/* ── 2. Zone 2: FC-28 Soil Probe ── */}
      <SoilProbeNode
        position={[5, 0, -6]}
        zoneName="Zone 2 (Sugarcane)"
        moisturePct={z2?.soilMoisturePct ?? 32}
        isDrifting={z2?.sensors.soilMoistureSensor.isDrifting ?? false}
        onClick={() => {
          setSelectedObject({
            id: 'sensor_fc28_z2',
            type: 'sensor',
            title: 'FC-28 Soil Moisture Sensor Probe (Zone 2)',
            subtitle: 'Deep root zone moisture probe',
            specs: [
              { label: 'Operating Voltage', value: '3.3V DC' },
              { label: 'Depth', value: '35 cm Root Bed' },
              { label: 'Reading', value: `${(z2?.soilMoisturePct ?? 32).toFixed(1)}%` },
              { label: 'Health', value: '98% Optimal' },
            ],
            liveStatus: 'Active Telemetry Uplink Nominal',
            description: 'Monitors moisture absorption in dense sugarcane root beds to prevent water logging and nitrate leaching.',
          });
        }}
      />

      {/* ── 3. Zone 3: FC-28 Soil Probe (Target for Drift Scenario) ── */}
      <SoilProbeNode
        position={[20, 0, 6]}
        zoneName="Zone 3 (Vegetables)"
        moisturePct={z3?.soilMoisturePct ?? 25}
        isDrifting={z3?.sensors.soilMoistureSensor.isDrifting ?? false}
        onClick={() => {
          setSelectedObject({
            id: 'sensor_fc28_z3',
            type: 'sensor',
            title: 'FC-28 Soil Moisture Sensor (Zone 3)',
            subtitle: 'Vegetable micro-bed capacitive probe',
            specs: [
              { label: 'Voltage', value: '3.3V DC' },
              { label: 'Reading', value: `${(z3?.soilMoisturePct ?? 25).toFixed(1)}%` },
              { label: 'Drift Flag', value: z3?.sensors.soilMoistureSensor.isDrifting ? '⚠ DRIFT DETECTED' : 'Nominal' },
              { label: 'AI Validation', value: z3?.sensors.soilMoistureSensor.isDrifting ? 'Fallback to ETc' : 'Active' },
            ],
            liveStatus: z3?.sensors.soilMoistureSensor.isDrifting ? '⚠ Sensor Fault Flagged by Anomaly Model' : 'Probe Nominal',
            description: 'Capacitive probe in vegetable root zone. Cross-validated against ETc evapotranspiration rates to isolate corrosion drift.',
          });
        }}
      />

      {/* ── 4. Weather Mast (DHT22 Temp & Humidity Sensor) ── */}
      <group
        position={[-12, 0, 14]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject({
            id: 'sensor_dht22',
            type: 'sensor',
            title: 'DHT22 Digital Temperature & Humidity Sensor',
            subtitle: 'High-precision capacitive humidity & thermistor station',
            specs: [
              { label: 'Temp Range', value: '-40 to 80°C (±0.5°C)' },
              { label: 'Humidity Range', value: '0-100% RH (±2% RH)' },
              { label: 'Current Temp', value: `${snapshot.weather.tmean.toFixed(1)} °C` },
              { label: 'Current Humidity', value: `${snapshot.weather.humidity} %` },
            ],
            liveStatus: 'Weather station transmitting live ET₀ inputs',
            description: 'Supplies real-time ambient parameters to compute reference evapotranspiration (ET₀) via the Hargreaves equation.',
          });
        }}
      >
        {/* Metal Mast Pole */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 3.6, 12]} />
          <meshStandardMaterial color="#B0BEC5" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Sensor Housing Box */}
        <mesh position={[0, 3.4, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#ECEFF1" roughness={0.4} />
        </mesh>
        {/* Mini Anemometer Cups */}
        <mesh position={[0, 3.7, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.05, 8]} />
          <meshStandardMaterial color="#37474F" />
        </mesh>

        {/* 3D Label */}
        <Html position={[0, 4.2, 0]} center distanceFactor={25}>
          <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[10px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
            🌤 {snapshot.weather.tmean.toFixed(1)}°C · {snapshot.weather.humidity}% RH
          </div>
        </Html>
      </group>
    </group>
  );
};

const SoilProbeNode: React.FC<{
  position: [number, number, number];
  zoneName: string;
  moisturePct: number;
  isDrifting: boolean;
  onClick: () => void;
}> = ({ position, zoneName, moisturePct, isDrifting, onClick }) => {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Probe PCB stuck into soil */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.8, 0.03]} />
        <meshStandardMaterial color={isDrifting ? '#D32F2F' : '#1565C0'} />
      </mesh>
      {/* Top connector collar */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.06]} />
        <meshStandardMaterial color="#212121" />
      </mesh>

      {/* Floating 3D Badge */}
      <Html position={[0, 1.2, 0]} center distanceFactor={22}>
        <div className={`px-2 py-1 rounded-lg border shadow-xl text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
          isDrifting
            ? 'bg-red-950/90 border-red-500 text-red-300 animate-bounce'
            : 'bg-emerald-950/85 border-emerald-500/40 text-emerald-300'
        }`}>
          {isDrifting ? '⚠ DRIFT: ' : '💧 '}{moisturePct.toFixed(1)}%
        </div>
      </Html>
    </group>
  );
};
