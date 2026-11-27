/* ───────── making things: hold one thing, use it on another ───────── */
const RECIPES=[
  {h:'stone',t:'@rock',out:[['flake',1]],note:'flake',hits:2,toHand:1},{h:'stone',t:'stone',out:[['flake',1]],note:'flake',hits:2},
  {h:'stick',t:'@rock',out:[['digstick',1]],note:'digstick',hits:3,toHand:1},
  {h:'flake',keep:1,t:'coconut',out:[['fibre',2],['cocomeat',2]],note:'coconut',hits:2},
  {h:'fibre',n:2,t:'@self',out:[['cord',1]],note:'cord',toHand:1},{h:'fibre',n:1,t:'fibre',out:[['cord',1]],note:'cord'},
  {h:'flake',t:'stick',out:[['axehead',1]],note:'axehead'},{h:'stick',t:'flake',out:[['axehead',1]],note:'axehead'},
  {h:'cord',t:'axehead',out:[['axe',1]],note:'axe'},
  {h:'axe',keep:1,t:'log',out:[['plank',2]],hits:3},{h:'flake',keep:1,t:'log',out:[['trough',1]],note:'trough',hits:5},
  {h:'frond',n:3,t:'cord',out:[['basket',1]],note:'basket'},
  {h:'plank',n:6,t:'cord',out:[['barrel',1]],note:'barrel'},{h:'plank',n:4,t:'cord',out:[['crate',1]],note:'crate'},
  {h:'plank',n:2,t:'fibre',out:[['nestbox',1]],note:'nestbox'},
  {h:'clay',n:3,t:'@self',out:[['rawpot',1]],note:'rawpot',toHand:1},
  {h:'bamboo',n:4,t:'cord',out:[['fishtrap',1]],note:'fishtrap'},
  {h:'flake',t:'bamboo',out:[['spear',1]],note:'spear'},{h:'shell',n:2,t:'fibre',out:[['goggles',1]],note:'goggles'},
  {h:'bamboo',n:3,t:'fibre',out:[['hive',1]]},{h:'bamboo',n:1,t:'fibre',out:[['torch',1]],note:'torch'},
  {h:'frond',n:2,t:'fibre',out:[['mat',1]],note:'mat'},
  {h:'shell',n:3,t:'cord',out:[['shellstring',1]],note:'shellstring'},{h:'flower',n:5,t:'cord',out:[['lei',1]],note:'lei'},
];
const work={key:'',n:0};
function tryRecipe(h,t,target,pt){
  const r=RECIPES.find(r=>r.h===h&&r.t===t&&have(h)>=(r.n||1));if(!r)return false;
  handAnim=1;
  if(r.hits){const key=h+t+(target?target.x+','+target.z:'');if(work.key!==key){work.key=key;work.n=0;}work.n++;
    h==='axe'?(SFX.chop(),heroAct('TreeChopping_Loop',1.1)):SFX.clack();if(work.n<r.hits)return true;work.key='';}
  if(!r.keep)takeFrom(h,r.n||1);
  let x=pt?pt.x:null,z=pt?pt.z:null;
  if(target){x=target.x;z=target.z;target.n--;if(target.n<=0)despawn(target);}
  for(const[k,n]of r.out){if(r.toHand||x==null)give(k,n);else spawn(k,x+(R()-.5)*.25,z+(R()-.5)*.25,n);}
  note(r.note);SFX.made();return true;
}
function eat(k){heroAct('Consume');
  const tier=K[k].food;takeFrom(k,1);handAnim=1;SFX.sip();
  if(k==='taro'){note('rawtaro');noiseBurst(AU.white,'bandpass',900,2,.06,.02,.15);return;}
  const sp=[1,1.08,1.18,1.28,1.36][tier],carry=[0,0,4,8,12][tier],dur=[0,120,300,600,900][tier]*(homeTier>=3?2:1);
  if(sp>=W.buff.speed||nowS()>W.buff.until)W.buff={speed:sp,carry,until:nowS()+dur};
  if(tier>=2)note('cook');
  if(K[k].back)give(K[k].back,1);
  if(k==='cocomeat'&&have('bowl')+have('water')+have('milk')<2)give('bowl',1);
}
/* ───────── planting ───────── */
const CROPS={
  onion:{n:'Green onion',dur:240,yield:3,drain:.08},
  beans:{n:'Beans',dur:600,yield:3,drain:-.15,flower:1},
  spud:{n:'Sweet potato',dur:1200,yield:4,drain:.25,extra:['vines',2],flower:1},
  chili:{n:'Chili',dur:2700,yield:4,drain:.1,thirst:1.6,flower:1},
  taro:{n:'Taro',dur:7200,yield:6,drain:.2,wet:1},
  banana:{n:'Banana',dur:21600,yield:8,drain:.1,again:7200,tall:1,flower:1},
  pineapple:{n:'Pineapple',dur:43200,yield:1,drain:.2,extra:['crown',2]},
};
const SOIL_PALE=srgb(.56,.46,.33),SOIL_DARK=srgb(.13,.09,.06);
const moundG=new THREE.SphereGeometry(.5,14,6,0,Math.PI*2,0,Math.PI/2).scale(1,.3,1);
const stageOf=p=>!p.crop?0:p.over>Math.max(600,CROPS[p.crop].dur)?6:p.g>=1?5:p.g<.08?1:p.g<.35?2:p.g<.7?3:4;
function plantMesh(crop,st,droop,seed){
  const g=new THREE.Group(),r=rng(seed),f=[0,.14,.34,.62,.86,1,1][st],old=st===6;
  const gc=(a,b,c)=>old?[a*.6+.42,b*.6+.3,c*.5+.08]:droop?[a*.85+.08,b*.85+.06,c*.8]:[a,b,c];
  const leaf=(shape,col,w,l,x,y,z,rx,ry)=>part(g,shape,lm(...gc(...col)),w,1,l,x,y,z,rx+(droop?.45:0)+(old?.3:0),ry,0);
  if(crop==='onion'){const n=3+st;for(let i=0;i<n;i++)part(g,'cone',mt(...gc(.28,.5,.18),.6),.012,.5*f*(.7+r()*.5),.012,(r()-.5)*.08,.25*f,(r()-.5)*.08,(r()-.5)*.3+(droop?.6:0),0,(r()-.5)*.3);
    if(st>=5)part(g,'sph',mt(.93,.93,.86,.5),.035,.03,.035,0,.02,0);if(old)part(g,'sph',mt(.85,.8,.9,.7),.04,.04,.04,0,.5,0);}
  else if(crop==='beans'){if(st>=2)for(let i=0;i<3;i++){const a=i*2.094;part(g,'cyl',wood(),.012,1.1,.012,Math.cos(a)*.14,.52,Math.sin(a)*.14,Math.sin(a)*.26,0,-Math.cos(a)*.26);}
    const n=Math.round(26*f);for(let i=0;i<n;i++){const t=i/n,a=t*13+r(),rad=.28*(1-t*.75);leaf('heart',[.25,.47,.16],.09,.1,Math.cos(a)*rad,.05+t*1.0*f,Math.sin(a)*rad,-.5+r()*.6,a);}
    if(st===4)for(let i=0;i<7;i++){const a=r()*6.28;part(g,'sph',mt(.95,.9,.98,.5),.018,.018,.018,Math.cos(a)*.2,.3+r()*.5,Math.sin(a)*.2);}
    if(st>=5)for(let i=0;i<9;i++){const a=r()*6.28;part(g,'cyl',mt(...(old?[.5,.4,.2]:[.38,.56,.2]),.6),.008,.12,.008,Math.cos(a)*.2,.25+r()*.55,Math.sin(a)*.2,0,0,.2);}}
  else if(crop==='spud'){const n=Math.round(22*f);for(let i=0;i<n;i++){const a=r()*6.28,rad=Math.sqrt(r())*.62*f;leaf('heart',[.2,.4,.14],.11,.12,Math.cos(a)*rad,.04+r()*.05,Math.sin(a)*rad,-.25+r()*.3,a);}
    if(st===4)for(let i=0;i<4;i++){const a=r()*6.28;part(g,'cone',mt(.75,.55,.85,.5),.03,.03,.03,Math.cos(a)*.3,.1,Math.sin(a)*.3,Math.PI);}
    if(st>=5)part(g,'sph',mt(.5,.25,.3,.8),.07,.035,.045,.04,.02,.03,0,.6,.2);}
  else if(crop==='chili'){part(g,'cyl',mt(.3,.35,.15),.012,.45*f,.012,0,.22*f,0);const n=Math.round(30*f);
    for(let i=0;i<n;i++){const a=r()*6.28,e=r()*1.4-.3,rad=.24*f;leaf('leaf',[.16,.4,.13],.045,.11,Math.cos(a)*rad*Math.cos(e),.42*f+Math.sin(e)*rad,Math.sin(a)*rad*Math.cos(e),-.3,a);}
    if(st===4)for(let i=0;i<6;i++){const a=r()*6.28;part(g,'sph',mt(.97,.97,.95,.5),.014,.014,.014,Math.cos(a)*.22,.3+r()*.2,Math.sin(a)*.22);}
    if(st>=5)for(let i=0;i<8;i++){const a=r()*6.28;part(g,'cone',mt(...(old?[.4,.1,.08]:[.85,.1,.05]),.35),.014,.08,.014,Math.cos(a)*.2,.22+r()*.22,Math.sin(a)*.2,Math.PI);}}
  else if(crop==='taro'){const n=2+Math.round(4*f);for(let i=0;i<n;i++){const a=i*2.4+r(),h=(.35+.75*f)*(.7+r()*.3),o=.12+.2*f;
      part(g,'cyl',mt(...gc(.4,.52,.3),.6),.014,h,.014,Math.cos(a)*o*.5,h/2,Math.sin(a)*o*.5,Math.sin(a)*.2,0,-Math.cos(a)*.2);
      leaf('heart',[.16,.42,.2],.26*f+.05,.34*f+.06,Math.cos(a)*o,h,Math.sin(a)*o,-.9,-a+Math.PI/2);}}
  else if(crop==='banana'){const h=2.5*f+.15;part(g,'cyl',mt(...gc(.45,.5,.25),.7),.09*f+.02,h,.11*f+.02,0,h/2,0);
    const n=3+Math.round(5*f);for(let i=0;i<n;i++){const a=i*2.4;leaf('leaf',[.2,.48,.16],.3*f+.05,1.6*f+.2,0,h,0,-.75+r()*.7,a);}
    if(st===4)part(g,'cone',mt(.45,.15,.3,.5),.07,.2,.07,.25,h-.35,0,Math.PI);
    if(st>=5)for(let i=0;i<10;i++){const a=i*.63;part(g,'cyl',mt(...(old?[.5,.38,.12]:[.75,.8,.25]),.5),.022,.16,.022,.3+Math.cos(a)*.07,h-.3-(i%3)*.12,Math.sin(a)*.07,.3,0,.2);}}
  else if(crop==='pineapple'){const n=8+Math.round(18*f);for(let i=0;i<n;i++){const a=i*2.4,t=i/n;leaf('leaf',[.3,.42,.3],.045,.55*f+.08,0,.04,0,-.25-t*1.0,a);}
    if(st===4)part(g,'cone',mt(.8,.3,.35,.5),.04,.09,.04,0,.22,0);
    if(st>=5){part(g,'sph',mt(...(old?[.6,.38,.12]:[.85,.62,.18]),.7),.075,.11,.075,0,.34,0);for(let i=0;i<6;i++)part(g,'leaf',lm(.3,.42,.25),.022,1,.11,0,.44,0,-1.1,i*1.05,0);}}
  if(st===1&&crop!=='onion')for(let i=0;i<2;i++)leaf('leaf',[.35,.6,.25],.03,.05,0,.05,0,-.9,i*3.14);
  if(droop)g.scale.y=.86;
  return g;
}
function plotAt(x,z){return W.plots.find(p=>p.x===x&&p.z===z);}
function addPlot(d){
  const p=Object.assign({soil:.6,moist:.5,crop:null,g:0,over:0,health:1,last:null,dry:0,wet:Math.hypot(d.x-SEEP.x,d.z-SEEP.z)<7.5},d);
  p.grp=new THREE.Group();p.grp.position.set(p.x,groundAt(p.x,p.z)-.02,p.z);
  p.mat=new THREE.MeshStandardMaterial({bumpMap:grainTex,bumpScale:4});p.mound=new THREE.Mesh(moundG,p.mat);p.mound.scale.set(.95,1,.95);p.mound.receiveShadow=true;p.grp.add(p.mound);
  p.shown='';p.plant=null;
  const px=new THREE.Mesh(geo.box,proxyMat);px.scale.set(.9,.5,.9);px.position.y=.25;p.grp.add(px);
  p.ix={get verb(){return stageOf(p)>=5?'harvest':'';},label(){return p.crop?CROPS[p.crop].n:'Turned earth';},
    e(){if(stageOf(p)>=5)harvest(p);},
    use(k){
      if(!p.crop&&K[k].crop){heroAct('Farm_PlantSeed');takeFrom(k,1);const c=K[k].crop;if(p.last===c)p.soil=Math.max(.05,p.soil-.12);p.crop=c;p.g=0;p.over=0;p.health=1;p.dry=0;SFX.thud(.3);note('plant');handAnim=1;return true;}
      if(k==='water'){heroAct('Farm_Watering');takeFrom(k,1);give('bowl',1);p.moist=1;SFX.pour();note('water');handAnim=1;return true;}
      if(k==='seaweed'||k==='manure'){takeFrom(k,1);p.soil=Math.min(1,p.soil+.3);SFX.thud(.25);note('soil');handAnim=1;return true;}
      if(k==='digstick'&&!p.crop){removePlot(p);SFX.thud(.4);return true;}
      return false;}};
  p.grp.userData.item=p.ix;scene.add(p.grp);interact.push(p.grp);W.plots.push(p);drawPlot(p);return p;
}
function removePlot(p){scene.remove(p.grp);let i=interact.indexOf(p.grp);if(i>=0)interact.splice(i,1);i=W.plots.indexOf(p);if(i>=0)W.plots.splice(i,1);}
function drawPlot(p){
  const m=p.wet?1:p.moist;p.mat.color.copy(SOIL_PALE).lerp(SOIL_DARK,p.soil*.8+.1).multiplyScalar(1-.35*m);p.mat.roughness=.98-.4*m;
  const st=stageOf(p),droop=!!p.crop&&!p.wet&&p.moist<.18&&st<6,key=p.crop+st+droop;
  if(key!==p.shown){p.shown=key;if(p.plant)p.grp.remove(p.plant);p.plant=null;
    if(p.crop){p.plant=plantMesh(p.crop,st,droop,(p.x*73+p.z*31)|0);p.plant.position.y=.12;if(p.crop==='banana'&&!sheltered(p))p.plant.rotation.z=.12;p.grp.add(p.plant);}}
}
const near=(a,b,d)=>Math.abs(a.x-b.x)<=d&&Math.abs(a.z-b.z)<=d&&a!==b;
function adjacency(p){let f=1;const c=p.crop;
  for(const q of W.plots){if(!q.crop||!near(p,q,1.5))continue;if(q.crop==='beans'&&c!=='beans')f=Math.max(f,1.1);if(c==='taro'&&q.crop==='banana')f=Math.max(f,1.18);}
  if(goatTame()&&W.goat.fed>.5&&Math.hypot(p.x-goat.hx,p.z-goat.hz)<16)f*=1.1;
  return f;}
