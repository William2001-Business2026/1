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
  hero.hand=model.getObjectByName(hero.scan?'right_wrist_020':'hand_r');hero.px=player.x;hero.pz=player.z;hero.ready=true;heroPlay('Idle_Loop',0);applyView();
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
function heroPlay(name,fade=.22){if(hero.cur===name)return;const a=hero.acts[name];if(!a)return;const p=hero.acts[hero.cur];
  a.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(p&&fade>0)a.crossFadeFrom(p,fade,false);else if(p)p.stop();hero.cur=name;}
function heroOneShot(name){if(!heroShown()||!hero.acts[name])return;hero.shot=name;hero.shotT=hero.acts[name].getClip().duration*.8;}
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
  const show=heroShown()&&player.zoom<.4;hero.root.visible=hero.socket.visible=show;if(!show)return;
  const hfw=freshAt(player.x,player.z),deep=Math.max(0,(hfw!=null?hfw:0)-heightAt(player.x,player.z)),swim=player.uw||deep>1.05&&!player.air;
  hero.root.position.set(player.x,player.uw?player.y+.1:swim?(hfw!=null?hfw:water.position.y)-1.15:player.y,player.z);
  const k=1/Math.max(dt,1e-3),vx=(player.x-hero.px)*k,vz=(player.z-hero.pz)*k;hero.px=player.x;hero.pz=player.z;
  if(Math.hypot(vx,vz)>.15){const want=Math.atan2(-vx,-vz);let d=want-hero.bodyYaw;d=Math.atan2(Math.sin(d),Math.cos(d));hero.bodyYaw+=d*Math.min(1,dt*10);}
  hero.root.rotation.order='YXZ';hero.root.rotation.y=hero.bodyYaw;hero.root.rotation.x=player.uw?lerp(hero.root.rotation.x,player.pitch*.85*smooth(.2,1,moving),Math.min(1,dt*3)):0; // dive head-first
  if(hero.wasAir&&!player.air)hero.landT=.28;hero.wasAir=player.air;hero.landT=Math.max(0,hero.landT-dt);hero.shotT=Math.max(0,hero.shotT-dt);
  let want='Idle_Loop',ts=1;
  if(swim)want=moving>.3?'Swim_Fwd_Loop':'Swim_Idle_Loop';
  else if(player.air)want=player.vy>.8?'Jump_Start':'Jump_Loop';
  else if(hero.landT>0)want='Jump_Land';
  else if(moving>2.3){want='Jog_Fwd_Loop';ts=clamp(moving/3.4,.7,1.3);}
  else if(moving>.2){want='Walk_Loop';ts=clamp(moving/1.45,.6,1.5);}
  else if(hero.shotT>0)want=hero.shot;
  else if(held&&held.kind==='lantern')want='Idle_Torch_Loop';
  heroPlay(want,player.air||hero.landT>0?.12:.25);
  if(/Walk_Loop|Jog_Fwd/.test(hero.cur))hero.acts[hero.cur].setEffectiveTimeScale(ts); // feet match the ground speed
  hero.mixer.update(dt);
  if(hero.malo){const sp=Math.min(1,moving/3),sw=Math.sin(performance.now()/1000*7.5)*.25*sp;hero.malo.front.rotation.x=-sw-.15*sp;hero.malo.back.rotation.x=sw+.12*sp;}
  // the hand socket follows the right hand but stays upright, so a full cup or a lantern does not tip
  hero.root.updateMatrixWorld(true);hero.hand.getWorldPosition(hero.socket.position);hero.socket.rotation.set(0,hero.bodyYaw,0);
}
function refreshHand(){handDirty=false;const k=held?null:selKind();if(k===handKind)return;handKind=k;handG.clear();if(!k)return;
  const m=K[k].mk();m.scale.multiplyScalar(K[k].hs||1);m.traverse(o=>{o.castShadow=false;});handG.add(m);}
function cycleSel(d){if(held)return;const n=W.inv.length;if(!n){W.sel=-1;return;}W.sel=((W.sel+1+d)%(n+1)+(n+1))%(n+1)-1;handDirty=true;build.on=false;}
function sysDrop(){const k=selKind();if(!k)return;const fx=player.x-Math.sin(player.yaw)*.9,fz=player.z-Math.cos(player.yaw)*.9;
  if(groundAt(fx,fz)<.02&&k!=='fishtrap'){return;}
  const n=keys.ShiftLeft?W.inv[W.sel].n:1;takeFrom(k,n);const before=W.items.length,it=spawn(k,fx,fz,n);SFX.step(surfaceAt(fx,fz),.6);
  if(W.items.length>before&&!K[k].place){it.g.position.set(fx,player.y+1,fz); // let go from the hand: it falls, tumbles and comes to rest
    physDrop(it.g,{vel:{x:-Math.sin(player.yaw)*.7,y:.4,z:-Math.cos(player.yaw)*.7},float:FLOATS.has(k),onRest:g=>{it.x=g.position.x;it.z=g.position.z;
      const top=g.position.y-groundAt(it.x,it.z);it.y=top>.06?g.position.y:null;}});}}

