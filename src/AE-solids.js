/* ───────── solid things: a fitted skin on everything you can bump into ─────────
   Each solid object gets a collision shape that follows its own surface: the convex hull of its vertices, the tightest
   convex skin round it (Rapier's convexHull). Built posts and walls, the lānai's posts, rails and furniture, and the boulders
   all have one. Things you drop or throw land on them and roll off them instead of passing through, and you, moved by
   Rapier's character controller (a capsule that slides along what it meets), walk round them and along them instead of into
   them. Walkable surfaces (the deck, floors, a raft) are left out: their height carries you, so you can step up onto them.
   Moving things (animals, things in flight) use their own physics. */
const SOLID=(()=>{
  const V3=THREE.Vector3,bodies=new Map(),handles=new Set();let cc=null;
  // the points of an object's surface, in its own frame (position and turn removed, scale kept), at most ~360 of them
  function pointsOf(obj,skip){obj.updateMatrixWorld(true);const inv=new THREE.Matrix4().compose(obj.getWorldPosition(new V3()),obj.getWorldQuaternion(new THREE.Quaternion()),new V3(1,1,1)).invert();
    const out=[],v=new V3(),m=new THREE.Matrix4();obj.traverse(o=>{if(!o.isMesh||o.material===proxyMat||(skip&&skip(o))||!o.geometry||!o.geometry.attributes.position)return;const p=o.geometry.attributes.position;
      m.multiplyMatrices(inv,o.matrixWorld);const st=Math.max(1,Math.floor(p.count/360));for(let i=0;i<p.count;i+=st){v.fromBufferAttribute(p,i).applyMatrix4(m);out.push(v.x,v.y,v.z);}});
    return new Float32Array(out);}
  function descFor(pts){const R=PHYS.R;let d=pts.length>=12?R.ColliderDesc.convexHull(pts):null;
    if(!d){const b=new THREE.Box3();for(let i=0;i<pts.length;i+=3)b.expandByPoint(new V3(pts[i],pts[i+1],pts[i+2]));if(b.isEmpty())return null;const s=b.getSize(new V3()),c=b.getCenter(new V3());
      d=R.ColliderDesc.cuboid(Math.max(s.x/2,.02),Math.max(s.y/2,.02),Math.max(s.z/2,.02)).setTranslation(c.x,c.y,c.z);}return d.setFriction(.8);}
  // a fixed body with a fitted skin; blocks: whether you walk round it too
  function add(obj,{blocks=true,skip=null,pts=null}={}){if(!PHYS.ready)return null;remove(obj);const R=PHYS.R,w=PHYS.world,d=descFor(pts||pointsOf(obj,skip));if(!d)return null;
    const p=obj.getWorldPosition(new V3()),q=obj.getWorldQuaternion(new THREE.Quaternion());
    const body=w.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(p.x,p.y,p.z).setRotation({x:q.x,y:q.y,z:q.z,w:q.w})),col=w.createCollider(d,body);
    bodies.set(obj,{body,col,blocks});if(blocks)handles.add(col.handle);return body;}
  function remove(obj){const b=bodies.get(obj);if(!b)return;handles.delete(b.col.handle);if(PHYS.world)PHYS.world.removeRigidBody(b.body);bodies.delete(obj);}
  // each part of a group that stands up (posts, rails, furniture) gets its own skin; flat parts (deck boards, mats) do not
  function addParts(group,minH=.25){group.updateMatrixWorld(true);const b=new THREE.Box3(),s=new V3();let n=0;
    group.traverse(o=>{if(!o.isMesh||o.material===proxyMat||o.isInstancedMesh)return;b.setFromObject(o);b.getSize(s);if(s.y<minH||s.y<.12)return;add(o);n++;});return n;}
  // boulders: one skin per instance, from the shared shape scaled and turned as that instance is
  function addInstances(im,blocks=true){const R=PHYS.R,w=PHYS.world,src=im.geometry.attributes.position,st=Math.max(1,Math.floor(src.count/240)),M=new THREE.Matrix4(),P=new V3(),Q=new THREE.Quaternion(),S=new V3(),v=new V3();
    for(let i=0;i<im.count;i++){im.getMatrixAt(i,M);M.decompose(P,Q,S);const pts=[];for(let k=0;k<src.count;k+=st){v.fromBufferAttribute(src,k).multiply(S);pts.push(v.x,v.y,v.z);}
      const d=descFor(new Float32Array(pts));if(!d)continue;const body=w.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(P.x,P.y,P.z).setRotation({x:Q.x,y:Q.y,z:Q.z,w:Q.w})),col=w.createCollider(d,body);
      if(blocks)handles.add(col.handle);}}
  // you: a capsule that slides along the skins (ground and walkable surfaces are not tested: their height carries you)
  function move(x,y,z,dx,dz){if(!PHYS.ready||!PHYS.me||(!dx&&!dz)||!handles.size)return{x:x+dx,z:z+dz};const R=PHYS.R,w=PHYS.world;
    if(!cc){cc=w.createCharacterController(.02);cc.setSlideEnabled(true);cc.setUp({x:0,y:1,z:0});}
    PHYS.me.setTranslation({x,y:y+.95,z},false);const col=PHYS.me.collider(0);
    cc.computeColliderMovement(col,{x:dx,y:0,z:dz},R.QueryFilterFlags.EXCLUDE_DYNAMIC|R.QueryFilterFlags.EXCLUDE_SENSORS,undefined,c=>handles.has(c.handle));
    const m=cc.computedMovement();return{x:x+m.x,z:z+m.z,hit:Math.hypot(m.x-dx,m.z-dz)>1e-3};}
  // once the physics is up: the lānai's standing parts and the boulders
  let done=false;function tick(){if(done||!PHYS.ready)return;done=true;
    try{addParts(lanai);const t=scene.children.find(o=>o.userData&&o.userData.table);if(t)addParts(t,.2);for(const it of(typeof items!=='undefined'?items:[]))if(it.kind==='chair'||it.kind==='hammock')addParts(it.group,.2);
      if(scene.userData.rocks)addInstances(scene.userData.rocks);}catch(e){console.warn('Solid skins:',e);}}
  return{add,remove,addParts,move,tick,get count(){return bodies.size+handles.size;},points:pointsOf};
})();
