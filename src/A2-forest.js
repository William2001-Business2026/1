/* ───────────────────────── Wao Nahele: the Hawaiian rainforest ─────────────────────────
   Ten Hawaiian trees. Most are drawn by real photo-scanned trees (near and far versions); banyan, loulu and the hāpuʻu trunks are
   built in code from the scanned bark. All share the island's wind. They grow where they would: koa, ʻōhiʻa and hāpuʻu in the forest and up the mountain, loulu on its
   ridges, milo by the shore, wiliwili on the dry lava side, ʻulu, kukui and ʻōhiʻa ʻai near water and people, and a banyan or
   two. Trees are instanced per kind in 64 m chunks. */
function forestW(x,z){const e=Math.hypot((x-FOREST.x)/36,(z-FOREST.z)/52),m=masks(x,z);return smooth(1,.72,e+(fbm(x*.04+3,z*.04,2)-.5)*.35)*smooth(18,30,m.d)*(1-m.lava);}
window.__tF0=performance.now();const FLORA=(()=>{
  const R3=rng(9191),V3=THREE.Vector3,up=new V3(0,1,0),C=(h)=>new THREE.Color(h);
  // ── leaf textures: sprigs drawn on a canvas, with alpha ──
  // a dense cluster of leaves on a few twigs, darker toward its heart, with flowers or fruit on top
  const sprig=(o)=>{const t=canvasTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const r=rng(o.seed||1);
      g.strokeStyle=o.twig||'#5a4630';g.lineWidth=3;for(let k=0;k<5;k++){g.beginPath();g.moveTo(w*.5,h*.98);g.quadraticCurveTo(w*(.5+(r()-.5)*.3),h*.6,w*(.18+r()*.64),h*(.12+r()*.4));g.stroke();}
      const leaf=(L)=>{g.beginPath();if(o.shape==='sickle'){g.moveTo(0,0);g.quadraticCurveTo(L*.5,-L*.14,L,-L*.42);g.quadraticCurveTo(L*.45,L*.06,0,0);}
        else if(o.shape==='lobed'||o.shape==='ulu'){const lobes=o.shape==='ulu'?7:3;g.moveTo(0,0);for(let k=0;k<=lobes*2;k++){const u=k/(lobes*2),rr=L*(.35+.65*Math.sin(Math.PI*u))*(k%2?.55:1);g.lineTo(Math.cos((u-.5)*2.4)*rr+L*.15,Math.sin((u-.5)*2.4)*rr);}g.closePath();}
        else if(o.shape==='trifol'){for(const q of[-.6,0,.6])g.ellipse(Math.cos(q)*L*.5,Math.sin(q)*L*.5,L*.42,L*.22,q,0,6.3);}
        else g.ellipse(L*.5,0,L*.5,L*.2*(o.wide||1),0,0,6.3);g.fill();};
      const c0=new THREE.Color(o.col[0]),c1=new THREE.Color(o.col[1]),c=new THREE.Color();
      for(let i=0;i<o.n;i++){const a=r()*6.283,q=Math.sqrt(r()),x=w*.5+Math.cos(a)*q*w*.44,y=h*.5+Math.sin(a)*q*h*.42,L=w*o.len*(.7+r()*.6),shade=.55+.45*q+(r()-.5)*.15;
        c.copy(c0).lerp(c1,r()).multiplyScalar(Math.min(1.15,shade));g.fillStyle='#'+c.getHexString();g.save();g.translate(x,y);g.rotate(a+(r()-.5)*1.4);leaf(L);
        g.strokeStyle='rgba(0,0,0,.15)';g.lineWidth=1;g.beginPath();g.moveTo(0,0);g.lineTo(L*.85,o.shape==='sickle'?-L*.3:0);g.stroke();g.restore();}
      if(o.flowers)for(let i=0;i<o.fl;i++){const x=w*(.2+r()*.6),y=h*(.15+r()*.6);g.strokeStyle=o.flowers;g.lineWidth=1.6; // lehua: a pompom of stamens
        for(let k=0;k<30;k++){const a=r()*6.28,l=6+r()*9;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}}
      if(o.fruit)for(let i=0;i<o.fruitN;i++){const x=w*(.3+r()*.4),y=h*(.35+r()*.4),rr=o.fruitR*(.8+r()*.4);g.fillStyle=o.fruit;g.beginPath();g.arc(x,y,rr,0,6.3);g.fill();g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.arc(x-rr*.3,y-rr*.3,rr*.35,0,6.3);g.fill();}
    });t.colorSpace=THREE.SRGBColorSpace;return t;};
  const frondTex=canvasTex(128,512,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#4a3a22';g.lineWidth=3;g.beginPath();g.moveTo(w/2,h);g.lineTo(w/2,0);g.stroke(); // hāpuʻu: a frond of pinnae
    for(let i=0;i<46;i++){const y=h*(1-i/46),L=w*.48*Math.sin(Math.PI*Math.min(1,(i+4)/50));for(const s of[-1,1]){g.fillStyle=i%3?'#4f7a2e':'#5e8a36';g.beginPath();g.moveTo(w/2,y);
      for(let k=0;k<=8;k++){const u=k/8;g.lineTo(w/2+s*L*u,y-6*u+Math.sin(u*25)*1.6);}for(let k=8;k>=0;k--){const u=k/8;g.lineTo(w/2+s*L*u,y-6*u-5*(1-u));}g.fill();}}});
  const strapTex=canvasTex(64,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#b7a64a');gr.addColorStop(.12,'#4f6b2a');gr.addColorStop(.5,'#5f7d34');gr.addColorStop(.88,'#4f6b2a');gr.addColorStop(1,'#b7a64a');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(0,0,0,.2)';g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();});
  const fanTex=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#55712f';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.strokeStyle=i%2?'rgba(0,0,0,.25)':'rgba(255,255,220,.15)';g.lineWidth=2;g.beginPath();g.moveTo(w*i/40,0);g.lineTo(w*i/40,h);g.stroke();}});
  const LEAF={
    koa:sprig({shape:'sickle',col:['#56724c','#76906a'],n:170,len:.11,seed:3}),
    ohia:sprig({shape:'oval',col:['#3a5829','#557236'],n:300,len:.055,wide:1.6,flowers:'#c8202a',fl:6,seed:4}),
    kukui:sprig({shape:'lobed',col:['#6f8558','#93a67c'],n:70,len:.14,seed:5}),
    ulu:sprig({shape:'ulu',col:['#2b4a20','#43662d'],n:20,len:.3,fruit:'#7f9c3c',fruitN:3,fruitR:15,seed:6}),
    banyan:sprig({shape:'oval',col:['#294520','#3e5d2c'],n:280,len:.06,wide:1.4,seed:7}),
    wiliwili:sprig({shape:'trifol',col:['#82a05a','#a2b674'],n:110,len:.08,flowers:'#e98a34',fl:4,seed:8}),
    ohiaai:sprig({shape:'oval',col:['#2a4522','#476631'],n:150,len:.09,fruit:'#a8173c',fruitN:5,fruitR:9,seed:9}),
  };
  // ── geometry builders ──
  const parts=[],leafParts=[];
  const tube=(from,to,r0,r1,seg=7,col)=>{const d=to.clone().sub(from),L=d.length(),g=new THREE.CylinderGeometry(r1,r0,L,seg,Math.max(1,Math.round(L/1.5)),true);
    g.translate(0,L/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,d.normalize()));g.translate(from.x,from.y,from.z);
    const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(1,r0*6),uv.getY(i)*L*.6);return g;};
  const card=(c,s,outward,flexBase=.4)=>{const g=new THREE.PlaneGeometry(s,s);const q=new THREE.Quaternion().setFromUnitVectors(new V3(0,0,1),outward.clone().add(new V3((R3()-.5)*.9,(R3()-.3)*.8,(R3()-.5)*.9)).normalize());
    g.rotateZ(R3()*6.28);g.applyQuaternion(q);g.translate(c.x,c.y,c.z);const n=g.attributes.normal,fl=new Float32Array(4).fill(1);
    for(let i=0;i<4;i++){const o=outward.clone().normalize().multiplyScalar(.7).add(new V3(n.getX(i),n.getY(i),n.getZ(i)).multiplyScalar(.3)).normalize();n.setXYZ(i,o.x,o.y,o.z);} // soft canopy shading
    g.setAttribute('aFlex',new THREE.BufferAttribute(fl,1));return g;};
  // a limb that forks: returns tip points where leaves go
  function limb(from,dir,len,r,depth,spread,tips,bend=0){const to=from.clone().addScaledVector(dir,len);to.y+=bend*len;parts.push(tube(from,to,r,r*.68,depth>1?6:5));
    if(depth<=0){tips.push(to);return;}const n=depth>2?3:2;for(let i=0;i<n;i++){const a=R3()*6.283,d=dir.clone().add(new V3(Math.cos(a)*spread,.25+R3()*.3,Math.sin(a)*spread)).normalize();
      limb(to,d,len*(.62+R3()*.18),r*.66,depth-1,spread,tips,bend);}}
  const crown=(tips,ctr,count,size,flex)=>{for(let i=0;i<count;i++){const tp=tips[i%tips.length],o=tp.clone().sub(ctr);o.y*=.6;const p=tp.clone().add(new V3((R3()-.5)*size*1.4,(R3()-.4)*size,(R3()-.5)*size*1.4));
      leafParts.push(card(p,size*(.75+R3()*.5),o.lengthSq()<.01?up:o,flex));}};
  const BUILD={
    koa(){const H=15,tips=[],base=new V3(0,0,0),top=new V3(.3,H*.42,0);parts.push(tube(base,top,.55,.38,9));for(let k=0;k<5;k++){const a=k/5*6.283+R3();limb(top,new V3(Math.cos(a)*.9,.75,Math.sin(a)*.9).normalize(),H*.28,.3,3,.75,tips,-.05);}
      crown(tips,new V3(0,H*.75,0),200,2.3);return{leaf:'koa',H};},
    ohia(){const H=10,tips=[];let p=new V3(0,0,0),d=up.clone();for(let s=0;s<3;s++){const q=p.clone().addScaledVector(d,H*.16);q.x+=(R3()-.5)*.8;q.z+=(R3()-.5)*.8;parts.push(tube(p,q,.28-.05*s,.22-.05*s,8));p=q;}
      for(let k=0;k<4;k++){const a=k/4*6.283+R3();limb(p,new V3(Math.cos(a)*.7,.9,Math.sin(a)*.7).normalize(),H*.2,.16,3,.9,tips);}crown(tips,new V3(0,H*.72,0),170,1.7);return{leaf:'ohia',H};},
    kukui(){const H=12,tips=[],top=new V3(0,H*.38,0);parts.push(tube(new V3(),top,.38,.3,8));for(let k=0;k<4;k++){const a=k/4*6.283+R3();limb(top,new V3(Math.cos(a)*.8,.8,Math.sin(a)*.8).normalize(),H*.27,.22,3,.8,tips);}
      crown(tips,new V3(0,H*.72,0),170,2);return{leaf:'kukui',H};},
    ulu(){const H=11,tips=[],top=new V3(0,H*.3,0);parts.push(tube(new V3(),top,.4,.32,8));for(let k=0;k<5;k++){const a=k/5*6.283+R3();limb(top,new V3(Math.cos(a)*.75,.7,Math.sin(a)*.75).normalize(),H*.25,.22,2,.9,tips);}
      crown(tips,new V3(0,H*.65,0),140,2.2);return{leaf:'ulu',H};},
    ohiaai(){const H=10,tips=[],top=new V3(0,H*.45,0);parts.push(tube(new V3(),top,.25,.2,8));for(let k=0;k<4;k++){const a=k/4*6.283+R3();limb(top,new V3(Math.cos(a)*.45,1,Math.sin(a)*.45).normalize(),H*.22,.14,3,.55,tips);}
      crown(tips,new V3(0,H*.75,0),160,1.8);return{leaf:'ohiaai',H};},
    wiliwili(){const H=8,tips=[],top=new V3(0,H*.35,0);parts.push(tube(new V3(),top,.3,.24,8));for(let k=0;k<3;k++){const a=k/3*6.283+R3();limb(top,new V3(Math.cos(a)*1,.6,Math.sin(a)*1).normalize(),H*.3,.17,3,1.1,tips,-.08);}
      crown(tips,new V3(0,H*.7,0),100,1.7);return{leaf:'wiliwili',H};},
    banyan(){const H=16,tips=[],top=new V3(0,H*.28,0);parts.push(tube(new V3(),top,1.3,1,12));
      for(let k=0;k<7;k++){const a=k/7*6.283+R3(),d=new V3(Math.cos(a),.28,Math.sin(a)).normalize(),end=top.clone().addScaledVector(d,6+R3()*3);parts.push(tube(top,end,.5,.3,8));
        for(let j=0;j<4;j++){const p=top.clone().lerp(end,.35+j*.18+R3()*.08);parts.push(tube(new V3(p.x,0,p.z),p,.09+R3()*.08,.05,5));} // aerial roots hanging to the ground and thickening into trunks
        limb(end,new V3(d.x*.6,1,d.z*.6).normalize(),H*.22,.25,2,.9,tips);}
      for(let j=0;j<10;j++){const a=R3()*6.283,r=1.4+R3()*.6;parts.push(tube(new V3(Math.cos(a)*r,0,Math.sin(a)*r),new V3(Math.cos(a)*.7,H*.25,Math.sin(a)*.7),.22,.12,6));}
      crown(tips,new V3(0,H*.7,0),360,2.4);return{leaf:'banyan',H};},
    hapuu(){const H=4.2,top=new V3(0,H,0);{const g=new THREE.CylinderGeometry(1,1,H,16,24,true),p=g.attributes.position;g.translate(0,H/2,0);
        for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),t=y/H,r=(.23-.06*t)*(1+.16*(vnoise(a*2.2+3,y*1.6)-.5)+.1*(vnoise(a*6,y*5)-.5))+.22*Math.exp(-y*2.2); // matted roots and old frond bases
          p.setXYZ(i,Math.cos(a)*r,y,Math.sin(a)*r);}g.computeVertexNormals();const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2,uv.getY(i)*H*.9);parts.push(g);}
      for(let k=0;k<13;k++){const a=k/13*6.283+R3()*.3,L=2.4+R3()*.8,g=new THREE.PlaneGeometry(.9,L,1,10),p=g.attributes.position; // fronds arch out and droop
        for(let i=0;i<p.count;i++){const t=p.getY(i)/L+.5,x=p.getX(i)*(1-t*.6);p.setXYZ(i,x,Math.sin(t*1.6)*L*.45-t*t*L*.55,t*L*.92);}
        g.rotateY(a);g.translate(0,H,0);g.computeVertexNormals();const fl=new Float32Array(p.count);for(let i=0;i<p.count;i++)fl[i]=Math.min(1,Math.hypot(p.getX(i),p.getZ(i))/L);g.setAttribute('aFlex',new THREE.BufferAttribute(fl,1));leafParts.push(g);}
      return{leaf:'frond',H};},
    hala(){const H=6,tips=[];let p=new V3(),d=new V3(.25,1,0).normalize();const top=p.clone().addScaledVector(d,H*.45);parts.push(tube(p,top,.18,.15,7));
      for(let j=0;j<6;j++){const a=j/6*6.283;parts.push(tube(new V3(Math.cos(a)*.7,0,Math.sin(a)*.7),new V3(d.x*1.2,1.3,0),.05,.04,5));} // prop roots
      for(let k=0;k<3;k++){const a=k/3*6.283+R3();const d2=new V3(Math.cos(a)*.8,.9,Math.sin(a)*.8).normalize(),e=top.clone().addScaledVector(d2,H*.3);parts.push(tube(top,e,.12,.09,6));
        for(let m=0;m<2;m++){const a2=a+(m-.5)*1.2,e2=e.clone().addScaledVector(new V3(Math.cos(a2)*.7,.7,Math.sin(a2)*.7).normalize(),H*.18);parts.push(tube(e,e2,.08,.06,5));tips.push(e2);}}
      for(const t of tips)for(let i=0;i<22;i++){const a=i*2.4,L=1.4+R3()*.6,g=new THREE.PlaneGeometry(.1,L,1,6),p2=g.attributes.position; // spiral tufts of long strap leaves
        for(let q=0;q<p2.count;q++){const u=p2.getY(q)/L+.5;p2.setXYZ(q,p2.getX(q)*(1-u*.7),Math.sin(u*1.4)*L*.45-u*u*L*.5,u*L*.9);}g.rotateY(a);g.rotateX(-.2);g.translate(t.x,t.y,t.z);g.computeVertexNormals();
        const fl=new Float32Array(p2.count);for(let q=0;q<p2.count;q++)fl[q]=(p2.getY(q)-t.y+L)/L;g.setAttribute('aFlex',new THREE.BufferAttribute(fl,1));leafParts.push(g);}
      return{leaf:'strap',H};},
    loulu(){const H=7,top=new V3(.2,H,0);parts.push(tube(new V3(),top,.16,.13,8));
      for(let k=0;k<20;k++){const a=k/20*6.283*2.3+R3()*.3,tilt=R3(),pet=new V3(Math.cos(a),1.1-tilt*1.6,Math.sin(a)).normalize(),end=top.clone().addScaledVector(pet,1.2+R3()*.4);parts.push(tube(top,end,.03,.025,4));
        const g=new THREE.CircleGeometry(.95,18,-1.4,2.8,),p=g.attributes.position;for(let i=0;i<p.count;i++){const an=Math.atan2(p.getY(i),p.getX(i)),r=Math.hypot(p.getX(i),p.getY(i));p.setZ(i,Math.sin(an*16)*.06*r-r*r*.28);} // a pleated fan, drooping at the tips
        const d=pet.clone().normalize(),l=new V3().crossVectors(d,up).normalize(),nn=new V3().crossVectors(d,l).normalize(),rot=new THREE.Matrix4().makeBasis(d,l,nn);
        g.applyMatrix4(rot);g.rotateOnAxis?0:0;{const q=new THREE.Quaternion().setFromAxisAngle(d,(R3()-.5)*1.4);g.applyQuaternion(q);}g.translate(end.x,end.y,end.z);g.computeVertexNormals();
        const fl=new Float32Array(p.count).fill(1);g.setAttribute('aFlex',new THREE.BufferAttribute(fl,1));leafParts.push(g);}
      return{leaf:'fan',H};},
  };
  const SPECIES={koa:{n:'Koa',bark:'#8a8174',scale:[.8,1.25]},ohia:{n:'ʻŌhiʻa lehua',bark:'#7c7064',scale:[.7,1.4]},hapuu:{n:'Hāpuʻu (tree fern)',bark:'#6a4a32',scale:[.7,1.4]},
    kukui:{n:'Kukui (candlenut)',bark:'#a39c90',scale:[.8,1.2]},hala:{n:'Milo (portia tree)',bark:'#8d7a62',scale:[.9,1.4]},ulu:{n:'ʻUlu (breadfruit)',bark:'#8f8577',scale:[.85,1.15]},
    loulu:{n:'Loulu (fan palm)',bark:'#8a7f70',scale:[.8,1.3]},banyan:{n:'Banyan',bark:'#8d8579',scale:[.9,1.1]},wiliwili:{n:'Wiliwili',bark:'#b09a74',scale:[.8,1.2]},ohiaai:{n:'ʻŌhiʻa ʻai (mountain apple)',bark:'#7a6f62',scale:[.85,1.15]}};
  // merge helper (positions, normals, uvs, aFlex)
  const mergeG=(list,flexDefault)=>{let n=0,ni=0;for(const g of list){n+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
    const P=new Float32Array(n*3),N=new Float32Array(n*3),UVa=new Float32Array(n*2),F=new Float32Array(n),I=new Uint32Array(ni);let o=0,oi=0;
    for(const g of list){const p=g.attributes.position,nr=g.attributes.normal,uv=g.attributes.uv,fl=g.attributes.aFlex;
      for(let i=0;i<p.count;i++){P[(o+i)*3]=p.getX(i);P[(o+i)*3+1]=p.getY(i);P[(o+i)*3+2]=p.getZ(i);N[(o+i)*3]=nr.getX(i);N[(o+i)*3+1]=nr.getY(i);N[(o+i)*3+2]=nr.getZ(i);
        if(uv){UVa[(o+i)*2]=uv.getX(i);UVa[(o+i)*2+1]=uv.getY(i);}F[o+i]=fl?fl.getX(i):(flexDefault==null?Math.min(1,p.getY(i)/12)*.3:flexDefault);}
      if(g.index)for(let i=0;i<g.index.count;i++)I[oi++]=g.index.getX(i)+o;else for(let i=0;i<p.count;i++)I[oi++]=o+i;o+=p.count;}
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));out.setAttribute('uv',new THREE.BufferAttribute(UVa,2));
    out.setAttribute('aFlex',new THREE.BufferAttribute(F,1));out.setIndex(new THREE.BufferAttribute(I,1));out.computeBoundingSphere();return out;};
  // materials
  const bk=pbrTex('bark'),barkMats={},leafMats={};
  const windLeaf=(m,amt)=>{const {attribute,vec3,sin,dot,positionLocal,positionGeometry}=TSL;const fl=attribute('aFlex','float'),wd=windAt(positionLocal.xz);
    const flut=sin(U.uTime.mul(5.3).add(dot(positionGeometry,vec3(3.1,2.3,2.7)))).mul(wd.z.add(.25)).mul(.05);
    m.positionNode=positionLocal.add(vec3(wd.x,0,wd.y).mul(fl).mul(amt)).add(vec3(flut,flut.mul(.4),flut.negate()).mul(fl));return m;};
  for(const k in SPECIES){const m=new THREE.MeshStandardNodeMaterial({map:bk.a,normalMap:null,color:new THREE.Color(SPECIES[k].bark).multiplyScalar(1.6),roughness:.92});
    {const {texture,uv,vec2}=TSL,nr=texture(bk.n,uv());m.normalNode=nrNormal(nr,1.2);}barkMats[k]=m;}
  const leafMat=(tex,alpha=.5,amt=.35)=>windLeaf(leafy(new THREE.MeshStandardNodeMaterial({map:tex,alphaTest:alpha,side:THREE.DoubleSide,roughness:.62,metalness:0})),amt);
  for(const k in LEAF)leafMats[k]=leafMat(LEAF[k]);leafMats.frond=leafMat(frondTex,.45,.5);leafMats.strap=leafMat(strapTex,.01,.25);leafMats.fan=leafMat(fanTex,.01,.3);
  const TEMPL={};for(const k in BUILD){parts.length=0;leafParts.length=0;const info=BUILD[k]();TEMPL[k]={bark:mergeG(parts,0),leaf:mergeG(leafParts,1),leafKind:info.leaf,H:info.H};}

  // ── where each tree grows ──
  const spots=[],grid=new Map(),gk=(x,z)=>Math.floor(x/10)+','+Math.floor(z/10);
  const clear=(x,z,r)=>{const gx=Math.floor(x/10),gz=Math.floor(z/10);for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=grid.get((gx+i)+','+(gz+j));if(L)for(const s of L)if(Math.hypot(s.x-x,s.z-z)<r*(s.big?1.6:1)||(s.big&&Math.hypot(s.x-x,s.z-z)<12))return false;}return true;};
  const okGround=(x,z,h)=>{if(h<1.2||freshAt(x,z)!=null)return false;const q=riverQ(x,z);if(q&&q.d<q.w+2)return false;
    if(Math.hypot(x-LANAI.x,z-LANAI.z)<14||Math.hypot(x-START.x,z-START.z)<18||Math.hypot(x-SPRING.x,z-SPRING.z)<6||Math.hypot(x-POOL.x,z-POOL.z)<POOL.r+3)return false;
    const n=tnorm(x,z);return n.y>.55;};
  const place=(kind,count,test,minGap,tries=count*60)=>{let c=0;for(let t=0;t<tries&&c<count;t++){const x=(R3()-.5)*290,z=-182+R3()*318,h=heightAt(x,z);if(!okGround(x,z,h)||!test(x,z,h))continue;
    if(!clear(x,z,minGap))continue;const sp={kind,x,z,h,big:kind==='banyan'};spots.push(sp);const k=gk(x,z);(grid.get(k)||grid.set(k,[]).get(k)).push(sp);c++;}};
  const mt=(x,z)=>mountainH(x,z);
  place('banyan',2,(x,z,h)=>forestW(x,z)>.7,18);
  place('ohiaai',30,(x,z,h)=>forestW(x,z)>.3,5);
  place('koa',75,(x,z,h)=>forestW(x,z)>.45||(mt(x,z)>14&&h<45&&R3()<.5),6);
  place('ohia',170,(x,z,h)=>forestW(x,z)>.35||(mt(x,z)>9&&h<66),4.5);
  place('hapuu',150,(x,z,h)=>forestW(x,z)>.55||(mt(x,z)>10&&h<55&&fbm(x*.05,z*.05,2)>.48),2.6);
  place('kukui',35,(x,z,h)=>forestW(x,z)>.2&&forestW(x,z)<.8||(h<12&&masks(x,z).d>30&&R3()<.15),7);
  place('ulu',16,(x,z,h)=>Math.hypot(x-LANAI.x,z-LANAI.z)<70&&h<10&&masks(x,z).d>22,9);
  place('loulu',40,(x,z,h)=>mt(x,z)>14&&h<72,5,8000);
  place('hala',45,(x,z,h)=>{const m=masks(x,z);return m.d>5&&m.d<34&&m.lava<.3&&h<8;},5);
  place('wiliwili',25,(x,z,h)=>{const m=masks(x,z);return m.lava<.25&&m.d>10&&x<-30&&h<14;},8);
  // instanced per kind in 64 m chunks
  const CH=64,chunks=new Map(),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new V3(),P=new V3();
  for(const s of spots){const sp=SPECIES[s.kind],k=sp.scale[0]+R3()*(sp.scale[1]-sp.scale[0]),lean=s.kind==='hala'||s.kind==='loulu'?.12:.04;
    Q.setFromEuler(new THREE.Euler((R3()-.5)*lean,R3()*6.283,(R3()-.5)*lean));S.set(k,k*(.9+R3()*.2),k);P.set(s.x,s.h-.15,s.z);M.compose(P,Q,S);
    const key=Math.floor(s.x/CH)+','+Math.floor(s.z/CH);let c=chunks.get(key);if(!c){c={x0:Math.floor(s.x/CH)*CH,z0:Math.floor(s.z/CH)*CH,lists:{}};chunks.set(key,c);}(c.lists[s.kind]=c.lists[s.kind]||[]).push(M.clone());
    const tr={hapuu:.2,hala:.18,loulu:.15,banyan:1.6}[s.kind]||.28*k;colliders.push({x:s.x,z:s.z,r:tr});s.scale=k;}
  const list=[];
  for(const c of chunks.values()){c.meshes=[];c.proc={};c.scan={near:[],far:[]};for(const kind in c.lists){const L=c.lists[kind],T=TEMPL[kind];
    const b=new THREE.InstancedMesh(T.bark,barkMats[kind],L.length),l=new THREE.InstancedMesh(T.leaf,leafMats[T.leafKind],L.length);
    L.forEach((m,i)=>{b.setMatrixAt(i,m);l.setMatrixAt(i,m);});for(const im of[b,l]){im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);c.meshes.push(im);}
    const item={label:()=>SPECIES[kind].n,verb:''};b.userData.item=item;interact.push(b);l.raycast=()=>{};c.proc[kind]={b,l};}
    list.push(c);}
  // ── scanned trees (Poly Haven, CC0) take over from the built ones as they load ──
  // Each Hawaiian tree is drawn by the scan closest to it in form. Near chunks show the full scan (real bark, branching and leaves,
  // thinned and simplified for the browser); far chunks a lighter cut of the same tree, as open-world games do.
  const SCANS={koa:{f:'jacaranda_tree'},ohia:{f:'island_tree_01',lehua:1},kukui:{f:'island_tree_01',tint:[1.12,1.18,1.05]},ulu:{f:'island_tree_02',tint:[.78,.9,.72]},
    ohiaai:{f:'island_tree_02',tint:[.7,.82,.66]},wiliwili:{f:'tree_small_02',tint:[1.1,1.06,.82]},hala:{f:'island_tree_03'}}; // hala's key now draws milo, the shore tree
  const scanMat=(m,H,leaf,spec)=>{const n=new THREE.MeshStandardNodeMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,roughness:m.roughness??.8,metalness:0,
      side:leaf?THREE.DoubleSide:THREE.FrontSide,alphaTest:leaf?.45:0,color:spec.tint&&leaf?new THREE.Color(...spec.tint):new THREE.Color(1,1,1)});
    const {vec3,vec4,sin,dot,clamp,mix,texture,uv,positionLocal,positionGeometry}=TSL;const fl=clamp(positionGeometry.y.div(H),0,1).pow(1.6);   // the higher, the freer it moves
    const wd=windAt(positionLocal.xz),flut=leaf?sin(U.uTime.mul(5.1).add(dot(positionGeometry,vec3(7.1,5.3,6.7)))).mul(wd.z.add(.25)).mul(.02):0;
    n.positionNode=positionLocal.add(vec3(wd.x,0,wd.y).mul(fl).mul(leaf?.42:.18)).add(leaf?vec3(flut,flut.mul(.5),flut.negate()):vec3(0));
    if(leaf&&spec.lehua){const tx=texture(m.map,uv()),cell=vn(positionGeometry.xz.mul(2.6).add(positionGeometry.y.mul(1.7)));                  // red lehua blossoms through the canopy
      n.colorNode=vec4(mix(tx.rgb,vec3(.62,.04,.05),sstep(.78,.84,cell).mul(sstep(.45,.7,fl))),tx.a);}
    return leaf?leafy(n):n;};
  const loadScan=(f,far)=>gltfLoader.loadAsync('assets/models/trees/'+f+(far?'_far':'')+'.glb');
  const SM=new THREE.Matrix4(),done={};
  for(const kind in SCANS){const spec=SCANS[kind];Promise.all([loadScan(spec.f,false),loadScan(spec.f,true)]).then(([gn,gf])=>{
    const box=new THREE.Box3().setFromObject(gn.scene),hgt=box.max.y-box.min.y,k=TEMPL[kind].H/hgt;SM.makeScale(k,k,k);
    const parts=g=>{const o=[];g.scene.updateMatrixWorld(true);g.scene.traverse(x=>{if(x.isMesh){const geo=floatGeo(x.geometry).applyMatrix4(x.matrixWorld);geo.computeBoundingSphere();
      const leaf=/leaves|leaf/i.test(x.material.name||'');o.push({geo,mat:scanMat(x.material,hgt,leaf,spec),leaf});}});return o;};
    const P={near:parts(gn),far:parts(gf)};
    for(const c of list){const L=c.lists[kind];if(!L)continue;
      for(const lod of['near','far']){const g=new THREE.Group();for(const pt of P[lod]){const im=new THREE.InstancedMesh(pt.geo,pt.mat,L.length);
          L.forEach((m,i)=>im.setMatrixAt(i,M.multiplyMatrices(m,SM)));im.castShadow=true;im.receiveShadow=true;im.raycast=()=>{};im.computeBoundingSphere();g.add(im);}
        g.visible=false;scene.add(g);c.scan[lod].push(g);}
      c.proc[kind].b.visible=c.proc[kind].l.visible=false;c.proc[kind].hidden=true;}
    done[kind]=1;}).catch(e=>console.warn('Tree scan '+kind+' did not load:',e));}
  // hāpuʻu: the scanned fern's fronds crown each fibrous trunk
  gltfLoader.loadAsync('assets/models/fern.glb').then(gl=>{const src=gl.scene.getObjectByName('fern_02_b')||gl.scene.getObjectByProperty('isMesh',true);if(!src)return;
    src.updateWorldMatrix(true,false);const geo=floatGeo(src.geometry).applyMatrix4(src.matrixWorld);geo.computeBoundingBox();const b=geo.boundingBox,w=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
    const ce=b.getCenter(new THREE.Vector3());geo.translate(-ce.x,-b.min.y,-ce.z);geo.scale(4.2/w,4.2/w*1.15,4.2/w);geo.translate(0,-.35,0);geo.computeBoundingSphere();
    const m0=src.material,mat=scanMat({map:m0.map,normalMap:m0.normalMap,roughnessMap:m0.roughnessMap,roughness:m0.roughness,name:'leaves'},2.2,true,{});
    const T=new THREE.Matrix4().makeTranslation(0,TEMPL.hapuu.H,0);
    for(const c of list){const L=c.lists.hapuu;if(!L)continue;const im=new THREE.InstancedMesh(geo,mat,L.length);L.forEach((m,i)=>im.setMatrixAt(i,M.multiplyMatrices(m,T)));
      im.castShadow=im.receiveShadow=true;im.raycast=()=>{};im.computeBoundingSphere();scene.add(im);c.meshes.push(im);c.proc.hapuu.l.visible=false;c.proc.hapuu.l.userData.off=true;}}).catch(e=>console.warn('Tree fern crowns:',e));
  return{spots,count:spots.length,kinds:Object.fromEntries(Object.keys(SPECIES).map(k=>[k,spots.filter(s=>s.kind===k).length])),
    update(cx,cz){for(const c of list){const dx=Math.max(c.x0-cx,0,cx-c.x0-CH),dz=Math.max(c.z0-cz,0,cz-c.z0-CH),d=Math.hypot(dx,dz),near=d<FLORA_NEAR;
      for(const m of c.meshes)m.visible=d<420&&!m.userData.off;for(const k in c.proc)if(c.proc[k].hidden)c.proc[k].b.visible=c.proc[k].l.visible=false;
      for(const g of c.scan.near)g.visible=near;for(const g of c.scan.far)g.visible=!near&&d<420;}},
    crownPts(kind){return spots.filter(s=>!kind||s.kind===kind).map(s=>({x:s.x,z:s.z,y:s.h+TEMPL[s.kind].H*s.scale*.72,kind:s.kind}));}};
})();

