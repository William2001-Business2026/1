/* ───────────────────────── lanai and living items ───────────────────────── */
const woodMat=new THREE.MeshStandardMaterial({map:woodTex,normalMap:woodNorm,normalScale:new THREE.Vector2(1.2,1.2),roughness:.8});
const woodDark=new THREE.MeshStandardMaterial({map:woodTex,normalMap:woodNorm,color:srgb(.62,.55,.48),roughness:.85});
const proxyMat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
function box(parent,w,h,d,mat,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function cyl(parent,rt_,rb,h,mat,x,y,z,seg=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt_,rb,h,seg),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function proxy(parent,w,h,d,y=h/2){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),proxyMat);m.position.y=y;parent.add(m);return m;}
/* ───────── scanned props (Poly Haven, CC0; assets/models/props) ─────────
   dressProp(group, model) fits a scan to the size and footprint of the shape-built object it replaces, then hides the
   old shape. The old meshes (and any invisible proxies) stay as hit areas, so picking up, placing and stacking are unchanged.
   Options: fit 'x' | 'y' (match width or height instead of the largest side), rot (radians), tint (Color), keep (meshes to leave visible). */
const propSrc={},propTint={};
const propModel=name=>propSrc[name]||(propSrc[name]=gltfLoader.loadAsync('assets/models/props/'+name+'.glb'));
function localBox(g,skip){g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert(),b=new THREE.Box3(),t=new THREE.Box3(),m=new THREE.Matrix4();
  g.traverse(o=>{if(o.isMesh&&o.material!==proxyMat&&!skip.has(o)){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();b.union(t.copy(o.geometry.boundingBox).applyMatrix4(m.multiplyMatrices(inv,o.matrixWorld)));}});return b;}
function dressProp(g,name,o={}){
  propModel(name).then(gl=>{if(g.userData.dressed)return;g.userData.dressed=true;
    const keep=new Set(o.keep||[]),pb=localBox(g,keep);if(pb.isEmpty())return;
    const ms=new THREE.Box3().setFromObject(gl.scene).getSize(new THREE.Vector3()),ps=pb.getSize(new THREE.Vector3());
    let rot=o.rot;if(rot===undefined)rot=((ps.x>ps.z*1.3&&ms.z>ms.x*1.3)||(ps.z>ps.x*1.3&&ms.x>ms.z*1.3))?Math.PI/2:0; // line up the long sides
    const sw=Math.abs(Math.sin(rot))>.5,mx=sw?ms.z:ms.x,mz=sw?ms.x:ms.z;
    const k=(o.fit==='x'?ps.x/mx:o.fit==='y'?ps.y/ms.y:Math.max(ps.x,ps.y,ps.z)/Math.max(mx,ms.y,mz))*(o.scale||1);
    const m=gl.scene.clone(true);m.rotation.y=rot;m.scale.setScalar(k);g.add(m);
    const hb=localBox(g,new Set([...g.children].flatMap(c=>{const a=[];if(c!==m)c.traverse(x=>a.push(x));return a;})));
    const pc=pb.getCenter(new THREE.Vector3()),hc=hb.getCenter(new THREE.Vector3());m.position.set(pc.x-hc.x,pb.min.y-hb.min.y,pc.z-hc.z); // stand on the old base
    if(o.tint&&!propTint[name]){propTint[name]=new Map();}
    m.traverse(x=>{if(!x.isMesh)return;x.castShadow=o.shadow!==false;x.receiveShadow=true;x.raycast=()=>{};
      if(o.tint){let t=propTint[name].get(x.material);if(!t){t=x.material.clone();t.color.multiply(o.tint);propTint[name].set(x.material,t);}x.material=t;}});
    g.traverse(x=>{if(x.isMesh&&x.material!==proxyMat&&!keep.has(x)&&!m.getObjectById(x.id))x.visible=false;});
  }).catch(e=>console.warn('Prop model '+name+' did not load:',e));
  return g;
}

const items=[]; const interact=[];
function addItem(o){o.group.userData.item=o;items.push(o);interact.push(o.group);scene.add(o.group);return o;}

