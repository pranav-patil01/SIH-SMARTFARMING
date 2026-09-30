/**
 * src/ui/TourOverlay.tsx
 * 9-Scene Cinematic Guided Story Mode for SIH Judges & Viewers.
 * Renders cleanly inside the 3D viewport without overflowing.
 */

import React from 'react';
import { useSimStore } from '@/store/useSim';
import { useI18n } from '@/i18n';
import { 
  Sparkles, ArrowRight, ArrowLeft, X, 
  CheckCircle2, Compass, Award 
} from 'lucide-react';
import { soundFx } from '@/lib/audio';

export const TourOverlay: React.FC = () => {
  const { isTourActive, tourStep, nextTourStep, prevTourStep, skipTour } = useSimStore();
  const { t } = useI18n();

  if (!isTourActive) return null;

  const totalSteps = 9;
  const currentStepData = {
    title: t(`tour.steps.${tourStep}.title`),
    description: t(`tour.steps.${tourStep}.description`),
  };

  return (
    <div className="absolute inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-xl bg-gray-950/90 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-white flex flex-col gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold font-mono">
              {tourStep + 1}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {t('tour.step_of', { current: tourStep + 1, total: totalSteps })}
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              skipTour();
            }}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/60"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('tour.skip')}</span>
          </button>
        </div>

        {/* Story Text */}
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-sm text-white tracking-wide">
            {currentStepData.title}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed font-normal">
            {currentStepData.description}
          </p>
        </div>

        {/* Navigation Step Tracker & Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-0.5">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === tourStep
                    ? 'w-5 bg-emerald-400 shadow shadow-emerald-500/50'
                    : idx < tourStep
                    ? 'w-1.5 bg-emerald-700'
                    : 'w-1.5 bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tourStep > 0 && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  prevTourStep();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-800 text-gray-200 text-xs font-bold hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('tour.back')}</span>
              </button>
            )}

            <button
              onClick={() => {
                soundFx.playClick();
                nextTourStep();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition"
            >
              <span>{tourStep === totalSteps - 1 ? 'Finish Tour' : t('tour.next')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
