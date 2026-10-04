import assert from 'node:assert/strict';
import { createRound, step, hop, difficulty, RADIUS, PLAYER_X } from '../src/engine.ts';
const checks=[];
let r=createRound(123);
const initial=r.y; hop(r); step(r); assert(r.y<initial); checks.push('Hop raises Pepe');
for(let i=0;i<250;i++) step(r);
assert(!r.alive && r.reason==='Ground'); checks.push('Gravity and ground collision');
r=createRound(1); r.y=RADIUS+1; hop(r); step(r); assert(!r.alive && r.reason==='Ceiling'); checks.push('Ceiling collision');
const obstacle = (gold=false) => ({ x:PLAYER_X-48-RADIUS+1,center:202,base:202,gap:170,gold,passed:false,phase:0,moving:false });
for (const [gold,points] of [[false,1],[true,3]]) { r=createRound(1); r.obstacles=[obstacle(gold)]; step(r); assert.equal(r.score,points); step(r); assert.equal(r.score,points); checks.push(`${gold?'Gold':'Normal'} RAM scores exactly +${points}, once`); }
r=createRound(1); r.y=70; r.obstacles=[{...obstacle(), x:PLAYER_X}]; step(r); assert(!r.alive && r.reason==='RAM' && r.score===0); checks.push('RAM collision awards no points');
for(const n of [9,19,29]) { r=createRound(1); r.score=n; r.level=1+Math.floor(n/10); r.obstacles=[obstacle()]; step(r); assert.equal(r.level,1+Math.floor((n+1)/10)); }
assert(difficulty(3).speed>difficulty(1).speed && difficulty(3).gap<difficulty(1).gap); assert(!difficulty(2).moving && difficulty(3).moving); checks.push('10-point levels, speed and gap progression');
r=createRound(1); r.level=3; step(r); const center=r.obstacles[0].center; step(r); assert.notEqual(r.obstacles[0].center, center); checks.push('Level 3 gap moves');
const a=createRound(120),b=createRound(120);
for(let i=0;i<100;i++){ if(i%30===0){hop(a);hop(b);} step(a);step(b); } assert.deepEqual(a,b); checks.push('Same seed/input trace reproduces exactly');
console.log(JSON.stringify({result:'pass',checks},null,2));
