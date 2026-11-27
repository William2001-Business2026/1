/* ───────────────────────── the home screen: a film of the island ─────────────────────────
   Before you begin, the camera drifts through each zone in turn, the way a game's title sequence does: slow, eased moves, a
   dip to black between shots, and the zone's name and one line about it. Every shot is the live world, at the time of day you
   chose, so it shows what you will really find. */
const REEL=(()=>{
  const el=$('reel'),cap=el.querySelector('.cap'),fd=$('reelfade'),V=THREE.Vector3;
  const gy=(x,z,h)=>heightAt(x,z)+h;
  // a clear way through a zone: 14 m with no trunk within `gap` metres of it, found by trying spots in a fixed order
  const walks={},openWalk=(zone,gap)=>walks[zone]||(walks[zone]=findWalk(zone,gap)),findWalk=(zone,gap)=>{const R=rng(77);let best=null,bd=-1;
    for(let k=0;k<400;k++){const x=(R()-.5)*300,z=(R()-.5)*300,a=R()*6.283,dx=Math.sin(a),dz=Math.cos(a);if(zoneAt(x,z)!==zone||zoneAt(x+dx*14,z+dz*14)!==zone)continue;
      let m=1e9;for(let j=0;j<=10&&m>0;j++){const px=x+dx*1.4*j,pz=z+dz*1.4*j,q=riverQ(px,pz);if(q&&q.d<10||Math.hypot(px-POOL.x,pz-POOL.z)<30){m=0;break;}for(const c of colliders){const d=Math.hypot(c.x-px,c.z-pz)-c.r;if(d<m)m=d;}}
      if(m>bd){bd=m;best=[x,z,dx,dz];}if(m>gap)break;}
    const [x,z,dx,dz]=best||[62,22,0,-1];return[new V(x,gy(x,z,1.4),z),new V(x+dx*14,gy(x+dx*14,z+dz*14,1.9),z+dz*14),new V(x+dx*30,gy(x+dx*30,z+dz*30,2.5),z+dz*30),new V(x+dx*36,gy(x+dx*36,z+dz*36,5),z+dz*36)];};
  // each shot: [from, to] camera positions and [from, to] points to look at, built when the shot starts (some follow the world)
  const SHOTS=[
    {z:'Kahakai',e:'the beach',l:'Gather coconuts and driftwood, and build a home where the sand meets the trees.',d:9,
      mk:()=>{const fx=-Math.sin(START.yaw),fz=-Math.cos(START.yaw),sx=-fz,sz=fx,S=START; // low over the sand, drifting along the shore, looking out to sea
        return[new V(S.x+sx*9,gy(S.x+sx*9,S.z+sz*9,1.3),S.z+sz*9),new V(S.x-sx*5+fx*3,gy(S.x-sx*5+fx*3,S.z-sz*5+fz*3,2),S.z-sz*5+fz*3),new V(S.x+fx*60-sx*20,1,S.z+fz*60-sz*20),new V(S.x+fx*60-sx*28,2,S.z+fz*60-sz*28)];}},
    {z:'Wao Nahele',e:'the forest',l:'Koa and ʻōhiʻa over tree ferns. Track wild pigs and deer, and learn every bird in your book.',d:9,
      mk:()=>openWalk('forest',6)}, // a slow walk in under the canopy, looking up
    {z:'Wailele',e:'the waterfall pool',l:'The river falls from the mountain into a pool you can swim in, then winds through the forest to the sea.',d:9.5,
      mk:()=>{const f=FRESH.fallAt,P=POOL,ex=P.x-f.x,ez=P.z-f.z,el=Math.hypot(ex,ez)||1,ux=ex/el,uz=ez/el; // from the pool's way out, walking in, looking up the falls
        const a=[P.x+ux*48,P.z+uz*48],b=[P.x+ux*30,P.z+uz*30];return[new V(a[0],gy(a[0],a[1],1.5),a[1]),new V(b[0],gy(b[0],b[1],2.6),b[1]),new V(f.x,f.y+40,f.z),new V(f.x,f.y+110,f.z)];}},
    {z:'Kuahiwi',e:'the mountain',l:'Climb the fluted ridges to the summit, where the wind is loud and the cloud sits low. Somewhere up here, the river begins.',d:10,
      mk:()=>{const P=POOL,top=gy(P.x,P.z-900,0); // high over Waipiʻo's walls, up the valley toward Mauna Kea's real summit, 4,207 m, on the horizon
        return[new V(P.x+120,Math.max(top,heightAt(P.x+120,P.z-1100))+420,P.z-1100),new V(P.x+60,Math.max(top,heightAt(P.x+60,P.z-500))+520,P.z-500),new V(PEAK.x,PEAK_H*.55,PEAK.z),new V(PEAK.x,PEAK_H*.62,PEAK.z)];}},
    {z:'Lalo o ke Kai',e:'under the sea',l:'Dive the reef for fish, octopus and urchins, among honu and reef sharks. Come up for air in time.',d:9,
      mk:()=>{const sc=SEA.schools[0],h=sc?sc.home:{x:-40,z:120,h:-5},top=Math.min(-1,h.h+3.2);
        return[new V(h.x+9,top,h.z+6),new V(h.x+3.5,Math.min(-1,h.h+2.2),h.z+2),new V(h.x,h.h+1,h.z),new V(h.x-1,h.h+1.4,h.z-1)];}},
    {z:'Hale Moku',e:'your island',l:'One island, one wind, and a day that turns to night. Begin when you are ready.',d:11,
      mk:()=>[new V(LANAI.x+6,DECK_Y+26,LANAI.z+58),new V(LANAI.x+2,DECK_Y+17,LANAI.z+40),new V(LANAI.x-2,DECK_Y+1,LANAI.z),new V(LANAI.x-3,DECK_Y+1.5,LANAI.z-6)]}, // a high, slow descent over the beach to the lanai
  ];
  el.querySelector('.rd').innerHTML=SHOTS.map(()=>'<i></i>').join('');const dots=[...el.querySelectorAll('.rd i')];
  let i=-1,t=0,cur=null,on=true;const P=new V(),L=new V();
  function next(){i=(i+1)%SHOTS.length;t=0;const s=SHOTS[i];cur=s.mk();cap.classList.remove('on');
    el.querySelector('.rz').textContent=s.z;el.querySelector('.re').textContent=s.e;el.querySelector('.rl').textContent=s.l;dots.forEach((d,j)=>d.classList.toggle('on',j===i));}
  return{
    frame(dt){if(!on)return;if(i<0||t>SHOTS[i].d)next();t+=dt;const s=SHOTS[i],k=Math.min(1,t/s.d),e=.5-.5*Math.cos(Math.PI*k); // eased in and out
      P.lerpVectors(cur[0],cur[1],e);L.lerpVectors(cur[2],cur[3],e);
      if(P.y>-.5)P.y=Math.max(P.y,heightAt(P.x,P.z)+.9);                                         // never inside the ground
      camera.position.copy(P);camera.lookAt(L);camera.fov=settings.fov*.92;camera.updateProjectionMatrix();       // a slightly longer lens than play
      fd.style.opacity=String(Math.max(smooth(.9,0,t),smooth(s.d-.8,s.d,t)));                  // dip to black between shots
      cap.classList.toggle('on',t>1.1&&t<s.d-1.2);},
    stop(){on=false;el.classList.add('off');$('menu').classList.remove('reel');fd.style.transition='opacity .9s';fd.style.opacity='0';},
    get shot(){return i;},seek(n,at){i=n-1;next();t=at;}};                                    // seek: for tests
})();