const lanai=new THREE.Group(); lanai.position.set(LANAI.x,DECK_Y,LANAI.z); scene.add(lanai);
{
  const n=26,pw=LANAI.d/n,pg=new THREE.BoxGeometry(LANAI.w,.035,pw-.012),d=new THREE.Object3D(),c=new THREE.Color();
  const deckMat=new THREE.MeshStandardNodeMaterial({roughness:1});
  {const {texture,vec2,vec3,vec4,float,floor,fract,mod,sqrt,max,dot,normalize,cross,positionLocal,normalWorldGeometry,cameraViewMatrix}=TSL;const t=pbrTex('planks');
   const z=positionLocal.z.add(LANAI.d/2).div(pw),idx=floor(z); // board number, and position across the board
   const q=vec2(fract(z).mul(.84).add(.08).add(mod(idx,6)).div(6),positionLocal.x.div(1.25).add(idx.mul(.37))); // texture planks run along v
   const nr=texture(t.n,q);deckMat.colorNode=texture(t.a,q).rgb.mul(2.6);deckMat.roughnessNode=nr.b;
   deckMat.normalNode=(()=>{const N=normalWorldGeometry,T=normalize(vec3(0,0,1).sub(N.mul(N.z))),B=cross(N,T),tt=nr.rg.mul(2).sub(1);
     return normalize(cameraViewMatrix.mul(vec4(normalize(T.mul(tt.x).add(B.mul(tt.y)).add(N.mul(sqrt(max(float(1).sub(dot(tt,tt)),0))))),0)).xyz);})();}
  const planks=new THREE.InstancedMesh(pg,deckMat,n);
  for(let i=0;i<n;i++){d.position.set((R()-.5)*.02,-.0175,-LANAI.d/2+pw*(i+.5));d.updateMatrix();planks.setMatrixAt(i,d.matrix);const v=.82+R()*.3;planks.setColorAt(i,c.setRGB(v,v*.98,v*.95));}
  planks.castShadow=planks.receiveShadow=true;lanai.add(planks);
  for(const x of[-2.3,-.8,.8,2.3])box(lanai,.09,.3,LANAI.d-.1,woodDark,x,-.19,0);
  box(lanai,LANAI.w,.3,.05,woodDark,0,-.19,LANAI.d/2-.03);box(lanai,LANAI.w,.3,.05,woodDark,0,-.19,-LANAI.d/2+.03);
  const hx=LANAI.w/2-.07,hz=LANAI.d/2-.07,PH=2.35;
  for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){box(lanai,.11,PH+.4,.11,woodDark,sx*hx,PH/2-.2,sz*hz);colliders.push({x:LANAI.x+sx*hx,z:LANAI.z+sz*hz,r:.18});}
  box(lanai,LANAI.w+.3,.12,.07,woodDark,0,PH,-hz);box(lanai,LANAI.w+.3,.12,.07,woodDark,0,PH,hz);
  for(let i=0;i<7;i++)box(lanai,.05,.1,LANAI.d+.5,woodDark,-hx+i*(2*hx/6),PH+.11,0);
  // rails: north and east
  box(lanai,LANAI.w-.2,.05,.1,woodMat,0,.92,-hz);box(lanai,.1,.05,LANAI.d-.2,woodMat,hx,.92,0);
  for(let i=1;i<12;i++)box(lanai,.035,.9,.035,woodDark,-hx+i*(2*hx/12),.45,-hz);
  for(let i=1;i<10;i++)box(lanai,.035,.9,.035,woodDark,hx,.45,-hz+i*(2*hz/10));
  for(let i=0;i<=10;i++){colliders.push({x:LANAI.x-hx+i*(2*hx/10),z:LANAI.z-hz,r:.16});colliders.push({x:LANAI.x+hx,z:LANAI.z-hz+i*(2*hz/10),r:.16});}
  // lantern arm on the south-west post
  box(lanai,.05,.05,.55,woodDark,-hx,2.05,hz-.3);
}
const HOOK=new THREE.Vector3(LANAI.x-(LANAI.w/2-.07),DECK_Y+2.02,LANAI.z+LANAI.d/2-.07-.5);
const sunYaw=Math.atan2(-SUN_AZ.x,-SUN_AZ.y);  // camera yaw that faces the sunset

