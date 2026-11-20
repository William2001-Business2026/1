/* ───────── creatures ───────── */
const featherTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(let y=-8,r=0;y<h+16;y+=10,r++)for(let x=(r%2)*8-8;x<w+16;x+=16){const gr=g.createRadialGradient(x,y,2,x,y,11);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.7,'rgba(120,105,95,.28)');gr.addColorStop(1,'rgba(35,25,20,.6)');g.fillStyle=gr;g.beginPath();g.arc(x,y,11,0,Math.PI);g.fill();}},true);
const furTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#ece6da';g.fillRect(0,0,w,h);const r=rng(3);for(let i=0;i<1700;i++){const x=r()*w,y=r()*h,d=r()>.5;g.strokeStyle=`rgba(${d?85:255},${d?75:250},${d?65:240},${.08+r()*.16})`;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*3-1.5,y+5+r()*7);g.stroke();}},true);
function lathe(g,m,pts,x=0,y=0,z=0,sx=1,sy=1){const o=new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),18).rotateX(Math.PI/2),m);o.position.set(x,y,z);o.scale.set(sx,sy,1);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function taper(g,m,rt,rb,h,x=0,y=0,z=0,rx=0,ry=0,rz=0){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,10),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function makeChicken(col){
  const g=new THREE.Group(),fm=new THREE.MeshStandardMaterial({map:featherTex,bumpMap:featherTex,bumpScale:2,color:srgb(...col),roughness:.72,side:THREE.DoubleSide}),
    dk=new THREE.MeshStandardMaterial({map:featherTex,color:srgb(col[0]*.45,col[1]*.45,col[2]*.45),roughness:.55,side:THREE.DoubleSide}),red=mt(.78,.1,.08,.5),yel=mt(.82,.62,.2,.6);
  const body=new THREE.Group();g.add(body);body.position.y=.21;
  const torso=lathe(body,fm,[[0,-.17],[.045,-.15],[.085,-.08],[.105,0],[.1,.06],[.07,.115],[.03,.14],[0,.145]],0,0,0,1,.95);torso.rotation.x=-.2;
  const wings=[-1,1].map(s=>{const w=new THREE.Group();w.position.set(s*.085,.045,.02);body.add(w);part(w,'sph',fm,.03,.065,.11,s*.012,-.04,-.04,-.25);part(w,'leaf',dk,.05,1,.12,s*.02,-.05,-.1,-2.7,0,0);return w;});
  const tail=new THREE.Group();tail.position.set(0,.05,-.13);body.add(tail);
  for(let i=0;i<7;i++){const a=(i-3)*.2;part(tail,'leaf',dk,.045,1,.17+(3-Math.abs(i-3))*.02,0,0,0,-2.15-Math.abs(i-3)*.12,a*1.2,0);}
  const neck=new THREE.Group();neck.position.set(0,.05,.1);body.add(neck);taper(neck,fm,.03,.052,.13,0,.06,.02,.35);
  const head=new THREE.Group();head.position.set(0,.13,.045);neck.add(head);
  part(head,'sph',fm,.036,.038,.042,0,0,0);part(head,'cone',yel,.012,.04,.014,0,-.004,.05,Math.PI/2);part(head,'cone',mt(.7,.5,.15,.6),.009,.025,.01,0,-.012,.04,Math.PI/2);
  for(let i=0;i<4;i++)part(head,'sph',red,.007,.017-i*.002,.012,0,.04-i*.003,.022-i*.016);for(const s of[-1,1]){part(head,'sph',red,.007,.016,.008,s*.008,-.035,.028);part(head,'sph',mt(.02,.02,.02,.1),.006,.006,.006,s*.031,.008,.014);}
  const legs=[-1,1].map(s=>{const l=new THREE.Group();l.position.set(s*.045,.14,-.01);g.add(l);part(l,'sph',fm,.03,.045,.035,0,-.01,0);taper(l,yel,.006,.007,.1,0,-.08,0);
    for(const a of[-.5,0,.5])taper(l,yel,.004,.005,.05,Math.sin(a)*.02,-.132,.02*Math.cos(a),Math.PI/2-.15,0,-a);taper(l,yel,.004,.004,.025,0,-.132,-.012,Math.PI/2);return l;});
  return{g,body,head,neck,legs,wings,tail};
}
function makeGoat(){
  const g=new THREE.Group(),fur=new THREE.MeshStandardMaterial({map:furTex,bumpMap:furTex,bumpScale:2.5,color:srgb(.86,.8,.7),roughness:.95,side:THREE.DoubleSide}),
    dk=new THREE.MeshStandardMaterial({map:furTex,bumpMap:furTex,bumpScale:2.5,color:srgb(.36,.27,.2),roughness:.95,side:THREE.DoubleSide}),horn=mt(.32,.29,.24,.45),hoof=mt(.1,.09,.08,.5);
  const body=new THREE.Group();g.add(body);body.position.y=.56;
  lathe(body,fur,[[0,-.37],[.09,-.35],[.165,-.24],[.19,-.08],[.185,.08],[.16,.22],[.115,.32],[.05,.37],[0,.375]],0,0,0,.92,1.08);
  part(body,'sph',dk,.125,.05,.2,0,.16,-.08);part(body,'sph',fur,.15,.12,.14,0,-.1,.02);
  const neck=new THREE.Group();neck.position.set(0,.1,.3);body.add(neck);taper(neck,fur,.058,.095,.3,0,.11,.07,.6);
  const head=new THREE.Group();head.position.set(0,.25,.15);neck.add(head);
  lathe(head,fur,[[0,-.08],[.055,-.06],[.066,-.01],[.058,.05],[.04,.11],[.03,.15],[0,.165]],0,0,0,.9,1).rotation.x=.45;
  part(head,'sph',dk,.026,.018,.02,0,-.075,.13);taper(head,fur,.004,.018,.09,0,-.1,.06,.3);
  for(const s of[-1,1]){part(head,'leaf',fur,.045,1,.12,s*.05,.02,-.03,.5,s*1.9,0);part(head,'sph',mt(.03,.03,.03,.15),.009,.009,.009,s*.05,.005,.045);
    let hx=s*.03,hy=.05,hz=-.03;for(let k=0;k<5;k++){const a=-.5-k*.42;taper(head,horn,.017-k*.003,.02-k*.003,.055,hx,hy,hz,a,0,s*.12);hy+=Math.cos(a)*.048;hz+=Math.sin(a)*.048;hx+=s*.006;}}
  const legs=[[-1,1],[1,1],[-1,-1],[1,-1]].map(([x,z])=>{const l=new THREE.Group();l.position.set(x*.1,.46,z*.23);g.add(l);taper(l,fur,.04,.028,.22,0,-.1,0);
    const k=new THREE.Group();k.position.y=-.21;l.add(k);taper(k,fur,.024,.018,.21,0,-.1,0);taper(k,hoof,.022,.026,.045,0,-.225,.004);l.knee=k;return l;});
  const tail=new THREE.Group();tail.position.set(0,.1,-.36);body.add(tail);taper(tail,fur,.012,.03,.11,0,.04,-.02,-.9);
  return{g,body,head:neck,skull:head,legs,tail};
}
const chickens=[[.5,.28,.14],[.14,.12,.11],[.9,.86,.78]].map((c,i)=>{const o=makeChicken(c);Object.assign(o,{x:CHICKHOME.x+i,z:CHICKHOME.z+i*.7,yaw:i*2,tx:CHICKHOME.x,tz:CHICKHOME.z,tm:i,walk:0,act:'idle'});
  o.g.userData.item={label:()=>'Hen',verb:'',use(k){const l=CHICK_LIKES(k);if(!l)return false;takeFrom(k,1);feed(W.chick,l*K[k].food*.13);W.chick.bold=true;note('chick');SFX.cluck(1);handAnim=1;return true;}};
  scene.add(o.g);interact.push(o.g);return o;});