function sheltered(p){if(homeTier>=3&&Math.hypot(p.x-home.x,p.z-home.z)<9)return true;
  if(W.plots.some(q=>q.crop==='banana'&&near(p,q,1.5)))return true;
  return W.pieces.some(c=>(c.f==='wall'||c.f==='thatch'||c.f==='pitch')&&c.x>=p.x-.5&&c.x<p.x+3.5&&c.z<=p.z+.5&&c.z>p.z-3.5);}   // trade wind from the north-east
function fenced(p){let n=0;for(const c of W.pieces)if(['rail','wall','post','bpost','bbeam','block'].includes(c.f)&&Math.hypot(c.x-p.x,c.z-p.z)<1.9)n++;return n>=3;}
function growPlot(p,dt){
  if(!p.crop)return;const c=CROPS[p.crop];
  if(p.wet||raining>.5||irrigated(p))p.moist=1;else p.moist=Math.max(0,p.moist-dt/(season()?2400:1200)*(c.thirst||1));
  if(p.moist<.15&&p.g<1)p.dry+=dt;
  if(p.g<1){const rate=(.5+.5*Math.min(1,p.moist*2.5))*(.6+.4*p.soil)*adjacency(p)*(c.wet&&!p.wet?.25:1)*(season()&&p.crop==='taro'?1.3:1)*(!season()&&p.crop==='pineapple'?1.2:1);
    p.g=Math.min(1,p.g+dt*rate/c.dur);}else p.over+=dt;
}
function yieldOf(p){const c=CROPS[p.crop];let y=c.yield*(.5+.5*p.soil)*p.health*(1-.5*Math.min(1,p.dry/c.dur));
  if(stageOf(p)===6)y*=.5;if(c.tall&&!sheltered(p))y*=.7;
  if(W.pieces.some(h=>h.f==='hive'&&h.d.bees&&Math.hypot(h.x-p.x,h.z-p.z)<10))y*=1.2;
  if(W.chick.fed>.5&&Math.hypot(p.x-chickHome.x,p.z-chickHome.z)<15)y*=1.1;
  return Math.max(Math.ceil(c.yield*.5),Math.round(y));}
