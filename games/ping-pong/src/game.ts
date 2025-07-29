export type ScoreCallback = (left: number, right: number, paused: boolean) => void;

type Vec = { x: number; y: number };

export class PingPongGame {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private lastTime = 0;
  private paused = false;

  // Game objects
  private paddleWidth = 12;
  private paddleHeight = 90;
  private leftPaddleY = 0;
  private rightPaddleY = 0;
  private paddleSpeed = 480; // pixels per second

  private ballPos: Vec = { x: 0, y: 0 };
  private ballVel: Vec = { x: 0, y: 0 };
  private ballRadius = 8;
  private ballSpeed = 360;

  private scoreLeft = 0;
  private scoreRight = 0;

  // Input
  private keys = new Set<string>();

  private onScoreChange: ScoreCallback;

  constructor(container: HTMLElement, onScoreChange: ScoreCallback) {
    this.container = container;
    this.onScoreChange = onScoreChange;

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '800px';
    this.canvas.style.height = '480px';
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.bindKeys();
    this.resetGame();
  }

  start() {
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    this.unbindKeys();
    window.removeEventListener('resize', () => this.resizeCanvas());
  }

  private loop = (time: number) => {
    const dt = Math.min(0.032, (time - this.lastTime) / 1000);
    this.lastTime = time;
    if (!this.paused) {
      this.update(dt);
    }
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private resizeCanvas() {
    const style = getComputedStyle(this.canvas);
    const width = parseInt(style.width, 10) || 800;
    const height = parseInt(style.height, 10) || 480;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Reposition paddles and ball relative to new size
    this.leftPaddleY = (height - this.paddleHeight) / 2;
    this.rightPaddleY = (height - this.paddleHeight) / 2;
    this.ballPos = { x: width / 2, y: height / 2 };
  }

  private bindKeys() {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key);
      if (e.key === ' ') {
        this.togglePause();
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'r') {
        this.resetScores();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // store references to remove listeners later
    (this as any)._onKeyDown = onKeyDown;
    (this as any)._onKeyUp = onKeyUp;
  }

  private unbindKeys() {
    window.removeEventListener('keydown', (this as any)._onKeyDown);
    window.removeEventListener('keyup', (this as any)._onKeyUp);
  }

  private togglePause() {
    this.paused = !this.paused;
    this.onScoreChange(this.scoreLeft, this.scoreRight, this.paused);
  }

  private resetScores() {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.resetBall(Math.random() > 0.5 ? 1 : -1);
    this.onScoreChange(this.scoreLeft, this.scoreRight, this.paused);
  }

  private resetGame() {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.resetBall(Math.random() > 0.5 ? 1 : -1);
    this.onScoreChange(this.scoreLeft, this.scoreRight, this.paused);
  }

  private resetBall(direction = 1) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.ballPos = { x: width / 2, y: height / 2 };
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // small angle
    this.ballSpeed = 360;
    this.ballVel = {
      x: direction * this.ballSpeed * Math.cos(angle),
      y: this.ballSpeed * Math.sin(angle)
    };
  }

  private update(dt: number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Player input (left paddle) - supports W/S and Arrow keys as alternate
    let moveUp = this.keys.has('w') || this.keys.has('W');
    let moveDown = this.keys.has('s') || this.keys.has('S');

    // also allow arrow keys to control left paddle as alternative
    if (this.keys.has('ArrowUp')) moveUp = true;
    if (this.keys.has('ArrowDown')) moveDown = true;

    if (moveUp) {
      this.leftPaddleY -= this.paddleSpeed * dt;
    } else if (moveDown) {
      this.leftPaddleY += this.paddleSpeed * dt;
    }

    // Constrain paddles
    this.leftPaddleY = Math.max(0, Math.min(height - this.paddleHeight, this.leftPaddleY));

    // Simple AI for right paddle: follow ball with smoothing
    const aiCenter = this.rightPaddleY + this.paddleHeight / 2;
    const dir = (this.ballPos.y - aiCenter);
    const aiSpeed = this.paddleSpeed * 0.85; // slightly slower than player
    this.rightPaddleY += Math.sign(dir) * Math.min(Math.abs(dir), aiSpeed * dt);
    this.rightPaddleY = Math.max(0, Math.min(height - this.paddleHeight, this.rightPaddleY));

    // Physics: ball movement
    this.ballPos.x += this.ballVel.x * dt;
    this.ballPos.y += this.ballVel.y * dt;

    // Collide top/bottom
    if (this.ballPos.y - this.ballRadius < 0) {
      this.ballPos.y = this.ballRadius;
      this.ballVel.y *= -1;
    } else if (this.ballPos.y + this.ballRadius > height) {
      this.ballPos.y = height - this.ballRadius;
      this.ballVel.y *= -1;
    }

  // Left paddle collision
  const paddleLeft = 10;
  if (this.ballPos.x - this.ballRadius < paddleLeft + this.paddleWidth) {
      if (this.ballPos.y > this.leftPaddleY && this.ballPos.y < this.leftPaddleY + this.paddleHeight) {
        // reflect with angle based on where it hits the paddle
        const relativeY = (this.ballPos.y - (this.leftPaddleY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
        const bounceAngle = relativeY * (Math.PI / 3); // up to 60 degrees
        const speed = Math.hypot(this.ballVel.x, this.ballVel.y) * 1.03; // speed up slightly
        this.ballVel.x = Math.abs(speed * Math.cos(bounceAngle));
        this.ballVel.y = speed * Math.sin(bounceAngle);
  this.ballPos.x = paddleLeft + this.paddleWidth + this.ballRadius; // nudge out
      }
    }

    // Right paddle collision
    if (this.ballPos.x + this.ballRadius > width - (10 + this.paddleWidth)) {
      if (this.ballPos.y > this.rightPaddleY && this.ballPos.y < this.rightPaddleY + this.paddleHeight) {
        const relativeY = (this.ballPos.y - (this.rightPaddleY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
        const bounceAngle = relativeY * (Math.PI / 3);
        const speed = Math.hypot(this.ballVel.x, this.ballVel.y) * 1.03;
        this.ballVel.x = -Math.abs(speed * Math.cos(bounceAngle));
        this.ballVel.y = speed * Math.sin(bounceAngle);
        this.ballPos.x = width - (10 + this.paddleWidth) - this.ballRadius;
      }
    }

    // Scoring
    if (this.ballPos.x + this.ballRadius < 0) {
      this.scoreRight += 1;
      this.onScoreChange(this.scoreLeft, this.scoreRight, this.paused);
      this.resetBall(1);
    } else if (this.ballPos.x - this.ballRadius > width) {
      this.scoreLeft += 1;
      this.onScoreChange(this.scoreLeft, this.scoreRight, this.paused);
      this.resetBall(-1);
    }
  }

  private render() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    // background (subtle)
    ctx.fillStyle = '#071027';
    ctx.fillRect(0, 0, width, height);

    // center dashed line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // paddles
    ctx.fillStyle = '#7c3aed'; // left paddle (violet)
    ctx.fillRect(10, this.leftPaddleY, this.paddleWidth, this.paddleHeight);

    ctx.fillStyle = '#f59e0b'; // right paddle (amber)
    ctx.fillRect(width - 10 - this.paddleWidth, this.rightPaddleY, this.paddleWidth, this.paddleHeight);

    // ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.ballPos.x, this.ballPos.y, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // scores drawn by DOM; but draw small HUD
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = '12px monospace';
    ctx.fillText('W/S or ↑/↓ to move • Space pause • R reset', 12, height - 12);
  }
}