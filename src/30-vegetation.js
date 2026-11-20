/* ───────────────────────── vegetation ───────────────────────── */
const colliders=[]; // {x,z,r}
const leafU={uSunView:TSL.uniform(new THREE.Vector3()),uSunTr:TSL.uniform(new THREE.Color())};
// sunlight glowing through leaves, added as emissive light
const leafGlow=(()=>{const {diffuseColor,normalize,positionView,dot,max,pow}=TSL;
  return diffuseColor.rgb.mul(leafU.uSunTr).mul(pow(max(dot(normalize(positionView.negate()),leafU.uSunView),0),4).mul(.6).add(.1));})();
function leafy(m){m.emissiveNode=leafGlow;return m;}
// Compressed models store positions as small integers. Moving or resizing those in place clamps them, so copy them out as plain numbers first.
function floatGeo(src){const g=src.clone();for(const k in g.attributes){const a=g.attributes[k];if(a.array instanceof Float32Array&&!a.isInterleavedBufferAttribute)continue;
  const n=a.count,s=a.itemSize,f=new Float32Array(n*s),get=['getX','getY','getZ','getW'];for(let i=0;i<n;i++)for(let j=0;j<s;j++)f[i*s+j]=a[get[j]](i);g.setAttribute(k,new THREE.BufferAttribute(f,s));}return g;}
const tnorm=(x,z)=>new THREE.Vector3(heightAt(x-.4,z)-heightAt(x+.4,z),.8,heightAt(x,z-.4)-heightAt(x,z+.4)).normalize();
function normalMapFrom(tex,strength){const src=tex.image,w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d'),o=g.createImageData(w,h),L=(x,y)=>d[(((y+h)%h)*w+((x+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(L(x+1,y)-L(x-1,y))*strength,dy=(L(x,y+1)-L(x,y-1))*strength,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;
    o.data[i]=(-dx/l*.5+.5)*255;o.data[i+1]=(dy/l*.5+.5)*255;o.data[i+2]=(1/l*.5+.5)*255;o.data[i+3]=255;}
  g.putImageData(o,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
const woodNorm=normalMapFrom(woodTex,3.5),barkNorm=normalMapFrom(barkTex,4);
const leafTex=canvasTex(128,128,(g)=>{g.translate(64,64);for(let i=0;i<7;i++){g.rotate(Math.PI*2/7+.2);const gr=g.createLinearGradient(0,0,0,-60);gr.addColorStop(0,'#5f7d38');gr.addColorStop(1,'#a9c46a');g.fillStyle=gr;
  g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-9,-18,-21,-44,0,-61);g.bezierCurveTo(21,-44,9,-18,0,0);g.fill();g.strokeStyle='rgba(40,60,20,.5)';g.lineWidth=1;g.beginPath();g.moveTo(0,0);g.lineTo(0,-56);g.stroke();}
  g.fillStyle='#4c682c';g.beginPath();g.arc(0,0,12,0,7);g.fill();});
const windU=TSL.uniform(0);
/* Wind: a steady trade wind from the east-north-east with gusts that travel across the island as bands.
   windAt(p) gives the horizontal push at world position p (metres, xz) and how gusty it is there (0–1). */
const WIND={dir:TSL.uniform(new THREE.Vector2(-.86,.51)),strength:TSL.uniform(.5),player:TSL.uniform(new THREE.Vector3(0,-99,0))};
const windAt=(p)=>{const {vec3,sin,dot,pow}=TSL;const t=U.uTime,dir=WIND.dir;
  const gust=sstep(.38,.82,vn(p.mul(.028).sub(dir.mul(t.mul(.23)))));                   // gust bands about 30 m apart, moving ~8 m/s
  const flutter=sin(t.mul(2.6).add(dot(p,dir).mul(.8)).add(vn(p.mul(.6)).mul(6))).mul(.22);
  const amount=WIND.strength.mul(gust.mul(1.15).add(.32).add(flutter));
  return vec3(dir.x.mul(amount),dir.y.mul(amount),gust);};
