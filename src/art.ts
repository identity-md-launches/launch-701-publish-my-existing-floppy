import { FLOOR, HEIGHT, PLAYER_X, WIDTH } from './engine';
import type { Round } from './engine';

// Original pixel artwork, drawn with code. No network images or asset requests.
export function pepe(c: CanvasRenderingContext2D, x: number, y: number, size = 1, tilt = 0) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(size, size);
  const rect = (color: string, a: number, b: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(a, b, w, h); };
  rect('#091f1d', -19, -12, 36, 27); rect('#102a45', -13, 9, 27, 14);
  rect('#438de3', -10, 10, 22, 11); rect('#75b4ed', -9, 10, 21, 4); rect('#255baf', -6, 19, 18, 4);
  rect('#58a846', -18, -10, 34, 22); rect('#78c454', -17, -10, 31, 16);
  rect('#94da66', -15, -13, 12, 13); rect('#94da66', 2, -13, 12, 13);
  rect('#112e24', -15, -11, 12, 8); rect('#112e24', 2, -11, 12, 8);
  rect('#f4eed7', -14, -10, 10, 6); rect('#f4eed7', 3, -10, 10, 6);
  rect('#182825', -8, -9, 3, 5); rect('#182825', 9, -9, 3, 5);
  rect('#73b550', -14, -11, 10, 3); rect('#73b550', 3, -11, 10, 3);
  rect('#b5664d', -13, 3, 31, 6); rect('#773d35', -11, 5, 28, 2); rect('#d58a61', -11, 3, 27, 2);
  rect('#6cbb4d', -18, 13, 8, 6); rect('#8cce59', 11, 13, 9, 5);
  c.restore();
}
function ram(c: CanvasRenderingContext2D, x: number, y: number, h: number, gold: boolean, top: boolean) {
  if (h <= 0) return;
  c.fillStyle = '#06170f'; c.fillRect(x - 3, y, 54, h);
  c.fillStyle = gold ? '#957426' : '#346c38'; c.fillRect(x, y, 48, h);
  c.fillStyle = gold ? '#e7ba57' : '#57944d'; c.fillRect(x, y, 4, h);
  c.fillStyle = gold ? '#674c20' : '#204b2b'; c.fillRect(x + 44, y, 4, h);
  c.strokeStyle = gold ? '#c39b43' : '#609157'; c.lineWidth = 1;
  for (let v = y + 14; v < y + h - 16; v += 36) {
    c.fillStyle = '#111f20'; c.fillRect(x + 12, v, 23, 24);
    c.fillStyle = '#25352e'; c.fillRect(x + 14, v + 2, 19, 3);
    for (let k = 0; k < 5; k++) { c.fillStyle = '#a0b396'; c.fillRect(x + 9, v + k * 4 + 2, 3, 2); c.fillRect(x + 35, v + k * 4 + 2, 3, 2); }
    c.beginPath(); c.moveTo(x + 5, v + 8); c.lineTo(x + 5, v + 28); c.lineTo(x + 12, v + 32); c.stroke();
  }
  const edge = top ? y + h - 9 : y;
  c.fillStyle = gold ? '#f5cf6b' : '#9ac267'; c.fillRect(x, edge, 48, 9);
  for (let k = 0; k < 7; k++) { c.fillStyle = '#e5b954'; c.fillRect(x + 3 + k * 6, edge + 1, 4, 7); }
  c.fillStyle = '#10251d'; c.fillRect(x + 22, edge + (top ? 4 : 0), 5, 5);
}
export function draw(c: CanvasRenderingContext2D, round: Round, idle: boolean) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle = '#101e2a'; c.fillRect(0, 0, WIDTH, HEIGHT);
  c.strokeStyle = '#1a2b35'; c.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, FLOOR); c.stroke(); }
  for (let y = 0; y < FLOOR; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(WIDTH, y); c.stroke(); }
  for (let i = 0; i < 33; i++) {
    const x = (i * 137 + 31) % WIDTH, y = (i * 71 + 21) % 325;
    c.fillStyle = i % 4 === 0 ? '#63785c' : '#314951'; c.fillRect(x, y, 2, 2);
  }
  // Quiet circuit-board skyline.
  for (let i = 0; i < 17; i++) {
    const x = i * 39 - ((round.tick * .25) % 39), h = 26 + (i * 23 % 56);
    c.fillStyle = '#172f35'; c.fillRect(x, FLOOR - h, 28, h);
    c.fillStyle = '#26463e'; c.fillRect(x + 5, FLOOR - h + 8, 4, 3);
  }
  if (idle) {
    ram(c, 453, 0, 109, false, true); ram(c, 453, 291, FLOOR - 291, false, false);
    ram(c, 548, 0, 69, true, true); ram(c, 548, 322, FLOOR - 322, true, false);
    pepe(c, 107, 224, 1.4);
  } else {
    for (const o of round.obstacles) { const upper = o.center - o.gap / 2, lower = o.center + o.gap / 2; ram(c, o.x, 0, upper, o.gold, true); ram(c, o.x, lower, FLOOR - lower, o.gold, false); }
    pepe(c, PLAYER_X, round.y, 1, Math.max(-.23, Math.min(.55, round.velocity * .05)));
  }
  c.fillStyle = '#83bb58'; c.fillRect(0, FLOOR, WIDTH, 3);
  c.fillStyle = '#293f32'; c.fillRect(0, FLOOR + 3, WIDTH, HEIGHT - FLOOR);
  c.fillStyle = '#4d6040';
  for (let i = 0; i < 32; i++) c.fillRect(i * 22 - (round.tick * 2.55 % 22), FLOOR + 8, 11, 3);
}
