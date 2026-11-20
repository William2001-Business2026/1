/* ───────────────────────── the island: Hawaiʻi Island (the Big Island) at real scale ─────────────────────────
   The whole island is here at its true size (about 10,430 km²) and real heights (Mauna Kea 4,207 m, Mauna Loa 4,169 m),
   from USGS 3DEP elevation (assets/terrain, see terrain.json for the credit line).
   World frame: metres; +x east, +z south (so yaw 0 looks north, toward −z); y up from sea level. The origin is on the black-sand
   beach of Waipiʻo Valley on the windward Hāmākua coast, where the game's content lives (the home region, about 4 × 4 km:
   beach, river, Hiʻilawe falls and its plunge pool, rainforest, valley walls, the reef offshore). The player normally plays
   within a few kilometres of the origin, so float precision is fine; far teleports (Mauna Kea, 35 km) work but texture detail
   is slightly less crisp there. There is no re-centring.
   The ground truth (heightAt, freshAt, masks, zoneAt, surfaceAt, forestW, grassMask, riverQ, RIVER…) is built by makeGround()
   from data that is fully loaded before the first frame (≈4.6 MB), so every answer is deterministic and the same everywhere,
   on the main thread and in the terrain worker (which runs this same function). */
const TERRAIN_META=await fetch('assets/terrain/terrain.json').then(r=>r.json());
const GEO=TERRAIN_META.frame; // lat0, lon0 (the origin) and metres per degree of latitude and longitude there
function lonLatToWorld(lon,lat){return{x:(lon-GEO.lon0)*GEO.mlon,z:-(lat-GEO.lat0)*GEO.mlat};}
function worldToLonLat(x,z){return{lon:GEO.lon0+x/GEO.mlon,lat:GEO.lat0-z/GEO.mlat};}
// .hmt grids: 'HMT1', u32 header length, JSON header, then per channel a zlib stream of predicted 16-bit residuals (low bytes, high bytes)
async function loadHMT(name){
  const buf=new Uint8Array(await fetch('assets/terrain/'+name+'.hmt').then(r=>{if(!r.ok)throw new Error('terrain '+name+': '+r.status);return r.arrayBuffer();}));
  const hl=buf[4]|buf[5]<<8|buf[6]<<16|buf[7]<<24,meta=JSON.parse(new TextDecoder().decode(buf.subarray(8,8+hl)));let o=8+hl;const G={nx:meta.nx,nz:meta.nz,x0:meta.x0,z0:meta.z0,step:meta.step};
  for(const c of meta.ch){const z=buf.subarray(o,o+c.bytes);o+=c.bytes;
    const raw=new Uint8Array(await new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const nx=meta.nx,n=nx*meta.nz,q=new Uint16Array(n);
    for(let k=0;k<n;k++){const zz=raw[k]|raw[n+k]<<8,r=zz&1?-((zz+1)>>1):zz>>1,i=k%nx;
      const p=k<nx?(i?q[k-1]:0):i?q[k-1]+q[k-nx]-q[k-nx-1]:q[k-nx];q[k]=(p+r)&65535;}
    G[c.name]={a:q,sc:c.scale,of:c.offset};}
  return G;
}
const TERRAIN_DATA={grids:Object.fromEntries(await Promise.all(TERRAIN_META.levels.map(async n=>[n,await loadHMT(n)]))),river:TERRAIN_META.river};

/* makeGround: everything about the ground, as one self-contained function (it only uses clamp, lerp, smooth, h2, vnoise, fbm),
   so the terrain worker can run exactly the same code. */
function makeGround(D){
  const G0=D.grids.island,G1=D.grids.region,G2=D.grids.home;
  const x1=G=>G.x0+(G.nx-1)*G.step,z1=G=>G.z0+(G.nz-1)*G.step;
  function bil(G,c,x,z){let gx=(x-G.x0)/G.step,gz=(z-G.z0)/G.step;gx=gx<0?0:gx>G.nx-1.001?G.nx-1.001:gx;gz=gz<0?0:gz>G.nz-1.001?G.nz-1.001:gz;
    const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,k=j*G.nx+i,a=c.a,n=G.nx;return((a[k]*(1-fx)+a[k+1]*fx)*(1-fz)+(a[k+n]*(1-fx)+a[k+n+1]*fx)*fz)*c.sc+c.of;}
  function cub(G,c,x,z){ // Catmull-Rom: smooth, so close ground has no facets from the grid
    let gx=(x-G.x0)/G.step,gz=(z-G.z0)/G.step;gx=gx<1?1:gx>G.nx-2.001?G.nx-2.001:gx;gz=gz<1?1:gz>G.nz-2.001?G.nz-2.001:gz;
    const i=gx|0,j=gz|0,u=gx-i,v=gz-j,a=c.a,n=G.nx;
    const u0=((-u+2)*u-1)*u*.5,u1=((3*u-5)*u*u+2)*.5,u2=((-3*u+4)*u+1)*u*.5,u3=(u-1)*u*u*.5;
    const v0=((-v+2)*v-1)*v*.5,v1=((3*v-5)*v*v+2)*.5,v2=((-3*v+4)*v+1)*v*.5,v3=(v-1)*v*v*.5;
    let s=0,k=(j-1)*n+i-1;
    s+=v0*(u0*a[k]+u1*a[k+1]+u2*a[k+2]+u3*a[k+3]);k+=n;s+=v1*(u0*a[k]+u1*a[k+1]+u2*a[k+2]+u3*a[k+3]);k+=n;
    s+=v2*(u0*a[k]+u1*a[k+1]+u2*a[k+2]+u3*a[k+3]);k+=n;s+=v3*(u0*a[k]+u1*a[k+1]+u2*a[k+2]+u3*a[k+3]);
    return s*c.sc+c.of;}
  const inW=(G,x,z,m)=>smooth(0,m,Math.min(x-G.x0,x1(G)-x,z-G.z0,z1(G)-z));
  // the three levels of data: the whole island (100 m), the region around home (30 m), the home region (5 m)
  function levelW(x,z){return[inW(G1,x,z,1500),inW(G2,x,z,300)];}
  function dataH(x,z){const [w1,w2]=levelW(x,z);let h=0;
    if(w2<1){h=w1<1?cub(G0,G0.h,x,z):0;if(w1>0)h=lerp(h,cub(G1,G1.h,x,z),w1);}
    if(w2>0)h=lerp(h,cub(G2,G2.h,x,z),w2);return h;}
  function coastD(x,z){const [w1,w2]=levelW(x,z);let d=0; // metres from the coast: + inland, − out to sea
    if(w2<1){d=w1<1?bil(G0,G0.d,x,z):0;if(w1>0)d=lerp(d,bil(G1,G1.d,x,z),w1);}
    if(w2>0)d=lerp(d,bil(G2,G2.d,x,z),w2);return d;}
  const wetAt=(x,z)=>bil(G0,G0.w,x,z);  // trade-wind rainfall, 0 (Kona coast, the summits) … 1 (Hāmākua, Hilo, Puna)
  function slopeAt(x,z){const [w1,w2]=levelW(x,z),G=w2>.5?G2:w1>.5?G1:G0,e=G.step;
    const gx=(bil(G,G.h,x+e,z)-bil(G,G.h,x-e,z))/(2*e),gz=(bil(G,G.h,x,z+e)-bil(G,G.h,x,z-e))/(2*e);return Math.hypot(gx,gz);}
  const HOME_BAY={x:-80,z:-260}; // the middle of Waipiʻo bay, offshore
  // ── the ground before anything is carved into it: data, a real beach profile, the reef, and detail down to about a metre ──
  function heightBase(x,z){
    let h=dataH(x,z);const d=coastD(x,z);
    if(d>-80&&d<60){ // a beach where the land is low: a gentle swash slope, not a 3 m step at the waterline
      const bw=smooth(10,4.5,Math.max(h,0))*smooth(60,35,d)*smooth(-80,-50,d);
      if(bw>0)h=lerp(h,d>0?3.1*(1-Math.exp(-d/17)):Math.max(d*.085,h),bw);}
    const [w1,w2]=levelW(x,z);
    if(h>0){
      const s=slopeAt(x,z),sand=smooth(45,15,d)*smooth(8,3,h),rough=lerp(.35,1,smooth(.25,.9,s))*(1-.8*sand);
      h+=((fbm(x*.045+3,z*.045-7,3)-.5)*1.6+(fbm(x*.19,z*.19,2)-.5)*.45)*rough*smooth(.3,4,h)+(vnoise(x*.85,z*.85)-.5)*.07*smooth(.2,2,h);
      if(w1<1)h+=(fbm(x*.011+5,z*.011+1,3)-.5)*14*(1-w1)*smooth(5,60,h)*(.4+s);   // where only the 100 m grid exists: ridges and gullies it cannot hold
      if(sand>0)h+=Math.sin(x*.21+z*.06+fbm(x*.05,z*.05,2)*4)*.06*sand*smooth(4,14,d);  // wind ripples on the dunes
    }else{
      const off=-d,hb=smooth(1700,1000,Math.hypot(x-HOME_BAY.x,z-HOME_BAY.z));
      h+=(fbm(x*.08,z*.08,3)-.5)*.8*smooth(-.5,-4,h);
      if(hb>0){ // the fringing reef in the bay: a flat 2–4 m down from about 20 m to 65 m offshore, cut by spurs and grooves, then a drop-off
        const lv=shoreRock(x,z,d),flat=smooth(12,24,off)*smooth(68,54,off)*(1-.6*lv)*hb;
        const th=Math.atan2(x-HOME_BAY.x,z-HOME_BAY.z),spur=(fbm(x*.11+20,z*.11-8,3)-.5)*2.4+Math.max(0,Math.sin(th*90+fbm(x*.03,z*.03,2)*7))*1.2;
        h=lerp(h,Math.min(-3.4+spur*.75+(vnoise(x*.6,z*.6)-.5)*.35,-1.15),flat);
        const edge=off+(fbm(x*.05+31,z*.05-12,3)-.5)*16;
        if(edge>50)h=lerp(h,Math.min(h,-9-smooth(54,74,edge)*9+(fbm(x*.08,z*.08,2)-.5)*2.4),smooth(50,60,edge)*hb);
      }
    }
    return h;
  }
  // bare rock where the shore is steep (the boulder ends of a beach, sea cliffs): where ʻaʻama crabs live
  function shoreRock(x,z,d){if(d>60||d<-40)return 0;const s=slopeAt(x,z);return smooth(.35,.8,s)*smooth(60,10,Math.abs(d-5));}
  // ── the home river: from the hidden spring on the plateau, over Hiʻilawe's lip, down into the plunge pool, then along the floor of
  //    Waipiʻo Valley to the sea. Its course was traced downhill on the 5 m data (see terrain.json). ──
  const R=D.river,C=R.C;
  const lipC=C[R.iLip],footC=C[R.iFoot];
  const dd=(()=>{const dx=footC[0]-lipC[0],dz=footC[1]-lipC[1],l=Math.hypot(dx,dz);return{x:dx/l,z:dz/l};})(); // the way the water falls
  const LIP={x:lipC[0],z:lipC[1],h:dataH(lipC[0],lipC[1])};
  const footL=dataH(footC[0],footC[1]),WALL=.07; // the wall falls about 86°: 0.07 m out for every metre down, so a 450 m face is ~32 m deep, not one 5 m step
  const POOL=(()=>{const o=Math.max(17,(LIP.h-footL)*WALL+11);return{x:lipC[0]+dd.x*o,z:lipC[1]+dd.z*o,r:13};})(); // the pool lies at the foot of the wall
  const SPRING={x:C[0][0],z:C[0][1]};
  const poolL=Math.min(footL,dataH(POOL.x,POOL.z))-1.2;
  // the amphitheatre Hiʻilawe has cut: a sheer back wall under the lip, steep sides, and a gentle way out downstream
  function fallsCarve(x,z,h){
    const px=x-LIP.x,pz=z-LIP.z,s=px*dd.x+pz*dd.z,t=-px*dd.z+pz*dd.x;
    if(s<-30||s>260||Math.abs(t)>260)return h;
    const face=1.2+t*t/110+(fbm(x*.08,z*.08,2)-.5)*2.5                    // the wall curves back on both sides, and is ragged:
      +(fbm(t*.06+11,h*.004,3)-.5)*14;                                       // buttresses and gullies running down it
    const r=Math.hypot(x-POOL.x,z-POOL.z),dn=((x-POOL.x)*dd.x+(z-POOL.z)*dd.z)/Math.max(r,.01);
    const k=lerp(4.2,.16,smooth(.35,.85,dn));                              // steep sides and back, a gentle way out
    let bowl=r<POOL.r?poolL-4*Math.sqrt(1-Math.pow(r/POOL.r,2))-.05:poolL+.35+(r-POOL.r)*k+(fbm(x*.15,z*.15,2)-.5)*2*smooth(0,12,r-POOL.r);
    const drop=Math.max(0,h-poolL),W=Math.max(2.8,drop*WALL);               // how far out the foot is, from how high the face stands
    const front=smooth(face,face+W,s);
    return lerp(h,Math.min(h,bowl),front);
  }
  const P=[];{const iL=R.iLip; // control points → a smooth path every metre or so (no curve across the fall itself)
    const push=(a,b,n,spline,i)=>{for(let k=0;k<n;k++){const t=k/n;if(!spline){P.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);continue;}
      const p0=C[Math.max(0,i-1)],p1=C[i],p2=C[i+1],p3=C[Math.min(C.length-1,i+2)],t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
      P.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}};
    for(let i=0;i<iL;i++)push(C[i],C[i+1],Math.max(2,Math.round(Math.hypot(C[i+1][0]-C[i][0],C[i+1][1]-C[i][1])/1.2)),true,i);
    const inP=[POOL.x-dd.x*(POOL.r-3),POOL.z-dd.z*(POOL.r-3)];
    push([LIP.x,LIP.z],inP,8,false);
    const iFoot=R.iFoot;push(inP,[POOL.x,POOL.z],6,false);push([POOL.x,POOL.z],C[iFoot],Math.max(2,Math.round(Math.hypot(C[iFoot][0]-POOL.x,C[iFoot][1]-POOL.z)/1.2)),false);
    for(let i=iFoot;i<C.length-1;i++)push(C[i],C[i+1],Math.max(2,Math.round(Math.hypot(C[i+1][0]-C[i][0],C[i+1][1]-C[i][1])/1.2)),true,i);
    P.push(C[C.length-1]);}
  const RIVER={P};
  { // water level and width along the river, from the ground it runs over; always falling downhill
    const n=P.length,near=(x,z)=>{let b=0,bd=1e18;for(let i=0;i<n;i++){const d=(P[i][0]-x)**2+(P[i][1]-z)**2;if(d<bd){bd=d;b=i;}}return b;};
    const g=P.map(([x,z])=>fallsCarve(x,z,heightBase(x,z)));
    const iTop=near(LIP.x,LIP.z),iIn=iTop+8,iPool=near(POOL.x,POOL.z);
    const wl=new Float32Array(n),w=new Float32Array(n),dep=new Float32Array(n);
    const toMouth=new Float32Array(n);for(let i=n-2;i>=0;i--)toMouth[i]=toMouth[i+1]+Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]);
    wl[0]=g[0]-.6;
    for(let i=1;i<n;i++){
      if(i<=iTop)wl[i]=Math.min(wl[i-1]-.015,g[i]-.75);
      else if(i<iIn)wl[i]=lerp(wl[iTop],poolL,(i-iTop)/(iIn-iTop));          // the waterfall
      else if(i<=iPool+12)wl[i]=poolL;
      else wl[i]=Math.max(Math.min(toMouth[i]*.0009,wl[i-1]-.0005),Math.min(wl[i-1]-.004,g[i]-.55)); // the lower valley is nearly flat: the stream still runs to its mouth
    }
    for(let i=0;i<n;i++){w[i]=i<iTop?lerp(1.1,2.2,smooth(0,iTop,i)):i<iPool?2.4:lerp(3.2,8.5,smooth(iPool,n-1,i));dep[i]=i<iTop?.5:lerp(.7,1.3,smooth(iPool,n-1,i));}
    Object.assign(RIVER,{wl,w,dep,iTop,iIn,iPool,poolL,top:wl[iTop],springL:wl[0],toMouth});
    // nearest river point, on an 8 m grid around the river (searched locally by riverQ)
    let xa=1e9,xb=-1e9,za=1e9,zb=-1e9;for(const[x,z]of P){xa=Math.min(xa,x);xb=Math.max(xb,x);za=Math.min(za,z);zb=Math.max(zb,z);}
    const CS=8,M=48,x0=Math.floor((xa-M)/CS)*CS,z0=Math.floor((za-M)/CS)*CS,nx=Math.ceil((xb+M-x0)/CS)+1,nz=Math.ceil((zb+M-z0)/CS)+1;
    const idx=new Int32Array(nx*nz).fill(-1),bd=new Float32Array(nx*nz).fill(1e9),rr=Math.ceil(M/CS);
    for(let k=0;k<n;k++){const ci=Math.round((P[k][0]-x0)/CS),cj=Math.round((P[k][1]-z0)/CS);
      for(let j=cj-rr;j<=cj+rr;j++)for(let i=ci-rr;i<=ci+rr;i++){if(i<0||j<0||i>=nx||j>=nz)continue;const d=Math.hypot(x0+i*CS-P[k][0],z0+j*CS-P[k][1]);if(d<M&&d<bd[j*nx+i]){bd[j*nx+i]=d;idx[j*nx+i]=k;}}}
    Object.assign(RIVER,{CS,x0,z0,nx,nz,idx});
  }
  // where (x,z) lies against the river: distance to its centre line, the water level, width and depth there, and which way it flows
  function riverQ(x,z){
    const R_=RIVER,i=Math.round((x-R_.x0)/R_.CS),j=Math.round((z-R_.z0)/R_.CS);if(i<0||j<0||i>=R_.nx||j>=R_.nz)return null;
    const k=R_.idx[j*R_.nx+i];if(k<0)return null;const n=P.length;
    let best=null;
    for(let s=Math.max(0,k-14);s<Math.min(n-1,k+14);s++){const ax=P[s][0],az=P[s][1],bx=P[s+1][0],bz=P[s+1][1],ex=bx-ax,ez=bz-az,L2=ex*ex+ez*ez||1e-9;
      const t=clamp(((x-ax)*ex+(z-az)*ez)/L2,0,1),px=ax+ex*t,pz=az+ez*t,d=Math.hypot(x-px,z-pz);
      if(!best||d<best.d){const L=Math.sqrt(L2);best={d,s,t,fx:ex/L,fz:ez/L};}}
    if(!best||best.d>40)return null;
    const a=best.s,b=a+1,t=best.t;
    best.wl=lerp(RIVER.wl[a],RIVER.wl[b],t);best.w=lerp(RIVER.w[a],RIVER.w[b],t);best.dep=lerp(RIVER.dep[a],RIVER.dep[b],t);best.i=a+t;
    return best;
  }
  const smin=(a,b,k)=>{const q=clamp(.5+.5*(b-a)/k,0,1);return lerp(b,a,q)-k*q*(1-q);};
  // ── carving: the river's bed and banks, the falls' amphitheatre and pool, the spring's basin ──
  function heightRaw(x,z){
    let h=fallsCarve(x,z,heightBase(x,z));
    const q=riverQ(x,z);
    if(q&&q.d<q.w+22&&!(q.i>RIVER.iTop&&q.i<RIVER.iIn)){
      const floor=q.wl-q.dep*(1-Math.pow(Math.min(q.d/q.w,1),2))-.05,keepDry=smooth(40,90,RIVER.toMouth[Math.min(P.length-1,Math.round(q.i))]); // only its mouth dips below the sea
      if(q.d<q.w)h=Math.min(h,lerp(floor,Math.max(floor,.06),keepDry));
      else{const wall=q.wl+.25+(q.d-q.w)*(q.i<RIVER.iTop?.9:.42);h=smin(h,wall,1.4);if(q.d<q.w+2.5)h=Math.max(h,q.wl+.18*(1-(q.d-q.w)/2.5));}
    }
    const ds=Math.hypot(x-SPRING.x,z-SPRING.z);              // the spring's little pool
    if(ds<9){const L=RIVER.springL;if(ds<2.6)h=Math.min(h,L-.9*(1-ds/2.6)-.05);else h=smin(h,L+.25+(ds-2.6)*1.6,.8);}
    return h;
  }
  // ── the lanai: on the beach, just behind the sand, on flat ground well clear of the river; you arrive on the sand in front of it ──
  const site=(()=>{let best=null,bs=-1e9;
    for(let z=-60;z<=260;z+=4)for(let x=-700;x<=500;x+=4){const d=coastD(x,z);if(d<48||d>95)continue;const h=heightBase(x,z);if(h<2.2||h>9)continue;
      const q=riverQ(x,z);if(q&&q.d<70)continue;if(slopeAt(x,z)>.09)continue;if(shoreRock(x,z,d)>.1)continue;
      let f=0;for(const[a,b]of[[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,3]])f+=Math.abs(heightBase(x+a,z+b)-h);
      const sc=-f*4-Math.abs(d-62)*.08-Math.hypot(x,z)*.012;if(sc>bs){bs=sc;best={x,z};}}
    return best||{x:0,z:60};})();
  const seaward=(()=>{const e=6,gx=coastD(site.x+e,site.z)-coastD(site.x-e,site.z),gz=coastD(site.x,site.z+e)-coastD(site.x,site.z-e),l=Math.hypot(gx,gz)||1;return{x:-gx/l,z:-gz/l};})();
  const LANAI={x:site.x,z:site.z,w:5,d:4};
  const LANAI_H=heightRaw(LANAI.x,LANAI.z);
  let st={x:LANAI.x+seaward.x*30,z:LANAI.z+seaward.z*30};for(let k=0;k<20&&coastD(st.x,st.z)<16;k++){st.x-=seaward.x*2;st.z-=seaward.z*2;}
  const START={x:st.x,z:st.z,yaw:Math.atan2(-seaward.x,-seaward.z)};   // yaw 0 looks toward −z: here, out to sea
  function heightAt(x,z){
    const f=smooth(7.5,4,Math.hypot(x-LANAI.x,z-LANAI.z));
    const h=heightRaw(x,z);return f>0?lerp(h,LANAI_H,f):h;
  }
  function masks(x,z){
    const dx=x-HOME_BAY.x,dz=z-HOME_BAY.z,d=coastD(x,z),h=dataH(x,z),w=wetAt(x,z);
    // bare lava and cinder: above the tree line on the great mountains, on the dry leeward lava fields, and on rocky shores
    const alpine=smooth(2750,3300,h),dry=smooth(.33,.12,w)*smooth(.42,.6,fbm(x*.0009+2,z*.0009-3,3))*smooth(2300,1400,h)*smooth(5,60,d);
    const lava=Math.max(alpine,dry,shoreRock(x,z,d));
    return{r:Math.hypot(dx,dz),th:Math.atan2(dx,dz),d,lava,h,wet:w};
  }
  // where rainforest grows: windward and wet, between the beach and about 2,000 m, not on bare lava or sheer rock
  function forestW(x,z){const m=masks(x,z);if(m.d<20||m.h>2600)return 0;const s=slopeAt(x,z);
    return smooth(.42,.7,m.wet+(fbm(x*.004+3,z*.004,2)-.5)*.35)*smooth(40,110,m.d)*smooth(2300,1600,m.h)*smooth(1.6,1.0,s)*(1-m.lava)*smooth(70,120,Math.hypot(x-LANAI.x,z-LANAI.z));}
  function grassMask(x,z,h,m){return clamp(smooth(2.5,3.8,h)+smooth(30,48,m.d)*smooth(.3,.48,fbm(x*.07+3,z*.07,3)),0,1)*(1-m.lava)*smooth(3100,2600,h);}
  // how much of a mountain a spot is (metres-like, as the old mountainH: above 13 counts as the mountain zone)
  function mountainH(x,z){const h=dataH(x,z);if(h<40)return 0;const s=slopeAt(x,z);
    return 30*Math.max(smooth(1200,2200,h),smooth(.75,1.25,s)*smooth(40,120,h),smooth(.35,.6,s)*smooth(220,420,h));}
  function freshAt(x,z){
    if(Math.hypot(x-POOL.x,z-POOL.z)<POOL.r+.6)return RIVER.poolL;
    if(Math.hypot(x-SPRING.x,z-SPRING.z)<2.9)return RIVER.springL;
    const q=riverQ(x,z);return q&&q.d<q.w+.4&&q.wl>.02&&!(q.i>RIVER.iTop&&q.i<RIVER.iIn)?q.wl:null;
  }
  return{heightBase,heightRaw,heightAt,dataH,coastD,wetAt,slopeAt,shoreRock,fallsCarve,riverQ,freshAt,masks,forestW,grassMask,mountainH,
    RIVER,POOL,SPRING,LIP,LANAI,LANAI_H,START,HOME_BAY,dd};
}
const GROUND=makeGround(TERRAIN_DATA);
const {heightBase,heightRaw,heightAt,riverQ,freshAt,masks,forestW,grassMask,mountainH,RIVER,POOL,SPRING,LANAI,LANAI_H,START}=GROUND;

