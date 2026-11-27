/* ───────── footprints: the ground remembers where you walked ─────────
   Decals, the way engines like Unreal do it: each print is a small textured patch laid on the ground at the foot, tipped to the
   slope. What the ground is decides the print: deep and rimmed in sand and riverbank mud, crisp in wet sand, faint on dirt and
   grass, nothing on rock or the deck, unless your feet are wet: then every surface takes a dark, wet print that dries away.
   Prints fade over a minute or two, faster in wind and rain, and the waves wash away those at the waterline in seconds.
   Animals leave their own: cloven hooves (pigs, deer, goats), three toes (nēnē, moa), small paws (the mongoose). */
const FOOT=(()=>{
  const N=480,CELL=['foot','hoof','bird','paw'];
  // an atlas of the four shapes: dark where the print is pressed in, a light rim where the sand was pushed up
  const tex=canvasTex(512,128,(c,w,h)=>{c.clearRect(0,0,w,h);const blob=(x,y,rx,ry,a,dark)=>{c.save();c.translate(x,y);c.rotate(a||0);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);
      if(dark){g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.75,'rgba(0,0,0,.7)');g.addColorStop(1,'rgba(0,0,0,0)');}else{g.addColorStop(.55,'rgba(255,255,255,0)');g.addColorStop(.85,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');}
      c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,6.283);c.fill();c.restore();};
    const shape=(ox,parts)=>{for(const dark of[false,true])for(const p of parts)blob(ox+p[0],p[1],p[2]*(dark?1:1.25),p[3]*(dark?1:1.18),p[4],dark);};
    shape(0,[[64,92,17,26,0],[62,50,19,22,.08],[57,24,6,6,0],[68,20,5,5,0],[77,22,4.5,4.5,0],[84,28,4,4,0],[89,35,3.5,3.5,0]]);        // a bare human foot: heel, ball, toes
    shape(128,[[52,64,12,30,-.12],[76,64,12,30,.12]]);                                                                             // a cloven hoof
    shape(256,[[64,92,5,10,0],[64,52,4,34,0],[44,40,3.5,24,-.6],[84,40,3.5,24,.6]]);                                                 // three toes
    shape(384,[[64,82,14,12,0],[50,54,5,6,0],[61,46,5,6,0],[72,46,5,6,0],[82,54,5,6,0]]);});                                          // a paw
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
  const geo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  const aP=new THREE.InstancedBufferAttribute(new Float32Array(N*4),4),aY=new THREE.InstancedBufferAttribute(new Float32Array(N),1);
  geo.setAttribute('aPrint',aP);geo.setAttribute('aYaw',aY);                                                        // strength, wet, kind, depth; and which way it points
  // The print is drawn as light on the ground already there (2 × print × ground), so it takes the colour of any ground: the wall
  // that faces the sun is lit, the far wall falls into shadow, the floor of the print is a little darker, the pushed-up rim catches
  // the light. A wet print darkens the ground under it. Grey .5 changes nothing, so a fading print just goes back to .5.
  const mat=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:false,
    blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.DstColorFactor,blendDst:THREE.SrcColorFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor});
  {const {attribute,uv,texture,vec2,vec3,vec4,mix,float,cos,sin,clamp,max,positionWorld,cameraPosition,smoothstep}=TSL,a=attribute('aPrint','vec4'),yw=attribute('aYaw','float'),q=uv();
    const at=o=>{const t=texture(tex,vec2(q.x.add(o[0]).add(a.z).div(4),q.y.add(o[1])));return t.a.mul(t.r.mul(.55).sub(float(1).sub(t.r)));}; // height: rim up, print down
    const e=.012,h0=at([0,0]),gu=at([e,0]).sub(at([-e,0])).div(2*e),gv=at([0,e]).sub(at([0,-e])).div(2*e);
    const c=cos(yw),s_=sin(yw),gx=gu.mul(c).sub(gv.mul(s_)),gz=gu.mul(s_.negate()).sub(gv.mul(c));                    // the slope of the print, turned into the world
    const L=U.uSunDir,lowSun=clamp(float(1).sub(L.y),.35,1),deep=mix(.35,1,a.w);
    const lit=gx.mul(L.x).add(gz.mul(L.z)).mul(-.13).mul(lowSun).mul(deep);                                       // facing the sun or turned away from it
    const shade=float(1).add(lit).add(h0.mul(.62).mul(deep)).mul(mix(1,.5,a.y.mul(clamp(h0.negate().mul(4),0,1)))); // the floor darker, wet darker still
    const far=float(1).sub(smoothstep(25,45,positionWorld.sub(cameraPosition).length()));
    const k=a.x.mul(far);mat.colorNode=vec4(vec3(mix(.5,shade.mul(.5),k)),1);}
  const im=new THREE.InstancedMesh(geo,mat,N);im.count=0;im.frustumCulled=false;im.renderOrder=1;im.raycast=()=>{};scene.add(im);
  const P=[];let head=0;const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Qy=new THREE.Quaternion(),S=new THREE.Vector3(),T=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
  // what the ground takes: depth 0..1 and how long it lasts (seconds), or null
  function ground(x,z,y){if(onDeck(x,z))return null;if(TUBE.inside(x,z,y))return{d:.15,life:200,wash:false};
    const h=heightAt(x,z),fw=freshAt(x,z);if(h<.05||(fw!=null&&fw>h+.03))return null;
    const m=masks(x,z),rq=riverQ(x,z);if(rq&&rq.d<rq.w+4)return{d:1,life:150,mud:1};                                   // riverbank mud
    if(m.lava>.5||GROUND.slopeAt(x,z)>1.1)return null;                                                                // rock
    const gm=grassMask(x,z,h,m);if(gm<.35&&h<4)return{d:h<.45?.8:1,life:h<.45?120:100,wash:h<.32};                     // sand; wet sand at the waterline
    if(forestW(x,z)>.35)return{d:.45,life:70};return{d:.25,life:45};}                                                // forest dirt; grass
  function add(x,z,yaw,size,kind,wet,yHint,who){const gnd=ground(x,z,yHint);if(!gnd&&!wet)return;
    const y=(TUBE.floorAt(x,z,yHint)??groundAt(x,z))+.012,n=tnorm(x,z);
    const p=P[head]||(P[head]={});Object.assign(p,{who:who||null,x,y,z,yaw,size,kind,wet:wet?1:0,d:gnd?gnd.d:0,life:gnd?gnd.life:25,wash:gnd&&gnd.wash,t:0,n:n.clone()});
    if(!gnd)p.d=0,p.life=22;if(wet&&gnd)p.life=Math.max(p.life,30);head=(head+1)%N;im.count=Math.max(im.count,head===0?N:Math.max(im.count,head));dirty=true;}
  let dirty=false,acc=0;
  function update(dt){acc+=dt;if(acc<.2&&!dirty)return;const step=acc;acc=0;dirty=false;
    const wind=WIND.strength.value,rain=typeof raining!=='undefined'?raining:0,fade=1+wind*1.4+rain*4;
    for(let i=0;i<im.count;i++){const p=P[i];if(!p){M.makeScale(0,0,0);im.setMatrixAt(i,M);continue;}p.t+=step*fade*(p.wash&&Math.sin(time*.7+p.x*.3)>.3?40:1); // the waves come up and wash them
      const k=Math.max(0,1-p.t/p.life);if(k<=0){M.makeScale(0,0,0);im.setMatrixAt(i,M);aP.setX(i,0);continue;}
      Q.setFromUnitVectors(Y,p.n);Qy.setFromAxisAngle(Y,p.yaw);Q.multiply(Qy);S.set(p.size*.55,1,p.size);M.compose(T.set(p.x,p.y,p.z),Q,S);im.setMatrixAt(i,M);
      const wetK=p.wet*Math.max(0,1-p.t/22);aP.setXYZW(i,Math.min(1,k*1.4)*(p.d>0||wetK>0?1:0),wetK,p.kind,p.d);aY.setX(i,p.yaw);}
    im.instanceMatrix.needsUpdate=true;aP.needsUpdate=true;aY.needsUpdate=true;}
  // you: alternate feet, a little either side of your line; feet stay wet for a while after the water
  let side=1,wetT=0;
  function step(){if(player.mode!=='walk')return;const fw=freshAt(player.x,player.z),h=heightAt(player.x,player.z);
    if(player.uw||(fw!=null&&fw-h>.1)||h<.05)wetT=1;const yaw=hero.ready?hero.bodyYaw:player.yaw,rx=Math.cos(yaw),rz=-Math.sin(yaw);side=-side;
    add(player.x+rx*.11*side,player.z+rz*.11*side,yaw,.27,0,wetT>.05,player.y);}
  function tick(dt){wetT=Math.max(0,wetT-dt/25);update(dt);}
  // animals: one print per stride, by kind
  const KIND={puaa:1,kia:1,kao:1,moa:2,nene:2,manakuke:3};
  function animal(a){const k=KIND[a.key];if(k==null)return;const L=a.sp.len||.6,stride=k===1?L*.42:L*.35;if(a.walk-(a.lastPrint||0)<stride)return;a.lastPrint=a.walk;
    if(Math.hypot(a.p.x-camera.position.x,a.p.z-camera.position.z)>45)return;a.pside=-(a.pside||1);
    const rx=Math.cos(a.yaw),rz=-Math.sin(a.yaw),o=(k===1?.1:.05)*L*a.pside;add(a.p.x+rx*o,a.p.z+rz*o,a.yaw+Math.PI,k===1?.11*L+.03:k===2?.12:.07,k,false,a.p.y,a.key);}
  // the freshest animal tracks near a point: who made them, how long ago, and which way they lead
  function read(x,z,r){let best=null;for(const p of P)if(p&&p.who&&p.t<p.life&&Math.hypot(p.x-x,p.z-z)<r&&(!best||p.t<best.t))best=p;return best;}
  return{step,tick,animal,read,mesh:im,get count(){let n=0;for(let i=0;i<im.count;i++)if(P[i]&&P[i].t<P[i].life)n++;return n;},ground};
})();
