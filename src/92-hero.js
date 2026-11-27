/* ───────── the islander: you, seen from behind (third person) ─────────
   Quaternius Universal Base Character and Universal Animation Library (CC0); see assets/models/README.txt.
   The camera orbits with the mouse; the body turns toward the way you walk. Sitting, the hammock and the
   binoculars use the original first-person views. Until the model has loaded, the game stays first person. */
const hero={ready:false,root:new THREE.Group(),mixer:null,acts:{},cur:'',bodyYaw:Math.PI,hand:null,socket:new THREE.Group(),camDist:3.1,px:0,pz:0,wasAir:false,landT:0,shotT:0,shot:''};
scene.add(hero.root,hero.socket);hero.root.visible=false;
const heroShown=()=>hero.ready&&settings.view!=='first'&&player.mode==='walk';
const thirdView=()=>heroShown()&&player.zoom<.05;
/* The body is a real person, photo-scanned (in3D, CC BY 4.0): a modern islander in a polo shirt and shorts. It has its own
   27-bone skeleton, so the animation library (made for the base character's 65-bone rig) is retargeted onto it once, at load:
   each bone's rotation away from its rest pose is carried across in world space, after the two rest poses are lined up limb
   by limb (one stands in a T, the other in an A). The pelvis moves by the same amount, scaled to the scan's leg length. */
const RIG_MAP={pelvis:'pelvis_01',spine_01:'spine1_08',spine_02:'spine2_09',spine_03:'spine3_010',neck_01:'neck_011',Head:'head_012',
  clavicle_l:'left_collar_013',upperarm_l:'left_shoulder_014',lowerarm_l:'left_elbow_015',hand_l:'left_wrist_016',
  clavicle_r:'right_collar_017',upperarm_r:'right_shoulder_018',lowerarm_r:'right_elbow_019',hand_r:'right_wrist_020',
  thigh_l:'left_hip_02',calf_l:'left_knee_03',foot_l:'left_ankle_04',thigh_r:'right_hip_05',calf_r:'right_knee_06',foot_r:'right_ankle_07'};
const RIG_AIM={spine_01:['spine_02','spine2_09'],spine_02:['spine_03','spine3_010'],spine_03:['neck_01','neck_011'],neck_01:['Head','head_012'],
  clavicle_l:['upperarm_l','left_shoulder_014'],upperarm_l:['lowerarm_l','left_elbow_015'],lowerarm_l:['hand_l','left_wrist_016'],hand_l:['middle_01_l','left_wrist_end_024'],
  clavicle_r:['upperarm_r','right_shoulder_018'],upperarm_r:['lowerarm_r','right_elbow_019'],lowerarm_r:['hand_r','right_wrist_020'],hand_r:['middle_01_r','right_wrist_end_025'],
  thigh_l:['calf_l','left_knee_03'],calf_l:['foot_l','left_ankle_04'],foot_l:['ball_l','left_ankle_end_021'],
  thigh_r:['calf_r','right_knee_06'],calf_r:['foot_r','right_ankle_07'],foot_r:['ball_r','right_ankle_end_022']};