const palmSpots=(()=>{
  // the three by the lanai hold the hammock, so they move with it; the rest move out with the island
  const old=[[5.2,23.4,8.6],[14.5,24.9,7.6],[14.7,28.9,8.2],[-14,31,9],[-23,22,7.4],[21,35,8.4],[29,17,9.2],[-7,13,8],[19,-3,7],[-30,-9,8.8],[3,-34,9.4],[31,-22,7.8],[-12,-28,8.3]];
  const out=old.map(([x,z,H],i)=>{const p=i<3?BY_LANAI(x,z):(q=>[q.x,q.z])(enlarge(x,z));return[p[0],p[1],H];});
  // more palms for the larger island, mostly near the shore where palms grow
  const r=rng(41);let t=0;
  while(out.length<34&&t++<4000){const th=r()*Math.PI*2,m0=coastAt(th,MAP),dd=r()<.7?6+r()*22:28+r()*50,x=Math.sin(th)*(m0-dd),z=Math.cos(th)*(m0-dd);
    if(heightAt(x,z)<1.1||heightAt(x,z)>12||freshAt(x,z)!=null||masks(x,z).lava>.15||Math.hypot(x-LANAI.x,z-LANAI.z)<12||Math.hypot(x-START.x,z-START.z)<6)continue;
    if(out.some(q=>Math.hypot(q[0]-x,q[1]-z)<9))continue;
    out.push([x,z,7+r()*2.6]);}
  return out;})();
