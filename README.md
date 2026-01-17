# Relativistic Black Hole Simulator 🕳️

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white)](https://wjgoarxiv.github.io/blackhole-simulator/)

An interactive, hyper-realistic WebGL simulation of a Schwarzschild black hole, featuring gravitational lensing, Doppler beaming, and a volumetric accretion disk.

## ✨ Features

- **Physics-Based Rendering**: Real-time GLSL Raymarching with Relativistic light bending.
- **Cinematic Visuals**: "Ospray-style" volumetric accretion disk with fBM noise and self-shadowing.
- **Interactive Controls**: Adjustable Disk Intensity, Star Drift (Parallax), and Exposure.
- **Metric HUD**: Real-time readout of Distance ($r$), Velocity ($c$), and Position.

## 🎮 Controls

- **Move**: `W`, `A`, `S`, `D` (+ `Space`/`Shift` for Up/Down)
- **Look**: Arrow Keys (or Mouse drag)
- **UI**: Toggle "[Hide]" to capture cinematic shots.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## 🛠️ Tech Stack

- **Engine**: Three.js + Custom GLSL Fragment Shader
- **Language**: TypeScript
- **Build**: Vite