function retargetHero(src,tgt,clips){
  const V=THREE.Vector3,Q=THREE.Quaternion,wrap=new THREE.Group();wrap.add(tgt);src.updateMatrixWorld(true);wrap.updateMatrixWorld(true);
  const wp=(o)=>o.getWorldPosition(new V()),wq=(o,q)=>o.getWorldQuaternion(q||new Q());
  const sBox=new THREE.Box3().setFromObject(src),fwd=wp(tgt.getObjectByName('left_ankle_end_021')).sub(wp(tgt.getObjectByName('left_ankle_04')));
  wrap.rotation.y=-Math.atan2(fwd.x,fwd.z);wrap.updateMatrixWorld(true);                                       // face +Z, like the base character
  let b=new THREE.Box3().setFromObject(tgt);wrap.scale.setScalar((sBox.max.y-sBox.min.y)/(b.max.y-b.min.y));wrap.updateMatrixWorld(true);
  b=new THREE.Box3().setFromObject(tgt);wrap.position.y=sBox.min.y-b.min.y;wrap.updateMatrixWorld(true);       // the same height, feet on the same ground
  const P=[];for(const [sn,tn] of Object.entries(RIG_MAP)){const so=src.getObjectByName(sn),to=tgt.getObjectByName(tn);if(!so||!to)continue;
    const p={s:so,t:to,sRi:wq(so).invert(),A:new Q()},aim=RIG_AIM[sn];
    if(aim){const sa=src.getObjectByName(aim[0]),ta=tgt.getObjectByName(aim[1]);if(sa&&ta)p.A.setFromUnitVectors(wp(ta).sub(wp(to)).normalize(),wp(sa).sub(wp(so)).normalize());}
    p.AT=p.A.clone().multiply(wq(to));p.rest=to.quaternion.clone();P.push(p);}
  if(P.length<16)throw new Error('skeletons do not match');
  const pS=src.getObjectByName('pelvis'),pT=tgt.getObjectByName('pelvis_01'),sP0=wp(pS),tP0=wp(pT),restPos=pT.position.clone();
  const ratio=(tP0.y-wp(tgt.getObjectByName('left_ankle_04')).y)/(sP0.y-wp(src.getObjectByName('foot_l')).y);
  const mixer=new THREE.AnimationMixer(src),q1=new Q(),q2=new Q(),q3=new Q(),v1=new V(),out=[];
  for(const clip of clips){mixer.stopAllAction();mixer.clipAction(clip).play();
    const n=Math.max(2,Math.ceil(clip.duration*30)+1),times=new Float32Array(n),vals=P.map(()=>new Float32Array(n*4)),pv=new Float32Array(n*3);
    for(let i=0;i<n;i++){const t=Math.min(clip.duration,i/30);times[i]=t;mixer.setTime(t);src.updateMatrixWorld(true);
      P.forEach((p,j)=>{q2.multiplyQuaternions(wq(p.s,q1),p.sRi);q3.multiplyQuaternions(q2,p.AT);                 // the source's turn from rest, applied to the lined-up target
        const loc=wq(p.t.parent,q1).invert().multiply(q3),a=vals[j];if(i>0&&a[i*4-4]*loc.x+a[i*4-3]*loc.y+a[i*4-2]*loc.z+a[i*4-1]*loc.w<0)loc.set(-loc.x,-loc.y,-loc.z,-loc.w);
        p.t.quaternion.copy(loc);loc.toArray(a,i*4);});
      v1.copy(wp(pS)).sub(sP0).multiplyScalar(ratio).add(tP0);pT.parent.updateWorldMatrix(true,false);pT.parent.worldToLocal(v1);v1.toArray(pv,i*3);}
    const tracks=P.map((p,j)=>new THREE.QuaternionKeyframeTrack(p.t.name+'.quaternion',times,vals[j]));tracks.push(new THREE.VectorKeyframeTrack(pT.name+'.position',times,pv));
    out.push(new THREE.AnimationClip(clip.name,clip.duration,tracks));}
  mixer.stopAllAction();P.forEach(p=>p.t.quaternion.copy(p.rest));pT.position.copy(restPos);
  return{model:wrap,clips:out};}
Promise.all([gltfLoader.loadAsync('assets/models/islander.glb'),gltfLoader.loadAsync('assets/models/islander_moves.glb'),
  gltfLoader.loadAsync('assets/models/islander_scan.glb').catch(e=>{console.warn('The scanned body did not load:',e);return null;})]).then(([c,mv,sc])=>{
  let model=null,clips=mv.animations;
  if(sc)try{const r=retargetHero(c.scene,sc.scene,mv.animations);model=r.model;clips=r.clips;hero.scan=true;}catch(e){console.warn('Retargeting failed, so the base character is used:',e);}
  if(!model)model=c.scene;
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;
    if(!hero.scan&&/hair/i.test(o.material.name))o.material.color.setRGB(.055,.035,.022);
    if(hero.scan&&o.material){o.material.side=THREE.FrontSide;o.material.roughness=.85;}}}); // eyebrows share the greyscale hair material
  model.rotation.y+=Math.PI; // the model faces +Z; the game's "forward" is -Z
  hero.root.add(model);hero.mixer=new THREE.AnimationMixer(model);
  for(const clip of clips){const a=hero.mixer.clipAction(clip);if(/Start|Land|Enter|Exit|Interact|PickUp/.test(clip.name)){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}hero.acts[clip.name]=a;}
  hero.model=model;hero.hand=model.getObjectByName(hero.scan?'right_wrist_020':'hand_r');hero.px=player.x;hero.pz=player.z;hero.ready=true;heroPlay('Idle_Loop',0);applyView();
  if(hero.scan)return;                                                   // the scanned islander wears his own clothes and hair
  try{dressMalo(model);}catch(e){console.warn('Malo:',e);}
  // hair and beard come as separate meshes skinned to the same 65-bone rig: bind them to this body's bones
  gltfLoader.loadAsync('assets/models/islander_hair.glb').then(h=>{let body=null;model.traverse(o=>{if(o.isSkinnedMesh&&!body)body=o;});
    for(const sc of h.scenes)sc.traverse(o=>{if(!o.isSkinnedMesh)return;const bones=o.skeleton.bones.map(b=>model.getObjectByName(b.name));if(bones.some(b=>!b))return;
      const mesh=o;setTimeout(()=>{mesh.removeFromParent();mesh.bind(new THREE.Skeleton(bones,mesh.skeleton.boneInverses),mesh.bindMatrix);
        mesh.material.color.setRGB(.055,.035,.022); // the free pack's hair is greyscale, made to be tinted: dark brown
        mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;body.parent.add(mesh);},0);});})
    .catch(e=>console.warn('Hair did not load:',e));
}).catch(e=>console.warn('The character did not load, so the game stays in first person:',e));
const kapaTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#b48a5a';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=`rgba(${90+Math.random()*60|0},${60+Math.random()*40|0},30,.08)`;g.fillRect(Math.random()*w,Math.random()*h,2,1);} // beaten bark cloth
  g.fillStyle='#3a2416';for(let y=0;y<h;y+=64){for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,y+14);g.lineTo(x+16,y);g.lineTo(x+32,y+14);g.fill();}g.fillRect(0,y+22,w,5);g.fillRect(0,y+40,w,2);}},true); // kapa triangles and bands
