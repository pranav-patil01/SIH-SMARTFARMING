/**
 * src/sim/network.ts
 * Network communication, MQTT telemetry pipeline, and SMS fallback simulator.
 *
 * Packet Colors:
 * - Uplink (Sensors/ESP32 -> Cloud): Blue (#2F80ED)
 * - Downlink (Cloud Decision -> ESP32): Orange (#F2994A)
 * - Safety Alert (ESP32 -> Cloud/App): Red (#EB5757)
 * - SMS Fallback (SIM800L -> GSM -> Farmer): Purple (#9B51E0)
 * - Feedback Loop (ESP32 -> ML Retrain): Green (#27AE60)
 */

import { DataPacket, AlertItem } from './types';

export const PACKET_COLORS = {
  uplink: '#2F80ED',
  downlink: '#F2994A',
  alert: '#EB5757',
  sms: '#9B51E0',
  feedback: '#27AE60',
} as const;

let packetCounter = 0;

export function createDataPacket(
  type: DataPacket['type'],
  source: DataPacket['source'],
  target: DataPacket['target'],
  payload: Record<string, any>,
  pathId: string = 'sensor_to_cloud'
): DataPacket {
  packetCounter++;
  return {
    id: `pkt-${Date.now()}-${packetCounter}`,
    type,
    color: PACKET_COLORS[type],
    source,
    target,
    payload,
    progress: 0,
    speed: 0.025, // progress increment per frame
    pathId,
    active: true,
  };
}

export function updatePackets(packets: DataPacket[]): DataPacket[] {
  return packets
    .map((p) => {
      const nextProgress = p.progress + p.speed;
      return {
        ...p,
        progress: nextProgress,
        active: nextProgress < 1.0,
      };
    })
    .filter((p) => p.active);
}

export function createSmsAlertItem(
  message: string,
  simMinute: number,
  category: AlertItem['category'] = 'offline'
): AlertItem {
  return {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    simMinute,
    type: 'sms',
    category,
    title: '📲 SIM800L SMS Sent to Farmer',
    message,
    acknowledged: false,
  };
}
