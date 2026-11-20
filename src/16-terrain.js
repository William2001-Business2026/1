/* ───────────────────────── terrain: the whole island, streamed in tiles around the camera ─────────────────────────
   A quadtree of square tiles over the island (the root is 327.68 km across, the smallest tiles 80 m). Near the camera tiles are
   small and fine (about 1.25 m between points at High), far away they are large and coarse, out to the far coast and both
   volcanoes on the horizon. Every tile has the same number of points, so each one's even points are its parent's points: a tile
   eases its odd points onto its parent's surface as it nears the distance where the parent takes over (geomorphing), so detail
   never pops, and skirts hide any crack between neighbours. Tiles are built off the main thread by terrain workers that run the
   very same makeGround() code, so what you see is exactly what heightAt() says. The workers also build the physics ground and
   the sea's height map around the camera. Far land is dropped by the Earth's curvature and hazed by the air between. */

camera.far=300000;camera.updateProjectionMatrix(); // far land: the whole island and the sea horizon (with a reversed depth buffer)
// the air between you and far land: denser low down (scale height 1.4 km), so the summits stand out crisp above a bluish haze
const uHaze=TSL.uniform(1/44000);
function airHaze(col,y,dist){const {mix,exp,max,abs,float,normalize,vec3,select,cameraPosition,positionWorld}=TSL;
  const H=1400,y0=max(cameraPosition.y,0),y1=max(y,0),dy=y1.sub(y0),e0=exp(y0.negate().div(H)),e1=exp(y1.negate().div(H));
  const avg=select(abs(dy).lessThan(1),e0,e0.sub(e1).mul(H).div(dy));
  const f=float(1).sub(exp(float(dist).mul(uHaze).mul(avg).negate())).mul(float(1).sub(U.uUnder));
  const V=normalize(positionWorld.sub(cameraPosition)),hz=skyRad(normalize(vec3(V.x,max(V.y,0).mul(.6).add(.012),V.z)));
  return mix(col,hz,f);}
