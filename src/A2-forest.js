/* ───────────────────────── Wao Nahele: the Hawaiian rainforest ─────────────────────────
   Ten Hawaiian trees. Most are drawn by real photo-scanned trees (near and far versions); banyan, loulu and the hāpuʻu trunks are
   built in code from the scanned bark. All share the island's wind. They grow where they would: koa, ʻōhiʻa and hāpuʻu in the forest and up the mountain, loulu on its
   ridges, milo by the shore, wiliwili on the dry lava side, ʻulu, kukui and ʻōhiʻa ʻai near water and people, and a banyan or
   two. Trees are instanced per kind in 64 m chunks. */
// forestW(x,z) is defined with the ground truth in 10-island.js
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

  /* ── streaming the forest ──
     Trees are planned per 64 m chunk from the ground truth alone (forestW, heightAt, masks, zoneAt, freshAt, riverQ, tnorm), on jittered
     grids seeded from the chunk's coordinates: the same trees stand in the same places every time you come back. Each tree is drawn in one
     of three ways by its distance: the near scan (full branches and leaves, casting shadows), the far scan (a light cut of the same tree), and
     past that an impostor: a card that always faces you, painted from eight views of the far scan rendered once at load. Neighbouring versions
     cross-fade over a few metres with a screen-door dither (each pixel is drawn by one version or the other, never both, never neither), so a
     tree never pops; new chunks fade in over a moment, and the edge of the forest's reach dissolves into the haze. */
  const DBG=(new URLSearchParams(location.search).get('treedbg')||'');const done={};const RK=Object.keys(SPECIES).concat(['ohia2']),KIND_OF=k=>k==='ohia2'?'ohia':k; // render kinds: ʻōhiʻa grows as a tree, and as a low shrub on young lava
  const TU={r0:TSL.uniform(25),b0:TSL.uniform(3),r1:TSL.uniform(75),b1:TSL.uniform(7),r2:TSL.uniform(450)};let Q={r0:25,b0:3,r1:75,b1:7,r2:450};
  const quality=g=>{const k=g.grass;Q={r0:10+22*k,b0:3,r1:40+50*k,b1:7,r2:220+340*k};for(const n in Q)TU[n].value=Q[n];};quality(activeGfx());
  // the per-tree fades are worked out per vertex (they are the same over a whole tree) and only compared with the dither per pixel
  const tierMask=mode=>{const {attribute,length,min,clamp,varying,vec3}=TSL;const r=attribute('aRoot','vec4'),d=length(r.xz.sub(STREAM.uEye.xz)),ign=DITHER.ign;
    const F=varying(vec3(sstep(TU.r0.add(TU.b0),TU.r0.sub(TU.b0),d),sstep(TU.r1.add(TU.b1),TU.r1.sub(TU.b1),d),min(clamp(STREAM.uNow.sub(r.w).div(.7),0,1),sstep(TU.r2,TU.r2.mul(.86),d))));
    const fNear=F.x,fMid=F.y,pres=F.z;                                                         // a new chunk fades in; the forest's far edge fades out
    if(mode==='near')return ign.lessThan(min(fNear,pres));
    if(mode==='mid')return ign.greaterThanEqual(fNear).and(ign.lessThan(min(fMid,pres)));
    return ign.lessThan(min(fMid,pres));};                                                     // 'all': one version drawn near and mid
  const tierMats=new Map(),tierMat=(base,mode)=>{const key=base.uuid+mode;let m=tierMats.get(key);if(!m){m=base.clone();if(!DBG.includes('nomask'))m.maskNode=tierMask(mode);tierMats.set(key,m);}return m;};
  // what each render kind is drawn with: {near:[parts], mid:[parts], k:[xz,y] scale, ver}; parts are {geo, mat}. Code-built trees stand in until the scans load.
  const SRC={};let srcVer=0;
  for(const k of Object.keys(SPECIES)){const T=TEMPL[k],parts=[{geo:T.bark,mat:barkMats[k]},{geo:T.leaf,mat:leafMats[T.leafKind],leaf:true}];SRC[k]={near:[],mid:parts,mode:'all',k:[1,1],ver:++srcVer,H:T.H};}
  SRC.ohia2={near:[],mid:[],mode:'all',k:[.3,.3],ver:++srcVer,H:3};
  // ── where trees grow: a site is plantable land, and each species has its habitat ──
  const site=(x,z)=>{const h=heightAt(x,z);if(h<1.2||freshAt(x,z)!=null||nearHome(x,z,14)||nearStart(x,z,18))return null;
    const q=riverQ(x,z);if(q&&q.d<q.w+2)return null;const n=tnorm(x,z);if(n.y<.55)return null;
    return{x,z,h,ny:n.y,fw:forestW(x,z),m:masks(x,z),mt:zoneAt(x,z)==='mountain'?1:0};};
  const W_={};const canopy=s=>{const {fw,m,h,mt,ny}=s,hi=h<2800?1:0,lava=m.lava,dry=smooth(.01,.12,lava)*smooth(.55,.4,lava);
    W_.ohia=(fw>.35?fw*.8:0)+mt*.55*hi;W_.koa=(fw>.45?fw*.45:0)+mt*.22*(h<2000?1:0);W_.ohiaai=fw>.3?.1:0;
    W_.kukui=(fw>.2&&fw<.8?.22:0)+(m.d>30&&fw<.2&&h<300?.025:0);W_.ulu=nearHome(s.x,s.z,70)&&h<10&&m.d>22?.35:0;
    W_.hala=m.d>5&&m.d<34&&lava<.3&&h<8?.45:0;W_.wiliwili=m.d>10&&h<14&&dry>0?.5*dry:0;W_.loulu=mt*(1-fw)*smooth(.95,.8,ny)*.6;
    W_.ohia2=(lava>.3?.16:0)+(mt&&fw<.3&&hi?.08:0);                                              // ʻōhiʻa is the first tree on new lava
    let t=0;for(const k in W_)t+=W_[k];return t;};
  const pickW=(v,t)=>{let a=v*t;for(const k in W_){a-=W_[k];if(a<=0)return k;}return null;};
  const COL={hapuu:.2,hala:.18,loulu:.15,banyan:1.6,ohia2:.1};
  const CH=64,CELL=5.33,UCELL=3.2,BCELL=32;
  function* plan(ch){const R=ch.R,x0=ch.x0,z0=ch.z0,out=[],grid=new Map(),gk=(x,z)=>Math.floor(x/4)+','+Math.floor(z/4);
    const near=(x,z,r)=>{const gx=Math.floor(x/4),gz=Math.floor(z/4);for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const L=grid.get((gx+i)+','+(gz+j));if(L)for(const t of L)if(Math.hypot(t.x-x,t.z-z)<r)return true;}return false;};
    const add=(rk,s,a,b,c)=>{const sp=SPECIES[KIND_OF(rk)],k=(rk==='ohia2'?.7+a*.7:sp.scale[0]+a*(sp.scale[1]-sp.scale[0])),lean=rk==='hala'||rk==='loulu'?.12:.04;
      const t={rk,kind:KIND_OF(rk),x:s.x,z:s.z,y:s.h-.15,h:s.h,yaw:b*6.283,s:k,sy:k*(.9+c*.2),lx:(a-.5)*lean,lz:(c-.5)*lean};out.push(t);const key=gk(s.x,s.z);(grid.get(key)||grid.set(key,[]).get(key)).push(t);return t;};
    // a banyan or two where the forest is deepest, on a coarse grid; it keeps a clearing round it
    for(let j=0;j<CH/BCELL;j++)for(let i=0;i<CH/BCELL;i++){const x=x0+(i+.25+R()*.5)*BCELL,z=z0+(j+.25+R()*.5)*BCELL,u=R(),a=R(),b=R(),c=R();
      if(u<.22){const s=site(x,z);if(s&&s.fw>.7)add('banyan',s,a,b,c);}}
    yield;
    const nc=Math.round(CH/CELL),cs=CH/nc;
    for(let j=0;j<nc;j++){for(let i=0;i<nc;i++){const x=x0+(i+.15+R()*.7)*cs,z=z0+(j+.15+R()*.7)*cs,u=R(),v=R(),a=R(),b=R(),c=R();
        if(u>.86)continue;const s=site(x,z);if(!s)continue;const t=canopy(s);if(u>Math.min(.86,t))continue;
        const rk=pickW(v,t);if(!rk||near(x,z,rk==='ohia2'?1.5:2.4))continue;if(out.length&&out[0].rk==='banyan'&&out.some(o=>o.rk==='banyan'&&Math.hypot(o.x-x,o.z-z)<11))continue;add(rk,s,a,b,c);}
      yield;}
    // hāpuʻu, the tree ferns, under the canopy and in the misty uplands
    const nu=Math.round(CH/UCELL),us=CH/nu;
    for(let j=0;j<nu;j++){for(let i=0;i<nu;i++){const x=x0+(i+.15+R()*.7)*us,z=z0+(j+.15+R()*.7)*us,u=R(),a=R(),b=R(),c=R();
        if(u>.6)continue;const fw=forestW(x,z);if(fw<.5&&u>.25)continue;const s=site(x,z);if(!s)continue;
        const w=(s.fw>.55?(s.fw-.55)*1.6:0)+(s.mt&&s.h<2400&&fbm(x*.05,z*.05,2)>.48?.4:0);if(u>Math.min(.6,w))continue;
        if(near(x,z,1.7)||out.some(o=>o.rk==='banyan'&&Math.hypot(o.x-x,o.z-z)<9))continue;add('hapuu',s,a,b,c);}
      if(j%2)yield;}
    ch.trees=out;
    ch.colsList=out.map(t=>({x:t.x,z:t.z,r:COL[t.rk]||.28*t.s,y:t.h}));}
  // ── chunk meshes: per render kind and version, a pooled set of instanced meshes over one instance buffer ──
  const pool=new Map(),pkey=(rk,tier,cap)=>rk+'|'+tier+'|'+cap;
  function getSet(rk,tier,n){const src=SRC[rk],parts=src[tier];if(!parts.length)return null;const cap=Math.max(8,1<<Math.ceil(Math.log2(n))),key=pkey(rk,tier,cap);
    const L=pool.get(key);while(L&&L.length){const e=L.pop();if(e.ver===src.ver)return e;for(const im of e.meshes)scene.remove(im);}
    const M=new THREE.InstancedBufferAttribute(new Float32Array(cap*16),16),Rt=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);M.setUsage(THREE.DynamicDrawUsage);Rt.setUsage(THREE.DynamicDrawUsage);
    const meshes=parts.map(p=>{const geo=new THREE.BufferGeometry();for(const a in p.geo.attributes)geo.setAttribute(a,p.geo.attributes[a]);geo.setIndex(p.geo.index);geo.setAttribute('aRoot',Rt);
      const im=new THREE.InstancedMesh(geo,tierMat(p.mat,tier==='near'?'near':src.mode==='all'?'all':'mid'),cap);im.instanceMatrix=M;im.count=0;im.castShadow=!DBG.includes('noshadow');im.receiveShadow=true;
      if(p.leaf||(tier==='mid'&&src.mode!=='all')||p!==parts.find(q=>!q.leaf))im.raycast=()=>{};else if(!DBG.includes('nolook')){im.userData.item=ITEM[KIND_OF(rk)];im.userData.look=true;}else im.raycast=()=>{};   // the trunk is what you look at
      im.boundingSphere=new THREE.Sphere();im.visible=false;scene.add(im);return im;});
    return{rk,tier,cap,key,ver:src.ver,M,Rt,meshes};}
  function putSet(e){for(const im of e.meshes){im.visible=false;im.count=0;if(im.userData.look){const i=interact.indexOf(im);if(i>=0)interact.splice(i,1);}}const L=pool.get(e.key)||pool.set(e.key,[]).get(e.key);if(L.length<24)L.push(e);}
  const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new V3(),_s=new V3();
  function meshChunk(ch){if(ch.groups)for(const g of Object.values(ch.groups))for(const t of['near','mid'])if(g[t])putSet(g[t]);
    ch.groups={};const by={};for(const t of ch.trees)(by[t.rk]=by[t.rk]||[]).push(t);
    let y0=0,y1=20;if(ch.trees.length){y0=1e9;y1=-1e9;for(const t of ch.trees){y0=Math.min(y0,t.y);y1=Math.max(y1,t.y+20);}}ch.sphere=new THREE.Sphere(new V3(ch.x0+CH/2,(y0+y1)/2,ch.z0+CH/2),Math.hypot(CH/2+8,CH/2+8,(y1-y0)/2));
    for(const rk in by){const L=by[rk],n=L.length,src=SRC[rk],MF=new Float32Array(n*16),RT=new Float32Array(n*4);
      L.forEach((t,i)=>{_e.set(t.lx,t.yaw,t.lz);_q.setFromEuler(_e);_s.set(t.s*src.k[0],t.sy*src.k[1],t.s*src.k[0]);_p.set(t.x,t.y,t.z);_m.compose(_p,_q,_s).toArray(MF,i*16);RT[i*4]=t.x;RT[i*4+1]=t.y;RT[i*4+2]=t.z;RT[i*4+3]=ch.born;});
      ch.groups[rk]={L,n,MF,RT,near:getSet(rk,'near',n),mid:getSet(rk,'mid',n),ver:src.ver};
      for(const t of['near','mid']){const e=ch.groups[rk][t];if(e)for(const im of e.meshes){im.boundingSphere.copy(ch.sphere);if(im.userData.look)interact.push(im);}}}
    ch.sig='';impDirty=true;}
  // which version each tree is drawn with, by its distance; only chunks that straddle a boundary need doing again as you move
  function assign(ch,ex,ez){const lo0=Q.r0-Q.b0-1,hi0=Q.r0+Q.b0+1,lo1=Q.r1-Q.b1-1,hi1=Q.r1+Q.b1+1;
    const dmin=ch.d,dmax=Math.hypot(Math.max(Math.abs(ex-ch.x0),Math.abs(ex-ch.x0-CH)),Math.max(Math.abs(ez-ch.z0),Math.abs(ez-ch.z0-CH)));
    const mixed=[lo0,hi0,lo1,hi1].some(B=>dmin<B&&dmax>B),sig=(dmin<hi0?'n':'')+(dmax>lo0&&dmin<hi1?'m':'')+(mixed?'x':'')+Q.r0.toFixed(1)+Q.r1.toFixed(1);
    if(sig===ch.sig&&(!mixed||Math.hypot(ex-ch.ax,ez-ch.az)<2))return;ch.sig=sig;ch.ax=ex;ch.az=ez;
    for(const rk in ch.groups){const g=ch.groups[rk];
      for(const tier of['near','mid']){const e=g[tier];if(!e)continue;const a=e.M.array,r=e.Rt.array;let c=0;
        const all=!SRC[rk].near.length;
        if(tier==='near'?dmin<hi0:((dmax>lo0||all)&&dmin<hi1))for(let i=0;i<g.n;i++){const t=g.L[i],d=Math.hypot(t.x-ex,t.z-ez);
          if(tier==='near'?d<hi0:(d>lo0||all)&&d<hi1){a.set(g.MF.subarray(i*16,i*16+16),c*16);r.set(g.RT.subarray(i*4,i*4+4),c*4);c++;}}
        for(const im of e.meshes){im.count=c;im.visible=c>0;}if(c){e.M.needsUpdate=true;e.Rt.needsUpdate=true;}}}}
  // ── impostors: one card per tree past the far scans, all of a kind in one draw ──
  const IMP={};let impDirty=true,impX=1e9,impZ=1e9;
  const quad=new THREE.PlaneGeometry(1,1).translate(0,.5,0);
  function impMat(atlas){const {attribute,length,max,vec2,vec3,vec4,atan,round,mod,floor,texture,varying,positionGeometry,cameraViewMatrix,normalize,min,clamp,mix}=TSL;
    const a=attribute('aImp','vec4'),b=attribute('aImp2','vec4'),toE=STREAM.uEye.xz.sub(a.xz),dE=length(toE),dir=toE.div(max(dE,.001)),pg=positionGeometry;
    const m=leafy(new THREE.MeshStandardNodeMaterial({side:THREE.DoubleSide,roughness:.9,metalness:0,alphaTest:.42}));
    m.positionNode=vec3(a.x,a.y,a.z).add(vec3(dir.y,0,dir.x.negate()).mul(pg.x.mul(b.z))).add(vec3(0,pg.y.sub(.02).mul(a.w),0));
    const th=atan(toE.x,toE.y),k=mod(round(b.x.sub(th).div(Math.PI/4)).add(16),8),col=mod(k,4),row=floor(k.div(4));
    const vUv=varying(vec2(col.add(pg.x.add(.5)).div(4),row.add(pg.y).div(2)));
    const tx=texture(atlas,vUv);m.colorNode=vec4(tx.rgb.mul(mix(.62,1.04,clamp(pg.y.mul(1.3),0,1))),tx.a);                // the lower crown sits in its own shade
    m.normalNode=normalize(cameraViewMatrix.mul(vec4(normalize(vec3(dir.x.mul(.55),1,dir.y.mul(.55))),0)).xyz);
    const ign=DITHER.ign,F=varying(vec2(sstep(TU.r1.add(TU.b1),TU.r1.sub(TU.b1),dE),min(clamp(STREAM.uNow.sub(b.y).div(.7),0,1),sstep(TU.r2,TU.r2.mul(.86),dE))));
    m.maskNode=ign.greaterThanEqual(F.x).and(ign.lessThan(F.y));return m;}
  // eight views of a tree, rendered once into a 4×2 atlas (flat colour: the game lights the card)
  function bake(rk,parts,H,Wd){const T=Math.max(H,Wd)*1.06,sc=new THREE.Scene(),bm=new Map();
    const bmat=m=>{let b=bm.get(m);if(!b){b=new THREE.MeshBasicNodeMaterial({map:m.map||null,color:(m.color||new THREE.Color(1,1,1)).clone(),alphaTest:Math.max(.3,m.alphaTest||0),side:THREE.DoubleSide});
      if(m.colorNode&&m.userData.bakeColor)b.colorNode=m.userData.bakeColor;bm.set(m,b);}return b;};
    for(let k=0;k<8;k++){const g=new THREE.Group();g.rotation.y=k*Math.PI/4;g.position.set(((k%4)-1.5)*T,(k>>2)*T+.02*T,0);
      for(const p of parts){const ms=new THREE.Mesh(p.geo,bmat(p.mat));if(p.M)ms.applyMatrix4(p.M);g.add(ms);}sc.add(g);}
    const cam=new THREE.OrthographicCamera(-2*T,2*T,2*T,0,.1,400);cam.position.set(0,0,200);cam.lookAt(0,0,0);cam.updateMatrixWorld();
    const rt=new THREE.RenderTarget(1024,512,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,samples:4});
    const cc=new THREE.Color(),ca=renderer.getClearAlpha();renderer.getClearColor(cc);const prev=renderer.getRenderTarget();
    try{renderer.setRenderTarget(rt);renderer.setClearColor(new THREE.Color(.07,.1,.05),0);renderer.clear();renderer.render(sc,cam);}
    finally{renderer.setRenderTarget(prev);renderer.setClearColor(cc,ca);}
    for(const b of bm.values())b.dispose();
    const old=IMP[rk],mat=impMat(rt.texture);
    if(old){const om=old.mesh.material,ort=old.rt;old.mesh.material=mat;old.T=T;old.rt=rt;om.dispose();ort.dispose();}else IMP[rk]=newImp(rk,512,mat,T,rt);impDirty=true;}
  function newImp(rk,cap,mat,T,rt){const A=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4),B=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);A.setUsage(THREE.DynamicDrawUsage);B.setUsage(THREE.DynamicDrawUsage);
    const geo=new THREE.BufferGeometry();for(const a in quad.attributes)geo.setAttribute(a,quad.attributes[a]);geo.setIndex(quad.index);geo.setAttribute('aImp',A);geo.setAttribute('aImp2',B);
    const mesh=new THREE.InstancedMesh(geo,mat,cap);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.raycast=()=>{};scene.add(mesh);return{rk,cap,mesh,A,B,T,rt};}
  function fillImps(ex,ez){const lo=Q.r1-Q.b1-1,hi=Q.r2+4,cnt={};
    for(const rk in IMP)cnt[rk]=0;
    for(const ch of live){if(ch.d>hi)continue;const far=Math.hypot(Math.max(Math.abs(ex-ch.x0),Math.abs(ex-ch.x0-CH)),Math.max(Math.abs(ez-ch.z0),Math.abs(ez-ch.z0-CH)));if(far<lo)continue;
      for(const t of ch.trees){const I=IMP[t.rk];if(!I)continue;const d=Math.hypot(t.x-ex,t.z-ez);if(d<lo||d>hi)continue;
        let n=cnt[t.rk];if(n>=I.cap){growImp(I);}const A=I.A.array,B=I.B.array,src=SRC[t.rk];
        A[n*4]=t.x;A[n*4+1]=t.y;A[n*4+2]=t.z;A[n*4+3]=I.T*t.sy*src.k[1];B[n*4]=t.yaw;B[n*4+1]=ch.born;B[n*4+2]=I.T*t.s*src.k[0];cnt[t.rk]=n+1;}}
    for(const rk in IMP){const I=IMP[rk];I.mesh.count=cnt[rk];I.mesh.visible=cnt[rk]>0;I.A.needsUpdate=true;I.B.needsUpdate=true;}}
  function growImp(I){const cap=I.cap*2,A=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4),B=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);
    A.array.set(I.A.array);B.array.set(I.B.array);A.setUsage(THREE.DynamicDrawUsage);B.setUsage(THREE.DynamicDrawUsage);
    scene.remove(I.mesh);const geo=new THREE.BufferGeometry();for(const a in quad.attributes)geo.setAttribute(a,quad.attributes[a]);geo.setIndex(quad.index);geo.setAttribute('aImp',A);geo.setAttribute('aImp2',B);
    const mesh=new THREE.InstancedMesh(geo,I.mesh.material,cap);mesh.frustumCulled=false;mesh.castShadow=false;mesh.raycast=()=>{};scene.add(mesh);Object.assign(I,{cap,A,B,mesh});}
  // ── the layer ──
  const live=[];let liveTrees=0;
  const ITEM=Object.fromEntries(Object.keys(SPECIES).map(k=>[k,{label:()=>SPECIES[k].n,verb:''}]));
  const layer=STREAM.layer({name:'trees',size:CH,seed:64,prio:1,radius:()=>Q.r2+8,margin:24,
    build:plan,
    ready(ch){if(!ch.trees){ch.trees=[];ch.colsList=[];}meshChunk(ch);live.push(ch);liveTrees+=ch.trees.length;},
    dispose(ch){if(ch.groups)for(const g of Object.values(ch.groups))for(const t of['near','mid'])if(g[t])putSet(g[t]);ch.groups=null;STREAM.dropCols(ch);
      const i=live.indexOf(ch);if(i>=0){live.splice(i,1);liveTrees-=ch.trees.length;}impDirty=true;},
    frame(ex,ez){const t0=performance.now();
      for(const ch of live){const dx=Math.max(ch.x0-ex,0,ex-ch.x0-CH),dz=Math.max(ch.z0-ez,0,ez-ch.z0-CH);ch.d=Math.hypot(dx,dz);
        if(performance.now()-t0<2)for(const rk in ch.groups)if(ch.groups[rk].ver!==SRC[rk].ver){meshChunk(ch);break;}   // a scan has loaded: redo a few chunks a frame
        assign(ch,ex,ez);
        if(!ch.cols&&ch.d<70)STREAM.addCols(ch,ch.colsList);else if(ch.cols&&ch.d>100)STREAM.dropCols(ch);}       // trunks you can bump into, near you
      if(impDirty||Math.hypot(ex-impX,ez-impZ)>5){impDirty=false;impX=ex;impZ=ez;fillImps(ex,ez);}}});
  // physics: trunks become solid for things you throw, while their chunk lives
  let physSynced=false;
  // ── the scanned trees ──
  const SCANS={koa:{f:'koa',tint:[.9,1.05,.92],W:13,stretch:1.5},ohia:{f:'island_tree_01',lehua:1},ohia2:{f:'ohia_shrub',H:3.2},kukui:{f:'island_tree_01',tint:[1.12,1.18,1.05]},
    ulu:{f:'island_tree_02',tint:[.78,.9,.72]},ohiaai:{f:'island_tree_02',tint:[.7,.82,.66]},wiliwili:{f:'tree_small_02',tint:[1.1,1.06,.82]},hala:{f:'island_tree_03'},banyan:{f:'banyan',W:16}}; // hala's key draws milo, the shore tree
  const scanMat=(m,H,leaf,spec)=>{const n=new THREE.MeshStandardNodeMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,roughness:m.roughness??.8,metalness:0,
      side:leaf?THREE.DoubleSide:THREE.FrontSide,alphaTest:leaf?Math.max(.3,Math.min(.5,m.alphaTest||.45)):0,color:spec.tint&&leaf?new THREE.Color(...spec.tint):new THREE.Color(1,1,1)});
    const {vec3,vec4,sin,dot,clamp,mix,texture,uv,positionLocal,positionGeometry}=TSL;const fl=clamp(positionGeometry.y.div(H),0,1).pow(1.6);   // the higher, the freer it moves
    const wd=windAt(positionLocal.xz),flut=leaf?sin(U.uTime.mul(5.1).add(dot(positionGeometry,vec3(7.1,5.3,6.7)))).mul(wd.z.add(.25)).mul(.02):0;
    n.positionNode=positionLocal.add(vec3(wd.x,0,wd.y).mul(fl).mul(leaf?.42:.18)).add(leaf?vec3(flut,flut.mul(.5),flut.negate()):vec3(0));
    if(leaf&&spec.lehua){const tx=texture(m.map,uv()),cell=vn(positionGeometry.xz.mul(2.6).add(positionGeometry.y.mul(1.7)));                  // red lehua blossoms through the canopy
      n.colorNode=vec4(mix(tx.rgb,vec3(.62,.04,.05),sstep(.78,.84,cell).mul(sstep(.45,.7,fl))),tx.a);n.userData.bakeColor=n.colorNode;}
    return leaf?leafy(n):n;};
  const loadGLB=f=>gltfLoader.loadAsync('assets/models/trees/'+f+'.glb');
  // a loaded scan as parts: one geometry per material, all in the tree's own frame (feet at 0), plus its size
  function scanParts(gl,spec,Hn){const groups=new Map();gl.scene.updateMatrixWorld(true);
    gl.scene.traverse(x=>{if(!x.isMesh)return;const leaf=/leaves|leaf|branch_1|flower|livistona|vines|branches_0/i.test(x.material.name||'');const key=(x.material.map&&x.material.map.uuid)||x.material.uuid;
      let g=groups.get(key);if(!g){g={geos:[],src:x.material,leaf};groups.set(key,g);}g.geos.push(floatGeo(x.geometry).applyMatrix4(x.matrixWorld));});
    const out=[];for(const g of groups.values()){const geo=mergeSimple(g.geos);geo.computeBoundingSphere();out.push({geo,mat:scanMat(g.src,Hn,g.leaf,spec),leaf:g.leaf});}return out;}
  function mergeSimple(list){if(list.length===1)return list[0];let n=0,ni=0;for(const g of list){n+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count;}
    const P=new Float32Array(n*3),N=new Float32Array(n*3),UVa=new Float32Array(n*2),I=new Uint32Array(ni);let o=0,oi=0;
    for(const g of list){const p=g.attributes.position,nr=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){P[(o+i)*3]=p.getX(i);P[(o+i)*3+1]=p.getY(i);P[(o+i)*3+2]=p.getZ(i);
        if(nr){N[(o+i)*3]=nr.getX(i);N[(o+i)*3+1]=nr.getY(i);N[(o+i)*3+2]=nr.getZ(i);}if(uv){UVa[(o+i)*2]=uv.getX(i);UVa[(o+i)*2+1]=uv.getY(i);}}
      if(g.index)for(let i=0;i<g.index.count;i++)I[oi++]=g.index.getX(i)+o;else for(let i=0;i<p.count;i++)I[oi++]=o+i;o+=p.count;}
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));out.setAttribute('uv',new THREE.BufferAttribute(UVa,2));out.setIndex(new THREE.BufferAttribute(I,1));return out;}
  const sizeOf=parts=>{const b=new THREE.Box3();for(const p of parts){p.geo.computeBoundingBox();b.union(p.geo.boundingBox);}return b;};
  for(const rk in SCANS){const spec=SCANS[rk];Promise.all([loadGLB(spec.f),loadGLB(spec.f+'_far')]).then(([gn,gf])=>{
    const b0=new THREE.Box3().setFromObject(gn.scene),hgt=b0.max.y-b0.min.y,wid=Math.max(b0.max.x-b0.min.x,b0.max.z-b0.min.z),H=spec.H||TEMPL[KIND_OF(rk)].H;
    let ky=H/hgt,kx=ky;if(spec.W&&wid*kx>spec.W){kx=spec.W/wid;ky=Math.min(ky,kx*(spec.stretch||1));}  // wide crowns keep their width, and stretch up a little at most
    const near=scanParts(gn,spec,hgt),mid=scanParts(gf,spec,hgt);
    SRC[rk]={near,mid,mode:'tiers',k:[kx,ky],ver:++srcVer,H:hgt*ky};
    const bx=sizeOf(mid);bake(rk,mid,bx.max.y,Math.max(bx.max.x-bx.min.x,bx.max.z-bx.min.z,1e-3)*1.0);           // the atlas is painted at the scan's own size; cards scale with each tree
    done[rk]=1;}).catch(e=>console.warn('Tree scan '+rk+' did not load:',e));}

  // hāpuʻu: the scanned fern's fronds crown each fibrous trunk built from the bark scan
  gltfLoader.loadAsync('assets/models/fern.glb').then(gl=>{const src=gl.scene.getObjectByName('fern_02_b')||gl.scene.getObjectByProperty('isMesh',true);if(!src)return;
    src.updateWorldMatrix(true,false);const geo=floatGeo(src.geometry).applyMatrix4(src.matrixWorld);geo.computeBoundingBox();const b=geo.boundingBox,w=Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
    const ce=b.getCenter(new THREE.Vector3());geo.translate(-ce.x,-b.min.y,-ce.z);geo.scale(4.2/w,4.2/w*1.15,4.2/w);geo.translate(0,TEMPL.hapuu.H-.35,0);geo.computeBoundingSphere();
    const m0=src.material,mat=scanMat({map:m0.map,normalMap:m0.normalMap,roughnessMap:m0.roughnessMap,roughness:m0.roughness,name:'leaves'},TEMPL.hapuu.H+2.2,true,{});
    const parts=[{geo:TEMPL.hapuu.bark,mat:barkMats.hapuu},{geo,mat,leaf:true}];SRC.hapuu={near:[],mid:parts,mode:'all',k:[1,1],ver:++srcVer,H:TEMPL.hapuu.H};
    bake('hapuu',parts,TEMPL.hapuu.H+1.6,4.6);}).catch(e=>console.warn('Tree fern crowns:',e));
  // loulu: a slender trunk built from the bark scan, crowned with scanned fan-palm fronds (near and far cuts)
  Promise.all([loadGLB('loulu_crown'),loadGLB('loulu_crown_far')]).then(([gn,gf])=>{const T=TEMPL.loulu,crown=(gl)=>{const ps=scanParts(gl,{},1.6);const bb=sizeOf(ps),w=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z),k=4.6/w;
      const M=new THREE.Matrix4().makeTranslation(.2,T.H-.25,0).multiply(new THREE.Matrix4().makeScale(k,k*1.1,k)).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2));
      for(const p of ps){p.geo.applyMatrix4(M);p.geo.computeBoundingSphere();}return ps;};
    const trunk={geo:T.bark,mat:barkMats.loulu},near=[trunk,...crown(gn)],mid=[trunk,...crown(gf)];SRC.loulu={near,mid,mode:'tiers',k:[1,1],ver:++srcVer,H:T.H};
    bake('loulu',mid,T.H+1.8,4.8);}).catch(e=>console.warn('Loulu crowns:',e));
  const allTrees=()=>{const o=[];for(const ch of live)for(const t of ch.trees)o.push(t);return o;};
  return{layer,quality,SRC,IMP,get count(){return liveTrees;},get spots(){return allTrees();},get chunks(){return live;},
    get kinds(){const n=Object.fromEntries(Object.keys(SPECIES).map(k=>[k,0]));for(const ch of live)for(const t of ch.trees)n[t.kind]++;return n;},
    get scansLoaded(){return Object.keys(done);},
    update(cx,cz){quality(activeGfx());
      if(!physSynced&&PHYS.ready){physSynced=true;for(const ch of live)if(ch.cols)physTrunks(ch,ch.cols,true);}},
    // trees standing within r of (x,z), optionally of one kind (from the chunks built so far)
    near(x,z,r,kind){const o=[];for(const ch of live){if(ch.x0>x+r||ch.x0+CH<x-r||ch.z0>z+r||ch.z0+CH<z-r)continue;for(const t of ch.trees)if((!kind||t.kind===kind)&&Math.hypot(t.x-x,t.z-z)<r)o.push(t);}return o;},
    crownOf(t){return{x:t.x,z:t.z,y:t.y+(SRC[t.rk].H||TEMPL[t.kind].H)*t.sy*.72,kind:t.kind};},
    crownPts(kind){return allTrees().filter(t=>!kind||t.kind===kind).map(t=>this.crownOf(t));}};
})();
// trunks as physics colliders while their chunk lives (once physics has started)
function physTrunks(ch,list,add){if(!PHYS.ready)return;const R=PHYS.R,w=PHYS.world;
  for(const c of list){if(add){if(!c.ph&&c.r>.12)c.ph=w.createCollider(R.ColliderDesc.cylinder(2.5,c.r).setTranslation(c.x,(c.y??heightAt(c.x,c.z))+2.4,c.z));}
    else if(c.ph){w.removeCollider(c.ph,false);c.ph=null;}}}