function dressMalo(model){
  let body=null,pelvis=null;model.traverse(o=>{if(o.isSkinnedMesh&&!body)body=o;if(o.isBone&&!pelvis&&/pelvis|hips/i.test(o.name))pelvis=o;});if(!body||!pelvis)return;
  model.updateMatrixWorld(true);
  // measure the waist in the body's own frame (up the body, facing its front), around the pelvis height
  const pos=body.geometry.attributes.position,v=new THREE.Vector3(),pw=pelvis.getWorldPosition(new THREE.Vector3()),mq=model.getWorldQuaternion(new THREE.Quaternion()),mqi=mq.clone().invert();
  let rx=0,rz=0,zmin=0,zmax=0,n=0;for(let i=0;i<pos.count;i+=2){v.fromBufferAttribute(pos,i);body.applyBoneTransform(i,v);v.applyMatrix4(body.matrixWorld).sub(pw).applyQuaternion(mqi);
    if(Math.abs(v.y)>.05)continue;n++;rx=Math.max(rx,Math.abs(v.x));rz=Math.max(rz,Math.abs(v.z));zmin=Math.min(zmin,v.z);zmax=Math.max(zmax,v.z);}
  if(n<10){rx=.17;rz=.12;zmin=-.11;zmax=.12;}
  const m=new THREE.MeshStandardNodeMaterial({map:kapaTex,roughness:.95,side:THREE.DoubleSide});
  const g=new THREE.Group();pelvis.add(g);const ps=pelvis.getWorldScale(new THREE.Vector3()).x,pq=pelvis.getWorldQuaternion(new THREE.Quaternion());
  g.quaternion.copy(pq.invert().multiply(mq));g.scale.setScalar(1/Math.max(1e-4,ps));                       // the wrap keeps the body's frame and real-world size
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.08,28,1,true),m);band.scale.set(rx*1.07,1,rz*1.1);band.position.y=.03;band.castShadow=true;g.add(band);
  const flap=(z)=>{const piv=new THREE.Group();piv.position.set(0,.0,z);const p=new THREE.Mesh(new THREE.PlaneGeometry(.2,.42,1,4).translate(0,-.21,0),m);p.castShadow=true;piv.add(p);g.add(piv);return piv;};
  hero.malo={front:flap(zmax*1.1+.006),back:flap(zmin*1.1-.006)};
}
const LOCO=['Idle_Loop','Walk_Loop','Jog_Fwd_Loop'];
function heroPlay(name,fade=.22){if(hero.cur===name)return;const a=hero.acts[name];if(!a)return;
  if(hero.cur==='LOCO'){for(const n of LOCO){const l=hero.acts[n];if(l&&l!==a)fade>0?l.fadeOut(fade):l.stop();}a.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(fade>0)a.fadeIn(fade);hero.cur=name;return;}
  const p=hero.acts[hero.cur];a.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(p&&fade>0)a.crossFadeFrom(p,fade,false);else if(p)p.stop();hero.cur=name;}
/* Walking and running, the way open-world games do it: idle, walk and jog are not swapped but blended by how fast you are actually
   going, and all of them run on one shared step cycle that advances with the ground you cover, so the feet never slide and a speed
   change never pops. Speed itself has weight (see the frame loop), so the blend rises and falls smoothly. */
function heroLoco(dt,v){
  const A=hero.acts,I=A.Idle_Loop,Wk=A.Walk_Loop,J=A.Jog_Fwd_Loop;if(!I||!Wk||!J)return false;
  if(hero.cur!=='LOCO'){const p=A[hero.cur];if(p)p.fadeOut(.28);for(const a of[I,Wk,J]){a.reset().play();a.setEffectiveTimeScale(0);a.setEffectiveWeight(0);}hero.cur='LOCO';hero.locoIn=0;}
  hero.locoIn=Math.min(1,(hero.locoIn||0)+dt/.28);
  const wI=1-smooth(.06,1.1,v),wJ=smooth(1.7,3.1,v),wW=Math.max(0,1-wI-wJ),dW=Wk.getClip().duration,dJ=J.getClip().duration;
  const stride=lerp(1.45*dW,3.4*dJ,wJ/(wW+wJ+1e-4));                                       // metres per cycle, at each clip's own pace
  hero.ph=((hero.ph||0)+v*dt/Math.max(.3,stride))%1;Wk.time=hero.ph*dW;J.time=hero.ph*dJ;I.time=(I.time+dt)%I.getClip().duration;
  I.setEffectiveWeight(wI*hero.locoIn);Wk.setEffectiveWeight(wW*hero.locoIn);J.setEffectiveWeight(wJ*hero.locoIn);hero.idleW=wI;return true;}
