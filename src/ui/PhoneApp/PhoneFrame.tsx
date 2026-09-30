/**
 * src/ui/PhoneApp/PhoneFrame.tsx
 * Farmer Mobile App Mockup Overlay in a sleek smartphone frame.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { useI18n } from '@/i18n';
import { 
  Calendar, Droplets, Zap, Sliders, FileText, 
  Wifi, WifiOff, Bell, Power, X
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

export const PhoneFrame: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    snapshot, phoneScreen, setPhoneScreen, manualOverrideZone 
  } = useSimStore();
  const { t } = useI18n();

  const isOnline = snapshot.esp32.connectivity === 'online';
  const isPumpOn = snapshot.pump.isOn;
  const activeZone = snapshot.zones.find((z) => z.valveOpen);

  return (
    <div className="w-full max-w-[285px] mx-auto h-[520px] bg-gray-900 border-4 border-gray-700 rounded-[32px] shadow-2xl p-2 flex flex-col relative overflow-hidden text-white select-none">
      {/* Phone Notch & Speaker */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-3 bg-black rounded-full z-30 flex items-center justify-center">
        <div className="w-6 h-1 bg-gray-700 rounded-full" />
      </div>

      {/* App Header Status Bar */}
      <div className="pt-3 px-3 pb-2 flex items-center justify-between text-[11px] border-b border-gray-800 bg-gray-950/90 rounded-t-[28px]">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-400">{t('phone.app_title')}</span>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-mono text-gray-300 text-[10px]">{snapshot.timeOfDayFormatted}</span>
          {onClose && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar bg-gradient-to-b from-gray-950 to-gray-900 text-xs">
        
        {/* SCREEN 1: TODAY'S RECOMMENDATION */}
        {phoneScreen === 'today' && (
          <div className="flex flex-col gap-2">
            <div className="bg-gradient-to-r from-emerald-900/80 to-teal-900/80 p-3 rounded-2xl border border-emerald-500/30 shadow">
              <div className="flex items-center justify-between text-[10px] text-emerald-200 font-semibold mb-1">
                <span>{t('phone.action_irrigate')}</span>
                <span className="bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300">
                  {isPumpOn ? 'IRRIGATING' : 'OPTIMAL'}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">
                {isPumpOn && activeZone
                  ? `Delivering ${activeZone.name.split('–')[1] || activeZone.name}`
                  : 'No Immediate Watering Needed'}
              </h4>
              <p className="text-[10px] text-gray-200 mt-1">
                {snapshot.latestDecision?.overallReason || 'Soil moisture is well balanced.'}
              </p>
            </div>

            {/* Weather Card */}
            <div className="bg-gray-800/60 p-2.5 rounded-xl border border-gray-700/50 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-gray-400">Pune Weather</span>
                <div className="text-xs font-bold text-gray-200">
                  {snapshot.weather.tmean.toFixed(1)}°C · {snapshot.weather.humidity}% RH
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400">Rain Prob. (24h)</span>
                <div className="text-xs font-bold text-blue-400">
                  {(snapshot.weather.rainForecastProb24h * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Zone Quick Overview */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-300 uppercase">Field Status</span>
              {snapshot.zones.map((z) => (
                <div key={z.id} className="bg-gray-800/40 p-2 rounded-xl border border-gray-700/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-200 text-[11px]">{z.name}</div>
                    <div className="text-[9px] text-gray-400">Stage: {z.cropStage}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-300 text-xs">{z.soilMoisturePct.toFixed(1)}%</div>
                    <div className="text-[9px] text-gray-400">Health: {(z.plantHealth * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 2: SAVINGS DASHBOARD */}
        {phoneScreen === 'savings' && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-xs text-emerald-400 uppercase">Resource Savings</h4>
            
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-2xl flex flex-col gap-0.5">
              <span className="text-[10px] text-emerald-300 font-semibold">Total Water Conserved</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {snapshot.baseline.waterSavedPct}%
              </div>
              <span className="text-[10px] text-gray-300">
                +{snapshot.baseline.waterSavedL.toLocaleString()} Litres saved
              </span>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-2xl flex flex-col gap-0.5">
              <span className="text-[10px] text-amber-300 font-semibold">Electricity Saved</span>
              <div className="text-xl font-bold font-mono text-yellow-400">
                {snapshot.baseline.energySavedPct}%
              </div>
              <span className="text-[10px] text-gray-300">
                +{snapshot.baseline.energySavedKwh} kWh saved
              </span>
            </div>
          </div>
        )}

        {/* SCREEN 3: ZONES */}
        {phoneScreen === 'zones' && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-xs text-gray-200 uppercase">Field Sub-Zones</h4>
            {snapshot.zones.map((z) => (
              <div key={z.id} className="bg-gray-800/60 p-2 rounded-xl border border-gray-700/40 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{z.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                    z.valveOpen ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {z.valveOpen ? 'VALVE OPEN' : 'VALVE CLOSED'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-300 font-mono">
                  <span>Moisture: {z.soilMoisturePct.toFixed(1)}%</span>
                  <span>Today: {Math.round(z.waterAppliedTodayL)} L</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (z.soilMoisturePct / 40) * 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 4: ALERTS */}
        {phoneScreen === 'alerts' && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-xs text-gray-200 uppercase">System Logs &amp; SMS</h4>
            {snapshot.alerts.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-xs">No active alerts. System nominal.</div>
            ) : (
              snapshot.alerts.slice(0, 4).map((a) => (
                <div key={a.id} className={`p-2 rounded-xl border text-[10px] flex flex-col gap-0.5 ${
                  a.type === 'critical' ? 'bg-red-950/40 border-red-500/40 text-red-200' :
                  a.type === 'sms' ? 'bg-purple-950/40 border-purple-500/40 text-purple-200' :
                  'bg-gray-800/50 border-gray-700 text-gray-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{a.title}</span>
                    <span className="text-[8px] font-mono text-gray-400">{a.timestamp}</span>
                  </div>
                  <p className="text-[10px] text-gray-300">{a.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* SCREEN 5: MANUAL CONTROL */}
        {phoneScreen === 'control' && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-xs text-gray-200 uppercase">Manual Valve Override</h4>
            <div className="bg-amber-950/30 border border-amber-500/30 p-2 rounded-xl text-[9px] text-amber-200">
              ⚠ Edge safety monitoring (Dry-run &amp; Burst protection) remains fully active.
            </div>
            {snapshot.zones.map((z) => (
              <div key={z.id} className="bg-gray-800/60 p-2 rounded-xl border border-gray-700/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[11px]">{z.name}</div>
                  <div className="text-[9px] text-gray-400">{z.soilMoisturePct.toFixed(1)}% moisture</div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    manualOverrideZone(z.id, !z.valveOpen);
                  }}
                  className={`px-3 py-1 rounded-xl font-bold text-xs shadow transition active:scale-95 ${
                    z.valveOpen
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {z.valveOpen ? 'Stop' : 'Water'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SCREEN 6: REPORTS */}
        {phoneScreen === 'reports' && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-xs text-gray-200 uppercase">Agronomic Summary</h4>
            <div className="bg-gray-800/50 p-2.5 rounded-xl border border-gray-700 text-[10px] flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Water Today:</span>
                <span className="font-bold font-mono text-emerald-300">{snapshot.totalWaterAppliedTodayL.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pump Running Time:</span>
                <span className="font-bold font-mono text-gray-200">{snapshot.pump.runningMinutesToday} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ESP32 Battery:</span>
                <span className="font-bold font-mono text-emerald-400">{snapshot.esp32.batteryPct}%</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom App Navigation Tabs */}
      <div className="bg-gray-950 border-t border-gray-800 p-1 rounded-b-[28px] grid grid-cols-6 gap-0.5 text-[8px] text-gray-400">
        {[
          { id: 'today', icon: Calendar, label: t('phone.tab_recommend') },
          { id: 'savings', icon: Droplets, label: t('phone.tab_dashboard') },
          { id: 'zones', icon: Sliders, label: t('phone.tab_zones') },
          { id: 'alerts', icon: Bell, label: t('phone.tab_alerts') },
          { id: 'control', icon: Power, label: t('phone.tab_control') },
          { id: 'reports', icon: FileText, label: t('phone.tab_reports') },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = phoneScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setPhoneScreen(tab.id as any);
              }}
              className={`flex flex-col items-center justify-center p-1 rounded-lg transition ${
                isActive ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5" />
              <span className="truncate max-w-[36px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
