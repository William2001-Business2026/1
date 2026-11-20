/* ───────────────────────── island shape ───────────────────────── */
// x = east, z = south. Sun sets west-south-west, over the bay.
const SUN_AZ=new THREE.Vector2(-Math.cos(48*DEG),Math.sin(48*DEG));   // horizontal direction toward the sunset
// The island is twice as wide as it first was (MAP). Functions that take S can still draw the first, smaller island (S=1);
// that is only used to move a saved island from the old map onto this one.
const MAP=2;
function coastR(th){return 58+3*Math.sin(3*th+1)+2*Math.sin(5*th+2.3)-14*Math.exp(-Math.pow(th/.75,2));} // shape of the coast, at S=1
// where a spot on the first island lies on this one: twice as far from the centre inland, the same distance from the water at the shore
function enlarge(x,z){const r=Math.hypot(x,z),th=Math.atan2(x,z),cR=coastR(th),d=cR-r;
  const d2=d>0?d*(1+(MAP-1)*smooth(0,25,d)):d,r2=MAP*cR-d2;return{x:Math.sin(th)*r2,z:Math.cos(th)*r2};}
const LANAI_OLD={x:9,z:27},KNOLL_OLD={x:6,z:-10};
const LANAI={...enlarge(LANAI_OLD.x,LANAI_OLD.z),w:5,d:4};
const KNOLL=enlarge(KNOLL_OLD.x,KNOLL_OLD.z);
const START=enlarge(0,44.6);
const BEACH=(x,z)=>[x+START.x,z+START.z-44.6];                                    // things that lie on the beach where you arrive keep their places around you
const BY_LANAI=(x,z)=>[x+LANAI.x-LANAI_OLD.x,z+LANAI.z-LANAI_OLD.z];               // and those around the lanai keep theirs around it
function masks(x,z,S=MAP){
  const r=Math.hypot(x,z),th=Math.atan2(x,z),d=coastAt(th,S)-r;
  let dth=th+Math.PI/2; if(dth>Math.PI)dth-=2*Math.PI;
  const lava=smooth(1.25,.75,Math.abs(dth))*smooth(30*S,16*S,d);
  return{r,th,d,lava};
}
// ── zones: a fluted mountain to the north, a river from a hidden spring through a waterfall pool to the sea, forest to the east ──
// (all of it only on the larger island, S>1; S=1 still draws the first island exactly, for moving old saves)
const PEAK={x:-8,z:-132},PEAK_H=74;                     // Kuahiwi, the mountain
const POOL={x:36,z:-70,r:10};                           // Wailele, the waterfall pool
const SPRING={x:30,z:-112};                            // the hidden spring
const FOREST={x:68,z:-4};                               // Wao Nahele, the forest, on the east side
function northLobe(th){const a=Math.abs(Math.atan2(Math.sin(th-Math.PI),Math.cos(th-Math.PI)));return 62*Math.exp(-Math.pow(a/.8,2));} // the mountain pushes the coast north
function coastAt(th,S){return S*coastR(th)+(S>1?northLobe(th):0);}
function mountainH(x,z){
  const dx=x-PEAK.x,dz=z-PEAK.z,r=Math.hypot(dx,dz);if(r>150)return 0;const a=Math.atan2(dx,dz);
  const base=PEAK_H*Math.exp(-Math.pow(r/57,2.1));                 // a rounded summit and steep flanks
  // Hawaiian fluted ridges: knife-edged spurs running down from the summit, with rounded valleys between them
  const ridge=1-Math.abs(Math.sin(a*7+fbm(x*.02+3,z*.02,2)*3.2)),ridge2=1-Math.abs(Math.sin(a*17+fbm(x*.05,z*.05+9,2)*4));
  const cut=(1-Math.pow(ridge,1.6))*.26+(1-ridge2)*.04;
  return base*(1-cut*smooth(10,44,r)*smooth(140,60,r))+(fbm(x*.06+40,z*.06-7,3)-.5)*4*smooth(90,20,r);
}
// the river: control points from the spring down to the sea; the water level along it is worked out from the ground below
const RIVER=(()=>{
  const C=[[30,-112],[28.5,-103],[27.5,-95],[27.5,-88],[28.5,-82.5],[30.5,-78],[36,-70],[46,-60],[58,-50],[71,-43],[84,-38],[97,-33],[110,-29],[124,-26],[140,-23]];
  const P=[];for(let i=0;i<C.length-1;i++){const p0=C[Math.max(0,i-1)],p1=C[i],p2=C[i+1],p3=C[Math.min(C.length-1,i+2)];
    const L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),n=Math.max(2,Math.round(L));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;const f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
      P.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  P.push(C[C.length-1]);
  return {P};
})();
function heightBase(x,z,S=MAP){
  const {th,d,lava}=masks(x,z,S);
  const bay=Math.exp(-Math.pow(th/.9,2));
  let h=d>0?2.2*(1-Math.exp(-d/14)):Math.max(-10,d*lerp(.17,.085,bay));
  if(d>0)h+=(fbm(x*.09,z*.09,3)-.45)*.5*smooth(2,14,d)+(fbm(x*.6,z*.6,2)-.45)*.05;
  if(lava>0){
    const rough=Math.abs(fbm(x*.22,z*.22,4)-.5)*2;
    let hl=.95+rough*.9+Math.max(0,d-8)*.05-smooth(2.5,-5,d)*4.6+Math.min(0,d+5)*.22;
    const pool=vnoise(x*.21+7,z*.21+3); if(d>3&&d<22*S&&pool>.66)hl-=Math.min(1.5,(pool-.66)*9);
    h=lerp(h,hl,lava);
  }
  if(S>1&&d>0)h+=(S-1)*(fbm(x*.022+11,z*.022-4,3)-.45)*3*smooth(14,48,d)*(1-lava); // rolling ground across the wider interior
  if(S>1&&d<0){ // the fringing reef: a flat 2–4 m down from about 20 m to 60 m offshore, cut by spurs and grooves, then a drop-off to 18 m
    const off=-d,flat=smooth(12,24,off)*smooth(68,54,off)*(1-.5*lava);
    const spur=(fbm(x*.11+20,z*.11-8,3)-.5)*2.4+Math.max(0,Math.sin(th*64+fbm(x*.03,z*.03,2)*7))*1.2;
    h=lerp(h,Math.min(-3.4+spur*.75+(vnoise(x*.6,z*.6)-.5)*.35,-1.15),flat);
    const edge=off+(fbm(x*.05+31,z*.05-12,3)-.5)*16;                                          // the drop-off wanders in and out
    if(edge>50)h=lerp(h,Math.min(h,-9-smooth(54,74,edge)*9+(fbm(x*.08,z*.08,2)-.5)*2.4),smooth(50,60,edge));
  }
  const K=S>1?KNOLL:KNOLL_OLD,kd=Math.hypot(x-K.x,z-K.z),lump=(S-1)*(fbm(x*.045+5,z*.045-2,3)-.5); // the larger knoll is lumpier, not a smooth dome
  h+=(9.5+(S-1)*3.5)*(1+lump*.5)*Math.exp(-Math.pow(kd/((15+(S-1)*9)*(1+lump*.45)),2))*smooth(0,6,d);
  if(S>1)h+=mountainH(x,z)*smooth(-2,7,d);                  // sea cliffs where the mountain meets the coast
  return h;
}
// water level and width along the river, from the ground it runs over
(()=>{const P=RIVER.P,n=P.length,g=P.map(([x,z])=>heightBase(x,z)),near=(x,z)=>{let b=0,bd=1e9;P.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-z);if(d<bd){bd=d;b=i;}});return b;};
  const iTop=near(28.5,-82.5),iPool=near(POOL.x,POOL.z),iIn=near(30.8,-77.6);
  const poolL=g[iPool]-4.2,wl=new Float32Array(n),w=new Float32Array(n),dep=new Float32Array(n);
  wl[0]=g[0]-.7;
  for(let i=1;i<n;i++){
    if(i<=iTop)wl[i]=Math.min(wl[i-1]-.08,g[i]-1.1);
    else if(i<iIn)wl[i]=lerp(wl[iTop],poolL,(i-iTop)/(iIn-iTop));        // the waterfall
    else if(i<=iPool+4)wl[i]=poolL;
    else wl[i]=Math.max(0,Math.min(wl[i-1]-.012,g[i]-.9));
  }
  for(let i=0;i<n;i++){const s=i/(n-1);w[i]=i<iTop?lerp(1.1,1.8,i/iTop):i<iPool?lerp(1.8,2.9,smooth(iTop,iIn,i)):lerp(2.6,5.5,smooth(iPool,n,i));dep[i]=i<iTop?.55:i<iPool?.6:lerp(1,1.4,smooth(iPool,n,i));}
  Object.assign(RIVER,{wl,w,dep,iTop,iIn,iPool,poolL,top:wl[iTop],springL:wl[0]});
  // nearest river point for every square metre around it
  const x0=-60,z0=-170,nx=230,nz=170,idx=new Int16Array(nx*nz).fill(-1);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=x0+i+.5,z=z0+j+.5;let b=-1,bd=24*24;
    for(let k=0;k<n;k+=1){const dx=P[k][0]-x,dz=P[k][1]-z,d=dx*dx+dz*dz;if(d<bd){bd=d;b=k;}}idx[j*nx+i]=b;}
  Object.assign(RIVER,{x0,z0,nx,nz,idx});
})();
// where (x,z) lies against the river: distance to its centre line, the water level, width and depth there, and which way it flows
function riverQ(x,z){
  const R_=RIVER,i=Math.floor(x-R_.x0),j=Math.floor(z-R_.z0);if(i<0||j<0||i>=R_.nx||j>=R_.nz)return null;
  const k=R_.idx[j*R_.nx+i];if(k<0)return null;const P=R_.P,n=P.length;
  let best=null;
  for(let s=Math.max(0,k-2);s<Math.min(n-1,k+2);s++){const ax=P[s][0],az=P[s][1],bx=P[s+1][0],bz=P[s+1][1],ex=bx-ax,ez=bz-az,L2=ex*ex+ez*ez;
    const t=clamp(((x-ax)*ex+(z-az)*ez)/L2,0,1),px=ax+ex*t,pz=az+ez*t,d=Math.hypot(x-px,z-pz);
    if(!best||d<best.d){const L=Math.sqrt(L2);best={d,s,t,fx:ex/L,fz:ez/L};}}
  const a=best.s,b=a+1,t=best.t;
  best.wl=lerp(R_.wl[a],R_.wl[b],t);best.w=lerp(R_.w[a],R_.w[b],t);best.dep=lerp(R_.dep[a],R_.dep[b],t);best.i=a+t;
  return best;
}
const smin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return lerp(b,a,h)-k*h*(1-h);};
function heightRaw(x,z,S=MAP){
  let h=heightBase(x,z,S);if(S===1)return h;
  const q=riverQ(x,z);
  if(q&&q.d<q.w+18){
    if(q.d<q.w)h=q.wl-q.dep*(1-Math.pow(q.d/q.w,2))-.05;
    else{const wall=q.wl+.25+(q.d-q.w)*(q.i<RIVER.iPool?.9:.45);h=smin(h,wall,1.2);if(q.d<q.w+2.5)h=Math.max(h,q.wl+.18*(1-(q.d-q.w)/2.5));}
  }
  const dp=Math.hypot(x-POOL.x,z-POOL.z);                  // the pool's basin
  if(dp<POOL.r+14){const L=RIVER.poolL,k=lerp(1.1,2.3,smooth(-.3,.5,(POOL.z-z)/Math.max(dp,.01))); // cliffs behind the waterfall, a gentle shore to the south
    if(dp<POOL.r)h=Math.min(h,L-3.2*Math.sqrt(1-Math.pow(dp/POOL.r,2))-.05);else h=smin(h,L+.3+(dp-POOL.r)*k,2.4);}
  const ds=Math.hypot(x-SPRING.x,z-SPRING.z);              // the spring's little pool
  if(ds<9){const L=RIVER.springL;if(ds<2.6)h=Math.min(h,L-.9*(1-ds/2.6)-.05);else h=smin(h,L+.25+(ds-2.6)*1.6,.8);}
  return h;
}
// the fresh-water surface at (x,z), or null where there is none
function freshAt(x,z){
  if(Math.hypot(x-POOL.x,z-POOL.z)<POOL.r+.6)return RIVER.poolL;
  if(Math.hypot(x-SPRING.x,z-SPRING.z)<2.9)return RIVER.springL;
  const q=riverQ(x,z);return q&&q.d<q.w+.4&&q.wl>.02?q.wl:null;
}
const LANAI_H=heightRaw(LANAI.x,LANAI.z),LANAI_H_OLD=heightRaw(LANAI_OLD.x,LANAI_OLD.z,1);
function heightAt(x,z,S=MAP){
  const L=S>1?LANAI:LANAI_OLD,f=smooth(7.5,4,Math.hypot(x-L.x,z-L.z));
  const h=heightRaw(x,z,S); return f>0?lerp(h,S>1?LANAI_H:LANAI_H_OLD,f):h;
}
const DECK_Y=LANAI_H+.36;
const onDeck=(x,z)=>Math.abs(x-LANAI.x)<LANAI.w/2&&Math.abs(z-LANAI.z)<LANAI.d/2;
const groundAt=(x,z)=>onDeck(x,z)?DECK_Y:heightAt(x,z);
function grassMask(x,z,h,m){return clamp(smooth(2.5,3.8,h)+smooth(24,34,m.d)*smooth(.3,.48,fbm(x*.07+3,z*.07,3)),0,1)*(1-m.lava);}
// the island's zones (the forest joins in once its trees are planted)
const ZONES={undersea:['Lalo o ke Kai','under the sea'],beach:['Kahakai','the beach'],mountain:['Kuahiwi','the mountain'],fountain:['Wailele','the waterfall pool'],forest:['Wao Nahele','the forest'],sea:['Ke Kai','the open sea']};
const FOREST_READY=true;
function zoneAt(x,z){
  if(Math.hypot(x-POOL.x,z-POOL.z)<POOL.r+18)return'fountain';
  if(mountainH(x,z)>13)return'mountain';
  const m=masks(x,z);if(m.d<-14)return'sea';
  if(FOREST_READY&&forestW(x,z)>.4)return'forest';
  return'beach';
}
function surfaceAt(x,z){
  if(onDeck(x,z))return'wood'; const h=heightAt(x,z); if(h<.03)return'water'; const fw=freshAt(x,z); if(fw!=null&&fw>h+.03)return'water';
  const m=masks(x,z); if(m.lava>.5)return'rock'; return grassMask(x,z,h,m)>.5?'grass':h>6?'rock':'sand';
}

