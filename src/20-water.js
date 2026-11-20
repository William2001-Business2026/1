/* ───────────────────────── ocean ───────────────────────── */
const waterMat=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false});
{
  const {min,Fn,If,Loop,texture,float,vec2,vec3,vec4,dot,mix,clamp,max,pow,exp,sin,cos,normalize,length,distance,reflect,abs,select,positionGeometry,cameraPosition,modelWorldMatrix,varyingProperty}=TSL;
  const hTex=U.uHeight.value,vW=varyingProperty('vec3','vW');
  const groundH=(p,vertex)=>{const q=p.div(SIZE).add(.5),t=texture(hTex,q);
    return select(q.x.lessThan(0).or(q.x.greaterThan(1)).or(q.y.lessThan(0)).or(q.y.greaterThan(1)),float(-10),(vertex?t.level(0):t).r);};
  waterMat.positionNode=Fn(()=>{ // the sea mesh only ever moves up and down, so local and world differ by a translation
    const w=modelWorldMatrix.mul(vec4(positionGeometry,1)).xyz;const d0=max(groundH(w.xz,true).negate(),0);
    const sh=pow(sin(wavePh(w.xz,d0)).mul(.5).add(.5),3);
    const dy=waveAmp(d0).mul(sh).add(sin(dot(w.xz,vec2(.045,.03)).add(U.uTime.mul(.5))).mul(.07).mul(sstep(3,14,d0)));
    vW.assign(w.add(vec3(0,dy,0)));
    return positionGeometry.add(vec3(0,dy,0));
  })();
  const wh=Fn(([p,d])=>{const t=U.uTime;
    return vn(p.mul(.33).add(vec2(t.mul(.22),t.mul(.16)))).mul(float(1).sub(sstep(400,1500,d)))
      .add(vn(p.mul(.9).add(vec2(t.mul(-.28),t.mul(.36)))).mul(.45).mul(float(1).sub(sstep(120,500,d))))
      .add(vn(p.mul(2.4).add(vec2(t.mul(.55),t.mul(-.45)))).mul(.17).mul(float(1).sub(sstep(35,150,d))))
      .add(vn(p.mul(6.3).sub(t.mul(.8))).mul(.06).mul(float(1).sub(sstep(10,50,d))));}); // inlined (uses a uniform)
  waterMat.colorNode=Fn(()=>{
    const p=vW.xz,toCam=cameraPosition.sub(vW),dist=length(toCam),V=toCam.div(dist);
    const gh=groundH(p,false),depth=vW.y.sub(gh),d0=max(gh.negate(),0);
    const ph=wavePh(p,d0),sh=pow(sin(ph).mul(.5).add(.5),3);
    const S=float(.55).mul(mix(1,.3,sstep(15,420,dist))).mul(mix(.35,1,sstep(0,2.5,depth)));
    const e=.14,h0=wh(p,dist);
    const ws=cos(ph).mul(pow(sin(ph).mul(.5).add(.5),2)).mul(waveAmp(d0)).mul(2.2).mul(sstep(4,.3,d0));
    const np=normalize(p);
    const N=normalize(vec3(h0.sub(wh(p.add(vec2(e,0)),dist)).mul(S).div(e).sub(ws.mul(np.x)),1,h0.sub(wh(p.add(vec2(0,e)),dist)).mul(S).div(e).sub(ws.mul(np.y))));
    const Rf0=reflect(V.negate(),N),Rf=vec3(Rf0.x,abs(Rf0.y),Rf0.z);
    const F=float(.02).add(pow(float(1).sub(max(dot(N,V),0)),5).mul(.98));
    const body=mix(vec3(.07,.50,.47),vec3(.006,.07,.17),float(1).sub(exp(max(depth,0).mul(-.3)))).mul(U.uDay);
    const refl=skyRad(Rf),sr=max(dot(Rf,U.uSunDir),0),far=sstep(50,600,dist);
    const col=mix(body,refl,F).add(U.uSunDisc.mul(pow(sr,420).mul(.2).add(pow(sr,mix(36,90,far)).mul(mix(.012,.05,far))))).toVar();
    const alpha=max(clamp(float(1).sub(exp(max(depth,0).mul(-1.5))),0,1),F).toVar();
    const bio=vec3(.02,.36,1);
    If(d0.lessThan(1.6),()=>{ // surf: a breaking crest, the lace it leaves behind, and the wet edge
      const n2=vn(p.mul(7).add(vec2(U.uTime.mul(.25),0))).mul(.6).add(vn(p.mul(19).sub(vec2(0,U.uTime.mul(.3)))).mul(.4));
      const crest=sstep(.62,.97,sh).mul(sstep(1.5,.55,d0)).mul(sstep(-.02,.1,depth));
      const trail=pow(sin(ph.sub(1.1)).mul(.5).add(.5),3).mul(sstep(1.1,0,d0)).mul(.6);
      const edge=sstep(.07,0,depth).mul(.8);
      const foam=clamp(crest.add(edge).mul(sstep(.1,.55,n2.add(crest.mul(.35)))).add(trail.mul(sstep(.42,.7,n2))),0,1).mul(sstep(-.02,.02,depth));
      col.assign(mix(col,vec3(.95).mul(U.uDay.add(.12)),foam.mul(.85).mul(float(1).sub(U.uBio.mul(.7)))).add(bio.mul(U.uBio).mul(foam).mul(2.4)));
      alpha.assign(max(alpha,foam));
    });
    If(U.uBio.greaterThan(.001),()=>{ // bioluminescence, and rings where something touched the water
      col.addAssign(bio.mul(U.uBio).mul(sstep(.93,1,vn(p.mul(9).add(U.uTime.mul(.4))))).mul(sstep(3,0,depth)).mul(.5));
      Loop(8,({i})=>{const rp=uRipplesNode.element(i),age=U.uTime.sub(rp.z);
        If(age.greaterThan(0).and(age.lessThan(5)),()=>{const r=distance(p,rp.xy),k=r.sub(age.mul(.9)).div(.12);
          col.addAssign(bio.mul(U.uBio).mul(exp(k.mul(k).negate()).add(exp(r.mul(r).mul(-3)).mul(.6))).mul(exp(age.mul(-1.1))).mul(4));});});
    });
    const hz=skyRad(normalize(vec3(V.x.negate(),.015,V.z.negate())));
    col.assign(mix(col,hz,sstep(500,4300,dist).mul(.92)));
    const under=cameraPosition.y.lessThan(vW.y),cv=abs(dot(N,V));
    const uc=mix(U.uFogCol.div(U.uDay.add(.08).max(.05)).mul(.8),grey(skyBase(normalize(vec3(V.x.negate(),abs(V.y),V.z.negate())))).mul(.9).add(vec3(.02,.1,.1)),sstep(.55,.8,cv)).mul(U.uDay.add(.08));
    const nearTop=sstep(3,.4,cameraPosition.y.sub(vW.y)).mul(sstep(28,6,dist));      // swimming at the surface you can see down to the reef
    const ucF=mix(uc.add(U.uSunDisc.mul(pow(max(dot(V.negate(),U.uSunDir),0),220).mul(.1))),U.uFogCol,sstep(4,45,dist));   // fades into the haze with distance
    return select(under,vec4(ucF,.97),vec4(col,mix(alpha,max(min(alpha,.5),F),nearTop)));
  })();
}
function seaGeometry(){
  const rad=[];for(let i=0;i<=240;i++)rad.push(56+i*.5);let r=176;while(r<4600){r*=1.085;rad.push(Math.min(r,4600));}
  const SEC=400,pos=[],idx=[];
  for(const q of rad)for(let j=0;j<=SEC;j++){const a=j/SEC*Math.PI*2;pos.push(Math.cos(a)*q,0,Math.sin(a)*q);}
  for(let i=0;i<rad.length-1;i++)for(let j=0;j<SEC;j++){const a=i*(SEC+1)+j,b=a+SEC+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;
}
const water=new THREE.Mesh(seaGeometry(),waterMat);
water.frustumCulled=false; scene.add(water);

/* ───────────────────────── fresh water: the river, its waterfall, the pool and the spring ─────────────────────────
   One flowing-water shader: the surface streams along the river at a speed set by its fall, turns white on the waterfall and
   rapids, and reflects the sky like the sea does. */
const freshMat=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,fog:false});
{
  const {Fn,attribute,float,vec2,vec3,vec4,mix,max,pow,abs,dot,normalize,reflect,length,clamp,uv,positionWorld,cameraPosition}=TSL;
  const aFlow=attribute('aFlow','float').mul(U.uSwell.mul(.8).add(1)),aFoam=attribute('aFoam','float').add(U.uSwell.mul(.25)).min(1);
  freshMat.colorNode=Fn(()=>{const q=uv(),t=U.uTime,wp=positionWorld,V=normalize(cameraPosition.sub(wp)),dist=length(cameraPosition.sub(wp));
    const a=vec2(q.x.mul(2.2),q.y.mul(.55).sub(t.mul(aFlow).mul(.55))),b=vec2(q.x.mul(5.1).add(3),q.y.mul(1.4).sub(t.mul(aFlow).mul(1.1)));
    const h0=vn(a).add(vn(b).mul(.5)),e=.07;
    const dx=vn(a.add(vec2(e,0))).add(vn(b.add(vec2(e,0))).mul(.5)).sub(h0),dz=vn(a.add(vec2(0,e))).add(vn(b.add(vec2(0,e))).mul(.5)).sub(h0);
    const k=float(.22).add(aFlow.mul(.12)).mul(float(1).sub(sstep(30,120,dist)));
    const N=normalize(vec3(dx.mul(k).div(e).mul(.35),1,dz.mul(k).div(e).mul(.35)));
    const F=float(.02).add(pow(float(1).sub(max(dot(N,V),0)),5).mul(.98));
    const Rf0=reflect(V.negate(),N),Rf=vec3(Rf0.x,abs(Rf0.y),Rf0.z);
    const body=vec3(.018,.05,.035).mul(U.uDay.add(.05));
    const col=mix(body,grey(skyBase(Rf)),F).add(U.uSunDisc.mul(pow(max(dot(Rf,U.uSunDir),0),220).mul(.25))).toVar();
    col.assign(mix(col,vec3(.5,.56,.58).mul(U.uDay.add(.08)),aFoam.mul(.45)));            // falling, churning water is white, not a mirror
    const streak=vn(vec2(q.x.mul(14),q.y.mul(.3).sub(t.mul(aFlow).mul(.9)))).mul(.6).add(vn(vec2(q.x.mul(31),q.y.mul(.8).sub(t.mul(aFlow).mul(1.6)))).mul(.4)); // long streaks down the flow
    const fine=vn(vec2(q.x.mul(41),q.y.mul(5).sub(t.mul(aFlow).mul(4.2))));
    const foam=clamp(aFoam.mul(sstep(.38,.72,streak.mul(.75).add(fine.mul(.35)))),0,1);
    col.assign(mix(col,vec3(.9,.93,.95).mul(U.uDay.add(.1)),foam.mul(.9)));
    return vec4(col,max(mix(mix(.5,.32,aFoam),.96,foam),F.mul(1.2)));})();                        // clear enough to see the stream bed, opaque where it froths
}
const FRESH={pool:null,fallAt:new THREE.Vector3(),mist:null,meshes:[]};
{
  const Rv=RIVER,P=Rv.P,n=P.length,COLS=5,pos=[],uvs=[],flow=[],foam=[],idx=[];let v=0;const keep=[];
  const inPool=(x,z)=>Math.hypot(x-POOL.x,z-POOL.z)<POOL.r-.6,inSpring=(x,z)=>Math.hypot(x-SPRING.x,z-SPRING.z)<2.2;
  let end=n-1;for(let i=Rv.iPool;i<n;i++)if(Rv.wl[i]<.05){end=i;break;} // the river's own surface ends where it meets the sea
  for(let i=0;i<=end;i++){
    const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)],tx=b[0]-a[0],tz=b[1]-a[1],l=Math.hypot(tx,tz)||1,nx=-tz/l,nz=tx/l;
    const drop=(Rv.wl[Math.max(0,i-1)]-Rv.wl[Math.min(n-1,i+1)])/l;                                 // how steeply the water falls here
    if(i>0){const p0=P[i-1];v+=Math.hypot(P[i][0]-p0[0],P[i][1]-p0[1],Rv.wl[i]-Rv.wl[i-1]);}
    const hw=Rv.w[i]+.45,fo=i>=Rv.iTop-1?.12:smooth(.15,.9,drop)*.85*smooth(Rv.iTop-1,Rv.iTop-9,i); // the river runs smooth and glassy into the lip
    for(let k=0;k<COLS;k++){const o=(k/(COLS-1)*2-1)*hw;pos.push(P[i][0]+nx*o,Rv.wl[i]+.03,P[i][1]+nz*o);uvs.push(k/(COLS-1)*hw/2.5,v);
      flow.push(clamp(.35+drop*28,.35,4.5));foam.push(fo);}
    keep.push(!inPool(P[i][0],P[i][1])&&!inSpring(P[i][0],P[i][1])&&!(i>Rv.iTop&&i<Rv.iIn)); // the fall itself is FALLS' sheet
  }
  for(let i=0;i<end;i++){if(!keep[i]||!keep[i+1])continue;for(let k=0;k<COLS-1;k++){const a=i*COLS+k,b=a+COLS;idx.push(a,a+1,b,a+1,b+1,b);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setAttribute('aFlow',new THREE.Float32BufferAttribute(flow,1));g.setAttribute('aFoam',new THREE.Float32BufferAttribute(foam,1));g.setIndex(idx);g.computeBoundingSphere();
  const river=new THREE.Mesh(g,freshMat);river.renderOrder=1;scene.add(river);river.userData.y0=0;FRESH.meshes.push(river);
  // the pool and the spring: discs at their water level, churned white where the waterfall lands and where the spring wells up
  FRESH.fallAt.set(P[Rv.iIn][0],Rv.poolL,P[Rv.iIn][1]);
  const disc=(cx,cz,r,y,foamAt,foamR)=>{const d=new THREE.CircleGeometry(r,64);d.rotateX(-Math.PI/2);const ps=d.attributes.position,fl=[],fm=[],uv=d.attributes.uv;
    for(let i=0;i<ps.count;i++){const x=ps.getX(i)+cx,z=ps.getZ(i)+cz;uv.setXY(i,x/2.5,z/2.5);const f=smooth(foamR,0,Math.hypot(x-foamAt.x,z-foamAt.z));fl.push(.12+f*1.6);fm.push(f);}
    d.setAttribute('aFlow',new THREE.Float32BufferAttribute(fl,1));d.setAttribute('aFoam',new THREE.Float32BufferAttribute(fm,1));
    const m=new THREE.Mesh(d,freshMat);m.position.set(cx,y+.03,cz);m.renderOrder=1;scene.add(m);m.userData.y0=m.position.y;FRESH.meshes.push(m);return m;};
  FRESH.pool=disc(POOL.x,POOL.z,POOL.r+.9,Rv.poolL,{x:FRESH.fallAt.x,z:FRESH.fallAt.z},4.5);
  disc(SPRING.x,SPRING.z,2.9,Rv.springL,{x:SPRING.x,z:SPRING.z},1.4);
}

/* ───────────────────────── the waterfall, built the way games build them ─────────────────────────
   Not one strip but layers: a core sheet that leaves the lip in a glassy curve and follows the rock face down, breaking into
   white as it falls; a looser veil in front with ragged, torn edges; strands of water peeling off the sides; spray bursting
   where it lands; a cloud of mist that rolls downstream with the wind and shows a rainbow when the sun is behind you; rings
   spreading over the pool. The flow speeds up as it falls: textures move with the water's travel time, so they stretch. */
const FALLS=(()=>{
  const {Fn,attribute,float,vec2,vec3,vec4,mix,max,min,pow,abs,dot,normalize,length,clamp,uv,acos,positionLocal,positionWorld,cameraPosition}=TSL;
  const Rv=RIVER,P=Rv.P,j=Rv.iTop,L=new THREE.Vector3(P[j][0],Rv.wl[j]+.03,P[j][1]),Bp=P[Rv.iIn];
  const d=new THREE.Vector2(Bp[0]-L.x,Bp[1]-L.z).normalize(),tx=P[j+1][0]-P[j-1][0],tz=P[j+1][1]-P[j-1][1],tl=Math.hypot(tx,tz),n=new THREE.Vector2(-tz/tl,tx/tl);
  const H=L.y-Rv.poolL+.25,v0=1.6,G=9.8,hw0=Rv.w[j]+.85,ROWS=56,COLS=14;
  // where the water is at a given drop and offset across: free fall from the lip, but never inside the rock
  const along=(o,drop,off)=>{const bx=L.x+n.x*o,bz=L.z+n.y*o,y=L.y-drop;let h=v0*Math.sqrt(2*drop/G);
    for(let q=0;q<12;q+=.1){if(heightAt(bx+d.x*q,bz+d.y*q)<y-off){h=Math.max(h,q+.15);break;}}return h;};
  const HT=new Float32Array((ROWS+1)*COLS); // the core sheet's distance out from the lip, by row and column, for the strands to follow
  const sheet=(layer)=>{const pos=[],uvs=[],aS=[],aT=[],idx=[],off=layer?.55:.32,grow=layer?1.25:1.08,prev=new Float32Array(COLS);
    for(let r=0;r<=ROWS;r++){const s=Math.pow(r/ROWS,1.35),drop=s*H,t=(Math.sqrt(v0*v0+2*G*drop)-v0)/G+drop*.04; // seconds since the lip (a touch slowed by the rock)
      const hw=hw0*(1+s*(grow-1)*2.2);
      for(let k=0;k<COLS;k++){const u=k/(COLS-1),o=(u*2-1)*hw;let h=along(o,drop,off)+(layer?.3*s:0);h=Math.max(h,prev[k]);prev[k]=h;if(!layer)HT[r*COLS+k]=h; // never curls back
        pos.push(L.x+n.x*o+d.x*h,L.y-drop,L.z+n.y*o+d.y*h);uvs.push(u,drop);aS.push(s);aT.push(t);}}
    for(let r=0;r<ROWS;r++)for(let k=0;k<COLS-1;k++){const a=r*COLS+k,b=a+COLS;idx.push(a,b,a+1,a+1,b,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    g.setAttribute('aS',new THREE.Float32BufferAttribute(aS,1));g.setAttribute('aT',new THREE.Float32BufferAttribute(aT,1));g.setIndex(idx);g.computeBoundingSphere();return g;};
  const mk=(layer)=>{const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:true});
    const s=attribute('aS','float'),tt=attribute('aT','float'),swell=U.uSwell.mul(.6).add(1);
    m.positionNode=positionLocal.add(vec3(d.x,0,d.y).mul(vn(vec2(uv().x.mul(3).add(layer*7),tt.mul(2).sub(U.uTime.mul(1.3)))).sub(.5).mul(s.mul(.35).add(.04)))); // the sheet trembles
    m.colorNode=Fn(()=>{const q=uv(),t=U.uTime.mul(swell),u=q.x,ph=tt.sub(t.mul(layer?1.15:1)); // ph: the water's own clock, so features ride down with it
      const ed=min(u,float(1).sub(u));
      const streak=vn(vec2(u.mul(layer?23:17).add(layer*5),ph.mul(1.6))).mul(.55).add(vn(vec2(u.mul(53),ph.mul(4.5))).mul(.3)).add(vn(vec2(u.mul(110),ph.mul(11))).mul(.15));
      const clump=vn(vec2(u.mul(7).add(layer*11),ph.mul(3.2)));
      const aer=clamp(sstep(.0,layer?.18:.3,s).add(streak.sub(.5).mul(.6)),0,1);               // glassy over the lip, aerated white lower down
      const rag=sstep(0,float(.07).add(s.mul(layer?.26:.2)).add(clump.mul(layer?.22:.16)),ed.add(streak.sub(.5).mul(.08)));   // torn edges that widen as it falls
      const Vd=normalize(cameraPosition.sub(positionWorld)),N=normalize(vec3(d.x,.3,d.y)),day=U.uDay.add(.04);
      const lit=vec3(.66,.68,.7).mul(day).add(vec3(1,.96,.88).mul(max(dot(N,U.uSunDir),0).mul(.55).add(pow(max(dot(Vd.negate(),U.uSunDir),0),4).mul(.5))).mul(U.uDay)); // sky, sun, and the sun through the spray
      const foamC=lit.mul(mix(.72,1.05,streak)).mul(mix(.7,1,sstep(.3,.62,streak.add(clump.mul(.2))))),glass=mix(vec3(.03,.07,.06).mul(day),grey(skyBase(vec3(Vd.x.negate(),abs(Vd.y),Vd.z.negate()))),.35);
      const col=mix(glass,foamC,aer);
      const a=layer?clamp(sstep(.45,.85,streak.add(clump.mul(.35))).mul(.75).mul(sstep(.02,.2,s)),0,1):mix(.82,.97,aer).mul(mix(.55,1,sstep(.25,.55,streak)));
      return vec4(col,a.mul(rag).mul(sstep(1,.93,s).mul(.6).add(.4)));})();
    return m;};
  const core=new THREE.Mesh(sheet(0),mk(0)),veil=new THREE.Mesh(sheet(1),mk(1));core.renderOrder=2;veil.renderOrder=3;scene.add(core,veil);
  // particles: spray at the foot, strands off the edges, mist rolling downstream, rings on the pool
  const foot=new THREE.Vector3(),base=core.geometry.attributes.position;{let x=0,z=0;for(let k=0;k<COLS;k++){x+=base.getX(ROWS*COLS+k);z+=base.getZ(ROWS*COLS+k);}foot.set(x/COLS,Rv.poolL+.05,z/COLS);}
  FRESH.fallAt.copy(foot);
  { // the plunge: white water boiling up and spreading out over the pool
    const g=new THREE.CircleGeometry(hw0*2.4,48);g.rotateX(-Math.PI/2);const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,fog:true});
    m.colorNode=Fn(()=>{const q=uv().sub(.5),r=length(q).mul(2),a=TSL.atan(q.y,q.x),t=U.uTime;
      const f=vn(vec2(a.mul(5),r.mul(6).sub(t.mul(.9)))).mul(.6).add(vn(vec2(a.mul(13),r.mul(15).sub(t.mul(1.8)))).mul(.4));
      const day=U.uDay.add(.04),lit=vec3(.66,.68,.7).mul(day).add(vec3(1,.96,.88).mul(U.uDay).mul(.3));
      const g2=vn(vec2(a.mul(29),r.mul(34).sub(t.mul(2.6))));return vec4(lit.mul(mix(.85,1.05,f)),sstep(1,.3,r.add(f.mul(.3))).mul(sstep(.5,.72,f.mul(.7).add(g2.mul(.3)).add(float(.35).sub(r.mul(.45))))).mul(.95));})(); // torn, lacy foam, solid only at the very foot
    const pl=new THREE.Mesh(g,m);pl.position.set(foot.x+d.x*.6,foot.y+.04,foot.z+d.y*.6);pl.renderOrder=2;scene.add(pl);FRESH.meshes.push(pl);pl.userData.y0=pl.position.y;}
  const soft=canvasTex(64,64,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const ring=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,w*.3,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.75,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  // additive puffs: each instance's colour is its fade (the renderer multiplies it in), scaled by daylight so nothing glows at night
  const pm=(tex,extra)=>{const m=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,fog:true,blending:THREE.AdditiveBlending});const tx0=TSL.texture(tex,uv());
    const day=U.uDay.add(.05),lit=vec3(.62,.66,.7).mul(day).add(vec3(1,.97,.9).mul(U.uDay).mul(.4));
    m.colorNode=Fn(()=>{let c=lit;if(extra)c=extra(c);return vec4(c.mul(tx0.a),1);})();return m;};
  // the rainbow: a band 40–42° from the point opposite the sun, seen in the mist only when the sun is behind you
  const bow=(c)=>{const V=normalize(positionWorld.sub(cameraPosition)),ang=acos(clamp(dot(V,U.uSunDir.negate()),-1,1)).mul(57.2958);
    const band=sstep(39.2,40.6,ang).mul(sstep(42.8,41.6,ang)),h=float(1).sub(clamp(ang.sub(40).div(2.4),0,1)).mul(.75); // hue: violet inside, red outside
    const spec=clamp(vec3(abs(h.mul(6).sub(3)).sub(1),float(2).sub(abs(h.mul(6).sub(2))),float(2).sub(abs(h.mul(6).sub(4)))),0,1);
    return c.add(spec.mul(band).mul(sstep(.02,.15,U.uSunDir.y)).mul(float(1).sub(U.uCover)).mul(1.6));};
  const make=(N,mat,geo)=>{const im=new THREE.InstancedMesh(geo||new THREE.PlaneGeometry(1,1),mat,N);im.frustumCulled=false;im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(N*3),3);scene.add(im);return im;};
  const spray=make(110,pm(soft)),strands=make(70,pm(soft)),mist=make(56,pm(soft,bow)),rings=make(9,pm(ring),new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
  spray.renderOrder=4;strands.renderOrder=4;mist.renderOrder=5;rings.renderOrder=2;
  const R=Math.random,SP=Array.from({length:110},()=>({life:-R()*1.5})),ST=Array.from({length:70},()=>({life:-R()*2})),MI=Array.from({length:56},(_,i)=>({life:i/56*7})),RG=Array.from({length:9},(_,i)=>({life:i/9*3}));
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),X=new THREE.Vector3(),I=new THREE.Quaternion();
  const lipAt=(o)=>X.set(L.x+n.x*o,L.y,L.z+n.y*o);
  return{update(dt){const far=camera.position.distanceTo(foot)>170;for(const o of[spray,strands,mist,rings])o.visible=!far;if(far)return;
    const sw=U.uSwell.value,wx=WIND.dir.value.x*WIND.strength.value,wz=WIND.dir.value.y*WIND.strength.value,hwB=hw0*1.2;
    SP.forEach((p,i)=>{p.life+=dt;if(p.life>p.max||p.life<0&&p.life+dt>=0){p.life=0;p.max=.8+R()*.9;const o=(R()*2-1)*hwB;p.x=foot.x+n.x*o+d.x*(R()-.3);p.z=foot.z+n.y*o+d.y*(R()-.3);
        const a=R()*6.283,sp=1+R()*2.5;p.vx=Math.cos(a)*sp+d.x*1.5;p.vz=Math.sin(a)*sp+d.y*1.5;p.vy=2.5+R()*3.5*(1+sw*.5);p.y=foot.y;p.s=.25+R()*.5;}
      if(p.life<0){spray.setColorAt(i,X.setScalar(0));M.makeScale(0,0,0);spray.setMatrixAt(i,M);return;}
      p.vy-=G*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const k=p.life/p.max,sc=p.s*(1+k*2.5);S.set(sc,sc,sc);
      M.compose(X.set(p.x,Math.max(p.y,foot.y),p.z),camera.quaternion,S);spray.setMatrixAt(i,M);spray.setColorAt(i,X.setScalar(Math.sin(Math.PI*k)*.35));});
    ST.forEach((p,i)=>{p.life+=dt;if(p.life>p.max||p.life<0&&p.life+dt>=0){p.life=0;const sd=R()<.5?-1:1;p.o=sd*hw0*(.75+R()*.35);p.max=Math.sqrt(2*H/G)*1.05;p.v=v0*(.6+R()*.8);p.sx=sd*(.2+R()*.5);p.s=.12+R()*.2;}
      if(p.life<0){M.makeScale(0,0,0);strands.setMatrixAt(i,M);strands.setColorAt(i,X.setScalar(0));return;}
      const t=p.life,drop=.5*G*t*t,o=p.o+p.sx*t,r=Math.min(ROWS,Math.round(Math.pow(Math.min(drop/H,1),1/1.35)*ROWS)),k=Math.max(0,Math.min(COLS-1,Math.round((o/hw0+1)/2*(COLS-1)))),h=Math.max(p.v*t,HT[r*COLS+k]+.35);lipAt(o);X.set(X.x+d.x*h,L.y-drop,X.z+d.y*h);
      const sp=Math.min(G*t+1,8);S.set(p.s*(1+t),p.s*(1.5+sp*.45),1);M.compose(X,camera.quaternion,S);strands.setMatrixAt(i,M);strands.setColorAt(i,S.setScalar(drop<H?.55*Math.min(1,t*4):0));});
    MI.forEach((p,i)=>{p.life+=dt;if(p.life>7){p.life-=7;p.o=(R()*2-1)*hwB;p.r=R();}if(p.o==null){p.o=(R()*2-1)*hwB;p.r=R();}const k=p.life/7;
      X.set(foot.x+n.x*p.o+(d.x*2.5+wx*2.2)*k*3,foot.y+.4+k*(3+p.r*5),foot.z+n.y*p.o+(d.y*2.5+wz*2.2)*k*3);const sc=1.6+k*(4+p.r*3.5);S.set(sc,sc,sc);
      M.compose(X,camera.quaternion,S);mist.setMatrixAt(i,M);mist.setColorAt(i,S.setScalar(Math.sin(Math.PI*Math.sqrt(k))*(.075+sw*.05)));});
    RG.forEach((p,i)=>{p.life+=dt;if(p.life>3){p.life-=3;p.o=(R()*2-1)*hw0;}const k=p.life/3,o=p.o||0,sc=1+k*9;
      M.compose(X.set(foot.x+n.x*o+d.x*k*2,foot.y-.02,foot.z+n.y*o+d.y*k*2),I,S.set(sc,1,sc));rings.setMatrixAt(i,M);rings.setColorAt(i,S.setScalar((1-k)*.3));});
    for(const o of[spray,strands,mist,rings]){o.instanceMatrix.needsUpdate=true;o.instanceColor.needsUpdate=true;}
    core.position.y=veil.position.y=0;}};
})();
// a cap of cloud drifting around the summit: soft puffs, facing the camera
const SUMMIT=(()=>{const tex=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(.6,'rgba(255,255,255,.3)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const m=new THREE.MeshBasicNodeMaterial({map:tex,transparent:true,depthWrite:false,fog:false,opacity:.3}),N=40,im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),m,N);im.frustumCulled=false;scene.add(im);
  const P=Array.from({length:N},(_,i)=>({a:i/N*6.28,r:8+Math.random()*34,y:PEAK_H-12+Math.random()*22,s:16+Math.random()*20,sp:.008+Math.random()*.018}));const M=new THREE.Matrix4(),S=new THREE.Vector3(),V=new THREE.Vector3();
  return{update(dt,dl){m.color.setRGB(.95*dl+.05,.95*dl+.05,.97*dl+.05);m.opacity=.22+.3*U.uCover.value;P.forEach((p,i)=>{p.a+=p.sp*dt;V.set(PEAK.x+Math.sin(p.a)*p.r,p.y+Math.sin(p.a*3+i)*2,PEAK.z+Math.cos(p.a)*p.r);
    S.set(p.s*2.2,p.s*.55,1);M.compose(V,camera.quaternion,S);im.setMatrixAt(i,M);});im.instanceMatrix.needsUpdate=true;}};})();
function updateFresh(dt){
  {const sw=U.uSwell.value*.22;for(const m of FRESH.meshes)m.position.y=m.userData.y0+sw;}          // the river rises a little in heavy rain
  FALLS.update(dt);
}

/* far island: flat silhouette on the northern horizon */
const farMat=new THREE.MeshBasicNodeMaterial({fog:false});
{ // not a flat cut-out: ridges and valleys in light and shade, and more sea haze toward its foot
  const {vec2,vec4,mix,pow,float,positionLocal,materialColor}=TSL,q=positionLocal.xy;
  const shade=fbmN(q.mul(vec2(.004,.009)).add(3)).mul(.5).add(fbmN(q.mul(.03)).mul(.18)).add(.62);
  const haze=pow(float(1).sub(positionLocal.y.div(430).clamp(0,1)),2.2).mul(.55).add(.12);
  farMat.colorNode=vec4(mix(materialColor.rgb.mul(shade),grey(U.uHorizon),haze),1);
}
{
  const s=new THREE.Shape(); s.moveTo(-1700,-5);
  for(let i=0;i<=120;i++){const u=i/120,x=-1700+u*3400;const y=Math.pow(Math.sin(Math.PI*u),1.6)*430*(.82+.18*Math.sin(u*5+.6))+fbm(u*14,2,3)*38*Math.sin(Math.PI*u);s.lineTo(x,y);}
  s.lineTo(1700,-5);
  const m=new THREE.Mesh(new THREE.ShapeGeometry(s),farMat); m.position.set(350,0,-4350); scene.add(m);
}