/* ───── landmarks ───── */
const SUN_AZ=new THREE.Vector2(-Math.cos(8*DEG),Math.sin(8*DEG));   // where the sun sets: just south of west (an autumn evening)
const PEAK=(()=>{const p=lonLatToWorld(-155.4681,19.8207);let b=p,bh=-1;      // Mauna Kea's summit, Puʻu Wēkiu (4,207 m)
  for(let dz=-150;dz<=150;dz+=10)for(let dx=-150;dx<=150;dx+=10){const h=heightAt(p.x+dx,p.z+dz);if(h>bh){bh=h;b={x:p.x+dx,z:p.z+dz};}}return{x:b.x,z:b.z};})();
const PEAK_H=heightAt(PEAK.x,PEAK.z);
const MAUNA_LOA=lonLatToWorld(-155.6082,19.4753);
const FOREST={x:LANAI.x+(POOL.x-LANAI.x)*.55,z:LANAI.z+(POOL.z-LANAI.z)*.55};   // deep in the valley, on the way to the falls
const DECK_Y=LANAI_H+.36;
const onDeck=(x,z)=>Math.abs(x-LANAI.x)<LANAI.w/2&&Math.abs(z-LANAI.z)<LANAI.d/2;
const groundAt=(x,z)=>onDeck(x,z)?DECK_Y:heightAt(x,z);
// the island's zones; zoneAt(x,z,y) also says 'undersea' when given a height below the sea surface
const ZONES={undersea:['Lalo o ke Kai','under the sea'],beach:['Kahakai','the beach'],mountain:['Kuahiwi','the mountain'],fountain:['Wailele','the waterfall pool'],forest:['Wao Nahele','the forest'],sea:['Ke Kai','the open sea']};
const FOREST_READY=true;
function zoneAt(x,z,y){
  if(Math.hypot(x-POOL.x,z-POOL.z)<POOL.r+18)return'fountain';
  const m=masks(x,z);
  if(y!=null&&y<-.6&&m.d<0)return'undersea';
  if(m.d<-14)return'sea';
  if(mountainH(x,z)>13)return'mountain';
  if(FOREST_READY&&forestW(x,z)>.4)return'forest';
  return'beach';
}
function surfaceAt(x,z){
  if(onDeck(x,z))return'wood'; const h=heightAt(x,z); if(h<.03)return'water'; const fw=freshAt(x,z); if(fw!=null&&fw>h+.03)return'water';
  const m=masks(x,z); if(m.lava>.5)return'rock'; if(GROUND.slopeAt(x,z)>1.1)return'rock'; return grassMask(x,z,h,m)>.5?'grass':h>6?'rock':'sand';
}