/* wet: out of the sea or the river his skin and clothes are darker and glossy, drying over a couple of minutes (faster in sun and
   wind); wading wets him to the depth he stood in. */
function heroWet(dt,swim){const fw=freshAt(player.x,player.z),h=heightAt(player.x,player.z),dep=player.uw||swim?2:Math.max(h<0?-h:0,fw!=null?fw-h:0);
  const lvl=clamp(dep/1.1,0,1);if(lvl>(hero.wet||0))hero.wet=lvl;else hero.wet=Math.max(0,(hero.wet||0)-dt/(120/(1+sun.intensity*.12+WIND.strength.value*.5)));
  if(!hero.mats){hero.mats=[];hero.model.traverse(o=>{if(o.isMesh&&o.material)for(const m of[].concat(o.material))if(m.color&&!hero.mats.some(q=>q.m===m))hero.mats.push({m,c:m.color.clone(),r:m.roughness??.8});});}
  const w=hero.wet;if(Math.abs(w-(hero.wetShown??-1))<.01)return;hero.wetShown=w;
  for(const q of hero.mats){q.m.color.copy(q.c).multiplyScalar(1-.38*w);q.m.roughness=q.r*(1-.55*w);}}
// after the clips: the head follows where you look, the chest breathes, and the body banks into turns and leans with speed changes
const _hl=new THREE.Vector3();
function heroPost(dt,spd,swim){
  const B=hero.bones||(hero.bones={neck:hero.model.getObjectByName(hero.scan?'neck_011':'neck_01'),head:hero.model.getObjectByName(hero.scan?'head_012':'Head'),
    chest:hero.model.getObjectByName(hero.scan?'spine3_010':'spine_03')});
  let d=player.yaw-hero.bodyYaw,lp=-player.pitch*.45;
  const tgt=hero.reach&&hero.reach.t<hero.reach.dur?hero.reach.p:(looked&&(looked.group||looked.g)?(looked.group||looked.g).getWorldPosition(_hl):null); // what you are about to touch draws the eyes
  if(tgt&&hero.root.position.distanceTo(tgt)<4.5){const hx=tgt.x-hero.root.position.x,hz=tgt.z-hero.root.position.z;d=Math.atan2(-hx,-hz)-hero.bodyYaw;
    lp=Math.atan2(tgt.y-(hero.root.position.y+1.6),Math.hypot(hx,hz))*.8;}
  d=Math.atan2(Math.sin(d),Math.cos(d))-(IK.look||0);                                       // the chest already turns part of the way
  const look=swim||player.air?0:smooth(2.5,1.7,Math.abs(d)),want=clamp(d,-1.15,1.15)*look,pitch=clamp(lp,-.55,.35)*look;  // never over the shoulder
  hero.lookY=lerp(hero.lookY||0,want,Math.min(1,dt*5));hero.lookP=lerp(hero.lookP||0,pitch,Math.min(1,dt*5));
  const up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),pq=new THREE.Quaternion(),wq=new THREE.Quaternion(),side=new THREE.Vector3();
  const turn=(b,yaw,pit)=>{if(!b||!b.parent)return;b.getWorldQuaternion(wq);b.parent.getWorldQuaternion(pq);
    side.set(Math.cos(hero.bodyYaw+yaw),0,-Math.sin(hero.bodyYaw+yaw));                         // the axis across the face, for nodding
    q.setFromAxisAngle(up,yaw).premultiply(new THREE.Quaternion().setFromAxisAngle(side,pit));wq.premultiply(q);b.quaternion.copy(pq.invert().multiply(wq));b.updateMatrixWorld(true);};
  hero.model.updateMatrixWorld(true);turn(B.neck,hero.lookY*.4,hero.lookP*.4);turn(B.head,hero.lookY*.6,hero.lookP*.6);
  if(B.chest&&hero.idleW>.01){B.chest.rotateX(Math.sin(performance.now()/1000*1.55)*.018*hero.idleW);}   // breathing, while standing
  // bank into turns and lean with acceleration
  const yr=(hero.bodyYaw-(hero.prevYaw??hero.bodyYaw)),w=Math.atan2(Math.sin(yr),Math.cos(yr))/Math.max(dt,1e-3);hero.prevYaw=hero.bodyYaw;
  const acc=(spd-(hero.prevSpd??spd))/Math.max(dt,1e-3);hero.prevSpd=spd;
  hero.bank=lerp(hero.bank||0,swim||player.air?0:clamp(-w*spd*.05,-.2,.2),Math.min(1,dt*6));hero.lean=lerp(hero.lean||0,swim||player.air?0:clamp(acc*.025,-.08,.1),Math.min(1,dt*4));
}
function heroOneShot(name){if(!heroShown()||!hero.acts[name])return;hero.shot=name;hero.shotT=hero.acts[name].getClip().duration*.8;}
/* reaching for things: turn to face them, bend or kneel to their height, and guide the right hand to them over the middle of the
   move; the head looks at them first. Low on the ground he kneels, at waist height he bends, higher up he reaches. */
