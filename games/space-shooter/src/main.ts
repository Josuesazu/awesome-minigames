type Vec = { x: number; y: number };

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const healthEl = document.getElementById('health')!;

const dpr = window.devicePixelRatio || 1;

// logical drawing size in CSS pixels (updated by resizeCanvas)
let W = 480;
let H = 640;
let initialized = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(240, Math.round(rect.width || 480));
  // choose an aspect ratio 3:4 (w:h) to match original 480x640
  const cssH = Math.max(320, Math.round(cssW * (640 / 480)));

  // store logical CSS size
  const oldW = W;
  const oldH = H;
  const scaleX = cssW / oldW;
  const scaleY = cssH / oldH;

  W = cssW;
  H = cssH;

  // set backing store for crisp rendering
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // scale existing entities to new coordinate space (only after init)
  if (initialized) {
    // player
    if (player && player.pos) {
      player.pos.x *= scaleX;
      player.pos.y *= scaleY;
    }
    // bullets
    for (const b of bullets) {
      b.pos.x *= scaleX;
      b.pos.y *= scaleY;
      b.vel.x *= scaleX;
      b.vel.y *= scaleY;
    }
    // enemies
    for (const e of enemies) {
      e.pos.x *= scaleX;
      e.pos.y *= scaleY;
      // size scales with average scale
      e.size = Math.max(8, Math.round(e.size * ((scaleX + scaleY) / 2)));
    }
  }
}


// debounced resize
let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resizeCanvas();
  }, 150);
});

// Game state
let score = 0;
// configurable initial health (change this value to set starting health)
const initialHealth = 100;
let health = initialHealth;
let running = false; // game loop progresses only when running is true
let gameOver = false;

// persistent high score
const highScoreKey = 'space-shooter-highscore';
let highScore = Number(localStorage.getItem(highScoreKey) || 0);
const highscoreEl = document.getElementById('highscore');
if (highscoreEl) highscoreEl.textContent = String(highScore);

// enemy movement tuning
// enemy vertical drop speed (px/s). increased for more responsive gameplay
let baseDropSpeed = 60; // px/s (was 6)
let enemyDropSpeed = baseDropSpeed;
let waveNumber = 1;
const dropSpeedIncrement = 1.5;

const player = {
  // start near bottom-right with a small margin so it visually sits on the right side
  pos: { x: Math.max(80, W - 36), y: Math.max(120, H - 40) } as Vec,
  size: { w: 40, h: 20 },
  speed: 320, // px/s (a bit faster)
  cooldown: 0, // seconds
  cooldownTime: 0.25
};

const bullets: { pos: Vec; vel: Vec; }[] = [];
const enemies: { pos: Vec; size: number; alive: boolean; }[] = [];

// create initial enemy wave
function spawnWave(rows = 3, cols = 6) {
  enemies.length = 0;
  const padding = 20;
  const startY = 40;
  const spacingX = (W - padding * 2) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
  enemies.push({ pos: { x: padding + c * spacingX + spacingX/2, y: startY + r * 40 }, size: Math.max(12, Math.round(W/20)), alive: true });
    }
  }
  // set drop speed based on wave number (increases each wave)
  enemyDropSpeed = baseDropSpeed + (waveNumber - 1) * dropSpeedIncrement;
}

spawnWave();

// Input
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (e) => {
  // normalize space handling and prevent page scroll
  if (e.code === 'Space') {
    e.preventDefault();
    keys['Space'] = true;
    // immediate shot on keydown (cooldown still applies)
    shoot();
    return;
  }
  keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    keys['Space'] = false;
    return;
  }
  keys[e.key] = false;
});

function shoot() {
  if (player.cooldown > 0) return;
  bullets.push({ pos: { x: player.pos.x, y: player.pos.y - 10 }, vel: { x: 0, y: -420 } });
  player.cooldown = player.cooldownTime;
}