/* ───── the old island (a 640 m map, and before that a 320 m one): kept only to move old saves and old layouts onto Waipiʻo ─────
   oldToNew(x,z): a spot on the old 640 m map → the same spot relative to the lanai and the shore here (turned so the sea is still in
   front of the lanai). enlarge(x,z) now maps the first, smaller island straight here. */
const OLD=(()=>{
  const MAP=2,coastR=th=>58+3*Math.sin(3*th+1)+2*Math.sin(5*th+2.3)-14*Math.exp(-Math.pow(th/.75,2));
  const enlarge=(x,z)=>{const r=Math.hypot(x,z),th=Math.atan2(x,z),cR=coastR(th),d=cR-r,d2=d>0?d*(1+(MAP-1)*smooth(0,25,d)):d,r2=MAP*cR-d2;return{x:Math.sin(th)*r2,z:Math.cos(th)*r2};};
  const LANAI_OLD={x:9,z:27},LANAI=enlarge(9,27),START=enlarge(0,44.6),KNOLL=enlarge(6,-10);
  const northLobe=th=>{const a=Math.abs(Math.atan2(Math.sin(th-Math.PI),Math.cos(th-Math.PI)));return 62*Math.exp(-Math.pow(a/.8,2));};
  const coastAt=(th,S)=>S*coastR(th)+(S>1?northLobe(th):0);
  function height(x,z,S=MAP){const r=Math.hypot(x,z),th=Math.atan2(x,z),d=coastAt(th,S)-r;let h=d>0?2.2*(1-Math.exp(-d/14)):Math.max(-10,d*.13);
    const K=S>1?KNOLL:{x:6,z:-10},kd=Math.hypot(x-K.x,z-K.z);h+=(9.5+(S-1)*3.5)*Math.exp(-Math.pow(kd/(15+(S-1)*9),2))*smooth(0,6,d);
    const pk=Math.hypot(x+8,z+132);if(S>1)h+=74*Math.exp(-Math.pow(pk/57,2.1))*smooth(-2,7,d);return h;}
  return{MAP,coastR,enlarge,LANAI_OLD,LANAI,START,KNOLL,height};
})();
// the old map's sea lay toward +z from the lanai; here it lies along START's view. Turned in whole eighths, so buildings keep their own turns
const HOME_TURN=Math.round(Math.atan2(-Math.sin(START.yaw),-Math.cos(START.yaw))/(Math.PI/4))*(Math.PI/4);
function oldToNew(x,z){const ox=x-OLD.LANAI.x,oz=z-OLD.LANAI.z,a=HOME_TURN,c=Math.cos(a),s=Math.sin(a);
  // turn so the old seaward (+z) points along START.yaw, then sit it on the new lanai
  const rx=ox*c+oz*s,rz=-ox*s+oz*c;return{x:LANAI.x+rx,z:LANAI.z+rz};}
