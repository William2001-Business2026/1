/* ───────── the forest's animals ─────────
   Fifteen kinds. Puaʻa (pigs), kia (axis deer), kao (feral goats), moa (jungle fowl) and nēnē can be hunted with a spear and
   butchered for meat; the rest are there to watch: the mongoose, ʻiʻiwi and ʻapapane, pueo, ʻio, ʻōpeʻapeʻa, the Kamehameha
   butterfly, Jackson's chameleon, moʻo (geckos) and the happy-face spider. Models are CC BY scans and rigs from Sketchfab
   (credits in assets/models/README.txt); static ones get their legs swung in the vertex shader. */
const FAUNA=(()=>{
  const R4=rng(4242),V3=THREE.Vector3,list=[],loader=gltfLoader;
  const night=()=>smooth(4,-6,evening.elev);
  // loaded materials are plain ones; shader colour and leg changes need node materials
  const toNode=m=>m.isNodeMaterial?m.clone():new THREE.MeshStandardNodeMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,aoMap:m.aoMap,
    roughness:m.roughness??.8,metalness:m.metalness??0,color:m.color?m.color.clone():new THREE.Color(1,1,1),transparent:m.transparent,alphaTest:m.alphaTest,side:m.side,name:m.name});
  // bake a static model into one canonical mesh: y up, feet at 0, facing +z, scaled to `len` along its body
  // each species is baked once and its geometry shared by every animal of it: baking again for each one that streamed in was a 20 ms hitch
  const BAKED=new Map();
  function bake(gl,spec){const key=[spec.file,spec.turn,spec.cut,spec.len,spec.tint].join('|');let B=BAKED.get(key);if(!B){B=bake0(gl,spec);BAKED.set(key,B);}
    const out=new THREE.Group();for(const q of B.parts){const mesh=new THREE.Mesh(q.g,q.mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};out.add(mesh);}return{g:out,h:B.h};}
  function bake0(gl,spec){gl.scene.updateMatrixWorld(true);const meshes=[];gl.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
    const out=[],box=new THREE.Box3();
    const geos=meshes.map(m=>{const g=floatGeo(m.geometry).applyMatrix4(m.matrixWorld);g.rotateY(spec.turn||0);return{g,mat:toNode(m.material)};});
    for(const {g} of geos){g.computeBoundingBox();box.union(g.boundingBox);}
    if(spec.cut){const cy=box.min.y+(box.max.y-box.min.y)*spec.cut;for(const q of geos){const p=q.g.attributes.position,ix=q.g.index;if(!ix)continue;const keep=[];
      for(let i=0;i<ix.count;i+=3){const a=ix.getX(i),b=ix.getX(i+1),c=ix.getX(i+2);if(Math.max(p.getY(a),p.getY(b),p.getY(c))>cy)keep.push(a,b,c);}q.g.setIndex(keep);}box.min.y=cy;} // cut away the display base
    const size=box.getSize(new V3()),k=spec.len/Math.max(size.x,size.z),cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2;
    for(const q of geos){q.g.translate(-cx,-box.min.y,-cz);q.g.scale(k,k,k);q.g.computeBoundingSphere();const mat=q.mat;
      if(spec.tint){mat.color=new THREE.Color(...spec.tint);if(mat.emissiveMap){mat.emissiveMap=null;mat.emissive&&mat.emissive.setRGB(0,0,0);}}out.push({g:q.g,mat});}
    return{parts:out,h:size.y*k};}
  // legs of a static quadruped or bird swing about the hip, diagonal pairs (or alternate, for birds) in step
  /* Animals without a skeleton move in the vertex shader (the model faces +z, its base at y=0): the legs swing below the hip; a bird's
     neck and head pivot down to graze and bob with each step, as geese do; a mongoose bounds, its back arching, its tail swinging. */
  function legShader(group,hip,biped,body,len){const uW=TSL.uniform(0),uA=TSL.uniform(0),uG=TSL.uniform(0);const {positionLocal,positionGeometry,sin,cos,float,vec3,select,sign,clamp,smoothstep}=TSL;
    group.traverse(o=>{if(!o.isMesh)return;const m=o.material=toNode(o.material);const y=positionGeometry.y,z=positionGeometry.z,x=positionGeometry.x;
      const w=clamp(float(hip).sub(y).div(hip*.7),0,1),side=sign(x),front=sign(z),ph=biped?side.mul(1.5708):side.mul(front).mul(1.5708);
      const a=sin(uW.add(ph)).mul(uA).mul(w);let P=positionLocal.add(vec3(0,a.abs().mul(-.04*hip),a.mul(float(hip).sub(y).max(0))));
      if(body==='bird'&&len){const pz=len*.2,py=hip*1.6,nw=smoothstep(pz-len*.02,pz+len*.1,z).mul(smoothstep(hip*1.3,hip*1.65,y));   // the neck, from its base
        const th=uG.mul(1.8).add(sin(uW.mul(2)).mul(uA).mul(.12)).mul(nw),dy=P.y.sub(py),dz=P.z.sub(pz);
        P=vec3(P.x,float(py).add(dy.mul(cos(th))).sub(dz.mul(sin(th))),float(pz).add(dy.mul(sin(th))).add(dz.mul(cos(th)))).add(vec3(0,0,sin(uW.mul(2)).mul(uA).mul(nw).mul(len*.05)));}
      if(body==='lithe'&&len){const u=z.div(len*.5),arch=sin(uW.mul(2)).mul(uA).mul(float(1).sub(u.mul(u)).max(0)).mul(len*.07),tail=smoothstep(-len*.25,-len*.5,z);
        P=P.add(vec3(sin(uW.add(z.mul(9))).mul(tail).mul(len*.09).mul(uA.add(.25)),arch.mul(float(1).sub(w)),0));}
      m.positionNode=P;});
    return{uW,uA,uG};}
  // the moa and the feral goat reuse the island's own rigged chicken and goat models
  const SKINNED={kao:{url:'assets/models/goat.glb',height:.9,turn:0,legs:/^thigh_stretch/,amp:.45,stride:7},moa:{url:'assets/models/rooster.glb',height:.5,turn:-Math.PI/2,legs:/thigh/i,amp:.6,stride:16}};
  const SPEC={
    puaa:{n:'Puaʻa (wild pig)',file:'boar',len:1.3,turn:0,rig:true,anims:{idle:'Idle',graze:'Graze',walk:'Walk',trot:'Trot',run:'Run',alert:'Alert',die:'Die'},recolour:'boar',count:8,zone:'forest',speed:[.6,3.6],flee:13,sneak:6,food:['pork',2]},
    kia:{n:'Kia (axis deer)',file:'deer',len:1.5,turn:Math.PI,rig:true,anims:{idle:'Idle',graze:'Grazing',walk:'WalkForward',run:'Gallop'},count:7,zone:'edge',speed:[.8,6],flee:18,sneak:8,food:['venison',3]},
    kao:{n:'Kao (feral goat)',skinned:'kao',count:5,zone:'mountain',speed:[.7,3.5],flee:12,sneak:6,food:['goatmeat',2]},
    moa:{n:'Moa (jungle fowl)',skinned:'moa',count:7,zone:'forest',speed:[.5,3],flee:6,sneak:3,food:['fowl',1]},
    nene:{n:'Nēnē (Hawaiian goose)',file:'goose',len:.62,turn:'auto',cut:.17,hip:.3,biped:true,count:6,zone:'grass',speed:[.35,1.6],flee:7,sneak:3.5,food:['fowl',2]},
    manakuke:{n:'Manakuke (mongoose)',file:'ferret',len:.5,turn:-Math.PI/2,tint:[.95,.85,.7],hip:.25,count:5,zone:'forest',speed:[.6,4],flee:5,sneak:2.5},
    pueo:{n:'Pueo (Hawaiian owl)',file:'owl',len:.3,turn:0,cut:.28,tint:[.85,.7,.55],count:3,zone:'perch'},
    io:{n:'ʻIo (Hawaiian hawk)',file:'hawk',len:1.1,turn:0,rig:true,anims:{fly:'Wings'},count:2,zone:'soar'},
    opeapea:{n:'ʻŌpeʻapeʻa (hoary bat)',file:'bat',len:.32,turn:0,rig:true,anims:{fly:'flapping'},count:4,zone:'bat'},
    iiwi:{n:'ʻIʻiwi (scarlet honeycreeper)',file:'hummer',len:.15,turn:0,rig:true,anims:{fly:'Animation'},recolour:'iiwi',count:6,zone:'flit'},
    apapane:{n:'ʻApapane (crimson honeycreeper)',file:'hummer',len:.13,turn:0,rig:true,anims:{fly:'Animation'},recolour:'apapane',count:6,zone:'flit'},
    pulelehua:{n:'Pulelehua (Kamehameha butterfly)',file:'butterfly',len:.07,turn:0,rig:true,anims:{fly:'Animation'},tint:[1,.75,.65],count:10,zone:'flutter'},
    chameleon:{n:"Jackson's chameleon",file:'chameleon',len:.32,turn:Math.PI,recolour:'chameleon',count:4,zone:'branch'},
    moo:{n:'Moʻo (gecko)',make:'gecko',count:8,zone:'trunk'},
    nananana:{n:'Nananana makakiʻi (happy-face spider)',make:'spider',count:6,zone:'leaf'},
  };
  // ── small creatures built in code ──
  function makeGecko(){const g=new THREE.Group(),m=new THREE.MeshStandardNodeMaterial({color:srgb(.55,.5,.38),roughness:.5});
    const b=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.07,4,8).rotateX(Math.PI/2),m);b.position.y=.008;g.add(b);
    const t=new THREE.Mesh(new THREE.ConeGeometry(.01,.08,6).rotateX(-Math.PI/2),m);t.position.set(0,.008,-.075);g.add(t);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6).scale(1,.7,1.3),m);hd.position.set(0,.01,.055);g.add(hd);
    for(const [x,z] of [[.02,.03],[-.02,.03],[.02,-.02],[-.02,-.02]]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.025,4).rotateZ(Math.PI/2),m);l.position.set(x,.005,z);g.add(l);}
    g.scale.setScalar(1.6);return{g,h:.02};}
  function makeSpider(){const g=new THREE.Group(),y=new THREE.MeshStandardNodeMaterial({color:srgb(.95,.85,.25),roughness:.4}),blk=new THREE.MeshBasicNodeMaterial({color:srgb(.1,.05,.03)});
    const ab=new THREE.Mesh(new THREE.SphereGeometry(.004,10,8).scale(1,.8,1.2),y);g.add(ab);for(const [x,z,s] of [[-.0015,.002,.0009],[.0015,.002,.0009],[0,-.0015,.0011]]){const d=new THREE.Mesh(new THREE.SphereGeometry(s,6,4),blk);d.position.set(x,.003,z);g.add(d);} // the "face"
    for(let i=0;i<8;i++){const a=(i<4?-1:1)*(.4+(i%4)*.35),l=new THREE.Mesh(new THREE.CylinderGeometry(.0003,.0003,.012,3).rotateZ(Math.PI/2),y);l.position.set(Math.sign(a)*.006,0,Math.cos(a)*.004);l.rotation.y=a;g.add(l);}
    g.scale.setScalar(4);return{g,h:.005};}
  // ── where they live: homes are streamed with the land in 128 m chunks, from the ground truth and the trees that stand there ──
  // Ground animals live in groups: a sounder of pigs, a herd of deer or goats, a cock with his hens, a pair of nēnē; the mongoose alone.
  const GROUND=['forest','edge','mountain','grass'];
  const GROUP={puaa:[3,6,.45],kia:[3,7,.35],kao:[3,5,.5],moa:[2,4,.45],nene:[2,2,.45],manakuke:[1,1,.35]}; // members min, max; groups per chunk where the habitat is
  const OTHER={pueo:.25,chameleon:.3,iiwi:.6,apapane:.6,moo:.9,nananana:.6,pulelehua:.8,io:.18,opeapea:.5};
  function habitat(zone,x,z){const h=heightAt(x,z);if(h<1.3||freshAt(x,z)!=null||nearStart(x,z,25)||nearHome(x,z,10))return null;const fw=forestW(x,z),m=masks(x,z),zn=zoneAt(x,z),ny=tnorm(x,z).y;
    if(zone==='forest'&&fw>.5&&ny>.6)return{x,z,y:h};if(zone==='edge'&&fw<.4&&fw>.02&&m.d>20&&ny>.6)return{x,z,y:h};
    if(zone==='mountain'&&zn==='mountain'&&ny>.6)return{x,z,y:h};if(zone==='grass'&&fw<.2&&zn!=='mountain'&&m.d>28&&m.lava<.3&&ny>.7)return{x,z,y:h};return null;}
  const FCH=128;let FQ=Math.max(.4,.35+.65*activeGfx().grass);   // fewer animals, nearer, on lighter settings
  function* homes(ch){const R=ch.R,cx=ch.x0+FCH/2,cz=ch.z0+FCH/2;ch.plans=[];
    // the birds perch in this chunk's trees: wait until they are planned, so the same birds come back to the same trees
    for(let k=0;k<600;k++){let ok=true;for(let i=0;i<2;i++)for(let j=0;j<2;j++){const c=FLORA.layer.chunks.get((Math.floor(ch.x0/64)+i)+','+(Math.floor(ch.z0/64)+j));if(c&&c.state!==2)ok=false;}if(ok)break;yield;}
    for(const key in GROUP){const [n0,n1,dens]=GROUP[key],sp=SPEC[key],u=R(),a=R(),b=R(),c=R(),e=R();if(u>dens*FQ)continue;
      let hm=null;for(let t=0;t<4&&!hm;t++)hm=habitat(sp.zone,ch.x0+((a+t*.37)%1)*FCH,ch.z0+((b+t*.61)%1)*FCH);if(!hm)continue;
      ch.plans.push({key,n:n0+Math.floor(c*(n1-n0+.999)),home:hm,seed:Math.floor(e*1e9)});yield;}
    const trees=FLORA.near(cx,cz,FCH*.72).filter(t=>t.x>=ch.x0&&t.x<ch.x0+FCH&&t.z>=ch.z0&&t.z<ch.z0+FCH).sort((p,q)=>p.x-q.x||p.z-q.z);
    const pick=(L,v)=>L.length?L[Math.floor(v*L.length)]:null;
    for(const key in OTHER){const sp=SPEC[key],u=R(),v=R(),w=R(),a=R(),b=R();if(u>OTHER[key]*FQ)continue;let h=null;const z=sp.zone;
      if(z==='perch'||z==='branch'){const t=pick(trees.filter(t=>t.kind==='ohia'||t.kind==='koa'||t.kind==='kukui'),v);if(t){const c=FLORA.crownOf(t);h={x:c.x+(w-.5)*2,z:c.z+(a-.5)*2,y:c.y-1.2};}}
      else if(z==='flit'){const t=pick(trees.filter(t=>t.rk==='ohia'),v);if(t){const c=FLORA.crownOf(t);h={x:c.x,z:c.z,y:c.y};}}
      else if(z==='flutter'){const t=pick(trees,v);if(t)h={x:t.x+(w-.5)*6,z:t.z+(a-.5)*6,y:heightAt(t.x,t.z)+1.2};}
      else if(z==='trunk'){const t=pick(trees.filter(t=>t.kind!=='hapuu'&&t.rk!=='ohia2'),v);if(t)h={x:t.x,z:t.z,y:t.h+.8+w*1.5,trunk:t};}
      else if(z==='leaf'){const s=habitat('forest',ch.x0+v*FCH,ch.z0+w*FCH);if(s)h={...s,y:s.y+.35};}
      else if(z==='soar'){const zn=zoneAt(cx,cz);if(zn==='mountain'||forestW(cx,cz)>.3||v<.3)h={x:cx+(w-.5)*60,z:cz+(a-.5)*60,y:0};}
      else if(z==='bat'){for(let t=0;t<16&&!h;t++){const x=ch.x0+((v+t*.137)%1)*FCH,zz=ch.z0+((w+t*.291)%1)*FCH;if(freshAt(x,zz)!=null)h={x,z:zz,y:heightAt(x,zz)};}}
      if(h)ch.plans.push({key,n:1,home:h,seed:Math.floor(b*1e9)});yield;}}
  const groups=[];
  function spawnChunk(ch){ch.animals=[];ch.groups=[];
    for(const P of ch.plans){const sp=SPEC[P.key],r=rng(P.seed),G={key:P.key,sp,home:P.home,members:[],off:[],act:null,goal:null,stT:0,spread:1};
      for(let i=0;i<P.n;i++){const a2=i===0?0:r()*6.283,rr=i===0?0:1.2+r()*2.2,off={x:Math.sin(a2)*rr,z:Math.cos(a2)*rr};
        const hx=P.home.x+off.x,hz=P.home.z+off.z,h0={...P.home,x:hx,z:hz,y:P.home.trunk||sp.zone==='perch'||sp.zone==='flit'||sp.zone==='branch'||sp.zone==='leaf'?P.home.y:heightAt(hx,hz)};
        const a=makeOne(P.key,sp,h0,r);a.ch=ch;a.grp=P.n>1||GROUND.includes(sp.zone)?G:null;a.size=i>0&&P.key==='puaa'&&r()<.6?.55+r()*.3:1;   // young pigs follow the sow
        a.g.scale.setScalar(a.size);G.members.push(a);G.off.push(off);ch.animals.push(a);}
      if(GROUND.includes(sp.zone)){ch.groups.push(G);groups.push(G);}}}
  function despawnChunk(ch){for(const a of ch.animals||[]){a.removed=true;scene.remove(a.g);let i=list.indexOf(a);if(i>=0)list.splice(i,1);i=interact.indexOf(a.g);if(i>=0)interact.splice(i,1);}
    for(const G of ch.groups||[]){const i=groups.indexOf(G);if(i>=0)groups.splice(i,1);}ch.animals=ch.groups=null;}
  // ── load and make the animals ──
  const cache={};const load=url=>cache[url]||(cache[url]=loader.loadAsync(url));
  function recolour(root,how){root.traverse(o=>{if(!o.isMesh)return;const m=o.material=toNode(o.material);const {texture,uv,vec3,vec4,dot,mix,smoothstep,materialColor}=TSL;
    if(how==='boar'){const {positionGeometry:pg,float,clamp}=TSL;m.roughness=.86;m.metalness=0;
      if(/Material/.test(m.name)){m.colorNode=vec4(.5,.45,.36,1);m.roughness=.4;return;}                    // the tusks
      const bristle=vn(pg.xz.mul(90).add(pg.y.mul(40))),grizzle=vn(pg.xy.mul(14).add(pg.z.mul(9))).mul(.6).add(vn(pg.yz.mul(33)).mul(.4));
      const back=smoothstep(.55,1,pg.y),snout=smoothstep(.95,1.12,pg.z).mul(smoothstep(.75,.5,pg.y)),hoof=smoothstep(.09,.04,pg.y);
      let c=mix(vec3(.009,.0075,.006),vec3(.026,.02,.015),grizzle);                                         // near-black, with brown grizzle
      c=mix(c,vec3(.055,.042,.032),back.mul(smoothstep(.55,.8,bristle)).mul(.7));                           // pale bristle tips along the back
      c=mix(c,vec3(.045,.03,.026),snout);c=mix(c,vec3(.004,.0035,.003),hoof);
      m.colorNode=vec4(c.mul(mix(.75,1.15,bristle)),1);m.roughnessNode=mix(float(.92),float(.6),snout);return;}
    if(!m.map)return;const tx=texture(m.map,uv()),l=dot(tx.rgb,vec3(.3,.59,.11));
    if(how==='iiwi')m.colorNode=vec4(mix(vec3(.02,.015,.012),vec3(.78,.06,.03),smoothstep(.06,.3,l)),tx.a);        // scarlet with black wings
    else if(how==='apapane')m.colorNode=vec4(mix(vec3(.02,.015,.015),vec3(.5,.03,.04),smoothstep(.05,.3,l)),tx.a);   // deeper crimson
    else if(how==='feral')m.colorNode=vec4(vec3(l).mul(vec3(.13,.105,.088)).mul(1.4),tx.a);                         // dark, bristly feral colouring
    else if(how==='chameleon'&&/Default/.test(m.name))m.colorNode=vec4(mix(vec3(.08,.22,.05),vec3(.35,.62,.18),smoothstep(.15,.6,l)),tx.a);});}
  function makeOne(key,sp,h0,r=R4){const a={key,sp,g:new THREE.Group(),home:{...h0},p:new V3(h0.x,h0.y,h0.z),yaw:r()*6.28,t:r()*100,state:'idle',stT:r()*4,
      walk:0,speed:0,dead:false,gone:0,fleeT:0,mixer:null,acts:{},cur:null,legs:null,bones:null,phase:r()*6.28};
    a.g.position.copy(a.p);scene.add(a.g);
    const px=new THREE.Mesh(geo.box,proxyMat);const sz=sp.len||(sp.skinned==='kao'?1:.45);px.scale.set(sz*.6,Math.max(.12,sz*.6),sz);px.position.y=sz*.3;a.g.add(px);
    a.g.userData.item={label:()=>a.dead?sp.n+', dead':sp.n,get verb(){return a.dead?'butcher it':sp.food&&selKind()==='spear'?'click to strike':'';},
      e(){if(!a.dead)return;physForget(a.g);a.phys=a.rested=false;give(sp.food[0],sp.food[1]);note('hunt');SFX.chop&&SFX.chop();a.dead=false;a.gone=nowS()+600;a.g.visible=false;},
      use(k){if(k!=='spear'||!sp.food||a.dead)return false;handAnim=1;const sneak=keys.ShiftLeft||keys.ShiftRight;
        if(Math.random()<(sneak?.75:.45)){a.dead=true;a.state='dead';a.dieT=0;a.dieSide=Math.random()<.5?1:-1;if(a.acts.die){const d=a.acts.die;d.setLoop(THREE.LoopOnce,1);d.clampWhenFinished=true;d.timeScale=.7;play(a,'die',.15);}SFX.thud&&SFX.thud(.6);note('hunt');
          // a real body: it topples over sideways and tumbles down the slope, then lies where it stops
          const fx=a.p.x-player.x,fz=a.p.z-player.z,fl=Math.hypot(fx,fz)||1;
          if(physDrop(a.g,{vel:{x:fx/fl*1.4,y:.8,z:fz/fl*1.4},onRest:()=>{a.phys=false;a.rested=true;a.p.copy(a.g.position);}})){a.phys=true;
            const b=PHYS.bodies.get(a.g).body,s=Math.random()<.5?1:-1;b.setAngvel({x:Math.sin(a.yaw)*3.2*s,y:(Math.random()-.5),z:Math.cos(a.yaw)*3.2*s},true);}}
        else{a.fleeT=4;a.state='run';toast('Missed. It bolts.',1.8);}return true;}};
    interact.push(a.g);list.push(a);
    if(sp.make){const r=sp.make==='gecko'?makeGecko():makeSpider();a.g.add(r.g);a.body=r.g;return a;}
    if(sp.skinned){const S=SKINNED[sp.skinned];load(S.url).then(gl=>{if(a.removed)return;const box=new THREE.Box3().setFromObject(gl.scene),k=S.height/box.getSize(new V3()).y;
      const m=cloneSkinned(gl.scene);m.rotation.y=S.turn;m.scale.setScalar(k);m.position.y=-box.min.y*k;m.traverse(x=>{if(x.isMesh){x.castShadow=true;x.frustumCulled=false;x.raycast=()=>{};}});a.g.add(m);a.body=m;
      if(sp.skinned==='moa')m.traverse(x=>{if(x.isMesh&&x.material){x.material=x.material.clone();x.material.color=new THREE.Color(.75,.62,.5);}}); // wilder, darker colouring than the farm birds
      const mixer=new THREE.AnimationMixer(m);if(gl.animations[0]){const act=mixer.clipAction(gl.animations[0]);act.play();}a.mixer=mixer;
      const legs=[];m.traverse(x=>{if(x.isBone&&S.legs.test(x.name))legs.push(x);});m.updateMatrixWorld(true);a.g.updateMatrixWorld(true);
      const lp=legs.map(b=>({b,p:a.g.worldToLocal(b.getWorldPosition(new V3()))})),mid=lp.reduce((s,l)=>s+l.p.z,0)/Math.max(1,lp.length);
      a.bones={S,L:lp.reduce((s,l)=>s+l.p.y,0)/Math.max(1,lp.length)/(a.size||1),legs:lp.map(({b,p})=>({b,ph:(lp.length<3?p.x>0:(p.z>mid)!==(p.x>0))?0:Math.PI}))};}).catch(e=>console.warn('Animal',key,e));return a;}
    load('assets/models/fauna/'+sp.file+'.glb').then(gl=>{if(a.removed)return;
      if(sp.rig){const box=new THREE.Box3().setFromObject(gl.scene),s=box.getSize(new V3()),k=sp.len/Math.max(s.x,s.z);const m=cloneSkinned(gl.scene);
        m.rotation.y=sp.turn||0;m.scale.setScalar(k);m.position.y=-box.min.y*k;m.traverse(x=>{if(x.isMesh){x.castShadow=true;x.frustumCulled=false;x.raycast=()=>{};if(x.material&&x.material.emissiveMap){x.material=x.material.clone();x.material.emissiveMap=null;x.material.emissive&&x.material.emissive.setRGB(0,0,0);} // no glowing eyes
          if(sp.tint&&x.material){x.material=x.material.clone();x.material.color=new THREE.Color(...sp.tint);}}});
        if(sp.recolour)recolour(m,sp.recolour);a.g.add(m);a.body=m;const mixer=new THREE.AnimationMixer(m);a.mixer=mixer;
        for(const [role,name] of Object.entries(sp.anims||{})){const clip=gl.animations.find(c=>c.name.includes(name));if(clip)a.acts[role]=mixer.clipAction(clip);}
        const first=a.acts.idle||a.acts.fly;if(first){first.play();a.cur=first;mixer.update(Math.random()*3);}
      }else{let spec=sp;if(sp.turn==='auto'){ // birds: face the head, the highest point
          let hi=null,hy=-1e9,c=new V3(),n=0;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,v=new V3();for(let i=0;i<p.count;i+=7){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);c.add(v);n++;if(v.y>hy){hy=v.y;hi=v.clone();}}});
          c.multiplyScalar(1/n);spec={...sp,turn:-Math.atan2(hi.x-c.x,hi.z-c.z)};}
        const r=bake(gl,spec);if(sp.recolour)recolour(r.g,sp.recolour);a.g.add(r.g);a.body=r.g;if(sp.hip){a.legs=legShader(r.g,sp.hip*r.h,sp.biped,key==='nene'?'bird':key==='manakuke'?'lithe':null,sp.len);a.hipH=sp.hip*r.h;}}
    }).catch(e=>console.warn('Animal',key,e));
    return a;}
  // ── behaviour ──
  const play=(a,role,fade=.3)=>{const act=a.acts[role];if(!act||a.cur===act)return;act.reset().play();if(a.cur)a.cur.crossFadeTo(act,fade,false);a.cur=act;};
  /* feet that do not slide: how fast each walk, trot and run clip carries the body, measured once from the clip itself (the feet's
     backward speed while they are down), so the clip plays at exactly the rate the animal's speed calls for */
  const clipV={};
  function clipSpeed(a,role){const key=(a.sp.file||a.key)+role;if(key in clipV)return clipV[key];clipV[key]=null;const act=a.acts[role];if(!act||!a.body)return null;
    const m=a.body,mixer=new THREE.AnimationMixer(m),ac=mixer.clipAction(act.getClip());ac.play();const bones=[];m.traverse(o=>{if(o.isBone)bones.push(o);});
    const inv=new THREE.Matrix4(),v=new V3(),N=40,T=act.getClip().duration,track=new Map();
    for(let i=0;i<=N;i++){mixer.setTime(T*i/N);a.g.updateMatrixWorld(true);inv.copy(a.g.matrixWorld).invert();for(const b of bones){b.getWorldPosition(v).applyMatrix4(inv);(track.get(b)||track.set(b,[]).get(b)).push([v.y,v.z]);}}
    const feet=bones.map(b=>({b,y:Math.min(...track.get(b).map(p=>p[0]))})).sort((p,q)=>p.y-q.y).slice(0,4);let s=0,n=0;
    for(const f of feet){const P=track.get(f.b),y0=Math.min(...P.map(p=>p[0])),y1=Math.max(...P.map(p=>p[0]));
      for(let i=0;i<N;i++)if(P[i][0]<y0+(y1-y0)*.25&&P[i+1][0]<y0+(y1-y0)*.25){s+=-(P[i+1][1]-P[i][1])/(T/N);n++;}}
    mixer.stopAllAction();mixer.uncacheRoot(m);const sp=n?s/n:0;return clipV[key]=sp>.05?sp:null;}
  // the day of a ground animal: what its group does at each time of day
  const SCHED={puaa:{night:'feed',twilight:'drink',midday:'rest',day:'feed'},kia:{night:'sleep',twilight:'drink',midday:'rest',day:'feed'},kao:{night:'sleep',twilight:'drink',midday:'rest',day:'feed'},
    moa:{night:'sleep',twilight:'feed',midday:'rest',day:'feed'},nene:{night:'sleep',twilight:'drink',midday:'rest',day:'feed'},manakuke:{night:'sleep',twilight:'feed',midday:'feed',day:'feed'}};
  let force=null;const phaseNow=()=>force||(evening.elev<-4?'night':evening.elev<12?'twilight':evening.elev>52?'midday':'day');
  const okGround=(x,z)=>heightAt(x,z)>.6&&freshAt(x,z)==null&&tnorm(x,z).y>.6;
  // water to drink: the nearest bank of fresh water, by rings out from home
  function findWater(h){for(let r=10;r<=180;r+=10)for(let k=0;k<16;k++){const an=k/16*6.283+r*.1,x=h.x+Math.sin(an)*r,z=h.z+Math.cos(an)*r;if(freshAt(x,z)==null)continue;
      for(let s=0;s<40;s++){const t=s*.5,bx=x-Math.sin(an)*t,bz=z-Math.cos(an)*t;if(freshAt(bx,bz)==null&&heightAt(bx,bz)>.6){const e=.7;return{x:bx-Math.sin(an)*e,z:bz-Math.cos(an)*e,wx:x,wz:z};}}}return null;}
  // shade for the hot hours: beside the nearest canopy tree
  function findShade(h){let best=null,bd=1e9;for(const t of FLORA.near(h.x,h.z,45))if(t.kind!=='hapuu'&&t.rk!=='ohia2'){const d=Math.hypot(t.x-h.x,t.z-h.z);if(d<bd){bd=d;best=t;}}
    if(!best)return null;const an=Math.atan2(h.x-best.x,h.z-best.z),r=1.6+best.s;return{x:best.x+Math.sin(an)*r,z:best.z+Math.cos(an)*r};}
  function planGroup(G,dt){const act=SCHED[G.key][phaseNow()];if(act!==G.act){G.act=act;G.goal=null;G.stT=0;}
    G.stT-=dt;
    if(G.act==='drink'){if(G.water===undefined)G.water=findWater(G.home);if(G.water){G.goal=G.water;G.spread=.55;return;}G.act='feed';}
    if(G.act==='rest'||G.act==='sleep'){if(G.shade===undefined)G.shade=findShade(G.home);G.goal=G.shade||G.home;G.spread=.8;return;}
    G.spread=1;if(!G.goal||G.stT<=0){for(let t=0;t<6;t++){const an=Math.random()*6.283,d=4+Math.random()*16,x=G.home.x+Math.sin(an)*d,z=G.home.z+Math.cos(an)*d;if(okGround(x,z)){G.goal={x,z};break;}}
      G.stT=10+Math.random()*16;}}
  // one member's part in its group's plan: go to its place round the goal, then graze, drink, stand or settle down
  function routine(a,dt){const G=a.grp;
    if(!G||!G.goal){a.stT-=dt;if(a.stT<=0){const r=Math.random();if(r<.45){a.state='walk';const an=Math.random()*6.28,d=3+Math.random()*9;a.tx=a.home.x+Math.sin(an)*d;a.tz=a.home.z+Math.cos(an)*d;a.stT=4+Math.random()*6;}
      else{a.state=r<.8?'graze':'idle';a.stT=3+Math.random()*6;}}return;}
    const off=G.off[G.members.indexOf(a)]||{x:0,z:0};let tx=G.goal.x+off.x*G.spread,tz=G.goal.z+off.z*G.spread;
    if(G.act==='drink'&&G.water){const an=Math.atan2(G.water.wx-G.water.x,G.water.wz-G.water.z),side=off.x*Math.cos(an)-off.z*Math.sin(an);tx=G.water.x+Math.cos(an)*side;tz=G.water.z-Math.sin(an)*side;} // side by side along the bank
    const d=Math.hypot(tx-a.p.x,tz-a.p.z);a.rest=G.act==='sleep'?1:G.act==='rest'?.5:0;
    if(d>.7){if(a.state!=='walk'&&a.state!=='trot'||Math.hypot(a.tx-tx,a.tz-tz)>.5){a.tx=tx;a.tz=tz;}a.state=d>9&&a!==G.members[0]?'trot':'walk';a.stT=0;return;}
    if(a.state==='walk'||a.state==='trot')a.state='idle';
    if(G.act==='drink'&&G.water){let t=Math.atan2(G.water.wx-a.p.x,G.water.wz-a.p.z)-a.yaw;t=Math.atan2(Math.sin(t),Math.cos(t));a.yaw+=t*Math.min(1,dt*3);a.state='graze';return;} // heads down to the water
    if(G.act==='feed'){a.stT-=dt;if(a.stT<=0){a.state=Math.random()<.7?'graze':'idle';a.stT=2+Math.random()*5;}}else a.state='idle';}
  const ground=(a,dt,pd,sneak)=>{const sp=a.sp,G=a.grp,fr=sneak?sp.sneak:sp.flee;
    if(a.fleeT>0||pd<fr||a.state==='alert'&&a.alertT<=0&&pd<fr*1.6){
      if(a.fleeT<=0){a.fleeT=3+Math.random()*2;if(G)for(const m of G.members)if(m!==a&&!m.dead&&m.fleeT<=0){m.fleeT=a.fleeT*(.85+Math.random()*.3);m.fleeJit=(Math.random()-.5)*.8;}} // one bolts, the group bolts
      a.fleeT-=dt;a.state='run';const th=a.threat||player,ang=Math.atan2(a.p.x-th.x,a.p.z-th.z)+(a.fleeJit||0);if(a.fleeT<=0)a.threat=null;   // away from you, or from what else frightened ita.tx=a.p.x+Math.sin(ang)*8;a.tz=a.p.z+Math.cos(ang)*8;
      if(G&&a.fleeT<=0){G.home={x:a.p.x,z:a.p.z,y:a.p.y};G.goal=null;G.water=undefined;G.shade=undefined;}}                       // it settles where it ran to
    else if(pd<fr*1.6&&(a.state!=='alert'||a.alertT>0)){if(a.state!=='alert'){a.state='alert';a.alertT=.8+Math.random()*1.2;}a.alertT-=dt;    // it has noticed you: head up, still, watching
      let t=Math.atan2(player.x-a.p.x,player.z-a.p.z)-a.yaw;t=Math.atan2(Math.sin(t),Math.cos(t));a.yaw+=t*Math.min(1,dt*3);}
    else{if(a.state==='alert'){a.state='idle';a.stT=1+Math.random()*2;}routine(a,dt);}
    const moving=a.state==='walk'||a.state==='run'||a.state==='trot',want=moving?(a.state==='run'?sp.speed[1]:a.state==='trot'?lerp(sp.speed[0],sp.speed[1],.4):sp.speed[0])*(a.size<1?.9:1):0;
    const spd=a.vel=lerp(a.vel||0,want,Math.min(1,dt*(want>(a.vel||0)?(a.state==='run'?3.5:2):5)));                  // animals have weight: they speed up and pull up
    if(moving||spd>.05){const dx=a.tx-a.p.x,dz=a.tz-a.p.z,d=Math.hypot(dx,dz);if(d<.3){if(a.state==='walk'||a.state==='trot'){a.state='idle';a.stT=2;}}
      else{const st=Math.min(d,spd*dt),nx=a.p.x+dx/d*st,nz=a.p.z+dz/d*st;if(!okGround(nx,nz)){a.tx=a.p.x;a.tz=a.p.z;a.state='idle';if(G)G.goal=null;}
        else{a.p.x=nx;a.p.z=nz;let t=Math.atan2(dx,dz)-a.yaw;t=Math.atan2(Math.sin(t),Math.cos(t));a.yaw+=t*Math.min(1,dt*6);a.walk+=st;FOOT.animal(a);}}}
    a.p.y=heightAt(a.p.x,a.p.z);a.speed=spd;
    if(a.mixer&&a.acts.walk){const role=a.state==='run'||a.state==='trot'?(a.acts.trot&&spd<sp.speed[1]*.55?'trot':a.state==='trot'?'walk':'run'):a.state==='walk'?'walk':a.state==='graze'?'graze':a.state==='alert'&&a.acts.alert?'alert':'idle';play(a,role);
      if(role==='walk'||role==='run'||role==='trot'){const v=clipSpeed(a,role)||(role==='walk'?sp.speed[0]:role==='trot'?sp.speed[1]*.45:sp.speed[1]);a.cur.timeScale=clamp(spd/(v*(a.size||1)),.3,2.5);} // feet keep pace with the ground
      else a.cur.timeScale=role==='idle'?1-(a.rest||0)*.75:1;}};
  function tick(dt,t){const sneak=keys.ShiftLeft||keys.ShiftRight,nt=night();
    for(const G of groups){const L=G.members[0];if(L&&Math.hypot(L.p.x-camera.position.x,L.p.z-camera.position.z)<150)planGroup(G,dt);}
    for(const a of list){const sp=a.sp;
      if(a.gone){if(nowS()<a.gone)continue;a.gone=0;a.p.set(a.home.x,a.home.y,a.home.z);a.g.visible=true;a.g.rotation.set(0,a.yaw,0);a.state='idle';if(a.acts.die){a.acts.die.stop();a.cur=null;play(a,'idle',0);}}
      const dc=Math.hypot(a.p.x-camera.position.x,a.p.z-camera.position.z),far=dc>(sp.zone==='soar'?400:sp.zone==='leaf'||sp.make?30:150);a.g.visible=!far&&!a.gone;if(far&&!a.dead)continue;
      if(a.dead&&(a.phys||a.rested)){if(a.phys)a.p.copy(a.g.position);if(a.mixer&&a.acts.die)a.mixer.update(dt);continue;}  // the physics has the body, or it lies where it came to rest
      if(a.dead){a.dieT=(a.dieT||0)+dt;a.g.position.copy(a.p);
        const k=Math.min(1,a.dieT/.6),e=k*k*(3-2*k);a.g.rotation.set(0,a.yaw,a.dieSide*Math.PI/2*e*.92);a.g.position.y+=(sp.len||.45)*.22*e*(a.size||1)+.03; // legs buckle and it rolls onto its side
        if(a.mixer)a.mixer.update(a.acts.die?dt:dt*(1-k));continue;} // a rigged animal flinches as it goes down
      a.t+=dt;const pd=Math.hypot(a.p.x-player.x,a.p.z-player.z);if(pd<(sp.zone==='soar'?60:12)&&a.g.visible)W.seen[sp.n]=1;   // counts as seen in the book
      if(GROUND.includes(sp.zone))ground(a,dt,pd,sneak);
      else if(sp.zone==='soar'){const R=45+20*Math.sin(a.t*.01+a.phase),an=a.t*.045+a.phase,gy=heightAt(a.home.x,a.home.z);a.p.set(a.home.x+Math.sin(an)*R,Math.max(gy,40)+35+Math.sin(a.t*.07)*6,a.home.z+Math.cos(an)*R);a.yaw=an+Math.PI/2;
        if(a.acts.fly)a.acts.fly.timeScale=Math.sin(a.t*.3+a.phase)>.6?1:0.05;}                                   // mostly soaring, now and then a few wingbeats
      else if(sp.zone==='bat'){a.g.visible=a.g.visible&&nt>.3;const an=a.t*1.3+a.phase,r=4+2*Math.sin(a.t*.7);a.p.set(a.home.x+Math.sin(an)*r+Math.sin(a.t*3.1)*.6,a.home.y+3+Math.sin(a.t*2.3)*1.2,a.home.z+Math.cos(an*1.3)*r);a.yaw=an+Math.PI/2;}
      else if(sp.zone==='flit'||sp.zone==='flutter'){a.g.visible=a.g.visible&&nt<.6;a.stT-=dt;if(a.stT<=0||!a.tgt){const C=sp.zone==='flit'?FLORA.near(a.home.x,a.home.z,30,'ohia').filter(t=>t.rk==='ohia'):[];const c=C.length?FLORA.crownOf(C[Math.floor(Math.random()*C.length)]):null;
          a.tgt=c?new V3(c.x+(Math.random()-.5)*3,c.y+(Math.random()-.5)*2,c.z+(Math.random()-.5)*3):new V3(a.home.x+(Math.random()-.5)*8,heightAt(a.home.x,a.home.z)+.6+Math.random()*1.8,a.home.z+(Math.random()-.5)*8);a.stT=2+Math.random()*4;}
        const d=a.tgt.clone().sub(a.p),l=d.length();if(l>.1){a.p.addScaledVector(d,Math.min(1,dt*(sp.zone==='flit'?1.5:.8)));a.yaw=Math.atan2(d.x,d.z);}if(sp.zone==='flutter')a.p.y+=Math.sin(a.t*6)*.01;}
      else if(sp.zone==='perch'){if(pd<5&&!a.fleeT){a.fleeT=1;const C=FLORA.near(a.p.x,a.p.z,40).filter(t=>t.kind==='ohia'||t.kind==='koa');if(C.length){const c=FLORA.crownOf(C[Math.floor(Math.random()*C.length)]);a.home={x:c.x,z:c.z,y:c.y-1.2};}}
        a.fleeT=Math.max(0,a.fleeT-dt*.1);a.p.lerp(new V3(a.home.x,a.home.y,a.home.z),Math.min(1,dt*.6));a.yaw+=Math.sin(a.t*.4)*.004;}
      else if(sp.zone==='branch'){a.p.set(a.home.x,a.home.y,a.home.z);a.yaw=a.phase;}
      else if(sp.zone==='trunk'){const tr=a.home.trunk;if(!tr){continue;}a.stT-=dt;if(a.stT<=0){a.tgtY=tr.h+.5+Math.random()*2.2;a.stT=1+Math.random()*5;}if(pd<2)a.tgtY=tr.h+3;
        const ang=a.phase,r=.22*(tr.s||1);a.p.set(tr.x+Math.sin(ang)*r,lerp(a.p.y,a.tgtY||a.p.y,Math.min(1,dt*1.5)),tr.z+Math.cos(ang)*r);a.g.position.copy(a.p);a.g.rotation.set(-Math.PI/2,ang,0,'YXZ');continue;}
      a.g.position.copy(a.p);a.g.rotation.set(0,a.yaw,0);
      if(GROUND.includes(sp.zone)){const nn=tnorm(a.p.x,a.p.z),ty=new V3(nn.x,1,nn.z).normalize();a.tilt=(a.tilt||new V3(0,1,0)).lerp(ty,Math.min(1,dt*4));
        a.g.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new V3(0,1,0),a.tilt));                // standing on the slope, not plumb on it
        a.lie=lerp(a.lie||0,a.state==='idle'?(a.rest||0):0,Math.min(1,dt*1.5));if(a.lie>.01)a.g.position.y-=a.lie*(sp.len||.5)*.12*(a.size||1);} // settling down to rest and sleep
      if(a.mixer){const far=Math.hypot(a.p.x-camera.position.x,a.p.z-camera.position.z)>35;a.mixAcc=(a.mixAcc||0)+dt;   // far off, a skeleton moves every third frame
        if(!far||(a.mixI=((a.mixI||0)+1)%3)===0){a.mixer.update(a.mixAcc);a.mixAcc=0;}}
      if(a.legs){const uA=a.speed>.05?Math.min(.7,.25+a.speed*.12):0;a.legs.uA.value=lerp(a.legs.uA.value,uA,Math.min(1,dt*6));      // legs swing so a foot on the ground moves back exactly as fast as the body moves on
        a.legPh=(a.legPh||0)+a.speed*dt*Math.PI/(2*Math.max(.12,a.legs.uA.value)*(a.hipH||.2));a.legs.uW.value=a.legPh;
        a.legs.uG.value=lerp(a.legs.uG.value,a.state==='graze'||(a.state==='idle'&&Math.sin(time*.4+(a.phase||0)*7)>.35)?1:0,Math.min(1,dt*2.2));}   // head down to the grass, up to look round
      if(a.bones&&a.speed>.05){a.g.updateMatrixWorld(true);const S=a.bones.S,ax=new V3(1,0,0).applyQuaternion(a.g.getWorldQuaternion(new THREE.Quaternion())),q2=new THREE.Quaternion(),q3=new THREE.Quaternion(),ax2=new V3();
        const amp=S.amp*(a.state==='run'?1.3:1),ph=a.walk*Math.PI/(2*(a.bones.L||.4)*Math.sin(amp));for(const L of a.bones.legs){L.b.parent.getWorldQuaternion(q2).invert();ax2.copy(ax).applyQuaternion(q2);L.b.quaternion.premultiply(q3.setFromAxisAngle(ax2,Math.sin(ph+L.ph)*amp));}}
    }
  }
  const layer=STREAM.layer({name:'fauna',size:FCH,seed:128,prio:2,radius:()=>140+120*FQ,margin:30,build:homes,ready:spawnChunk,dispose:despawnChunk});
  return{list,groups,tick,layer,quality(g){FQ=Math.max(.4,.35+.65*g.grass);},force(p){force=p||null;},make(key,x,z){return makeOne(key,SPEC[key],{x,y:heightAt(x,z),z});},   // make: one animal, for tests
    get phase(){return phaseNow();},clipV,
    get counts(){const n={};for(const a of list)n[a.key]=(n[a.key]||0)+1;return n;},species:Object.keys(SPEC)};
})();