function update(dt: number) {
  if (gameOver || !running) return;
  // player movement
  const left = keys['ArrowLeft'] || keys['a'];
  const right = keys['ArrowRight'] || keys['d'];
  if (left && !right) player.pos.x -= player.speed * dt;
  if (right && !left) player.pos.x += player.speed * dt;
  player.pos.x = Math.max(player.size.w/2, Math.min(W - player.size.w/2, player.pos.x));

  // shooting
  if (keys[' '] || keys['Space']) shoot();
  if (player.cooldown > 0) player.cooldown = Math.max(0, player.cooldown - dt);

  // bullets
  for (let i = bullets.length -1; i >=0; i--) {
    const b = bullets[i];
    b.pos.x += b.vel.x * dt;
    b.pos.y += b.vel.y * dt;
  if (b.pos.y < -10) bullets.splice(i,1);
  }

  // simple enemy movement: oscillate and drop slowly
  const time = performance.now() / 1000;
  const oscAmp = Math.max(18, Math.round(W / 30)); // larger amplitude for wider screens
  for (const e of enemies) {
    if (!e.alive) continue;
    e.pos.x += Math.sin(time * 1.5 + e.pos.y * 0.01) * oscAmp * dt;
    e.pos.y += enemyDropSpeed * dt;
    // check collision with player (physical overlap on X and Y): only a real overlap kills immediately
    const dx = Math.abs(e.pos.x - player.pos.x);
    const overlapX = dx < (e.size / 2 + player.size.w / 2);
    const hitY = e.pos.y + e.size / 2 >= player.pos.y - player.size.h / 2;
    if (overlapX && hitY) {
      // mark enemy dead to avoid double-processing
      e.alive = false;
      // immediate game over on physical contact
      handleGameOver();
      return; // stop update loop now that game is over
    }
  }

  // check for enemies that passed the player (missed)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.alive) continue;
    if (e.pos.y - e.size/2 > player.pos.y + player.size.h/2) {
      // enemy passed player: penalize score and health
      e.alive = false;
      score = Math.max(0, score - 10);
      (scoreEl as HTMLElement).textContent = String(score);
      health -= 1;
      (healthEl as HTMLElement).textContent = String(health);
      // remove enemy from array
      enemies.splice(i, 1);
      if (health <= 0) {
        handleGameOver();
        return;
      }
    }
  }

  // collisions
  for (let i = enemies.length -1; i >=0; i--) {
    const en = enemies[i];
    if (!en.alive) continue;
    for (let j = bullets.length -1; j >=0; j--) {
      const b = bullets[j];
      const dx = Math.abs(b.pos.x - en.pos.x);
      const dy = Math.abs(b.pos.y - en.pos.y);
      if (dx < en.size/2 && dy < en.size/2) {
        en.alive = false;
        bullets.splice(j,1);
        score += 10;
        (scoreEl as HTMLElement).textContent = String(score);
        // when an enemy dies, advance the remaining enemies downward a bit
        for (const other of enemies) {
          if (other.alive) other.pos.y += Math.max(8, Math.round(W / 60));
        }
        break;
      }
    }
  }

  // remove fully dead enemies to keep array compact
  for (let i = enemies.length -1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1);
  }

  // respawn wave if cleared
  if (!enemies.some(e => e.alive)) {
    // wave cleared: award bonus (+10) but do not exceed 100
    score = Math.min(100, score + 10);
    (scoreEl as HTMLElement).textContent = String(score);
    // increment wave number and spawn next wave (columns scale with width)
  waveNumber += 1;
  const waveEl = document.getElementById('wave');
  if (waveEl) waveEl.textContent = String(waveNumber);
    spawnWave(3, Math.max(4, Math.floor(W / 80)));
  }
}

function draw() {
  // clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);

  // draw player
  ctx.fillStyle = '#0bf';
  ctx.fillRect(player.pos.x - player.size.w/2, player.pos.y - player.size.h/2, player.size.w, player.size.h);

  // draw bullets
  ctx.fillStyle = '#ff0';
  for (const b of bullets) {
    ctx.fillRect(b.pos.x-2, b.pos.y-6, 4, 12);
  }

  // draw enemies (rounded rects to keep consistent shape when scaled)
  ctx.fillStyle = '#fb7185';
  for (const e of enemies) {
    if (!e.alive) continue;
    const w = e.size;
    const h = Math.max(10, Math.round(e.size * 0.8));
    const x = e.pos.x - w/2;
    const y = e.pos.y - h/2;
    const r = Math.max(4, Math.round(w * 0.12));
    // rounded rect path
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
}

let last = performance.now();
function loop(now = performance.now()) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  score = 0;
  health = initialHealth;
  waveNumber = 1;
  const waveEl = document.getElementById('wave');
  if (waveEl) waveEl.textContent = String(waveNumber);
  bullets.length = 0;
  spawnWave();
  (scoreEl as HTMLElement).textContent = String(score);
  (healthEl as HTMLElement).textContent = String(health);
}

function handleGameOver() {
  gameOver = true;
  // show overlay
  const overlay = document.getElementById('gameOverOverlay');
  const finalScore = document.getElementById('finalScore');
  const finalHigh = document.getElementById('finalHigh');
  if (finalScore) finalScore.textContent = String(score);

  // update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(highScoreKey, String(highScore));
  }
  if (finalHigh) finalHigh.textContent = String(highScore);
  if (highscoreEl) highscoreEl.textContent = String(highScore);

  if (overlay) overlay.classList.remove('hidden');
}

function doRestart() {
  gameOver = false;
  const overlay = document.getElementById('gameOverOverlay');
  if (overlay) overlay.classList.add('hidden');
  resetGame();
  // start the game immediately after restart
  running = true;
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.textContent = 'Pause';
}

// wire restart buttons
const restartBtn = document.getElementById('restart');
if (restartBtn) restartBtn.addEventListener('click', () => doRestart());
const overlayRestart = document.getElementById('overlayRestart');
if (overlayRestart) overlayRestart.addEventListener('click', () => doRestart());

// wire start and pause buttons
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
if (startBtn) startBtn.addEventListener('click', () => {
  running = true;
  if (pauseBtn) pauseBtn.textContent = 'Pause';
});
if (pauseBtn) pauseBtn.addEventListener('click', () => {
  running = !running;
  pauseBtn.textContent = running ? 'Pause' : 'Resume';
});

requestAnimationFrame(loop);

// initial sizing after setup
resizeCanvas();
initialized = true;
