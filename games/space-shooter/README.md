# Space Shooter (Galaga-like)

A compact canvas-based space shooter written in TypeScript. Move your ship left/right and shoot waves of enemies while protecting your ship and managing health and score.

## Objective
- Destroy enemies to earn points and clear waves.
- Prevent enemies from passing below your ship — each missed enemy penalizes score and health.
- Avoid physical contact: an enemy that physically overlaps your ship will end the game immediately.

## Rules (detailed)
- Starting health: 100 (configurable in `src/main.ts` via `initialHealth`).
- Scoring:
	- +10 points per enemy destroyed.
	- Clearing a wave awards +10 bonus points but the score bonus is capped at 100.
	- When an enemy passes below your ship (is missed): -10 points (floored at 0) and -1 Health.
- Collision:
	- An enemy must physically overlap the player's bounding box (X and Y overlap) to count as a hit.
	- Physical contact causes immediate game over.
- Waves & difficulty:
	- The game spawns waves of enemies. Each cleared wave increases the wave number.
	- Enemy vertical drop speed increases per wave (controlled by `dropSpeedIncrement` in code).
	- Enemies oscillate horizontally and drop toward the player; oscillation amplitude scales with the canvas width for responsiveness.

## Controls
- Move: Arrow Left / Right or A / D
- Shoot: Space (press — immediate shot on keydown; a small cooldown still applies)
- Start: Click the Start button in the HUD to begin the game (the game loads paused)
- Pause / Resume: Click Pause to toggle (button text toggles to "Resume")
- Restart: Click Restart (or the Restart button on the Game Over overlay) to reset score, health, and wave and start immediately

## HUD / UI
- Score: current score
- Health: current health (loses 1 when an enemy passes under the player)
- High Score: persisted in `localStorage` under key `space-shooter-highscore`
- Wave: current wave number
- The UI is responsive — the layout, HUD, and canvas scale to different device sizes and devicePixelRatio for crisp rendering.

## Configuration (quick)
- `src/main.ts`
	- `initialHealth` — starting health (default: 100).
	- `baseDropSpeed` — base vertical drop speed of enemies (default tuned in code; increase/decrease to change initial pace).
	- `dropSpeedIncrement` — how much drop speed increases per wave.
	- `highScoreKey` — localStorage key used for high score persistence.

If you want the enemy speed to scale by screen size, replace the fixed `baseDropSpeed` with a value computed from `W` or `H` (for example `Math.round(H / 12)`).

## Implementation notes
- Rendering: Canvas 2D API with backing-store scaling using `window.devicePixelRatio` for crisp visuals on high-DPI displays.
- Input: Keyboard events (keydown for immediate shooting, keyup to stop). The Space key default scrolling is prevented.
- Collision: Simple bounding overlap checks (X + Y) for physical hits; pass detection when enemy Y passes player Y.
- Persistence: High score saved in `localStorage`.

## Run locally
This project uses Vite for development. From the `games/space-shooter` folder:

```powershell
npm install
npm run dev
```

Open the dev server URL shown by Vite (usually http://localhost:5173/) in a modern browser.

## Troubleshooting & tips
- If the canvas appears too large or small, resize the browser window — the UI is responsive and will adapt. For very small screens the HUD collapses into a compact layout.
- To change difficulty quickly, adjust `baseDropSpeed` or `dropSpeedIncrement` in `src/main.ts`.
- If the high score does not appear to update, check site storage settings in your browser — `localStorage` must be enabled.

## Contribution
- This is a small demo. Contributions welcome: visual polish, audio, power-ups, different enemy patterns, and mobile-friendly UX improvements are great next steps.

Enjoy — and tell me any gameplay tweaks you want (speed, health, scoring, visuals).
