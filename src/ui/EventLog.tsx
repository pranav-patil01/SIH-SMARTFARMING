/**
 * src/ui/EventLog.tsx
 * Real-time event log, alert history, and hardware interrupt timeline.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { 
  Bell, AlertTriangle, Droplets, Zap, WifiOff, MessageSquare, CheckCircle2, X
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

export const EventLog: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { snapshot } = useSimStore();

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'dry_run': return <Zap className="w-4 h-4 text-red-400" />;
      case 'leak': return <Droplets className="w-4 h-4 text-red-400" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-amber-400" />;
      case 'sensor_drift': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-3 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">
            System Event &amp; Safety Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono">
            {snapshot.alerts.length} Events
          </span>
          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1 rounded-lg bg-black/40 text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {snapshot.alerts.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-10 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span>All hardware systems nominal. No safety faults triggered.</span>
          </div>
        ) : (
          snapshot.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-2xl border text-xs flex flex-col gap-1 transition-all ${
                alert.type === 'critical'
                  ? 'bg-red-950/40 border-red-500/40 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                  : alert.type === 'sms'
                  ? 'bg-purple-950/40 border-purple-500/40 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                  : alert.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-black/30 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.category)}
                  <span className={alert.type === 'critical' ? 'text-red-300' : 'text-gray-100'}>
                    {alert.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-gray-400">
                  {alert.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 pl-6">
                {alert.message}
              </p>
              {alert.type === 'sms' && (
                <div className="pl-6 pt-1 flex items-center gap-1.5 text-[10px] text-purple-300 font-semibold">
                  <MessageSquare className="w-3 h-3 text-purple-400" />
                  <span>SIM800L GSM Network · Acknowledged by Farmer Phone</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
