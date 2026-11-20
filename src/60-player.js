/* ───────────────────────── player ───────────────────────── */
const player={x:START.x,z:START.z,y:0,yaw:Math.PI,pitch:0,mode:'walk',baseYaw:0,stride:0,bobT:0,trans:1,from:new THREE.Vector3(),zoom:0,vy:0,air:false,land:0};
player.y=groundAt(player.x,player.z);
let held=null,looked=null,state='title',locked=false,mouseDown=false,useAnim=0,rippleI=0;
const keys={};
const $=id=>document.getElementById(id);
const hud=$('hud'),dot=$('dot'),label=$('label'),hint=$('hint'),toastEl=$('toast'),menu=$('menu'),mask=$('mask');
const zoneState={cur:null,next:null,t:0,shown:false};
// diving: one breath lasts about a minute (longer with shell goggles); run out and you black out and wake on the beach,
// losing whatever you gathered on that dive
// climbing strength: drains while you climb, comes back when you stand on easier ground
const STAM={v:25,max:25,slid:false,tick(){const show=state==='play'&&STAM.v<STAM.max-.3;stamEl.classList.toggle('on',show);stamFill.style.width=(100*clamp(STAM.v/STAM.max,0,1))+'%';stamEl.classList.toggle('low',STAM.v<6);}};
const DIVE={on:false,air:60,log:{},black:0,warned:false,moved:false,toldReef:false,
  max(){return 60+(have('goggles')>0?25:0);},
  start(){this.on=true;this.log={};this.warned=false;note('dive');},
  end(){this.on=false;this.log={};},
  tick(dt){const max=this.max();
    if(player.uw&&!this.black){this.air-=dt;if(this.air<15&&!this.warned){this.warned=true;toast('Running out of air. Go up.',3);}if(this.air<=0)this.black=4;}
    else if(!player.uw)this.air=Math.min(max,this.air+dt*14);
    if(this.black>0){const b0=this.black;this.black=Math.max(0,this.black-dt);
      if(b0>2&&this.black<=2){for(const k in this.log)takeFrom(k,Math.min(have(k),this.log[k]));handDirty=true;
        player.uw=false;player.x=START.x;player.z=START.z;player.y=groundAt(START.x,START.z);player.yaw=Math.PI;player.pitch=0;if(player.vel)player.vel.set(0,0,0);
        this.end();this.air=max;note('blackout');zoneState.cur='beach';zoneState.next='beach';toast('You black out, and wake on the beach. What you gathered on that dive is gone.',6);}
      fadeEl.style.opacity=this.black>2?(4-this.black)/2:this.black/2;}else fadeEl.style.opacity=0;
    const show=player.uw||this.air<max-.5;airEl.classList.toggle('on',show&&state==='play');airFill.style.width=(100*clamp(this.air/max,0,1))+'%';airEl.classList.toggle('low',this.air<15);}
};
function swimUnder(f,s,dt,wy){
  if(DIVE.black)return 0;
  const cp=Math.cos(player.pitch),sp=Math.sin(player.pitch),sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),v=player.vel||(player.vel=new THREE.Vector3());
  const spd=(keys.ShiftLeft||keys.ShiftRight?1.1:2.1)*(have('goggles')>0?1.08:1),down=keys.KeyC;
  const tx=-sy*cp*f+cy*s,ty=sp*f+(keys.Space?1:0)-(down?1:0),tz=-cy*cp*f-sy*s,l=Math.hypot(tx,ty,tz);
  _v2.set(l?tx/l*spd:0,l?ty/l*spd:.22,l?tz/l*spd:0);v.lerp(_v2,1-Math.exp(-dt*(l?2.2:.9)));    // strokes carry you; let go and you drift slowly up
  let nx=player.x+v.x*dt,ny=player.y+v.y*dt,nz=player.z+v.z*dt;
  const bed=heightAt(nx,nz)-1.15;if(ny<bed){ny=bed;if(v.y<0)v.y=0;}
  if(wy-heightAt(nx,nz)<1.5){player.uw=false;DIVE.end();player.x=nx;player.z=nz;return 0;}       // too shallow to stay down: you stand up
  const top=wy-1.95;if(ny>=top){if(!down){const m=Math.hypot(nx-player.x,nz-player.z)/dt;player.uw=false;player.x=nx;player.z=nz;player.y=wy-1.12;v.set(0,0,0);DIVE.end();SFX.splash(.35);return m;}ny=top;}
  const m=Math.hypot(nx-player.x,nz-player.z,ny-player.y)/dt;player.x=nx;player.y=ny;player.z=nz;return m;
}
const airEl=document.createElement('div');airEl.id='air';airEl.innerHTML='<span>Air</span><b><i></i></b>';hud.appendChild(airEl);const airFill=airEl.querySelector('i');
const camTog=document.createElement('button');camTog.id='camtog';hud.appendChild(camTog);const camLabel=()=>{camTog.textContent=(settings.view==='first'?'First person':'Third person')+'  ·  V to switch  ·  J book';};camLabel();
camTog.onclick=e=>{e.stopPropagation();settings.view=settings.view==='first'?'third':'first';saveSettings();$('s-view').value=settings.view;applyView();camLabel();};
const stamEl=document.createElement('div');stamEl.id='air';stamEl.className='stam';stamEl.innerHTML='<span>Strength</span><b><i></i></b>';hud.appendChild(stamEl);const stamFill=stamEl.querySelector('i');
const fadeEl=document.createElement('div');fadeEl.id='fade';document.body.appendChild(fadeEl);
let toastT=0; function toast(msg,secs=4){toastEl.textContent=msg;toastEl.classList.add('on');toastT=secs;}
let introHint=0;