const tweens=[];
function harvest(p){heroAct('Farm_Harvest');
  const c=CROPS[p.crop],kind=p.crop,n=yieldOf(p),old=p.plant;
  if(old){p.grp.remove(old);old.position.copy(p.grp.position).y+=.12;scene.add(old);tweens.push({t:0,d:.45,f(k){old.position.y+=.012;old.scale.setScalar(1+.25*Math.sin(Math.PI*k)-k*k);old.rotation.y+=.1;},end(){scene.remove(old);}});}
  give(kind,n,p.x,p.z);if(c.extra)give(c.extra[0],c.extra[1],p.x,p.z);
  SFX.harvest(Object.keys(CROPS).indexOf(kind));
  p.soil=clamp(p.soil-c.drain,.05,1);p.last=kind;p.health=1;p.dry=0;p.over=0;p.plant=null;p.shown='';
  if(c.drain<0)note('beans');if(kind==='taro')note('taro');
  if(c.again){p.g=1-c.again/c.dur;}else{p.crop=null;p.g=0;}
  drawPlot(p);
}
function till(a){
  const x=Math.round(a.x),z=Math.round(a.z),sf=surfaceAt(x,z);
  if(!['grass','sand'].includes(sf)||heightAt(x,z)<.9||plotAt(x,z)||Math.hypot(x-LANAI.x,z-LANAI.z)<4.4)return false;
  addPlot({x,z,soil:sf==='grass'?.62:.36,moist:.4});SFX.thud(.5);noiseBurst(AU.pink,'bandpass',700,.6,.1,.02,.2);note('till');handAnim=1;heroAct('Farm_Harvest');return true;
}

