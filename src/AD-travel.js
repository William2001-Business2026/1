/* ───────── water you move through, the raft, travelling between camps, and the sound of the land ─────────
   - Splashes: running or walking through shallow water throws up spray at each step, more the faster and deeper you go.
   - The raft: stand on it and walk, and you pole it along; it stops at the shore and you step off. On the river the current
     carries you both downstream.
   - Travel between camps: at a fire ring with nothing to take from it, E offers the other fire rings you have built and home. You
     go, and the hours it would take on foot pass.
   - Echo: near a cliff, your steps, calls and splashes come back off the rock a moment later.
   - Slack-key: at dawn and dusk a few unhurried phrases of slack-key guitar drift in now and then. */
const TRAVEL=(()=>{
  const V3=THREE.Vector3;
  // ── splashes
  const NS=90,sg=new THREE.SphereGeometry(.03,5,4),sm=new THREE.MeshBasicNodeMaterial({color:srgb(.85,.9,.92),transparent:true,opacity:.75,depthWrite:false});
  const spl=new THREE.InstancedMesh(sg,sm,NS);spl.frustumCulled=false;spl.count=NS;spl.raycast=()=>{};scene.add(spl);
  const D=Array.from({length:NS},()=>({t:9})),M=new THREE.Matrix4(),T=new V3(),Q=new THREE.Quaternion(),S=new V3();let si=0;
  function splash(x,y,z,n,sp){for(let i=0;i<n;i++){const d=D[si++%NS],a=Math.random()*6.283,r=Math.random()*sp;Object.assign(d,{x,y,z,vx:Math.cos(a)*r+(player.mv?player.mv.x*.3:0),vz:Math.sin(a)*r+(player.mv?player.mv.z*.3:0),vy:1.2+Math.random()*sp*1.6,t:0,s:.6+Math.random()*1.2});}}
  function splashTick(dt){for(let i=0;i<NS;i++){const d=D[i];if(d.t>1.2){M.makeScale(0,0,0);spl.setMatrixAt(i,M);continue;}d.t+=dt;d.vy-=9.8*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;
      const k=Math.max(0,1-d.t/1.1)*d.s;M.compose(T.set(d.x,d.y,d.z),Q,S.set(k,k*1.6,k));spl.setMatrixAt(i,M);}spl.instanceMatrix.needsUpdate=true;}
  let lastStride=0,wasDry=true;
  function wadeTick(){const fw=freshAt(player.x,player.z),h=heightAt(player.x,player.z),wy=fw!=null&&fw>h?fw:h<0?water.position.y:null,dep=wy==null?0:wy-player.y;
    const v=player.mv?Math.hypot(player.mv.x,player.mv.z):0;
    if(dep>.04&&dep<1.1&&!player.uw&&player.mode==='walk'){if(player.stride<lastStride&&v>.6){splash(player.x,wy,player.z,Math.round(4+v*3*Math.min(1,dep*2)),.6+v*.25);SFX.splash&&SFX.splash(.15+v*.08);}
      if(wasDry&&player.vy<-2)splash(player.x,wy,player.z,24,2.2);wasDry=false;}else wasDry=true;lastStride=player.stride;}
  // ── poling the raft
  let lx=null,lz=null;
  function raftTick(dt){if(typeof W==='undefined')return;const on=W.pieces.find(pc=>pc.f==='raft'&&!pc.fall&&Math.abs(player.y-(pc.y+.15))<.5&&(()=>{const a=pc.r*Math.PI/4,dx=player.x-pc.x,dz=player.z-pc.z,ux=dx*Math.cos(a)-dz*Math.sin(a),uz=dx*Math.sin(a)+dz*Math.cos(a);return Math.abs(ux)<1.05&&Math.abs(uz)<.85;})());
    if(!on||player.air){lx=null;return;}
    const wyAt=(x,z)=>{const fw=freshAt(x,z),h=heightAt(x,z);return fw!=null&&fw-h>.3?fw:h<-.3?water.position.y:null;};
    let mx=lx==null?0:player.x-lx,mz=lz==null?0:player.z-lz;
    const rq=riverQ(on.x,on.z);if(rq&&rq.d<rq.w){const cur=Math.min(1.2,.25+.35*(rq.w>0?1:0));mx+=rq.fx*cur*dt;mz+=rq.fz*cur*dt;player.x+=rq.fx*cur*dt;player.z+=rq.fz*cur*dt;}   // the current carries you both
    const nx=on.x+mx,nz=on.z+mz,wy=wyAt(nx,nz);if(wy!=null&&Math.hypot(mx,mz)<.5){on.x=nx;on.z=nz;on.y=wy+.02;on.g.position.x=nx;on.g.position.z=nz;}   // the shore stops it; you step off
    lx=player.x;lz=player.z;}
  // ── travelling between camps
  const el=Object.assign(document.createElement('div'),{id:'travel'});
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:`#travel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:90;display:none;min-width:300px;padding:18px 22px;border-radius:6px;background:rgba(240,232,214,.96);color:#3a2e22;font:15px Georgia,serif;box-shadow:0 12px 40px rgba(0,0,0,.4)}
    #travel.on{display:block}#travel h4{margin:0 0 10px;font-weight:400;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.65}#travel button{display:block;width:100%;text-align:left;margin:4px 0;padding:7px 10px;font:inherit;background:rgba(60,45,30,.06);border:1px solid rgba(60,45,30,.2);border-radius:4px;cursor:pointer;color:inherit}#travel button:hover{background:rgba(60,45,30,.14)}#travel small{opacity:.65;float:right}`}));
  document.body.appendChild(el);let open=false;
  function camps(from){const out=[{n:'Home, the lānai',x:LANAI.x,z:LANAI.z}];if(typeof fireRT!=='undefined')Object.values(fireRT).forEach((f,i)=>out.push({n:'Fire ring '+(i+1),x:f.x,z:f.z}));
    return out.filter(c=>Math.hypot(c.x-from.x,c.z-from.z)>40);}
  function offer(from){const C=camps(from);if(!C.length)return false;open=true;if(document.pointerLockElement)document.exitPointerLock();
    el.innerHTML='<h4>Travel from here</h4>'+C.map((c,i)=>{const d=Math.hypot(c.x-from.x,c.z-from.z),hrs=d/4000*1.25;return `<button data-i="${i}">${c.n}<small>${d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km'}, ${hrs<1?Math.max(5,Math.round(hrs*60))+' min':hrs.toFixed(1)+' h'} on foot</small></button>`;}).join('')+'<button data-x>Stay</button>';
    el.classList.add('on');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{close();if(b.dataset.x!=null)return;const c=C[+b.dataset.i];go(from,c);});return true;}
  function close(){open=false;el.classList.remove('on');}
  function go(from,c){const d=Math.hypot(c.x-from.x,c.z-from.z),hrs=d/4000*1.25;$('fade').classList.add('on');
    setTimeout(()=>{const a=Math.random()*6.283;player.x=c.x+Math.cos(a)*2.2;player.z=c.z+Math.sin(a)*2.2;player.y=groundAt(player.x,player.z);player.vy=0;player.air=false;if(player.mv)player.mv.x=player.mv.z=0;
      player.yaw=Math.atan2(player.x-c.x,player.z-c.z);hero.bodyYaw=player.yaw;W.clock.h=(W.clock.h+hrs)%24;if(W.clock.h<hrs)W.day++;applyTime(true);syncSlider&&syncSlider();
      for(let t=0;t<hrs*3600*.05;t+=60)tick(60,true);STREAM.prime&&STREAM.prime(player.x,player.z,1200);
      $('fade').classList.remove('on');toast('You walked '+(d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km')+'. '+(hrs<1?Math.round(hrs*60)+' minutes':hrs.toFixed(1)+' hours')+' have passed.',4);note('travel');},900);}
  Object.assign(NOTES,{travel:'From one fire to another the way is known now; my feet find it without me.'});
  // ── echo off the cliffs
  let echo=null,eT=0;
  function echoTick(dt){const c=AU.ctx;if(!c||!AU.sfx)return;
    if(!echo){const dl=c.createDelay(1.5),fb=AU.G(.28),lp=AU.filt('lowpass',1600,.4),out=AU.G(0,AU.amb);AU.sfx.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(out);echo={dl,out};}
    if((eT-=dt)>0)return;eT=1;let best=1e9;for(let i=0;i<12;i++){const a=i/12*6.283;for(const r of[15,30,55,90]){const x=player.x+Math.cos(a)*r,z=player.z+Math.sin(a)*r;
      if(heightAt(x,z)-player.y>18&&GROUND.slopeAt(x,z)>1.2){best=Math.min(best,r);break;}}}
    const on=best<1e8&&!TUBE.st.cave&&!U.uUnder.value;echo.dl.delayTime.setTargetAtTime(on?Math.min(1.4,2*best/343):.3,c.currentTime,.3);echo.out.gain.setTargetAtTime(on?clamp(1.2-best/90,.15,.6)*.5:0,c.currentTime,.5);}
  // ── slack-key at dawn and dusk
  let nextPhrase=40;const SCALE=[55,57,60,62,64,67,69,72,74,76];
  function musicTick(dt){const c=AU.ctx;if(!c||!AU.pluck||!AU.musDuck)return;if((nextPhrase-=dt)>0)return;const h=W.clock.h,soft=(h>5.5&&h<8.5)||(h>17&&h<20);
    nextPhrase=soft?50+Math.random()*70:30;if(!soft||U.uUnder.value||TUBE.st.cave>.5)return;
    let t=c.currentTime+.2,i=3+Math.floor(Math.random()*3);for(let k=0;k<8+Math.floor(Math.random()*6);k++){i=clamp(i+Math.floor(Math.random()*5)-2,0,SCALE.length-1);
      const m=SCALE[i],g=AU.pluck(m,t,.13,AU.musDuck);if(AU.rev)g.connect(AU.rev);if(k%3===0){const g2=AU.pluck(m-12,t+.01,.08,AU.musDuck);if(AU.rev)g2.connect(AU.rev);}t+=[.42,.42,.62,.84][Math.floor(Math.random()*4)];}}
  function step(dt){splashTick(dt);wadeTick();raftTick(dt);echoTick(dt);musicTick(dt);}
  return{tick:step,splash,offer,close,get open(){return open;}};
})();