const enlarge=(x,z)=>{const p=OLD.enlarge(x,z);return oldToNew(p.x,p.z);};   // first island → here
const MAP=OLD.MAP;
const KNOLL=oldToNew(OLD.KNOLL.x,OLD.KNOLL.z);
const BEACH=(x,z)=>{const p=oldToNew(x+OLD.START.x,z+OLD.START.z-44.6);return[p.x,p.z];};          // things that lie on the beach where you arrive
const BY_LANAI=(x,z)=>{const p=oldToNew(x-9+OLD.LANAI.x,z-27+OLD.LANAI.z);return[p.x,p.z];};      // and those around the lanai
// coastAt(th): metres from the origin to the coast along a direction (x = sin th, z = cos th), up to 1.2 km (for older placement code)
function coastAt(th){const sx=Math.sin(th),sz=Math.cos(th),d0=GROUND.coastD(0,0);let r=0;const inl=d0>0;
  for(;r<1200;r+=6){const d=GROUND.coastD(sx*r,sz*r);if(inl?d<0:d>0)break;}return r;}
// a random spot on the home beach near the waterline, for things washed up by the sea (null if none found)
function shoreSpot(rand=Math.random){const sx=Math.sin(START.yaw),sz=Math.cos(START.yaw); // along the beach: walk seaward from a point behind it to the waterline
  for(let i=0;i<30;i++){const a=(rand()-.5)*900,bx=START.x+sz*a+sx*80,bz=START.z-sx*a+sz*80;let lo=0,hi=260;
    if(GROUND.coastD(bx,bz)<0)continue;for(let k=0;k<14;k++){const m=(lo+hi)/2;GROUND.coastD(bx-sx*m,bz-sz*m)>1.5+rand()*2?lo=m:hi=m;}
    const x=bx-sx*lo,z=bz-sz*lo,h=heightAt(x,z);if(h>.15&&h<1.2&&masks(x,z).lava<.2&&freshAt(x,z)==null&&!riverQ(x,z))return[x,z];}return null;}
