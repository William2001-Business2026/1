/* ───────── life in the air and on the ground ─────────
   - Grass parts for the animals as it does for you (the four nearest push the blades aside).
   - Leaves: in the forest, gusts shake leaves loose; they flutter down, drift with the wind and lie a while before they go.
   - The guiding wind (H): choose a place you have been and the wind turns to blow toward it, leaves streaming that way, until you
     arrive. No marker, no map: you follow the wind, as in Ghost of Tsushima.
   - Animal calls: each kind has its own voice (nēnē's soft "nay-nay", a pig's grunt, a deer's alarm bark, a goat's bleat, a hen's
     cluck, a mongoose's chitter), heard from where it is; a fright brings an alarm call.
   - The nēnē fear the mongoose: one close by and they hurry off.
   - Tracks: look down at fresh prints and you can tell who made them, how fresh they are and which way they lead. */
const LIFE=(()=>{
  const V3=THREE.Vector3;
  // ── leaves
  const NL=()=>/^Laptop/.test(activeGfx().name)?50:140,N=140;
  const lg=new THREE.PlaneGeometry(.07,.05),lm=new THREE.MeshLambertNodeMaterial({side:THREE.DoubleSide});
  const leaves=new THREE.InstancedMesh(lg,lm,N);leaves.frustumCulled=false;leaves.castShadow=false;leaves.raycast=()=>{};leaves.count=0;scene.add(leaves);
  const L=Array.from({length:N},()=>({on:false})),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new V3(1,1,1),T=new V3(),C=new THREE.Color();
  const COLS=[[.42,.36,.12],[.55,.42,.15],[.33,.3,.1],[.6,.3,.1],[.25,.32,.1]];
  for(let i=0;i<N;i++){const c=COLS[i%COLS.length];leaves.setColorAt(i,C.setRGB(...c));}
  let spawnAcc=0;const WO={x:0,z:0,g:0};
  function leavesTick(dt){const c=camera.position,fw=forestW(c.x,c.z),wd=WIND.dir.value,ws=WIND.strength.value,n=NL();
    spawnAcc+=dt*fw*(1.5+ws*4+(guide?4:0));                    // a leaf or two a second in the forest, more in gusts
    while(spawnAcc>1){spawnAcc-=1;const l=L.find((q,i)=>i<n&&!q.on);if(!l)break;const a=Math.random()*6.283,d=2+Math.random()*16,x=c.x+Math.cos(a)*d-wd.x*4,z=c.z+Math.sin(a)*d-wd.y*4;
      Object.assign(l,{on:true,x,z,y:groundAt(x,z)+4+Math.random()*6,vy:-(.5+Math.random()*.5),ph:Math.random()*6,sp:2+Math.random()*3,rest:0,life:0});}
    let k=0;for(let i=0;i<N;i++){const l=L[i];if(!l.on||i>=n){M.makeScale(0,0,0);leaves.setMatrixAt(i,M);continue;}
      const gy=groundAt(l.x,l.z)+.01,wa=windAtC(l.x,l.z,WO),lift=Math.max(0,Math.hypot(wa.x,wa.z)-ws*1.6)*.9;           // a whirl spins leaves up off the ground
      if(lift>.3&&l.y<=gy+.02){l.y=gy+.05;l.rest=0;}
      if(l.y>gy){l.ph+=dt*l.sp;l.x+=(wa.x*1.6+Math.sin(l.ph)*.5)*dt;l.z+=(wa.z*1.6+Math.cos(l.ph*.8)*.5)*dt;l.y=Math.min(gy+9,Math.max(gy,l.y+(l.vy*(.6+.4*Math.abs(Math.sin(l.ph)))+lift)*dt));
        E.set(Math.sin(l.ph)*1.4,l.ph*.7,Math.cos(l.ph*1.3)*1.2);}else{l.rest+=dt;E.set(-Math.PI/2,l.ph,0);if(l.rest>8)l.on=false;}
      if(Math.hypot(l.x-c.x,l.z-c.z)>40)l.on=false;Q.setFromEuler(E);M.compose(T.set(l.x,l.y,l.z),Q,S);leaves.setMatrixAt(i,M);k=i+1;}
    leaves.count=k;leaves.instanceMatrix.needsUpdate=true;}
  // ── the guiding wind
  const PL=[{id:'home',n:'home, the lānai',p:()=>LANAI},{id:'pool',n:'Wailele, the waterfall pool',p:()=>POOL},{id:'tube',n:'Ke Ana, the lava tube',p:()=>TUBE.mouth},
    {id:'spring',n:'Ka Puna Huna, the hidden spring',p:()=>SPRING},{id:'summit',n:'the summit of Mauna Kea',p:()=>PEAK}];
  const baseDir=WIND.dir.value.clone();let guide=null,gi=-1;
  function camps(){return typeof fireRT==='undefined'?[]:Object.values(fireRT).map((f,i)=>({id:'camp'+i,n:'a fire ring you built'+(Object.keys(fireRT).length>1?' ('+(i+1)+')':''),p:()=>f}));}
  function known(){return[...PL.filter(q=>W.flags['been_'+q.id]),...camps()];}
  function choose(){const K=known();if(!K.length){toast('Go somewhere first: the wind can only lead you back to places you know.',4);return;}
    gi=(gi+1)%(K.length+1);if(gi===K.length){guide=null;toast('The wind goes back to its own way.',3);return;}guide=K[gi];toast('The wind turns toward '+guide.n+'.',3.5);SFX.page&&SFX.page();}
  function guideTick(dt){for(const q of PL){const p=q.p();if(p&&!W.flags['been_'+q.id]&&Math.hypot(p.x-player.x,p.z-player.z)<40)W.flags['been_'+q.id]=1;}
    const wv=WIND.dir.value,cv=Math.cos(WIND.veer),sv=Math.sin(WIND.veer);let want=new THREE.Vector2(baseDir.x*cv-baseDir.y*sv,baseDir.x*sv+baseDir.y*cv);
    if(guide){const p=guide.p(),dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz);if(d<30){toast(guide.n[0].toUpperCase()+guide.n.slice(1)+'.',3);guide=null;gi=-1;}
      else want=new THREE.Vector2(dx/d,dz/d);}
    wv.lerp(want,1-Math.exp(-dt*(guide?1.2:.3))).normalize();WIND.guide=!!guide;}
  // ── animal voices, heard from where the animal is
  const VOICE={nene:'nene',puaa:'grunt',kia:'bark',kao:'bleat',moa:'cluck',manakuke:'chitter'};
  function call(kind,x,y,z,v=1){const c=AU.ctx;if(!c||!AU.amb)return;const pn=c.createPanner();pn.panningModel='equalpower';pn.distanceModel='inverse';pn.refDistance=3;pn.rolloffFactor=1.2;
    if(pn.positionX){pn.positionX.value=x;pn.positionY.value=y+.4;pn.positionZ.value=z;}else pn.setPosition(x,y+.4,z);pn.connect(AU.amb);
    const at=(ms,f)=>setTimeout(f,ms),g=.22*v;
    if(kind==='nene'){for(const t of[0,240])at(t,()=>{tone(430,370,g*.7,.16,'sawtooth',AU.filt('bandpass',900,1.4,pn));});}
    else if(kind==='grunt'){noiseBurst(AU.pink,'lowpass',320,.8,g*1.4,.02,.22,pn);tone(95,70,g*.6,.22,'square',AU.filt('lowpass',400,.7,pn));}
    else if(kind==='bark'){noiseBurst(AU.white,'bandpass',1100,1.2,g*1.2,.005,.14,pn);tone(950,650,g*.5,.12,'sawtooth',AU.filt('bandpass',1000,1,pn));}
    else if(kind==='bleat'){for(const [t,f] of[[0,520],[90,480],[180,510],[270,470]])at(t,()=>tone(f,f*.97,g*.45,.11,'sawtooth',AU.filt('bandpass',1100,1.5,pn)));}
    else if(kind==='cluck'){for(const t of[0,140,260])at(t,()=>tone(640,520,g*.5,.06,'square',AU.filt('bandpass',900,2,pn)));}
    else if(kind==='chitter'){for(let i=0;i<5;i++)at(i*55,()=>tone(2300+Math.random()*500,2000,g*.35,.035,'square',AU.filt('bandpass',2400,3,pn)));}
    at(2500,()=>{try{pn.disconnect();}catch(e){}});}
  let callT=0,trackT=0,trackSeen=null;
  function animalsTick(dt){if(typeof FAUNA==='undefined')return;const c=camera.position,list=FAUNA.list;
    // the four nearest bend the grass; the nēnē watch for the mongoose; now and then one calls
    const near=[];for(const a of list){if(!a.g||!a.g.visible||a.dead||!a.legs&&!a.mixer)continue;const d=Math.hypot(a.p.x-c.x,a.p.z-c.z);if(d<30)near.push([d,a]);}
    near.sort((p,q)=>p[0]-q[0]);WIND.animals.forEach((u,i)=>{const e=near[i];if(e){const a=e[1];u.value.set(a.p.x,a.p.y,a.p.z,Math.max(.25,(a.sp.len||.6)*.45));}else u.value.set(0,-99,0,.3);});
    for(const a of list){if(a.key!=='nene'||a.dead||a.fleeT>0)continue;for(const m of list)if(m.key==='manakuke'&&!m.dead&&Math.hypot(m.p.x-a.p.x,m.p.z-a.p.z)<7){a.threat={x:m.p.x,z:m.p.z};a.fleeT=2.5;a.state='run';
        if(Math.hypot(a.p.x-c.x,a.p.z-c.z)<45)call('nene',a.p.x,a.p.y,a.p.z,1.3);break;}}
    if((callT-=dt)<=0){callT=1.2+Math.random()*2.5;const cand=near.filter(e=>VOICE[e[1].key]&&e[0]<45);if(cand.length&&Math.random()<.55){const a=cand[Math.floor(Math.random()*cand.length)][1];
        call(VOICE[a.key],a.p.x,a.p.y,a.p.z,a.fleeT>0||a.state==='alert'?1.4:.9);}}
    // tracks: looking down at fresh prints
    if((trackT-=dt)<=0){trackT=.4;if(player.pitch<-.45&&aimPt){const p=FOOT.read(aimPt.x,aimPt.z,1.2);if(p&&p!==trackSeen){trackSeen=p;const sp=FAUNA&&FAUNA.list.find(a=>a.key===p.who),nm=sp?sp.sp.n:p.who;
        const age=p.t<40?'fresh, minutes old':p.t<90?'a little while old':'old, nearly gone',dirs=['north','north-east','east','south-east','south','south-west','west','north-west'],
          hd=Math.atan2(Math.sin(p.yaw+Math.PI),-Math.cos(p.yaw+Math.PI)),ix=((Math.round(hd/(Math.PI/4))%8)+8)%8;
        toast(`Tracks: ${nm.replace(/ \(.*\)/,'')}, ${age}, heading ${dirs[ix]}.`,4);note('tracks');}}}}
  Object.assign(NOTES,{tracks:'The ground keeps who passed: hooves, three toes, small paws. Fresh ones are sharp; old ones soften and go.'});
  function tick(dt){leavesTick(dt);guideTick(dt);animalsTick(dt);}
  return{tick,guide:choose,call,get guiding(){return guide&&guide.n;},known};
})();
