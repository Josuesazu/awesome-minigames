import './style.css';
import { PingPongGame } from './game';

const container = document.getElementById('canvas-wrapper')!;
const scoreEl = document.getElementById('score')!;

const game = new PingPongGame(container as HTMLElement, (left, right, paused) => {
  scoreEl.innerHTML = `
    <div class="text-indigo-400">Left: ${left}</div>
    <div class="text-amber-400">Right: ${right}</div>
    <div class="text-neutral-400 ml-4">${paused ? 'Paused' : ''}</div>
  `;
});

game.start();

// Hot reload: preserve state on HMR by disposing game
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    game.stop();
  });
}