const palms=[];
{
  const trunkMat=new THREE.MeshStandardNodeMaterial({roughness:.9});
  {const {texture,uv,vec2,vec3,dot,mix}=TSL;const bk=pbrTex('bark'),q=uv().mul(vec2(2,.8)),nr=texture(bk.n,q);
   const detail=dot(texture(bk.a,q).rgb,vec3(.2126,.7152,.0722)).div(.125); // the scan's light and shade, around 1 on average
   trunkMat.colorNode=texture(barkTex,uv()).rgb.mul(mix(1,detail,.7));trunkMat.roughnessNode=nr.b.mul(.3).add(.68);trunkMat.normalNode=nrNormal(nr,1.4);}
  // one frond, pointing along +Z
  const P=[],C=[],UV=[],L=3.3,NL=30,a=new THREE.Color(),cb=srgb(.12,.27,.07),ct=srgb(.33,.43,.12),cr=srgb(.45,.47,.2);
  const rach=u=>new THREE.Vector3(0,L*(.42*u-.8*u*u),L*(u-.14*u*u));
  const push=(v,c,u)=>{P.push(v.x,v.y,v.z);C.push(c.r,c.g,c.b);UV.push(u,0);};
  for(let i=0;i<NL;i++){const u0=i/NL,u1=(i+1)/NL,p0=rach(u0),p1=rach(u1);const w=.035*(1-u0*.7);
    const q=[p0.clone().setX(-w),p0.clone().setX(w),p1.clone().setX(w),p1.clone().setX(-w)];
    for(const k of[0,1,2,0,2,3])push(q[k],cr,u0);
    const u=(i+.5)/NL,pm=rach(u),len=(.85*Math.pow(Math.sin(Math.PI*Math.pow(u,.75)),.6)+.12)*(.9+R()*.2);
    for(const s of[-1,1]){const droop=.5+R()*.3,w0=.055*(1-u*.4);
      const tan=p1.clone().sub(p0).normalize();
      const q=t=>pm.clone().add(new THREE.Vector3(s*len*.84*t,-len*droop*t*t+len*.12*t,len*.32*t));
      a.copy(cb).lerp(ct,u*.6+R()*.25);const at=a.clone().lerp(ct,.5);
      const T=[0,.35,.7,1];
      for(let k=0;k<3;k++){const t0=T[k],t1=T[k+1],c0=q(t0),c1=q(t1),h0=w0*Math.pow(1-t0,.6),h1=w0*Math.pow(1-t1,.6);
        const A=c0.clone().addScaledVector(tan,-h0),B=c0.clone().addScaledVector(tan,h0),C=c1.clone().addScaledVector(tan,h1),D=c1.clone().addScaledVector(tan,-h1);
        const ca=k<2?a:at;push(A,a,u);push(B,a,u);push(C,ca,u);if(k<2){push(A,a,u);push(C,ca,u);push(D,ca,u);}}}
  }
  const fg=new THREE.BufferGeometry();
  fg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(C,3));fg.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
  fg.computeVertexNormals();
  const fm=leafy(new THREE.MeshStandardNodeMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.5}));
  { // fronds sway at the tips; each frond's phase and its own up and side axes are per-instance attributes, filled in below
    const {attribute,positionLocal,positionGeometry,uv,sin}=TSL;
    const ph=attribute('aPh','float'),up=attribute('aUp','vec3'),side=attribute('aSide','vec3'),k=uv().x.mul(uv().x),w=windU;
    const wd=windAt(positionLocal.xz),gk=wd.z.mul(1.6).add(.55); // gusts make the fronds thrash harder
    const dy=sin(w.mul(1.1).add(ph).add(positionGeometry.z.mul(.9))).mul(.09).mul(k).add(sin(w.mul(2.7).add(ph.mul(1.7)).add(positionGeometry.x.mul(3))).mul(.02).mul(k));
    const dx=sin(w.mul(.8).add(ph.mul(1.3))).mul(.07).mul(k);
    fm.positionNode=positionLocal.add(up.mul(dy.mul(gk))).add(side.mul(dx.mul(gk))).add(TSL.vec3(wd.x,0,wd.y).mul(k).mul(.5));
  }
  const FR=17,fronds=new THREE.InstancedMesh(fg,fm,palmSpots.length*FR); fronds.castShadow=true; fronds.receiveShadow=true; fronds.frustumCulled=false;
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(0,0,0,'YXZ'),S=new THREE.Vector3(),T=new THREE.Vector3();
  const nutG=new THREE.SphereGeometry(.13,10,8),nutM=new THREE.MeshStandardMaterial({color:srgb(.3,.32,.14),roughness:.6});
  let fi=0;
  palmSpots.forEach(([x,z,H],pi)=>{
    const y=heightAt(x,z); if(y<.9){fi+=FR;return;}
    const la=Math.atan2(x,z)+(R()-.5)*1.2,lean=(pi<3?.5:1.2+R()*1.4),lx=Math.sin(la)*lean,lz=Math.cos(la)*lean;
    const g=new THREE.CylinderGeometry(1,1,1,10,18,true),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const t=p.getY(i)+.5,r=lerp(.21,.12,t)+.1*Math.exp(-t*14)+.012*Math.sin(t*H*9);const k=Math.pow(t,1.8);
      p.setXYZ(i,p.getX(i)*r+lx*k,t*H,p.getZ(i)*r+lz*k);}
    g.computeVertexNormals(); const bt=g.attributes.uv; for(let i=0;i<bt.count;i++)bt.setY(i,bt.getY(i)*H*.45);
    const tr=new THREE.Mesh(g,trunkMat); tr.position.set(x,y-.15,z); tr.castShadow=tr.receiveShadow=true; scene.add(tr);
    const crown=new THREE.Vector3(x+lx,y-.15+H,z+lz);
    for(let k=0;k<FR;k++){const ring=k/FR;E.set(lerp(-1.0,.62,Math.pow(ring,.8))+(R()-.5)*.2,k*2.4+R()*.5,(R()-.5)*.3);Q.setFromEuler(E);
      const sc=.85+R()*.3;S.set(sc,sc,sc);T.copy(crown);M.compose(T,Q,S);fronds.setMatrixAt(fi++,M);}
    for(let k=0;k<4;k++){const n=new THREE.Mesh(nutG,nutM);const an=k*1.6+R();n.position.set(crown.x+Math.cos(an)*.2,crown.y-.22-R()*.1,crown.z+Math.sin(an)*.2);n.castShadow=true;scene.add(n);}
    colliders.push({x,z,r:.42}); palms.push({x,z,y,H,crown});
  });
  {const n=fronds.count,aPh=new Float32Array(n),aUp=new Float32Array(n*3),aSide=new Float32Array(n*3),e=M.elements;
   for(let i=0;i<n;i++){fronds.getMatrixAt(i,M);aPh[i]=e[12]*.7+e[14]*.5+e[0]*3;aUp.set([e[4],e[5],e[6]],i*3);aSide.set([e[0],e[1],e[2]],i*3);}
   fg.setAttribute('aPh',new THREE.InstancedBufferAttribute(aPh,1));fg.setAttribute('aUp',new THREE.InstancedBufferAttribute(aUp,3));fg.setAttribute('aSide',new THREE.InstancedBufferAttribute(aSide,3));}
  scene.add(fronds);
}
/* grass: tufts of curved, tapering blades, streamed in 16 m chunks around you.
   Close chunks draw full tufts, further ones lighter tufts that thin out with distance; past the last ring the ground's own green takes over.
   To sit in the ground rather than on it, the blades are lit as the ground is (facing up, whichever side you see), start from the ground's colour
   at the root and follow the same dry and lush patches as the soil under them. Where grass grows is asked of the ground truth (grassMask, with
   less on slopes, river banks and under trees); a chunk samples the ground on a 1 m grid and places up to ~1,100 tufts on it. New chunks grow
   in from the ground over half a second, so nothing pops. Chunk meshes are pooled and reused, so walking about allocates nothing. */