/* ───────────────────────── menu ───────────────────────── */
function showPanel(id){document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id===id));}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.go)));
function begin(){
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  const fromTitle=state==='title';
  initAudio();initAudio2();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}state='play';menu.classList.add('hidden');lock();
  if(fromTitle){REEL.stop();camera.fov=settings.fov;camera.updateProjectionMatrix();}
  if(!introHint){introHint=12;player.from.copy(camera.position);player.trans=fromTitle?1:0;}                // from the film, cut straight to you (under a quick fade) rather than fly across the island
}
function openPause(){state='pause';showPanel('p-main');$('b-begin').textContent='Resume';$('b-restart').style.display='block';menu.classList.remove('hidden');mouseDown=false;for(const k in keys)keys[k]=false;}
$('b-begin').addEventListener('click',begin);
$('b-restart').addEventListener('click',()=>{restartEvening();begin();});
function bind(id,key,type,after){const el=$(id);if(type==='check')el.checked=settings[key];else el.value=settings[key];
  el.addEventListener('input',()=>{settings[key]=type==='check'?el.checked:type==='num'?parseFloat(el.value):el.value;saveSettings();after&&after();});}
let lastShadowsOn=null,csm=null,csmOn=false;
/* Cascaded shadow maps (High): three sun shadow maps of growing reach, sharp at your feet and still there 140 m away.
   Switching them on or off rebuilds the materials, so it only happens when the quality level changes. */