// a random spot on the rocky shore near home (bare rock, just above the water), or null
function lavaSpot(rand=Math.random){for(let i=0;i<60;i++){const p=shoreSpotAny(rand);if(!p)continue;const [x,z]=p;if(masks(x,z).lava>.6&&heightAt(x,z)>.5)return p;}return null;}
function shoreSpotAny(rand){const x=START.x+(rand()-.5)*2400,z=START.z+(rand()-.5)*600,d=GROUND.coastD(x,z);return d>0&&d<14?[x,z]:null;}
// old saves (v1: the first island; v2: the 640 m map) → this island. Loose things and garden beds move one by one; each building moves as one piece
function migrateSave(d){
  const S=d.v===1?1:2,mv=(x,z)=>S===1?enlarge(x,z):oldToNew(x,z),turn=HOME_TURN;
  for(const o of d.items||[]){const p=mv(o.x,o.z);o.x=p.x;o.z=p.z;delete o.y;}
  d.fires={};
  for(const p of d.plots||[]){const q=mv(p.x,p.z);p.x=q.x;p.z=q.z;}
  const ps=d.pieces||[],grp=ps.map((_,i)=>i),top=i=>grp[i]===i?i:(grp[i]=top(grp[i]));
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(Math.hypot(ps[i].x-ps[j].x,ps[i].z-ps[j].z)<4.5)grp[top(i)]=top(j);
  const sets={};ps.forEach((p,i)=>(sets[top(i)]=sets[top(i)]||[]).push(p));
  for(const k in sets){const g=sets[k],cx=g.reduce((a,p)=>a+p.x,0)/g.length,cz=g.reduce((a,p)=>a+p.z,0)/g.length,to=mv(cx,cz),dy=heightAt(to.x,to.z)-OLD.height(cx,cz,S);
    const c=Math.cos(turn),s=Math.sin(turn);
    for(const p of g){const ox=p.x-cx,oz=p.z-cz;p.x=to.x+ox*c+oz*s;p.z=to.z-ox*s+oz*c;if(p.y!=null)p.y+=dy;if(p.r!=null)p.r=((p.r+Math.round(turn/(Math.PI/4)))%8+8)%8;}}
  d.v=3;
}

