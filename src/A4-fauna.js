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
  function bake(gl,spec){gl.scene.updateMatrixWorld(true);const meshes=[];gl.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
    const out=new THREE.Group(),box=new THREE.Box3();
    const geos=meshes.map(m=>{const g=floatGeo(m.geometry).applyMatrix4(m.matrixWorld);g.rotateY(spec.turn||0);return{g,mat:toNode(m.material)};});
    for(const {g} of geos){g.computeBoundingBox();box.union(g.boundingBox);}
    if(spec.cut){const cy=box.min.y+(box.max.y-box.min.y)*spec.cut;for(const q of geos){const p=q.g.attributes.position,ix=q.g.index;if(!ix)continue;const keep=[];
      for(let i=0;i<ix.count;i+=3){const a=ix.getX(i),b=ix.getX(i+1),c=ix.getX(i+2);if(Math.max(p.getY(a),p.getY(b),p.getY(c))>cy)keep.push(a,b,c);}q.g.setIndex(keep);}box.min.y=cy;} // cut away the display base
    const size=box.getSize(new V3()),k=spec.len/Math.max(size.x,size.z),cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2;
    for(const q of geos){q.g.translate(-cx,-box.min.y,-cz);q.g.scale(k,k,k);q.g.computeBoundingSphere();const mat=q.mat;
      if(spec.tint){mat.color=new THREE.Color(...spec.tint);if(mat.emissiveMap){mat.emissiveMap=null;mat.emissive&&mat.emissive.setRGB(0,0,0);}}const mesh=new THREE.Mesh(q.g,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};out.add(mesh);}
    return{g:out,h:size.y*k};}
  // legs of a static quadruped or bird swing about the hip, diagonal pairs (or alternate, for birds) in step
  function legShader(group,hip,biped){const uW=TSL.uniform(0),uA=TSL.uniform(0);const {positionLocal,positionGeometry,sin,float,vec3,select,sign,clamp}=TSL;
    group.traverse(o=>{if(!o.isMesh)return;const m=o.material=toNode(o.material);const y=positionGeometry.y,z=positionGeometry.z,x=positionGeometry.x;
      const w=clamp(float(hip).sub(y).div(hip*.7),0,1),side=sign(x),front=sign(z),ph=biped?side.mul(1.5708):side.mul(front).mul(1.5708);
      const a=sin(uW.add(ph)).mul(uA).mul(w);m.positionNode=positionLocal.add(vec3(0,a.abs().mul(-.04*hip),a.mul(float(hip).sub(y).max(0))));});
    return{uW,uA};}
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
  // ── where they live ──
  const crowns=FLORA.crownPts(),ohiaCrowns=FLORA.crownPts('ohia'),trunks=FLORA.spots;
  function spot(zone){for(let t=0;t<400;t++){const x=(R4()-.5)*280,z=-178+R4()*316,h=heightAt(x,z);if(h<1.3||freshAt(x,z)!=null)continue;const fw=forestW(x,z),mt=mountainH(x,z),m=masks(x,z);
    if(zone==='forest'&&fw>.5)return{x,z,y:h};if(zone==='edge'&&fw<.4&&fw>.02&&m.d>20)return{x,z,y:h};if(zone==='mountain'&&mt>16&&h<55&&tnorm(x,z).y>.6)return{x,z,y:h};
    if(zone==='grass'&&fw<.2&&mt<10&&m.d>28&&Math.hypot(x-START.x,z-START.z)>25)return{x,z,y:h};}return null;}
  const pick=a=>a[Math.floor(R4()*a.length)];
  function home(sp){const z=sp.zone;
    if(['forest','edge','mountain','grass'].includes(z))return spot(z);
    if(z==='perch'||z==='branch'){const c=pick(crowns.filter(c=>c.kind==='ohia'||c.kind==='koa'||c.kind==='kukui'));return c&&{x:c.x+(R4()-.5)*2,z:c.z+(R4()-.5)*2,y:c.y-1.2};}
    if(z==='flit'||z==='flutter'){const c=pick(z==='flit'?ohiaCrowns:crowns);return c&&{x:c.x,z:c.z,y:z==='flit'?c.y:heightAt(c.x,c.z)+1.2};}
    if(z==='trunk'){const t=pick(trunks.filter(t=>t.kind!=='hapuu'));return t&&{x:t.x,z:t.z,y:t.h+.8+R4()*1.5,trunk:t};}
    if(z==='leaf'){const s=spot('forest');return s&&{...s,y:s.y+.35};}
    if(z==='soar'){return{x:PEAK.x+(R4()-.5)*80,z:PEAK.z+60+(R4()-.5)*80,y:0};}
    if(z==='bat'){const i=Math.floor(R4()*RIVER.P.length*.8)+10,p=RIVER.P[Math.min(RIVER.P.length-1,i)];return{x:p[0],z:p[1],y:heightAt(p[0],p[1])};}
    return null;}
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
  function makeOne(key,sp,h0){const a={key,sp,g:new THREE.Group(),home:{...h0},p:new V3(h0.x,h0.y,h0.z),yaw:R4()*6.28,t:R4()*100,state:'idle',stT:R4()*4,
      walk:0,speed:0,dead:false,gone:0,fleeT:0,mixer:null,acts:{},cur:null,legs:null,bones:null,phase:R4()*6.28};
    a.g.position.copy(a.p);scene.add(a.g);
    const px=new THREE.Mesh(geo.box,proxyMat);const sz=sp.len||(sp.skinned==='kao'?1:.45);px.scale.set(sz*.6,Math.max(.12,sz*.6),sz);px.position.y=sz*.3;a.g.add(px);
    a.g.userData.item={label:()=>a.dead?sp.n+', dead':sp.n,get verb(){return a.dead?'butcher it':sp.food&&selKind()==='spear'?'click to strike':'';},
      e(){if(!a.dead)return;give(sp.food[0],sp.food[1]);note('hunt');SFX.chop&&SFX.chop();a.dead=false;a.gone=nowS()+600;a.g.visible=false;},
      use(k){if(k!=='spear'||!sp.food||a.dead)return false;handAnim=1;const sneak=keys.ShiftLeft||keys.ShiftRight;
        if(Math.random()<(sneak?.75:.45)){a.dead=true;a.state='dead';a.dieT=0;a.dieSide=Math.random()<.5?1:-1;if(a.acts.die){const d=a.acts.die;d.setLoop(THREE.LoopOnce,1);d.clampWhenFinished=true;d.timeScale=.7;play(a,'die',.15);}SFX.thud&&SFX.thud(.6);note('hunt');}
        else{a.fleeT=4;a.state='run';toast('Missed. It bolts.',1.8);}return true;}};
    interact.push(a.g);list.push(a);
    if(sp.make){const r=sp.make==='gecko'?makeGecko():makeSpider();a.g.add(r.g);a.body=r.g;return a;}
    if(sp.skinned){const S=SKINNED[sp.skinned];load(S.url).then(gl=>{const box=new THREE.Box3().setFromObject(gl.scene),k=S.height/box.getSize(new V3()).y;
      const m=cloneSkinned(gl.scene);m.rotation.y=S.turn;m.scale.setScalar(k);m.position.y=-box.min.y*k;m.traverse(x=>{if(x.isMesh){x.castShadow=true;x.frustumCulled=false;x.raycast=()=>{};}});a.g.add(m);a.body=m;
      if(sp.skinned==='moa')m.traverse(x=>{if(x.isMesh&&x.material){x.material=x.material.clone();x.material.color=new THREE.Color(.75,.62,.5);}}); // wilder, darker colouring than the farm birds
      const mixer=new THREE.AnimationMixer(m);if(gl.animations[0]){const act=mixer.clipAction(gl.animations[0]);act.play();}a.mixer=mixer;
      const legs=[];m.traverse(x=>{if(x.isBone&&S.legs.test(x.name))legs.push(x);});m.updateMatrixWorld(true);a.g.updateMatrixWorld(true);
      const lp=legs.map(b=>({b,p:a.g.worldToLocal(b.getWorldPosition(new V3()))})),mid=lp.reduce((s,l)=>s+l.p.z,0)/Math.max(1,lp.length);
      a.bones={S,legs:lp.map(({b,p})=>({b,ph:(lp.length<3?p.x>0:(p.z>mid)!==(p.x>0))?0:Math.PI}))};}).catch(e=>console.warn('Animal',key,e));return a;}
    load('assets/models/fauna/'+sp.file+'.glb').then(gl=>{
      if(sp.rig){const box=new THREE.Box3().setFromObject(gl.scene),s=box.getSize(new V3()),k=sp.len/Math.max(s.x,s.z);const m=cloneSkinned(gl.scene);
        m.rotation.y=sp.turn||0;m.scale.setScalar(k);m.position.y=-box.min.y*k;m.traverse(x=>{if(x.isMesh){x.castShadow=true;x.frustumCulled=false;x.raycast=()=>{};if(x.material&&x.material.emissiveMap){x.material=x.material.clone();x.material.emissiveMap=null;x.material.emissive&&x.material.emissive.setRGB(0,0,0);} // no glowing eyes
          if(sp.tint&&x.material){x.material=x.material.clone();x.material.color=new THREE.Color(...sp.tint);}}});
        if(sp.recolour)recolour(m,sp.recolour);a.g.add(m);a.body=m;const mixer=new THREE.AnimationMixer(m);a.mixer=mixer;
        for(const [role,name] of Object.entries(sp.anims||{})){const clip=gl.animations.find(c=>c.name.includes(name));if(clip)a.acts[role]=mixer.clipAction(clip);}
        const first=a.acts.idle||a.acts.fly;if(first){first.play();a.cur=first;mixer.update(R4()*3);}
      }else{let spec=sp;if(sp.turn==='auto'){ // birds: face the head, the highest point
          let hi=null,hy=-1e9,c=new V3(),n=0;gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,v=new V3();for(let i=0;i<p.count;i+=7){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);c.add(v);n++;if(v.y>hy){hy=v.y;hi=v.clone();}}});
          c.multiplyScalar(1/n);spec={...sp,turn:-Math.atan2(hi.x-c.x,hi.z-c.z)};}
        const r=bake(gl,spec);if(sp.recolour)recolour(r.g,sp.recolour);a.g.add(r.g);a.body=r.g;if(sp.hip)a.legs=legShader(r.g,sp.hip*r.h,sp.biped);}
    }).catch(e=>console.warn('Animal',key,e));
    return a;}
  for(const key in SPEC){const sp=SPEC[key];for(let i=0;i<sp.count;i++){const h=home(sp);if(h)makeOne(key,sp,h);}}

  // ── behaviour ──
  const play=(a,role,fade=.3)=>{const act=a.acts[role];if(!act||a.cur===act)return;act.reset().play();if(a.cur)a.cur.crossFadeTo(act,fade,false);a.cur=act;};
  const ground=(a,dt,pd,sneak)=>{const sp=a.sp,fr=sneak?sp.sneak:sp.flee;
    if(a.fleeT>0||pd<fr||a.state==='alert'&&a.alertT<=0&&pd<fr*1.6){if(a.fleeT<=0)a.fleeT=3+Math.random()*2;a.fleeT-=dt;a.state='run';const ang=Math.atan2(a.p.x-player.x,a.p.z-player.z);a.tx=a.p.x+Math.sin(ang)*8;a.tz=a.p.z+Math.cos(ang)*8;}
    else if(pd<fr*1.6&&(a.state!=='alert'||a.alertT>0)){if(a.state!=='alert'){a.state='alert';a.alertT=.8+Math.random()*1.2;}a.alertT-=dt;    // it has noticed you: head up, still, watching
      let t=Math.atan2(player.x-a.p.x,player.z-a.p.z)-a.yaw;t=Math.atan2(Math.sin(t),Math.cos(t));a.yaw+=t*Math.min(1,dt*3);}
    else{if(a.state==='alert'){a.state='idle';a.stT=1+Math.random()*2;}a.stT-=dt;if(a.stT<=0){const r=Math.random();if(r<.45){a.state='walk';const an=Math.random()*6.28,d=3+Math.random()*9;a.tx=a.home.x+Math.sin(an)*d;a.tz=a.home.z+Math.cos(an)*d;a.stT=4+Math.random()*6;}
      else{a.state=r<.8?'graze':'idle';a.stT=3+Math.random()*6;}}}
    const moving=a.state==='walk'||a.state==='run',want=moving?(a.state==='run'?sp.speed[1]:sp.speed[0]):0;
    const spd=a.vel=lerp(a.vel||0,want,Math.min(1,dt*(want>(a.vel||0)?(a.state==='run'?3.5:2):5)));                  // animals have weight: they speed up and pull up
    if(moving||spd>.05){const dx=a.tx-a.p.x,dz=a.tz-a.p.z,d=Math.hypot(dx,dz);if(d<.3){if(a.state==='walk'){a.state='idle';a.stT=2;}}
      else{const nx=a.p.x+dx/d*spd*dt,nz=a.p.z+dz/d*spd*dt,nh=heightAt(nx,nz);if(nh<.6||freshAt(nx,nz)!=null||tnorm(nx,nz).y<.55){a.tx=a.p.x;a.tz=a.p.z;a.state='idle';}
        else{a.p.x=nx;a.p.z=nz;let t=Math.atan2(dx,dz)-a.yaw;t=Math.atan2(Math.sin(t),Math.cos(t));a.yaw+=t*Math.min(1,dt*6);a.walk+=spd*dt;}}}
    a.p.y=heightAt(a.p.x,a.p.z);a.speed=spd;
    if(a.mixer&&a.acts.walk){const role=a.state==='run'?(a.acts.trot&&spd<sp.speed[1]*.55?'trot':'run'):a.state==='walk'?'walk':a.state==='graze'?'graze':a.state==='alert'&&a.acts.alert?'alert':'idle';play(a,role);
      if(role==='walk'||role==='run'||role==='trot')a.cur.timeScale=clamp(spd/(role==='walk'?sp.speed[0]:role==='trot'?sp.speed[1]*.45:sp.speed[1]),.45,1.6);else a.cur.timeScale=1;}}; // feet keep pace with the ground
  function tick(dt,t){const sneak=keys.ShiftLeft||keys.ShiftRight,nt=night();
    for(const a of list){const sp=a.sp;
      if(a.gone){if(nowS()<a.gone)continue;a.gone=0;const h=home(sp);if(h){a.home=h;a.p.set(h.x,h.y,h.z);}a.g.visible=true;a.g.rotation.set(0,a.yaw,0);a.state='idle';if(a.acts.die){a.acts.die.stop();a.cur=null;play(a,'idle',0);}}
      const dc=Math.hypot(a.p.x-camera.position.x,a.p.z-camera.position.z),far=dc>(sp.zone==='soar'?400:sp.zone==='leaf'||sp.make?30:150);a.g.visible=!far&&!a.gone;if(far&&!a.dead)continue;
      if(a.dead){a.dieT=(a.dieT||0)+dt;a.g.position.copy(a.p);
        const k=Math.min(1,a.dieT/.6),e=k*k*(3-2*k);a.g.rotation.set(0,a.yaw,a.dieSide*Math.PI/2*e*.92);a.g.position.y+=(sp.len||.45)*.22*e+.03; // legs buckle and it rolls onto its side
        if(a.mixer)a.mixer.update(a.acts.die?dt:dt*(1-k));continue;} // a rigged animal flinches as it goes down
      a.t+=dt;const pd=Math.hypot(a.p.x-player.x,a.p.z-player.z);if(pd<(sp.zone==='soar'?60:12)&&a.g.visible)W.seen[sp.n]=1;   // counts as seen in the book
      if(['forest','edge','mountain','grass'].includes(sp.zone))ground(a,dt,pd,sneak);
      else if(sp.zone==='soar'){const R=45+20*Math.sin(a.t*.01+a.phase),an=a.t*.045+a.phase;a.p.set(a.home.x+Math.sin(an)*R,Math.max(heightAt(a.home.x,a.home.z),40)+35+Math.sin(a.t*.07)*6,a.home.z+Math.cos(an)*R);a.yaw=an+Math.PI/2;
        if(a.acts.fly)a.acts.fly.timeScale=Math.sin(a.t*.3+a.phase)>.6?1:0.05;}                                   // mostly soaring, now and then a few wingbeats
      else if(sp.zone==='bat'){a.g.visible=a.g.visible&&nt>.3;const an=a.t*1.3+a.phase,r=4+2*Math.sin(a.t*.7);a.p.set(a.home.x+Math.sin(an)*r+Math.sin(a.t*3.1)*.6,a.home.y+3+Math.sin(a.t*2.3)*1.2,a.home.z+Math.cos(an*1.3)*r);a.yaw=an+Math.PI/2;}
      else if(sp.zone==='flit'||sp.zone==='flutter'){a.g.visible=a.g.visible&&nt<.6;a.stT-=dt;if(a.stT<=0||!a.tgt){const c=sp.zone==='flit'?pick(ohiaCrowns.filter(c=>Math.hypot(c.x-a.home.x,c.z-a.home.z)<30)||ohiaCrowns):null;
          a.tgt=c?new V3(c.x+(Math.random()-.5)*3,c.y+(Math.random()-.5)*2,c.z+(Math.random()-.5)*3):new V3(a.home.x+(Math.random()-.5)*8,heightAt(a.home.x,a.home.z)+.6+Math.random()*1.8,a.home.z+(Math.random()-.5)*8);a.stT=2+Math.random()*4;}
        const d=a.tgt.clone().sub(a.p),l=d.length();if(l>.1){a.p.addScaledVector(d,Math.min(1,dt*(sp.zone==='flit'?1.5:.8)));a.yaw=Math.atan2(d.x,d.z);}if(sp.zone==='flutter')a.p.y+=Math.sin(a.t*6)*.01;}
      else if(sp.zone==='perch'){if(pd<5&&!a.fleeT){a.fleeT=1;const c=pick(crowns);a.home={x:c.x,z:c.z,y:c.y-1.2};}a.fleeT=Math.max(0,a.fleeT-dt*.1);a.p.lerp(new V3(a.home.x,a.home.y,a.home.z),Math.min(1,dt*.6));a.yaw+=Math.sin(a.t*.4)*.004;}
      else if(sp.zone==='branch'){a.p.set(a.home.x,a.home.y,a.home.z);a.yaw=a.phase;}
      else if(sp.zone==='trunk'){const tr=a.home.trunk;if(!tr){continue;}a.stT-=dt;if(a.stT<=0){a.tgtY=tr.h+.5+Math.random()*2.2;a.stT=1+Math.random()*5;}if(pd<2)a.tgtY=tr.h+3;
        const ang=a.phase,r=.22*(tr.scale||1);a.p.set(tr.x+Math.sin(ang)*r,lerp(a.p.y,a.tgtY||a.p.y,Math.min(1,dt*1.5)),tr.z+Math.cos(ang)*r);a.g.position.copy(a.p);a.g.rotation.set(-Math.PI/2,ang,0,'YXZ');continue;}
      else if(sp.zone==='leaf'){}
      a.g.position.copy(a.p);a.g.rotation.set(0,a.yaw,0);
      if(['forest','edge','mountain','grass'].includes(sp.zone)){const nn=tnorm(a.p.x,a.p.z),ty=new V3(nn.x,1,nn.z).normalize();a.tilt=(a.tilt||new V3(0,1,0)).lerp(ty,Math.min(1,dt*4));
        a.g.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new V3(0,1,0),a.tilt));}                // standing on the slope, not plumb on it
      if(a.mixer){a.mixer.update(dt);}
      if(a.legs){a.legs.uW.value=a.walk*(sp.biped?9:6);a.legs.uA.value=lerp(a.legs.uA.value,a.speed>.05?Math.min(.7,.25+a.speed*.12):0,Math.min(1,dt*6));}
      if(a.bones&&a.speed>.05){a.g.updateMatrixWorld(true);const S=a.bones.S,ax=new V3(1,0,0).applyQuaternion(a.g.getWorldQuaternion(new THREE.Quaternion())),q2=new THREE.Quaternion(),q3=new THREE.Quaternion(),ax2=new V3();
        const ph=a.walk*S.stride;for(const L of a.bones.legs){L.b.parent.getWorldQuaternion(q2).invert();ax2.copy(ax).applyQuaternion(q2);L.b.quaternion.premultiply(q3.setFromAxisAngle(ax2,Math.sin(ph+L.ph)*S.amp*(a.state==='run'?1.3:1)));}}
    }
  }
  return{list,tick,get counts(){const n={};for(const a of list)n[a.key]=(n[a.key]||0)+1;return n;}};
})();

