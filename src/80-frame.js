let clockLight=0;
/* ───────────────────────── frame loop ───────────────────────── */
const ray=new THREE.Raycaster();ray.far=3.3;
let lastFrameAt=performance.now(),time=0,lastLabel='',lastHint='';
function update(dt){
  time+=dt;U.uTime.value=time;windU.value=time;postU.uTime.value=time;
  water.position.y=Math.sin(time*.55)*.045+Math.sin(time*.23)*.02;

  // the clock: the sun and moon move every frame; the sky's palette and lighting follow a few times a second
  TUBE.update(dt);FOOT.tick(dt);MAPBOOK.tick(dt);SKYCLOCK.tick(dt);clockLight+=dt;if(clockLight>(W.clock.fast?.05:.25)){clockLight=0;applyTime(false);syncSlider();}

  // lantern
  const fl=lantern.lit?1:0,flick=.82+.18*fbm(time*7,1.7,2)+.05*Math.sin(time*23);
  lanternLight.intensity=fl*flick*(1.1+2.6*smooth(4,-8,evening.elev));flame.visible=lantern.lit;flame.scale.set(1,2+flick*.6,1);
  if(lantern.hung){lanternG.rotation.z=Math.sin(time*1.3)*.03;lanternG.rotation.x=Math.sin(time*.9+1)*.02;}

  // steam
  for(const s of steam){s.userData.t=(s.userData.t+dt*.28)%1;const t=s.userData.t,hot=cup.sips>0?1:0;
    s.position.set(Math.sin(t*5+s.id)*.015*t,.09+t*.2,Math.cos(t*4+s.id)*.015*t);const sc=.03+t*.07;s.scale.set(sc,sc,sc);s.material.opacity=hot*.22*Math.sin(Math.PI*t)*(held===cup?.6:1);}

  // coconut
  if(coco.fly){const p=cocoG.position,v=coco.vel;v.y-=9.8*dt;p.addScaledVector(v,dt);const gy=groundAt(p.x,p.z),sea=water.position.y;
    if(gy<sea-.2&&p.y<sea+.02){if(!coco.wet){coco.wet=true;if(v.length()>1.5)SFX.splash(clamp(v.length()/8,.3,1));if(U.uBio.value>.1)U.uRipples.value[rippleI++%8].set(p.x,p.z,time);}
      v.multiplyScalar(Math.exp(-3*dt));v.y+=(sea-.02-p.y)*28*dt+9.8*dt;v.y*=Math.exp(-4*dt);p.y=Math.max(p.y,gy+.12);cocoG.rotation.z=Math.sin(time*1.4)*.2;cocoG.rotation.x=Math.sin(time*1.1)*.15;}
    else if(p.y<gy+.12){p.y=gy+.12;const sp=v.length();if(sp>1.2){const sf=surfaceAt(p.x,p.z);sf==='wood'?SFX.knock():SFX.thud(clamp(sp/8,.25,1));}
      v.y=Math.abs(v.y)*.28;v.x*=.55;v.z*=.55;if(sp<.6){coco.fly=false;v.set(0,0,0);}coco.wet=false;}
    else cocoG.rotation.x+=dt*v.length()*.8;}

  // hammock sway
  const occupied=player.mode==='hammock';
  hamSwing.rotation.x=Math.sin(time*1.25)*(occupied?.085:.012);

  if(state==='title'){REEL.frame(dt,time);updateHero(dt,0);
  }else{
    const playing=state==='play';
    // movement
    let moving=0;
    RAG.update(dt);
    if(player.mode==='walk'&&playing&&!RAG.on){
      const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
      const h=heightAt(player.x,player.z),fw=freshAt(player.x,player.z),deep=Math.max(0,(fw!=null?fw:0)-h);
      let sp=(keys.ShiftLeft||keys.ShiftRight?1.35:3)*speedMul()*clamp(1-(deep-.5)/.9,.18,1);
      const wy=fw!=null?fw:water.position.y;player.climb=false;
      if(!player.uw&&!DIVE.black&&deep>1.7&&!player.air&&player.trans>=1&&keys.KeyC){player.uw=true;player.y=wy-2.15;(player.vel||(player.vel=new THREE.Vector3())).set(0,-.8,0);DIVE.start();SFX.splash(.5);}
      if(player.uw)moving=swimUnder(f,s,dt,wy);
      else{
      // momentum: you speed up over about half a second and come to a stop over a third, and have little control in the air
      const V=player.mv||(player.mv={x:0,z:0});{const l=Math.hypot(f,s)||1,sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),tx=f||s?(-sy*f+cy*s)/l*sp:0,tz=f||s?(-cy*f-sy*s)/l*sp:0;
        const k=1-Math.exp(-dt*(player.air?1.1:Math.hypot(tx,tz)>Math.hypot(V.x,V.z)?5.2:8.5));V.x+=(tx-V.x)*k;V.z+=(tz-V.z)*k;if(!(f||s)&&Math.hypot(V.x,V.z)<.05)V.x=V.z=0;}
      if(V.x||V.z){
        let dx=V.x*dt,dz=V.z*dt;
        const inTube=TUBE.inside(player.x,player.z,player.y);
        if(deep<.9&&!player.air&&!inTube){const grade=(heightAt(player.x+dx,player.z+dz)-h)/Math.max(1e-4,Math.hypot(dx,dz));
          if(grade>.95){if(STAM.v>0&&f>0){player.climb=true;const k=.42/Math.max(1,grade);dx*=k;dz*=k;STAM.v-=dt*(1+Math.min(1.5,grade-.95));} // too steep to walk: climb, hands and feet, while your strength lasts
            else{dx=0;dz=0;}}
          else{const k=clamp(1-(grade-.4)*1.1,.3,1);dx*=k;dz*=k;}}                                    // steep ground uphill is slow going
        let nx=player.x+dx,nz=player.z+dz;
        for(const cs of[colliders,pieceCols])for(const c of cs){const ox=nx-c.x,oz=nz-c.z,d=Math.hypot(ox,oz),m=c.r+.3;if(d<m&&d>1e-4){nx=c.x+ox/d*m;nz=c.z+oz/d*m;}}
        if(inTube){const o={x:nx,z:nz};TUBE.constrain(o);nx=o.x;nz=o.z;}                       // the tube's walls
        moving=Math.hypot(nx-player.x,nz-player.z)/dt;if(moving<Math.hypot(V.x,V.z)*.4){V.x*=.85;V.z*=.85;} // blocked: stop pushing into it
        player.x=nx;player.z=nz;}
      if(fw!=null&&deep>.35){const q=riverQ(player.x,player.z);                // the river's current carries you downstream
        if(q&&q.d<q.w+.3){const gr=Math.max(0,RIVER.wl[Math.floor(q.i)]-RIVER.wl[Math.min(RIVER.P.length-1,Math.floor(q.i)+2)])/2;const cs=clamp(.4+gr*30,.4,4)*smooth(.35,1,deep)*dt;player.x+=q.fx*cs;player.z+=q.fz*cs;}}
      if(deep<.5&&!player.air&&!player.climb&&!TUBE.inside(player.x,player.z,player.y)){const gx=heightAt(player.x+.4,player.z)-heightAt(player.x-.4,player.z),gz=heightAt(player.x,player.z+.4)-heightAt(player.x,player.z-.4),g=Math.hypot(gx,gz)/.8;
        if(g>1.25){const v=Math.min(3,(g-1.25)*3+.8)*dt/(g*.8);player.x-=gx*v;player.z-=gz*v;if(!STAM.slid){STAM.slid=true;}}          // on a slope this steep you slide unless you hold on
        if(g<.8)STAM.v=Math.min(STAM.max,STAM.v+dt*6);}
      if(fw==null&&deep>1){const off=-masks(player.x,player.z).d;if(off>80){const k=(off-80)*.6*dt,r=Math.hypot(player.x,player.z);player.x-=player.x/r*k;player.z-=player.z/r*k; // past the reef the current turns you back
        if(!DIVE.toldReef){DIVE.toldReef=true;toast('Past the reef the current is too strong.',3);}}}
      }
      if(!player.air)player.stride+=moving*dt;
      if(player.stride>.78){player.stride=0;const sf=floorY(player.x,player.z,player.y)!=null?'wood':TUBE.inside(player.x,player.z,player.y)?'rock':surfaceAt(player.x,player.z);SFX.step(sf,keys.ShiftLeft?.45:.8);FOOT.step();
        if(sf==='water'&&U.uBio.value>.1)U.uRipples.value[rippleI++%8].set(player.x,player.z,time);}
      player.pitch=thirdView()?clamp(player.pitch,-1.05,.85):clamp(player.pitch,-1.5,1.5);
    }else if(player.mode==='sit'){let d=player.yaw-player.baseYaw;d=clamp(Math.atan2(Math.sin(d),Math.cos(d)),-1.9,1.9);player.yaw=player.baseYaw+d;player.pitch=clamp(player.pitch,-1,1.2);}
    else if(player.mode==='hammock'){let d=player.yaw-player.baseYaw;d=clamp(Math.atan2(Math.sin(d),Math.cos(d)),-1.4,1.4);player.yaw=player.baseYaw+d;player.pitch=clamp(player.pitch,.1,1.5);}

    // camera pose
    let roll=0;
    if(player.mode==='walk'&&player.uw){_v.set(player.x,player.y+1.65,player.z);roll=Math.sin(time*.7)*.012;}
    else if(player.mode==='walk'){
      const fwy=freshAt(player.x,player.z);let gy=Math.max(groundAt(player.x,player.z),(fwy!=null?fwy:0)-1.12);const tubeF=TUBE.floorAt(player.x,player.z,player.y);if(tubeF!=null)gy=tubeF; // in the lava tube, its floor is the groundconst fy=floorY(player.x,player.z,player.y);if(fy!=null&&fy>gy)gy=fy;
      if(player.air){ // ballistic jump under gravity; land on ground, the deck or built floors
        player.vy-=9.81*dt;player.y+=player.vy*dt;if(player.vy<-10.8&&!RAG.on)RAG.start(); // falling fast: the body goes limp
        if(player.y<=gy&&player.vy<=0){const hit=-player.vy;player.y=gy;player.vy=0;player.air=false;player.land=Math.min(1,hit/5);
          const sf=fy!=null&&fy>=gy-.01?'wood':surfaceAt(player.x,player.z);if(sf==='water')SFX.splash(.4+.4*player.land);else SFX.step(sf,.6+.5*player.land);}
      }else if(gy<player.y-.35){player.air=true;player.vy=0;} // stepped off an edge: fall instead of gliding down
      else player.y=lerp(player.y,gy,1-Math.exp(-dt*12));
      player.land=Math.max(0,player.land-dt*4);
      player.bobT+=(player.air?0:moving)*dt*2.1;const amp=settings.bob&&!player.air?Math.min(moving/3,1):0;
      _v.set(player.x,player.y+1.65+Math.sin(player.bobT*2)*.028*amp-Math.sin(player.land*Math.PI)*.07*(settings.bob?1:.4),player.z);roll=Math.sin(player.bobT)*.004*amp;
    }else if(player.mode==='sit'){_v.set(CHAIR.x-SUN_AZ.x*.12,DECK_Y+1.0+Math.sin(time*.9)*.004,CHAIR.z-SUN_AZ.y*.12);roll=Math.sin(time*.5)*.004;}
    else{_v.set(-.42,-.52,0);hamSwing.localToWorld(_v);roll=hamSwing.rotation.x*.7;}
    if(thirdView()){ // over the right shoulder, kept above the ground and the sea
      const cp=Math.cos(player.pitch),sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),fx=-sy*cp,fy=Math.sin(player.pitch),fz=-cy*cp;
      const d=hero.camDist*(1-.3*Math.max(0,fy)),py=player.uw?player.y+1.55:Math.max(player.y+1.55,water.position.y+.4);
      _v.set(player.x-fx*d+cy*.42,py-fy*d,player.z-fz*d-sy*.42);
      {const hx=player.x,hz=player.z,dx=_v.x-hx,dz=_v.z-hz,L2=dx*dx+dz*dz;let tHit=1;
       for(const c of colliders){const ox=c.x-hx,oz=c.z-hz;if(Math.abs(ox)>d+2||Math.abs(oz)>d+2)continue;const t=clamp((ox*dx+oz*dz)/Math.max(L2,1e-6),0,1),px=dx*t-ox,pz=dz*t-oz;
         if(px*px+pz*pz<(c.r+.25)*(c.r+.25)&&t<tHit)tHit=Math.max(.12,t-(c.r+.3)/Math.sqrt(Math.max(L2,1e-6)));}
       hero.camK=lerp(hero.camK??1,tHit,1-Math.exp(-dt*(tHit<(hero.camK??1)?14:3)));  // pull in fast, ease back out
       _v.set(hx+dx*hero.camK,lerp(player.y+1.55,_v.y,hero.camK),hz+dz*hero.camK);TUBE.clampCam(_v,player);}
      const inT=TUBE.inside(player.x,player.z,player.y),gy=inT?(TUBE.floorAt(_v.x,_v.z,player.y)??player.y)+.3:(player.uw?groundAt(_v.x,_v.z):Math.max(groundAt(_v.x,_v.z),water.position.y))+.3;if(_v.y<gy)_v.y=gy;if(inT)TUBE.clampCam(_v,player);if(player.uw&&_v.y>water.position.y-.3)_v.y=water.position.y-.3;roll=0;}
    if(player.trans<1){player.trans=Math.min(1,player.trans+dt/.9);const k=player.trans*player.trans*(3-2*player.trans);camera.position.lerpVectors(player.from,_v,k);}
    else camera.position.copy(_v);
    camera.rotation.set(player.pitch,player.yaw,roll);
    updateHero(dt,moving);

    // binocular zoom
    const zt=(held&&held.kind==='bino'&&mouseDown&&playing)?1:0;player.zoom=lerp(player.zoom,zt,1-Math.exp(-dt*9));
    const fov=lerp(settings.fov,settings.fov/8,player.zoom);if(Math.abs(camera.fov-fov)>.01){camera.fov=fov;camera.updateProjectionMatrix();if(csmOn&&csm.camera)csm.updateFrustums();}
    mask.style.opacity=smooth(.3,.9,player.zoom);
    if(held){held.group.visible=player.zoom<.4;
      if(heroShown()){if(useAnim>0)useAnim=Math.max(0,useAnim-dt*1.6);}
      else{if(useAnim>0){useAnim=Math.max(0,useAnim-dt*1.6);const k=Math.sin(Math.PI*useAnim);
        if(held.kind==='cup'){held.group.position.set(lerp(.27,.1,k),lerp(-.25,-.12,k),lerp(-.48,-.3,k));held.group.rotation.set(0,-1.2,k*.9);}
        else if(held.kind==='uke')held.group.rotation.z=1.15+k*.04;}
      else if(held.kind==='cup'){held.group.position.set(...held.hold.p);held.group.rotation.set(...held.hold.r);}
      if(held.kind!=='cup'||useAnim<=0)held.group.position.y=held.hold.p[1]+Math.sin(player.bobT*2)*.006;}}

    // what am I looking at
    looked=null;
    if(playing&&player.mode==='walk'&&player.zoom<.3){
      const tp=thirdView();ray.far=tp?3.3+hero.camDist:3.3;ray.setFromCamera({x:0,y:0},camera);const hits=ray.intersectObjects(interact,true);
      for(const h of hits){if(tp&&Math.hypot(h.point.x-player.x,h.point.z-player.z)>2.4)continue;let o=h.object;while(o&&!o.userData.item)o=o.parent;if(o&&o.userData.item!==held){looked=o.userData.item;if(h.instanceId!=null)looked.hitId=h.instanceId;break;}}
    }
    let lt='',ht='';
    if(looked){const sl=itemLabel(looked);if(sl&&!W.seen[sl])W.seen[sl]=1;const v=looked.verb;lt=itemLabel(looked)+(v?'  ·  E to '+v:'')+(looked.pc?'  ·  X to take apart':'');}
    if(player.mode==='sit')ht='E to stand up';else if(player.mode==='hammock')ht='E to get up';
    if(held)ht=(ht?ht+'   ·   ':'')+(held.kind==='cup'&&held.sips===0?(held.rinsed?'':'Click to rinse in the sea   ·   '):held.hint+'   ·   ')+'G to put down';
    if(!held){const sh=sysHint();if(sh)ht=(ht?ht+'   ·   ':'')+sh;}
    if(player.climb)ht='Climbing   ·   let go of W to stop'+(ht?'   ·   '+ht:'');
    if(player.uw)ht='Space to rise   ·   C to go deeper'+(ht?'   ·   '+ht:'');
    else if(player.mode==='walk'&&!player.air&&(freshAt(player.x,player.z)??water.position.y)-heightAt(player.x,player.z)>1.7)ht='C to dive'+(ht?'   ·   '+ht:'');
    if(introHint>0){introHint-=dt;if(!ht&&!locked)ht='Click to look around';else if(!ht)ht='W A S D to walk   ·   E to interact   ·   J for the book   ·   V to switch camera   ·   Esc for the menu';}
    else if(!locked&&playing&&!ht)ht='Click to look around';
    if(lt!==lastLabel){label.textContent=lt;label.classList.toggle('on',!!lt);dot.classList.toggle('on',!!lt);lastLabel=lt;}
    if(ht!==lastHint){hint.textContent=ht;lastHint=ht;}
  }
  hud.style.opacity=(state==='play'&&!settings.photo)?1:0;
  if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on');}
  if(state==='play'&&player.trans>=1){ // say where you are when you cross into another zone, and notice the hidden spring
    const z=player.uw?'undersea':zoneAt(player.x,player.z);if(z!==zoneState.cur){if(z===zoneState.next)zoneState.t+=dt;else{zoneState.next=z;zoneState.t=0;}
      if(zoneState.t>1.2){zoneState.cur=z;if(zoneState.shown)toast(ZONES[z][0]+' · '+ZONES[z][1],3.5);zoneState.shown=true;}}
    if(!W.flags.spring&&Math.hypot(player.x-SPRING.x,player.z-SPRING.z)<3.6){W.flags.spring=1;note('spring');toast('Ka Puna Huna, the hidden spring. The river starts here.',6);}}

  // sky and shadow follow the camera
  sky.position.copy(camera.position);
  GRASS.update(camera.position.x,camera.position.z);
  updateFresh(dt);
  SEA.update(dt,time);FLORA.update(camera.position.x,camera.position.z);FAUNA.tick(dt,time);if(state==='play')DIVE.tick(dt);STAM.tick();
  {const c=camera.position,cw=freshAt(c.x,c.z),und=c.y<(cw!=null?cw:water.position.y)-.03?1:0; // under the surface: blue-green haze, muffled sound
   U.uUnder.value=und;postU.uUnder.value=und;postU.uLookUp.value=smooth(-.5,.8,player.pitch);
   const dl=.12+.88*U.uDay.value;
   if(und){scene.fog.density=have('goggles')>0?.042:.062;scene.fog.color.setRGB(.03*dl,.2*dl,.23*dl);U.uFogCol.value.copy(scene.fog.color);}
   else{const mist=Math.max(U.uWet.value*forestW(c.x,c.z)*.022,smooth(42,72,c.y)*.016,U.uCover.value*.004); // mist hangs in the forest after rain, and around the summit
     scene.fog.density=mist;scene.fog.color.setRGB(.6*dl,.64*dl,.66*dl);}
   SUMMIT.update(dt,dl);
   sky.visible=!und;scene.background=und?scene.fog.color:null;const cv=1-.85*TUBE.st.cave;scene.environmentIntensity=envBase*(und?.3:1)*cv;hemi.intensity=hemiBase*(und?.55:1)*cv;
   renderer.toneMappingExposure=(EXPO.base||1)*(1+2.3*TUBE.st.adapt);}  // in the tube the sky's light fades, and your eyes open up to the dark
  WIND.player.value.set(player.x,player.y,player.z);WIND.strength.value=.5+U.uCover.value*.8; // rain squalls blow harder
  leafU.uSunView.value.copy(U.uSunDir.value).transformDirection(camera.matrixWorldInverse);leafU.uSunTr.value.copy(sun.color).multiplyScalar(sun.intensity*.11);
  const tx=Math.round(camera.position.x/2)*2,tz=Math.round(camera.position.z/2)*2;
  sun.target.position.set(tx,0,tz);sun.position.set(tx,0,tz).addScaledVector(SKYCLOCK.st.light.clone().setY(Math.max(SKYCLOCK.st.light.y,.035)).normalize(),200); // low enough for the long shadows of sunrise and sunset
  {const cell=tx+','+tz;if(cell!==perf.shotCell||++perf.shadowTick>=activeGfx().shadowEvery){perf.shotCell=cell;perf.shadowTick=0;sun.shadow.needsUpdate=true;}}
  if(csmOn&&csm)csm.lights.forEach((l,i)=>{l.shadow.autoUpdate=true;l.shadow.radius=[3,2,1.4][i]||1.2;}); // the cascades copied the sun's 'manual update' flag; nearer cascades have finer texels, so a wider kernel keeps one soft edge
  lanternLight.shadow.autoUpdate=lanternLight.intensity>.01; // no point redrawing the lantern's six shadow views while it is dark
  sysUpdate(dt);updateAnimalModels(dt);physStep(dt);
  scheduleAudio(dt,time);
}
let frameNo=0;
function frame(now){frameNo++;
  requestAnimationFrame(frame);
  if(now<perf.nextT-1.5)return;                                    // 60 FPS cap
  perf.nextT=now-perf.nextT>FRAME_MS?now+FRAME_MS:perf.nextT+FRAME_MS;
  const dt=Math.min((now-lastFrameAt)/1000,.05);lastFrameAt=now;
  update(dt);post.render();perfTick(now);
}

