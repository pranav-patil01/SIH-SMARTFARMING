# AgriSense AI — 3D Animated Smart-Irrigation Simulation
> **Smart India Hackathon 2026** — Software & Hardware Category  
> *Simulation — Illustrative Values*

![AgriSense 3D Simulation](https://img.shields.io/badge/SIH-2026-brightgreen) ![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black) ![Three.js](https://img.shields.io/badge/Three.js-R3F-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) ![Vitest](https://img.shields.io/badge/Vitest-Passing-success)

---

## 🌾 Project Overview

**AgriSense AI** is an ET₀-based autonomous precision smart-irrigation and fail-safe hardware system designed for Indian agriculture. 

This repository contains a **production-quality, interactive 3D digital twin simulation** built in Next.js, Three.js (React Three Fiber), Tailwind CSS, and Zustand. The simulation allows judges, evaluators, and farmers to visualize and interact with the complete system:
- **Procedural 60×60m Farm Plot:** Dynamic soil moisture color darkening, instanced crops with wind sway (Wheat, Sugarcane, Vegetables).
- **Physical Sensor Nodes:** Capacitive FC-28 soil probes, DHT22 weather station, YF-S201 inline flow meters, ACS712 current sensors.
- **Pump House with X-Ray Cutaway:** 5 HP centrifugal pump, motor contactor, ESP32 dual-core controller, SIM800L GSM module, SD card buffer, and battery backup.
- **Floating Cloud Server Island:** MQTT ingestion broker, Hargreaves ET₀ engine, Zone-wise Decision Scheduler, AI/ML Anomaly Detector, TimescaleDB.
- **Animated Data Packets:** Glowing Catmull-Rom splines for MQTT uplinks (blue), downlinks (orange), safety trips (red), and SMS fallback (purple).
- **Multilingual Farmer App Mockup:** Fully translated into **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.

---

## 🏛 Architecture Diagram

```text
       +-------------------------------------------------------------+
       |               AGRISENSE CLOUD BRAIN (ISLAND)                |
       |  +-------------+  +-------------+  +---------------------+  |
       |  | MQTT Broker |  | ET₀ Engine  |  | Decision & AI ML    |  |
       |  |   (EMQX)    |  | (Hargreaves)|  | (Moisture/Anomaly)  |  |
       |  +------+------+  +------+------+  +----------+----------+  |
       +---------|----------------|--------------------|-------------+
                 ^ Uplink Telemetry (Blue)             v Downlink Command (Orange)
                 |                                     |
       +---------|-------------------------------------v-------------+
       |             ESP32 EDGE CONTROLLER & SAFETY UNIT             |
       |  +---------------------+  +-------------------------------+  |
       |  | < 2s Safety Relay   |  | Local Offline Hysteresis      |  |
       |  | (Dry-Run / Burst)   |  | (MicroSD Buffer / SIM800L SMS)|  |
       |  +----------+----------+  +---------------+---------------+  |
       +-------------|-----------------------------|-----------------+
                     | Relay Control               | SIM800L GSM SMS
                     v                             v
           +--------------------+         +------------------+
           | 5 HP Centrifugal   |         | Farmer Kisan App |
           | Pump & Solenoids   |         | (EN / हिं / मरा)  |
           +---------+----------+         +------------------+
                     |
                     v
       +-------------------------------------------------------------+
       |               PRECISION FIELD ZONES (60×60m)                |
       |   Zone 1 (Wheat)   |   Zone 2 (Cane)   |   Zone 3 (Veg)     |
       |   FC-28 Soil Probe |   YF-S201 Flow    |   DHT22 Weather    |
       +-------------------------------------------------------------+
```

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js 18+ or Node.js 20+
- npm or pnpm

### 1. Installation
```bash
npm install
```

### 2. Run Headless Vitest Tests
Verifies the agronomic math (ET₀, Kc, soil balance, and fail-safe logic) in headless Node:
```bash
npm run test
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🎮 Interactive Features & Scenarios

### Guided Story Tour (9 Scenes)
Click **"Start Guided Tour"** or press <kbd>T</kbd> to initiate a cinematic walkthrough covering the water crisis, zoning, IoT nodes, ESP32 edge gateway, MQTT telemetry, cloud AI decisioning, downlink actuation, safety trips, and SDG impact.

### Interactive Edge Scenarios (<kbd>1</kbd> to <kbd>8</kbd>)
1. **Heatwave & Dry Spell:** Ambient temp spikes to 42°C, ET₀ surges, system auto-irrigates.
2. **Rain Forecast Skip:** 85% probability of 22mm monsoon rain pauses irrigation, conserving reservoir water.
3. **Pipe Burst / Leak:** Inline flow sensor registers +48% flow deviation; valve is isolated immediately.
4. **Borewell Dry-Run:** Current drops to 2.8A with 0 flow; ESP32 trips contactor in < 1.4 seconds.
5. **Internet Outage:** System shifts to local hysteresis rules, queues data to SD card, and sends SIM800L SMS.
6. **Water Scarcity Mode:** Reservoir drops to 12%; system ranks crops and waters only top-priority zone.
7. **Sensor Drift:** FC-28 probe outputs false high; anomaly detection isolates the faulty reading.
8. **Mobile App Manual Override:** Farmer manually toggles valves while edge safety remains active.

---

## ⌨ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / Pause simulation |
| <kbd>T</kbd> | Start Guided Tour |
| <kbd>→</kbd> / <kbd>←</kbd> | Next / Previous Tour Step |
| <kbd>1</kbd> – <kbd>8</kbd> | Trigger Scenarios 1 through 8 |
| <kbd>?</kbd> | Toggle Shortcuts Modal |

---

## 📋 Documentation Reference
- [Slide Mapping Guide](docs/SLIDE_MAPPING.md)
- [3-Minute Demo Narration Script](docs/DEMO_SCRIPT.md)

---

## ⚖ Honesty & Labelling Notice
All water and energy savings displayed in the dashboard are computed dynamically from the running simulation against an explicit baseline flood irrigation schedule (2 hours daily at 600 L/min).