/* ───────── building: free pieces on a half-metre grid ───────── */
const FORMS={
  post:{n:'Post',from:'stick',mk:()=>{const g=new THREE.Group();part(g,'cyl',wood(),.04,2.3,.04,0,1.15,0);return g;}},
  rail:{n:'Rail',from:'stick',y:.9,mk:()=>{const g=new THREE.Group();part(g,'cyl',wood(),.03,2,.03,0,0,0,0,0,Math.PI/2);return g;}},
  bpost:{n:'Bamboo post',from:'bamboo',mk:()=>{const g=new THREE.Group();part(g,'cyl',mt(...C_BAM,.4),.045,2.6,.045,0,1.3,0);for(let i=1;i<6;i++)part(g,'cyl',mt(.36,.45,.2,.5),.048,.02,.048,0,i*.45,0);return g;}},
  bbeam:{n:'Bamboo beam',from:'bamboo',y:2.3,mk:()=>{const g=new THREE.Group();part(g,'cyl',mt(...C_BAM,.4),.04,2,.04,0,0,0,0,0,Math.PI/2);return g;}},
  channel:{n:'Bamboo channel',from:'bamboo',y:.06,mk:()=>{const g=new THREE.Group();part(g,'box',mt(...C_BAM,.4),2,.03,.09,0,0,0);part(g,'box',mt(.2,.4,.5,.1),1.96,.01,.05,0,.018,0).name='water';return g;}},
  floor:{n:'Floor board',from:'plank',y:.04,mk:()=>{const g=new THREE.Group();part(g,'box',wood(C_DRIFT),1,.04,.5,0,0,0);return g;}},
  wall:{n:'Wall board',from:'plank',mk:()=>{const g=new THREE.Group();part(g,'box',wood(C_DRIFT),1,1,.04,0,.5,0);return g;}},
  thatch:{n:'Thatch',from:'frond',y:2.35,mk:()=>thatchPanel(0)},
  pitch:{n:'Pitched thatch',from:'frond',y:2.5,mk:()=>thatchPanel(.5)},
  block:{n:'Stone',from:'stone',mk:()=>{const g=new THREE.Group();part(g,'sph',stoneM(),.2,.15,.18,0,.11,0,0,R()*3,0);return g;}},
  path:{n:'Paving stone',from:'stone',mk:()=>{const g=new THREE.Group();part(g,'cyl',stoneM(),.24,.04,.22,0,.02,0);return g;}},
  bench:{n:'Log',from:'log',mk:()=>K.log.mk()},
};
function thatchPanel(tilt){const g=new THREE.Group(),h=new THREE.Group();g.add(h);h.rotation.x=tilt;
  part(h,'box',mt(.6,.5,.3,.95),1.04,.05,1.04,0,0,0);for(let i=0;i<5;i++){const o=part(h,'box',thatchM(),1.1,.3,.01,0,-.02,-.44+i*.24,1.2);o.castShadow=false;}return g;}
for(const k of Object.keys(K))if(K[k].place)FORMS[k]={n:K[k].n,from:k,mk:()=>K[k].mk(),y:(k==='shellstring'||k==='lei')?2.2:0};
const FORMS_OF={stick:['post','rail'],bamboo:['bpost','bbeam','channel'],plank:['floor','wall'],frond:['thatch','pitch'],stone:['block','path'],log:['bench']};
const formsFor=k=>FORMS_OF[k]||(K[k]&&K[k].place?[k]:null);
/* shaping: a post or a board is cut to the length you want (half to twice its usual), and a long one takes two pieces of wood */
const SHAPE={post:'y',bpost:'y',rail:'x',bbeam:'x',channel:'x',floor:'x',wall:'x',bench:'x'};
const shapeCost=(f,s)=>SHAPE[f]&&s>1.01?2:1;
function shapeGroup(g,f,s,tl){if(SHAPE[f]&&s&&s!==1)g.scale[SHAPE[f]]=s;if(tl)g.rotation.x=tl;return g;}
const build={on:false,fi:0,rot:0,dy:0,ghost:null,key:'',s:1,free:false,tl:0};
const ghostMat=new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:.5,depthWrite:false});
const FUEL={stick:150,log:420,plank:200,frond:70,bamboo:150};
const DYES=k=>K[k]&&K[k].dye;
function addPiece(d){
  const pc=Object.assign({r:0},d),F=FORMS[pc.f];pc.d=pc.d||{};pc.r=pc.r||0;
  pc.g=F.mk();pc.g.position.set(pc.x,pc.y,pc.z);pc.g.rotation.order='YXZ';pc.g.rotation.y=pc.r*Math.PI/4;shapeGroup(pc.g,pc.f,pc.s,pc.tl);
  if(pc.q)pc.g.quaternion.fromArray(pc.q);                                                       // where it came to rest after falling
  if(pc.t)tintClone(pc.g,new THREE.Color().setRGB(...pc.t,THREE.SRGBColorSpace).multiplyScalar(1.6));
  const bb=new THREE.Box3().setFromObject(pc.g),sz=bb.getSize(new THREE.Vector3()),ct=bb.getCenter(new THREE.Vector3());
  const px=new THREE.Mesh(geo.box,proxyMat);pc.g.add(px);px.scale.set(Math.max(sz.x,.2),Math.max(sz.y,.2),Math.max(sz.z,.2));pc.g.worldToLocal(ct);px.position.copy(ct);px.quaternion.copy(pc.g.quaternion).invert();
  pc.ix={pc,get verb(){return pieceVerb(pc);},label(){return pieceLabel(pc);},e(){pieceE(pc);},use(k){return pieceUse(pc,k);}};
  pc.g.userData.item=pc.ix;scene.add(pc.g);interact.push(pc.g);W.pieces.push(pc);PIECEPHYS.add(pc);
  if(pc.f==='torch'){pc.light=new THREE.PointLight(new THREE.Color(1,.58,.25),0,14,2);pc.light.position.y=2.25;pc.g.add(pc.light);}
  if(pc.f==='hive'){const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(48),3));pc.bees=new THREE.Points(pg,new THREE.PointsMaterial({color:0x2a2208,size:.035}));pc.bees.frustumCulled=false;pc.bees.visible=false;pc.g.add(pc.bees);}
  return pc;
}
function removePiece(pc,refund=true){
  PIECEPHYS.remove(pc);scene.remove(pc.g);let i=interact.indexOf(pc.g);if(i>=0)interact.splice(i,1);i=W.pieces.indexOf(pc);if(i>=0)W.pieces.splice(i,1);
  if(refund){const nb=shapeCost(pc.f,pc.s);settling?spawn(FORMS[pc.f].from,pc.x+(R()-.5)*.4,pc.z+(R()-.5)*.4,nb):give(FORMS[pc.f].from,nb,pc.x,pc.z);
    const d=pc.d;if(d.st)for(const s of d.st)spawn(s.kind,pc.x+(R()-.5)*.5,pc.z+(R()-.5)*.5,s.n);if(d.feed)for(const s of d.feed)spawn(s.kind,pc.x,pc.z+.4,s.n);
    if(d.eggs)spawn('egg',pc.x,pc.z+.3,d.eggs);if(d.fish)spawn('fish',pc.x,pc.z+.3,d.fish);if(d.hung)for(const h of d.hung)spawn(h.kind,pc.x,pc.z,1);if(d.ing)for(const k of d.ing)spawn(k,pc.x,pc.z+.3,1);}
  if(settling)return;if(refund)settle();recompute();
}
const isRack=pc=>(pc.f==='rail'||pc.f==='bbeam')&&pc.y-groundAt(pc.x,pc.z)>=.7;
const listOf=a=>a&&a.length?a.map(s=>K[s.kind].n.toLowerCase()+' '+s.n).join(', '):'empty';
function pieceLabel(pc){const d=pc.d,n=FORMS[pc.f].n;
  if(pc.f==='crate')return n+'  ·  '+listOf(d.st);
  if(pc.f==='trough')return n+'  ·  '+listOf(d.feed);
  if(pc.f==='pot'&&d.ing&&d.ing.length)return n+'  ·  '+d.ing.map(k=>K[k].n.toLowerCase()).join(', ');
  return n;}
