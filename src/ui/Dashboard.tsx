/**
 * src/ui/Dashboard.tsx
 * Left sidebar telemetry panel: KPIs, zone cards, chart, and explainable AI decision.
 * No longer uses fixed/absolute positioning — rendered inline within grid layout.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { useI18n } from '@/i18n';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  Droplets, Zap, Cpu, Gauge, TrendingDown, Wheat, Leaf, Sprout
} from 'lucide-react';

export const Dashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { snapshot, history } = useSimStore();
  const { t } = useI18n();

  const { baseline, latestDecision, weather, tank, zones } = snapshot;

  const z1 = zones.find(z => z.id === 'z1');
  const z2 = zones.find(z => z.id === 'z2');
  const z3 = zones.find(z => z.id === 'z3');

  const getStatusColor = (moisture: number) => {
    if (moisture < 15) return 'text-red-400';
    if (moisture < 22) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getStatusLabel = (moisture: number) => {
    if (moisture < 15) return 'Critical';
    if (moisture < 22) return 'Watch';
    return 'Optimal';
  };

  const getBarColor = (moisture: number) => {
    if (moisture < 15) return 'bg-red-500';
    if (moisture < 25) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* ── Section: LIVE AGRISENSE ── */}
      <div>
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Live AgriSense</h2>
        <p className="text-[9px] text-gray-600 mb-2">Real-time field telemetry · {snapshot.timeOfDayFormatted} · Day {snapshot.simDay}</p>
        
        {/* Weather inline */}
        <div className="text-[10px] text-gray-400 bg-white/3 rounded-lg px-2 py-1.5 mb-2 flex items-center justify-between border border-white/5">
          <span>🌡 {weather.tmean.toFixed(1)}°C · {weather.humidity}% RH</span>
          <span>☔ Rain {(weather.rainForecastProb24h * 100).toFixed(0)}%</span>
        </div>

        {/* KPI Grid 2x2 */}
        <div className="grid grid-cols-2 gap-1.5">
          <MetricCard
            label="Reference ET₀"
            value={`${snapshot.et0TodayMm.toFixed(2)}`}
            unit="mm/d"
            subtext="Hargreaves"
            color="text-amber-300"
          />
          <MetricCard
            label="Reservoir"
            value={`${(tank.levelFraction * 100).toFixed(0)}%`}
            unit=""
            subtext={`${Math.round(tank.currentLevelL).toLocaleString()} L`}
            color="text-blue-300"
          />
          <MetricCard
            label="Water Saved"
            value={`${baseline.waterSavedPct}%`}
            unit=""
            subtext={`+${baseline.waterSavedL.toLocaleString()} L`}
            color="text-emerald-400"
          />
          <MetricCard
            label="Energy Saved"
            value={`${baseline.energySavedPct}%`}
            unit=""
            subtext={`+${baseline.energySavedKwh} kWh`}
            color="text-yellow-400"
          />
        </div>
      </div>

      {/* ── Section: FIELD ZONES ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Field Zones</h2>
          <span className="text-[8px] text-gray-600">Optimal 28–35%</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <ZoneCard
            icon="🌾"
            name="Zone 1 · Wheat"
            moisture={z1?.soilMoisturePct ?? 28}
            health={z1?.plantHealth ?? 1}
            isIrrigating={!!(z1?.valveOpen && snapshot.pump.isOn)}
          />
          <ZoneCard
            icon="🎋"
            name="Zone 2 · Sugarcane"
            moisture={z2?.soilMoisturePct ?? 32}
            health={z2?.plantHealth ?? 1}
            isIrrigating={!!(z2?.valveOpen && snapshot.pump.isOn)}
          />
          <ZoneCard
            icon="🥦"
            name="Zone 3 · Vegetables"
            moisture={z3?.soilMoisturePct ?? 25}
            health={z3?.plantHealth ?? 1}
            isIrrigating={!!(z3?.valveOpen && snapshot.pump.isOn)}
          />
        </div>
      </div>

      {/* ── Section: 24-HOUR CHART ── */}
      <div>
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">24h Field Trend</h2>
        <div className="bg-black/20 border border-white/5 rounded-xl p-2">
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="et0Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="time" stroke="#ffffff30" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={8} domain={[0, 40]} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1A0F', borderColor: '#10B981', fontSize: 10, borderRadius: 8 }} 
                />
                <Area type="monotone" dataKey="z1Moisture" name="Zone 1 %" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#moistGrad)" />
                <Area type="monotone" dataKey="et0" name="ET₀ (mm)" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#et0Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <div className="flex items-center gap-1 text-[8px] text-gray-500">
              <span className="w-2 h-0.5 rounded bg-emerald-400" />
              <span>Soil Moisture</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] text-gray-500">
              <span className="w-2 h-0.5 rounded bg-amber-400" />
              <span>ET₀</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: WHY THIS DECISION? ── */}
      <div>
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Why This Decision?</h2>
        <div className="bg-emerald-950/30 border border-emerald-500/15 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Cpu className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-400">Explainable AI</span>
            <span className="ml-auto text-[8px] text-emerald-600 bg-emerald-500/10 px-1.5 py-px rounded-full">
              ML: {latestDecision?.zoneDecisions[0]?.mlConfidence ? (latestDecision.zoneDecisions[0].mlConfidence * 100).toFixed(0) : '94'}%
            </span>
          </div>
          <p className="text-[10px] text-gray-300 font-medium mb-1.5">
            {latestDecision?.overallReason || 'System evaluating sensor stream.'}
          </p>
          <ul className="flex flex-col gap-0.5">
            {latestDecision?.zoneDecisions[0]?.whyBullets?.slice(0, 3).map((b, idx) => (
              <li key={idx} className="text-[9px] text-gray-400 flex items-start gap-1">
                <span className="text-emerald-500 mt-px">●</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ── Reusable Metric Card ── */
const MetricCard: React.FC<{
  label: string;
  value: string;
  unit: string;
  subtext: string;
  color: string;
}> = ({ label, value, unit, subtext, color }) => (
  <div className="bg-black/20 border border-white/5 p-2 rounded-lg">
    <div className="text-[9px] text-gray-500 mb-0.5">{label}</div>
    <div className={`text-sm font-bold font-mono ${color}`}>
      {value}
      {unit && <span className="text-[9px] font-normal text-gray-500 ml-0.5">{unit}</span>}
    </div>
    <div className="text-[8px] text-gray-600">{subtext}</div>
  </div>
);

/* ── Reusable Zone Card ── */
const ZoneCard: React.FC<{
  icon: string;
  name: string;
  moisture: number;
  health: number;
  isIrrigating: boolean;
}> = ({ icon, name, moisture, health, isIrrigating }) => {
  const statusColor = moisture < 15 ? 'text-red-400' : moisture < 22 ? 'text-amber-400' : 'text-emerald-400';
  const statusLabel = moisture < 15 ? 'Critical' : moisture < 22 ? 'Watch' : 'Optimal';
  const barColor = moisture < 15 ? 'bg-red-500' : moisture < 25 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className={`bg-black/20 border rounded-lg p-2 transition-all ${
      isIrrigating ? 'border-blue-500/30 bg-blue-950/20' : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{icon}</span>
          <span className="text-[10px] font-semibold text-gray-200">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isIrrigating && (
            <span className="text-[7px] font-bold text-blue-400 bg-blue-500/15 px-1 py-px rounded">
              WATERING
            </span>
          )}
          <span className={`text-[8px] font-bold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold font-mono text-white">{moisture.toFixed(1)}%</span>
        <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, (moisture / 40) * 100)}%` }}
          />
        </div>
        <span className="text-[8px] text-gray-500">{(health * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