// Adirondack chair
const CHAIR=new THREE.Vector3(LANAI.x-1.7,DECK_Y,LANAI.z+.2);
{
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({map:woodTex,color:srgb(.86,.86,.8),roughness:.7});
  for(let i=0;i<5;i++)box(g,.56,.022,.092,m,0,.37-i*.028,.26-i*.105,.26);
  for(let i=0;i<6;i++){const x=-.225+i*.09,hgt=.86-Math.abs(i-2.5)*.05;box(g,.08,hgt,.02,m,x,.24+hgt/2*.9,-.27-hgt/2*.42,-.42);}
  box(g,.56,.05,.025,m,0,.62,-.47,-.42);
  for(const s of[-1,1]){box(g,.13,.025,.7,m,s*.34,.56,.02);box(g,.07,.56,.07,m,s*.31,.28,.3);box(g,.035,.09,.95,m,s*.28,.2,-.1,.33);box(g,.06,.4,.06,m,s*.31,.38,-.3);}
  proxy(g,.8,1.1,.9);
  g.position.copy(CHAIR); g.rotation.y=Math.atan2(SUN_AZ.x,SUN_AZ.y);
  addItem({name:'Rocking chair',verb:'sit',kind:'chair',group:g});dressProp(g,'Rockingchair_01',{fit:'y'});
  colliders.push({x:CHAIR.x,z:CHAIR.z,r:.5});
}
// side table
const TABLE=new THREE.Vector3(LANAI.x-1.45,DECK_Y,LANAI.z-.98), TABLE_TOP=.52;
const slots=[[-.16,.13],[.06,.22]].map(([x,z])=>({pos:new THREE.Vector3(TABLE.x+x,DECK_Y+TABLE_TOP+.012,TABLE.z+z),item:null}));
{
  const g=new THREE.Group();cyl(g,.36,.36,.025,woodMat,0,TABLE_TOP,0,28);
  for(let i=0;i<3;i++){const a=i*2.094+.4;const l=cyl(g,.022,.018,.53,woodDark,Math.cos(a)*.22,.26,Math.sin(a)*.22,8);l.rotation.set(Math.sin(a)*.14,0,-Math.cos(a)*.14);}
  cyl(g,.2,.2,.02,woodDark,0,.2,0,20);
  g.position.copy(TABLE); g.userData.table=true; scene.add(g); colliders.push({x:TABLE.x,z:TABLE.z,r:.42});
}
// transistor radio
const radioG=new THREE.Group();
{
  const body=box(radioG,.24,.13,.07,new THREE.MeshStandardMaterial({color:srgb(.18,.42,.44),roughness:.45}),0,.065,0);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(.235,.125),new THREE.MeshStandardMaterial({map:radioTex,roughness:.5}));f.position.set(0,.065,.0355);radioG.add(f);
  const a=cyl(radioG,.003,.003,.3,new THREE.MeshStandardMaterial({color:0xcccccc,metalness:1,roughness:.25}),.09,.26,-.02,6);a.rotation.z=-.25;
  cyl(radioG,.012,.012,.2,new THREE.MeshStandardMaterial({color:0x333333,roughness:.5}),0,.145,0,8).rotation.z=Math.PI/2;
  radioG.position.set(TABLE.x-.1,DECK_Y+TABLE_TOP+.013,TABLE.z-.2); radioG.rotation.y=sunYaw+Math.PI+2.2;
  proxy(radioG,.28,.2,.12);
}
const radio=addItem({name:'Transistor radio',verb:'tune',kind:'radio',group:radioG,mode:0});
// enamel cup
const cupG=new THREE.Group(); let coffee, steam=[];
{
  const pts=[[0,0],[.034,0],[.04,.008],[.043,.085],[.046,.09],[.0445,.092],[.04,.086],[.037,.012],[0,.01]].map(p=>new THREE.Vector2(p[0],p[1]));
  const m=new THREE.Mesh(new THREE.LatheGeometry(pts,28),new THREE.MeshStandardMaterial({color:srgb(.93,.93,.9),roughness:.22,side:THREE.DoubleSide}));m.castShadow=true;cupG.add(m);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.0452,.0022,8,28),new THREE.MeshStandardMaterial({color:srgb(.08,.16,.4),roughness:.3}));rim.rotation.x=Math.PI/2;rim.position.y=.091;cupG.add(rim);
  const hd=new THREE.Mesh(new THREE.TorusGeometry(.024,.0045,8,16,Math.PI),new THREE.MeshStandardMaterial({color:srgb(.93,.93,.9),roughness:.22}));hd.rotation.z=-Math.PI/2;hd.position.set(.043,.048,0);cupG.add(hd);
  coffee=new THREE.Mesh(new THREE.CircleGeometry(.039,24),new THREE.MeshStandardMaterial({color:srgb(.13,.07,.035),roughness:.08}));coffee.rotation.x=-Math.PI/2;coffee.position.y=.078;cupG.add(coffee);
  for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,transparent:true,opacity:0,depthWrite:false}));s.userData.t=i/7;cupG.add(s);steam.push(s);}
  proxy(cupG,.14,.14,.14);
}
const cup=addItem({name:'Cup of coffee',verb:'pick up',kind:'cup',group:cupG,pickable:true,sips:3,rinsed:false,restY:0,
  hold:{p:[.27,-.25,-.48],r:[0,-1.2,0]},hint:'Click to sip'});
