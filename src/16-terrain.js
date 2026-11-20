/* ───────────────────────── terrain ───────────────────────── */
const SIZE=640,SEG=511; // terrain: 640 m square, 512×512 points (1.25 m apart)
const TERR=new Float32Array((SEG+1)*(SEG+1)),TGRASS=new Float32Array((SEG+1)*(SEG+1)); // its heights (shared with the sea shader and the physics ground) and where grass grows
{
  const g=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG); g.rotateX(-Math.PI/2);
  const pos=g.attributes.position,col=new Float32Array(pos.count*3),am=new Float32Array(pos.count);
  const cLitter=srgb(.2,.19,.11),cReef=srgb(.5,.47,.38),cReef2=srgb(.36,.36,.27),cCliff=srgb(.33,.31,.28),cMoss=srgb(.2,.25,.12),cSand=srgb(.88,.76,.56),cWet=srgb(.58,.48,.35),cGrass=srgb(.24,.33,.13),cDry=srgb(.45,.42,.22),cLava=srgb(.085,.08,.08),cLava2=srgb(.17,.15,.14),t=new THREE.Color();
  for(let i=0;i<pos.count;i++){const h=heightAt(pos.getX(i),pos.getZ(i));pos.setY(i,h);TERR[i]=h;}
  g.computeVertexNormals();const nrm=g.attributes.normal;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),h=TERR[i];
    const m=masks(x,z);
    const gorge=(()=>{const P=RIVER.P,a=P[RIVER.iTop],b=P[RIVER.iIn],dx=x-(a[0]+b[0])/2,dz=z-(a[1]+b[1])/2;return smooth(16,6,Math.hypot(dx,dz)+fbm(x*.3,z*.3,2)*5)*smooth(.95,.7,nrm.getY(i));})();
    const rock=Math.max(smooth(.56,.3,nrm.getY(i))*smooth(3,8,h),gorge);                       // bare rock only on cliffs (and the gorge the waterfall has cut); the ridges are green to the top, as in Hawaii
    const wetBank=(()=>{const q=riverQ(x,z),dp=Math.hypot(x-POOL.x,z-POOL.z);return Math.max(q?smooth(q.w+4,q.w,q.d):0,smooth(POOL.r+5,POOL.r,dp));})();
    t.copy(cSand).lerp(cWet,smooth(.34,.05,h)*.8);
    t.multiplyScalar(.93+.12*fbm(x*.4,z*.4,2));
    const gm=grassMask(x,z,h,m)*(1-rock)*(1-wetBank*.85); TGRASS[i]=gm; if(gm>0){const gc=cGrass.clone().lerp(cDry,fbm(x*.15,z*.15,3));t.lerp(gc,gm);}
    const reef=smooth(-1,-2.6,h)*smooth(10,24,-m.d)*smooth(.38,.55,fbm(x*.09+4,z*.09-6,3)+(h>-4.2?.12:-.1));  // the reef floor: coral rubble and rock, sand in the grooves
    const rk=Math.max(smooth(.25,.6,m.lava),smooth(.3,.7,rock),reef*.9);
    if(rk>0){const lc=reef>.3&&m.lava<.25?cReef.clone().lerp(cReef2,fbm(x*.4,z*.4,3)):m.lava>.25?cLava.clone().lerp(cLava2,fbm(x*.5,z*.5,3)):cCliff.clone().lerp(cMoss,smooth(.4,.65,fbm(x*.3,z*.3+5,3)));t.lerp(lc,rk);} // weathered, mossy cliffs
    const fw=forestW(x,z);if(fw>0){t.lerp(cLitter,fw*.75);TGRASS[i]*=1-.7*fw;}                         // under the trees: dark leaf litter, little grass
    if(wetBank>0)t.multiplyScalar(1-.3*wetBank);                                               // dark, damp ground along the water
    am[i]=Math.max(gm,rk*2,wetBank*.7);col[i*3]=t.r;col[i*3+1]=t.g;col[i*3+2]=t.b;
  }
  g.setAttribute('aMat',new THREE.BufferAttribute(am,1));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const tex=grainTex.clone(); tex.repeat.set(180,180); tex.needsUpdate=true;
  const mat=new THREE.MeshStandardNodeMaterial({roughness:1,metalness:0});
  {
    const {Fn,If,attribute,texture,float,vec2,vec3,vec4,dot,floor,mix,clamp,max,pow,sin,sqrt,normalize,length,reflect,abs,step,cross,positionWorld,cameraPosition,cameraViewMatrix,normalWorldGeometry,diffuseColor}=TSL;
    const vMat=attribute('aMat','float'),vCol=attribute('color','vec3'),wp=positionWorld;
    // four scanned materials blended by the island's masks: dry sand, wet sand at the waterline, grassy ground, lava rock
    const lavaM=sstep(1.3,1.9,vMat),grassM=sstep(0,.5,vMat).mul(float(1).sub(lavaM)).mul(sstep(-.8,.2,positionWorld.y)),sandM=max(float(1).sub(grassM).sub(lavaM),0);
    const damp=sstep(.36,.2,wp.y),wetM=sandM.mul(damp),dryM=sandM.mul(float(1).sub(damp));
    // [weight, material, metres per repeat, albedo gain (the scanned sand is grey temperate sand; coral sand is paler; the soil under the grass is
    //  greened to the blades' own colour, so grass and ground read as one)]
    const rockLift=clamp(dot(vCol,vec3(.2126,.7152,.0722)).div(.016),1,6); // cliffs are paler weathered rock than the black lava
    const LAYERS=[[dryM,'sand',3.2,1.55],[wetM,'wetsand',3.2,1.1],[grassM,'grass',2.6,vec3(.62,.92,.5)],[lavaM,'rock',3.6,rockLift]].map(([w,n,sc,g])=>({w,t:pbrTex(n),sc,g}));
    // each layer is only sampled where it shows
    const blend=(pick,init)=>Fn(()=>{const acc=init.toVar();
      for(const L of LAYERS)If(L.w.greaterThan(.002),()=>{acc.addAssign(pick(L,wp.xz.div(L.sc)).mul(L.w));});return acc;})();
    const macro=vn(wp.xz.mul(.045)).mul(.3).add(.85).mul(mix(1,vn(wp.xz.mul(.13)).mul(.5).add(.72),grassM)); // breaks up tiling over large areas; patchier under grass
    const tint=mix(vec3(1),vCol.div(max(dot(vCol,vec3(.2126,.7152,.0722)),.05)),.22); // keep the island's dry/green and sand-warmth variation
    const spray=(()=>{const P=RIVER.P,a=P[RIVER.iTop],b=P[RIVER.iIn],m=vec2((a[0]+b[0])/2,(a[1]+b[1])/2);
      return sstep(11,3,length(wp.xz.sub(m)).add(vn(wp.xz.mul(.7)).mul(2.5))).mul(sstep(RIVER.top+2.5,RIVER.top-.5,wp.y));})(); // the rock the spray keeps wet
    const puddle=sstep(.6,.7,vn(wp.xz.mul(.16).add(7)).add(vn(wp.xz.mul(.5)).mul(.15))).mul(sstep(.975,.995,normalWorldGeometry.y)).mul(sstep(.3,.9,U.uWet)).mul(float(1).sub(lavaM)).mul(sstep(.5,1.2,wp.y)); // rain pools in the flat hollows
    mat.colorNode=vec4(blend((L,q)=>texture(L.t.a,q).rgb.mul(L.g),vec3(0)).mul(tint).mul(macro).mul(mix(1,.82,wetM)).mul(mix(1,.68,U.uWet.mul(sstep(-.2,.4,wp.y)))).mul(mix(1,.45,puddle)).mul(mix(1,.78,sstep(.5,1,vMat).mul(float(1).sub(lavaM)))).mul(mix(1,.5,spray)),1); // and shaded where the grass is thick
    const nr=blend((L,q)=>texture(L.t.n,q).rgb,vec3(0));
    const ph0=U.uTime.mul(.7).add(vn(wp.xz.mul(.045)).mul(7));
    const gloss=clamp(sstep(.25,.07,wp.y).mul(sin(ph0.sub(1.3)).mul(.5).add(.5)),0,1); // the film of water left by each wave
    mat.roughnessNode=mix(nr.z,.12,gloss.mul(sandM).mul(.9)).mul(mix(1,.7,wetM)).mul(mix(1,.55,U.uWet)).mul(mix(1,.06,puddle)).mul(mix(1,.22,spray));
    mat.normalNode=Fn(()=>{ // tangent space follows the ground: X along world X, Y along world Z
      const N=normalWorldGeometry,T=normalize(vec3(1,0,0).sub(N.mul(N.x))),B=cross(T,N);
      const t=nr.xy.mul(2).sub(1),tz=sqrt(max(float(1).sub(dot(t,t)),0));
      const n=normalize(T.mul(t.x).add(B.mul(t.y)).add(N.mul(tz)));
      return normalize(cameraViewMatrix.mul(vec4(mix(n,N,puddle),0)).xyz);                 // a puddle's surface is flat
    })();
    mat.emissiveNode=Fn(()=>{
      const e=vec3(0).toVar(),dist=length(cameraPosition.sub(wp));
      If(dist.lessThan(16).and(sandM.greaterThan(.001)),()=>{ // sun glints on sand grains
        const Vw=normalize(cameraPosition.sub(wp)),cell=floor(wp.xz.mul(240)),hs=hash21(cell);
        const gn=normalize(vec3(hash21(cell.add(3)).sub(.5),.55,hash21(cell.add(7)).sub(.5)));
        const gl=step(.982,hs).mul(pow(max(dot(reflect(Vw.negate(),gn),U.uSunDir),0),30)).mul(float(1).sub(sstep(2,16,dist)));
        e.addAssign(U.uSunDisc.mul(gl).mul(.035).mul(dryM));
      });
      const uw=sstep(0,-.3,wp.y).mul(sstep(mix(-3.5,-18,U.uUnder),-.4,wp.y)).mul(mix(1,3,U.uUnder));
      If(uw.greaterThan(0),()=>{ // caustics in the shallows
        const c1=vn(wp.xz.mul(2.1).add(vec2(U.uTime.mul(.33),U.uTime.mul(.2)))),c2=vn(wp.xz.mul(2.7).sub(vec2(U.uTime.mul(.27),U.uTime.mul(.38))));
        e.addAssign(U.uSunDisc.mul(.03).mul(pow(float(1).sub(abs(c1.sub(c2))),7)).mul(uw).mul(diffuseColor.rgb));
      });
      return e;
    })();
  }
  const mesh=new THREE.Mesh(g,mat); mesh.receiveShadow=true; mesh.castShadow=true; scene.add(mesh);
  // height map for the water shader
  const N=SEG+1,data=new Uint16Array(N*N);
  for(let i=0;i<N*N;i++)data[i]=THREE.DataUtils.toHalfFloat(TERR[i]);
  const ht=new THREE.DataTexture(data,N,N,THREE.RedFormat,THREE.HalfFloatType); ht.magFilter=ht.minFilter=THREE.LinearFilter; ht.needsUpdate=true;
  U.uHeight.value=ht;
}