function itemLabel(it){
  if(it.label)return it.label();
  if(it.kind==='cup'&&it.water)return 'Cup of fresh water';
  if(it.kind==='cup')return it.sips>0?'Cup of coffee':(it.rinsed?'Clean enamel cup':'Empty cup');
  if(it.kind==='radio')return 'Transistor radio · '+RADIO_MODES[it.mode];
  return it.name;
}
function pickUp(it){
  if(held)putDown(); if(held)return;physForget(it.group);
  for(const s of slots)if(s.item===it)s.item=null;
  if(it.kind==='lantern')it.hung=false; if(it.kind==='coco')it.fly=false;
  held=it;holdItem(it);heroOneShot('Interact');SFX.pickup();
}
function putDown(){
  const it=held;if(!it)return;const g=it.group,dT=Math.hypot(player.x-TABLE.x,player.z-TABLE.z);
  const place=(p,rot)=>{scene.add(g);g.position.copy(p);g.rotation.set(...(rot||[0,Math.random()*6.28,0]));held=null;};
  if(it.kind==='lantern'&&Math.hypot(player.x-HOOK.x,player.z-HOOK.z)<2.4){place(_v.set(HOOK.x,HOOK.y-.33,HOOK.z),[0,0,0]);it.hung=true;SFX.clink();return;}
  const slot=slots.find(s=>!s.item);
  if(dT<2.3&&slot&&it.kind!=='uke'){place(slot.pos);slot.item=it;it.kind==='cup'?SFX.clink():SFX.knock();return;}
  const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),r=player.mode==='walk'?.95:.75;
  let px=player.x+fx*r,pz=player.z+fz*r;
  if(player.mode==='sit'){px=CHAIR.x+Math.cos(sunYaw)*.62;pz=CHAIR.z-Math.sin(sunYaw)*.62;}
  const gy=groundAt(px,pz);
  if(gy<.04&&it.kind!=='coco'){toast('Better to set that down on dry ground.',2.5);return;}
  place(_v.set(px,gy+it.restY,pz),it.restRot?[it.restRot[0],Math.random()*6.28,0]:null);
  if(it.restRot)g.rotation.order='YXZ';
  // the coconut, binoculars and ukulele are let go from the hand and tumble to rest (the cup and lantern are set down upright)
  if(PHYS_KINDS.has(it.kind)&&player.mode==='walk'){g.position.set(px,player.y+1,pz);
    if(physDrop(g,{vel:{x:fx*.6,y:0,z:fz*.6},ball:it.kind==='coco'?.12:0,float:it.kind!=='bino'})){if(it.kind==='coco'){it.fly=false;}return;}}
  const sf=surfaceAt(px,pz);if(sf==='water')SFX.splash(.5);else if(sf==='wood')it.kind==='cup'?SFX.clink():SFX.knock();else SFX.step(sf,.8);
  if(it.kind==='coco'){it.fly=true;it.vel.set(0,0,0);}
}
function useHeld(){
  const it=held;if(!it)return;
  if(sysUseLegacy(it))return;
  if(it.kind==='cup'){
    if(it.sips>0){it.sips--;useAnim=1;SFX.sip();coffee.position.y=.03+.016*it.sips;if(it.sips===0){coffee.visible=false;toast('The cup is empty. The sea will rinse it.',4);}}
    else if(!it.rinsed&&heightAt(player.x,player.z)<.08){it.rinsed=true;useAnim=1;SFX.rinse();toast('Rinsed clean.',3);}
    else if(!it.rinsed)toast('Empty. Walk down to the water to rinse it.',3);
  }else if(it.kind==='lantern'){it.lit=!it.lit;SFX.flame(it.lit);}
  else if(it.kind==='coco'){
    const f=_fwd.set(0,0,-1).applyQuaternion(camera.quaternion);const from=heroShown();scene.add(it.group);
    if(from)it.group.position.copy(hero.socket.position).addScaledVector(f,.25);else{it.group.position.copy(camera.position).addScaledVector(f,.6);it.group.position.y-=.15;}
    it.vel.copy(f).multiplyScalar(9.5);it.vel.y+=2.6;it.fly=true;it.wet=false;held=null;
    if(physDrop(it.group,{vel:it.vel,ball:.12,float:true}))it.fly=false; // a real rigid body: bounces, rolls downhill, floatsnoiseBurst(AU.pink,'bandpass',600,.6,.08,.05,.2);
  }else if(it.kind==='uke'){SFX.strum(0);sysStrum();}
}
function sit(){
  player.mode='sit';applyView();player.from.copy(camera.position);player.trans=0;player.baseYaw=sunYaw;player.yaw=sunYaw;player.pitch=.04;SFX.cloth();
  if(W.clock.phase==='day'){W.clock.fast=true;toast('Stay a while.',5);}else if(evening.s<.999&&!evening.running){evening.running=true;toast('Stay a while.',5);}
}
function lie(){player.mode='hammock';applyView();player.from.copy(camera.position);player.trans=0;player.baseYaw=hamYaw();player.yaw=player.baseYaw;player.pitch=1.12;SFX.cloth();}
const hamYaw=()=>{const d=_v.set(1,0,0).applyQuaternion(hamG.quaternion);return Math.atan2(-d.x,-d.z);};
function standUp(){
  const was=player.mode;player.mode='walk';applyView();player.from.copy(camera.position);player.trans=0;
  if(was==='sit'){player.x=CHAIR.x+SUN_AZ.x*.8;player.z=CHAIR.z+SUN_AZ.y*.8;}
  else{player.x=hamG.position.x-1.05;player.z=hamG.position.z;player.pitch=0;}
  SFX.cloth();
}
function interactE(){
  if(player.mode!=='walk'){standUp();return;}
  const it=looked;if(!it)return;
  if(it.e){it.e();return;}
  if(it.kind==='chair')sit();else if(it.kind==='hammock')lie();
  else if(it.kind==='radio'){it.mode=(it.mode+1)%RADIO_MODES.length;SFX.click();if(AU.radioDuck)AU.radioDuck.gain.setTargetAtTime(1,AU.ctx.currentTime,.1);}
  else if(it.pickable)pickUp(it);
}
function restartEvening(){
  evening.s=0;evening.running=false;W.clock={phase:'golden',dayT:1,fast:false};applyTime(true);$('s-time').value=2;$('v-time').textContent='· golden hour';
  if(held){scene.add(held.group);held=null;}
  player.mode='walk';player.x=START.x;player.z=START.z;player.yaw=Math.PI;player.pitch=0;player.trans=1;player.vy=0;player.air=false;player.y=groundAt(player.x,player.z);
  for(const s of slots)s.item=null;
  cup.sips=3;cup.rinsed=false;cup.water=false;coffee.visible=true;coffee.position.y=.078;cupG.position.copy(slots[0].pos);cupG.rotation.set(0,1,0);slots[0].item=cup;
  lantern.lit=true;lantern.hung=true;lanternG.position.set(HOOK.x,HOOK.y-.33,HOOK.z);lanternG.rotation.set(0,0,0);
  ukeG.position.set(LANAI.x+LANAI.w/2-.28,DECK_Y+.005,LANAI.z-LANAI.d/2+.3);ukeG.rotation.set(-.2,-.75,0,'YXZ');
  binoG.position.set(LANAI.x+.9,DECK_Y+.946,LANAI.z-LANAI.d/2+.07);binoG.rotation.set(0,.5,0);
  {const[cx,cz]=BEACH(3.2,41);cocoG.position.set(cx,heightAt(cx,cz)+.12,cz);}coco.fly=false;radio.mode=0;
  if(AU.radioDuck)AU.radioDuck.gain.value=1;
}