/* ───── named views of the home region, for the home-screen film and for tests ───── */
const HOME=(()=>{const f=GROUND.dd,P=RIVER.P;
  const mid=P[Math.round(RIVER.iPool+(P.length-RIVER.iPool)*.45)];
  return{
    start:{x:START.x,z:START.z,yaw:START.yaw},
    poolView:{x:POOL.x+f.x*70,z:POOL.z+f.z*70},          // downstream of the pool, looking back up at the falls
    valley:{x:mid[0],z:mid[1]},                           // the valley floor, half way from the pool to the sea
    lip:{x:GROUND.LIP.x-f.x*6,z:GROUND.LIP.z-f.z*6},      // the top of the falls
    lavaTube:{x:POOL.x-f.x*(POOL.r+4)+f.z*24,z:POOL.z-f.z*(POOL.r+4)-f.x*24}, // kept clear beside the falls, at the foot of the wall, for a lava tube's mouth
    peak:{x:PEAK.x,z:PEAK.z},maunaLoa:MAUNA_LOA,
  };})();

/* ───── legacy: a 640 m height grid around the origin (TERR, TGRASS, SIZE, SEG), for code not yet moved onto the functions.
   Nothing in the environment uses it any more; it will go away. ───── */
const SIZE=640,SEG=255;
const TERR=new Float32Array((SEG+1)*(SEG+1)),TGRASS=new Float32Array((SEG+1)*(SEG+1));
for(let j=0;j<=SEG;j++)for(let i=0;i<=SEG;i++){const x=-SIZE/2+i*SIZE/SEG,z=-SIZE/2+j*SIZE/SEG,h=heightAt(x,z),k=j*(SEG+1)+i;TERR[k]=h;
  TGRASS[k]=grassMask(x,z,h,masks(x,z))*(1-.7*forestW(x,z))*smooth(.9,.55,GROUND.slopeAt(x,z));}
