import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import net from 'node:net';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const win=process.platform==='win32', apps=['frontend','admin'];
const [major,minor]=process.versions.node.split('.').map(Number);
const npm=(args,app)=>{const r=spawnSync(win?'npm.cmd':'npm',args,{cwd:path.join(root,app),stdio:'inherit',shell:win});if(r.error||r.status!==0)throw Error(`npm ${args.join(' ')} failed in ${app}`)};
const run=(args)=>{const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)throw Error(`Failed: ${args.join(' ')}`)};
const ready=app=>existsSync(path.join(root,app,'node_modules/vite/bin/vite.js'))&&existsSync(path.join(root,app,'node_modules/@supabase/supabase-js/package.json'));
const portFree=port=>new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(port,'127.0.0.1',()=>s.close(()=>resolve(true)))});
const env={...process.env,VITE_API_BASE_URL:'http://127.0.0.1:5080',VITE_AUTH_MODE:'demo',VITE_DEMO_MODE:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''};
const setup=()=>{for(const app of apps){if(ready(app)){console.log(`${app}: dependencies present`);continue}npm([existsSync(path.join(app,'package-lock.json'))?'ci':'install','--no-audit','--no-fund'],app)}};
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const c of children)c.kill();process.exitCode=code;}
function launch(args,cwd,extra){const c=spawn(process.execPath,args,{cwd,env:{...env,...extra},stdio:'inherit'});children.push(c);c.on('error',e=>{console.error(e.message);stop(1)});c.on('exit',(code)=>{if(!stopping){console.error('Service stopped:',cwd,code);stop(1)}});return c;}
async function wait(url){for(let i=0;i<100&&!stopping;i++){try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return}catch{}await new Promise(r=>setTimeout(r,300))}throw Error(`Service not ready: ${url}`)}
try{if(major<22||(major===22&&minor<16))throw Error('Node.js 22.16+ required');const cmd=process.argv[2]||'doctor';
if(cmd==='doctor'){console.log('Node:',process.version);for(const app of apps)console.log(app,ready(app)?'dependencies ready':'run setup');for(const p of [5080,5173,5174])console.log('Port',p,await portFree(p)?'free':'occupied');}
else if(cmd==='setup')setup();
else if(cmd==='test'){run(['scripts/validate-seed.mjs']);run(['scripts/test-all.mjs']);}
else if(cmd==='build'){setup();for(const app of apps)npm(['run','build'],app);console.log('Build complete: frontend/dist and admin/dist');}
else if(cmd==='start'){for(const p of [5080,5173,5174])if(!await portFree(p))throw Error(`Port ${p} occupied. Stop previous DOP session or other service.`);setup();mkdirSync('.local',{recursive:true});process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());launch(['mock-api/server.mjs'],root,{PORT:'5080',MOCK_DB:path.join(root,'.local','demo.json'),DOP_AUTH_MODE:'demo',DOP_PUBLIC_BASE_URL:'http://127.0.0.1:5080'});await wait('http://127.0.0.1:5080/api/v3/products');for(const [i,app] of apps.entries())launch(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(5173+i),'--strictPort'],path.join(root,app),{});await Promise.all([wait('http://127.0.0.1:5173'),wait('http://127.0.0.1:5174')]);console.log('\nDOP Mart ready (LOCAL DEMO ONLY)\nStorefront http://127.0.0.1:5173\nAdmin http://127.0.0.1:5174\nCtrl+C to stop all services.\n');}
else throw Error('Unknown command: '+cmd);
}catch(e){console.error(e.message);stop(1)}