function pieceVerb(pc){const d=pc.d;
  if(pc.f==='crate')return d.st&&d.st.length?'take':'';if(pc.f==='nestbox')return d.eggs?'take the eggs':'';
  if(pc.f==='fishtrap')return d.fish?'empty':'';if(pc.f==='hive')return d.honey?'take comb':'';
  if(pc.f==='pot')return d.done?'take':'';if(isRack(pc)&&d.hung&&d.hung.length)return'take down';
  return'';}
function pieceE(pc){const d=pc.d;
  if(pc.f==='crate'&&d.st&&d.st.length){heroAct('Chest_Open',.9);const s=d.st[0],got=give(s.kind,s.n,null,null,true);s.n-=got;if(s.n<=0)d.st.shift();else d.st.push(d.st.shift());SFX.knock();return;}
  if(pc.f==='nestbox'&&d.eggs){d.eggs-=give('egg',d.eggs,null,null,true);SFX.pickup();return;}
  if(pc.f==='fishtrap'&&d.fish){d.fish-=give('fish',d.fish,null,null,true);SFX.splash(.4);return;}
  if(pc.f==='hive'&&d.honey){d.honey-=give('honey',d.honey,null,null,true);note('honey');SFX.pickup();return;}
  if(pc.f==='pot'&&d.done){give(d.done,2);d.done=null;d.ing=[];d.water=false;d.t=0;SFX.made();return;}
  if(isRack(pc)&&d.hung&&d.hung.length){const h=d.hung.pop(),dry=(Date.now()-h.t)/1000>rackTime(pc)&&K['d_'+h.kind];give(dry?'d_'+h.kind:h.kind,1);if(dry)note('rack');drawHung(pc);SFX.pickup();return;}
}
const rackTime=pc=>300*((roofed(pc.x,pc.z)&&homeTier>=2)||Object.values(fireRT).some(f=>f.s.lit&&Math.hypot(f.x-pc.x,f.z-pc.z)<3.2)?.5:1);
function drawHung(pc){if(pc.hg)pc.g.remove(pc.hg);pc.hg=new THREE.Group();(pc.d.hung||[]).forEach((h,i)=>{const m=K[h.kind].mk();m.position.set(-.5+i*.5,-.14,0);m.rotation.z=Math.PI/2;pc.hg.add(m);});pc.g.add(pc.hg);}
function pieceUse(pc,k){const d=pc.d;
  if(DYES(k)&&!isFoodTarget(pc)&&!(k==='chili'&&pc.f==='pot')){takeFrom(k,1);const t=K[k].dye;removePiece(pc,false);addPiece({f:pc.f,x:pc.x,y:pc.y,z:pc.z,r:pc.r,s:pc.s,tl:pc.tl,q:pc.q,d:pc.d,t});recompute();note('dye');SFX.pour();return true;}
  if(pc.f==='crate'){const s=W.inv[W.sel];d.st=d.st||[];let e=d.st.find(q=>q.kind===k);if(!e){if(d.st.length>=8)return true;e={kind:k,n:0};d.st.push(e);}const n=Math.min(s.n,40-e.n);e.n+=n;takeFrom(k,n);SFX.knock();return true;}
  if(pc.f==='trough'&&(CHICK_LIKES(k)||GOAT_LIKES(k))){d.feed=d.feed||[];const tot=d.feed.reduce((a,s)=>a+s.n,0);if(tot>=12)return true;let e=d.feed.find(q=>q.kind===k);if(!e){e={kind:k,n:0};d.feed.push(e);}e.n++;takeFrom(k,1);SFX.thud(.2);note('trough');return true;}
  if(pc.f==='barrel'&&k==='bowl'&&d.w>=1){d.w--;takeFrom('bowl',1);give('water',1);SFX.pour();return true;}
  if(pc.f==='pot'){if(k==='water'&&!d.water){d.water=true;takeFrom(k,1);give('bowl',1);SFX.pour();return true;}
    if(isFood(k)&&!/^[cds]_/.test(k)&&!K[k].back&&(d.ing||(d.ing=[])).length<4&&!d.done){d.ing.push(k);takeFrom(k,1);SFX.splash(.2);return true;}}
  if(isRack(pc)&&K['d_'+k]&&(d.hung||(d.hung=[])).length<3){d.hung.push({kind:k,t:Date.now()});takeFrom(k,1);drawHung(pc);SFX.pickup();return true;}
  return false;}
