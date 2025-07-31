export type Vec = { x: number; y: number };

export class Game {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private gridSize = 20; // pixels per cell
  private cols: number;
  private rows: number;

  private snake: Vec[] = [];
  private dir: Vec = { x: 1, y: 0 };
  private nextDir: Vec | null = null;
  private food: Vec = { x: 0, y: 0 };
  private score = 0;
  private baseSpeed = 5; // moves per second
  private speed = this.baseSpeed;
  private running = false;
  private lastMoveTime = 0;
  private gameOver = false;

  onScore?: (score: number) => void;
  onSpeed?: (speed: number) => void;
  onGameOver?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not found");
    this.ctx = ctx;
    // initialize cols/rows based on current CSS size (will be updated by resize)
    this.cols = 0;
    this.rows = 0;
    // perform initial sizing using element's bounding rect
    const rect = canvas.getBoundingClientRect();
    // if rect is 0 (server-side or hidden), fall back to attributes
    const cssW = rect.width || canvas.width || 480;
    const cssH = rect.height || canvas.height || 480;
    this.resize(cssW, cssH);
    this.reset();
  }

  /**
   * Resize the canvas to a CSS pixel size (cssWidth, cssHeight), handle DPR scaling
   * and recompute grid columns/rows. Attempts to keep the snake centered.
   */
  resize(cssWidth: number, cssHeight: number) {
    const dpr = window.devicePixelRatio || 1;

    // keep canvas element visually square by using provided values
    this.canvas.style.width = `${Math.round(cssWidth)}px`;
    this.canvas.style.height = `${Math.round(cssHeight)}px`;

    // set backing store size for crisp rendering
    this.canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    // map canvas drawing operations to CSS pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const oldCols = this.cols || 0;
    const oldRows = this.rows || 0;
    const oldCenter = { x: Math.floor(oldCols / 2), y: Math.floor(oldRows / 2) };

    this.cols = Math.max(1, Math.floor(cssWidth / this.gridSize));
    this.rows = Math.max(1, Math.floor(cssHeight / this.gridSize));

    const newCenter = { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) };
    const dx = newCenter.x - oldCenter.x;
    const dy = newCenter.y - oldCenter.y;

    // shift snake and food to keep relative position towards center. Clamp to bounds.
    if (this.snake.length > 0 && (oldCols !== 0 || oldRows !== 0)) {
      this.snake = this.snake.map(s => ({
        x: Math.max(0, Math.min(this.cols - 1, s.x + dx)),
        y: Math.max(0, Math.min(this.rows - 1, s.y + dy))
      }));

      this.food = {
        x: Math.max(0, Math.min(this.cols - 1, this.food.x + dx)),
        y: Math.max(0, Math.min(this.rows - 1, this.food.y + dy))
      };
    }

    // re-render with new sizes
    this.render();
  }

  reset() {
    this.snake = [
      { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
      { x: Math.floor(this.cols / 2) - 1, y: Math.floor(this.rows / 2) },
      { x: Math.floor(this.cols / 2) - 2, y: Math.floor(this.rows / 2) }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = null;
    this.placeFood();
    this.score = 0;
    this.speed = this.baseSpeed;
    this.running = false;
    this.gameOver = false;
    this.lastMoveTime = 0;
    this.emitScore();
    this.emitSpeed();
    this.render();
  }

  start() {
    if (this.gameOver) this.reset();
    this.running = true;
    // reset timing so move happens immediately
    this.lastMoveTime = performance.now();
  }

  pause() {
    this.running = false;
  }

  togglePause() {
    this.running = !this.running;
    if (this.running) this.lastMoveTime = performance.now();
  }

  setDirection(x: number, y: number) {
    // Prevent reversing directly
    if (this.dir.x === -x && this.dir.y === -y) return;
    // queue next direction to avoid skipping moves
    this.nextDir = { x, y };
  }

  private placeFood() {
    const tries = 1000;
    for (let i = 0; i < tries; i++) {
      const x = Math.floor(Math.random() * this.cols);
      const y = Math.floor(Math.random() * this.rows);
      if (!this.snake.some(s => s.x === x && s.y === y)) {
        this.food = { x, y };
        return;
      }
    }
    // fallback in unlikely event
    this.food = { x: 0, y: 0 };
  }

  private move() {
    if (this.nextDir) {
      this.dir = this.nextDir;
      this.nextDir = null;
    }

    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    // Check wall collisions
    if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
      this.endGame();
      return;
    }

    // Check self collision
    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);

    // Eat food
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 1;
      // increase speed slightly every few points
      if (this.score % 3 === 0) {
        this.speed += 0.6;
        this.emitSpeed();
      }
      this.placeFood();
      this.emitScore();
    } else {
      this.snake.pop();
    }
  }

  private endGame() {
    this.running = false;
    this.gameOver = true;
    if (this.onGameOver) this.onGameOver();
  }

  update(now: number) {
    if (!this.running) return;
    const secondsPerMove = 1 / this.speed;
    const msPerMove = secondsPerMove * 1000;
    if (now - this.lastMoveTime >= msPerMove) {
      this.lastMoveTime = now;
      this.move();
      this.render();
    }
  }

  render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Clear
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.fillRect(0, 0, cw, ch);

    // Draw grid (optional subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.gridSize, 0);
      ctx.lineTo(x * this.gridSize, ch);
      ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.gridSize);
      ctx.lineTo(cw, y * this.gridSize);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = "#ef4444"; // red-500
    ctx.fillRect(this.food.x * this.gridSize + 1, this.food.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const s = this.snake[i];
      ctx.fillStyle = i === 0 ? "#10b981" : "#059669"; // head green, body darker
      ctx.fillRect(s.x * this.gridSize + 1, s.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
    }

    // If game over overlay
    if (this.gameOver) {
      ctx.fillStyle = "rgba(2,6,23,0.6)";
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = "#fff";
      ctx.font = "28px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", cw / 2, ch / 2 - 10);
      ctx.font = "16px monospace";
      ctx.fillText("Press Restart to play again", cw / 2, ch / 2 + 20);
    }
  }

  getScore() {
    return this.score;
  }

  getSpeed() {
    return Math.round(this.speed);
  }

  // Emit helpers for external listeners
  private emitScore() {
    if (this.onScore) this.onScore(this.score);
  }

  private emitSpeed() {
    if (this.onSpeed) this.onSpeed(Math.round(this.speed));
  }
}