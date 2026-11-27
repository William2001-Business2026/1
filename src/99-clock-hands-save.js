/* ───────── the slow clock: growth, hunger, tides, things that arrive ───────── */
function shorePt(){return shoreSpot();} // a spot on the home beach at the waterline (10-island.js)
function washUp(){const p=shorePt();if(!p)return;const q=Math.random(),k=q<.36?'stick':q<.64?'log':q<.82?'shell':'seaweed';if(countWorld(k)<(k==='stick'?6:4))spawn(k,p[0],p[1],1);}
function underPalm(){const p=palms[Math.floor(Math.random()*palms.length)],a=Math.random()*6.28,q=1.2+Math.random()*1.8,x=p.x+Math.cos(a)*q,z=p.z+Math.sin(a)*q;return heightAt(x,z)>.5&&!onDeck(x,z)?[x,z]:null;}
function lavaPt(){return lavaSpot();}  // a spot on the rocky shore near home (10-island.js)
function tick(dt,offline){
  const N=W.nodes;
  if((N.wash-=dt)<=0){N.wash=90;washUp();}
  if((N.stone-=dt)<=0){N.stone=200;if(countWorld('stone')<12){const p=lavaPt();p&&spawn('stone',p[0],p[1]);}}
  if((N.frond-=dt)<=0){N.frond=280;if(countWorld('frond')<6){const p=underPalm();p&&spawn('frond',p[0],p[1]);}}
  if((N.nut-=dt)<=0){N.nut=240;if(countWorld('coconut')<5){const p=underPalm();if(p){spawn('coconut',p[0],p[1]);if(!offline&&Math.hypot(p[0]-player.x,p[1]-player.z)<25)SFX.thud(.5);}}}
  N.flower=Math.max(0,N.flower-dt);
  const C=W.chick,Gt=W.goat;
  C.fed=Math.max(0,C.fed-dt/(offline?40000:1500));Gt.fed=Math.max(0,Gt.fed-dt/(offline?48000:1800));if(Gt.fed>.5)Gt.milk=Math.min(1,Gt.milk+dt/600);
  C.egg+=dt*(C.fed>.5?1:C.fed>.2?.4:.15);
  if(C.egg>=480){C.egg=0;const nb=W.pieces.find(p=>p.f==='nestbox'&&(p.d.eggs||0)<6&&Math.hypot(p.x-chickHome.x,p.z-chickHome.z)<25);
    if(nb){nb.d.eggs=(nb.d.eggs||0)+1;note('nestbox');}else if(countWorld('egg')<2){const[x,z]=landPt(chickHome.x,chickHome.z,3);spawn('egg',x,z);}}
  if((C.man+=dt)>=900){C.man=0;if(countWorld('manure')<3){const[x,z]=landPt(chickHome.x,chickHome.z,4);spawn('manure',x,z);}}
  let drain=false;
  for(const pc of W.pieces){const d=pc.d;
    if(pc.f==='fishtrap'){d.ft=(d.ft||0)+dt;if(d.ft>=600){d.ft=0;d.fish=Math.min(3,(d.fish||0)+1);}}
    if(pc.f==='hive'&&d.bees&&(d.act||offline)){d.ht=(d.ht||0)+dt*(offline?.5:1);if(d.ht>=720){d.ht=0;d.honey=Math.min(4,(d.honey||0)+1);}}
    if(pc.f==='barrel'&&d.w>0&&wetLines.some(c=>c.src===pc)){d.w=Math.max(0,d.w-dt/200);if(d.w<=0)drain=true;}}
  if(drain)recompute();
  for(const p of W.plots){growPlot(p,dt);if(!offline)drawPlot(p);}
}
function newDay(){ // you slept through the night: wake at sunrise plus a little
  W.day++;W.clock.fast=false;W.clock.h=SKYCLOCK.hourAt(4,false);evening.running=false;W.rainLeft=0;W.rainIn=Math.max(W.rainIn,120);
  arrivals();for(let i=0;i<5;i++)washUp();applyTime(true);syncSlider();saveNow();
}
function dayTurned(){arrivals();for(let i=0;i<3;i++)washUp();saveNow();} // midnight passed while you were awake
function arrivals(){
  const F=W.flags,d=W.day;
  if(d>=1&&!F.b1){F.b1=1;spawn('onion',...BEACH(4.2,41.2),3);spawn('beans',...BEACH(4.9,41.6),3);spawn('stick',...BEACH(5.4,40.8),2);}
  if(d>=2)W.chick.bold=true;
  if(d>=3&&!F.chili){F.chili=1;if(!plotAt(CHILIPLOT.x,CHILIPLOT.z))addPlot({x:CHILIPLOT.x,z:CHILIPLOT.z,soil:.7,moist:.8,crop:'chili',g:1,wild:1});}
  if(d>=4&&!F.ban){F.ban=1;spawn('banana',...BEACH(-6,42),2);}
  if(d>=6&&!F.pine){F.pine=1;spawn('crown',...BEACH(8,43),1);}
}
function freshIsland(){
  for(let i=0;i<9;i++){const p=lavaPt();p&&spawn('stone',p[0],p[1]);}
  for(let i=0;i<7;i++)washUp();
  for(let i=0;i<3;i++){const p=underPalm();p&&spawn('frond',p[0],p[1]);}
  for(let i=0;i<2;i++){const p=underPalm();p&&spawn('coconut',p[0],p[1]);}
  const p=lavaPt()||[-34,10];spawn('axehead',p[0],p[1]);spawn('fibre',p[0]+.4,p[1]+.2);
  addPlot({x:OLDPLOT.x,z:OLDPLOT.z,soil:.8,moist:.7,crop:'spud',g:1,wild:1});
  addPlot({x:SEEP.x+2,z:SEEP.z+2,soil:.75,crop:'taro',g:1,wild:1});addPlot({x:SEEP.x-2,z:SEEP.z+3,soil:.75,crop:'taro',g:.5,wild:1});
}

