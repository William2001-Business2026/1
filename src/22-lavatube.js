/* ───────── Ke Ana: a lava tube behind Hiʻilawe ─────────
   Inspired by Nāhuku on Kīlauea (the real one has no waterfall): a round tube about six metres across, glazed dark basalt with
   flow lines and ledges along its walls, a flat floor where the last lava drained away, puddles, drips, and roots of the forest
   hanging from the roof near the mouth. Its mouth opens behind the foot of the falls, at the pool's edge: you swim in under the
   falling water and step up into it. It runs about 160 m into the mountain, curving and rising a little, and grows dark: your
   eyes adjust, and a lantern helps. It echoes. The terrain is a height field, so the tube is its own mesh, a hole is cut in the
   cliff for its mouth (see the terrain material), and inside it the ground is the tube's floor. A natural tube: nothing is buried here. */
const TUBE=(()=>{
  const f=FRESH.fallAt,P0=POOL,ex=P0.x-f.x,ez=P0.z-f.z,el=Math.hypot(ex,ez)||1,ox=ex/el,oz=ez/el,y0=RIVER.poolL+.45;
  // the mouth: walking from the pool toward the falls, the first place rock stands well over head height
  // set to one side of the falling water, so that its edge shows dark beside the sheet: it is behind the falls, but it can be found
  const px_=oz,pz_=-ox,walk=(sd)=>{let x0=P0.x+px_*sd,z0=P0.z+pz_*sd,bx=x0,bz=z0,n=0;for(let s=0;s<90;s+=.25){const x=x0-ox*s,z=z0-oz*s;n=s;if(heightAt(x,z)>y0+6)break;bx=x;bz=z;}return{x:bx,z:bz,n};};
  const wa=walk(7),wb=walk(-7),wm=wa.n<=wb.n?wa:wb;let mx=wm.x,mz=wm.z;
  // the way in: straight into the mountain, then a long bend one way and a shorter one back, rising gently
  const STEP=1,pts=[];{let x=mx+ox*1.5,z=mz+oz*1.5,a=Math.atan2(-ox,-oz);for(let s=-1.5;s<=160;s+=STEP){
      pts.push({x,z,y:y0+Math.max(0,s)*.032,s,R:3.1+.55*(vnoise(s*.07,3)-.5)+(s<6?.6*(1-Math.max(0,s)/6):0),dx:Math.sin(a),dz:Math.cos(a)});
      if(s>28&&s<90)a+=.0135*STEP/2;else if(s>110&&s<140)a-=.012*STEP/2;x+=Math.sin(a)*STEP;z+=Math.cos(a)*STEP;}}
  const N=pts.length,SEG=64,IX=s=>Math.round((s+1.5)/STEP);   // IX: the point nearest a distance in
  // the tube's skin: a lumpy, glazed round section with a flat floor
  const pos=[],nrm=[],uv=[],aS=[],idx=[];
  for(let i=0;i<N;i++){const p=pts[i],sx=p.dz,sz=-p.dx,cy=p.y+p.R*.62;
    for(let k=0;k<=SEG;k++){const kk=k%SEG,a=kk/SEG*Math.PI*2,c=Math.cos(a),sn=Math.sin(a);   // the last vertex of a ring is the first again: no seam
      const ka=kk/SEG*44,bump=1+.075*(vnoise(p.s*.22+ka*.35,a*2)-.5)+.035*(vnoise(p.s*.45,ka*.9)-.5)+.04*Math.exp(-(((sn+.15)/.1)**2))*(.6+.8*vnoise(p.s*.08,5)); // lumps, and a rounded ledge where an old lava level stood
      let x=p.x+sx*c*p.R*bump,y=cy+sn*p.R*.86*bump,z=p.z+sz*c*p.R*bump;if(y<p.y){y=p.y;}                       // the drained floor is flat
      pos.push(x,y,z);uv.push(k/SEG*6,p.s/2);aS.push(p.s);}}
  for(let i=0;i<N-1;i++)for(let k=0;k<SEG;k++){const a=i*(SEG+1)+k,b=a+SEG+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('aS',new THREE.Float32BufferAttribute(aS,1));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();
  {const nm=g.attributes.normal;for(let i=0;i<N;i++){const a=i*(SEG+1),b=a+SEG,x=nm.getX(a)+nm.getX(b),y=nm.getY(a)+nm.getY(b),z=nm.getZ(a)+nm.getZ(b),l=Math.hypot(x,y,z)||1;
    nm.setXYZ(a,x/l,y/l,z/l);nm.setXYZ(b,x/l,y/l,z/l);}}                                  // and the two copies of that vertex share one normal
  const mat=new THREE.MeshStandardNodeMaterial({side:THREE.DoubleSide,roughness:.6,metalness:0});
  {const {attribute,positionWorld:wp,normalWorld,texture,abs,vec3,vec2,vec4,mix,float,max,exp}=TSL,s=attribute('aS','float'),rk=pbrTex('rock');
    const N0=normalWorld,ax=abs(N0.x),ay=abs(N0.y),az=abs(N0.z),sw=ax.add(ay).add(az).add(.001);
    const tri=texture(rk.a,wp.zy.div(3)).rgb.mul(ax).add(texture(rk.a,wp.xz.div(3)).rgb.mul(ay)).add(texture(rk.a,wp.xy.div(3)).rgb.mul(az)).div(sw).div(.011);
    const floor=sstep(.6,.9,N0.y),puddle=floor.mul(sstep(.55,.62,vn(wp.xz.mul(.35)))),flow=vn(vec2(wp.y.mul(6),s.mul(.15)));            // flow lines run along the walls
    const mouth=sstep(14,2,s),moss=mouth.mul(sstep(.45,.7,vn(wp.xz.mul(.9).add(wp.y))));
    mat.colorNode=vec4(mix(vec3(.028,.026,.025).mul(mix(vec3(1),tri,.8)).mul(mix(.75,1.1,flow)),vec3(.02,.045,.015),moss).mul(mix(1,.55,puddle)),1);
    mat.roughnessNode=mix(mix(.86,.55,sstep(.55,.8,flow)),.06,puddle);                                                     // rough rock with glazed runs, wet underfoot
    // a bumpy surface: the rock's own small lumps tilt the light, so the walls are not a smooth pipe
    {const {normalize,cameraViewMatrix}=TSL,e=.08,bp=wp.mul(1.7),h=q=>vn(q.xz.add(q.y)).mul(.6).add(vn(q.zy.mul(2.3)).mul(.4)),h0=h(bp);
     const gx=h(bp.add(vec3(e,0,0))).sub(h0),gy=h(bp.add(vec3(0,e,0))).sub(h0),gz=h(bp.add(vec3(0,0,e))).sub(h0);
     mat.normalNode=normalize(cameraViewMatrix.mul(vec4(normalize(N0.sub(vec3(gx,gy,gz).mul(mix(4.5,.6,puddle)))),0)).xyz);}
    mat.aoNode=exp(max(s,0).div(-22)).mul(.9).add(.1);}                                                                 // the sky's light only reaches the first few metres
  const tube=new THREE.Mesh(g,mat);tube.receiveShadow=true;tube.castShadow=true;mat.shadowSide=THREE.DoubleSide;scene.add(tube);   // the rock of the tube keeps the sun out of it
  // daylight bouncing in off the pool and the falls: it lights the first stretch of wall softly, and fades with the day
  const bounce=new THREE.PointLight(new THREE.Color(.8,.86,.9),0,38,1.6);{const p=pts[IX(2)];bounce.position.set(p.x,p.y+.45,p.z);}scene.add(bounce);   // low, as the light comes up off the pool: it lights the walls and the roots from below, not from among them
  // the cut in the cliff (read by the terrain material): the mouth's centre, the way in, and its radius
  {const q=pts[IX(.5)];TUBE_HOLE.c.value.set(q.x,q.y+q.R*.62,q.z);TUBE_HOLE.a.value.set(q.dx,0,q.dz);TUBE_HOLE.r.value=q.R*1.08;}
  // ferns where the daylight reaches: along the edges of the floor at the mouth (the scanned fern, CC0)
  gltfLoader.loadAsync('assets/models/fern.glb').then(gl=>{const src=gl.scene.getObjectByName('fern_02_b')||gl.scene.getObjectByProperty('isMesh',true);if(!src)return;src.updateWorldMatrix(true,false);
    const geo=floatGeo(src.geometry).applyMatrix4(src.matrixWorld);geo.computeBoundingBox();const b=geo.boundingBox,w=Math.max(b.max.x-b.min.x,b.max.z-b.min.z),c=b.getCenter(new THREE.Vector3());geo.translate(-c.x,-b.min.y,-c.z);geo.scale(1/w,1/w,1/w);
    const m0=src.material,fm=new THREE.MeshStandardNodeMaterial({map:m0.map,normalMap:m0.normalMap,alphaTest:.45,side:THREE.DoubleSide,roughness:.7});
    const R=rng(23),n=22,im=new THREE.InstancedMesh(geo,fm,n),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(),T=new THREE.Vector3();
    for(let j=0;j<n;j++){const i=IX(.5+R()*8),p=pts[i],sx=p.dz,sz=-p.dx,side=(R()<.5?-1:1)*p.R*(.55+R()*.25),sc=.7+R()*.9*(1-p.s/12);
      T.set(p.x+sx*side,p.y-.03,p.z+sz*side);Q.setFromAxisAngle(new THREE.Vector3(0,1,0),R()*6.28);S.set(sc,sc,sc);M.compose(T,Q,S);im.setMatrixAt(j,M);}
    im.receiveShadow=true;scene.add(im);}).catch(e=>console.warn('Tube ferns:',e));
  // roots of the forest above, hanging through cracks in the roof near the mouth: thin, kinked strands that taper and fork, some
  // in bundles, a few reaching the floor. Built as one mesh of tapered tubes; they stir a little in the air from the mouth.
  {const R=rng(57),pos=[],nrm=[],idx=[],V3=THREE.Vector3,up=new V3(0,1,0);
   const strand=(o,len,r0,dir,depth)=>{const pts_=[],n=Math.max(4,Math.round(len/.12));let p=o.clone(),d=dir.clone();
     for(let i=0;i<=n;i++){pts_.push(p.clone());d.add(new V3((R()-.5)*.35,0,(R()-.5)*.35)).normalize();d.y=Math.min(d.y,-.55);d.normalize();p.addScaledVector(d,len/n);}
     const base=pos.length/3,SIDES=6;let a1=null;for(let i=0;i<=n;i++){const t=i/n,r=r0*(1-t*.7),c=pts_[i],tg=(i<n?pts_[i+1].clone().sub(c):c.clone().sub(pts_[i-1])).normalize();
       a1=a1?a1.addScaledVector(tg,-a1.dot(tg)).normalize():new V3().crossVectors(tg,Math.abs(tg.y)>.9?new V3(1,0,0):up).normalize();const a2=new V3().crossVectors(tg,a1).normalize(); // the ring's frame carried down the root, so it never twists
       for(let k=0;k<SIDES;k++){const an=k/SIDES*6.283,nv=a1.clone().multiplyScalar(Math.cos(an)).addScaledVector(a2,Math.sin(an));pos.push(c.x+nv.x*r,c.y+nv.y*r,c.z+nv.z*r);nrm.push(nv.x,nv.y,nv.z);}}
     for(let i=0;i<n;i++)for(let k=0;k<SIDES;k++){const a=base+i*SIDES+k,b=base+i*SIDES+(k+1)%SIDES;idx.push(a,b,a+SIDES,b,b+SIDES,a+SIDES);}
     if(depth<2)for(let f=0;f<(depth?1:2);f++)if(R()<.7){const at=pts_[Math.floor(n*(.3+R()*.5))];strand(at,len*(.3+R()*.35),r0*.55,new V3((R()-.5)*1.2,-1,(R()-.5)*1.2).normalize(),depth+1);}};
   for(let j=0;j<46;j++){const p=pts[IX(Math.pow(R(),1.5)*40)],a=Math.PI*(.3+R()*.4),sx=p.dz,sz=-p.dx,roof=p.y+p.R*.62+Math.sin(a)*p.R*.8,
       o=new V3(p.x+sx*Math.cos(a)*p.R*.8,roof,p.z+sz*Math.cos(a)*p.R*.8),bundle=R()<.35?3:1;
     for(let b=0;b<bundle;b++){const reach=R()<.12?roof-p.y:.5+Math.pow(R(),1.4)*2.6;strand(o.clone().add(new V3((R()-.5)*.2,0,(R()-.5)*.2)),reach,.028+R()*.035,new V3((R()-.5)*.3,-1,(R()-.5)*.3).normalize(),0);}}
   const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rg.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));rg.setIndex(idx);
   const rm=new THREE.MeshLambertNodeMaterial({color:srgb(.16,.11,.07)});   // matte bark: diffuse only, so no grazing shine along their thin edges
   {const {positionLocal,sin,vec3,float}=TSL,top=float(pts[0].y+pts[0].R*1.5);rm.positionNode=positionLocal.add(vec3(sin(U.uTime.mul(.7).add(positionLocal.z.mul(2.3))),0,sin(U.uTime.mul(.5).add(positionLocal.x.mul(1.9)))).mul(top.sub(positionLocal.y).max(0).mul(.006)));}
   const roots=new THREE.Mesh(rg,rm);roots.name='tubeRoots';roots.castShadow=true;roots.receiveShadow=true;scene.add(roots);}
  // drips: drops fall from the roof into the puddles, each with a ring and a plink
  const dm=new THREE.MeshBasicNodeMaterial({color:srgb(.6,.65,.7),transparent:true,opacity:.7,depthWrite:false}),drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.012,6,4).scale(1,2.4,1),dm,10);
  drops.frustumCulled=false;scene.add(drops);const DR=Array.from({length:10},()=>({t:-Math.random()*3}));
  // where am I: the nearest point on the tube's line, how far along, and how far out from it
  let last=0;function locate(x,z){let b=last,bd=1e9;for(let i=Math.max(0,last-6);i<Math.min(N,last+7);i++){const d=(pts[i].x-x)**2+(pts[i].z-z)**2;if(d<bd){bd=d;b=i;}}
    if(bd>64){for(let i=0;i<N;i++){const d=(pts[i].x-x)**2+(pts[i].z-z)**2;if(d<bd){bd=d;b=i;}}}last=b;const p=pts[b];
    const lx=x-p.x,lz=z-p.z,along=lx*p.dx+lz*p.dz,side=lx*p.dz-lz*p.dx;return{p,i:b,s:p.s+along,side,d:Math.abs(side)};}
  const inBox=(x,z)=>{const mnx=Math.min(...pts.map(p=>p.x))-6,mxx=Math.max(...pts.map(p=>p.x))+6,mnz=Math.min(...pts.map(p=>p.z))-6,mxz=Math.max(...pts.map(p=>p.z))+6;return x>mnx&&x<mxx&&z>mnz&&z<mxz;};
  const BOX=(()=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const p of pts){a=Math.min(a,p.x);b=Math.max(b,p.x);c=Math.min(c,p.z);d=Math.max(d,p.z);}return[a-6,b+6,c-6,d+6];})();
  const near=(x,z)=>x>BOX[0]&&x<BOX[1]&&z>BOX[2]&&z<BOX[3];
  const st={cave:0,adapt:0,s:-1};
  return{pts,mouth:{x:mx,z:mz,y:y0},st,
    // the floor under (x,z) if you are inside the tube at height y, else null
    floorAt(x,z,y){if(!near(x,z))return null;const L=locate(x,z);if(L.s<-.5||L.s>pts[N-1].s||L.d>L.p.R*.9)return null;const fy=L.p.y+(L.s-L.p.s)*.032;
      if(y!=null&&(y<fy-2.5||y>fy+L.p.R*1.5))return null;return fy;},
    inside(x,z,y){return this.floorAt(x,z,y)!=null;},
    // keep you off the walls
    constrain(o){if(!near(o.x,o.z))return;const L=locate(o.x,o.z);if(L.s<.5||L.s>pts[N-1].s)return;const m=L.p.R*.78;if(L.d>m){const k=(L.d-m)*Math.sign(L.side);o.x-=L.p.dz*k;o.z+=L.p.dx*k;}},
    // and the camera inside it
    clampCam(v,ref){if(!this.inside(ref.x,ref.z,ref.y))return;const L=locate(v.x,v.z),m=L.p.R*.7;if(L.d>m){const k=(L.d-m)*Math.sign(L.side);v.x-=L.p.dz*k;v.z+=L.p.dx*k;}
      const top=L.p.y+L.p.R*1.3;if(v.y>top)v.y=top;},
    update(dt){bounce.intensity=(.25+2.6*U.uDay.value)*(st.s>=0||Math.hypot(camera.position.x-pts[IX(6)].x,camera.position.z-pts[IX(6)].z)<60?1:0);const c=camera.position,L=near(c.x,c.z)?locate(c.x,c.z):null,fy=L?L.p.y:0,inT=L&&L.s>-.5&&L.d<L.p.R*1.1&&c.y<fy+L.p.R*1.6&&c.y>fy-1;
      st.s=inT?L.s:-1;st.cave=inT?smooth(1,22,L.s):0;st.adapt=lerp(st.adapt,st.cave,1-Math.exp(-dt/(st.cave>st.adapt?3.5:1.2)));   // eyes adjust over a few seconds, faster back into daylight
      if(inT&&!W.flags.tube&&L.s>6){W.flags.tube=1;note('tube');toast('Ke Ana, a lava tube. Water drips from the roots of the forest above.',6);}
      // drips
      const M=new THREE.Matrix4(),T=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1,1,1);const live=st.s>=0;drops.visible=live;if(!live)return;
      DR.forEach((d,k)=>{d.t+=dt;if(d.t<0){M.makeScale(0,0,0);drops.setMatrixAt(k,M);return;}
        if(!d.p){const i=Math.min(N-1,Math.max(1,IX(st.s+(Math.random()-.4)*24))),p=pts[i],sx=p.dz,sz=-p.dx,o=(Math.random()-.5)*p.R;d.p={x:p.x+sx*o,z:p.z+sz*o,y0:p.y+p.R*1.42,y1:p.y};d.t=0;}
        const y=d.p.y0-4.9*d.t*d.t;if(y<=d.p.y1){if(AU.ctx&&Math.hypot(d.p.x-c.x,d.p.z-c.z)<18)SFX.drip&&SFX.drip(clamp(1-Math.hypot(d.p.x-c.x,d.p.z-c.z)/18,0,1));
          if(U.uRipples)U.uRipples.value[rippleI++%8].set(d.p.x,d.p.z,time);d.p=null;d.t=-.4-Math.random()*2.2;M.makeScale(0,0,0);}
        else M.compose(T.set(d.p.x,y,d.p.z),Q,S);drops.setMatrixAt(k,M);});drops.instanceMatrix.needsUpdate=true;}};
})();
