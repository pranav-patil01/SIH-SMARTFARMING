# AgriSense AI — SIH 2026 Presentation Slide Mapping

This document maps every 3D interactive simulator feature directly to the Smart India Hackathon (SIH 2026) competition slide deck.

---

## 1. Problem Statement & Background
- **Slide Focus:** Groundwater depletion, pump motor burnout during dry spells, flood irrigation waste.
- **Simulator Feature:**
  - **Tour Scene 1:** Visualizes dry, cracked soil vs. flooded wasteful fields.
  - **Baseline Comparison KPI Card:** Demonstrates real-time baseline water/power usage vs. precision smart irrigation.

---

## 2. Technical Approach & Innovation
- **Slide Focus:** ET₀ Evapotranspiration modeling, dual-core ESP32 edge gateway, sub-second fail-safes.
- **Simulator Feature:**
  - **3D Cloud Island:** Shows live modules for Hargreaves ET₀ engine, Zone-wise Decision Scheduler, AI/ML Anomaly Model, and TimescaleDB.
  - **ESP32 X-Ray Cutaway:** 3D model opening up to reveal ESP32, SIM800L GSM module, MicroSD buffer, and Optocoupler Relay banks.
  - **Catmull-Rom MQTT Packets:** Color-coded telemetry (Uplink Blue, Downlink Orange, Alert Red, SMS Purple).

---

## 3. Feasibility & Edge Fail-Safe Robustness
- **Slide Focus:** System functions during cellular dropouts and prevents catastrophic hardware damage.
- **Simulator Feature:**
  - **Scenario 4 (Pump Dry-Run):** ACS712 current sensing detects motor spinning in air (<5A) and trips contactor in <1.4 seconds.
  - **Scenario 3 (Pipe Rupture):** Inline YF-S201 flow sensor detects +48% deviation and immediately isolates the zone solenoid valve.
  - **Scenario 5 (Internet Outage):** Field unit switches to local offline hysteresis with SD buffer logging and SIM800L SMS alerts.

---

## 4. Farmer Adoption & Social Feasibility
- **Slide Focus:** Vernacular accessibility for Indian smallholders across Maharashtra, UP, and Punjab.
- **Simulator Feature:**
  - **Live Mobile App Mockup:** Fully translated into **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)** with instant toggle.
  - **Transparent AI ("Why this decision?"):** Clear bullet points explaining the exact agronomic reason for every watering cycle.

---

## 5. Impact & SDG Alignment
- **Slide Focus:** 38% water conservation, 36% power reduction, alignment with UN Sustainable Development Goals.
- **Simulator Feature:**
  - **Live Recharts Telemetry:** 24-hour historical curves of soil moisture, flow rates, and ET₀ demand.
  - **SDG Badges:** Direct mapping to **SDG 2 (Zero Hunger)**, **SDG 6 (Clean Water & Sanitation)**, and **SDG 12/13 (Responsible Consumption & Climate Action)**.
