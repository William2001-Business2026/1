/* ───────────────────────── Lalo o ke Kai: under the sea ─────────────────────────
   A fringing reef rings the island 15–65 m offshore, 2–4 m down, dropping away to 18 m past its edge.
   Six Hawaiian corals and limu grow on it by depth; schools of reef fish wander over it; honu, a manta and reef sharks
   pass through. Heʻe, ula, ʻaʻama, wana, ʻopihi, limu and fish can be caught or gathered and go into the food system.
   Everything is drawn only while you are in or close above the water, in 24 m chunks near you. */
const SEA=(()=>{
  const {Fn,attribute,float,vec3,sin,cos,pow,clamp,positionLocal,positionGeometry,uniform}=TSL;
  const R2=rng(7071),V3=THREE.Vector3,up=new V3(0,1,0);
  const seaY=()=>water.position.y;
  // ── geometry helpers: every part carries its own colours; parts are merged into one mesh per kind ──
  function paint(g,fn){const p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const k=fn(p.getX(i),p.getY(i),p.getZ(i),i);c[i*3]=k.r;c[i*3+1]=k.g;c[i*3+2]=k.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
  function sway(g,fn){const p=g.attributes.position,a=new Float32Array(p.count);for(let i=0;i<p.count;i++)a[i]=fn(p.getX(i),p.getY(i),p.getZ(i));g.setAttribute('aSway',new THREE.BufferAttribute(a,1));return g;}
  function merge(parts){let n=0,ni=0;for(const g of parts){n+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
    const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3),A=new Float32Array(n),I=n>65535?new Uint32Array(ni):new Uint16Array(ni);let o=0,oi=0;
    for(const g of parts){const p=g.attributes.position,nr=g.attributes.normal,c=g.attributes.color,a=g.attributes.aSway;
      for(let i=0;i<p.count;i++){P.set([p.getX(i),p.getY(i),p.getZ(i)],(o+i)*3);N.set([nr.getX(i),nr.getY(i),nr.getZ(i)],(o+i)*3);if(c)C.set([c.getX(i),c.getY(i),c.getZ(i)],(o+i)*3);A[o+i]=a?a.getX(i):0;}
      if(g.index)for(let i=0;i<g.index.count;i++)I[oi++]=g.index.getX(i)+o;else for(let i=0;i<p.count;i++)I[oi++]=i+o;o+=p.count;}
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));
    out.setAttribute('color',new THREE.BufferAttribute(C,3));out.setAttribute('aSway',new THREE.BufferAttribute(A,1));out.setIndex(new THREE.BufferAttribute(I,1));out.computeBoundingSphere();return out;}
  const along=(g,from,dir,len)=>{g.translate(0,len/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,dir.clone().normalize()));g.translate(from.x,from.y,from.z);return g;};
  const col=(r,g,b)=>srgb(r,g,b),mixc=(a,b,t)=>a.clone().lerp(b,clamp01(t)),clamp01=t=>Math.max(0,Math.min(1,t));

  // ── the corals ──
  const CORALS={
    lobe:{n:'Pōhaku puna (lobe coral)',mk(){ // Porites lobata: big lumpy mounds, yellow-brown to green
      const g=new THREE.SphereGeometry(1,64,36,0,Math.PI*2,0,Math.PI*.64),p=g.attributes.position,c=new Float32Array(p.count*3),a=col(.5,.44,.27),b=col(.38,.4,.29),d=col(.24,.21,.15);
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=fbm(x*2.1+5,z*2.1+y*2,3),kn=vnoise(x*16+y*9,z*16-y*5),k=1+.38*(n-.5)+.09*(kn-.5)+.04*Math.max(0,kn-.7)*3;
        p.setXYZ(i,x*k*1.08,(y+.43)*.66*k,z*k);const cc=mixc(mixc(a,b,fbm(x*1.3,z*1.3+9,2)*1.6-.3),d,smooth(.55,.35,n));c.set([cc.r,cc.g,cc.b],i*3);}
      g.computeVertexNormals();g.setAttribute('color',new THREE.BufferAttribute(c,3));return merge([g]);}},
    finger:{n:'Pōhaku puna (finger coral)',mk(){ // Porites compressa: thickets of blunt fingers, tan with lilac tips
      const parts=[],base=col(.52,.42,.28),tip=col(.7,.62,.5);
      for(let k=0;k<26;k++){const a=R2()*6.283,r=Math.sqrt(R2())*.42,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.22+R2()*.36,rr=.032+R2()*.02;
        const dir=new V3(x*.9,1,z*.9).normalize(),from=new V3(x,0,z);
        parts.push(paint(along(new THREE.CylinderGeometry(rr*.92,rr,h,7,3),from,dir,h),(X,Y)=>mixc(base,tip,smooth(.08,.5,Y))));
        const e=from.clone().addScaledVector(dir,h);parts.push(paint(new THREE.SphereGeometry(rr*.92,7,5).translate(e.x,e.y,e.z),()=>tip));}
      return merge(parts);}},
    cauliflower:{n:'Koʻa (cauliflower coral)',mk(){ // Pocillopora meandrina: a rounded bush of knobbly branches, pink-brown
      const parts=[],a=col(.6,.42,.38),b=col(.5,.4,.3);
      const br=(from,dir,len,rad,dep)=>{parts.push(paint(along(new THREE.CylinderGeometry(rad*.8,rad,len,5,1),from,dir,len),()=>mixc(a,b,R2())));
        const end=from.clone().addScaledVector(dir,len);
        {const t=R2(),p=from.clone().addScaledVector(dir,len*t);parts.push(paint(new THREE.SphereGeometry(rad*.8,4,3).translate(p.x+(R2()-.5)*rad,p.y,p.z+(R2()-.5)*rad),()=>a));}
        if(dep<2)for(let k=0;k<3;k++){const d=dir.clone().add(new V3(R2()-.5,R2()*.3,R2()-.5).multiplyScalar(1.1)).normalize();br(end,d,len*.72,rad*.74,dep+1);}
        else parts.push(paint(new THREE.SphereGeometry(rad*1.3,5,4).translate(end.x,end.y,end.z),()=>a));};
      for(let k=0;k<5;k++){const a0=k*1.26+R2();br(new V3(Math.cos(a0)*.05,0,Math.sin(a0)*.05),new V3(Math.cos(a0)*.55,1,Math.sin(a0)*.55).normalize(),.17,.034,0);}
      return merge(parts);}},
    plate:{n:'Pāpaua (rice coral plates)',mk(){ // Montipora capitata: overlapping plates, brown with pale purple rims
      const parts=[],c0=col(.4,.31,.2),rim=col(.62,.45,.62);
      for(let k=0;k<5;k++){const r=.3+R2()*.38,g=new THREE.CylinderGeometry(r,r*.94,.03,30,1),p=g.attributes.position,ph=R2()*6;
        for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),q=Math.hypot(x,z)/r;p.setY(i,p.getY(i)+Math.sin(Math.atan2(z,x)*5+ph)*.03*q+q*q*.05);}
        g.computeVertexNormals();g.rotateX((R2()-.5)*.35);g.rotateZ((R2()-.5)*.35);g.translate((R2()-.5)*.5,.08+k*.09,(R2()-.5)*.5);
        paint(g,(x,y,z)=>mixc(c0,rim,smooth(.6,1,Math.hypot(x,z)/(r+.25))));parts.push(g);}
      return merge(parts);}},
    mushroom:{n:'ʻAkoʻakoʻa (mushroom coral)',mk(){ // Fungia: a free-living oval disc with fine radial ridges
      const g=new THREE.SphereGeometry(1,64,10,0,Math.PI*2,0,Math.PI/2),p=g.attributes.position,a=col(.66,.58,.42),b=col(.45,.5,.3);
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),an=Math.atan2(z,x);p.setXYZ(i,x*.2,y*.045+Math.abs(Math.sin(an*34))*.007*(1-y),z*.13);}
      g.computeVertexNormals();paint(g,(x,y,z)=>mixc(b,a,smooth(.02,.12,Math.hypot(x/.2,z/.13)*.15)));return merge([g]);}},
    fan:{n:'ʻĒkaha kū moana (black coral)',sway:1,mk(){ // Antipathes: a sparse tree of fine branches on the drop-off, olive-brown living tissue
      const parts=[],a=col(.34,.28,.14),b=col(.55,.46,.25);
      const br=(x,y,ang,len,rad,dep)=>{const dir=new V3(Math.sin(ang),Math.cos(ang),(R2()-.5)*.2).normalize(),from=new V3(x,y,0);
        parts.push(sway(paint(along(new THREE.CylinderGeometry(rad*.75,rad,len,5,1),from,dir,len),(X,Y)=>mixc(a,b,Y)),(X,Y)=>Y));
        const e=from.clone().addScaledVector(dir,len);if(dep<5){br(e.x,e.y,ang-.35-R2()*.3,len*.78,rad*.72,dep+1);br(e.x,e.y,ang+.35+R2()*.3,len*.78,rad*.72,dep+1);}};
      br(0,0,0,.32,.022,0);return merge(parts);}},
    limu:{n:'Limu (seaweed)',sway:1,mk(){ // ribbons of limu kohu and limu līpoa, olive and red-brown
      const parts=[];
      for(let k=0;k<14;k++){const H=.2+R2()*.38,g=new THREE.PlaneGeometry(.025+R2()*.035,H,2,8),p=g.attributes.position,lean=(R2()-.5)*.6,a=R2()*6.28,tw=(R2()-.5)*2.5;
        for(let i=0;i<p.count;i++){const t=p.getY(i)/H+.5,x=p.getX(i)*(1-.75*t)*(1+.35*Math.sin(t*9+k)),an=tw*t;   // tapering, rippled at the edges, twisting as it rises
          p.setXYZ(i,x*Math.cos(an),p.getY(i),x*Math.sin(an)+Math.sin(t*2.6+k)*.05+lean*t*t*.3);}
        g.translate(0,-g.boundingBox?0:0,0);g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);g.rotateY(a);g.translate((R2()-.5)*.2,0,(R2()-.5)*.2);g.computeVertexNormals();
        const cc=R2()<.4?col(.4,.15,.1):R2()<.5?col(.25,.3,.08):col(.42,.36,.12);paint(g,(x,y)=>cc.clone().multiplyScalar(.6+y*1.2));sway(g,(x,y)=>y*1.6);parts.push(g);}
      return merge(parts);}},
  };
  const U2={t:uniform(0)};
  const coralMat=new THREE.MeshStandardNodeMaterial({vertexColors:true,roughness:.86,metalness:0});
  {const {positionWorld,vertexColor,vec4}=TSL,w=positionWorld,sp=vn(w.xz.mul(19).add(w.y.mul(13))).mul(.55).add(vn(w.xz.mul(53).sub(w.y.mul(31))).mul(.3));
   coralMat.colorNode=vec4(vertexColor().rgb.mul(sp.mul(.75).add(.62)),1);coralMat.roughnessNode=sp.mul(-.3).add(.95);coralMat.vertexColors=false;}
  const swayMat=new THREE.MeshStandardNodeMaterial({vertexColors:true,roughness:.8,metalness:0,side:THREE.DoubleSide});
  {const sw=attribute('aSway','float'),ph=positionLocal.x.mul(.35).add(positionLocal.z.mul(.27)); // the swell's slow back-and-forth surge
   swayMat.positionNode=positionLocal.add(vec3(sin(U2.t.mul(1.15).add(ph)),0,cos(U2.t.mul(.9).add(ph.mul(1.3)))).mul(sw).mul(.07));}

  // where things grow: by depth and distance offshore
  const reefSpot=(minOff,maxOff,minH,maxH,tries=40)=>{for(let t=0;t<tries;t++){const th=R2()*6.283,c=coastAt(th,MAP),off=minOff+R2()*(maxOff-minOff),r=c+off,x=Math.sin(th)*r,z=Math.cos(th)*r,h=heightAt(x,z);
    if(h>=minH&&h<=maxH)return{x,z,h};}return null;};
  const CH=24,chunks=new Map();
  const addTo=(key,kind,M,data)=>{let c=chunks.get(key);if(!c){c={x0:0,z0:0,lists:{}};chunks.set(key,c);}(c.lists[kind]=c.lists[kind]||[]).push({M,data});};
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new V3(),P=new V3(),E=new THREE.Euler();
  const plant=(kind,n,offA,offB,hA,hB,sA,sB,tilt=.15)=>{for(let i=0;i<n;i++){const s=reefSpot(offA,offB,hA,hB);if(!s)continue;
    E.set((R2()-.5)*tilt,R2()*6.283,(R2()-.5)*tilt);Q.setFromEuler(E);const k=sA+Math.pow(R2(),1.6)*(sB-sA);S.set(k*(.85+R2()*.3),k,k*(.85+R2()*.3));P.set(s.x,s.h-.04*k,s.z);
    M.compose(P,Q,S);addTo(Math.floor(s.x/CH)+','+Math.floor(s.z/CH),kind,M.clone(),{x:s.x,y:s.h,z:s.z});}};
  plant('lobe',1400,14,70,-11,-1.6,.45,2.3);plant('finger',1100,16,66,-10,-3,.7,1.8);plant('cauliflower',1700,12,60,-6,-1.2,.6,1.4);
  plant('plate',800,22,72,-14,-4,.6,1.7,.3);plant('mushroom',450,20,72,-14,-5,.7,1.4,.1);plant('fan',260,56,84,-19,-10,.8,1.6,.25);plant('limu',2600,6,64,-7,-.6,.6,1.4,.3);
  // gatherable things on the reef and the shore: wana (urchins), and ʻopihi at the waterline on the lava rocks
  const urchinGeo=(()=>{const parts=[paint(new THREE.SphereGeometry(.045,10,8),()=>col(.12,.05,.1))];
    for(let k=0;k<46;k++){const d=new V3(R2()-.5,R2()*.9-.1,R2()-.5).normalize();parts.push(paint(along(new THREE.ConeGeometry(.006,.09+R2()*.05,4),d.clone().multiplyScalar(.035),d,.1),()=>col(.1,.04,.09)));}return merge(parts);})();
  const opihiGeo=(()=>{const g=new THREE.ConeGeometry(.035,.022,14,2);g.translate(0,.011,0);return merge([paint(g,(x,y)=>mixc(col(.35,.3,.22),col(.6,.55,.42),y*30))]);})();
  for(let i=0;i<420;i++){const s=reefSpot(8,62,-8,-1);if(!s)continue;P.set(s.x,s.h+.03,s.z);Q.identity();S.setScalar(.8+R2()*.5);M.compose(P,Q,S);addTo(Math.floor(s.x/CH)+','+Math.floor(s.z/CH),'urchin',M.clone(),{x:s.x,y:s.h,z:s.z});}
  for(let i=0,t=0;i<320&&t<20000;t++){const th=R2()*6.283,c=coastAt(th,MAP),r=c-1.5+R2()*4,x=Math.sin(th)*r,z=Math.cos(th)*r,h=heightAt(x,z);
    if(h<-.25||h>.4||masks(x,z).lava<.4)continue;P.set(x,h,z);Q.setFromUnitVectors(up,tnorm(x,z));S.setScalar(.8+R2()*.5);M.compose(P,Q,S);addTo(Math.floor(x/CH)+','+Math.floor(z/CH),'opihi',M.clone(),{x,y:h,z});i++;}

  const GEO={},MAT={};for(const k in CORALS){GEO[k]=CORALS[k].mk();MAT[k]=CORALS[k].sway?swayMat:coralMat;}
  GEO.urchin=urchinGeo;MAT.urchin=coralMat;GEO.opihi=opihiGeo;MAT.opihi=coralMat;
  // gathering: the look ray hits an instance; taking it hides that one until it grows back
  const hidden=[];const take=(im,id,secs)=>{im.getMatrixAt(id,M);im.userData.keep=im.userData.keep||{};im.userData.keep[id]=M.clone();M.makeScale(0,0,0);im.setMatrixAt(id,M);im.instanceMatrix.needsUpdate=true;hidden.push({im,id,at:nowS()+secs});};
  const GATHER={
    limu:{label:'Limu',verb:'pick limu',e(it){take(it.im,it.hitId,240);give('seaweed',1);note('limu');SFX.pickup();}},
    urchin:{label:'Wana (sea urchin)',verb:'gather the wana',e(it){take(it.im,it.hitId,300);give('wana',1);note('wana');SFX.pickup();}},
    opihi:{label:'ʻOpihi',get verb(){return selKind()==='flake'?'pry one loose':'';},e(it){if(selKind()!=='flake'){toast('ʻOpihi cling hard to the rock. A sharp stone flake would pry one loose.',3.5);return;}
      take(it.im,it.hitId,360);give('opihi',1);note('opihi');SFX.clack();}},
  };
  const list=[];
  for(const [key,c] of chunks){const [cx,cz]=key.split(',').map(Number);c.x0=cx*CH;c.z0=cz*CH;c.meshes=[];
    for(const kind in c.lists){const L=c.lists[kind],im=new THREE.InstancedMesh(GEO[kind],MAT[kind],L.length);L.forEach((o,i)=>im.setMatrixAt(i,o.M));
      im.castShadow=false;im.receiveShadow=true;im.visible=false;im.computeBoundingSphere();
      if(GATHER[kind]){const g=GATHER[kind],item={get verb(){return g.verb;},label:()=>g.label,im,hitId:0,e(){g.e(item);}};im.userData.item=item;interact.push(im);}
      else im.raycast=()=>{};
      scene.add(im);c.meshes.push(im);}
    list.push(c);}

  // ── reef fish: schools that wander over the reef and scatter from you ──
  const fishTex=(draw)=>canvasTex(256,128,(g,w,h)=>draw(g,w,h));
  const band=(g,w,h,u0,u1,c)=>{g.fillStyle=c;g.fillRect(u0*w,0,(u1-u0)*w,h);};
  const SPECIES=[
    {id:'lauipala',n:'Lauʻīpala (yellow tang)',L:.2,H:.17,count:14,schools:6,tex:fishTex((g,w,h)=>{g.fillStyle='#f2cc12';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.9)';g.fillRect(w*.27,h*.48,w*.03,h*.05);})},
    {id:'kihikihi',n:'Kihikihi (Moorish idol)',L:.19,H:.2,count:6,schools:4,fin:2.2,tex:fishTex((g,w,h)=>{g.fillStyle='#f4f0e0';g.fillRect(0,0,w,h);band(g,w,h,.5,.66,'#151515');band(g,w,h,.3,.4,'#151515');band(g,w,h,.4,.5,'#f2d43a');band(g,w,h,.92,1,'#e88a2a');band(g,w,h,0,.27,'#151515');})},
    {id:'manini',n:'Manini (convict tang)',L:.16,H:.1,count:22,schools:6,tex:fishTex((g,w,h)=>{g.fillStyle='#dfe6d8';g.fillRect(0,0,w,h);for(let i=0;i<6;i++)band(g,w,h,.33+i*.105,.345+i*.105,'#1c1c1c');})},
    {id:'humu',n:'Humuhumunukunukuāpuaʻa (reef triggerfish)',L:.22,H:.12,count:3,schools:6,tex:fishTex((g,w,h)=>{g.fillStyle='#c9b99a';g.fillRect(0,0,w,h);g.fillStyle='#222';g.beginPath();g.moveTo(w*.45,h*.3);g.lineTo(w*.8,h*.55);g.lineTo(w*.45,h*.75);g.fill();
      g.strokeStyle='#3a7bd5';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(w*.62,h*(.4+i*.05));g.lineTo(w*.9,h*(.44+i*.05));g.stroke();}g.fillStyle='#e6c13a';g.fillRect(w*.95,h*.45,w*.05,h*.1);band(g,w,h,0,.25,'#3b3b3b');})},
    {id:'uhu',n:'Uhu (parrotfish)',L:.45,H:.17,count:4,schools:4,tex:fishTex((g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#1f6f78');gr.addColorStop(.5,'#3fb3a0');gr.addColorStop(1,'#9ad6c0');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.strokeStyle='rgba(240,140,170,.55)';for(let i=0;i<60;i++){g.beginPath();g.arc(w*(.3+Math.random()*.65),h*(.2+Math.random()*.6),4,0,3.2);g.stroke();}band(g,w,h,0,.25,'#2a8c86');})},
  ];
  const fishGeo=(sp)=>{const L=sp.L,H=sp.H,W=L*.17,g=new THREE.SphereGeometry(1,22,14),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),taper=x<0?1-.75*Math.pow(-x,1.6):1-.25*Math.pow(x,3);p.setXYZ(i,x*L/2,y*H/2*taper,z*W/2*taper);}
    g.computeVertexNormals();
    const fins=new THREE.BufferGeometry(),fl=sp.fin||1,tail=[-L*.45,0,0,-L*.78,H*.42,0,-L*.68,0,0,-L*.45,0,0,-L*.68,0,0,-L*.78,-H*.42,0],dors=[-L*.25,H*.4,0,L*.1,H*.46,0,-L*.32,H*(.4+.5*fl),0],an=[-L*.2,-H*.4,0,L*.05,-H*.44,0,-L*.3,-H*.72,0];
    fins.setAttribute('position',new THREE.Float32BufferAttribute([...tail,...dors,...an],3));fins.computeVertexNormals();
    const all=[g.toNonIndexed(),fins];const out=merge(all.map(q=>{if(!q.attributes.normal)q.computeVertexNormals();return q;}));
    const pp=out.attributes.position,uv=new Float32Array(pp.count*2),x0=-L*.8,x1=L/2,hm=H*(.8+.5*fl);
    for(let i=0;i<pp.count;i++){uv[i*2]=(pp.getX(i)-x0)/(x1-x0);uv[i*2+1]=clamp01((pp.getY(i)+hm/2)/hm);}out.setAttribute('uv',new THREE.BufferAttribute(uv,2));return out;};
  const schools=[],FU=uniform(0);
  for(const sp of SPECIES){const geo=fishGeo(sp),mat=new THREE.MeshStandardNodeMaterial({map:sp.tex,side:THREE.DoubleSide,roughness:.62,metalness:0,envMapIntensity:.45});
    {const side=attribute('aSide','vec3'),ph=attribute('aPh','float'),x=positionGeometry.x.div(sp.L);
     const w=pow(clamp(float(.3).sub(x),0,1.3),2);mat.positionNode=positionLocal.add(side.mul(sin(FU.mul(9).add(ph).sub(x.mul(5))).mul(w).mul(sp.L*.18)));}
    for(let k=0;k<sp.schools;k++){const s=reefSpot(14,70,-12,-2.5);if(!s)continue;const n=sp.count,g2=geo.clone(),im=new THREE.InstancedMesh(g2,mat,n);
      const aSide=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3),aPh=new THREE.InstancedBufferAttribute(new Float32Array(n).map(()=>R2()*6.28),1);g2.setAttribute('aSide',aSide);g2.setAttribute('aPh',aPh);
      im.frustumCulled=false;im.visible=false;im.boundingSphere=new THREE.Sphere(new V3(s.x,s.h+1.5,s.z),9);scene.add(im);
      const fish=Array.from({length:n},()=>({o:new V3((R2()-.5)*2.4,(R2()-.5)*.9,(R2()-.5)*2.4),p:new V3(s.x+(R2()-.5)*2,s.h+1.4,s.z+(R2()-.5)*2),v:new V3(),gone:0,sc:.85+R2()*.3}));
      const sc={sp,im,aSide,fish,home:s,c:new V3(s.x,s.h+1.4,s.z),t:R2()*100,r:3+R2()*6};
      im.userData.item={label:()=>sp.n,get verb(){return selKind()==='spear'?'click to spear one':'';},hitId:0,use(k){if(k!=='spear')return false;const f=fish[im.userData.item.hitId];if(!f||f.gone)return false;
        f.gone=nowS()+150;give('fish',1);note('spearfish');SFX.splash(.3);handAnim=1;return true;}};
      interact.push(im);schools.push(sc);}}
  const fwd=new V3(1,0,0),tmp=new V3(),tq=new THREE.Quaternion(),side=new V3(0,0,1);
  function updateSchools(dt,t,near){
    for(const sc of schools){const far=sc.home.x-camera.position.x,fz=sc.home.z-camera.position.z,dd=Math.hypot(far,fz);sc.im.visible=near&&dd<60;if(!sc.im.visible)continue;
      sc.t+=dt;const s=sc.home,bed=heightAt(sc.c.x,sc.c.z);if(Math.hypot(sc.c.x-player.x,sc.c.z-player.z)<8)W.seen[sc.sp.n]=1;
      tmp.set(s.x+Math.sin(sc.t*.09)*sc.r,Math.max(bed+1.1,Math.min(seaY()-1,s.h+1.4+Math.sin(sc.t*.21)*.6)),s.z+Math.cos(sc.t*.07)*sc.r);
      const px=player.x-sc.c.x,pz=player.z-sc.c.z,py=player.y+1.4-sc.c.y,pd=Math.hypot(px,py,pz);if(pd<5)tmp.add(new V3(-px,-py*.3,-pz).multiplyScalar(2.2/Math.max(pd,.5))); // keep a few body lengths from you
      sc.c.lerp(tmp,1-Math.exp(-dt*.8));
      sc.fish.forEach((f,i)=>{if(f.gone){if(nowS()>f.gone)f.gone=0;else{M.makeScale(0,0,0);sc.im.setMatrixAt(i,M);return;}}
        const a=sc.t*.25+i;const want=sc.c.clone().add(new V3(f.o.x*Math.cos(a*.3)-f.o.z*Math.sin(a*.3),f.o.y+Math.sin(a)*.15,f.o.x*Math.sin(a*.3)+f.o.z*Math.cos(a*.3)));
        const qx=f.p.x-player.x,qy=f.p.y-player.y-1.4,qz=f.p.z-player.z,qd=Math.hypot(qx,qy,qz);if(qd<2.2)want.add(new V3(qx,qy*.4,qz).multiplyScalar(2/Math.max(qd,.3)));
        f.v.addScaledVector(want.sub(f.p),dt*2.2).multiplyScalar(Math.exp(-dt*1.6));const sp=f.v.length();if(sp>2.4)f.v.multiplyScalar(2.4/sp);
        f.p.addScaledVector(f.v,dt);const by=heightAt(f.p.x,f.p.z)+.25;if(f.p.y<by)f.p.y=by;if(f.p.y>seaY()-.35)f.p.y=seaY()-.35;
        const hv=Math.hypot(f.v.x,f.v.z)+1e-4,yaw=Math.atan2(-f.v.z,f.v.x),pitch=Math.atan2(f.v.y,hv)*.6;E.set(0,yaw,pitch,'YZX');tq.setFromEuler(E);
        S.setScalar(f.sc);M.compose(f.p,tq,S);sc.im.setMatrixAt(i,M);side.set(0,0,1).applyQuaternion(tq).multiplyScalar(f.sc);sc.aSide.setXYZ(i,side.x,side.y,side.z);});
      sc.im.instanceMatrix.needsUpdate=true;sc.aSide.needsUpdate=true;sc.im.boundingSphere.center.copy(sc.c);}
  }

  // ── larger animals, each its own little model ──
  const mt2=(r,g,b,ro=.6)=>new THREE.MeshStandardNodeMaterial({color:srgb(r,g,b),roughness:ro});
  const vc=(ro=.55,side)=>new THREE.MeshStandardNodeMaterial({vertexColors:true,roughness:ro,side:side||THREE.FrontSide});
  const proxy=(g,w,h,d)=>{const px=new THREE.Mesh(geo.box,proxyMat);px.scale.set(w,h,d);g.add(px);return px;};
  const animals=[];
  // honu: green sea turtle, a mottled olive shell and scaled grey-green skin; flippers row slowly
  function makeHonu(){const g=new THREE.Group(),shellG=new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI/2),p=shellG.attributes.position;
    for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*.5,p.getY(i)*.2,p.getZ(i)*.4);shellG.computeVertexNormals();
    paint(shellG,(x,y,z)=>{const cell=vnoise(x*14+3,z*14),seam=smooth(.08,.0,Math.abs(cell-.5));return mixc(mixc(col(.36,.3,.16),col(.5,.42,.22),fbm(x*9,z*9,2)),col(.15,.12,.07),seam*.7);});
    const shell=new THREE.Mesh(shellG,vc(.45));g.add(shell);
    const belly=new THREE.Mesh(new THREE.SphereGeometry(1,20,8,0,Math.PI*2,Math.PI/2,Math.PI/2).scale(.46,.06,.37),mt2(.75,.72,.55,.7));g.add(belly);
    const skin=mt2(.42,.45,.36,.7),head=new THREE.Mesh(new THREE.SphereGeometry(.06,14,10).scale(1.5,.85,.95),skin);head.position.set(.52,.0,0);g.add(head);
    const fl=[];for(const [x,z,L,sx] of [[.25,.3,.42,1],[.25,-.3,.42,-1],[-.33,.22,.18,1],[-.33,-.22,.18,-1]]){const piv=new THREE.Group();piv.position.set(x,-.01,z*.9);
      const f=new THREE.Mesh(new THREE.SphereGeometry(1,12,8).scale(L*.32,.025,L/2),skin);f.position.set(-L*.15,0,sx*L*.42);f.rotation.y=sx*.5;piv.add(f);g.add(piv);fl.push({piv,sx,front:L>.3});}
    g.traverse(o=>{if(o.isMesh){o.castShadow=false;}});g.userData.fl=fl;g.scale.setScalar(1.25);return g;}
  // hāhālua: manta ray, black above and white below, gliding with slow wingbeats
  function makeManta(){const g=new THREE.Group(),pg=new THREE.PlaneGeometry(3,1.9,30,16),p=pg.attributes.position,col0=new Float32Array(p.count*3);pg.rotateX(-Math.PI/2);
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),u=Math.abs(x)/1.5,w=(1-u*u)*.95*(1-Math.abs(z)/1.1*u*.6);const zz=z*Math.max(.15,1-u*1.2)+u*u*.35;p.setXYZ(i,x,(1-u)*.1*Math.cos(z*1.6),zz);}
    pg.computeVertexNormals();const m=new THREE.MeshStandardNodeMaterial({side:THREE.DoubleSide,roughness:.5});
    {const {faceDirection,mix,abs}=TSL,x=positionGeometry.x;m.colorNode=mix(vec3(.9,.9,.88),vec3(.04,.045,.05),faceDirection.mul(.5).add(.5));
     m.positionNode=positionLocal.add(vec3(0,sin(FU.mul(1.3).sub(abs(x).mul(1.1))).mul(pow(abs(x).div(1.5),1.5)).mul(.42),0));}
    const body=new THREE.Mesh(pg,m);g.add(body);const tail=new THREE.Mesh(new THREE.CylinderGeometry(.01,.03,1.4,5).rotateX(Math.PI/2),mt2(.06,.06,.07));tail.position.set(0,.02,-1.3);g.add(tail);
    for(const s of[-1,1]){const lobe=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6).scale(.4,.3,1.4),mt2(.06,.06,.07));lobe.position.set(s*.28,0,1.05);g.add(lobe);}
    g.rotation.y=Math.PI/2;const outer=new THREE.Group();outer.add(g);return outer;}
  // manō: whitetip reef shark, slender grey with white fin tips
  function makeShark(){const pts=[];for(let i=0;i<=24;i++){const t=i/24,r=.2*Math.pow(Math.sin(Math.PI*Math.pow(t,.75)),.9)*(1-.35*t)+.005;pts.push(new THREE.Vector2(r,t*1.7-.85));}
    const lg=new THREE.LatheGeometry(pts,18);lg.rotateZ(-Math.PI/2);const p=lg.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)*.85);lg.computeVertexNormals();
    paint(lg,(x,y,z)=>mixc(col(.88,.88,.86),col(.4,.43,.46),smooth(-.06,.06,y)));
    const fins=new THREE.BufferGeometry();fins.setAttribute('position',new THREE.Float32BufferAttribute([.05,.15,0,-.25,.15,0,-.2,.48,0, -.75,0,0,-1.05,.42,0,-.95,0,0, -.75,0,0,-.95,0,0,-1.0,-.25,0, .35,-.08,0,.05,-.1,0,-.05,-.32,.22, .35,-.08,0,.05,-.1,0,-.05,-.32,-.22],3));fins.computeVertexNormals();
    paint(fins,(x,y)=>Math.abs(y)>.3||x<-.98?col(.92,.92,.9):col(.4,.43,.46));
    const geo2=merge([lg,fins.toNonIndexed?fins:fins]);const m=vc(.45,THREE.DoubleSide);
    {const x=positionGeometry.x,w=pow(clamp(float(.2).sub(x),0,1.4),2);m.positionNode=positionLocal.add(vec3(0,0,sin(FU.mul(2.4).sub(x.mul(3.2))).mul(w).mul(.16)));}
    const g=new THREE.Group();g.add(new THREE.Mesh(geo2,m));g.scale.setScalar(1.15);return g;}
  // heʻe: day octopus, mottled red-brown, arms curling and waving; changes shade to match the reef
  function makeHee(){const g=new THREE.Group(),sk=vc(.5),parts=[];
    const mantle=new THREE.SphereGeometry(.09,16,12).scale(1,1.25,1.1).translate(-.02,.12,0);parts.push(paint(mantle,(x,y,z)=>mixc(col(.55,.27,.17),col(.75,.48,.33),vnoise(x*60,z*60+y*40))));
    for(let a=0;a<8;a++){const an=a/8*6.283,pts=[];for(let k=0;k<=8;k++){const t=k/8;pts.push(new V3(Math.cos(an)*(.05+t*.34),.04+Math.sin(t*2.4+a)*.04-t*.03,Math.sin(an)*(.05+t*.34)));}
      const tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.018,5,false),tp=tg.attributes.position;for(let i=0;i<tp.count;i++){} // tapered below
      const t2=tg.attributes.position;for(let i=0;i<t2.count;i++){const seg=Math.floor(i/6)/16,cx=Math.cos(an)*(.05+seg*.34),cz=Math.sin(an)*(.05+seg*.34),k=1-seg*.8,y=t2.getY(i),cy=.04+Math.sin(seg*2.4+a)*.04-seg*.03;
        t2.setXYZ(i,cx+(t2.getX(i)-cx)*k,cy+(y-cy)*k,cz+(t2.getZ(i)-cz)*k);}tg.computeVertexNormals();
      sway(tg,(x,y,z)=>Math.hypot(x,z)*3);parts.push(paint(tg,(x,y,z)=>mixc(col(.6,.3,.2),col(.85,.6,.45),vnoise(x*70,z*70))));}
    const m=vc(.5);{const sw=attribute('aSway','float');m.positionNode=positionLocal.add(vec3(sin(FU.mul(1.7).add(positionGeometry.x.mul(9))),sin(FU.mul(2.1).add(positionGeometry.z.mul(8))).mul(.6),cos(FU.mul(1.5).add(positionGeometry.z.mul(9)))).mul(sw).mul(.03));}
    g.add(new THREE.Mesh(merge(parts),m));return g;}
  // ula: Hawaiian spiny lobster, banded red-brown with white spots and long antennae
  function makeUla(){const g=new THREE.Group(),parts=[];const shell=(x,y,z)=>mixc(col(.5,.2,.12),col(.85,.8,.7),step2(vnoise(x*90,z*90+y*50),.82));
    parts.push(paint(new THREE.CylinderGeometry(.045,.05,.16,10).rotateZ(Math.PI/2).translate(.08,.05,0),shell));
    for(let k=0;k<5;k++)parts.push(paint(new THREE.CylinderGeometry(.04-k*.004,.042-k*.004,.04,10).rotateZ(Math.PI/2).translate(-.02-k*.038,.045-k*.003,0),shell));
    parts.push(paint(new THREE.ConeGeometry(.05,.05,8).rotateZ(Math.PI/2).translate(-.22,.03,0).scale(1,.4,1.3),shell));
    const ant=[];for(const s of[-1,1]){parts.push(paint(along(new THREE.CylinderGeometry(.004,.012,.42,5),new V3(.15,.07,s*.03),new V3(1,.25,s*.35),.42),()=>col(.55,.25,.15)));}
    for(let k=0;k<4;k++)for(const s of[-1,1])parts.push(paint(along(new THREE.CylinderGeometry(.005,.007,.09,4),new V3(.1-k*.03,.04,s*.04),new V3(0,-.6,s),.09),()=>col(.5,.22,.14)));
    g.add(new THREE.Mesh(merge(parts),vc(.5)));return g;}
  const step2=(v,e)=>v>e?1:0;
  // ʻaʻama: the black rock crab of the lava shore, quick to scuttle into the surge
  function makeAama(){const g=new THREE.Group(),parts=[];parts.push(paint(new THREE.SphereGeometry(.05,12,8).scale(1,.38,.85).translate(0,.035,0),(x,y,z)=>mixc(col(.12,.07,.06),col(.35,.12,.08),smooth(-.02,.04,z*0+x))));
    for(let k=0;k<4;k++)for(const s of[-1,1])parts.push(paint(along(new THREE.CylinderGeometry(.004,.006,.08,4),new V3(-.02+k*.015,.03,s*.035),new V3(k*.2-.3,-.5,s),.08),()=>col(.15,.08,.07)));
    for(const s of[-1,1])parts.push(paint(new THREE.SphereGeometry(.014,6,5).scale(1.4,1,1).translate(.055,.035,s*.025),()=>col(.6,.25,.12)));
    g.add(new THREE.Mesh(merge(parts),vc(.35)));return g;}

  const KIND={
    honu:{n:'Honu (green sea turtle)',mk:makeHonu,count:4,box:[1.3,.5,1.1],verb:'swim alongside',e(a){note('honu');toast('Honu are protected here. You swim alongside for a while, and it lets you.',4);}},
    manta:{n:'Hāhālua (manta ray)',mk:makeManta,count:1,box:[3,.4,2],verb:'',e(){}},
    shark:{n:'Manō (whitetip reef shark)',mk:makeShark,count:2,box:[2,.5,.6],verb:'',e(){}},
    hee:{n:'Heʻe (octopus)',mk:makeHee,count:7,box:[.6,.35,.6],verb:'catch the heʻe',e(a){const p=selKind()==='spear'?.85:.5;if(Math.random()<p){a.away(240);give('hee',1);note('hee');SFX.splash(.3);}else{a.flee();toast('The heʻe squirts ink and jets away.',2.5);}}},
    ula:{n:'Ula (spiny lobster)',mk:makeUla,count:9,box:[.5,.2,.3],verb:'grab the ula',e(a){if(Math.random()<.7){a.away(260);give('ula',1);note('ula');SFX.pickup();}else{a.flee();toast('The ula flicks its tail and shoots backwards.',2.5);}}},
    aama:{n:'ʻAʻama (rock crab)',mk:makeAama,count:12,box:[.3,.15,.3],verb:'grab the ʻaʻama',e(a){if(Math.random()<.45){a.away(200);give('aama',1);note('aama');SFX.pickup();}else{a.flee();}}},
  };
  for(const k in KIND){const K2=KIND[k];for(let i=0;i<K2.count;i++){
    let s=null;
    if(k==='aama'){for(let t=0;t<400&&!s;t++){const th=R2()*6.283,c=coastAt(th,MAP),r=c-1+R2()*3,x=Math.sin(th)*r,z=Math.cos(th)*r,h=heightAt(x,z);if(h>-.1&&h<.5&&masks(x,z).lava>.45)s={x,z,h};}}
    else if(k==='manta'||k==='shark')s=reefSpot(64,82,-19,-9);else if(k==='ula')s=reefSpot(16,66,-12,-4);else s=reefSpot(14,66,-11,-2);
    if(!s)continue;const g=K2.mk();g.position.set(s.x,s.h,s.z);g.visible=false;scene.add(g);
    const a={k,g,home:{...s},p:new V3(s.x,s.h,s.z),yaw:R2()*6.28,t:R2()*100,gone:0,fleeT:0,fleeTo:null,
      away(secs){a.gone=nowS()+secs;g.visible=false;},flee(){a.fleeT=2.2;const d=Math.atan2(a.p.x-player.x,a.p.z-player.z);a.fleeTo=new V3(a.p.x+Math.sin(d)*4,0,a.p.z+Math.cos(d)*4);inkAt(a.p);}};
    proxy(g,...K2.box).position.y=K2.box[1]/2;
    g.userData.item={label:()=>K2.n,get verb(){return K2.verb;},e(){K2.e(a);}};interact.push(g);animals.push(a);}}
  // a puff of ink: a dark cloud that spreads and fades
  const ink=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicNodeMaterial({color:new THREE.Color(.02,.015,.03),transparent:true,opacity:0,depthWrite:false}));ink.visible=false;scene.add(ink);let inkT=0;
  function inkAt(p){if(p.y>seaY()-.2)return;ink.position.copy(p);ink.position.y+=.15;inkT=1.6;ink.visible=true;}
  function updateAnimals(dt,t,near){
    for(const a of animals){const g=a.g;if(a.gone){if(nowS()>a.gone){a.gone=0;const s=a.k==='aama'?a.home:(reefSpot(14,66,a.k==='ula'?-12:-11,a.k==='ula'?-4:-2)||a.home);a.p.set(s.x,s.h,s.z);a.home={...s};}else{g.visible=false;continue;}}
      const dd=Math.hypot(a.p.x-camera.position.x,a.p.z-camera.position.z);g.visible=(near||a.k==='aama')&&dd<(a.k==='manta'||a.k==='shark'?80:45);if(!g.visible&&a.k!=='shark'&&a.k!=='manta')continue;
      a.t+=dt;const h0=a.home,pd=Math.hypot(a.p.x-player.x,a.p.z-player.z);if(pd<10&&g.visible)W.seen[KIND[a.k].n]=1;
      if(a.k==='honu'){const r=10;const tx=h0.x+Math.sin(a.t*.035)*r,tz=h0.z+Math.cos(a.t*.028)*r,bed=heightAt(a.p.x,a.p.z);const breathe=Math.sin(a.t*.02)>.93; // now and then a honu rises to breathe
        const ty=breathe?seaY()-.25:Math.max(bed+.5,Math.min(seaY()-1.2,h0.h+1.2));moveTo(a,tx,ty,tz,.55,dt);
        for(const f of g.userData.fl){const ph=a.t*(f.front?1.6:2.2);f.piv.rotation.x=f.sx*Math.sin(ph)*(f.front?.55:.25);f.piv.rotation.y=f.sx*(.2+Math.sin(ph+1.2)*.25);}}
      else if(a.k==='manta'){const R=26,tx=h0.x+Math.sin(a.t*.025)*R,tz=h0.z+Math.cos(a.t*.025)*R;moveTo(a,tx,Math.min(seaY()-3,heightAt(a.p.x,a.p.z)+3.5),tz,1.1,dt);g.rotation.z=Math.sin(a.t*.3)*.12;}
      else if(a.k==='shark'){const close=pd<14&&player.uw;const R=close?6:30,cx=close?player.x:h0.x,cz=close?player.z:h0.z,an=a.t*(close?.14:.035);
        moveTo(a,cx+Math.sin(an)*R,Math.max(heightAt(a.p.x,a.p.z)+1.2,Math.min(seaY()-2,(close?player.y+1.2:h0.h+2.5))),cz+Math.cos(an)*R,close?1.6:1.2,dt);}
      else if(a.k==='hee'||a.k==='ula'||a.k==='aama'){
        if(!a.fleeT&&pd<(a.k==='aama'?2.6:1.6)&&Math.random()<dt*(a.k==='aama'?1.2:.25))a.flee(); // shy: they slip away if you crowd them
        if(a.fleeT>0){a.fleeT-=dt;const sp=a.k==='aama'?1.6:a.k==='hee'?2.2:2.6;const dx=a.fleeTo.x-a.p.x,dz=a.fleeTo.z-a.p.z,l=Math.hypot(dx,dz);if(l>.05){a.p.x+=dx/l*Math.min(l,sp*dt);a.p.z+=dz/l*Math.min(l,sp*dt);a.yaw=Math.atan2(-dz,dx)+(a.k==='ula'?Math.PI:0);}
          if(a.fleeT<=0){a.fleeT=0;a.home={x:a.p.x,z:a.p.z,h:heightAt(a.p.x,a.p.z)};}}
        a.p.y=heightAt(a.p.x,a.p.z);if(a.k==='aama'&&a.p.y<seaY()-.2){a.p.x+=(a.home.x-a.p.x)*dt;a.p.z+=(a.home.z-a.p.z)*dt;}
        g.position.copy(a.p);g.rotation.y=a.yaw;continue;}
      g.position.copy(a.p);g.rotation.y=a.yaw;}
    if(inkT>0){inkT-=dt;const k=1-inkT/1.6;ink.scale.setScalar(.2+k*1.3);ink.material.opacity=.75*(1-k);if(inkT<=0)ink.visible=false;}
  }
  function moveTo(a,tx,ty,tz,sp,dt){const dx=tx-a.p.x,dy=ty-a.p.y,dz=tz-a.p.z,l=Math.hypot(dx,dz)+1e-4;const want=Math.atan2(-dz,dx);let d=want-a.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));a.yaw+=d*Math.min(1,dt*.8);
    a.p.x+=Math.cos(a.yaw)*sp*dt*Math.min(1,l);a.p.z-=Math.sin(a.yaw)*sp*dt*Math.min(1,l);a.p.y+=dy*Math.min(1,dt*.6);}

  return {
    update(dt,t){U2.t.value=t;FU.value=t;
      const c=camera.position,wy=freshAt(c.x,c.z),near=c.y<(wy!=null?wy:seaY())+3.5;  // drawn while you are in the water or just above it
      for(const ch of list){const dx=Math.max(ch.x0-c.x,0,c.x-ch.x0-CH),dz=Math.max(ch.z0-c.z,0,c.z-ch.z0-CH),on=near&&Math.hypot(dx,dz)<55;for(const m of ch.meshes)m.visible=on;}
      updateSchools(dt,t,near);updateAnimals(dt,t,near);
      for(let i=hidden.length-1;i>=0;i--)if(nowS()>hidden[i].at){const h=hidden[i];h.im.setMatrixAt(h.id,h.im.userData.keep[h.id]);h.im.instanceMatrix.needsUpdate=true;hidden.splice(i,1);}
    },
    get counts(){const n={};for(const ch of list)for(const k in ch.lists)n[k]=(n[k]||0)+ch.lists[k].length;n.fish=schools.reduce((a,s)=>a+s.fish.length,0);n.schools=schools.length;n.animals=animals.length;return n;},
    animals,schools
  };
})();