// where the falls land: the rock around is kept wet by the spray
const FRESH_SPOT={x:POOL.x,z:POOL.z,y:RIVER.poolL};
// the look of the ground at a point: macro albedo (linear RGB), the material blend (aMat: 0 sand … 1 grass, 2 rock), how forested
function terrainLook(G,x,z,h,ny,out,o){
  const lin=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4),mix3=(a,b,t)=>{a[0]+=(b[0]-a[0])*t;a[1]+=(b[1]-a[1])*t;a[2]+=(b[2]-a[2])*t;};
  const C=terrainLook.C||(terrainLook.C=Object.fromEntries(Object.entries({
    blackSand:[.23,.22,.21],blackWet:[.13,.125,.12],goldSand:[.84,.74,.56],goldWet:[.56,.47,.35],grass:[.25,.34,.13],lush:[.18,.3,.1],dry:[.55,.47,.27],
    litter:[.2,.18,.11],cliff:[.36,.34,.3],moss:[.2,.27,.12],lava:[.075,.07,.07],lava2:[.16,.14,.13],cinder:[.42,.29,.22],cinder2:[.47,.45,.42],
    reef:[.5,.47,.38],reef2:[.36,.36,.27],mud:[.25,.21,.15]}).map(([k,v])=>[k,v.map(lin)])));
  const m=G.masks(x,z),q=G.riverQ(x,z),P=G.POOL,dp=Math.hypot(x-P.x,z-P.z),wet=m.wet;
  const t=out;
  // sand: black on the windward coasts and Waipiʻo, golden on the dry leeward side
  const sandW=smooth(.45,.2,wet);t[0]=lerp(C.blackSand[0],C.goldSand[0],sandW);t[1]=lerp(C.blackSand[1],C.goldSand[1],sandW);t[2]=lerp(C.blackSand[2],C.goldSand[2],sandW);
  {const dmp=smooth(.34,.05,h)*.8;mix3(t,sandW>.5?C.goldWet:C.blackWet,dmp);}
  const n1=fbm(x*.4,z*.4,2);t[0]*=.93+.12*n1;t[1]*=.93+.12*n1;t[2]*=.93+.12*n1;
  const gorge=(()=>{const L=G.LIP,f=G.dd,cx=(L.x+P.x)/2,cz=(L.z+P.z)/2;return smooth(26,8,Math.hypot(x-cx,z-cz)+fbm(x*.3,z*.3,2)*6)*smooth(.95,.6,ny);})();
  const rock=Math.max(smooth(.5,.24,ny)*smooth(3,8,h),gorge);              // bare rock only on sheer cliffs; Hawaiian ridges are green to the top
  const wetBank=Math.max(q?smooth(q.w+4,q.w,q.d):0,smooth(P.r+5,P.r,dp));
  const gm=G.grassMask(x,z,h,m)*(1-rock)*(1-wetBank*.85);
  if(gm>0){const gc=[0,0,0];const dw=smooth(.2,.62,wet);gc[0]=lerp(C.dry[0],lerp(C.grass[0],C.lush[0],smooth(.7,1,wet)),dw);gc[1]=lerp(C.dry[1],lerp(C.grass[1],C.lush[1],smooth(.7,1,wet)),dw);gc[2]=lerp(C.dry[2],lerp(C.grass[2],C.lush[2],smooth(.7,1,wet)),dw);
    const pn=fbm(x*.15,z*.15,3);mix3(gc,C.dry,pn*.45*(1-smooth(.6,.9,wet)));mix3(t,gc,gm);}
  const reef=smooth(-1,-2.6,h)*smooth(10,24,-m.d)*smooth(.38,.55,fbm(x*.09+4,z*.09-6,3)+(h>-4.2?.12:-.1))*smooth(1700,900,Math.hypot(x-G.HOME_BAY.x,z-G.HOME_BAY.z));
  const alp=smooth(2700,3200,m.h);
  const rk=Math.max(smooth(.25,.6,m.lava),smooth(.3,.7,rock),reef*.9);
  if(rk>0){const lc=[0,0,0];
    if(reef>.3&&m.lava<.25){lc[0]=C.reef[0];lc[1]=C.reef[1];lc[2]=C.reef[2];mix3(lc,C.reef2,fbm(x*.4,z*.4,3));}
    else if(m.lava>.25){const f=fbm(x*.5,z*.5,3);lc[0]=lerp(C.lava[0],C.lava2[0],f);lc[1]=lerp(C.lava[1],C.lava2[1],f);lc[2]=lerp(C.lava[2],C.lava2[2],f);
      if(alp>0){const c2=[0,0,0],k=fbm(x*.004+7,z*.004,3);c2[0]=lerp(C.cinder[0],C.cinder2[0],k);c2[1]=lerp(C.cinder[1],C.cinder2[1],k);c2[2]=lerp(C.cinder[2],C.cinder2[2],k);mix3(lc,c2,alp);}}
    else{lc[0]=C.cliff[0];lc[1]=C.cliff[1];lc[2]=C.cliff[2];mix3(lc,C.moss,smooth(.4,.65,fbm(x*.3,z*.3+5,3))*smooth(.3,.7,wet));}
    mix3(t,lc,rk);}
  const fw=G.forestW(x,z);if(fw>0)mix3(t,C.litter,fw*.75);
  if(wetBank>0){t[0]*=1-.3*wetBank;t[1]*=1-.3*wetBank;t[2]*=1-.3*wetBank;}
  o.mat=Math.max(gm,rk*2,wetBank*.7);o.forest=fw*(1-rock);o.wet=wet;
}
const TERRAIN=(()=>{
  const {Fn,If,attribute,texture,float,vec2,vec3,vec4,dot,floor,mix,clamp,max,min,pow,sin,sqrt,exp,normalize,length,reflect,abs,step,cross,positionGeometry,positionWorld,
    cameraPosition,cameraViewMatrix,normalWorldGeometry,diffuseColor,modelWorldMatrix,varyingProperty,uniform,output,select}=TSL;
  const EARTH_R=6371000,ROOT={x:-163840,z:-163840,s:327680};
  const uK=uniform(1.7),uMorph=uniform(1);
  const conf=()=>{const g=activeGfx(),t=g.terrain||{high:{N:64,K:2.1,min:80},medium:{N:48,K:1.8,min:80},low:{N:32,K:1.5,min:160}}[g.name.toLowerCase().startsWith('high')?'high':g.name.toLowerCase().startsWith('low')?'low':'medium'];return t;};
  /* ── workers ── */
  const wsrc=[`const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};`,h2.toString(),vnoise.toString(),fbm.toString(),makeGround.toString(),terrainLook.toString(),
  `function half(v){const f=new Float32Array(1),u=new Uint32Array(f.buffer);f[0]=v;const x=u[0],s=(x>>>16)&0x8000;let e=((x>>>23)&0xff)-127+15,m=x&0x7fffff;
    if(e<=0)return s;if(e>=31)return s|0x7c00;return s|(e<<10)|(m>>>13);}
  let G=null;
  self.onmessage=e=>{const m=e.data;
    if(m.init){G=makeGround(m.init);self.postMessage({ready:true});return;}
    if(m.job==='tile'){const N=m.N,sp=m.s/N,x0=m.x-m.s/2,z0=m.z-m.s/2,E=N+3,H=new Float32Array(E*E);
      for(let j=0;j<E;j++)for(let i=0;i<E;i++)H[j*E+i]=G.heightAt(x0+(i-1)*sp,z0+(j-1)*sp,sp);
      const V=(N+1)*(N+1),S=4*(N+1),nv=V+S,pos=new Float32Array(nv*3),nrm=new Float32Array(nv*3),col=new Float32Array(nv*3),mat=new Float32Array(nv*4);
      const t=[0,0,0],o={};let hmin=1e9,hmax=-1e9;
      for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const k=j*(N+1)+i,h=H[(j+1)*E+i+1],x=x0+i*sp,z=z0+j*sp;
        const gx=(H[(j+1)*E+i+2]-H[(j+1)*E+i])/(2*sp),gz=(H[(j+2)*E+i+1]-H[j*E+i+1])/(2*sp),l=Math.hypot(gx,1,gz),ny=1/l;
        pos[k*3]=x-m.x;pos[k*3+1]=h;pos[k*3+2]=z-m.z;nrm[k*3]=-gx/l;nrm[k*3+1]=ny;nrm[k*3+2]=-gz/l;hmin=Math.min(hmin,h);hmax=Math.max(hmax,h);
        terrainLook(G,x,z,h,ny,t,o);col[k*3]=t[0];col[k*3+1]=t[1];col[k*3+2]=t[2];
        // morph target: the parent's surface here (its points are this tile's even points; its quads split along the same diagonal)
        const at=(a,b)=>H[(b+1)*E+a+1],oi=i&1,oj=j&1;let hc=h;
        if(oi&&!oj)hc=(at(i-1,j)+at(i+1,j))/2;else if(!oi&&oj)hc=(at(i,j-1)+at(i,j+1))/2;else if(oi&&oj)hc=(at(i+1,j-1)+at(i-1,j+1))/2;
        mat[k*4]=o.mat;mat[k*4+1]=o.forest;mat[k*4+2]=hc-h;mat[k*4+3]=o.wet;}
      // skirts: each edge point again, dropped below the surface
      const drop=sp*1.5+1.5,edge=[];for(let i=0;i<=N;i++)edge.push(i);for(let j=0;j<=N;j++)edge.push(j*(N+1)+N);for(let i=N;i>=0;i--)edge.push(N*(N+1)+i);for(let j=N;j>=0;j--)edge.push(j*(N+1));
      edge.forEach((src,q)=>{const k=V+q;pos[k*3]=pos[src*3];pos[k*3+1]=pos[src*3+1]-drop;pos[k*3+2]=pos[src*3+2];for(let c=0;c<3;c++){nrm[k*3+c]=nrm[src*3+c];col[k*3+c]=col[src*3+c];}for(let c=0;c<4;c++)mat[k*4+c]=mat[src*4+c];});
      self.postMessage({id:m.id,pos,nrm,col,mat,hmin,hmax},[pos.buffer,nrm.buffer,col.buffer,mat.buffer]);return;}
    if(m.job==='heights'){const N=m.N,sp=m.s/N,H=new Float32Array((N+1)*(N+1));for(let j=0;j<=N;j++)for(let i=0;i<=N;i++)H[j*(N+1)+i]=G.heightAt(m.x+i*sp,m.z+j*sp);
      self.postMessage({id:m.id,H},[H.buffer]);return;}
    if(m.job==='seaTex'){const N=m.N,sp=m.s/N,H=new Uint16Array(N*N);for(let j=0;j<N;j++)for(let i=0;i<N;i++)H[j*N+i]=half(G.heightAt(m.x+(i+.5)*sp,m.z+(j+.5)*sp,sp));
      self.postMessage({id:m.id,H},[H.buffer]);return;}
  };`].join('\n');
  const url=URL.createObjectURL(new Blob([wsrc],{type:'text/javascript'}));
  const NW=Math.min(3,Math.max(1,(navigator.hardwareConcurrency||4)-1)),workers=[],pend=new Map();let jid=0;
  for(let i=0;i<NW;i++){const w=new Worker(url);w.busy=0;w.onmessage=e=>{const m=e.data;if(m.ready)return;w.busy--;const cb=pend.get(m.id);pend.delete(m.id);if(cb)cb(m);pump();};
    w.onerror=e=>console.warn('Terrain worker error:',e.message);w.postMessage({init:TERRAIN_DATA});workers.push(w);}
  const queue=[];  // {pri, msg, cb}
  function run(msg,cb,pri=0){queue.push({pri,msg,cb});}
  function pump(){queue.sort((a,b)=>a.pri-b.pri);
    for(const w of workers)while(w.busy<2&&queue.length){const j=queue.shift();if(j.cancel&&j.cancel())continue;const id=++jid;j.msg.id=id;pend.set(id,j.cb);w.busy++;w.postMessage(j.msg);}}
  const job=(msg,pri=0)=>new Promise(res=>{run(msg,res,pri);pump();});

  /* ── the material: four scanned materials as detail over the macro colour, morphing, curvature and haze ── */
  const mat=new THREE.MeshStandardNodeMaterial({roughness:1,metalness:0});
  const vY=varyingProperty('float','vTY'),vDist=varyingProperty('float','vTD');
  const aMat4=attribute('aMat','vec4'),vMat=aMat4.x,vForest=aMat4.y,vCol=attribute('color','vec3');
  mat.positionNode=Fn(()=>{
    const p=positionGeometry,w=modelWorldMatrix.mul(vec4(p,1)).xyz,dv=w.sub(cameraPosition),dist=length(dv);
    const size=float(0).add(attribute('aSize','float')),m=sstep(uK.mul(size).mul(1.45),uK.mul(size).mul(1.95),dist).mul(uMorph);
    const y=p.y.add(aMat4.z.mul(m));vY.assign(y.add(w.y.sub(p.y)));vDist.assign(dist);
    const dh=dv.x.mul(dv.x).add(dv.z.mul(dv.z));
    return vec3(p.x,y.sub(dh.div(2*EARTH_R)),p.z);                                       // the Earth curves away
  })();
  const wp=positionWorld,wy=vY;
  const lavaM=sstep(1.3,1.9,vMat),grassM=sstep(0,.5,vMat).mul(float(1).sub(lavaM)).mul(sstep(-.8,.2,wy)),sandM=max(float(1).sub(grassM).sub(lavaM),0);
  const damp=sstep(.36,.2,wy),wetM=sandM.mul(damp),dryM=sandM.mul(float(1).sub(damp));
  // each scan is used for its detail only (divided by its own average brightness); the colour comes from the island (vertex colour)
  const LAYERS=[[dryM,'sand',3.2,.16],[wetM,'wetsand',3.2,.11],[grassM,'grass',2.6,.17],[lavaM,'rock',3.6,.011]].map(([w,n,sc,g])=>({w,t:pbrTex(n),sc,g}));
  const near=sstep(3200,1800,vDist);
  const blend=(pick,init)=>Fn(()=>{const acc=init.toVar();
    for(const L of LAYERS)If(L.w.greaterThan(.002),()=>{acc.addAssign(pick(L,wp.xz.div(L.sc)).mul(L.w));});return acc;})();
  const det=blend((L,q)=>texture(L.t.a,q).rgb.div(L.g),vec3(0));
  const detail=mix(vec3(1),mix(vec3(dot(det,vec3(.2126,.7152,.0722))),det,.45),near);
  const macro=vn(wp.xz.mul(.045)).mul(.3).add(.85).mul(mix(1,vn(wp.xz.mul(.13)).mul(.5).add(.72),grassM)).mul(vn(wp.xz.mul(.0021)).mul(.3).add(.85));
  // far away there are no trees drawn: the forest shows as its canopy, dark green and lumpy
  const canopy=vec3(.018,.045,.012).mul(vn(wp.xz.mul(.02)).mul(.5).add(.75)).mul(mix(1.25,.8,aMat4.w));
  const farF=vForest.mul(sstep(500,1500,vDist));
  const spray=(()=>{const f=FRESH_SPOT;return sstep(26,8,length(wp.xz.sub(vec2(f.x,f.z))).add(vn(wp.xz.mul(.7)).mul(4))).mul(sstep(f.y+45,f.y-2,wy));})(); // the rock the spray keeps wet
  const puddle=sstep(.6,.7,vn(wp.xz.mul(.16).add(7)).add(vn(wp.xz.mul(.5)).mul(.15))).mul(sstep(.975,.995,normalWorldGeometry.y)).mul(sstep(.3,.9,U.uWet)).mul(float(1).sub(lavaM)).mul(sstep(.5,1.2,wy)).mul(near);
  // cliffs: rock projected from the side (a texture laid from above stretches into flat slabs on a 450 m wall), mostly hidden
  // under moss, ferns and shrubs as on the real valley walls, bare only where it is steepest, with dark streaks where water runs
  const N0=normalWorldGeometry,cl=sstep(.74,.4,N0.y);
  const rockT=LAYERS[3].t,cliff=Fn(()=>{const c=vec3(0).toVar();If(cl.greaterThan(.003),()=>{
      const ax=abs(N0.x),az=abs(N0.z),wsum=ax.add(az).add(.001);
      const tri=texture(rockT.a,wp.zy.div(5.5)).rgb.mul(ax).add(texture(rockT.a,wp.xy.div(5.5)).rgb.mul(az)).div(wsum).div(.011);
      const big=vn(vec2(wp.x.add(wp.z).mul(.035),wp.y.mul(.05))),fine=vn(wp.xz.mul(.6).add(wp.y.mul(.4)));
      const rock=vec3(.05,.047,.043).mul(mix(vec3(1),tri,.8)).mul(mix(.55,1,vn(vec2(wp.x.add(wp.z).mul(.9),wp.y.mul(.04))))); // water stains run down
      const veg=sstep(.5,.72,N0.y.add(big.sub(.5).mul(.55)).add(.55)).mul(sstep(-2,40,wy)),                                  // green wherever plants can hold on
        green=vec3(.022,.05,.016).mul(mix(.6,1.35,fine)).mul(mix(.8,1.1,big));
      c.assign(mix(rock,green,veg));});return c;})();
  mat.colorNode=vec4(mix(mix(vCol.mul(detail).mul(macro),cliff,cl),canopy,farF).mul(mix(1,.82,wetM)).mul(mix(1,.68,U.uWet.mul(sstep(-.2,.4,wy)))).mul(mix(1,.45,puddle))
    .mul(mix(1,.78,sstep(.5,1,vMat).mul(float(1).sub(lavaM)).mul(near))).mul(mix(1,.5,spray)),1);
  const nr=blend((L,q)=>texture(L.t.n,q).rgb,vec3(0));
  const ph0=U.uTime.mul(.7).add(vn(wp.xz.mul(.045)).mul(7));
  const gloss=clamp(sstep(.25,.07,wy).mul(sin(ph0.sub(1.3)).mul(.5).add(.5)),0,1);
  mat.roughnessNode=mix(mix(mix(.95,nr.z,near),.8,cl),.12,gloss.mul(sandM).mul(.9)).mul(mix(1,.7,wetM)).mul(mix(1,.55,U.uWet)).mul(mix(1,.06,puddle)).mul(mix(1,.22,spray));
  mat.normalNode=Fn(()=>{ // tangent space follows the ground: X along world X, Y along world Z
    const N=normalWorldGeometry,T=normalize(vec3(1,0,0).sub(N.mul(N.x))),B=cross(T,N);
    const t=nr.xy.mul(2).sub(1).mul(near),tz=sqrt(max(float(1).sub(dot(t,t)),0));
    const n=normalize(T.mul(t.x).add(B.mul(t.y)).add(N.mul(tz)));
    return normalize(cameraViewMatrix.mul(vec4(mix(mix(n,N,cl),N,puddle),0)).xyz);
  })();
  mat.emissiveNode=Fn(()=>{
    const e=vec3(0).toVar(),dist=vDist;
    If(dist.lessThan(16).and(sandM.greaterThan(.001)),()=>{ // sun glints on sand grains
      const Vw=normalize(cameraPosition.sub(wp)),cell=floor(wp.xz.mul(240)),hs=hash21(cell);
      const gn=normalize(vec3(hash21(cell.add(3)).sub(.5),.55,hash21(cell.add(7)).sub(.5)));
      const gl=step(.982,hs).mul(pow(max(dot(reflect(Vw.negate(),gn),U.uSunDir),0),30)).mul(float(1).sub(sstep(2,16,dist)));
      e.addAssign(U.uSunDisc.mul(gl).mul(.035).mul(dryM));
    });
    const uw=sstep(0,-.3,wy).mul(sstep(mix(-3.5,-18,U.uUnder),-.4,wy)).mul(mix(1,3,U.uUnder)).mul(near);
    If(uw.greaterThan(0),()=>{ // caustics in the shallows
      const c1=vn(wp.xz.mul(2.1).add(vec2(U.uTime.mul(.33),U.uTime.mul(.2)))),c2=vn(wp.xz.mul(2.7).sub(vec2(U.uTime.mul(.27),U.uTime.mul(.38))));
      e.addAssign(U.uSunDisc.mul(.03).mul(pow(float(1).sub(abs(c1.sub(c2))),7)).mul(uw).mul(diffuseColor.rgb));
    });
    return e;
  })();
  mat.outputNode=vec4(airHaze(output.rgb,wy,vDist),output.a);
  /* ── the quadtree ── */
  const tiles=new Map(); // key → {key,x,z,s,lvl,mesh,state:0 none,1 queued,2 ready, used}
  const idxCache={};
  function indexFor(N){if(idxCache[N])return idxCache[N];const V=(N+1)*(N+1),I=[];
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;I.push(a,b,a+1,a+1,b,b+1);}
    const S=4*(N+1);for(let q=0;q<S-1;q++){const e0=edgeAt(N,q),e1=edgeAt(N,q+1),s0=V+q,s1=V+q+1;I.push(e0,s0,e1,e1,s0,s1);} // skirts (both faces drawn by winding: the material is one-sided, so add the other side)
    for(let q=0;q<S-1;q++){const e0=edgeAt(N,q),e1=edgeAt(N,q+1),s0=V+q,s1=V+q+1;I.push(e0,e1,s0,e1,s1,s0);}
    return idxCache[N]=new THREE.BufferAttribute(V+S>65535?new Uint32Array(I):new Uint16Array(I),1);}
  function edgeAt(N,q){const n=N+1;if(q<n)return q;q-=n;if(q<n)return q*(N+1)+N;q-=n;if(q<n)return N*(N+1)+(N-q);q-=n;return (N-q)*(N+1);}
  const group=new THREE.Group();scene.add(group);
  let N=64,K=1.8,MIN=80,gen=0;
  function key(x,z,s){return s+':'+x+':'+z;}
  function tileFor(x,z,s,lvl){const k=key(x,z,s);let t=tiles.get(k);if(!t){t={key:k,x,z,s,lvl,mesh:null,state:0,used:0,gen};tiles.set(k,t);}return t;}
  // the height range of a node, from the island grid (with room for detail and carving)
  const G0=TERRAIN_DATA.grids.island;
  function hRange(x,z,s){const n=s>=2000?6:3;let a=1e9,b=-1e9;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const h=GROUND.dataH(x+s*i/n,z+s*j/n);a=Math.min(a,h);b=Math.max(b,h);}return[a-40,b+40];}
  const rangeCache=new Map();
  function nodeDist(cx,cy,cz,x,z,s){const k=key(x,z,s);let r=rangeCache.get(k);if(!r){r=hRange(x,z,s);rangeCache.set(k,r);}
    const dx=Math.max(x-cx,0,cx-(x+s)),dz=Math.max(z-cz,0,cz-(z+s)),dy=Math.max(r[0]-cy,0,cy-r[1]);return[Math.hypot(dx,dy,dz),r];}
  function request(t,pri){if(t.state!==0)return;t.state=1;const g=t.gen;
    job({job:'tile',x:t.x+t.s/2,z:t.z+t.s/2,s:t.s,N},pri).then(m=>{if(g!==gen){return;}build(t,m);});}
  function build(t,m){const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(m.pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(m.nrm,3));
    geo.setAttribute('color',new THREE.BufferAttribute(m.col,3));geo.setAttribute('aMat',new THREE.BufferAttribute(m.mat,4));
    const nv=m.pos.length/3,sz=new Float32Array(nv).fill(t.s);geo.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
    geo.setIndex(indexFor(N));geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,mat);mesh.position.set(t.x+t.s/2,0,t.z+t.s/2);mesh.matrixAutoUpdate=false;mesh.updateMatrix();
    mesh.receiveShadow=true;mesh.castShadow=t.s<=640;mesh.frustumCulled=t.s<=2560;mesh.visible=false;mesh.userData.tile=t;
    t.mesh=mesh;t.state=2;t.hmin=m.hmin;t.hmax=m.hmax;group.add(mesh);}
  function drop(t){if(t.mesh){group.remove(t.mesh);t.mesh.geometry.dispose();t.mesh=null;}t.state=0;}
  let frameT=0,shown=[],lastCam=new THREE.Vector3(1e9,0,0),pending=0;
  // which tiles to draw: split while near; a node is only replaced by its children once all of them can be drawn
  function wantSplit(t,c){if(t.s<=MIN)return false;const [d]=nodeDist(c.x,c.y,c.z,t.x,t.z,t.s);return d<K*t.s;}
  function kids(t){const h=t.s/2;return[tileFor(t.x,t.z,h,t.lvl+1),tileFor(t.x+h,t.z,h,t.lvl+1),tileFor(t.x,t.z+h,h,t.lvl+1),tileFor(t.x+h,t.z+h,h,t.lvl+1)];}
  function skipSea(t,c){const k=key(t.x,t.z,t.s);const r=rangeCache.get(k)||hRange(t.x,t.z,t.s);rangeCache.set(k,r);
    const [d]=nodeDist(c.x,c.y,c.z,t.x,t.z,t.s);return r[1]<-160+40&&d>3000;}  // all deep sea and not close: nothing to see under the waves
  function canDraw(t,c,depth){if(skipSea(t,c))return true;if(wantSplit(t,c)&&depth<14){if(kids(t).every(k=>canDraw(k,c,depth+1)))return true;}return t.state===2;}
  function pickTiles(t,c,out,depth){t.used=frameT;
    if(skipSea(t,c))return;
    if(wantSplit(t,c)){const ks=kids(t);for(const k of ks){k.used=frameT;if(k.state===0&&!skipSea(k,c))request(k,nodeDist(c.x,c.y,c.z,k.x,k.z,k.s)[0]/k.s);} // nearest, most needed first: the ground under you before the far coast
      if(ks.every(k=>canDraw(k,c,depth+1))){for(const k of ks)pickTiles(k,c,out,depth+1);return;}}
    if(t.state===2)out.push(t);else if(t.state===0)request(t,-1); // a node with nothing to draw yet comes before everything
  }
  // every tile under and around a point, from the root down to the finest, requested together (nearest and finest first)
  function prefetch(c){let lvl=0;for(let sz=ROOT.s;sz>=MIN;sz/=2,lvl++){const r=sz<=1280?1:0;
    for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const x=ROOT.x+(Math.floor((c.x-ROOT.x)/sz)+i)*sz,z=ROOT.z+(Math.floor((c.z-ROOT.z)/sz)+j)*sz,t=tileFor(x,z,sz,lvl);
      if(t.state===0&&!skipSea(t,c))request(t,-2+(Math.abs(i)+Math.abs(j))*.1);}}}
  function apply(){const c=conf();if(c.N!==N||c.min!==MIN){N=c.N;MIN=c.min;gen++;for(const t of tiles.values())drop(t);tiles.clear();}K=c.K;uK.value=K;}
  apply();
  function update(){
    const o=window.__terrain&&window.__terrain.camOverride;if(o){camera.position.set(...o.pos);camera.lookAt(...o.look);camera.updateMatrixWorld();sky.position.copy(camera.position);}
    frameT++;apply();const c=camera.position;
    if(c.distanceTo(lastCam)>150)prefetch(c);lastCam.copy(c);                // a teleport or a cut: ask for the whole column down to full detail at once
    const root=tileFor(ROOT.x,ROOT.z,ROOT.s,0),out=[];pickTiles(root,c,out,0);
    for(const t of shown)if(t.mesh)t.mesh.visible=false;for(const t of out)t.mesh.visible=true;shown=out;
    if(frameT%60===0){let n=0;for(const t of tiles.values())if(frameT-t.used>600&&t.s<ROOT.s){drop(t);tiles.delete(t.key);n++;}}
    pump();
  }
  return{update,job,mat,group,get tiles(){return tiles;},get gen(){return gen;},get shown(){return shown;},stats(){let tris=0;for(const t of shown)tris+=t.mesh.geometry.index.count/3;return{tiles:shown.length,tris,queued:queue.length,busy:workers.reduce((a,w)=>a+w.busy,0),cached:tiles.size,nw:workers.length,pend:pend.size,jid,wb:workers.map(w=>w.busy)};},
    idle(){return queue.length===0&&workers.every(w=>w.busy===0);},flush(){gen++;for(const t of tiles.values())drop(t);tiles.clear();}};
})();
// test hooks: terrain streaming state, a free camera, and the numeric checks of the real-island phase
window.__terrain={camOverride:null,job:(m,p)=>TERRAIN.job(m,p),stats:()=>TERRAIN.stats(),idle:()=>TERRAIN.idle()&&SEA_TEX.ready,
  checks(){const f=v=>Math.round(v*10)/10,mk=lonLatToWorld(-155.4681,19.8207),ml=lonLatToWorld(-155.6082,19.4753);
    const top=(c,r)=>{let b=-1e9;for(let dz=-r;dz<=r;dz+=10)for(let dx=-r;dx<=r;dx+=10)b=Math.max(b,heightAt(c.x+dx,c.z+dz));return f(b);};
    const zc={};for(let z=-1500;z<=4000;z+=25)for(let x=-2500;x<=2500;x+=25){const h=heightAt(x,z),k=zoneAt(x,z,h<0?h+.5:undefined);zc[k]=(zc[k]||0)+1;}
    for(let z=-1500;z<=4000;z+=50)for(let x=-2500;x<=2500;x+=50){const k=zoneAt(x,z);zc[k]=(zc[k]||0)+1;}
    let rn=0,rt=0;for(let i=0;i<RIVER.P.length;i+=5){if(i>RIVER.iTop&&i<RIVER.iIn)continue;rt++;if(freshAt(RIVER.P[i][0],RIVER.P[i][1])!=null)rn++;}
    const coast=[];for(let i=0;i<4000&&coast.length<20;i++){const x=-50000+((i*7919)%130000),z=-20000+((i*104729)%150000);if(Math.abs(GROUND.coastD(x,z))<2)coast.push(f(heightAt(x,z)));}
    return{maunaKea:top(mk,150),maunaLoa:top(ml,300),peak:[f(PEAK.x),f(PEAK.z),f(PEAK_H)],coast,zones:zc,riverFresh:rn+'/'+rt,pool:freshAt(POOL.x,POOL.z),start:[f(START.x),f(START.z),f(heightAt(START.x,START.z))]};},
  async physAt(x,z){player.x=x;player.z=z;player.y=heightAt(x,z);for(let t=0;t<120;t++){await new Promise(r=>setTimeout(r,500));
      if(PHYS.ready){const R=PHYS.R,hit=PHYS.world.castRay(new R.Ray({x,y:player.y+50,z},{x:0,y:-1,z:0}),200,true,undefined,undefined,undefined,PHYS.me);if(hit)return{x,z,phys:Math.round((player.y+50-(hit.timeOfImpact??hit.toi))*100)/100,heightAt:Math.round(player.y*100)/100};}}return{x,z,phys:null};}};