function setCSM(on){
  on=!!on&&settings.shadows;if(on===csmOn)return;csmOn=on;
  if(on){if(!csm){csm=new CSMShadowNode(sun,{cascades:3,maxFar:140,mode:'practical',lightMargin:80});csm.fade=true;}sun.shadow.shadowNode=csm;}
  else sun.shadow.shadowNode=null;
  scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});
}
function applyGraphics(){
  const g=activeGfx();
  sizeRenderer();
  scenePass.setResolutionScale(clamp(g.scale*settings.scale,.4,1));
  buildPost({ao:settings.post&&g.ao,bloom:settings.post&&g.bloom,grade:settings.post,aa:g.aa,rays:settings.post?g.rays||0:0});
  postU.uGrain.value=settings.post?.035:0;postU.uVig.value=settings.post?.55:0;
  if(sun.shadow.mapSize.x!==g.shadow){sun.shadow.mapSize.set(g.shadow,g.shadow);sun.shadow.needsUpdate=true;}
  setCSM(g.csm);if(csm&&csm.camera)csm.updateFrustums(); // the cascades find the camera on their first render
  const shOn=settings.shadows&&!g.noShadow;renderer.shadowMap.enabled=shOn;sun.castShadow=shOn&&sun.intensity>.05;
  lanternLight.castShadow=settings.shadows&&g.lantern;
  GRASS.quality(g);FLORA_NEAR=24+36*g.grass;try{FAUNA.quality(g);STREAM.budget=(/^Laptop/.test(g.name)?2.5:4)/(1+perf.cpuSave*.5);if(perf.cpuSave)FAUNA.quality({grass:g.grass*(1-.3*perf.cpuSave)});}catch(e){}   // (they may not exist yet at start-up); on a laptop the world fills in more gently
  $('v-fov').textContent='· '+settings.fov+'°';
  fpsEl.classList.toggle('on',!!settings.showFps);
  // materials only need rebuilding when shadows are switched on or off, not on every resize
  if(lastShadowsOn!==null&&lastShadowsOn!==shOn)scene.traverse(o=>{if(o.material&&o.isMesh)o.material.needsUpdate=true;});
  lastShadowsOn=shOn;
}
function describeGfx(){$('v-gfx').textContent=(GPU.name?'Graphics: '+GPU.name.slice(0,60)+(GPU.tier==='low'?' (integrated: Auto starts at Laptop)':'')+'. ':'')+'Drawing with '+GFX_API+(GFX_API==='WebGPU'?'':FORCE_GL?' (chosen in the address)':navigator.gpu?' (WebGPU could not start on this device)':' (this browser has no WebGPU)')+'. Up to 1920×1080 at 60 FPS.';}
function applyAudio(){if(!AU.ctx)return;const t=AU.ctx.currentTime;AU.master.gain.setTargetAtTime(settings.master,t,.05);AU.amb.gain.setTargetAtTime(settings.amb,t,.05);AU.mus.gain.setTargetAtTime(settings.music,t,.05);}
bind('s-quality','quality','str',applyGraphics);bind('s-scale','scale','num',applyGraphics);bind('s-shadows','shadows','check',applyGraphics);
bind('s-post','post','check',applyGraphics);bind('s-fps','showFps','check',applyGraphics);bind('s-fov','fov','num',applyGraphics);
bind('s-master','master','num',applyAudio);bind('s-amb','amb','num',applyAudio);bind('s-music','music','num',applyAudio);
bind('s-sens','sens','num');bind('s-view','view','str',()=>applyView());bind('s-invert','invertY','check');bind('s-bob','bob','check');bind('s-photo','photo','check');
$('v-time').textContent='· golden hour';
$('s-time').addEventListener('input',e=>{const v=+e.target.value;evening.running=false;W.clock.fast=false;W.clock.h=presetHour(v);applyTime(true);syncSlider();});
addEventListener('resize',applyGraphics);describeGfx();
function savePhoto(){
  post.render();const a=document.createElement('a');a.download='hale-moku-'+Date.now()+'.png';a.href=canvas.toDataURL('image/png');a.click();toast('Photo saved.',2);
}