function heroReach(p){if(!p||!heroShown())return;const y=p.y-player.y,clip=y<.45?'Fixing_Kneeling':y<1.25?'PickUp_Table':'Interact';
  heroOneShot(clip);if(!hero.acts[clip])return;const dur=Math.min(1.6,hero.acts[clip].getClip().duration*.8);
  hero.reach={p:p.clone(),t:0,dur,low:y<.45,mid:y<1.25};hero.faceTo=Math.atan2(-(p.x-player.x),-(p.z-player.z));}
// how each item sits in the right hand: x, y, z (metres, body space), then rotation x, y, z
const HOLD3={cup:[0,-.04,.03,0,0,0],lantern:[0,-.24,.02,0,0,0],uke:[.02,-.02,.12,0,1.57,1.2],bino:[0,-.03,.05,0,0,0],coco:[0,-.03,.05,0,0,0]};
function holdItem(it){const g=it.group;
  if(heroShown()){hero.socket.add(g);const h=HOLD3[it.kind]||[0,-.03,.05,0,0,0];g.position.set(h[0],h[1],h[2]);g.rotation.set(h[3],h[4],h[5]);}
  else{camera.add(g);g.position.set(...it.hold.p);g.rotation.set(...it.hold.r);}}
function applyView(){
  if(typeof camLabel==='function')camLabel();
  if(held)holdItem(held);
  if(heroShown()){hero.socket.add(handG);handG.position.set(0,-.03,.05);handG.rotation.set(0,0,0);}else camera.add(handG);
}
function updateHero(dt,moving){
  if(!hero.ready)return;
  const show=(heroShown()||RAG.on)&&player.zoom<.4;hero.root.visible=hero.socket.visible=show;if(!show)return;
  if(RAG.on){hero.root.position.set(player.x,player.y,player.z);return;}                    // the physics has him
  const hfw=freshAt(player.x,player.z),deep=Math.max(0,(hfw!=null?hfw:0)-heightAt(player.x,player.z)),swim=player.uw||deep>1.05&&!player.air;
  hero.root.position.set(player.x,player.uw?player.y+.1:swim?(hfw!=null?hfw:water.position.y)-1.15:player.y,player.z);
  const k=1/Math.max(dt,1e-3),vx=(player.x-hero.px)*k,vz=(player.z-hero.pz)*k;hero.px=player.x;hero.pz=player.z;
  const spd=hero.spd=Math.hypot(vx,vz);
  if(spd>.15){hero.turn=0;const want=Math.atan2(-vx,-vz);let d=want-hero.bodyYaw;d=Math.atan2(Math.sin(d),Math.cos(d));hero.bodyYaw+=d*Math.min(1,dt*10);}
  else if(!swim&&!player.air&&thirdView()){ // standing still: when the camera swings far round, turn on the spot to face the way you look, stepping as you go
    let d=player.yaw-hero.bodyYaw;d=Math.atan2(Math.sin(d),Math.cos(d));
    if(!hero.turn&&Math.abs(d)>1.75)hero.turn=1;
    if(hero.turn){const st=Math.sign(d)*Math.min(Math.abs(d),dt*3.2);hero.bodyYaw+=st;if(Math.abs(d)<.12)hero.turn=0;}}
  else hero.turn=0;
  if(hero.faceTo!=null&&spd<.3){let d=hero.faceTo-hero.bodyYaw;d=Math.atan2(Math.sin(d),Math.cos(d));hero.bodyYaw+=d*Math.min(1,dt*9);if(Math.abs(d)<.05)hero.faceTo=null;}else hero.faceTo=null;
  if(hero.reach)hero.reach.t+=dt;
  if(hero.reach&&hero.reach.t<hero.reach.dur*.45){const r=hero.reach,dx=r.p.x-player.x,dz=r.p.z-player.z,d=Math.hypot(dx,dz);   // a step in, to kneel beside it
    const stand=hero.reach.low?.32:.4;if(d>stand){const st=Math.min(d-stand,1.3*dt);const nx=player.x+dx/d*st,nz=player.z+dz/d*st;if(Math.abs(groundAt(nx,nz)-groundAt(player.x,player.z))<.35&&!TUBE.inside(player.x,player.z,player.y)){player.x=nx;player.z=nz;}}}
  hero.root.rotation.order='YXZ';hero.root.rotation.y=hero.bodyYaw;hero.root.rotation.x=player.uw?lerp(hero.root.rotation.x,player.pitch*.85*smooth(.2,1,moving),Math.min(1,dt*3)):-(hero.lean||0); // dive head-first; on land, lean with speed changes
  hero.root.rotation.z=hero.bank||0;
  if(hero.wasAir&&!player.air)hero.landT=.28;hero.wasAir=player.air;hero.landT=Math.max(0,hero.landT-dt);hero.shotT=Math.max(0,hero.shotT-dt);
  let want='Idle_Loop',ts=1;
  if(swim)want=moving>.3?'Swim_Fwd_Loop':'Swim_Idle_Loop';
  else if(player.air)want=player.vy>.8?'Jump_Start':'Jump_Loop';
  else if(hero.landT>0)want='Jump_Land';
  else if(moving>2.3){want='Jog_Fwd_Loop';ts=clamp(moving/3.4,.7,1.3);}
  else if(moving>.2){want='Walk_Loop';ts=clamp(moving/1.45,.6,1.5);}
  else if(hero.turn){want='Walk_Loop';ts=.8;}                                                 // small steps round
  else if(hero.shotT>0)want=hero.shot;
  else if((keys.ShiftLeft||keys.ShiftRight)&&moving<.15&&hero.acts.Crouch_Idle_Loop&&player.mode==='walk')want='Crouch_Idle_Loop';   // creeping, he crouches low when he stops
  else if(held&&held.kind==='lantern')want='Idle_Torch_Loop';
  const loco=/^(Idle_Loop|Walk_Loop|Jog_Fwd_Loop)$/.test(want)&&!hero.turn&&heroLoco(dt,moving);  // on foot: blended by speed
  if(!loco){heroPlay(want,player.air||hero.landT>0?.12:.25);hero.idleW=want==='Idle_Loop'?1:0;
    if(/Walk_Loop|Jog_Fwd/.test(hero.cur))hero.acts[hero.cur].setEffectiveTimeScale(ts);}  // feet match the ground speed
  hero.mixer.update(dt);
  heroWet(dt,swim);
  heroPost(dt,moving,swim);
  RAG.blendPose();
  heroIK(dt,swim);
  if(hero.malo){const sp=Math.min(1,moving/3),sw=Math.sin(performance.now()/1000*7.5)*.25*sp;hero.malo.front.rotation.x=-sw-.15*sp;hero.malo.back.rotation.x=sw+.12*sp;}
  // the hand socket follows the right hand but stays upright, so a full cup or a lantern does not tip
  hero.root.updateMatrixWorld(true);hero.hand.getWorldPosition(hero.socket.position);hero.socket.rotation.set(0,hero.bodyYaw,0);
}
function refreshHand(){handDirty=false;const k=held?null:selKind();if(k===handKind)return;handKind=k;handG.clear();if(!k)return;
  const m=K[k].mk();m.scale.multiplyScalar(K[k].hs||1);m.traverse(o=>{o.castShadow=false;});handG.add(m);}