scene.fog=new THREE.FogExp2(0x0b4a58,0); // only thickens under water
window.__tF1=performance.now();window.STAMv=()=>STAM.v;window.__forceWet=()=>{U.uWet.value=1;U.uSwell.value=1;raining=1;};window.WETv=()=>U.uWet.value;window.FLORA_INFO=()=>({count:FLORA.count,kinds:FLORA.kinds});window.__hm={get STREAM(){return STREAM;},get GRASS(){return GRASS;},get cols(){return colliders.length;},get interactLen(){return interact.length;},get colliders(){return colliders;},get REEL(){return REEL;},get hero(){return hero;},heroPlay,get keys(){return keys;},get FAUNA(){return FAUNA;},get RECIPES(){return RECIPES;},get FORMS(){return FORMS;},get CROPS(){return CROPS;},dishOf,eat,zoneAt,have,takeFrom,get GUIDE(){return GUIDE;},interactE,get looked(){return looked;},get FLORA(){return FLORA;},get SEA(){return SEA;},get DIVE(){return DIVE;},get scene(){return scene;},player,groundAt,surfaceAt,pickUp,cup,lantern,coco,chickens,goat,PHYS,useHeld,sysDrop,settle,supportedAt,get pieceCols(){return pieceCols;},get homeTier(){return homeTier;},W,K,give,spawn,addPlot,addPiece,recompute,tick,newDay,sysClick,sysKey,saveNow,loadSave,serialize,tryRecipe,harvest,chickens,goat,build,get looked(){return looked;},set looked(v){looked=v;},get aim(){return aimPt;},render:()=>composer.render(),renderer,player,evening,applyTime,settings,begin,sit,lie,standUp,pickUp,putDown,useHeld,items,camera,restartEvening,update,get state(){return state;},set state(v){state=v;},U,AU};