/* input */
addEventListener('keydown',e=>{
  if(e.repeat)return;keys[e.code]=true;
  if(state!=='play')return;
  if(bookOpen){if(['KeyE','Escape','KeyG','Space','KeyJ'].includes(e.code))closeBook();else if(e.code==='ArrowLeft'||e.code==='KeyA')GUIDE.turn(-1);else if(e.code==='ArrowRight'||e.code==='KeyD')GUIDE.turn(1);return;}
  if(e.code==='KeyJ'){openBook();return;}
  if(sysKey(e))return;
  if(e.code==='KeyV'){settings.view=settings.view==='first'?'third':'first';saveSettings();$('s-view').value=settings.view;applyView();toast(settings.view==='first'?'First person':'Third person',1.5);return;}
  if(e.code==='Space'){e.preventDefault();
    if(player.mode==='walk'&&!player.air&&player.trans>=1&&(freshAt(player.x,player.z)??0)-heightAt(player.x,player.z)<.55){player.vy=4.2;player.air=true;} // about 0.9 m high
    return;}
  if(e.code==='KeyE')interactE();
  else if(e.code==='KeyG'){held?putDown():sysDrop();}
  else if(e.code==='KeyP')savePhoto();
  else if(held&&held.kind==='uke'&&/^Digit[1-4]$/.test(e.code)){SFX.strum(+e.code[5]-1);useAnim=1;sysStrum();}
  else if(e.code==='Escape'&&!locked)openPause();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseDown=false;});
addEventListener('mousemove',e=>{
  if(!locked||state!=='play')return;const s=.0022*settings.sens*(1-player.zoom*.85);
  player.yaw-=e.movementX*s;player.pitch-=e.movementY*s*(settings.invertY?-1:1);
});
canvas.addEventListener('mousedown',e=>{
  if(state!=='play')return;if(!locked){lock();return;}
  if(e.button===0){mouseDown=true;if(held&&held.kind!=='bino')useHeld();else if(!held)sysClick();}
});
addEventListener('mouseup',()=>{mouseDown=false;});
function lock(){try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&state==='play')openPause();});