const isFoodTarget=pc=>pc.f==='trough'||pc.f==='crate'||isRack(pc);
function placePiece(){
  const k=selKind(),fs=formsFor(k);if(!fs||!build.ghost||!build.ghost.visible)return;
  const f=fs[build.fi%fs.length],g=build.ghost.position;
  if(f==='fishtrap'&&heightAt(g.x,g.z)>-.15)return;
  const sh=SHAPE[f]?build.s:1,cost=shapeCost(f,sh);if(have(k)<cost){toast('A piece that long takes two.');return;}
  const stands=supportedAt(f,g.x,g.y,g.z,null,null,sh);
  takeFrom(k,cost);const pc=addPiece({f,x:g.x,y:g.y,z:g.z,r:build.free?build.rot/3:build.rot,...(sh!==1?{s:sh}:{}),...(build.tl?{tl:build.tl}:{})});
  if(!stands){PIECEPHYS.fall(pc);note('fall');}                                                    // nothing holds it: it falls, and lies where it lands
  if(f==='barrel')pc.d.w=0;SFX[k==='stone'?'clack':'knock']();recompute();if(!selKind()||selKind()!==k)build.on=false;
}
function updateGhost(){
  const k=selKind(),fs=build.on&&formsFor(k);
  if(!fs||!aimPt){if(build.ghost)build.ghost.visible=false;if(!fs)build.on=false;return;}
  const f=fs[build.fi%fs.length],key=f;
  if(build.key!==key){if(build.ghost)scene.remove(build.ghost);build.ghost=FORMS[f].mk();build.ghost.rotation.order='YXZ';build.ghost.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=false;}});scene.add(build.ghost);build.key=key;}
  build.ghost.scale.set(1,1,1);shapeGroup(build.ghost,f,SHAPE[f]?build.s:1,build.tl);
  const x=build.free?aimPt.x:Math.round(aimPt.x*2)/2,z=build.free?aimPt.z:Math.round(aimPt.z*2)/2;
  let y=Math.max(groundAt(x,z),f==='fishtrap'?-.4:-9)+(FORMS[f].y||0)+build.dy*.25;
  const fl=floorY(x,z,y+.3);if(fl!=null&&!build.dy&&!(FORMS[f].y>1))y=Math.max(y,fl+(FORMS[f].y||0));
  if(f==='raft'){const fw=freshAt(x,z),wy=fw!=null&&fw>heightAt(x,z)?fw:heightAt(x,z)<0?water.position.y:null;if(wy!=null)y=wy+.02;}   // a raft sits on the water
  build.ghost.visible=true;build.ghost.position.set(x,y,z);build.ghost.rotation.y=(build.free?build.rot/3:build.rot)*Math.PI/4;
  ghostMat.color.set(f==='fishtrap'&&heightAt(x,z)>-.15?0xff7060:supportedAt(f,x,y,z,null,null,SHAPE[f]?build.s:1)?0x8fd8ff:0xffb050);   // blue: it stands; amber: it will fall
}

/* ───────── structure: what holds what up, what blocks the way, what can be walked on ───────── */
const DIM={post:[2.3,.06],rail:[.08,1],bpost:[2.6,.06],bbeam:[.1,1],channel:[.06,1],floor:[.06,.5],wall:[1,.5],thatch:[.14,.62],pitch:[.5,.62],block:[.3,.2],path:[.05,.24],bench:[.22,.65],crate:[.45,.4],barrel:[.8,.33],trough:[.25,.6],nestbox:[.36,.25],rawpot:[.25,.18],pot:[.25,.18],fishtrap:[.5,.4],hive:[.9,.35],mat:[.03,.7],shellstring:[.05,.06],lei:[.05,.16],torch:[1.7,.05]};
const hangs=f=>f==='shellstring'||f==='lei';
const dimOf=(f,s)=>{const D=DIM[f]||[.3,.3];return SHAPE[f]&&s&&s!==1?(SHAPE[f]==='y'?[D[0]*s,D[1]]:[D[0],D[1]*s]):D;};
function supportedAt(f,x,y,z,self,okSet,s){
  if(f==='fishtrap'||f==='raft')return true;const hang=hangs(f);
  if(!hang&&y-Math.max(groundAt(x,z),floorY(x,z,y+.2)||-99)<=.32)return true;
  for(const q of W.pieces){if(q===self||q.fall||(okSet&&!okSet.has(q)))continue;const D=dimOf(q.f,q.s),qa=hangs(q.f)?q.y-.9:q.y,qb=hangs(q.f)?q.y:q.y+D[0];
    if(Math.hypot(q.x-x,q.z-z)<=D[1]+dimOf(f,s)[1]+.22&&qb>=y-.4&&qa<=y+.2)return true;}
  return false;}
let settling=false;
function settle(){
  if(settling)return;settling=true;const ok=new Set();let ch=true,fell=0;
  while(ch){ch=false;for(const p of W.pieces)if(!ok.has(p)&&(p.fall||supportedAt(p.f,p.x,p.y,p.z,p,ok,p.s))){ok.add(p);ch=true;}}
  for(const p of[...W.pieces])if(!ok.has(p)){PIECEPHYS.fall(p);fell++;}                     // what held it is gone: it comes down
  settling=false;if(fell){SFX.knock();setTimeout(()=>SFX.clack(),130);setTimeout(()=>SFX.thud(.5),220);}
}
let pieceCols=[],floorList=[];
function floorY(x,z,py){let best=null;for(const p of floorList){if(p.fall||p.q)continue;const dx=x-p.x,dz=z-p.z,a=p.r*Math.PI/4,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a),hw=p.f==='raft'?1:.56*(p.s||1),hd=p.f==='raft'?.8:.31;
  if(Math.abs(lx)<=hw&&Math.abs(lz)<=hd){const t=p.y+(p.f==='raft'?.15:.03);if(t<=py+.5&&(best==null||t>best))best=t;}}return best;}