/* ───────── hands on the world ───────── */
let aimPt=null;
function findAim(){const o=camera.position,f=_fwd.set(0,0,-1).applyQuaternion(camera.quaternion);
  for(let t=.4;t<5;t+=.08){const x=o.x+f.x*t,y=o.y+f.y*t,z=o.z+f.z*t,g=groundAt(x,z);if(y<=g)return{x,y:g,z};}return null;}
function sysClick(){
  if(bookOpen){closeBook();return;}
  const k=selKind();if(build.on){placePiece();return;}
  if(!k)return;const t=looked;
  if(t&&t.use&&t.use(k)){if(k!=='spear')heroReach(aimPt||((t.group||t.g)&&(t.group||t.g).getWorldPosition(new THREE.Vector3())));return;}
  if(aimPt&&player.mode==='walk'){const m=masks(aimPt.x,aimPt.z);
    if(m.lava>.5&&aimPt.y>.2&&tryRecipe(k,'@rock'))return;
    if(k==='digstick'&&!t&&till(aimPt))return;}
  if(tryRecipe(k,'@self'))return;
  if(K[k].food!=null)eat(k);
}
function sysUseLegacy(it){
  const t=looked;
  if(it.kind==='cup'&&it.sips===0){
    const bar=t&&t.pc&&t.pc.f==='barrel'&&t.pc.d.w>=1;
    if(!it.water&&(t===springIx||bar)){it.water=true;if(bar)t.pc.d.w--;SFX.pour();note('water');useAnim=1;return true;}
    const p=it.water&&t&&W.plots.find(q=>q.ix===t);if(p){p.moist=1;it.water=false;SFX.pour();note('water');useAnim=1;drawPlot(p);return true;}
    const pot=it.water&&t&&t.pc&&t.pc.f==='pot'&&!t.pc.d.water;if(pot){t.pc.d.water=true;it.water=false;SFX.pour();return true;}
    if(it.water&&!t)return true;
  }
  if(it.kind==='lantern'&&it.lit&&t){
    for(const k in fireRT)if(fireRT[k].g.userData.item===t&&fireRT[k].s.fuel>0&&!fireRT[k].s.lit){fireRT[k].s.lit=true;SFX.flame(true);note('fire');return true;}
    if(t.pc&&t.pc.f==='torch'&&!t.pc.d.lit){t.pc.d.lit=true;SFX.flame(true);return true;}
  }
  return false;
}
function sysStrum(){if(Math.hypot(goat.x-player.x,goat.z-player.z)<28)goat.calm=70;W.chick.bold=true;}
function sysKey(e){
  const k=selKind();
  if(e.code==='KeyB'&&!held&&formsFor(k)){build.on=!build.on;build.dy=0;return true;}
  if(e.code==='KeyR'&&build.on){if(e.shiftKey)build.tl=build.tl>1?-1.0472:build.tl+.2618;else build.rot=build.free?(build.rot+1)%24:(build.rot+1)%8;return true;}   // Shift: tilt 15°
  if(e.code==='KeyT'&&build.on){build.free=!build.free;build.rot=build.free?build.rot*3:Math.round(build.rot/3)%8;toast(build.free?'Free placing: anywhere, turning by 15°':'On the half-metre grid',2.5);return true;}
  if((e.code==='BracketLeft'||e.code==='BracketRight')&&build.on){build.s=clamp(build.s+(e.code==='BracketRight'?.25:-.25),.5,2);note('shape');return true;}
  if(e.code==='KeyF'&&build.on){build.fi++;build.dy=0;return true;}
  if(e.code==='KeyX'&&looked&&looked.pc){SFX.knock();removePiece(looked.pc);return true;}
  if(e.code==='KeyQ'){cycleSel(1);return true;}
  if(e.code==='KeyZ'){hero.shoulder=-(hero.shoulder??1);return true;}                            // the other shoulder
  return false;
}
addEventListener('wheel',e=>{if(state!=='play'||MAPBOOK.on)return;const d=e.deltaY>0?1:-1;if(build.on)build.dy=clamp(build.dy-d,-3,14);else cycleSel(d);},{passive:true});
function sysHint(){
  const k=selKind();if(!k)return'';const s=W.inv[W.sel];let h=K[k].n+(s.n>1?'  ×'+s.n:'');
  if(build.on){const f=(formsFor(k)||[])[build.fi%((formsFor(k)||[1]).length)];h+='   ·   Click to place   ·   R turn'+(build.tl?' ('+Math.round(build.tl*57.3)+'° tilt)':'')+'   ·   F piece'+(SHAPE[f]?'   ·   [ ] length ×'+build.s:'')+'   ·   T '+(build.free?'free':'grid')+'   ·   Wheel height   ·   B done';}
  else if(formsFor(k))h+='   ·   B to build';
  return h+'   ·   G to drop';
}
const speedMul=()=>nowS()<W.buff.until?W.buff.speed:1;

