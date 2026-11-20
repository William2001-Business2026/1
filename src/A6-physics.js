/* ───────── physics: Rapier (Apache-2.0, vendor/rapier) ─────────
   Things you let go of or throw become rigid bodies until they come to rest: they fall, bounce, tumble, roll downhill,
   float (coconuts, wood, fronds) or sink, and your body pushes them as you walk. Once still, the body is removed and the
   object stays exactly where it stopped, so a quiet island costs nothing. Built structures keep their own support rules.
   Physics loads in the background; until it is ready, things are placed the old way. */
import(new URL('vendor/rapier/rapier.mjs',document.baseURI).href).then(async mod=>{
  const R=mod.default||mod;await R.init();PHYS.R=R;const w=PHYS.world=new R.World({x:0,y:-9.81,z:0});
  // the island's surface as a triangle mesh out to 170 m, on the terrain's own 1.25 m grid
  const st=SIZE/SEG,c0=Math.round(SEG/2-170/st),N=Math.round(340/st),v=new Float32Array((N+1)*(N+1)*3),ix=new Uint32Array(N*N*6);let p=0,q=0;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const I=c0+i,J=c0+j;v[p++]=I*st-SIZE/2;v[p++]=TERR[J*(SEG+1)+I];v[p++]=J*st-SIZE/2;}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ix[q++]=a;ix[q++]=b;ix[q++]=a+1;ix[q++]=a+1;ix[q++]=b;ix[q++]=b+1;}
  w.createCollider(R.ColliderDesc.trimesh(v,ix).setFriction(.8));
  w.createCollider(R.ColliderDesc.cuboid(LANAI.w/2,.03,LANAI.d/2).setTranslation(LANAI.x,DECK_Y-.03,LANAI.z).setFriction(.6)); // deck
  w.createCollider(R.ColliderDesc.cylinder(.02,.36).setTranslation(TABLE.x,TABLE.y+TABLE_TOP-.02,TABLE.z));                      // table top
  for(const pm of palms){const lx=pm.crown.x-pm.x,lz=pm.crown.z-pm.z;                                                          // leaning trunks
    for(let t=0;t<=1.001;t+=.2){const k=Math.pow(t,1.8);w.createCollider(R.ColliderDesc.ball(.22).setTranslation(pm.x+lx*k,pm.y-.15+t*pm.H,pm.z+lz*k));}}
  const rk=scene.userData.rocks,M=new THREE.Matrix4(),P=new THREE.Vector3(),Q=new THREE.Quaternion(),Sc=new THREE.Vector3();
  if(rk)for(let i=0;i<rk.count;i++){rk.getMatrixAt(i,M);M.decompose(P,Q,Sc);w.createCollider(R.ColliderDesc.ball(.75*Math.min(Sc.x,Sc.y,Sc.z)).setTranslation(P.x,P.y,P.z));}
  PHYS.me=w.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(player.x,player.y+.85,player.z));         // you
  w.createCollider(R.ColliderDesc.capsule(.55,.3),PHYS.me);
  PHYS.ready=true;rebuildPhysPieces();
}).catch(e=>console.warn('Physics did not start, so things are placed without it:',e));
function rebuildPhysPieces(){
  if(!PHYS.ready)return;const R=PHYS.R,w=PHYS.world;for(const c of PHYS.pieceCols)w.removeCollider(c,false);PHYS.pieceCols=[];
  for(const p of W.pieces)if(p.f==='floor'){const a=p.r*Math.PI/4;PHYS.pieceCols.push(w.createCollider(R.ColliderDesc.cuboid(.56,.03,.31).setTranslation(p.x,p.y,p.z).setRotation({x:0,y:Math.sin(a/2),z:0,w:Math.cos(a/2)})));}
  for(const c of pieceCols)PHYS.pieceCols.push(w.createCollider(R.ColliderDesc.cylinder(.6,c.r).setTranslation(c.x,groundAt(c.x,c.z)+.6,c.z)));
}
{const orig=rebuildCols;rebuildCols=function(...a){const r=orig.apply(this,a);rebuildPhysPieces();return r;};}
function physDrop(g,{vel,ball=0,float=false,onRest}={}){
  if(!PHYS.ready)return false;physForget(g);const R=PHYS.R,w=PHYS.world;
  const box=localBox(g,new Set()),sz=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());if(box.isEmpty())return false;
  const rnd=()=>(Math.random()-.5)*4,body=w.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(g.position.x,g.position.y,g.position.z)
    .setRotation({x:g.quaternion.x,y:g.quaternion.y,z:g.quaternion.z,w:g.quaternion.w}).setLinvel(vel?.x||0,vel?.y||0,vel?.z||0)
    .setAngvel({x:rnd(),y:rnd(),z:rnd()}).setCcdEnabled(true));
  const d=(ball?R.ColliderDesc.ball(ball):R.ColliderDesc.cuboid(Math.max(sz.x/2,.015),Math.max(sz.y/2,.015),Math.max(sz.z/2,.015))).setTranslation(c.x,c.y,c.z)
    .setDensity(float?450:1600).setFriction(.75).setRestitution(ball?.35:.12);
  w.createCollider(d,body);PHYS.bodies.set(g,{body,float,onRest,ball:!!ball,t:0,still:0,vy:0,wet:false});return true;
}
function physForget(g){const b=PHYS.bodies.get(g);if(b){PHYS.world.removeRigidBody(b.body);PHYS.bodies.delete(g);}}
function physStep(dt){
  if(!PHYS.ready||!PHYS.bodies.size)return;const sea=water.position.y;
  PHYS.me.setNextKinematicTranslation({x:player.x,y:player.y+.85,z:player.z});
  PHYS.acc=Math.min(PHYS.acc+dt,.1);
  while(PHYS.acc>=1/60){PHYS.acc-=1/60;
    for(const b of PHYS.bodies.values()){const t=b.body.translation(),depth=sea-t.y;b.body.resetForces(true);
      if(depth>-.05){const m=b.body.mass();if(b.float)b.body.addForce({x:0,y:m*9.81*1.5*clamp((depth+.05)/.15,0,1),z:0},true); // buoyancy
        b.body.setLinearDamping(b.float?2.2:3.5);b.body.setAngularDamping(2);}else{b.body.setLinearDamping(.15);b.body.setAngularDamping(b.ball?3:.5);}} // on land: rolling resistance in sand
    PHYS.world.step();}
  for(const [g,b] of PHYS.bodies){const t=b.body.translation(),r=b.body.rotation(),v=b.body.linvel();g.position.set(t.x,t.y,t.z);g.quaternion.set(r.x,r.y,r.z,r.w);
    if(b.vy<-1.6&&v.y>-.4&&t.y>sea){const sf=surfaceAt(t.x,t.z);sf==='wood'?SFX.knock():SFX.step(sf,clamp(-b.vy/6,.25,.8));} // it hit something
    if(!b.wet&&t.y<sea){b.wet=true;SFX.splash(clamp(-v.y/6,.25,.8));if(U.uBio.value>.1)U.uRipples.value[rippleI++%8].set(t.x,t.z,time);}
    b.vy=v.y;b.t+=dt;b.still=Math.hypot(v.x,v.y,v.z)<.1?b.still+dt:0;
    if(b.body.isSleeping()||b.still>.6||b.t>15){physForget(g);if(b.onRest)b.onRest(g);}}
}
// diagnostics, for testing: which renderer is drawing, at what size and quality level
window.__gfxReset=()=>{renderer.info.reset();return frameNo;};window.__frameNo=()=>frameNo;
window.__gfx=()=>({api:GFX_API,buffer:[canvas.width,canvas.height],css:[canvas.clientWidth,canvas.clientHeight],scale:scenePass.getResolutionScale(),samples:scenePass.renderTarget.samples,quality:settings.quality,level:activeGfx().name,fps:Math.round(perf.fps),tris:renderer.info.render.triangles,calls:renderer.info.render.drawCalls,grass:GRASS.count,grassDrawn:GRASS.chunks.reduce((n,c)=>n+c.meshes.reduce((k,m)=>k+(m.visible?m.count:0),0),0)});
requestAnimationFrame(frame);
