// Screenshots of a virtual experience from chosen spots, in headless WebGPU (or WebGL 2).
// usage: VIEWS='[["warm",x,z,yaw,pitch],["name",x,z,yaw,pitch]]' Q=medium PORT=8765 node views.js <prefix> [webgpu|webgl]
// The first view often shows the previous position: repeat it (as "warm") and read the later images.
const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
(async () => {
  const mode=process.argv[3]||'webgpu',port=process.env.PORT||8765,out=process.env.OUT||path.join(process.cwd(),'shots');fs.mkdirSync(out,{recursive:true});
  const args=mode==='webgpu'?['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--disable-vulkan-surface']:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
  const b=await chromium.launch({args}); const p=await b.newPage({viewport:{width:960,height:540}}); const errs=new Set();
  p.on('pageerror',e=>errs.add(String(e).slice(0,300)));p.on('console',m=>{if(m.type()==='error')errs.add(m.text().slice(0,300))});
  if(mode==='webgpu') await p.addInitScript({path:path.join(__dirname,'fakegpu.js')});
  await p.addInitScript(q=>localStorage.setItem('halemoku',JSON.stringify({v:2,quality:q[0],bob:false,view:q[1]})),[process.env.Q||'medium',process.env.VIEW||'first']);
  await p.goto(`http://localhost:${port}/index.html`+(mode==='webgl'?'?renderer=webgl':'')); await p.waitForFunction(()=>window.__hm,null,{timeout:150000});
  await p.evaluate(()=>{document.getElementById('b-begin').click();window.__hm.player.trans=1;}); await p.waitForTimeout(4000);
  if(process.env.TIME)await p.evaluate(v=>{const s=document.getElementById('s-time');s.value=v;s.dispatchEvent(new Event('input'));},+process.env.TIME);
  for(const [name,x,z,yaw,pitch] of JSON.parse(process.env.VIEWS||'[]')){
    await p.evaluate(([x,z,yaw,pitch])=>{const P=window.__hm.player;P.x=x;P.z=z;P.y=window.__hm.groundAt(x,z);P.yaw=yaw;P.pitch=pitch;P.air=false;P.vy=0;},[x,z,yaw,pitch]);
    await p.waitForTimeout(mode==='webgpu'?14000:9000);
    const png=mode==='webgpu'?Buffer.from((await p.evaluate(()=>window.__grab())).split(',')[1],'base64'):await p.screenshot({timeout:180000});
    fs.writeFileSync(path.join(out,`${process.argv[2]}-${name}.png`),png);
    console.log(name,JSON.stringify(await p.evaluate(()=>window.__gfx?window.__gfx():{})));}
  console.log([...errs].join('\n')||'no errors'); await b.close();
})();