scene.fog=new THREE.FogExp2(0x0b4a58,0); // only thickens under water
window.__tF1=performance.now();window.STAMv=()=>STAM.v;window.__forceWet=()=>{U.uWet.value=1;U.uSwell.value=1;raining=1;};window.WETv=()=>U.uWet.value;window.FLORA_INFO=()=>({count:FLORA.count,kinds:FLORA.kinds});window.__hm={heroReach,heightAt,recompute,addPiece,removePiece,supportedAt,tryRecipe,have,get FORMS(){return FORMS;},get PIECEPHYS(){return PIECEPHYS;},get GUIDE(){return GUIDE;},get FOOT(){return FOOT;},get MAPBOOK(){return MAPBOOK;},get ATMOS(){return ATMOS;},get LIFE(){return LIFE;},get TRAVEL(){return TRAVEL;},get fireRT(){return fireRT;},get WIND(){return WIND;},forestW,get GR(){return GR;},get GPU(){return GPU;},get RIVER(){return RIVER;},get U(){return U;},get TUBE(){return TUBE;},get FRESH(){return FRESH;},get MOUTH(){return MOUTH;},get CLUTTER(){return CLUTTER;},get RAG(){return RAG;},get SKYCLOCK(){return SKYCLOCK;},get TERRAIN(){return TERRAIN;},get PLACES(){return{START,LANAI,POOL,SPRING,PEAK,PEAK_H,fall:FRESH.fallAt};},get STREAM(){return STREAM;},get GRASS(){return GRASS;},get cols(){return colliders.length;},get interactLen(){return interact.length;},get colliders(){return colliders;},get REEL(){return REEL;},get hero(){return hero;},heroPlay,get keys(){return keys;},get FAUNA(){return FAUNA;},get RECIPES(){return RECIPES;},get FORMS(){return FORMS;},get CROPS(){return CROPS;},dishOf,eat,zoneAt,have,takeFrom,get GUIDE(){return GUIDE;},interactE,get looked(){return looked;},get FLORA(){return FLORA;},get SEA(){return SEA;},get DIVE(){return DIVE;},get scene(){return scene;},get camera(){return camera;},player,groundAt,surfaceAt,pickUp,cup,lantern,coco,chickens,goat,PHYS,useHeld,sysDrop,settle,supportedAt,get pieceCols(){return pieceCols;},get homeTier(){return homeTier;},W,K,give,spawn,addPlot,addPiece,recompute,tick,newDay,sysClick,sysKey,saveNow,loadSave,serialize,tryRecipe,harvest,chickens,goat,build,get looked(){return looked;},set looked(v){looked=v;},get aim(){return aimPt;},render:()=>post.render(),renderer,player,evening,applyTime,settings,begin,sit,lie,standUp,pickUp,putDown,useHeld,items,camera,restartEvening,update,get state(){return state;},set state(v){state=v;},U,AU};