// ukulele
const ukeG=new THREE.Group();
{
  const koa=new THREE.MeshStandardMaterial({map:woodTex,color:srgb(.75,.42,.22),roughness:.38});
  const dark=new THREE.MeshStandardMaterial({color:srgb(.12,.08,.06),roughness:.5});
  const b1=cyl(ukeG,.105,.105,.062,koa,0,.105,0,28);b1.rotation.x=Math.PI/2;const b2=cyl(ukeG,.08,.08,.062,koa,0,.235,0,28);b2.rotation.x=Math.PI/2;
  const hole=new THREE.Mesh(new THREE.CircleGeometry(.03,20),dark);hole.position.set(0,.2,.0315);ukeG.add(hole);
  box(ukeG,.036,.27,.02,dark,0,.43,.022);box(ukeG,.05,.09,.016,koa,0,.6,.016);box(ukeG,.07,.012,.012,dark,0,.085,.036);
  const sm=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.4});
  for(let i=0;i<4;i++)box(ukeG,.0014,.5,.0014,sm,-.0105+i*.007,.335,.036);
  for(let i=0;i<4;i++)cyl(ukeG,.005,.005,.03,sm,(i<2?-1:1)*.032,.575+(i%2)*.035,.016,6).rotation.z=Math.PI/2;
  proxy(ukeG,.26,.68,.14,.33);
  ukeG.position.set(LANAI.x+LANAI.w/2-.28,DECK_Y+.005,LANAI.z-LANAI.d/2+.3); ukeG.rotation.set(-.2,-.75,0,'YXZ');
}
const uke=addItem({name:'Ukulele',verb:'pick up',kind:'uke',group:ukeG,pickable:true,restY:.035,restRot:[-Math.PI/2,0,0],
  hold:{p:[.3,-.4,-.62],r:[-.5,-.35,1.15]},hint:'1 2 3 4 to strum'});
// oil lantern
const lanternG=new THREE.Group(); let flame, lanternLight;
{
  const metal=new THREE.MeshStandardMaterial({color:srgb(.12,.25,.2),roughness:.45,metalness:.6});
  cyl(lanternG,.062,.072,.055,metal,0,.0275,0,20);cyl(lanternG,.03,.05,.02,metal,0,.065,0,16);
  const glass=new THREE.Mesh(new THREE.SphereGeometry(.058,20,14),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.16,roughness:.03,depthWrite:false}));
  glass.scale.set(1,1.35,1);glass.position.y=.145;lanternG.add(glass);
  cyl(lanternG,.02,.045,.035,metal,0,.235,0,16);cyl(lanternG,.012,.02,.03,metal,0,.265,0,12);
  for(const s of[-1,1])cyl(lanternG,.004,.004,.2,metal,s*.066,.16,0,6);
  const hdl=new THREE.Mesh(new THREE.TorusGeometry(.066,.0035,6,20,Math.PI),metal);hdl.position.y=.26;lanternG.add(hdl);
  flame=new THREE.Mesh(new THREE.SphereGeometry(.012,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(7,3.2,.8)}));flame.scale.set(1,2.2,1);flame.position.y=.125;lanternG.add(flame);
  lanternLight=new THREE.PointLight(new THREE.Color(1,.6,.27),0,22,2);lanternLight.position.y=.14;lanternLight.shadow.mapSize.set(512,512);lanternLight.shadow.bias=-.004;lanternLight.shadow.camera.near=.09;lanternG.add(lanternLight);
  proxy(lanternG,.18,.36,.18);lanternG.traverse(o=>{o.castShadow=false;});
  lanternG.position.set(HOOK.x,HOOK.y-.33,HOOK.z);
  dressProp(lanternG,'wooden_lantern_01',{fit:'y',keep:[flame],shadow:false}); // keeps the game's own flame and light inside
}
const lantern=addItem({name:'Oil lantern',verb:'take',kind:'lantern',group:lanternG,pickable:true,lit:true,hung:true,restY:0,
  hold:{p:[.34,-.42,-.55],r:[0,0,0]},hint:'Click to light or put out'});