/* extra sounds */
Object.assign(SFX,{
  clack(){noiseBurst(AU.white,'bandpass',2600,3,.2,.001,.05);tone(900,500,.1,.04);},
  chop(){tone(170,90,.3,.1);noiseBurst(AU.pink,'bandpass',1200,1,.18,.002,.09);},
  made(){if(!AU.ctx)return;const t=AU.ctx.currentTime;[72,79].forEach((m,i)=>AU.pluck(m,t+.05+i*.1,.2,AU.ukeBus).connect(AU.ukeRev));},
  page(){noiseBurst(AU.white,'highpass',2500,.5,.06,.03,.18);},
  pour(){noiseBurst(AU.white,'bandpass',1500,1.5,.12,.08,.6,null,3200);},
  harvest(i){if(!AU.ctx)return;tone(140,70,.2,.09);noiseBurst(AU.pink,'lowpass',700,.6,.15,.005,.12);const t=AU.ctx.currentTime,n=[60,64,67,72,76,79,84];
    [n[i%7],n[(i+2)%7],n[(i+4)%7]+0].forEach((m,j)=>AU.pluck(m,t+.08+j*.07,.26,AU.ukeBus).connect(AU.ukeRev));},
  cluck(v=1,d=0){const a=clamp(1-d/26,0,1)*v;if(a<=.02||!AU.ctx)return;const n=1+(Math.random()*3|0);for(let i=0;i<n;i++)setTimeout(()=>{tone(520+Math.random()*120,330,.07*a,.07,'triangle');noiseBurst(AU.white,'bandpass',1500,3,.03*a,.004,.05);},i*130);},
  bleat(v=1,d=0){const c=AU.ctx,a=clamp(1-d/45,0,1)*v;if(!c||a<=.02)return;const t=c.currentTime,o=c.createOscillator(),l=c.createOscillator(),lg=AU.G(18),f=AU.filt('bandpass',1100,2.5),g=AU.G(0,AU.sfx);
    o.type='sawtooth';o.frequency.setValueAtTime(380,t);o.frequency.linearRampToValueAtTime(330,t+.7);l.frequency.value=9;l.connect(lg);lg.connect(o.frequency);o.connect(f);f.connect(g);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*a,t+.08);g.gain.linearRampToValueAtTime(.06*a,t+.5);g.gain.linearRampToValueAtTime(0,t+.75);o.start(t);l.start(t);o.stop(t+.8);l.stop(t+.8);},
});
function initAudio2(){
  if(!AU.ctx||AU.rainG)return;const c=AU.ctx;
  AU.rainG=AU.G(0,AU.amb);AU.loop(AU.pink,AU.filt('highpass',1400,.3,AU.rainG));AU.loop(AU.white,AU.filt('bandpass',6500,.4,AU.G(.25,AU.rainG)));
  // rain on leaves: a patter of drops on the canopy; on a roof: a low drumming; on the sea: a soft, wide hiss
  AU.rainLeafG=AU.G(0,AU.amb);AU.loop(AU.pink,AU.filt('bandpass',2600,.7,AU.rainLeafG));{const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()<.004?(Math.random()*2-1):(d[i-1]||0)*.9;
    const s=c.createBufferSource();s.buffer=b;s.loop=true;s.connect(AU.filt('highpass',1200,.5,AU.G(1.4,AU.rainLeafG)));s.start();}
  AU.rainRoofG=AU.G(0,AU.amb);AU.loop(AU.brown,AU.filt('lowpass',700,.6,AU.rainRoofG));AU.loop(AU.pink,AU.filt('bandpass',1800,1.2,AU.G(.4,AU.rainRoofG)));
  AU.rainSeaG=AU.G(0,AU.amb);AU.loop(AU.white,AU.filt('highpass',3200,.3,AU.rainSeaG));AU.loop(AU.pink,AU.filt('lowpass',500,.4,AU.G(.6,AU.rainSeaG)));
  AU.preG=AU.G(0,AU.radioBus);AU.loop(AU.white,AU.filt('bandpass',1800,2,AU.preG));
  AU.fireG=AU.G(0,AU.amb);AU.loop(AU.brown,AU.filt('lowpass',500,.4,AU.fireG));
  {const cr=c.createScriptProcessor?null:null;const b=c.createBuffer(1,c.sampleRate*3,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()<.0006?(Math.random()*2-1):d[i-1]*.82||0;
    const s=c.createBufferSource();s.buffer=b;s.loop=true;s.connect(AU.filt('highpass',900,.5,AU.G(1.6,AU.fireG)));s.start();}
  AU.buzzG=AU.G(0,AU.amb);{const o=c.createOscillator(),o2=c.createOscillator(),l=c.createOscillator(),lg=AU.G(.4),tg=AU.G(.6,AU.filt('lowpass',1100,.6,AU.buzzG));o.type=o2.type='sawtooth';o.frequency.value=196;o2.frequency.value=203;l.frequency.value=23;l.connect(lg);lg.connect(tg.gain);o.connect(tg);o2.connect(tg);o.start();o2.start();l.start();}
}

/* An island saved before the map was enlarged: move what was on it to the same places on the larger island.
   Loose things and garden beds move one by one; each building moves as one piece, so its parts stay joined. */
function fromSmallIsland(d){
  for(const o of d.items||[]){const p=enlarge(o.x,o.z);o.x=p.x;o.z=p.z;delete o.y;}
  d.fires={}; // fire pits are known by where they stand; they start out cold in their new places
  for(const p of d.plots||[]){const q=enlarge(p.x,p.z);p.x=q.x;p.z=q.z;}
  const ps=d.pieces||[],grp=ps.map((_,i)=>i),top=i=>grp[i]===i?i:(grp[i]=top(grp[i]));
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(Math.hypot(ps[i].x-ps[j].x,ps[i].z-ps[j].z)<4.5)grp[top(i)]=top(j);
  const sets={};ps.forEach((p,i)=>(sets[top(i)]=sets[top(i)]||[]).push(p));
  for(const k in sets){const g=sets[k],cx=g.reduce((a,p)=>a+p.x,0)/g.length,cz=g.reduce((a,p)=>a+p.z,0)/g.length,to=enlarge(cx,cz);
    const dy=heightAt(to.x,to.z)-heightAt(cx,cz,1);
    for(const p of g){p.x+=to.x-cx;p.z+=to.z-cz;if(p.y!=null)p.y+=dy;}}
}

/* ───────── saving: browser storage twice over, plus a file you can keep ───────── */
let fileHandle=null,saveT=0;
function serialize(){return JSON.stringify({v:3,seen:W.seen,day:W.day,inv:W.inv,sel:W.sel,basket:W.basket,notes:W.notes,flags:W.flags,chick:W.chick,goat:W.goat,buff:W.buff,clock:W.clock,rainIn:W.rainIn,nodes:W.nodes,fires:W.fires,map:W.map,stamp:Date.now(),
  items:W.items.map(o=>({kind:o.kind,n:o.n,x:+o.x.toFixed(2),z:+o.z.toFixed(2),...(o.y!=null?{y:+o.y.toFixed(2)}:{})})),
  plots:W.plots.map(p=>({x:p.x,z:p.z,soil:p.soil,moist:p.moist,crop:p.crop,g:p.g,over:p.over,health:p.health,last:p.last,dry:p.dry,wild:p.wild})),
  pieces:W.pieces.map(p=>({f:p.f,x:p.x,y:p.y,z:p.z,r:p.r,t:p.t,d:p.d,...(p.s?{s:p.s}:{}),...(p.tl?{tl:p.tl}:{}),...(p.q?{q:p.q.map(v=>+v.toFixed(4))}:{})}))});}
function idb(fn){try{const rq=indexedDB.open('halemoku',1);rq.onupgradeneeded=()=>rq.result.createObjectStore('s');rq.onsuccess=()=>{try{fn(rq.result.transaction('s','readwrite').objectStore('s'));}catch(e){}};}catch(e){}}
function saveNow(){const s=serialize();try{localStorage.setItem(SAVE_KEY,s);}catch(e){}idb(st=>st.put(s,SAVE_KEY));
  if(fileHandle)fileHandle.createWritable().then(w=>w.write(s).then(()=>w.close())).catch(()=>{});}
function loadSave(str){
  let d;try{d=JSON.parse(str);}catch(e){return false;}if(!d||(d.v!==1&&d.v!==2&&d.v!==3))return false;
  if(d.v<3)migrateSave(d); // older maps → the real island (10-island.js)
  if(d.clock&&d.clock.h==null){const c=d.clock;d.clock={h:c.phase==='night'?21.5:c.phase==='golden'?17.1:7+(c.dayT||0)*9.5,fast:false};} // the old phased clock → an hour of the day
  [...W.items].forEach(despawn);[...W.plots].forEach(removePlot);[...W.pieces].forEach(p=>removePiece(p,false));
  for(const k of['seen','day','inv','sel','basket','notes','flags','chick','goat','buff','clock','rainIn','nodes','fires','map'])if(d[k]!=null)W[k]=d[k];
  if(W.buff.until>nowS()+3600)W.buff.until=0;
  for(const o of d.items||[])if(K[o.kind]){const it=spawn(o.kind,o.x,o.z,o.n,o.y);if(o.y!=null)it.y=o.y;}
  for(const p of d.plots||[])if(!p.crop||CROPS[p.crop])addPlot(p);
  for(const p of d.pieces||[])if(FORMS[p.f]){const pc=addPiece(p);if(pc.d.hung)drawHung(pc);}
  const gone=Math.max(0,(Date.now()-(d.stamp||Date.now()))/1000),away=Math.min(gone,8*3600);
  for(const k in W.fires){const f=W.fires[k];f.fuel=Math.max(0,f.fuel-gone);if(f.fuel<=0||gone>60)f.lit=false;}
  for(const pc of W.pieces)if(pc.f==='torch'&&gone>60)pc.d.lit=false;
  recompute();
  for(let t=0;t<away;t+=60)tick(Math.min(60,away-t),true);
  W.plots.forEach(drawPlot);W.rainLeft=0;W.clock.fast=false;
  if(W.clock.h==null)W.clock={h:17.1,fast:false};W.clock.fast=false;evening.running=false;handDirty=true;applyTime(true);syncSlider();return true;
}
function syncSlider(){const c=W.clock,e=SKYCLOCK.st.sunEl,v=e<-6?4:c.h>=12&&e<4?3:c.h>=12&&e<14?2:c.h<10.5?0:1;$('s-time').value=v;$('v-time').textContent='· '+SKYCLOCK.label()+', '+TIME_NAMES[v];}
// the presets, as real times today: morning, midday, golden hour, sunset, night
function presetHour(v){return v===0?SKYCLOCK.hourAt(18,false):v===1?12.4:v===2?SKYCLOCK.hourAt(12,true):v===3?SKYCLOCK.hourAt(1.5,true):SKYCLOCK.hourAt(-16,true)+.5;}
const TIME_NAMES=['morning','midday','golden hour','sunset','night'];
$('b-export').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([serialize()],{type:'application/json'}));a.download='hale-moku-island.json';a.click();});
$('b-import').addEventListener('click',()=>$('f-import').click());
$('f-import').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{if(loadSave(t)){saveNow();toast('Island loaded.',3);}else toast('That file is not a Hale Moku island.',4);});e.target.value='';});
if(window.showSaveFilePicker)$('b-link').addEventListener('click',()=>{window.showSaveFilePicker({suggestedName:'hale-moku-island.json',types:[{description:'Hale Moku island',accept:{'application/json':['.json']}}]}).then(h=>{fileHandle=h;saveNow();$('b-link').textContent='Save file linked';}).catch(()=>{});});
else $('b-link').style.display='none';
$('b-new').addEventListener('click',()=>{if(!confirm('Start a new island? Everything you have grown and built will be gone.'))return;try{localStorage.removeItem(SAVE_KEY);}catch(e){}idb(st=>st.delete(SAVE_KEY));saveT=-1e9;window.removeEventListener('beforeunload',saveNow);setTimeout(()=>location.reload(),150);});
addEventListener('beforeunload',saveNow);document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveT>-1e8)saveNow();});

