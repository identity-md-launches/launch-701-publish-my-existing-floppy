// Fixed-step, seeded simulation. Rendering and input never determine a score directly.
export const WIDTH = 600;
export const HEIGHT = 430;
export const FLOOR = 402;
export const PLAYER_X = 136;
export const RADIUS = 13;
export const STEP = 1000 / 60;
export type Obstacle = { x: number; center: number; base: number; gap: number; gold: boolean; passed: boolean; phase: number; moving: boolean };
export type Round = { tick: number; y: number; velocity: number; score: number; level: number; alive: boolean; seed: number; obstacles: Obstacle[]; passed: number; gold: number; reason: string };
export const difficulty = (level: number) => ({ speed: Math.min(5.4, 2.55 + (level - 1) * .3), gap: Math.max(112, 170 - (level - 1) * 9), moving: level >= 3 });
export function createRound(seed = Math.floor(Math.random() * 0xffffffff)): Round {
  return { tick: 0, y: 202, velocity: 0, score: 0, level: 1, alive: true, seed: seed || 1, obstacles: [], passed: 0, gold: 0, reason: '' };
}
function random(round: Round) {
  round.seed = (Math.imul(round.seed, 1664525) + 1013904223) >>> 0;
  return round.seed / 0x100000000;
}
export function hop(round: Round) { if (round.alive) round.velocity = -4.65; }
export function step(round: Round) {
  if (!round.alive) return;
  round.tick++;
  round.velocity += .245;
  round.y += round.velocity;
  const d = difficulty(round.level);
  if (!round.obstacles.length || round.obstacles[round.obstacles.length - 1].x <= WIDTH - 218) {
    const base = 145 + random(round) * 112;
    round.obstacles.push({ x: WIDTH + 20, base, center: base, gap: d.gap, gold: random(round) < .18, phase: random(round) * Math.PI * 2, moving: d.moving, passed: false });
  }
  for (const obstacle of round.obstacles) {
    obstacle.x -= d.speed;
    obstacle.center = obstacle.base + (obstacle.moving ? Math.sin(round.tick * .021 + obstacle.phase) * 24 : 0);
  }
  if (round.y - RADIUS <= 0) { round.alive = false; round.reason = 'Ceiling'; }
  if (round.y + RADIUS >= FLOOR) { round.alive = false; round.reason = 'Ground'; }
  for (const o of round.obstacles) {
    if (PLAYER_X + RADIUS > o.x && PLAYER_X - RADIUS < o.x + 48 && (round.y - RADIUS < o.center - o.gap / 2 || round.y + RADIUS > o.center + o.gap / 2)) {
      round.alive = false; round.reason = 'RAM';
    }
  }
  if (round.alive) {
    for (const o of round.obstacles) {
      if (!o.passed && o.x + 48 < PLAYER_X - RADIUS) {
        o.passed = true;
        round.score += o.gold ? 3 : 1;
        round.passed++;
        if (o.gold) round.gold++;
        round.level = 1 + Math.floor(round.score / 10);
      }
    }
  }
  round.obstacles = round.obstacles.filter(o => o.x > -55);
}
