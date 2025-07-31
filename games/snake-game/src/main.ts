import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const scoreEl = document.getElementById("score")!;
const speedEl = document.getElementById("speed")!;
const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

// Helper: compute a responsive square size for the canvas based on container
function computeCanvasSize(): { w: number; h: number } {
  const container = canvas.parentElement ?? document.body;
  const rect = container.getBoundingClientRect();
  // leave some padding within container
  const maxW = rect.width || window.innerWidth;
  const maxH = rect.height || window.innerHeight;
  // make square and fit within available space
  const size = Math.min(maxW, maxH, 640);
  return { w: size, h: size };
}

const game = new Game(canvas);

// initial sizing
const initial = computeCanvasSize();
game.resize(initial.w, initial.h);

game.onScore = (s) => {
  scoreEl.textContent = String(s);
};

game.onSpeed = (sp) => {
  speedEl.textContent = String(Math.round(sp));
};

game.onGameOver = () => {
  // optional: flash or sound - keep simple here
};

startBtn.addEventListener("click", () => {
  game.start();
});

pauseBtn.addEventListener("click", () => {
  game.togglePause();
  pauseBtn.textContent = game ? (pauseBtn.textContent === "Pause" ? "Resume" : "Pause") : "Pause";
});

restartBtn.addEventListener("click", () => {
  game.reset();
  game.start();
  pauseBtn.textContent = "Pause";
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      game.setDirection(0, -1);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      game.setDirection(0, 1);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      game.setDirection(-1, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      game.setDirection(1, 0);
      break;
    case " ":
      e.preventDefault();
      game.togglePause();
      pauseBtn.textContent = game ? (pauseBtn.textContent === "Pause" ? "Resume" : "Pause") : "Pause";
      break;
    case "Enter":
      if (!game) return;
      game.start();
      break;
  }
});

// Main loop
function loop(now: number) {
  game.update(now);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Debounced resize handler
let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const s = computeCanvasSize();
    game.resize(s.w, s.h);
  }, 150);
});