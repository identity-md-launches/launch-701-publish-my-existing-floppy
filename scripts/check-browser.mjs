import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
await mkdir('artifacts', { recursive: true });
const root = resolve('dist');
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/favicon.ico') { res.writeHead(204).end(); return; }
    if (!path.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, path.slice(9) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' }[extname(file)] || 'text/plain' }); res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0,'127.0.0.1',done));
const url = process.env.PUBLIC_GAME_URL || `http://127.0.0.1:${server.address().port}/preview/`;
const report = { scope:'Production practice game; no shared backend', url, viewports:[], interactions:[], errors:[], screenshots:[] };
function contrast(a,b) {
 const l=s=>{const [r,g,b]=s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return .2126*r+.7152*g+.0722*b;};
 return +((Math.max(l(a),l(b))+.05)/(Math.min(l(a),l(b))+.05)).toFixed(2);
}
let browser;
try {
 browser=await chromium.launch({headless:true});
 for(const width of [320,390,768,1280]) {
  const ctx=await browser.newContext({viewport:{width,height:1000},hasTouch:width<500,reducedMotion:'reduce'}), page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('requestfailed',r=>report.errors.push(r.url()+': '+r.failure().errorText));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url()+': '+r.status());});
  await page.goto(url); await page.getByRole('button',{name:'Play',exact:true}).waitFor();
  assert.equal(await page.locator('.mode-badge').innerText(),'Practice mode');
  assert(await page.locator('.claim-button').isDisabled());
  assert.equal(await page.locator('.competition-note p').innerText(),'The competition lasts 10 days. The player ranked #1 at the end will receive 5 IMD. The reward will be sent manually by the organizer after the competition ends.');
  assert.equal(await page.getByRole('link',{name:'IMD (opens in a new tab)'}).getAttribute('href'),'https://imd.fun');
  assert(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
  const fits=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
  assert(await fits(),`Overflow ${width}`);
  const cabinet=await page.locator('.cabinet').boundingBox(), claim=await page.locator('.claim-panel').boundingBox();
  assert(width<761?claim.y+claim.height<=cabinet.y:claim.x>cabinet.x,'Claim position');
  const scan=await new AxeBuilder({page}).analyze();
  assert.equal(scan.violations.length,0,JSON.stringify(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
  const pairs=await page.evaluate(()=>['.primary','.mode-badge','.claim-panel','.arcade-controls button','.competition-status','thead'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));return {selector,color:s.color,background:s.backgroundColor};}));
  const measured=pairs.map(p=>({...p,ratio:contrast(p.color,p.background)})); assert(measured.every(p=>p.ratio>=4.5),JSON.stringify(measured));
  await page.getByRole('button',{name:'Play',exact:true}).focus();
  assert.equal(await page.locator('.primary').evaluate(el=>getComputedStyle(el).outlineWidth),'3px');
  {const path=`artifacts/game-${width}.png`;await page.screenshot({path,fullPage:true});report.screenshots.push(path);}
  await page.getByRole('button',{name:'INFO',exact:true}).click(); assert(await page.locator('dialog').isVisible());
  const dialogScan=await new AxeBuilder({page}).analyze(); assert.equal(dialogScan.violations.length,0,JSON.stringify(dialogScan.violations.map(v=>v.id)));
  await page.keyboard.press('Escape'); assert(!(await page.locator('dialog').isVisible())); assert.equal(await page.evaluate(()=>document.activeElement.textContent),'INFO');
  await page.locator('.player-name button').click(); await page.getByLabel('Player name',{exact:true}).fill('');
  await page.getByRole('button',{name:'Save name'}).click(); assert.equal(await page.getByLabel('Player name',{exact:true}).getAttribute('aria-invalid'),'true'); assert.equal(await page.evaluate(()=>document.activeElement.id),'nickname');
  await page.getByLabel('Player name',{exact:true}).fill('Frog 42');
  await page.getByRole('button',{name:'Save name'}).click(); await page.reload(); assert.equal(await page.locator('.player-name button').innerText(),'Frog 42');
  await page.clock.install();
  if(width<500) await page.getByRole('button',{name:'Play',exact:true}).tap(); else await page.getByRole('button',{name:'Play',exact:true}).click();
  assert.equal(await page.locator('.screen').getAttribute('data-phase'),'playing');
  const y=await page.evaluate(()=>scrollY); await page.keyboard.press('Space'); await page.clock.runFor(100); assert.equal(await page.evaluate(()=>scrollY),y);
  if(width<500) await page.locator('canvas').tap(); else await page.locator('canvas').click();
  await page.clock.runFor(50); await page.keyboard.press('Escape'); assert.equal(await page.locator('.screen').getAttribute('data-phase'),'paused');
  await page.getByRole('button',{name:'Resume',exact:true}).click(); await page.clock.runFor(4000);
  assert.equal(await page.locator('.screen').getAttribute('data-phase'),'over'); assert((await page.locator('.overlay-hint').innerText()).includes('GROUND'));
  await page.getByRole('button',{name:'Play again'}).click(); await page.clock.runFor(100); await page.getByRole('button',{name:'RESET',exact:true}).click();
  assert.equal(await page.locator('#score').innerText(),'00'); assert.equal(await page.locator('.screen').getAttribute('data-phase'),'playing');
  await page.getByRole('button',{name:'Sound',exact:true}).click(); assert.equal(await page.getByRole('button',{name:'Sound',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Sound',exact:true}).click(); assert.equal(await page.getByRole('button',{name:'Sound',exact:true}).getAttribute('aria-pressed'),'false');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('.screen').getAttribute('data-phase'),'paused');
  await page.getByRole('button',{name:'STATS',exact:true}).click(); assert.equal(await page.locator('.stats-grid dd').nth(2).innerText(),'1'); await page.keyboard.press('Escape');
  assert(await fits(),`Final state overflow ${width}`);
  report.viewports.push({width,height:1000,axeViolations:0,layout:'fits; claim responsive',controls:width<500?'emulated touch + keyboard':'pointer + keyboard',contrast:measured});
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:1280,height:1000},permissions:['clipboard-read','clipboard-write']}), page=await ctx.newPage();
 await page.addInitScript(()=>{window.__audioStarts=0;const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...args){window.__audioStarts++;return start.apply(this,args);};});
 await page.goto(url); await page.getByRole('button',{name:'Sound',exact:true}).click(); assert.equal(await page.evaluate(()=>window.__audioStarts),1);
 await page.getByRole('button',{name:'Play',exact:true}).click(); assert.equal(await page.evaluate(()=>window.__audioStarts),2);
 await page.keyboard.press('Space'); assert.equal(await page.evaluate(()=>window.__audioStarts),3);
 await page.getByRole('button',{name:'Sound',exact:true}).click(); await page.locator('canvas').focus(); await page.keyboard.press('Space'); assert.equal(await page.evaluate(()=>window.__audioStarts),3);
 await page.getByRole('button',{name:'SHARE',exact:true}).click(); assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('FLOPPY PEPE practice mode'));
 report.interactions.push('Audio starts on enable and hops; muted sound does not start','Share copies game link and practice best'); await ctx.close();
 // Autoplay the actual canvas from pixel observations; no internal state or test hook.
 const game=await browser.newPage({viewport:{width:1280,height:1000}}); await game.addInitScript(()=>Math.random=()=>.5); await game.clock.install(); await game.goto(url); await game.getByRole('button',{name:'Play',exact:true}).click();
 let previousY=202;
 for(let i=0;i<2200;i++) {
  const o=await game.locator('canvas').evaluate(c=>{
   const p=c.getContext('2d').getImageData(0,0,600,430).data, at=(x,y)=>[p[(y*600+x)*4],p[(y*600+x)*4+1],p[(y*600+x)*4+2]];
   const blue=[];for(let y=0;y<400;y++){const [r,g,b]=at(136,y);if(b>150&&r<150&&g>60&&g<200)blue.push(y);}
   const y=blue.length?(Math.min(...blue)+Math.max(...blue))/2-16:202;let target=200;
   for(let x=119;x<450;x++){const [r,g,b]=at(x,0);if((g===108&&r===52)||(r===149&&g===116)||(r===87&&g===148)||(r===231&&g===186)){const air=[];for(let k=40;k<360;k++){const [r,g,b]=at(x,k);if(r===16&&g===30&&b===42)air.push(k);}if(air.length>70){target=(air[0]+air.at(-1))/2;break;}}}return {y,target};
  });
  if(o.y>o.target+5&&o.y>=previousY-2)await game.keyboard.press('Space');previousY=o.y;
  await game.clock.runFor(50);
  if(await game.locator('.screen').getAttribute('data-phase')==='over'||Number(await game.locator('#score').innerText())>=23)break;
 }
 const score=Number(await game.locator('#score').innerText()),level=Number(await game.locator('#level').innerText());
 assert(score>=20&&level>=3,`Autoplayer achieved ${score}, level ${level}`);
 await game.keyboard.press('Escape'); await game.screenshot({path:'artifacts/game-level-3.png',fullPage:true}); report.screenshots.push('artifacts/game-level-3.png');
 await game.getByRole('button',{name:'Resume',exact:true}).click();await game.clock.runFor(4500);await game.reload();assert(Number(await game.locator('.scoreboard strong').nth(1).innerText())>=20);
 report.interactions.push(`Canvas played from pixels: ${score} points, level ${level}; best survives reload`);await game.close();
 const privatePage=await browser.newPage();await privatePage.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('storage disabled');};});await privatePage.goto(url);
 assert((await privatePage.locator('.notification').innerText()).includes('Device storage is unavailable'));await privatePage.getByRole('button',{name:'Play',exact:true}).click();assert.equal(await privatePage.locator('.screen').getAttribute('data-phase'),'playing');await privatePage.close();
 report.interactions.push('Storage failure still allows practice and displays warning');
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:undefined});Object.defineProperty(navigator,'share',{value:undefined});});await fallback.goto(url);await fallback.getByRole('button',{name:'SHARE',exact:true}).click();assert((await fallback.getByLabel('Game link and score').inputValue()).includes(url));await fallback.close();
 report.interactions.push('Share falls back to selectable text if clipboard and native share are unavailable');
 assert.equal(report.errors.length,0,JSON.stringify(report.errors));report.result='pass';await writeFile('artifacts/browser-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally {await browser?.close();await new Promise(done=>server.close(done));}
