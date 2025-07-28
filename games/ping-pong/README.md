# Ping Pong — Vanilla TypeScript + Vite + Tailwind

A lightweight Ping Pong (Pong) game built with Vanilla TypeScript, Vite and Tailwind CSS.

Features
- Canvas-based game with crisp rendering (devicePixelRatio aware).
- Left paddle controlled by keyboard (W/S or ArrowUp/ArrowDown).
- Right paddle controlled by simple AI.
- Score tracking, reset, pause.
- Tailwind used for minimal layout and styling.


Setup

Prerequisites
- Node.js 16+ (recommended: latest LTS)
- npm (or yarn/pnpm/bun — adjust commands accordingly)

1. Install dependencies
   ```bash
   npm install
   ```

2. Start dev server
   ```bash
   npm run dev
   ```
   The app will open in your browser (Vite will open it automatically if available).

3. Build
   ```bash
   npm run build
   ```

Controls
- Left player: W (up) / S (down) or ArrowUp / ArrowDown.
- Space: pause/unpause.
- R: reset scores.
