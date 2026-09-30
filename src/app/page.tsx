'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, Droplets, Zap, ShieldCheck, Cpu, 
  ArrowRight, Activity, Globe2, Compass, Layers, CheckCircle 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#06140B] via-[#0A1A0F] to-[#040A06] text-white flex flex-col justify-between overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Top Banner */}
      <header className="max-w-7xl mx-auto w-full p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">AgriSense AI</h1>
            <p className="text-xs text-emerald-400 font-medium">Smart India Hackathon 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Hardware & Software Category
          </span>
          <Link
            href="/simulate"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            Launch 3D Sim →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>Interactive 3D Digital Twin Simulation</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          ET₀-Based Autonomous <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">Smart Irrigation</span> with ESP32 Edge Safety
        </h2>

        <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
          Witness the entire precision agriculture loop in real time: field telemetry streaming over MQTT, Hargreaves ET₀ computation, AI/ML crop need recommendations, and sub-second hardware fail-safe tripping.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/simulate?tour=true"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition"
          >
            <Compass className="w-5 h-5 text-amber-300" />
            <span>Start Guided 3-Min Tour</span>
          </Link>

          <Link
            href="/simulate"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-white/20 text-gray-200 font-bold text-sm shadow-xl transition active:scale-95"
          >
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Free 3D Exploration</span>
          </Link>
        </div>

        {/* Key Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-10 text-left">
          <div className="bg-gray-950/80 border border-emerald-500/20 p-5 rounded-2xl shadow-xl flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">ET₀ Hargreaves Math</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Dynamically calculates atmospheric water deficit (ET₀ × Kc − Pe) with rain forecast checks to conserve up to 38% water.
            </p>
          </div>

          <div className="bg-gray-950/80 border border-emerald-500/20 p-5 rounded-2xl shadow-xl flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">ESP32 &lt; 2s Hardware Interlock</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Instant dry-run tripping via ACS712 current sensing, pipe burst isolation, SD card offline logging, and SIM800L SMS fallback.
            </p>
          </div>

          <div className="bg-gray-950/80 border border-emerald-500/20 p-5 rounded-2xl shadow-xl flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Globe2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Multilingual Kisan App</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Farmer mobile application in English, हिंदी, and मराठी with transparent explainable AI recommendations and emergency manual override.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full p-6 text-center text-xs text-gray-500 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>AgriSense AI · SIH 2026 Simulation Prototype</span>
        <span>Honest Data · Pure Client-Side Three.js &amp; Next.js 14</span>
      </footer>
    </main>
  );
}