const goat=makeGoat();Object.assign(goat,{x:KNOLL.x,z:KNOLL.z,yaw:0,tx:KNOLL.x,tz:KNOLL.z,tm:0,walk:0,hx:KNOLL.x,hz:KNOLL.z,calm:0});
goat.g.userData.item={label:()=>'Goat',get verb(){return'';},use(k){
  if(GOAT_LIKES(k)){takeFrom(k,1);feed(W.goat,GOAT_LIKES(k)*.16);W.goat.trust=Math.min(5,W.goat.trust+1);note('goat');SFX.bleat(.6);handAnim=1;return true;}
  if(k==='bowl'&&goatTame()&&W.goat.fed>.5&&W.goat.milk>=1){W.goat.milk=0;takeFrom('bowl',1);give('milk',1);note('milk');SFX.pour();handAnim=1;return true;}
  return false;}};
scene.add(goat.g);interact.push(goat.g);

/* ───────── realistic animals ─────────
   Rigged Sketchfab models (CC BY 4.0, credits in assets/models/README.txt) replace the shape-built birds and goat once
   loaded. The old shapes stay as invisible hit areas, and all behaviour (wandering, pecking, grazing, feeding) is unchanged.
   The hen's own clip walks and pecks; the rooster and goat play their idle clips and swing their legs in code as they walk. */
