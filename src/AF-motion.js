/* ───────── motion made in code: the moves between the clips ─────────
   The islander's scan comes with idle, walk, jog and a few one-off clips. Everything in between is made here, in code, as layers
   laid over the clips each frame on the body's own axes (forward, right, up), the way procedural animation does it
   (springs and envelopes driven by what the body is doing: speed, acceleration, turn rate), after Overgrowth's approach:
   - setting off: a drive forward from the hips, as the first steps push;
   - stopping from a run: the feet plant, the body leans back against its own momentum, the arms swing on forward;
   - a sharp turn while moving: the chest leads into the turn and the body dips;
   - standing a while: he looks round, rolls his shoulders, glances down at his feet, shifts his weight, now one, now another;
   - out of breath (strength low): heavy breathing, the head down;
   - long or heavy things (logs, planks, bamboo, fronds, crates): carried across the body in both hands at chest height,
     leaning back a little under the load. */
const MOT={stopT:0,startT:0,pivT:0,pivDir:1,idleT:0,v:null,vT:0,vDur:0,nextV:7,peak:0,low:0,prevSpd:0,prevYaw:null,carry:0};
const HEAVY=k=>!!k&&!!K[k]&&(K[k].hs!=null||['crate','barrel','raft','trough','log','plank','bamboo','frond'].includes(k));
const _mo={q:new THREE.Quaternion(),a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),t:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),x:new THREE.Vector3()};
function armTo(S,E,H,T,w){if(!S||!E||!H||w<.01)return;const A=S.getWorldPosition(_mo.a),B=E.getWorldPosition(_mo.b),C=H.getWorldPosition(_mo.c);   // a two-bone reach, as for the right arm
  _mo.t.lerpVectors(C,T,w);const l1=A.distanceTo(B),l2=B.distanceTo(C),dT=clamp(A.distanceTo(_mo.t),Math.abs(l1-l2)+1e-3,(l1+l2)*.995);
  const u=_mo.u.subVectors(A,B),v=_mo.v.subVectors(C,B),cur=u.angleTo(v),des=Math.acos(clamp((l1*l1+l2*l2-dT*dT)/(2*l1*l2),-1,1));
  const ax=_mo.x.crossVectors(u,v);if(ax.lengthSq()<1e-8)ax.set(0,1,0);ax.normalize();boneTurnWorld(E,_mo.q.setFromAxisAngle(ax,des-cur));
  H.getWorldPosition(C);boneTurnWorld(S,_mo.q.setFromUnitVectors(_mo.u.subVectors(C,A).normalize(),_mo.v.subVectors(_mo.t,A).normalize()));}
