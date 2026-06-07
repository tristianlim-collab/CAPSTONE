# GAOIRS: System Explanation Script

This document provides a structured way to explain the **GAOIRS** (Geospatial Analysis and Offline Incident Reporting System) to stakeholders, professors, or LGU officials.

## 🌟 The Elevator Pitch
"GAOIRS is a real-time, geospatial incident management ecosystem designed for Philippine LGUs. It streamlines everything from the moment a citizen reports an emergency via GPS to the final post-incident analytics report used by city planners."

## 🚶‍♂️ The Walkthrough Flow

### 1. The Problem
*   Traditional reporting is slow and manual.
*   Lack of visual coordination between dispatchers and responders.
*   No easy way to visualize "Hotspots" or dangerous zones.

### 2. The Solution (Key Modules)
*   **Citizen Reporter (Mobile):** Precise GPS reporting with photo evidence. Optimized for low-bandwidth/offline areas in NIR.
*   **Responder Dashboard (Tablet/Web):** Real-time assignment tracking. Responders see exactly where to go and the severity of the situation.
*   **Admin Command Center (Desktop):** The "Brain" of the system. Features:
    *   **Live Map:** Pulse of the city with real-time incident markers.
    *   **Heatmaps:** Identifies high-risk areas using density analysis.
    *   **Analytics:** Recharts-powered trends (e.g., "Most common incidents on weekends").

### 3. The Tech Stack (The "Why")
*   **PostGIS:** Powers the "Nearest Responder" logic and "Barangay Geofencing."
*   **Socket.io:** Ensures zero-latency updates. When a report is submitted, the Admin's screen flashes instantly.
*   **Supabase:** Secure auth and scalable storage for incident photos.
*   **React + Tailwind:** A premium, modern interface that feels like a professional command center.

## 🎯 Key Talking Points
*   **"Data-Driven Safety":** We don't just respond; we analyze. The heatmap helps LGUs decide where to put fire stations or police outposts.
*   **"Geospatial First":** Location isn't an afterthought—it's the core of the system.
*   **"Built for NIR":** Specifically tailored for the Negros Island Region's administrative boundaries.

---
*Created by Antigravity AI for GAOIRS Team.*