const ANIMALS={hen:{url:'assets/models/hen.glb',height:.42,turn:0,legs:/thigh/i,amp:.6,stride:16},
  rooster:{url:'assets/models/rooster.glb',height:.5,turn:-Math.PI/2,legs:/thigh/i,amp:.6,stride:16},
  goat:{url:'assets/models/goat.glb',height:.95,turn:0,legs:/^thigh_stretch/,amp:.45,stride:7,neck:/^c_subneck/}};
const animalSrc={};
function dressAnimal(o,kind){
  const spec=ANIMALS[kind];
  (animalSrc[kind]||(animalSrc[kind]=gltfLoader.loadAsync(spec.url))).then(gl=>{
    const box=new THREE.Box3().setFromObject(gl.scene),k=spec.height/box.getSize(_v).y;
    const m=cloneSkinned(gl.scene),holder=new THREE.Group();m.rotation.y=spec.turn;m.scale.setScalar(k);m.position.y=-box.min.y*k;holder.add(m);
    m.traverse(x=>{if(x.isMesh){x.castShadow=x.receiveShadow=true;x.frustumCulled=false;x.raycast=()=>{};}}); // aim at the old shapes, not the skinned mesh
    for(const ch of o.g.children)ch.visible=false;o.g.add(holder);
    const mixer=new THREE.AnimationMixer(m),act=mixer.clipAction(gl.animations[0]);act.play();mixer.update(Math.random()*act.getClip().duration);
    const legs=[];m.traverse(x=>{if(x.isBone&&spec.legs.test(x.name))legs.push(x);});m.updateMatrixWorld(true);
    // legs in the animal's own frame (x = right, z = forward): birds alternate left and right, the goat moves diagonal pairs together
    o.g.updateMatrixWorld(true);const lp=legs.map(b=>({b,p:holder.worldToLocal(b.getWorldPosition(new THREE.Vector3()))})),mid=lp.reduce((a,l)=>a+l.p.z,0)/Math.max(1,lp.length);
    let neck=null;if(spec.neck)m.traverse(x=>{if(x.isBone&&!neck&&spec.neck.test(x.name))neck=x;});
    o.model={spec,mixer,act,neck,graze:0,pw:o.walk,legs:lp.map(({b,p})=>({b,ph:(lp.length<3?p.x>0:(p.z>mid)!==(p.x>0))?0:Math.PI}))};
  }).catch(e=>console.warn('Animal model '+kind+' did not load:',e));
}
dressAnimal(chickens[0],'hen');dressAnimal(chickens[1],'rooster');dressAnimal(chickens[2],'hen');dressAnimal(goat,'goat');
const _aq1=new THREE.Quaternion(),_aq2=new THREE.Quaternion(),_aq3=new THREE.Quaternion(),_aax=new THREE.Vector3(),_aax2=new THREE.Vector3();
function updateAnimalModels(dt){
  for(const o of [...chickens,goat]){const M=o.model;if(!M||!o.g.visible)continue;
    const moved=o.walk-M.pw,moving=Math.abs(moved)>1e-5;M.pw=o.walk;const sp=Math.abs(moved)/Math.max(dt,1e-3);
    if(M.spec===ANIMALS.hen)M.act.timeScale=moving?clamp(sp/.9,.6,1.8):(o.act==='peck'?1:0); // its clip is a walk with pecks
    M.mixer.update(dt);
    if(M.spec!==ANIMALS.hen&&moving){ // swing the legs about the animal's sideways axis, whatever the rig's own bone axes are
      o.g.updateMatrixWorld(true);_aax.set(1,0,0).applyQuaternion(o.g.getWorldQuaternion(_aq1));
      const ph=o.walk*M.spec.stride,amp=M.spec.amp*(o.run?1.3:1);
      for(const L of M.legs){L.b.parent.getWorldQuaternion(_aq2).invert();_aax2.copy(_aax).applyQuaternion(_aq2);L.b.quaternion.premultiply(_aq3.setFromAxisAngle(_aax2,Math.sin(ph+L.ph)*amp));}}
    if(M.neck){const graze=!moving&&(o.tm%4<2.2)&&!o.run;M.graze=lerp(M.graze,graze?1:0,1-Math.exp(-dt*3)); // the goat lowers its head to graze
      if(M.graze>.01){o.g.updateMatrixWorld(true);_aax.set(1,0,0).applyQuaternion(o.g.getWorldQuaternion(_aq1));M.neck.parent.getWorldQuaternion(_aq2).invert();
        _aax2.copy(_aax).applyQuaternion(_aq2);M.neck.quaternion.premultiply(_aq3.setFromAxisAngle(_aax2,M.graze*.9));}}}
}
const goatTame=()=>W.goat.trust>=3,feed=(c,a)=>{c.fed=Math.min(1,c.fed+a);};
const chickHome={x:CHICKHOME.x,z:CHICKHOME.z};
function walkTo(c,sp,dt){const dx=c.tx-c.x,dz=c.tz-c.z,d=Math.hypot(dx,dz);if(d<.12)return false;
  const nx=c.x+dx/d*sp*dt,nz=c.z+dz/d*sp*dt;if(heightAt(nx,nz)<.35||pieceCols.some(q=>{const a=Math.hypot(nx-q.x,nz-q.z);return a<q.r+.12&&a<Math.hypot(c.x-q.x,c.z-q.z);})){c.tx=c.x;c.tz=c.z;c.goal=null;return false;}
  c.x=nx;c.z=nz;let a=Math.atan2(dx,dz)-c.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));c.yaw+=a*Math.min(1,dt*7);c.walk+=dt*sp;return true;}