function rebuildCols(){
  pieceCols=[];floorList=W.pieces.filter(p=>p.f==='floor'||p.f==='raft');
  const line=(p,n,half,r)=>{const a=p.r*Math.PI/4;half*=p.s||1;for(let i=0;i<n;i++){const t=n>1?(i/(n-1)*2-1)*half:0;pieceCols.push({x:p.x+Math.cos(a)*t,z:p.z-Math.sin(a)*t,r});}};
  for(const p of W.pieces){const h=p.y-groundAt(p.x,p.z),f=p.f;
    if((f==='post'||f==='bpost'||f==='torch')&&h<1.2)pieceCols.push({x:p.x,z:p.z,r:.1});
    else if(f==='block'&&h<.6)pieceCols.push({x:p.x,z:p.z,r:.2});
    else if(f==='crate')pieceCols.push({x:p.x,z:p.z,r:.4});else if(f==='barrel')pieceCols.push({x:p.x,z:p.z,r:.36});
    else if(f==='nestbox'||f==='hive')pieceCols.push({x:p.x,z:p.z,r:.28});else if(f==='pot'||f==='rawpot')pieceCols.push({x:p.x,z:p.z,r:.18});
    else if(f==='trough'||f==='bench')line(p,3,.45,.17);
    else if(f==='wall'&&h<1.5)line(p,4,.42,.15);
    else if((f==='rail'||f==='bbeam')&&h>.25&&h<1.4)line(p,6,.92,.12);}
  for(const k in fireRT)pieceCols.push({x:fireRT[k].x,z:fireRT[k].z,r:.38});
}
/* what the pieces add up to: fire rings, roofs, a home, irrigation */
const fireRT={};let homeTier=0;const home={x:0,z:0};let roofs=[],wetLines=[];
const outline=new THREE.LineLoop(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3)),new THREE.LineBasicMaterial({color:srgb(.85,.78,.6)}));outline.visible=false;outline.frustumCulled=false;scene.add(outline);
const pegs=[0,1,2,3].map(()=>{const m=new THREE.Mesh(geo.cyl,wood());m.scale.set(.02,.3,.02);m.visible=false;scene.add(m);return m;});
const roofed=(x,z)=>roofs.some(t=>Math.abs(t.x-x)<=.8&&Math.abs(t.z-z)<=.8);
const irrigated=p=>wetLines.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<1.6);
function recompute(){
  // fire rings: four or more stones gathered round a point
  const blocks=W.pieces.filter(p=>p.f==='block'),used=new Set(),keys={};
  for(const b of blocks){if(used.has(b))continue;const cl=blocks.filter(q=>!used.has(q)&&Math.hypot(q.x-b.x,q.z-b.z)<=1.45);if(cl.length<4)continue;
    const x=cl.reduce((a,q)=>a+q.x,0)/cl.length,z=cl.reduce((a,q)=>a+q.z,0)/cl.length;
    const an=cl.map(q=>Math.atan2(q.z-z,q.x-x)).sort((a,b)=>a-b);let gap=an[0]+Math.PI*2-an[an.length-1];for(let i=1;i<an.length;i++)gap=Math.max(gap,an[i]-an[i-1]);
    if(gap>2.6||cl.some(q=>Math.hypot(q.x-x,q.z-z)<.2))continue;
    cl.forEach(q=>used.add(q));const key=Math.round(x*2)+','+Math.round(z*2);keys[key]={x,z};}
  for(const k in fireRT)if(!keys[k]){scene.remove(fireRT[k].g);const i=interact.indexOf(fireRT[k].g);if(i>=0)interact.splice(i,1);delete fireRT[k];delete W.fires[k];}
  for(const k in keys)if(!fireRT[k])makeFire(k,keys[k].x,keys[k].z);
  // roofs and the home they make
  roofs=W.pieces.filter(p=>(p.f==='thatch'||p.f==='pitch')&&p.y-groundAt(p.x,p.z)>=1.4);
  const groups=[],seen2=new Set();
  for(const t of roofs){if(seen2.has(t))continue;const c=[t];seen2.add(t);for(let i=0;i<c.length;i++)for(const u of roofs)if(!seen2.has(u)&&Math.abs(u.x-c[i].x)<=1.05&&Math.abs(u.z-c[i].z)<=1.05&&Math.abs(u.y-c[i].y)<=1.2){seen2.add(u);c.push(u);}groups.push(c);}
  let best=null;
  for(const c of groups){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,ry=0;for(const t of c){x0=Math.min(x0,t.x);x1=Math.max(x1,t.x);z0=Math.min(z0,t.z);z1=Math.max(z1,t.z);ry+=t.y/c.length;}
    const inb=(p,m)=>p.x>=x0-m&&p.x<=x1+m&&p.z>=z0-m&&p.z<=z1+m,cnt=(fs,m)=>W.pieces.filter(p=>fs.includes(p.f)&&inb(p,m)&&p.y<ry).length;
    const T=c.length,P=cnt(['post','bpost'],.8),Wl=cnt(['wall'],.8),Fl=cnt(['floor'],.6),tier=T>=12&&P>=4&&Wl>=6&&Fl>=6?3:T>=6&&P>=4?2:T>=2&&P>=2?1:0;
    if(!best||tier*100+T>best.tier*100+best.T)best={tier,T,x0,x1,z0,z1};}
  homeTier=best?best.tier:0;
  if(roofs.length)note('roof');if(best){home.x=(best.x0+best.x1)/2;home.z=(best.z0+best.z1)/2;}
  if(homeTier)note('home'+homeTier);if(homeTier>=2)note('home2');
  outline.visible=homeTier>0&&homeTier<3;pegs.forEach(p=>p.visible=outline.visible);
  if(outline.visible){const x0=best.x0-1.5,x1=best.x1+1.5,z0=best.z0-1.5,z1=best.z1+1.5,a=outline.geometry.attributes.position,c=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
    c.forEach(([x,z],i)=>{const y=groundAt(x,z)+.22;a.setXYZ(i,x,y,z);pegs[i].position.set(x,y-.1,z);});a.needsUpdate=true;}
  rebuildCols();
  // irrigation: channels linked to a barrel that holds water
  wetLines=[];const ch=W.pieces.filter(p=>p.f==='channel'),open=W.pieces.filter(p=>p.f==='barrel'&&p.d.w>0).map(b=>({x:b.x,z:b.z,b}));
  const seen=new Set();while(open.length){const o=open.pop();for(const c of ch)if(!seen.has(c)&&Math.hypot(c.x-o.x,c.z-o.z)<2.3){seen.add(c);c.src=o.b;wetLines.push(c);open.push({x:c.x,z:c.z,b:o.b});}}
  for(const c of ch){const w=c.g.getObjectByName('water');if(w)w.visible=seen.has(c);}
}
function makeFire(key,x,z){
  const s=W.fires[key]||(W.fires[key]={fuel:0,lit:false,cook:[]}),g=new THREE.Group(),y=groundAt(x,z);g.position.set(x,y,z);
  part(g,'cyl',new THREE.MeshBasicMaterial({color:srgb(.05,.045,.04)}),.42,.02,.42,0,.012,0).castShadow=false;
  const woodG=new THREE.Group();for(let i=0;i<4;i++)part(woodG,'cyl',new THREE.MeshBasicMaterial({color:srgb(.16,.1,.06)}),.03,.55,.03,0,.07+i*.02,0,0,i*.8,Math.PI/2-.25);g.add(woodG);
  const fl=new THREE.Group();for(let i=0;i<3;i++){const m=part(fl,'cone',new THREE.MeshBasicMaterial({color:new THREE.Color(5,2-i*.5,.4),transparent:true,opacity:.85,depthWrite:false}),.13-i*.03,.4+i*.12,.13-i*.03,(i-1)*.07,.3,(i%2)*.06);m.castShadow=false;}g.add(fl);
  const light=new THREE.PointLight(new THREE.Color(1,.52,.2),0,16,2);light.position.y=1.0;g.add(light);
  const px=new THREE.Mesh(geo.cyl,proxyMat);px.scale.set(.5,.7,.5);px.position.y=.35;g.add(px);const cookG=new THREE.Group();g.add(cookG);
  const rt=fireRT[key]={g,s,x,z,woodG,fl,light,cookG,shown:''};
  g.userData.item={get verb(){return s.cook.some(c=>cooked(c))?'take':!s.lit&&(s.burnt||0)>=45?'take charcoal':'travel from here';},label(){return s.lit?'Fire':'Fire ring';},
    e(){if(!s.cook.some(c=>cooked(c))&&!(!s.lit&&(s.burnt||0)>=45)){if(TRAVEL.offer({x,z}))return;}              // nothing to take: travel to another camp
      if(!s.lit&&(s.burnt||0)>=45&&!s.cook.some(c=>cooked(c))){const n=Math.min(3,Math.floor(s.burnt/45));const got=give('charcoal',n);s.burnt=Math.max(0,s.burnt-got*45);if(got){SFX.pickup();note('charcoal');handAnim=1;}return;}for(let i=s.cook.length-1;i>=0;i--){const c=s.cook[i];if(cooked(c)){give(c.kind==='rawpot'?'pot':'c_'+c.kind,1);if(c.kind==='rawpot')note('pot');else note('cook');s.cook.splice(i,1);}}SFX.pickup();},
    use(k){if(k==='kukui'&&s.lit){if(!have('shell')){toast('A shell to catch the soot in, first.');return false;}takeFrom('kukui',1);takeFrom('shell',1);give('ink',1);note('ink');SFX.made();handAnim=1;return true;}
      if(FUEL[k]){s.fuel=Math.min(1800,s.fuel+FUEL[k]);takeFrom(k,1);SFX.knock();handAnim=1;return true;}
      if(s.lit&&(K[k].cook||k==='rawpot')&&s.cook.length<3){s.cook.push({kind:k,t:Date.now()});takeFrom(k,1);SFX.pickup();handAnim=1;return true;}return false;}};
  scene.add(g);interact.push(g);
}
const cooked=c=>(Date.now()-c.t)/1000>(c.kind==='rawpot'?70:40);
function dishOf(ing){const s=new Set(ing),hot=s.has('chili');let d='stew';
  if(s.has('pork')&&(s.has('taro')||s.has('spud')))d='kalua';else if(s.has('hee')&&s.has('cocomeat'))d='heeluau';else if(s.has('ula')||s.has('aama'))d='seapot';else if(s.has('taro')&&(s.has('egg')||s.has('fish')))d='laulau';else if(s.has('taro')&&[...s].every(k=>k==='taro'||k==='chili'))d='poi';else if(s.has('cocomeat')&&(s.has('honey')||s.has('milk')||s.has('banana')))d='haupia';
  return(hot?'s_':'')+d;}