function cycleSel(d){if(held)return;const n=W.inv.length;if(!n){W.sel=-1;return;}W.sel=((W.sel+1+d)%(n+1)+(n+1))%(n+1)-1;handDirty=true;build.on=false;}
function sysDrop(){const k=selKind();if(!k)return;const fx=player.x-Math.sin(player.yaw)*.9,fz=player.z-Math.cos(player.yaw)*.9;
  if(groundAt(fx,fz)<.02&&k!=='fishtrap'){return;}
  const tf=TUBE.floorAt(fx,fz,player.y);                                                                   // inside the lava tube: on its floor
  const n=keys.ShiftLeft?W.inv[W.sel].n:1;takeFrom(k,n);const before=W.items.length,it=spawn(k,fx,fz,n,tf==null?undefined:tf);SFX.step(tf!=null?'rock':surfaceAt(fx,fz),.6);
  if(tf!=null){it.y=tf;return;}
  if(W.items.length>before&&!K[k].place){it.g.position.set(fx,player.y+1,fz); // let go from the hand: it falls, tumbles and comes to rest
    physDrop(it.g,{vel:{x:-Math.sin(player.yaw)*.7,y:.4,z:-Math.cos(player.yaw)*.7},float:FLOATS.has(k),onRest:g=>{it.x=g.position.x;it.z=g.position.z;
      const top=g.position.y-groundAt(it.x,it.z);it.y=top>.06?g.position.y:null;}});}}


/* ───────── feet on the ground ─────────
   After the animation has posed the body, each leg is bent so its foot meets the ground under it (two-bone IK: the knee bends by the
   law of cosines, then the hip turns the leg to the target), the pelvis drops to the lower foot so the higher one can bend, and each
   foot tilts to the slope it stands on. While standing still the upper body also turns a little toward where the camera looks.
   Ground comes from groundAt (the terrain's heightAt, or the deck). Faded out in the air, swimming and when not walking. */
const IK={w:0,drop:0,legs:null,footH:null,look:0};
const _ik={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),t:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),ax:new THREE.Vector3(),
  q:new THREE.Quaternion(),q2:new THREE.Quaternion(),q3:new THREE.Quaternion(),up:new THREE.Vector3(0,1,0)};