const landPt=(x,z,r)=>{for(let i=0;i<8;i++){const a=Math.random()*6.28,q=Math.sqrt(Math.random())*r,px=x+Math.cos(a)*q,pz=z+Math.sin(a)*q;if(heightAt(px,pz)>.7&&!onDeck(px,pz)&&masks(px,pz).lava<.3)return[px,pz];}return[x,z];};
function troughFor(likes,x,z){let best=null;for(const pc of W.pieces)if(pc.f==='trough'&&pc.d.feed&&pc.d.feed.some(s=>likes(s.kind))&&Math.hypot(pc.x-x,pc.z-z)<40)best=pc;return best;}
function eatTrough(pc,likes,c){const s=pc.d.feed.find(s=>likes(s.kind));if(!s)return;feed(c,likes(s.kind)*(K[s.kind].food||1)*.13);s.n--;if(s.n<=0)pc.d.feed.splice(pc.d.feed.indexOf(s),1);}
function raidTarget(x,z){let b=null,bd=30;for(const p of W.plots){if(!p.crop||p.wild||fenced(p))continue;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}}return b;}
function updateCreatures(dt){
  const hk=selKind(),pd=(c)=>Math.hypot(c.x-player.x,c.z-player.z);
  // hens
  const nb=W.pieces.find(p=>p.f==='nestbox')||W.pieces.find(p=>p.f==='trough');
  chickHome.x=nb?nb.x:CHICKHOME.x;chickHome.z=nb?nb.z:CHICKHOME.z;
  const hungry=W.chick.fed<.25,bold=W.chick.bold||W.day>=2;
  chickens.forEach((c,i)=>{
    c.tm-=dt;const d=pd(c);
    if(!bold&&d<5){const a=Math.atan2(c.x-player.x,c.z-player.z);c.tx=c.x+Math.sin(a)*4;c.tz=c.z+Math.cos(a)*4;c.act='walk';c.tm=1.5;}
    else if(c.tm<=0){c.tm=1.5+Math.random()*3;c.act='idle';
      const food=W.items.find(o=>CHICK_LIKES(o.kind)&&Math.hypot(o.x-c.x,o.z-c.z)<9&&(bold||pd(o)>5)),tr=W.chick.fed<.85&&troughFor(CHICK_LIKES,c.x,c.z);
      if(food&&W.chick.fed<.97){c.tx=food.x;c.tz=food.z;c.goal=food;c.act='walk';c.tm=4;}
      else if(tr){c.tx=tr.x+(i-1)*.3;c.tz=tr.z+.45;c.goal=tr;c.act='walk';c.tm=5;}
      else if(hungry&&i===0&&raidTarget(c.x,c.z)){const p=raidTarget(c.x,c.z);c.tx=p.x+.3;c.tz=p.z;c.goal=p;c.act='walk';c.tm=6;}
      else if(bold&&hk&&CHICK_LIKES(hk)&&d<8&&d>1.3){c.tx=player.x+(c.x-player.x)/d*1.1;c.tz=player.z+(c.z-player.z)/d*1.1;c.act='walk';c.tm=1.2;}
      else if(Math.random()<(hungry?.8:.45)){[c.tx,c.tz]=landPt(chickHome.x,chickHome.z,hungry?11:6);c.act='walk';c.goal=null;}
      if(Math.random()<(hungry?.5:.12)&&d<25)SFX.cluck(hungry?1:.5,d);}
    const moving=c.act==='walk'&&walkTo(c,hungry?1.5:.9,dt);
    if(c.act==='walk'&&!moving){c.act='peck';const gl=c.goal&&Math.hypot(c.goal.x-c.x,c.goal.z-c.z)<1.1?c.goal:null;c.goal=null;
      if(gl&&gl.wkind&&W.items.includes(gl)){feed(W.chick,CHICK_LIKES(gl.kind)*(K[gl.kind].food||1)*.13);gl.n--;if(gl.n<=0)despawn(gl);W.chick.bold=true;note('chick');}
      else if(gl&&gl.f==='trough')eatTrough(gl,CHICK_LIKES,W.chick);
      else if(gl&&gl.crop){gl.health=Math.max(.5,gl.health-.1);SFX.cluck(1,d);}}
    c.g.position.set(c.x,groundAt(c.x,c.z),c.z);c.g.rotation.y=c.yaw;
    const st=Math.sin(c.walk*16),peck=c.act==='peck'&&!moving,k=1-Math.exp(-dt*10);
    const pk=peck?Math.max(0,Math.sin(time*5+i*2)):0;
    c.body.rotation.x=lerp(c.body.rotation.x,pk*.75,k);c.neck.rotation.x=lerp(c.neck.rotation.x,pk*.9+(moving?.1:0),k);
    c.head.rotation.x=pk*.5;c.head.rotation.y=moving||peck?0:Math.sin(Math.floor(time*1.1+i*3)*2.4)*.7;
    c.neck.position.z=.1+(moving?Math.sin(c.walk*16+1)*.018:0);c.body.position.y=.21+(moving?Math.abs(st)*.012:0)-pk*.02;
    c.legs[0].rotation.x=moving?st*.8:0;c.legs[1].rotation.x=moving?-st*.8:0;
    const flap=(hungry&&moving)||(Math.sin(time*.37+i*5)>.985)?Math.abs(Math.sin(time*22))*.9:0;c.wings[0].rotation.z=-flap;c.wings[1].rotation.z=flap;
    c.tail.rotation.x=Math.sin(time*2.2+i)*.06+(hungry?.15:0);c.body.scale.setScalar(hungry?.95:1);
  });
  // goat
  const here=W.day>=3;goat.g.visible=here;
  if(here){const g=goat,d=pd(g),tame=goatTame(),gh=W.goat.fed<.25;g.tm-=dt;g.calm=Math.max(0,g.calm-dt);
    const tr=troughFor(GOAT_LIKES,g.x,g.z);
    if(tame){const t=W.pieces.find(p=>p.f==='trough');g.hx=t?t.x+1.5:LANAI.x+7;g.hz=t?t.z+1.5:LANAI.z-6;}else{g.hx=KNOLL.x;g.hz=KNOLL.z;}
    const offer=hk&&GOAT_LIKES(hk);
    if(!tame&&d<6.5&&!offer&&g.calm<=0){const a=Math.atan2(g.x-player.x,g.z-player.z);[g.tx,g.tz]=[g.x+Math.sin(a)*7,g.z+Math.cos(a)*7];g.run=1;g.tm=1.2;if(Math.random()<dt*2)SFX.bleat(.5,d);}
    else if(g.tm<=0){g.tm=2.5+Math.random()*4;g.run=0;g.goal=null;
      const food=W.items.find(o=>GOAT_LIKES(o.kind)&&Math.hypot(o.x-g.x,o.z-g.z)<12&&(tame||pd(o)>4||g.calm>0));
      if(food&&W.goat.fed<.97){g.tx=food.x;g.tz=food.z;g.goal=food;}
      else if(tr&&tame&&W.goat.fed<.85){g.tx=tr.x;g.tz=tr.z-.6;g.goal=tr;}
      else if(tame&&gh&&raidTarget(g.x,g.z)){const p=raidTarget(g.x,g.z);g.tx=p.x;g.tz=p.z+.5;g.goal=p;}
      else if(offer&&d<10&&d>1.6&&(tame||g.calm>0||d>3)){g.tx=player.x+(g.x-player.x)/d*1.5;g.tz=player.z+(g.z-player.z)/d*1.5;}
      else if(Math.random()<.6)[g.tx,g.tz]=landPt(g.hx,g.hz,tame?5:8);
      if(Math.random()<(gh?.6:.1)&&d<40)SFX.bleat(gh?1:.4,d);}
    const moving=walkTo(g,g.run?3.2:.8,dt);
    if(!moving&&g.goal){const gl=Math.hypot(g.goal.x-g.x,g.goal.z-g.z)<1.3?g.goal:{};g.goal=null;
      if(gl.wkind&&W.items.includes(gl)){feed(W.goat,GOAT_LIKES(gl.kind)*.16);W.goat.trust=Math.min(5,W.goat.trust+1);gl.n--;if(gl.n<=0)despawn(gl);note('goat');}
      else if(gl.f==='trough')eatTrough(gl,GOAT_LIKES,W.goat);else if(gl.crop)gl.health=Math.max(.5,gl.health-.12);}
    g.g.position.set(g.x,groundAt(g.x,g.z),g.z);g.g.rotation.y=g.yaw;const sw=Math.sin(g.walk*7)*(moving?.5:0);
    [sw,-sw,-sw,sw].forEach((v,i)=>{g.legs[i].rotation.x=v;g.legs[i].knee.rotation.x=moving?Math.max(0,-v)*1.3+.05:0;});
    g.body.position.y=.56+(moving?Math.abs(Math.sin(g.walk*7))*.015:Math.sin(time*1.4)*.004);g.body.rotation.z=moving?Math.sin(g.walk*7)*.025:0;
    const graze=!moving&&(g.tm%4<2.2)&&!g.run;g.head.rotation.x=lerp(g.head.rotation.x,graze?1.25+Math.sin(time*6)*.06:Math.sin(time*.8)*.08,1-Math.exp(-dt*4));
    g.head.rotation.y=graze?0:Math.sin(time*.5)*.35;g.skull.rotation.x=graze?-.5:0;g.tail.rotation.z=Math.sin(time*9)*(Math.sin(time*.6)>.6?.5:.05);
  }
  // bees
  let buzz=0;
  for(const pc of W.pieces)if(pc.f==='hive'){
    const fl=W.plots.filter(p=>p.crop&&CROPS[p.crop].flower&&stageOf(p)>=4&&stageOf(p)<6&&Math.hypot(p.x-pc.x,p.z-pc.z)<10).length;
    pc.d.act=fl>=3;if(pc.d.act&&!pc.d.bees){pc.d.bees=true;note('hive');}
    const on=pc.d.bees&&pc.d.act&&raining<.3&&evening.elev>-2;pc.bees.visible=on;
    if(on){const a=pc.bees.geometry.attributes.position;for(let i=0;i<16;i++){const t=time*(1.5+i*.13)+i*4;a.setXYZ(i,Math.sin(t)*(.25+i*.03),.8+Math.sin(t*1.7+i)*.25,Math.cos(t*1.3)*(.25+i*.02));}a.needsUpdate=true;
      buzz=Math.max(buzz,1-Math.hypot(player.x-pc.x,player.z-pc.z)/9);}
  }
  if(AU.buzzG)AU.buzzG.gain.setTargetAtTime(Math.max(0,buzz)*.05,AU.ctx.currentTime,.3);
}
