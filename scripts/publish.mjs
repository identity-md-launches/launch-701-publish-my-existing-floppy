// Publish only the completed dist/ export. Credentials are read from the process environment.
// Uses the Cloudflare Workers Static Assets direct-upload API; no build or dependency installation.
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';
const name = 'floppy-pepe';
const account = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN;
const apiBase = 'https://api.cloudflare.com/client/v4';
const report = { service:'Cloudflare Workers Static Assets', name, time:new Date().toISOString(), result:'not published' };
const manifest = {}, files = new Map();
async function collect(dir, prefix='') {
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  if(entry.isSymbolicLink()) throw Error('Export contains a symlink');
  const file=join(dir,entry.name), path=prefix+'/'+entry.name;
  if(entry.isDirectory()) await collect(file,path);
  else {
   if(/(?:node_modules|\.env|\.tgz|\.map)/.test(path)) throw Error('Unexpected packaging artifact');
   const data=await readFile(file), hash=createHash('sha256').update(data).digest('hex').slice(0,32);
   manifest[path]={hash,size:data.length}; files.set(hash,{data,path});
  }
 }
}
async function api(path, options={}, bearer=token) {
 const response=await fetch(apiBase+path,{...options,headers:{Authorization:`Bearer ${bearer}`,...options.headers},signal:AbortSignal.timeout(60000)});
 const json=await response.json();
 if(!response.ok||!json.success) {const error=new Error(`${response.status}: ${(json.errors||[]).map(e=>`${e.code} ${e.message}`).join('; ')}`);error.status=response.status;throw error;}
 return json.result;
}
try {
 await stat('dist/index.html'); await collect('dist');
 if(process.argv.includes('--dry-run')) {console.log(JSON.stringify({name,files:manifest},null,2));process.exit(0);}
 if(!account||!token) throw Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Workers Scripts Edit).');
 const base=`/accounts/${account}/workers`;
 if(process.argv.includes('--inline')) {
  report.stage='inline worker deployment';
  const contents={};for(const {path,data} of files.values())contents[path]=data.toString('base64');
  const code='const files='+JSON.stringify(contents)+'; export default { async fetch(request) { const url=new URL(request.url); const path=url.pathname==="/"?"/index.html":url.pathname; const data=files[path]; if(!data)return new Response("Not found",{status:404}); const ext=path.split(".").pop(); const type={html:"text/html;charset=utf-8",js:"text/javascript",css:"text/css",svg:"image/svg+xml",txt:"text/plain"}[ext]||"application/octet-stream"; return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{"Content-Type":type,"Cache-Control":"public,max-age=300","X-Content-Type-Options":"nosniff"}}); } };';
  const form=new FormData();form.append('metadata',new Blob([JSON.stringify({main_module:'worker.js',compatibility_date:'2026-09-01'})],{type:'application/json'}));form.append('worker.js',new Blob([code],{type:'application/javascript+module'}),'worker.js');
  const deployed=await api(`${base}/scripts/${name}`,{method:'PUT',body:form});report.version=deployed.deployment_id;
 } else {
 report.stage='asset manifest';
 const session=await api(`${base}/scripts/${name}/assets-upload-session`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({manifest})});
 let completion=session.jwt;
 for(const bucket of session.buckets) {
  const form=new FormData();
  for(const hash of bucket) {
   const {data,path}=files.get(hash);
   const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.txt':'text/plain'}[extname(path)]||'application/octet-stream';
   form.append(hash,new Blob([data.toString('base64')],{type:mime}),hash);
  }
  report.stage='asset upload';
  const uploaded=await api(`${base}/assets/upload?base64=true`,{method:'POST',body:form},session.jwt);
  if(uploaded?.jwt)completion=uploaded.jwt;
 }
 report.stage='worker deployment';
 const form=new FormData();
 form.append('metadata',new Blob([JSON.stringify({main_module:'worker.js',compatibility_date:'2026-09-01',assets:{jwt:completion},bindings:[{type:'assets',name:'ASSETS'}]})],{type:'application/json'}));
 form.append('worker.js',new Blob(['export default { fetch(request, env) { return env.ASSETS.fetch(request); } };'],{type:'application/javascript+module'}),'worker.js');
 const deployed=await api(`${base}/scripts/${name}`,{method:'PUT',body:form});
 report.version=deployed.deployment_id;
 }
 report.stage='public workers.dev route';
 await api(`${base}/scripts/${name}/subdomain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 const subdomain=await api(`${base}/subdomain`);
 report.url=`https://${name}.${subdomain.subdomain}.workers.dev/`;
 const check=await fetch(report.url,{signal:AbortSignal.timeout(30000)});
 if(!check.ok||!(await check.text()).includes('FLOPPY PEPE'))throw Error('Anonymous public HTML verification failed');
 report.result='published; public HTML verified; run browser checks against this URL';
} catch(error) {report.error=error.message;process.exitCode=1;}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/publication.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