function boneTurnWorld(bone,dq){const pq=bone.parent.getWorldQuaternion(_ik.q2),wq=bone.getWorldQuaternion(_ik.q3);wq.premultiply(dq);bone.quaternion.copy(pq.invert().multiply(wq));bone.updateMatrixWorld(true);}
function heroIK(dt,swim){
  if(!IK.legs){const m=hero.root,names=hero.scan?[['left_hip_02','left_knee_03','left_ankle_04'],['right_hip_05','right_knee_06','right_ankle_07']]:[['thigh_l','calf_l','foot_l'],['thigh_r','calf_r','foot_r']];
    IK.legs=names.map(([a,b,c])=>({a:m.getObjectByName(a),b:m.getObjectByName(b),c:m.getObjectByName(c)})).filter(l=>l.a&&l.b&&l.c);
    IK.spine=['spine2_09','spine3_010','spine_02','spine_03'].map(n=>m.getObjectByName(n)).filter(Boolean).slice(0,2);if(!IK.legs.length)return;}
  if(!IK.legs.length)return;
  const want=player.mode==='walk'&&!player.air&&!swim&&!player.uw&&!player.climb?1:0;IK.w=lerp(IK.w,want,1-Math.exp(-dt*10));
  hero.root.updateMatrixWorld(true);
  if(IK.footH==null){if(!(hero.cur==='Idle_Loop'||hero.cur==='LOCO'&&(hero.idleW||0)>.95))return;IK.footH=Math.min(...IK.legs.map(l=>l.c.getWorldPosition(_ik.c).y-hero.root.position.y));} // ankle height above the sole, measured standing
  if(IK.w<.01){IK.drop=0;return;}
  const base=hero.root.position.y,offs=IK.legs.map(l=>{l.c.getWorldPosition(_ik.c);const g=TUBE.floorAt(_ik.c.x,_ik.c.z,base)??groundAt(_ik.c.x,_ik.c.z);l.g=g;l.n=tnorm(_ik.c.x,_ik.c.z);return clamp(g-base,-.6,.5);});
  const drop=Math.min(0,...offs);IK.drop=lerp(IK.drop,drop*IK.w,1-Math.exp(-dt*14));
  hero.root.position.y=base+IK.drop;hero.root.updateMatrixWorld(true);
  IK.legs.forEach((l,i)=>{const H=l.a.getWorldPosition(_ik.a),K=l.b.getWorldPosition(_ik.b),A=l.c.getWorldPosition(_ik.c);
    const footQ=l.c.getWorldQuaternion(new THREE.Quaternion());
    const lift=Math.max(0,A.y-(base+IK.drop)-IK.footH),T=_ik.t.set(A.x,l.g+IK.footH+lift,A.z);                 // keep the stride's own lift above the local ground
    T.y=lerp(A.y,T.y,IK.w);
    const l1=H.distanceTo(K),l2=K.distanceTo(A),dT=clamp(H.distanceTo(T),Math.abs(l1-l2)+1e-3,(l1+l2)*.999);
    const u=_ik.u.subVectors(H,K),v=_ik.v.subVectors(A,K),cur=u.angleTo(v),des=Math.acos(clamp((l1*l1+l2*l2-dT*dT)/(2*l1*l2),-1,1));
    const ax=_ik.ax.crossVectors(u,v);if(ax.lengthSq()<1e-8)ax.set(1,0,0).applyQuaternion(hero.root.quaternion);ax.normalize();
    boneTurnWorld(l.b,_ik.q.setFromAxisAngle(ax,des-cur));                                                 // bend the knee
    l.c.getWorldPosition(A);boneTurnWorld(l.a,_ik.q.setFromUnitVectors(_ik.u.subVectors(A,H).normalize(),_ik.v.subVectors(T,H).normalize())); // swing the leg to the target
    const tilt=_ik.q.setFromUnitVectors(_ik.up,l.n);tilt.slerp(_ik.q3.identity(),1-IK.w*.8*(1-Math.min(1,lift*8)));   // the foot lies on the slope while it is down
    const pq=l.c.parent.getWorldQuaternion(_ik.q2);l.c.quaternion.copy(pq.invert().multiply(tilt.multiply(footQ)));l.c.updateMatrixWorld(true);});
  // stood still, the chest turns toward where you look (up to about 45°)
  let d=player.yaw-hero.bodyYaw;d=Math.atan2(Math.sin(d),Math.cos(d));const look=player.mode==='walk'&&thirdView()&&(hero.spd||0)<.15?clamp(d,-.8,.8):0;
  IK.look=lerp(IK.look,look,1-Math.exp(-dt*4));if(Math.abs(IK.look)>.01)for(const b of IK.spine)boneTurnWorld(b,_ik.q.setFromAxisAngle(_ik.up,IK.look/IK.spine.length));
  heroPosture(dt,swim);
}
// posture: lean into a climb and sit back going down; shift the weight now and then while standing; carry what you hold, and
// put the hand on what you reach for
const _ar={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),t:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),ax:new THREE.Vector3(),q:new THREE.Quaternion()};
function heroPosture(dt,swim){
  if(!IK.arm){const m=hero.root,n=hero.scan?['right_shoulder_018','right_elbow_019','right_wrist_020']:['upperarm_r','lowerarm_r','hand_r'];IK.arm=n.map(x=>m.getObjectByName(x));if(IK.arm.some(b=>!b))IK.arm=[];}
  const fx=-Math.sin(hero.bodyYaw),fz=-Math.cos(hero.bodyYaw),rx=-fz,rz=fx,onFoot=player.mode==='walk'&&!player.air&&!swim&&!player.uw;
  const g=onFoot?(heightAt(player.x+fx*.6,player.z+fz*.6)-heightAt(player.x-fx*.6,player.z-fz*.6))/1.2:0;
  IK.slope=lerp(IK.slope||0,clamp(g>0?g*.42:g*.22,-.12,.3)*smooth(.1,1.2,hero.spd||0),1-Math.exp(-dt*5));        // uphill: chest forward; downhill: sit back a little
  const sway=onFoot&&(hero.idleW||0)>.5?Math.sin(performance.now()/1000*.42)*.035*(hero.idleW||0):0;               // weight from foot to foot, slowly
  if(IK.spine.length&&(Math.abs(IK.slope)>.002||Math.abs(sway)>.002)){const ax=_ar.ax.set(rx,0,rz);for(const b of IK.spine)boneTurnWorld(b,_ar.q.setFromAxisAngle(ax,-IK.slope/IK.spine.length));
    boneTurnWorld(IK.spine[0],_ar.q.setFromAxisAngle(_ar.u.set(fx,0,fz),sway));}
  if(IK.arm.length!==3)return;
  // where the right hand should be: on the thing you reach for, or holding what you carry in front of you
  let w=0;const T=_ar.t,base=hero.root.position;
  if(hero.reach&&hero.reach.t<hero.reach.dur){const k=hero.reach.t/hero.reach.dur;w=Math.sin(Math.PI*clamp((k-.15)/.6,0,1));T.copy(hero.reach.p);}
  else if(held&&onFoot&&held.kind!=='uke'){const lo=held.kind==='lantern';w=.85;T.set(base.x+fx*(lo?.18:.3)+rx*(lo?.26:.16),base.y+(lo?.82:1.12),base.z+fz*(lo?.18:.3)+rz*(lo?.26:.16));}
  IK.armW=lerp(IK.armW||0,w,1-Math.exp(-dt*12));if(IK.armW<.01)return;
  if(hero.reach&&hero.reach.t<hero.reach.dur&&IK.spine.length){const dy=hero.reach.p.y-base.y;                    // low down: bend the back toward it, as well as the knees
    const bend=IK.armW*clamp((1.1-dy)*.6,0,.85);if(bend>.01)for(const b of IK.spine)boneTurnWorld(b,_ar.q.setFromAxisAngle(_ar.ax.set(rx,0,rz),bend/IK.spine.length));   // + about his right: forward
    if(dy<.45)T.y+=.05;                                                                       // fingers close a little above what lies on the ground
    // still out of reach (something low and a little away): lean further over it, only as far as it takes
    const [S0,E0,H0]=IK.arm,L=S0.getWorldPosition(_ar.a).distanceTo(E0.getWorldPosition(_ar.b))+E0.getWorldPosition(_ar.b).distanceTo(H0.getWorldPosition(_ar.c));
    for(let it=0,extra=0;dy<.6&&it<4&&extra<.8;it++){const need=S0.getWorldPosition(_ar.a).distanceTo(T)-L*.96;if(need<=.01)break;
      const more=Math.min(.8-extra,need/.3)*IK.armW;extra+=more;const hip=IK.hip||(IK.hip=hero.model.getObjectByName('spine1_08')||IK.spine[0]);   // a hinge at the hips first, as people bend
      boneTurnWorld(hip,_ar.q.setFromAxisAngle(_ar.ax.set(rx,0,rz),more*.65));for(const b of IK.spine)boneTurnWorld(b,_ar.q.setFromAxisAngle(_ar.ax.set(rx,0,rz),more*.35/IK.spine.length));}}
  const [S,E,H]=IK.arm,A=S.getWorldPosition(_ar.a),B=E.getWorldPosition(_ar.b),C=H.getWorldPosition(_ar.c);
  T.lerpVectors(C,T,IK.armW);const l1=A.distanceTo(B),l2=B.distanceTo(C),dT=clamp(A.distanceTo(T),Math.abs(l1-l2)+1e-3,(l1+l2)*.995);
  const u=_ar.u.subVectors(A,B),v=_ar.v.subVectors(C,B),cur=u.angleTo(v),des=Math.acos(clamp((l1*l1+l2*l2-dT*dT)/(2*l1*l2),-1,1));
  const ax=_ar.ax.crossVectors(u,v);if(ax.lengthSq()<1e-8)ax.set(0,1,0);ax.normalize();boneTurnWorld(E,_ar.q.setFromAxisAngle(ax,des-cur));    // bend the elbow
  H.getWorldPosition(C);boneTurnWorld(S,_ar.q.setFromUnitVectors(_ar.u.subVectors(C,A).normalize(),_ar.v.subVectors(T,A).normalize()));      // swing the arm to it
}
