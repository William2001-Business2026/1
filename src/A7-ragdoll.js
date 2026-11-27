/* ───────── the ragdoll: a hard fall goes limp, the way open-world games do it ─────────
   When you are falling fast (from about 6 m), the islander's body is handed to the physics: eleven capsules (pelvis, torso, head,
   upper and lower arms, thighs, shins) sized from his own skeleton and linked at his joints, carrying your speed. They hit the
   ground and tumble down whatever is below; the bones follow the bodies. When he lies still he gets up, the pose blending back
   into the animation through a kneel. A long fall (over 25 m) knocks you out: you wake on the beach. Needs the scanned body. */
const RAG=(()=>{
  const SEGS=[ // name, bone, the bone it reaches to, radius, parent segment
    ['pelvis','pelvis_01','spine1_08',.13,null],['torso','spine1_08','neck_011',.15,'pelvis'],['head','neck_011','head_end_023',.1,'torso'],
    ['uarmL','left_shoulder_014','left_elbow_015',.05,'torso'],['farmL','left_elbow_015','left_wrist_016',.045,'uarmL'],
    ['uarmR','right_shoulder_018','right_elbow_019',.05,'torso'],['farmR','right_elbow_019','right_wrist_020',.045,'uarmR'],
    ['thighL','left_hip_02','left_knee_03',.07,'pelvis'],['shinL','left_knee_03','left_ankle_04',.055,'thighL'],
    ['thighR','right_hip_05','right_knee_06',.07,'pelvis'],['shinR','right_knee_06','right_ankle_07',.055,'thighR']];
  const V=THREE.Vector3,Q=THREE.Quaternion,Y=new V(0,1,0),RG=(0x0002<<16)|0xFFF9; // ragdoll: its own group; ignores itself and you
  const U=new V(0,1,0);
  let on=false,parts=[],joints=[],t=0,still=0,y0=0,blend=0,saved=null;
  const wp=o=>o.getWorldPosition(new V()),wq=o=>o.getWorldQuaternion(new Q());
  function start(){
    if(on||!PHYS.ready||!hero.ready||!hero.scan)return false;const R=PHYS.R,w=PHYS.world,M=hero.model;
    const gk=Math.floor(player.x/64)+','+Math.floor(player.z/64),gt=PHYS.ground.get(gk);if(!gt||!gt.col)return false; // only over ground the physics already has
    M.updateMatrixWorld(true);
    PHYS.me.collider(0).setCollisionGroups((0x0004<<16)|0xFFFF);
    const vel=player.mv||{x:0,z:0},by={};parts=[];
    for(const [nm,bn,tn,r,par] of SEGS){const b=M.getObjectByName(bn),e=M.getObjectByName(tn);if(!b||!e){parts=[];return false;}
      const A=wp(b),B=wp(e),dir=B.clone().sub(A),L=dir.length(),mid=A.clone().add(B).multiplyScalar(.5),q=new Q().setFromUnitVectors(Y,dir.normalize());
      const body=w.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(mid.x,mid.y,mid.z).setRotation({x:q.x,y:q.y,z:q.z,w:q.w})
        .setLinvel(vel.x,player.vy,vel.z).setAngvel({x:(Math.random()-.5)*3,y:(Math.random()-.5)*2,z:(Math.random()-.5)*3}).setLinearDamping(.05).setAngularDamping(1.2).setCcdEnabled(true));
      w.createCollider(R.ColliderDesc.capsule(Math.max(.02,L/2-r),r).setDensity(nm==='torso'||nm==='pelvis'?1100:900).setFriction(.9).setRestitution(.05).setCollisionGroups(RG),body);
      const off=q.clone().invert().multiply(wq(b)),offP=A.clone().sub(mid).applyQuaternion(q.clone().invert());
      const p={nm,bone:b,body,off,offP,par};parts.push(p);by[nm]=p;}
    rest(M,by);
    joints=[];for(const p of parts){if(!p.par)continue;const P=by[p.par],J=wp(p.bone),tp=P.body.translation(),rp=P.body.rotation(),tc=p.body.translation(),rc=p.body.rotation();
      const a1=J.clone().sub(new V(tp.x,tp.y,tp.z)).applyQuaternion(new Q(rp.x,rp.y,rp.z,rp.w).invert()),a2=J.clone().sub(new V(tc.x,tc.y,tc.z)).applyQuaternion(new Q(rc.x,rc.y,rc.z,rc.w).invert());
      joints.push(w.createImpulseJoint(R.JointData.spherical({x:a1.x,y:a1.y,z:a1.z},{x:a2.x,y:a2.y,z:a2.z}),P.body,p.body,true));}
    on=true;t=0;still=0;y0=player.y;blend=0;if(player.mv){player.mv.x=player.mv.z=0;}return true;}
  /* Joint limits. Rapier's ball joints let a knee fold backwards and an arm swing through the chest, so each frame every joint
     checks where its segment points in its parent's frame and, past what a body can do, turns the pair back toward the allowed
     range: a soft constraint on their relative spin. Knees and elbows are hinges that bend one way only, to about 150°; hips,
     shoulders, the spine and the neck each have a cone, tipped the way the body moves. */
  const _a=new V(),_b=new V(),_c=new V(),_n=new V(),_q=new Q(),_qp=new Q();
  function cone(l,c,ang,out){const d=l.dot(c);if(d>=Math.cos(ang))return out.copy(l);const pp=_c.copy(l).addScaledVector(c,-d);if(pp.lengthSq()<1e-8)pp.set(c.y,-c.x,c.z*0).normalize();else pp.normalize();
    return out.copy(c).multiplyScalar(Math.cos(ang)).addScaledVector(pp,Math.sin(ang));}
  function hinge(l,A,B,S,maxB,out){const lu=l.dot(A),lb=l.dot(B),ls=l.dot(S),th=Math.min(maxB,Math.max(-.06,Math.atan2(lb,lu)));
    return out.copy(A).multiplyScalar(Math.cos(th)).addScaledVector(B,Math.sin(th)).addScaledVector(S,Math.max(-.5,Math.min(.5,ls))).normalize();}   // a little give to the side, as a knee has
  function allowed(p,l,out){const A=p.A,F=p.Fr,S=p.Sr,side=p.nm.endsWith('L')?-1:1;
    switch(p.nm){
      case'shinL':case'shinR':return hinge(l,A,_a.copy(F).negate(),S,2.6,out);                                    // the knee folds back
      case'farmL':case'farmR':return hinge(l,A,F,S,2.5,out);                                                     // the elbow folds forward
      case'thighL':case'thighR':return cone(l,_a.copy(A).addScaledVector(F,.75).addScaledVector(S,side*.12).normalize(),1.4,out);  // forward a long way, back a little
      case'uarmL':case'uarmR':return cone(l,_a.copy(A).addScaledVector(F,.45).normalize(),1.75,out);
      case'head':return cone(l,_a.copy(A).addScaledVector(F,.25).normalize(),.95,out);
      case'torso':return cone(l,_a.copy(A).addScaledVector(F,.2).normalize(),.7,out);}
    return out.copy(l);}
  const _l=new V(),_t=new V(),_dc=new V(),_dt=new V();
  function limits(){
    for(const p of parts){if(!p.P)continue;const P=p.P,rc=p.body.rotation(),rp=P.body.rotation();_q.set(rc.x,rc.y,rc.z,rc.w);_qp.set(rp.x,rp.y,rp.z,rp.w);
      _dc.copy(U).applyQuaternion(_q);_l.copy(_dc).applyQuaternion(_qp.clone().invert());allowed(p,_l,_t);
      const ang=Math.acos(Math.max(-1,Math.min(1,_l.dot(_t))));if(ang<.02)continue;
      _dt.copy(_t).applyQuaternion(_qp);_n.crossVectors(_dc,_dt);if(_n.lengthSq()<1e-10)continue;_n.normalize();            // the turn that brings it back, in the world
      const wc=p.body.angvel(),wp_=P.body.angvel(),w=(wc.x-wp_.x)*_n.x+(wc.y-wp_.y)*_n.y+(wc.z-wp_.z)*_n.z,want=Math.min(30,ang/.05);
      if(ang>.1){const k=(ang-.06)*.6,qr=new Q().setFromAxisAngle(_n,k).multiply(_q);p.body.setRotation({x:qr.x,y:qr.y,z:qr.z,w:qr.w},true);}   // past the limit: turn it most of the way back now
      if(w>=want)continue;const dlt=want-w,mc=p.body.mass(),mp=P.body.mass(),kc=mp/(mc+mp),kp=mc/(mc+mp);
      p.body.setAngvel({x:wc.x+_n.x*dlt*kc,y:wc.y+_n.y*dlt*kc,z:wc.z+_n.z*dlt*kc},true);P.body.setAngvel({x:wp_.x-_n.x*dlt*kp,y:wp_.y-_n.y*dlt*kp,z:wp_.z-_n.z*dlt*kp},true);}}
  /* Each joint is judged against the body's rest pose (the skeleton's bind pose: standing, knees and elbows straight). For a joint,
     A is where the child segment points in its parent's frame at rest, F the way the body faces, S its right; the limits below
     are written in that basis, so "straight", "forward" and "out to the side" mean what they mean on a person. */
  function rest(M,by){let sm=null;M.traverse(o=>{if(o.isSkinnedMesh&&!sm&&o.skeleton.bones.includes(parts[0].bone))sm=o;});
    const bones=sm.skeleton.bones,inv=sm.skeleton.boneInverses,bind=b=>inv[bones.indexOf(b)].clone().invert(),P=new V(),Qr=new Q(),Sc=new V();
    const at=n=>{const m=bind(M.getObjectByName(n));return new V().setFromMatrixPosition(m);};
    const up=at('neck_011').sub(at('pelvis_01')).normalize(),Rt=at('right_shoulder_018').sub(at('left_shoulder_014')).normalize(),F0=new V().crossVectors(up,Rt).normalize();
    for(const p of parts){bind(p.bone).decompose(P,Qr,Sc);p.cap0=Qr.clone().normalize().multiply(p.off.clone().invert());}       // the segment's frame at rest
    for(const p of parts){if(!p.par)continue;const Pp=by[p.par],qi=Pp.cap0.clone().invert();p.P=Pp;
      const A=U.clone().applyQuaternion(p.cap0).applyQuaternion(qi).normalize(),F=F0.clone().applyQuaternion(qi);F.addScaledVector(A,-F.dot(A));
      if(F.lengthSq()<1e-4)F.set(1,0,0).addScaledVector(A,-A.x);p.A=A;p.Fr=F.normalize();p.Sr=new V().crossVectors(p.Fr,A).normalize();}}
  // bracing: each upper arm turns toward the ground in the direction of the fall (a soft drive on its spin, like a reflex)
  function brace(k){const pv=parts[0]&&parts[0].body.linvel();if(!pv)return;const T=new V(pv.x*.35,-1,pv.z*.35).normalize();
    for(const p of parts){if(p.nm!=='uarmL'&&p.nm!=='uarmR'&&p.nm!=='farmL'&&p.nm!=='farmR')continue;const r=p.body.rotation(),d=U.clone().applyQuaternion(new Q(r.x,r.y,r.z,r.w)),n=new V().crossVectors(d,T);
      const s=n.length();if(s<1e-4)continue;n.multiplyScalar(1/s);const ang=Math.acos(clamp(d.dot(T),-1,1)),w=p.body.angvel(),add=Math.min(12,ang/.18)*k;
      p.body.setAngvel({x:w.x+n.x*add,y:w.y+n.y*add,z:w.z+n.z*add},true);}}
  function stop(){const w=PHYS.world;for(const j of joints)w.removeImpulseJoint(j,true);for(const p of parts)w.removeRigidBody(p.body);joints=[];parts=[];on=false;
    PHYS.me.collider(0).setCollisionGroups(0xFFFFFFFF);}
  // the bones follow the bodies, parents first
  function pose(){const q=new Q(),pq=new Q(),pos=new V();
    for(const p of parts){const r=p.body.rotation(),tr=p.body.translation();q.set(r.x,r.y,r.z,r.w);const bw=q.clone().multiply(p.off),b=p.bone;
      b.parent.updateWorldMatrix(true,false);b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(bw));
      if(p.nm==='pelvis'){pos.copy(p.offP).applyQuaternion(q).add(new V(tr.x,tr.y,tr.z));b.position.copy(b.parent.worldToLocal(pos));}
      b.updateMatrixWorld(true);}}
  function update(dt){
    if(blend>0){blend=Math.max(0,blend-dt/.7);return;}
    if(!on)return;t+=dt;if(RAG.lim!==false)limits();if(t<.6)brace(1-t/.6);const pv=parts[0].body,tr=pv.translation(),v=pv.linvel();
    player.x=tr.x;player.z=tr.z;player.y=Math.max(groundAt(tr.x,tr.z),tr.y-.9);player.air=false;player.vy=0;      // the camera and the world follow him
    if(tr.y<groundAt(tr.x,tr.z)-1.5){y0=Math.max(y0,tr.y);getUp();return;}                                       // slipped through the ground (no physics tile yet): stand him up there
    const sp=parts.reduce((s,p)=>{const l=p.body.linvel();return s+Math.hypot(l.x,l.y,l.z);},0)/parts.length;still=sp<.35?still+dt:0;
    if(still>1.1||t>14){const fell=y0-tr.y;
      if(fell>25){stop();$('fade').classList.add('on');toast('You fell a long way. You wake on the beach, sore all over.',6);
        setTimeout(()=>{player.x=START.x;player.z=START.z;player.y=groundAt(START.x,START.z);player.yaw=START.yaw;hero.bodyYaw=START.yaw;$('fade').classList.remove('on');},1800);return;}
      getUp();}}
  function getUp(){ // keep the lying pose for the blend, face the way the torso points, and kneel before standing
    const M=hero.model;M.updateMatrixWorld(true);const pel=M.getObjectByName('pelvis_01'),pw=pel.matrixWorld.clone();
    saved=new Map();M.traverse(o=>{if(o.isBone)saved.set(o,o.quaternion.clone());});
    const torso=parts.find(p=>p.nm==='torso'),r=torso.body.rotation(),f=new V(0,0,1).applyQuaternion(new Q(r.x,r.y,r.z,r.w));
    stop();hero.bodyYaw=Math.atan2(-f.x,-f.z);hero.root.rotation.set(0,hero.bodyYaw,0);hero.root.position.set(player.x,player.y,player.z);hero.root.updateMatrixWorld(true);
    pel.parent.updateWorldMatrix(true,false);const lm=pel.parent.matrixWorld.clone().invert().multiply(pw);saved.pelvisPos=new V().setFromMatrixPosition(lm);
    blend=1;hero.shot=hero.acts.LayToIdle?'LayToIdle':'Fixing_Kneeling';hero.shotT=hero.acts.LayToIdle?hero.acts.LayToIdle.getClip().duration*.9:1.4;SFX.cloth&&SFX.cloth();}
  // after the animation: ease from the lying pose into it
  function blendPose(){if(blend<=0||!saved)return;const k=blend*blend*(3-2*blend);
    for(const [b,q] of saved)b.quaternion.slerp(q,k);const pel=hero.model.getObjectByName('pelvis_01');if(pel&&saved.pelvisPos)pel.position.lerp(saved.pelvisPos,k);hero.model.updateMatrixWorld(true);}
  return{start,update,pose,blendPose,limits,get parts(){return parts;},allowed,get on(){return on;},get blending(){return blend>0;}};
})();