/* ───────── every frame ───────── */
let tickAcc=0,sleepT=0,clockAcc=0;
function sysUpdate(dt){
  handG.visible=!held&&player.zoom<.4&&state!=='title';if(handDirty||(held?null:selKind())!==handKind)refreshHand();
  handAnim=Math.max(0,handAnim-dt*2.6);const hk=Math.sin(Math.PI*handAnim);
  if(!heroShown())handG.position.set(.32-hk*.08,-.32+Math.sin(player.bobT*2)*.006-hk*.05,-.6-hk*.12);if(!heroShown())handG.rotation.set(.15-hk*.7,.5,0);outline.material.color.setRGB(.85,.78,.6).multiplyScalar(.04+U.uDay.value);rainMesh.material.color.setScalar(.25+.6*U.uDay.value);
  aimPt=state==='play'?findAim():null;updateGhost();
  for(let i=tweens.length-1;i>=0;i--){const t=tweens[i];t.t+=dt;t.f(Math.min(1,t.t/t.d));if(t.t>=t.d){t.end();tweens.splice(i,1);}}
  tickAcc+=dt;if(tickAcc>=1){tick(tickAcc,false);tickAcc=0;}
  const night=smooth(6,-8,evening.elev);
  updateCreatures(dt);updateFires(dt,night);updateWeather(dt);
  for(const p of W.plots)if(p.plant)p.plant.rotation.x=Math.sin(time*1.3+p.x*1.7+p.z)*.03;
  if(state==='play'){const c=W.clock;
    if(player.mode==='hammock'&&c.phase==='night'&&player.trans>=1){sleepT+=dt;if(sleepT>4)$('fade').classList.add('on');if(sleepT>6.6){sleepT=-3;newDay();}}
    else{if(sleepT<0){sleepT+=dt;if(sleepT>=-1.5){$('fade').classList.remove('on');}if(sleepT>=0)sleepT=0;}else{sleepT=0;$('fade').classList.remove('on');}}
    saveT+=dt;if(saveT>20){saveT=0;saveNow();}
  }
}
{ let s=null;try{s=localStorage.getItem(SAVE_KEY);}catch(e){}
  if(!s||!loadSave(s)){freshIsland();recompute();
    idb(st=>{const g=st.get(SAVE_KEY);g.onsuccess=()=>{if(g.result&&state==='title')loadSave(g.result);};});}
}

/* ───────────────────────── go ───────────────────────── */
cupG.position.copy(slots[0].pos);cupG.rotation.y=1;slots[0].item=cup;
applyTime(true);applyGraphics();
