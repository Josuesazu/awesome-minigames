# Snake Game (TypeScript + Tailwind)

A small, responsive Snake game written in TypeScript, bundled with Vite and styled with Tailwind CSS.

This folder contains a lightweight, vanilla-TS implementation intended for learning and embedding in small projects.

## Features

- Classic Snake gameplay
- Keyboard controls (arrow keys / WASD)
- Pause / resume (Space)
- Score and dynamic speed increase
- Responsive canvas and controls (stacks on small screens)

## Controls

- Move: Arrow keys or W/A/S/D
- Pause / Resume: Space
- Start: Start button or Enter
- Restart: Restart button

## Files changed for responsiveness

During recent updates the following files were adjusted to make the UI responsive:

- `index.html` — updated layout and Tailwind utilities so the right-side control panel wraps and buttons stack on small screens; canvas given responsive classes.
- `src/main.ts` — added logic to compute a responsive canvas size at load and on window resize (debounced); calls `game.resize(...)`.
- `src/game.ts` — added a `resize(cssWidth, cssHeight)` method that handles devicePixelRatio scaling, recomputes grid columns/rows and re-centers snake/food when possible.
- `src/style.css` — added rules so the canvas maintains aspect ratio and doesn't overflow.

If you want the canvas to always fill the right column (non-square) or to keep a fixed number of cells and scale each cell instead, I can change that behavior.

## Run (development)

This project uses Bun in the repo, but it also works with npm/Yarn if you prefer.

PowerShell (recommended if you use the same shell as in this workspace):

```powershell
# Install dependencies (Bun)
bun install

# Start dev server
bun run dev
```

If you use npm:

```powershell
npm install
npm run dev
```

Open http://localhost:5173 (or the Vite-provided URL) to view the game.

## Build

```powershell
bun run build
# or
npm run build
```

## Troubleshooting

- Canvas appears blurry: ensure your browser supports devicePixelRatio and that `src/game.ts` calls `ctx.setTransform(dpr,0,0,dpr,0,0)` (implemented).
- Tailwind classes not applying: ensure your Tailwind build is running (Vite config) and classes are included in your purge/content config.

## Contributing

Small fixes and responsive improvements welcome. For larger changes, open an issue first.

---

Made with ❤️ — enjoy!