function heroMotion(dt,swim){
  if(!hero.ready||!hero.model||!IK.spine||!IK.spine.length)return;const M=hero.model,by=hero.bodyYaw;
  const B=MOT.bones||(MOT.bones={hip:M.getObjectByName('spine1_08'),neck:M.getObjectByName('neck_011'),head:M.getObjectByName('head_012'),chest:M.getObjectByName('spine3_010'),
    sL:M.getObjectByName('left_shoulder_014'),eL:M.getObjectByName('left_elbow_015'),hL:M.getObjectByName('left_wrist_016'),
    sR:M.getObjectByName('right_shoulder_018'),eR:M.getObjectByName('right_elbow_019'),hR:M.getObjectByName('right_wrist_020')});
  const onFoot=player.mode==='walk'&&!player.air&&!swim&&!player.uw&&!RAG.on,spd=hero.spd||0;
  const fx=-Math.sin(by),fz=-Math.cos(by),R=_mo.a.set(-fz,0,fx).clone(),F=new THREE.Vector3(fx,0,fz),UP=new THREE.Vector3(0,1,0);
  const acc=(spd-MOT.prevSpd)/Math.max(dt,1e-3);MOT.prevSpd=spd;let yr=by-(MOT.prevYaw??by);yr=Math.atan2(Math.sin(yr),Math.cos(yr));MOT.prevYaw=by;const w=yr/Math.max(dt,1e-3);
  // what the body is doing starts each move
  MOT.peak=Math.max(spd,MOT.peak*Math.exp(-dt*.6));MOT.low=spd<.3?MOT.low+dt:0;
  if(onFoot&&MOT.stopT<=0&&MOT.peak>1.8&&spd<1.5&&acc<-1.5){MOT.stopT=.6;MOT.peak=0;}
  if(onFoot&&MOT.startT<=0&&acc>3.5&&spd>.6&&spd<1.6&&MOT.lowWas>.4){MOT.startT=.5;}MOT.lowWas=spd<.3?MOT.low:MOT.lowWas*(spd>1.6?0:1);
  if(onFoot&&MOT.pivT<=0&&spd>1.3&&Math.abs(w)>3.2){MOT.pivT=.45;MOT.pivDir=Math.sign(w);}
  const env=(t,T)=>t>0?Math.sin(Math.PI*(1-t/T)):0;
  const eS=env(MOT.stopT,.6),eA=env(MOT.startT,.5),eP=env(MOT.pivT,.45);MOT.stopT=Math.max(0,MOT.stopT-dt);MOT.startT=Math.max(0,MOT.startT-dt);MOT.pivT=Math.max(0,MOT.pivT-dt);
  const turnW=(b,axis,a)=>{if(b&&Math.abs(a)>1e-4)boneTurnWorld(b,_mo.q.setFromAxisAngle(axis,a));};
  // the trunk: lean forward setting off, back stopping; twist and dip into a pivot (+ about his right is forward)
  const lean=.2*eA-.22*eS+.06*eP,twist=.38*eP*MOT.pivDir;
  if(lean)turnW(B.hip,R,lean*.6),IK.spine.forEach(b=>turnW(b,R,lean*.4/IK.spine.length));
  if(twist)IK.spine.forEach(b=>turnW(b,UP,twist/IK.spine.length)),turnW(B.hip,F,-.1*eP*MOT.pivDir);
  if(eS>.01){turnW(B.sL,R,.45*eS);turnW(B.sR,R,.45*eS);turnW(B.head,R,-.12*eS);}                 // arms swing on as the feet stop; the head stays level
  // standing a while: a few things people do
  const still=onFoot&&spd<.1&&!(hero.reach&&hero.reach.t<hero.reach.dur)&&!held&&(hero.shotT||0)<=0&&hero.cur==='LOCO';
  MOT.idleT=still?MOT.idleT+dt:0;
  if(!MOT.v&&MOT.idleT>MOT.nextV){const V=['look','roll','down','shift','look'];MOT.v=V[Math.floor(Math.random()*V.length)];MOT.vT=0;MOT.vDur={look:3.4,roll:2.2,down:1.8,shift:3.2}[MOT.v];}
  if(MOT.v){MOT.vT+=dt;const k=Math.sin(Math.PI*clamp(MOT.vT/MOT.vDur,0,1))*(still?1:0),p=MOT.vT/MOT.vDur;
    if(MOT.v==='look'){const a=Math.sin(p*Math.PI*2)*.75*k;turnW(B.neck,UP,a*.4);turnW(B.head,UP,a*.6);}
    else if(MOT.v==='roll'){const a=Math.sin(p*Math.PI*2);turnW(B.sL,F,.18*k*a);turnW(B.sR,F,-.18*k*a);turnW(B.sL,R,-.12*k);turnW(B.sR,R,-.12*k);turnW(B.chest,R,-.06*k);}
    else if(MOT.v==='down'){turnW(B.neck,R,.35*k);turnW(B.head,R,.2*k);}
    else if(MOT.v==='shift'){turnW(B.hip,F,.07*k);turnW(B.chest,F,-.05*k);}
    if(MOT.vT>=MOT.vDur||!still){MOT.v=null;MOT.idleT=0;MOT.nextV=6+Math.random()*9;}}
  // out of breath
  const tired=onFoot?clamp(1-STAM.v/STAM.max*2.4,0,1):0;MOT.tired=lerp(MOT.tired||0,tired,1-Math.exp(-dt*1.5));
  if(MOT.tired>.02){const br=Math.sin(performance.now()/1000*3.4)*.05*MOT.tired;turnW(B.chest,R,br);turnW(B.neck,R,.18*MOT.tired);}
  // carrying something long or heavy: both hands at chest height, leaning back under it
  const k=held?null:selKind(),heavy=onFoot&&HEAVY(k)&&thirdView();MOT.carry=lerp(MOT.carry,heavy?1:0,1-Math.exp(-dt*7));
  if(MOT.carry>.01){const base=hero.root.position,c=MOT.carry;IK.spine.forEach(b=>turnW(b,R,-.07*c/IK.spine.length));
    const hy=base.y+1.06,Tr=new THREE.Vector3(base.x+fx*.32-fz*.2,hy,base.z+fz*.32+fx*.2),Tl=new THREE.Vector3(base.x+fx*.32+fz*.2,hy,base.z+fz*.32-fx*.2);
    armTo(B.sR,B.eR,B.hR,Tr,c);armTo(B.sL,B.eL,B.hL,Tl,c);
    if(handG.parent===hero.socket){if(MOT.hs0==null)MOT.hs0=handG.scale.x;handG.position.set(-.2*c,-.04,.05);handG.rotation.set(0,0,0);handG.scale.setScalar(lerp(MOT.hs0,1,c));}}   // a load is shown at its full size
  else if(handG.parent===hero.socket&&MOT.hs0!=null){handG.position.set(0,-.03,.05);handG.scale.setScalar(MOT.hs0);MOT.hs0=null;}
}
