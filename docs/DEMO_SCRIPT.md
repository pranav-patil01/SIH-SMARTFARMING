# AgriSense AI — 3-Minute SIH Presentation Script

**Presenter Audience:** Smart India Hackathon (SIH 2026) Evaluation Jury  
**Time Limit:** 3 Minutes  
**Tool:** AgriSense 3D Digital Twin Interactive Simulator

---

### [0:00 – 0:40] Introduction & The Problem
> *"Respected Jury, Indian agriculture consumes over 80% of our extracted groundwater, yet traditional flood irrigation wastes 45% through surface runoff and deep percolation. Worse, during summer water table drops, pumps run dry and burn motor coils, costing farmers thousands of rupees.*  
> *We present **AgriSense AI** — a closed-loop, ET₀-based autonomous precision irrigation system with hardware-level sub-second edge safety."*

*(Action: Click "Start Guided Tour" or Launch Simulator)*

---

### [0:40 – 1:30] How It Works: The 7-Step Telemetry & AI Flow
> *"On screen, you can see our 60×60m digital twin divided into three crop zones: Wheat, Sugarcane, and Vegetables. Notice the glowing blue packets flying up to our Cloud Server Island.*  
> 1. *Capacitive FC-28 soil probes and DHT22 weather sensors capture live field parameters.*  
> 2. *Our cloud calculates Reference Evapotranspiration (ET₀) using the Hargreaves formula tailored to Pune's latitude.*  
> 3. *It factors in crop growth coefficients (Kc) and 24-hour monsoon forecasts.*  
> 4. *Downlink commands trigger the exact solenoid valve for the calculated duration.*  
> 5. *As water flows, notice how the 3D soil darkens dynamically, confirming water infiltration."*

*(Action: Point to Cloud Island, Step Tracker 1–7, and Zone dark soil transition)*

---

### [1:30 – 2:20] Edge Hardware Safety & Offline Resilience (The 6 Scenarios)
> *"What happens when the internet fails or a pipe bursts in rural India? Let me demonstrate.*  
> *(Click Scenario 4: Borewell Dry-Run)*  
> *When the water table drops, our ACS712 current sensor detects low current (2.8A) and the ESP32 trips the pump in **less than 1.4 seconds** — completely offline.*  
> *(Click Scenario 5: Internet Outage)*  
> *When cellular drops, the ESP32 switches to local hysteresis mode, logs telemetry to its MicroSD card buffer, and sends critical alerts to the farmer's phone via SIM800L SMS fallback."*

*(Action: Show X-Ray view of ESP32 enclosure and SMS notification bubble above Farmer avatar)*

---

### [2:20 – 3:00] Farmer App, Impact & SDG Alignment
> *"On the right, our farmer mobile app is available in English, Hindi, and Marathi with transparent 'Why this decision?' AI reasoning.*  
> *In our simulated benchmarks, AgriSense delivers **38% water savings** and **36% electricity reduction**, directly advancing UN SDG 2 (Zero Hunger) and SDG 6 (Clean Water).*  
> *Thank you, and we welcome your questions!"*

*(Action: Switch language to Marathi/Hindi on the Farmer Phone Mockup and show live KPI savings)*
