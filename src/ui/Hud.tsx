/**
 * src/ui/Hud.tsx
 * Compact professional top header bar.
 * LEFT: Brand identity. CENTER: System flow pipeline. RIGHT: Status & controls.
 */

import React from 'react';
import Link from 'next/link';
import { useSimStore } from '@/store/useSim';
import { useI18n, SupportedLocale } from '@/i18n';
import { 
  Droplets, Wifi, WifiOff, Zap, Sparkles, Volume2, VolumeX, ArrowLeft
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

const FLOW_STEPS = [
  { step: 1, label: 'Sensors' },
  { step: 2, label: 'MQTT' },
  { step: 3, label: 'ET₀ / AI' },
  { step: 4, label: 'Decision' },
  { step: 5, label: 'Downlink' },
  { step: 6, label: 'Actuate' },
  { step: 7, label: 'Feedback' },
];

export const Hud: React.FC = () => {
  const { 
    snapshot, startTour, isTourActive, soundEnabled, toggleSound
  } = useSimStore();
  const { t, locale, setLocale } = useI18n();

  const isOnline = snapshot.esp32.connectivity === 'online';
  const isPumpOn = snapshot.pump.isOn;

  return (
    <header className="w-full h-full flex items-center justify-between gap-2 px-3 bg-[#060E08]/95 backdrop-blur-md border-b border-white/5">
      {/* ── LEFT: Brand ── */}
      <div className="flex items-center gap-2 shrink-0">
        <Link 
          href="/" 
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition" 
          title="Back to Landing Page"
          aria-label="Back to Landing Page"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Droplets className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <h1 className="text-white font-bold text-xs tracking-wide">
              {t('app.title')}
            </h1>
            <span className="px-1.5 py-px rounded text-[8px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              SIH
            </span>
          </div>
          <p className="text-[9px] text-gray-500 font-medium">
            {t('app.sim_badge')}
          </p>
        </div>
      </div>

      {/* ── CENTER: Flow Pipeline ── */}
      <div className="hidden lg:flex items-center gap-0.5">
        <span className="text-[9px] text-gray-500 font-semibold mr-1.5 uppercase tracking-wider">Flow</span>
        {FLOW_STEPS.map((s, i) => {
          const isActive = snapshot.cloudStepIndex === s.step;
          const isPast = snapshot.cloudStepIndex > s.step;
          return (
            <React.Fragment key={s.step}>
              {i > 0 && (
                <div className={`w-3 h-px ${isPast ? 'bg-emerald-500/60' : 'bg-white/10'}`} />
              )}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : isPast
                    ? 'text-emerald-600'
                    : 'text-gray-600'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
                  isActive 
                    ? 'bg-emerald-500 text-white' 
                    : isPast 
                    ? 'bg-emerald-800 text-emerald-300' 
                    : 'bg-white/5 text-gray-600'
                }`}>
                  {isPast ? '✓' : s.step}
                </span>
                <span className="hidden xl:inline text-[9px]">{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── RIGHT: Status & Controls ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Connectivity */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
          isOnline 
            ? 'bg-emerald-500/10 text-emerald-400' 
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span className="hidden md:inline">{isOnline ? t('hud.online') : t('hud.offline')}</span>
        </div>

        {/* Pump */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
          isPumpOn ? 'bg-blue-500/10 text-blue-400' : 'bg-white/3 text-gray-500'
        }`}>
          <Zap className={`w-3 h-3 ${isPumpOn ? 'text-blue-400' : ''}`} />
          <span className="hidden md:inline">{isPumpOn ? t('hud.pump_on') : t('hud.pump_off')}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 mx-0.5" />

        {/* Tour */}
        {!isTourActive && (
          <button
            onClick={() => {
              soundFx.playClick();
              startTour();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm transition active:scale-95"
            aria-label={t('app.start_tour')}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="hidden sm:inline">{t('app.start_tour')}</span>
          </button>
        )}

        {/* Language */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5">
          {(['en', 'hi', 'mr'] as SupportedLocale[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                soundFx.playClick();
                setLocale(lang);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                locale === lang
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label={`Switch to ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Marathi'}`}
            >
              {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा'}
            </button>
          ))}
        </div>

        {/* Sound */}
        <button
          onClick={() => {
            toggleSound();
            soundFx.setEnabled(!soundEnabled);
          }}
          className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="Toggle Sound"
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>
    </header>
  );
};