function updateFires(dt,night){
  let nearLit=0;
  for(const k in fireRT){const f=fireRT[k],s=f.s;
    if(s.lit){s.fuel-=dt;s.burnt=Math.min(400,(s.burnt||0)+dt);if(s.fuel<=0||(raining>.6&&!(roofed(f.x,f.z)&&homeTier>=2))){s.lit=false;s.fuel=Math.max(0,s.fuel);noiseBurst(AU.white,'bandpass',2500,.6,.08,.02,.8);}}
    f.woodG.visible=s.fuel>0;f.fl.visible=s.lit;
    if(s.lit){const fk=.8+.25*fbm(time*6+f.x,2.3,2);f.light.intensity=fk*(1.2+3.2*night);f.fl.scale.set(1,fk,1);f.fl.rotation.y=time*2;nearLit=Math.max(nearLit,1-Math.hypot(player.x-f.x,player.z-f.z)/14);}else f.light.intensity=0;
    const key=s.cook.map(c=>c.kind+(cooked(c)?1:0)).join();
    if(key!==f.shown){f.shown=key;f.cookG.clear();s.cook.forEach((c,i)=>{const m=c.kind==='rawpot'?K[cooked(c)?'pot':'rawpot'].mk():(cooked(c)?K['c_'+c.kind]:K[c.kind]).mk();const a=i*2.1+.5;m.position.set(Math.cos(a)*.3,.12,Math.sin(a)*.3);f.cookG.add(m);});}
  }
  for(const pc of W.pieces){const d=pc.d;
    if(pc.f==='pot'&&d.water&&d.ing&&d.ing.length&&!d.done&&Object.values(fireRT).some(f=>f.s.lit&&Math.hypot(f.x-pc.x,f.z-pc.z)<1.3)){d.t=(d.t||0)+dt;if(d.t>60){d.done=dishOf(d.ing);d.ing=[];note('pot');}}
    if(pc.f==='torch'){const fl=pc.g.getObjectByName('flame');fl.visible=!!d.lit;pc.light.intensity=d.lit?(.8+.2*Math.sin(time*9+pc.x))*(.5+2.2*night):0;if(d.lit&&raining>.6)d.lit=false;}
  }
  if(AU.fireG)AU.fireG.gain.setTargetAtTime(Math.max(0,nearLit)*.22,AU.ctx.currentTime,.3);
}