const GRASS=(()=>{
  const tuft=(BL,SEG,wk)=>{const P=[],N=[],C=[],UVs=[],I=[],cBase=new THREE.Color(.038,.056,.017),cTip=new THREE.Color(.16,.24,.058),cDry=new THREE.Color(.3,.26,.11),c=new THREE.Color();
    for(let b=0;b<BL;b++){const a=R()*6.283,r=Math.sqrt(R())*.15,bx=Math.cos(a)*r,bz=Math.sin(a)*r,H=.45+R()*.6,w=(.02+R()*.02)*wk;
      const la=a+(R()-.5)*1.2,L=.08+R()*.3,lx=Math.cos(la),lz=Math.sin(la),fa=R()*3.1416,sx=Math.cos(fa),sz=Math.sin(fa),dry=R()<.18?R():0;
      const base=P.length/3;
      for(let k=0;k<=SEG;k++){const t=k/SEG,y=t*H,cx=bx+lx*L*t*t,cz=bz+lz*L*t*t,hw=w*Math.pow(1-t,.8)*.5;
        c.copy(cBase).lerp(cTip,Math.pow(t,.6)).lerp(cDry,dry*t);
        for(const sd of[-1,1]){P.push(cx+sx*hw*sd,y,cz+sz*hw*sd);N.push(-sz,0,sx);C.push(c.r,c.g,c.b);UVs.push(sd*.5+.5,t);}}
      for(let k=0;k<SEG;k++){const a0=base+k*2;I.push(a0,a0+1,a0+2,a0+1,a0+3,a0+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(UVs,2));geo.setIndex(I);return geo;};
  const LOD=[tuft(11,3,1),tuft(5,2,1.5)]; // full tufts close by; fewer, wider blades further out
  const GU={near:TSL.uniform(30),far:TSL.uniform(85),dens:TSL.uniform(1)};
  const m=leafy(new THREE.MeshStandardNodeMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.82}));
  {const {Fn,vec3,vec4,float,length,normalize,dot,clamp,mix,attribute,positionLocal,positionGeometry,cameraViewMatrix,varyingProperty,normalLocal,faceDirection}=TSL;
   const info=attribute('aInfo','vec4'),born=attribute('aBorn','float'),vBend=varyingProperty('float','vBend'); // root position, the tuft's place in its chunk's thinning order, and when its chunk was made
   m.positionNode=Fn(()=>{const root=info.xyz,dist=length(root.xz.sub(STREAM.uEye.xz));
     const keep=mix(1,.3,sstep(GU.near,GU.far.mul(.85),dist)).mul(sstep(GU.far,GU.far.mul(.85),dist)).mul(GU.dens);
     const grow=clamp(keep.sub(info.w).div(.06),0,1).mul(clamp(STREAM.uNow.sub(born).div(.6),0,1)); // tufts sink away one by one in the distance, and new chunks grow in
     const h=positionGeometry.y,k=h.mul(h),wd=windAt(positionLocal.xz);
     const d=positionLocal.xz.sub(WIND.player.xz),near=float(1).sub(sstep(.15,.95,length(d))).mul(sstep(1.6,.4,positionLocal.y.sub(WIND.player.y).abs()));
     const push=normalize(d.add(1e-4)).mul(near).mul(.8);                                    // blades lean away from your legs
     const bend=wd.xy.mul(.55).add(push).mul(k);
     vBend.assign(wd.z.mul(h));
     const p=positionLocal.add(vec3(bend.x,dot(bend,bend).mul(-.45),bend.y));                // bending also lowers the tip a little
     return root.add(p.sub(root).mul(grow));})();
   // lit mostly like the ground it grows from, with each blade's own side (the one you see) turning it toward or away from the sun
   m.normalNode=Fn(()=>{const side=normalize(normalLocal).mul(faceDirection);return normalize(cameraViewMatrix.mul(vec4(normalize(vec3(0,1,0).add(side.mul(.55))),0)).xyz);})();
   m.colorNode=vec4(vec3(float(1).add(vBend.mul(.28))),1);                                   // gusts flatten blades and show their paler sides
  }
  const CH=16,CAP=1400,G1=CH+1,up=new THREE.Vector3(0,1,0),nv=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),M4=new THREE.Matrix4(),P3=new THREE.Vector3(),S3=new THREE.Vector3(),c=new THREE.Color();
  const lush=new THREE.Color(.92,1.04,.9),dryC=new THREE.Color(1.3,1.0,1.02);
  // a pool of chunk meshes: each slot holds both detail levels over the same instance data
  const pool=[];let made=0;
  function slot(){if(pool.length)return pool.pop();made++;
    const mats=new THREE.InstancedBufferAttribute(new Float32Array(CAP*16),16),cols=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3),
      info=new THREE.InstancedBufferAttribute(new Float32Array(CAP*4),4),born=new THREE.InstancedBufferAttribute(new Float32Array(CAP),1);
    for(const a of[mats,cols,info,born])a.setUsage(THREE.DynamicDrawUsage);
    const meshes=LOD.map(base=>{const geo=new THREE.BufferGeometry();for(const k in base.attributes)geo.setAttribute(k,base.attributes[k]);geo.setIndex(base.index);geo.setAttribute('aInfo',info);geo.setAttribute('aBorn',born);
      const im=new THREE.InstancedMesh(geo,m,CAP);im.instanceMatrix=mats;im.instanceColor=cols;im.receiveShadow=true;im.raycast=()=>{};im.boundingSphere=new THREE.Sphere();im.visible=false;im.count=0;scene.add(im);return im;});
    return{mats,cols,info,born,meshes};}
  const live=[];let total=0;
  let q={near:30,far:85,dens:1};
  // the ground under a chunk, on a 1 m grid: height, and how much grass it takes
  function* build(ch){const x0=ch.x0,z0=ch.z0,H=new Float32Array(G1*G1),Gm=new Float32Array(G1*G1);let any=false;
    for(let j=0;j<G1;j++){for(let i=0;i<G1;i++)H[j*G1+i]=heightAt(x0+i,z0+j);if(j%4===3)yield;}
    for(let j=0;j<G1;j+=2){for(let i=0;i<G1;i+=2){const x=x0+i,z=z0+j,h=H[j*G1+i];let g=0;
        if(h>=1.2&&!nearHome(x,z,4.6)&&freshAt(x,z)==null){const mk=masks(x,z);g=grassMask(x,z,h,mk);
          if(g>0){const hx=H[j*G1+Math.min(i+1,CH)]-H[j*G1+Math.max(i-1,0)],hz=H[Math.min(j+1,CH)*G1+i]-H[Math.max(j-1,0)*G1+i],ny=2/Math.hypot(hx,2,hz);
            const rock=smooth(.56,.3,ny)*smooth(3,8,h),q2=riverQ(x,z),wet=q2?smooth(q2.w+4,q2.w,q2.d):0;g*=(1-rock)*(1-wet*.85)*(1-.7*forestW(x,z));}}
        Gm[j*G1+i]=g;if(g>.12)any=true;}
      yield;}
    // the odd grid points take their neighbours' average
    for(let j=0;j<G1;j++)for(let i=0;i<G1;i++){if(!(i%2)&&!(j%2))continue;const i0=i-(i%2),j0=j-(j%2),i1=Math.min(CH,i0+(i%2?2:0)),j1=Math.min(CH,j0+(j%2?2:0));
      Gm[j*G1+i]=(Gm[j0*G1+i0]+Gm[j0*G1+i1]+Gm[j1*G1+i0]+Gm[j1*G1+i1])*.25;}
    ch.n=0;if(!any)return;
    const S=ch.slot=slot(),R2=ch.R,bil=(A,u,v)=>{const i=Math.min(CH-1,Math.floor(u)),j=Math.min(CH-1,Math.floor(v)),fu=u-i,fv=v-j,o=j*G1+i;
      return (A[o]*(1-fu)+A[o+1]*fu)*(1-fv)+(A[o+G1]*(1-fu)+A[o+G1+1]*fu)*fv;};
    let n=0,y0=1e9,y1=-1e9;
    for(let t=0;t<CAP*1.6&&n<CAP;t++){const u=R2()*CH,v=R2()*CH,g=bil(Gm,u,v);if(g<.12||R2()>g)continue;
      const x=x0+u,z=z0+v,h=bil(H,u,v),hx=bil(H,Math.min(CH,u+.4),v)-bil(H,Math.max(0,u-.4),v),hz=bil(H,u,Math.min(CH,v+.4))-bil(H,u,Math.max(0,v-.4));
      nv.set(-hx,.8,-hz).normalize();const yaw=R2()*6.28,sc=(.35+R2()*.55)*(.55+.45*smooth(.2,.8,g)),f=smooth(.45,.68,fbm(x*.15,z*.15,3)); // shorter, sparser grass where it thins out at its edges
      c.copy(lush).lerp(dryC,f).multiplyScalar(.85+R2()*.3);
      qa.setFromUnitVectors(up,nv);qb.setFromAxisAngle(up,yaw);qa.multiply(qb);P3.set(x,h-.03,z);S3.set(sc*1.3,sc,sc*1.3);M4.compose(P3,qa,S3);M4.toArray(S.mats.array,n*16);
      S.cols.array[n*3]=c.r;S.cols.array[n*3+1]=c.g;S.cols.array[n*3+2]=c.b;S.info.array[n*4]=x;S.info.array[n*4+1]=h-.03;S.info.array[n*4+2]=z;
      y0=Math.min(y0,h);y1=Math.max(y1,h);n++;if(n%300===0)yield;}
    // a tuft's rank (its place in the thinning order) is its place in the list: tufts were placed in random order, so any first part is an even thinning
    for(let i=0;i<n;i++){S.info.array[i*4+3]=i/n;}
    ch.n=n;ch.y0=y0;ch.y1=y1;
    if(!n){pool.push(S);ch.slot=null;}}
  const L=STREAM.layer({name:'grass',size:CH,seed:16,prio:0,radius:()=>q.far+2,build,
    ready(ch){const S=ch.slot;if(!S)return;S.born.array.fill(ch.born,0,ch.n);for(const a of[S.mats,S.cols,S.info,S.born])a.needsUpdate=true;
      for(const im of S.meshes){im.boundingSphere.set(P3.set(ch.x0+CH/2,(ch.y0+ch.y1)/2+.4,ch.z0+CH/2),Math.hypot(CH/2,CH/2,(ch.y1-ch.y0)/2+.8)+1);}
      ch.meshes=S.meshes;live.push(ch);total+=ch.n;},
    dispose(ch){const S=ch.slot;if(!S)return;for(const im of S.meshes){im.visible=false;im.count=0;}const i=live.indexOf(ch);if(i>=0)live.splice(i,1);total-=ch.n;
      if(pool.length<48)pool.push(S);else for(const im of S.meshes){scene.remove(im);im.geometry.dispose();im.dispose();made--;}ch.slot=null;},
    abort(ch){if(ch.slot){pool.push(ch.slot);ch.slot=null;}},
    frame(cx,cz){ // pick each chunk's detail and how many of its tufts to send, from its nearest point to the camera
      for(const ch of live){const dx=Math.max(ch.x0-cx,0,cx-ch.x0-CH),dz=Math.max(ch.z0-cz,0,cz-ch.z0-CH),dd=Math.hypot(dx,dz);const [a,b]=ch.meshes;if(dd>=q.far){a.visible=b.visible=false;continue;}
        const keep=q.dens*lerp(1,.3,smooth(q.near,q.far*.85,dd))+.07,cnt=Math.min(ch.n,Math.ceil(ch.n*keep));
        const close=dd<q.near;a.visible=close;b.visible=!close;(close?a:b).count=cnt;}}});
  return{get count(){return total;},get chunks(){return live;},get pooled(){return made;},layer:L,
    quality(g){q={near:8+16*g.grass,far:30+55*g.grass,dens:Math.min(1,g.grass*1.1)};GU.near.value=q.near;GU.far.value=q.far;GU.dens.value=q.dens;},
    // called once a frame by the frame loop: it drives all streaming (grass, trees, plants, reef, animals' homes)
    update(cx,cz){STREAM.update(cx,cz);}};
})();
{ // naupaka shrubs and lava rocks
  const sp=[],sn=[],su=[],sc=[],c=new THREE.Color(),core=new THREE.IcosahedronGeometry(.74,2).toNonIndexed().attributes.position;
  for(let i=0;i<core.count;i++){const x=core.getX(i),y=core.getY(i)*.62,z=core.getZ(i),l=Math.hypot(x,y,z);sp.push(x,y,z);sn.push(x/l,y/l,z/l);su.push(.5,.5);c.copy(srgb(.1,.17,.06));sc.push(c.r,c.g,c.b);}
  const tx=new THREE.Vector3(),ty=new THREE.Vector3(),dv=new THREE.Vector3(),cv=new THREE.Vector3();
  for(let i=0;i<300;i++){const th=R()*6.283,cy=R()*1.15-.15;dv.set(Math.cos(th)*Math.sqrt(Math.max(0,1-cy*cy)),cy,Math.sin(th)*Math.sqrt(Math.max(0,1-cy*cy))).normalize();
    const rr=.72+R()*.34;cv.copy(dv).multiplyScalar(rr);cv.y*=.62;const nn=dv.clone().add(new THREE.Vector3(R()-.5,R()*.6,R()-.5).multiplyScalar(.7)).normalize();
    tx.set(-nn.z,0,nn.x).normalize();ty.crossVectors(nn,tx);const hs=.17+R()*.11;
    c.copy(srgb(.72,.8,.6)).multiplyScalar(.55+.6*smooth(-.2,.9,cy)*(0.75+R()*.5));
    for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){sp.push(cv.x+tx.x*a*hs+ty.x*b*hs,cv.y+tx.y*a*hs+ty.y*b*hs,cv.z+tx.z*a*hs+ty.z*b*hs);sn.push(dv.x,dv.y*.6+.4,dv.z);su.push(a*.5+.5,b*.5+.5);sc.push(c.r,c.g,c.b);}}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sg.setAttribute('normal',new THREE.Float32BufferAttribute(sn,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute(su,2));sg.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));
  const sm=leafy(new THREE.MeshStandardNodeMaterial({map:leafTex,vertexColors:true,alphaTest:.45,side:THREE.DoubleSide,roughness:.55}));
  {const {vec3,sin,dot,positionLocal,positionGeometry}=TSL; // shrubs lean with the wind; their outer leaves flutter
   const wd=windAt(positionLocal.xz),h=positionGeometry.y.add(.45).max(0),fl=sin(U.uTime.mul(7.3).add(dot(positionGeometry,vec3(9.1,5.3,7.7)))).mul(wd.z.add(.3)).mul(.012);
   sm.positionNode=positionLocal.add(vec3(wd.x,0,wd.y).mul(h).mul(.09)).add(vec3(fl,fl.mul(.6),fl.negate()));}
  const SHRUBS=360,shr=new THREE.InstancedMesh(sg,sm,SHRUBS),d=new THREE.Object3D();let i=0,t=0;
  while(i<SHRUBS&&t<60000){t++;const x=(R()-.5)*250,z=-170+R()*295,h=heightAt(x,z),mk=masks(x,z);if(h<1.5||mk.lava>.3||mk.d<12||grassMask(x,z,h,mk)<.35||freshAt(x,z)!=null||Math.hypot(x-SPRING.x,z-SPRING.z)<4)continue;
    if(Math.hypot(x-LANAI.x,z-LANAI.z)<12||Math.hypot(x-START.x,z-START.z)<16)continue; if(h>5&&R()>.3)continue;
    const s=.6+R()*1.1;d.position.set(x,h+.1*s,z);d.rotation.y=R()*6.28;d.scale.set(s*(1+R()*.5),s,s*(1+R()*.5));d.updateMatrix();shr.setMatrixAt(i++,d.matrix);
    if(s>1.1)colliders.push({x,z,r:s*.8});}
  shr.count=i;shr.castShadow=shr.receiveShadow=true;scene.add(shr);scene.userData.shrubs=shr;
  // real plants: scanned ferns and anthuriums (Poly Haven, CC0) take the shrubs' places, sized to the same footprints.
  // The old leaf-card shrubs stay, hidden, as the hit areas for picking flowers.
  Promise.all([gltfLoader.loadAsync('assets/models/fern.glb'),gltfLoader.loadAsync('assets/models/anthurium.glb')]).then(([fe,an])=>{
    const vars=[['fern_02_b',fe],['fern_02_c',fe],['anthurium_botany_01_a',an],['anthurium_botany_01_b',an]].map(([n,gl])=>gl.scene.getObjectByName(n)).filter(o=>o&&o.isMesh);
    if(!vars.length)return;
    const M=new THREE.Matrix4(),groups=vars.map(()=>[]);for(let k=0;k<shr.count;k++){shr.getMatrixAt(k,M);groups[k%vars.length].push(M.clone());}
    const {vec3,sin,dot,positionLocal,positionGeometry}=TSL;
    vars.forEach((src,vi)=>{src.updateWorldMatrix(true,false);const geo=floatGeo(src.geometry).applyMatrix4(src.matrixWorld);geo.computeBoundingBox();
      const b=geo.boundingBox,c=b.getCenter(new THREE.Vector3()),k=2.1/Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
      geo.translate(-c.x,-b.min.y,-c.z);geo.scale(k,k,k);geo.translate(0,-.1,0);geo.computeBoundingSphere(); // the old shrubs sat 0.1 above their base
      const m0=src.material,nm=leafy(new THREE.MeshStandardNodeMaterial({map:m0.map,normalMap:m0.normalMap,roughnessMap:m0.roughnessMap,roughness:m0.roughness??.8,metalness:0,alphaTest:Math.max(m0.alphaTest||0,.45),side:THREE.DoubleSide}));
      const wd=windAt(positionLocal.xz),h=positionGeometry.y.add(.1).max(0),fl=sin(U.uTime.mul(7.3).add(dot(positionGeometry,vec3(9.1,5.3,7.7)))).mul(wd.z.add(.3)).mul(.02).mul(h);
      nm.positionNode=positionLocal.add(vec3(wd.x,0,wd.y).mul(h).mul(.14)).add(vec3(fl,fl.mul(.6),fl.negate())); // leaves lean and flutter in the wind
      const im=new THREE.InstancedMesh(geo,nm,groups[vi].length);groups[vi].forEach((m,j)=>im.setMatrixAt(j,m));im.castShadow=im.receiveShadow=true;im.raycast=()=>{};scene.add(im);});
    shr.visible=false;
  }).catch(e=>console.warn('Plant models did not load:',e));
  let rg=new THREE.IcosahedronGeometry(1,4);rg.deleteAttribute('normal');rg.deleteAttribute('uv');rg=mergeVerts(rg);const rp=rg.attributes.position;
  for(let k=0;k<rp.count;k++){const x=rp.getX(k),y=rp.getY(k),z=rp.getZ(k),f=.7+.45*vnoise(x*1.7+y*2.1+9,z*1.9+y)+.22*(fbm(x*4+y*3,z*4-y*2,3)-.5)+.05*fbm(x*14+y*9,z*14,2);rp.setXYZ(k,x*f,y*f*.7,z*f);}
  rg.computeVertexNormals();
  const rm=new THREE.MeshStandardMaterial({color:srgb(.085,.08,.08),roughness:.7});
  const SPRING_ROCKS=16,FALL_ROCKS=18,ROCKS=380+SPRING_ROCKS+FALL_ROCKS,rocks=new THREE.InstancedMesh(rg,rm,ROCKS);i=0;t=0;
  // fallen boulders screen the hidden spring, with one narrow way in beside the stream
  for(let k=0;k<SPRING_ROCKS;k++){const a=k/SPRING_ROCKS*6.283+.25,gap=Math.abs(Math.atan2(Math.sin(a-Math.PI*.05),Math.cos(a-Math.PI*.05)))<.32;if(gap)continue;
    const rr=4.4+R()*1.4,x=SPRING.x+Math.sin(a)*rr,z=SPRING.z+Math.cos(a)*rr,s=1.3+R()*1.1,h=Math.min(heightAt(x,z),heightAt(x+s*.7,z),heightAt(x-s*.7,z),heightAt(x,z+s*.7),heightAt(x,z-s*.7));
    d.position.set(x,h+s*.15,z);d.rotation.set(R()*6,R()*6,R()*6);d.scale.set(s*(1+R()*.5),s*1.2,s*(1+R()*.5));d.updateMatrix();rocks.setMatrixAt(i++,d.matrix);colliders.push({x,z,r:s*.95});}
  // boulders round the plunge pool and either side of the waterfall's lip
  {const out=Math.atan2(RIVER.P[RIVER.iPool+14][0]-POOL.x,RIVER.P[RIVER.iPool+14][1]-POOL.z),inn=Math.atan2(RIVER.P[RIVER.iIn][0]-POOL.x,RIVER.P[RIVER.iIn][1]-POOL.z);
   const put=(x,z,s)=>{const h=Math.min(heightAt(x,z),heightAt(x+s*.7,z),heightAt(x-s*.7,z),heightAt(x,z+s*.7),heightAt(x,z-s*.7));d.position.set(x,h+s*.15,z);d.rotation.set(R()*6,R()*6,R()*6);d.scale.set(s*(1+R()*.5),s,s*(1+R()*.4));d.updateMatrix();rocks.setMatrixAt(i++,d.matrix);colliders.push({x,z,r:s*.9});};
   for(let k=0;k<13;k++){const a=k/13*6.283,da=b=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));if(da(out)<.5||da(inn)<.35)continue;const r=POOL.r+.6+R()*1.6;put(POOL.x+Math.sin(a)*r,POOL.z+Math.cos(a)*r,.9+R()*1.3);}
   const P=RIVER.P,j=RIVER.iTop,tx=P[j+1][0]-P[j-1][0],tz=P[j+1][1]-P[j-1][1],l=Math.hypot(tx,tz),nx=-tz/l,nz=tx/l,w=RIVER.w[j]+1.4;
   for(const sd of[-1,1])for(let k=0;k<2;k++)put(P[j-k*3][0]+nx*sd*(w+k*.8),P[j-k*3][1]+nz*sd*(w+k*.8),1.2+R()*.9);}
  while(i<ROCKS&&t<90000){t++;const x=-40-R()*96,z=(R()-.5)*220,mk=masks(x,z),h=heightAt(x,z);if(mk.lava<.45||h<-1.2)continue;
    const s=.25+Math.pow(R(),2.2)*1.5;d.position.set(x,h+s*.15,z);d.rotation.set(R()*6,R()*6,R()*6);d.scale.set(s*(1+R()),s,s*(1+R()*.6));d.updateMatrix();rocks.setMatrixAt(i++,d.matrix);
    if(s>.95&&h>.2)colliders.push({x,z,r:s*.9});}
  rocks.count=i;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);scene.userData.rocks=rocks;
  // swap in a scanned boulder (Poly Haven boulder_01, CC0) once it has loaded; the shaped blobs stay until then
  gltfLoader.loadAsync('assets/models/boulder.glb').then(gl=>{let src=null;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(o.isMesh&&!src)src=o;});
    const geo=floatGeo(src.geometry);geo.applyMatrix4(src.matrixWorld);geo.center();geo.computeBoundingSphere();const k=1.05/geo.boundingSphere.radius;geo.scale(k,k,k);geo.computeBoundingSphere();
    const m=src.material;m.color.setRGB(.3,.29,.3);                     // weathered grey granite darkened to volcanic basalt
    rocks.geometry.dispose();rocks.geometry=geo;rocks.material=m;})
    .catch(e=>console.warn('Boulder model did not load:',e));
}