// binoculars
const binoG=new THREE.Group();
{
  const m=new THREE.MeshStandardMaterial({color:srgb(.07,.07,.075),roughness:.55}),gl=new THREE.MeshStandardMaterial({color:srgb(.1,.16,.3),roughness:.05,metalness:.8});
  for(const s of[-1,1]){const c1=cyl(binoG,.03,.024,.075,m,s*.036,.034,.02,16);c1.rotation.x=Math.PI/2;const c2=cyl(binoG,.034,.03,.06,m,s*.036,.034,-.045,16);c2.rotation.x=Math.PI/2;
    const l=new THREE.Mesh(new THREE.CircleGeometry(.03,16),gl);l.position.set(s*.036,.034,-.0755);l.rotation.y=Math.PI;binoG.add(l);}
  box(binoG,.04,.016,.04,m,0,.04,0);proxy(binoG,.18,.12,.2);
  binoG.position.set(LANAI.x+.9,DECK_Y+.946,LANAI.z-LANAI.d/2+.07); binoG.rotation.y=.5;
  dressProp(binoG,'binoculars',{fit:'x'}); // sized by width: the scan's strap makes it longer
}
const bino=addItem({name:'Binoculars',verb:'pick up',kind:'bino',group:binoG,pickable:true,restY:0,hold:{p:[.24,-.27,-.46],r:[.2,.5,0]},hint:'Hold click to look'});
// coconut
const cocoG=new THREE.Group();
{
  const g=new THREE.SphereGeometry(.13,18,14),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setY(i,y*1.18+(y>0?.01:0));}
  g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:barkTex,color:srgb(.6,.45,.28),roughness:.85,bumpMap:grainTex,bumpScale:1}));m.castShadow=true;cocoG.add(m);
  proxy(cocoG,.34,.34,.34,0);
  {const[cx,cz]=BEACH(3.2,41);cocoG.position.set(cx,heightAt(cx,cz)+.12,cz);}
}
const coco=addItem({name:'Coconut',verb:'pick up',kind:'coco',group:cocoG,pickable:true,restY:.12,hold:{p:[.3,-.3,-.52],r:[.3,0,.2]},hint:'Click to throw',vel:new THREE.Vector3(),fly:false,wet:false});
// hammock between the two eastern palms
const hamG=new THREE.Group(), hamSwing=new THREE.Group();
{
  const A=palms[1],B=palms[2],gy=Math.max(A.y,B.y),mid=new THREE.Vector3((A.x+B.x)/2,gy+1.62,(A.z+B.z)/2),half=Math.hypot(B.x-A.x,B.z-A.z)/2-.2;
  hamG.position.copy(mid); hamG.rotation.y=-Math.atan2(B.z-A.z,B.x-A.x); hamG.add(hamSwing);
  const NU=24,NV=10,P=[],UVs=[],I=[],HL=1.15;
  const f=(u,v)=>new THREE.Vector3(u*HL,-.5-.44*(1-u*u)+.17*v*v*(1-.5*u*u),v*.52*(.5+.5*(1-u*u*.8)));
  for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const u=i/NU*2-1,v=j/NV*2-1,q=f(u,v);P.push(q.x,q.y,q.z);UVs.push(i/NU*3,j/NV*2);}
  for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i;I.push(a,a+NU+1,a+1,a+1,a+NU+1,a+NU+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UVs,2));g.setIndex(I);g.computeVertexNormals();
  const cloth=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:clothTex,side:THREE.DoubleSide,roughness:.9}));cloth.castShadow=cloth.receiveShadow=true;hamSwing.add(cloth);
  const lp=[];for(const s of[-1,1])for(let j=0;j<=NV;j+=2){const q=f(s,j/NV*2-1);lp.push(q.x,q.y,q.z,s*half,0,0);}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
  hamSwing.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:srgb(.75,.68,.55)})));
  const px=proxy(hamSwing,2.3,.5,1,-.75);
  scene.add(hamG);
}
const hammock={name:'Hammock',verb:'lie down',kind:'hammock',group:hamG}; hamG.userData.item=hammock; interact.push(hamG);

