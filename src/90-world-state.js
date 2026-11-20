/* ═══════════════════════ the living island: things, tools, crops, creatures, building ═══════════════════════ */
const SAVE_KEY='halemoku-island-1';
const W={seen:{},day:0,inv:[],sel:-1,basket:false,items:[],plots:[],pieces:[],fires:{},notes:{},flags:{},
  chick:{fed:.45,egg:0,man:0,bold:false},goat:{fed:.4,trust:0,milk:0},buff:{until:0,speed:1,carry:0},
  clock:{phase:'golden',dayT:1,fast:false},stamp:Date.now(),rainIn:500,rainLeft:0,nodes:{wash:0,stone:0,frond:0,nut:0,flower:0}};
const SEEP=enlarge(-22,6),GROVE=enlarge(-8,-22),OLDPLOT=enlarge(17,13),CHICKHOME=enlarge(21,9),CHILIPLOT=enlarge(12,2);
const season=()=>Math.floor(W.day/4)%2;            // 0 dry, 1 wet
const nowS=()=>Date.now()/1000;
const mats={};
const mt=(r,g,b,ro=.8,o)=>{const k=[r,g,b,ro,o?JSON.stringify(o):''].join();return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:srgb(r,g,b),roughness:ro,...(o||{})}));};
const lm=(r,g,b)=>{const k='L'+[r,g,b].join();return mats[k]||(mats[k]=leafy(new THREE.MeshStandardNodeMaterial({color:srgb(r,g,b),roughness:.55,side:THREE.DoubleSide})));};
const geo={sph:new THREE.SphereGeometry(1,14,10),cyl:new THREE.CylinderGeometry(1,1,1,12),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(1,1,10),
  half:new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2),tor:new THREE.TorusGeometry(1,.16,6,16),disc:new THREE.CircleGeometry(1,18)};
{const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.55,.2,.6,.75,0,1);sh.bezierCurveTo(-.6,.75,-.55,.2,0,0);geo.leaf=new THREE.ShapeGeometry(sh,5).rotateX(Math.PI/2);
 const hs=new THREE.Shape();hs.moveTo(0,.12);hs.bezierCurveTo(.5,-.25,.75,.45,0,1);hs.bezierCurveTo(-.75,.45,-.5,-.25,0,.12);geo.heart=new THREE.ShapeGeometry(hs,5).rotateX(Math.PI/2);}
function part(g,gn,m,sx,sy,sz,x=0,y=0,z=0,rx=0,ry=0,rz=0){const o=new THREE.Mesh(geo[gn],m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
const C_WOOD=[.47,.36,.25],C_DRIFT=[.6,.57,.52],C_TAN=[.74,.63,.42],C_STONE=[.11,.105,.105],C_BAM=[.5,.6,.26];
const wood=(c=C_WOOD)=>{const k='W'+c.join();return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({map:woodTex,normalMap:woodNorm,color:srgb(...c),roughness:.8}));};
const stoneM=()=>mats.stone||(mats.stone=new THREE.MeshStandardMaterial({color:srgb(...C_STONE),roughness:.6,bumpMap:grainTex,bumpScale:2}));
const thatchM=()=>mats.thatch||(mats.thatch=new THREE.MeshStandardMaterial({map:grassTex,color:srgb(.85,.75,.5),alphaTest:.3,side:THREE.DoubleSide,roughness:.9}));
function bowlWith(col){return()=>{const g=new THREE.Group();part(g,'half',mt(.3,.2,.12,.7,{side:THREE.DoubleSide}),.09,.07,.09,0,.07,0,Math.PI);if(col)part(g,'disc',mt(...col,.15),.08,.08,.08,0,.06,0,-Math.PI/2);return g;};}
function stickM(len,r,c){return()=>{const g=new THREE.Group();part(g,'cyl',wood(c),r,len,r,0,r,0,0,0,Math.PI/2);return g;};}
function tintClone(g,f){g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(f);}});return g;}

/* every kind of thing that can be carried */
const K={
  stone:{n:'Lava stone',mk(){const g=new THREE.Group();part(g,'sph',stoneM(),.1,.075,.085,0,.07,0,.3,.5,0);return g;}},
  flake:{n:'Stone flake',mk(){const g=new THREE.Group();part(g,'box',mt(.07,.07,.075,.3),.1,.014,.055,0,.01,0,0,.3,.12);return g;}},
  stick:{n:'Stick',hs:.6,mk:stickM(.95,.02,C_WOOD)},
  log:{n:'Driftwood log',cap:2,hs:0.3,mk(){const g=new THREE.Group();part(g,'cyl',wood(C_DRIFT),.1,1.3,.1,0,.1,0,0,0,Math.PI/2);part(g,'cyl',wood(C_DRIFT),.04,.3,.04,.2,.2,.05,.5,0,.4);return g;}},
  plank:{n:'Plank',hs:0.34,mk(){const g=new THREE.Group();part(g,'box',wood(C_DRIFT),1,.035,.18,0,.02,0);return g;}},
  fibre:{n:'Coconut fibre',mk(){const g=new THREE.Group();for(let i=0;i<7;i++)part(g,'cyl',mt(.62,.48,.3,.95),.006,.24,.006,(i-3)*.012,.02+i%2*.01,0,Math.PI/2+i*.07,0,i*.11-.3);return g;}},
  cord:{n:'Cord',mk(){const g=new THREE.Group();part(g,'tor',mt(.66,.53,.34,.9),.07,.07,.09,0,.02,0,Math.PI/2);part(g,'tor',mt(.66,.53,.34,.9),.055,.055,.09,0,.04,0,Math.PI/2);return g;}},
  frond:{n:'Palm frond',hs:0.3,mk(){const g=new THREE.Group();part(g,'cyl',mt(.5,.47,.22),.012,1.5,.012,0,.02,0,Math.PI/2);for(let i=0;i<12;i++)for(const s of[-1,1])part(g,'leaf',lm(.36,.44,.16),.07,1,.34,0,.03,-.65+i*.11,.12,s*1.15,0);return g;}},
  bamboo:{n:'Bamboo',hs:0.28,mk(){const g=new THREE.Group();part(g,'cyl',mt(...C_BAM,.4),.035,2,.035,0,.035,0,0,0,Math.PI/2);for(const x of[-.5,0,.5])part(g,'cyl',mt(.36,.45,.2,.5),.038,.02,.038,x,.035,0,0,0,Math.PI/2);return g;}},
  clay:{n:'Clay',mk(){const g=new THREE.Group();part(g,'sph',mt(.5,.4,.33,.6),.085,.06,.08,0,.05,0);return g;}},
  shell:{n:'Shell',mk(){const g=new THREE.Group();part(g,'half',mt(.93,.85,.78,.3),.05,.03,.06,0,0,0);return g;},dye:[.95,.93,.88]},
  seaweed:{n:'Limu (seaweed)',food:1,mk(){const g=new THREE.Group();for(let i=0;i<5;i++)part(g,'leaf',lm(.2,.27,.1),.09,1,.3,0,.02+i*.004,0,0,i*1.3,0);return g;},dye:[.45,.62,.4]},
  manure:{n:'Droppings',mk(){const g=new THREE.Group();for(let i=0;i<4;i++)part(g,'sph',mt(.2,.16,.1,.95),.035,.025,.035,(i%2)*.05-.02,.02,(i>>1)*.05-.02);return g;}},
  flower:{n:'Naupaka flowers',mk(){const g=new THREE.Group();for(let i=0;i<5;i++){part(g,'heart',lm(.97,.95,.92),.035,1,.035,0,.03,0,-.5,i*1.256,0);}part(g,'sph',mt(.9,.8,.3),.012,.012,.012,0,.03,0);return g;},dye:[.9,.72,.86]},
  axehead:{n:'Stick with a flake wedged in it',hs:.6,mk(){const g=stickM(.8,.02,C_WOOD)();part(g,'box',mt(.07,.07,.075,.3),.03,.1,.07,.36,.03,0);return g;}},
  axe:{n:'Stone axe',tool:1,hs:.6,mk(){const g=K.axehead.mk();part(g,'cyl',mt(.66,.53,.34,.9),.028,.07,.028,.34,.02,0,0,0,Math.PI/2);return g;}},
  digstick:{n:'Digging stick',tool:1,hs:.5,mk(){const g=stickM(1.2,.022,C_WOOD)();part(g,'cone',wood(C_WOOD),.022,.12,.022,.66,.022,0,0,0,-Math.PI/2);return g;}},
  basket:{n:'Frond basket',mk(){const g=new THREE.Group();part(g,'cyl',thatchM(),.2,.26,.2,0,.13,0);part(g,'tor',mt(.6,.5,.3),.2,.2,.1,0,.26,0,Math.PI/2);return g;}},
  bowl:{n:'Coconut-shell bowl',mk:bowlWith(null)},
  water:{n:'Bowl of fresh water',mk:bowlWith([.25,.5,.6])},
  milk:{n:'Bowl of goat milk',mk:bowlWith([.96,.95,.9]),food:2,back:'bowl'},
  honey:{n:'Honeycomb',mk(){const g=new THREE.Group();part(g,'box',mt(.85,.58,.1,.25),.09,.03,.07,0,.02,0);return g;},food:2},
  coconut:{n:'Coconut',mk(){const g=new THREE.Group();part(g,'sph',mt(.42,.3,.17,.9),.12,.14,.12,0,.13,0);return g;}},
  cocomeat:{n:'Coconut half',mk(){const g=new THREE.Group();part(g,'half',mt(.3,.2,.12,.8),.1,.1,.1,0,.1,0,Math.PI);part(g,'disc',mt(.97,.96,.92,.4),.09,.09,.09,0,.095,0,-Math.PI/2);return g;},food:1,cook:1},
  onion:{n:'Green onion',mk(){const g=new THREE.Group();part(g,'sph',mt(.93,.93,.86,.5),.02,.03,.02,-.1,.02,0);part(g,'cyl',mt(.3,.5,.2,.6),.009,.26,.009,.04,.02,0,0,0,Math.PI/2);return g;},food:1,cook:1,crop:'onion'},
  beans:{n:'Beans',mk(){const g=new THREE.Group();for(let i=0;i<3;i++)part(g,'cyl',mt(.35,.52,.2,.6),.009,.13,.009,0,.012,(i-1)*.03,0,i*.3,Math.PI/2);return g;},food:1,cook:1,crop:'beans'},
  spud:{n:'Sweet potato',mk(){const g=new THREE.Group();part(g,'sph',mt(.5,.25,.3,.8),.1,.045,.045,0,.04,0,0,.3,.1);return g;},food:1,cook:1,crop:'spud'},
  vines:{n:'Sweet potato vines',mk(){const g=new THREE.Group();for(let i=0;i<6;i++)part(g,'heart',lm(.22,.4,.14),.07,1,.08,(i%3)*.08-.08,.02+i*.006,(i>>1)*.06-.06,0,i*1.1,0);return g;}},
  chili:{n:'Chili pepper',mk(){const g=new THREE.Group();for(let i=0;i<3;i++)part(g,'cone',mt(.8,.1,.06,.35),.014,.09,.014,(i-1)*.03,.015,0,0,i,Math.PI/2);return g;},food:1,crop:'chili',dye:[.85,.3,.22]},
  taro:{n:'Taro corm',mk(){const g=new THREE.Group();part(g,'sph',mt(.42,.34,.28,.9),.07,.075,.07,0,.07,0);part(g,'cyl',mt(.45,.55,.3),.02,.06,.02,0,.16,0);return g;},food:0,cook:1,crop:'taro'},
  banana:{n:'Bananas',mk(){const g=new THREE.Group();for(let i=0;i<4;i++)part(g,'cyl',mt(.92,.8,.25,.5),.016,.14,.016,(i-1.5)*.03,.03,0,.25,0,Math.PI/2+(i-1.5)*.15);return g;},food:1,cook:1,crop:'banana'},
  pineapple:{n:'Pineapple',mk(){const g=new THREE.Group();part(g,'sph',mt(.8,.6,.2,.7),.07,.1,.07,0,.1,0);for(let i=0;i<6;i++)part(g,'leaf',lm(.3,.42,.25),.025,1,.12,0,.19,0,-1.1,i*1.05,0);return g;},food:2,back:'crown'},
  crown:{n:'Pineapple crown',mk(){const g=new THREE.Group();for(let i=0;i<8;i++)part(g,'leaf',lm(.3,.42,.25),.025,1,.13,0,.02,0,-.9,i*.8,0);return g;},crop:'pineapple'},
  egg:{n:'Egg',mk(){const g=new THREE.Group();part(g,'sph',mt(.93,.86,.74,.45),.028,.036,.028,0,.036,0);return g;},food:1,cook:1},
  spear:{n:'Bamboo spear',tool:1,hs:.55,mk(){const g=new THREE.Group();part(g,'cyl',mt(...C_BAM,.45),.012,1.7,.012,0,.012,0,0,0,Math.PI/2);part(g,'box',mt(.07,.07,.075,.3),.07,.012,.03,.88,.012,0);return g;}},
  goggles:{n:'Shell goggles',mk(){const g=new THREE.Group();for(const z of[-.035,.035])part(g,'half',mt(.93,.88,.8,.25),.03,.012,.03,0,.015,z);part(g,'tor',mt(.66,.53,.34,.9),.08,.08,.06,0,.015,0,Math.PI/2);return g;}},
  wana:{n:'Wana (sea urchin)',mk(){const g=new THREE.Group();part(g,'sph',mt(.14,.06,.12,.6),.05,.04,.05,0,.04,0);for(let i=0;i<10;i++)part(g,'cyl',mt(.1,.04,.09,.6),.003,.1,.003,0,.04,0,i*.6,i*1.3,0);return g;},food:2},
  opihi:{n:'ʻOpihi',mk(){const g=new THREE.Group();part(g,'cone',mt(.45,.4,.3,.5),.035,.02,.035,0,.01,0);return g;},food:2},
  hee:{n:'Heʻe (octopus)',mk(){const g=new THREE.Group();part(g,'sph',mt(.6,.32,.22,.5),.06,.07,.06,0,.06,0);for(let i=0;i<8;i++)part(g,'cyl',mt(.66,.36,.25,.5),.012,.2,.012,Math.cos(i*.785)*.08,.01,Math.sin(i*.785)*.08,0,-i*.785,Math.PI/2);return g;},food:1,cook:1},
  ula:{n:'Ula (spiny lobster)',mk(){const g=new THREE.Group();part(g,'cyl',mt(.5,.22,.14,.5),.035,.28,.035,0,.035,0,0,0,Math.PI/2);for(const z of[-.02,.02])part(g,'cyl',mt(.55,.25,.15,.5),.004,.35,.004,.25,.06,z,0,0,Math.PI/2-.3);return g;},food:1,cook:1},
  aama:{n:'ʻAʻama (rock crab)',mk(){const g=new THREE.Group();part(g,'sph',mt(.14,.08,.07,.4),.05,.02,.045,0,.02,0);return g;},food:1,cook:1},
  pork:{n:'Wild pork',mk(){const g=new THREE.Group();part(g,'box',mt(.62,.3,.28,.6),.14,.06,.09,0,.03,0);part(g,'box',mt(.92,.88,.8,.6),.14,.015,.09,0,.065,0);return g;},food:1,cook:1},
  venison:{n:'Venison',mk(){const g=new THREE.Group();part(g,'box',mt(.45,.15,.14,.55),.15,.05,.08,0,.025,0);return g;},food:1,cook:1},
  goatmeat:{n:'Goat meat',mk(){const g=new THREE.Group();part(g,'box',mt(.55,.22,.2,.6),.13,.05,.08,0,.025,0);return g;},food:1,cook:1},
  fowl:{n:'Fowl',mk(){const g=new THREE.Group();part(g,'sph',mt(.9,.78,.66,.6),.07,.05,.05,0,.05,0);part(g,'cyl',mt(.9,.78,.66,.6),.015,.08,.015,.07,.03,.02,0,0,1);return g;},food:1,cook:1},
  fish:{n:'Reef fish',mk(){const g=new THREE.Group();part(g,'sph',mt(.6,.66,.7,.25,{metalness:.5}),.11,.045,.02,0,.03,0);part(g,'cone',mt(.5,.56,.6,.3),.04,.06,.008,-.13,.03,0,0,0,-Math.PI/2);return g;},food:1,cook:1},
  poi:{n:'Poi',mk:bowlWith([.55,.45,.55]),food:3,back:'bowl'},laulau:{n:'Taro-leaf wrap',mk(){const g=new THREE.Group();part(g,'box',mt(.2,.3,.12,.7),.1,.05,.07,0,.03,0);part(g,'cyl',mt(.66,.53,.34),.052,.01,.037,0,.03,0,0,0,Math.PI/2);return g;},food:3},
  haupia:{n:'Coconut pudding',mk(){const g=new THREE.Group();part(g,'box',mt(.97,.96,.93,.3),.07,.04,.07,0,.02,0);return g;},food:3},stew:{n:'Island stew',mk:bowlWith([.75,.42,.18]),food:3,back:'bowl'},
  crate:{n:'Storage crate',cap:1,hs:0.3,place:1,mk(){const g=new THREE.Group(),m=wood(C_DRIFT);part(g,'box',m,.72,.03,.5,0,.03,0);for(const s of[-1,1]){part(g,'box',m,.72,.4,.03,0,.22,s*.25);part(g,'box',m,.03,.4,.5,s*.36,.22,0);}part(g,'cyl',mt(.66,.53,.34),.012,.76,.012,0,.36,.262,0,0,Math.PI/2);return g;}},
  barrel:{n:'Rain barrel',cap:1,hs:0.26,place:1,mk(){const g=new THREE.Group();part(g,'cyl',wood(C_DRIFT),.33,.8,.33,0,.4,0);for(const y of[.15,.65])part(g,'tor',mt(.66,.53,.34),.335,.335,.1,0,y,0,Math.PI/2);const w=part(g,'disc',mt(.2,.4,.5,.1),.3,.3,.3,0,.3,0,-Math.PI/2);w.name='water';return g;}},
  trough:{n:'Feeding trough',cap:1,hs:0.28,place:1,mk(){const g=new THREE.Group(),m=wood(C_DRIFT);part(g,'box',m,1.2,.05,.3,0,.08,0);for(const s of[-1,1]){part(g,'box',m,1.2,.16,.04,0,.16,s*.14);part(g,'box',m,.04,.2,.3,s*.6,.12,0);}const f=part(g,'box',mt(.5,.55,.25,.9),1.1,.04,.24,0,.13,0);f.name='feed';return g;}},
  nestbox:{n:'Nest box',cap:1,hs:0.4,place:1,mk(){const g=new THREE.Group(),m=wood(C_DRIFT);part(g,'box',m,.42,.03,.36,0,.03,0);part(g,'box',m,.42,.3,.03,0,.18,-.17);for(const s of[-1,1])part(g,'box',m,.03,.3,.36,s*.2,.18,0);part(g,'box',m,.48,.03,.42,0,.34,0,.12);part(g,'cyl',mt(.74,.63,.42,.95),.16,.05,.14,0,.07,.02);return g;}},
  rawpot:{n:'Unfired clay pot',cap:1,place:1,mk(){return K.pot.mk(mt(.5,.4,.33,.7,{side:THREE.DoubleSide}));}},
  pot:{n:'Clay pot',cap:1,place:1,mk(m){const g=new THREE.Group();const pts=[[.09,0],[.16,.06],[.18,.14],[.14,.22],[.15,.25]].map(p=>new THREE.Vector2(p[0],p[1]));const o=new THREE.Mesh(new THREE.LatheGeometry(pts,18),m||mt(.62,.33,.2,.75,{side:THREE.DoubleSide}));o.castShadow=true;g.add(o);part(g,'disc',mt(.3,.2,.15),.09,.09,.09,0,.005,0,-Math.PI/2);return g;}},
  fishtrap:{n:'Bamboo fish trap',cap:1,hs:0.3,place:1,mk(){const g=new THREE.Group(),m=mt(...C_BAM,.5);for(let i=0;i<10;i++){const a=i/10*6.283;part(g,'cyl',m,.01,.8,.01,0,.25+Math.sin(a)*.22,Math.cos(a)*.22,0,0,Math.PI/2);}for(const x of[-.38,0,.38])part(g,'tor',mt(.66,.53,.34),.22,.22,.1,x,.25,0,0,Math.PI/2);return g;}},
  hive:{n:'Bamboo hive',cap:1,hs:0.26,place:1,mk(){const g=new THREE.Group(),m=mt(...C_BAM,.5);for(let i=0;i<3;i++)part(g,'cyl',m,.07,.7,.07,0,.75+(i==2?.12:0),(i==2?0:(i-.5)*.14),0,0,Math.PI/2);for(const x of[-.25,.25])for(const z of[-.1,.1])part(g,'cyl',wood(),.018,.7,.018,x,.35,z);return g;}},
  mat:{n:'Woven mat',cap:2,hs:0.22,place:1,mk(){const g=new THREE.Group();const o=part(g,'box',new THREE.MeshStandardMaterial({map:clothTex,color:srgb(.8,.7,.45),roughness:.95}),1.4,.015,.9,0,.012,0);o.castShadow=false;return g;}},
  shellstring:{n:'String of shells',cap:3,place:1,mk(){const g=new THREE.Group();part(g,'cyl',mt(.66,.53,.34),.004,.9,.004,0,-.45,0);for(let i=0;i<7;i++)part(g,'half',mt(.95,.87,.8,.3),.035,.02,.04,0,-.1-i*.12,0,1.4,i*2.1,0);return g;}},
  lei:{n:'Lei',cap:3,place:1,mk(){const g=new THREE.Group();for(let i=0;i<16;i++){const a=i/16*6.283;part(g,'sph',mt(...(i%2?[.97,.95,.92]:[.92,.6,.75]),.6),.035,.03,.035,Math.cos(a)*.16,-.16+Math.sin(a)*.16,0);}return g;}},
  torch:{n:'Bamboo torch',cap:2,hs:0.3,place:1,mk(){const g=new THREE.Group();part(g,'cyl',mt(...C_BAM,.5),.025,1.6,.025,0,.8,0);part(g,'cyl',new THREE.MeshBasicMaterial({color:srgb(.2,.14,.08)}),.05,.12,.04,0,1.62,0);const f=part(g,'sph',new THREE.MeshBasicMaterial({color:new THREE.Color(6,2.6,.6)}),.035,.08,.035,0,1.76,0);f.name='flame';f.castShadow=false;f.visible=false;return g;}},
};
const BROWN=new THREE.Color(.5,.36,.24),PALE=new THREE.Color(1.05,.95,.75);
for(const k of Object.keys(K))if(K[k].cook){const b=K[k];
  K['c_'+k]={n:'Roasted '+b.n.toLowerCase(),food:2,mk:()=>tintClone(b.mk(),BROWN)};
  K['d_'+k]={n:'Dried '+b.n.toLowerCase(),food:2,mk:()=>{const g=tintClone(b.mk(),PALE);g.scale.setScalar(.82);return g;}};}
K.kalua={n:'Kālua puaʻa (slow-cooked pork)',mk:bowlWith([.7,.55,.45]),food:4,back:'bowl'};K.heeluau={n:'Heʻe lūʻau (octopus in coconut)',mk:bowlWith([.82,.78,.6]),food:4,back:'bowl'};K.seapot={n:'Pot of crab and lobster',mk:bowlWith([.85,.45,.3]),food:3,back:'bowl'};
for(const k of['poi','laulau','haupia','stew','heeluau','seapot','kalua'])K['s_'+k]={...K[k],n:'Spicy '+K[k].n.toLowerCase(),food:4};
const isFood=k=>K[k]&&K[k].food!=null;
const CHICK_LIKES=k=>k==='beans'?1.5:(['onion','cocomeat','chili'].includes(k)||/^[cds]_/.test(k)||['poi','stew','laulau'].includes(k))?1:0;
const GOAT_LIKES=k=>k==='vines'?1.5:['frond','banana','onion','spud','beans','seaweed'].includes(k)?1:0;

/* ───────── notebook: the only guidance, written after the fact ───────── */
const NOTES={
  hunt:'Crept close with the spear, slow and low. Meat for the fire, and for the imu.',
  dive:'Under the surface the reef goes on and on. A breath lasts about a minute; the light and the cold tell me when to go up.',
  blackout:'I stayed down too long. I came to on the sand, and what I had gathered down there was gone.',
  spear:'A flake lashed to bamboo makes a spear. Fish that hover over the reef can be taken with it.',
  goggles:'Two shells bound with fibre sit over the eyes. The water is clearer through them, and I stay down longer.',
  spearfish:'A fish on the spear. It wants the fire.',limu:'Limu grows everywhere on the reef. It can be eaten as it is.',
  wana:'Wana, careful of the spines. The roe inside is rich.',opihi:'ʻOpihi, pried off the wet black rock where the waves break. A delicacy.',
  hee:'Heʻe hides in holes in the reef and changes colour to match it. Slow hands catch it.',ula:'Ula sit under ledges with their long feelers out.',
  aama:'ʻAʻama crabs run across the wet lava. Quick ones.',honu:'A honu glided past and let me swim beside it. They are protected; I would not take one.',
  spring:'High on the mountain, behind fallen boulders, cold water wells up out of the rock. This is where the river begins.',
  flake:'Stone struck on the black rock splits. One edge comes away sharp.',
  digstick:'A stick ground on the rock takes a point. It opens the soil.',
  coconut:'The flake opens a coconut: white meat, and husk that pulls apart into fibre.',
  cord:'Two pinches of fibre, rolled together, make cord.',
  axehead:'A flake wedged into a stick. It wobbles.',
  axe:'Cord bound round the head. It bites driftwood into planks and brings down fronds and bamboo.',
  basket:'Three fronds plaited round a cord. My hands were never enough.',
  till:'Turned earth, dark and loose.',
  plant:'Whatever I can eat, I can bury. Most of it comes back as more.',
  water:'Fresh water at the spring under the knoll. Leaves lift soon after.',
  soil:'Seaweed and droppings darken tired ground. The same crop twice pales it.',
  beans:'Where the beans grew, the next thing grew better.',
  taro:'Taro sulks in dry ground. By the spring it stands tall.',
  rawtaro:'Raw taro bites the tongue. It wants fire.',
  fire:'A ring of stones, wood inside, a flame carried from the lantern.',
  cook:'Food set by the fire changes. It carries me further.',
  crate:'Four planks and a cord make a box.',
  roof:'Fronds overhead keep the rain off what is under them.',
  rack:'Hung on a rail, food dries and keeps.',
  chick:'The hens come for beans and greens. Fed, they leave eggs.',
  trough:'A log hollowed with the flake holds feed. They help themselves.',
  nestbox:'Two planks and a nest of fibre. The eggs end up in it.',
  goat:'The goat on the knoll wants vines and leaves, and a quiet tune.',
  milk:'A bowl, a fed goat, a little patience.',
  clay:'Grey clay under the spring mud.',
  rawpot:'Three lumps of clay pressed into a pot. Soft still.',
  pot:'Fired, it holds water. Water and two or three things in it by the fire: supper.',
  fishtrap:'Four bamboo and a cord, set in the shallows. It fills by itself.',
  barrel:'Six planks and a cord hold the rain. Bamboo laid from it wets the rows.',
  hive:'Three bamboo and fibre, set near flowers. They found it.',
  honey:'Comb from the hive. The beans nearby set heavier too.',
  dye:'Chili, weed, flowers and shell each leave their colour on wood.',
  mat:'Two fronds on a bed of fibre: a mat.',torch:'Bamboo, fibre, and the lantern flame.',shellstring:'Three shells on a cord, to hang.',lei:'Five flowers on a cord.',
  home1:'A lean-to. Two posts and a little thatch.',home2:'A hale: four posts under six fronds. The fire stays lit in rain.',home3:'A house, walled and floored. The wind goes round it.',
};
const IDEAS=[ // [text, shown when..., hidden once...]
  ['The black rock at the west end breaks sharp.',()=>1,'flake'],
  ['Driftwood, shells and weed come in with each tide.',()=>1,'axe'],
  ['Something was dug once, east of the knoll.',()=>1,'plant'],
  ['A sharp edge, a stick, a binding?',n=>n.flake,'axe'],
  ['The coconut husk is all thread.',n=>n.flake,'cord'],
  ['A stick could be ground to a point.',n=>n.flake,'digstick'],
  ['Fronds ×3 and cord: something to carry with.',n=>n.cord,'basket'],
  ['Stones in a ring. Wood. The lantern.',n=>n.flake,'fire'],
  ['Planks ×4 + cord.   Planks ×6 + cord.   Planks ×2 + fibre.   A log, hollowed.',n=>n.axe,'barrel'],
  ['Sticks stand as posts. Fronds lie as thatch.',n=>n.axe,'roof'],
  ['Six fronds on four posts.',n=>n.home1,'home2'],
  ['Twelve fronds, six wall boards, six floor boards.',n=>n.home2,'home3'],
  ['There is water under the knoll, on the west side.',n=>n.till,'water'],
  ['Clay ×3 pressed together, then the fire.',n=>n.clay,'pot'],
  ['Bamboo ×4 + cord.   Bamboo ×3 + fibre.   Bamboo + fibre.',n=>n.axe&&n.cord,'hive'],
  ['Something moves on the knoll at dusk.',()=>W.day>=3,'goat'],
];
function note(id){if(!id||W.notes[id]||!NOTES[id])return;W.notes[id]=1;SFX.page&&SFX.page();$('book').dataset.fresh='1';}
/* ───────── the book: a field guide to the island ─────────
   Everything the island knows, for the player to look up at any time (J): one page per zone with its plants, animals and what
   can be done there, then making things, food and building. Entries are all readable from the start; a mark shows the ones you
   have seen for yourself. The journal page keeps the first-person notes written as you discover things. */
const GUIDE=(()=>{
  const T={food:'Food',hunt:'Hunt',catch:'Catch',gather:'Gather',protected:'Protected',watch:'Watch',use:'Useful'};
  const E=(n,e,d,tags,see,when)=>({n,e,d,tags:tags||[],see,when});
  const ZONES=[
    {id:'beach',t:'Kahakai',s:'the beach',intro:'Where you arrive: pale coral sand, the lanai with its hammock and chair, coconut palms, and the black lava coast to the west. Each tide brings things in.',
     flora:[E('Niu','coconut palm','Palms line the shore and drop coconuts and fronds. A stone flake opens a coconut: meat to eat, husk for fibre. An axe brings down fronds.',['food','use'],'Coconut palm'),
       E('Milo','portia tree','A spreading shade tree of the shore, brought by the first voyagers. Its wood was carved into bowls.',['watch'],'Milo (portia tree)'),
       E('Naupaka','beach naupaka','A low shrub with white half-flowers. Pick five to string a lei.',['use'],'Naupaka'),
       E('ʻUlu','breadfruit','Planted near the lanai: broad lobed leaves and round green fruit.',['watch'],'ʻUlu (breadfruit)'),
       E('Wiliwili','Hawaiian coral tree','On the dry lava side to the west: pale bark, three-part leaves, orange flowers.',['watch'],'Wiliwili')],
     fauna:[E('Moa','the farm hens and rooster','They peck about near home, eat beans, greens and scraps, and leave eggs, more with a nest box.',['food','watch']),
       E('Kao','the knoll goat','Comes down from the knoll at dusk. Feed it vines, fronds, bananas or limu and it learns to trust you; then a bowl brings milk.',['food','watch'],'Goat'),
       E('ʻAʻama','black rock crab','Scuttles over the wet lava at the waterline and bolts into the surge if you crowd it. Grab it quickly.',['catch','food'],'ʻAʻama (rock crab)'),
       E('ʻOpihi','limpet','Clings to the wet black rock where the waves break. Pry one loose with a stone flake.',['gather','food'],'ʻOpihi')],
     todo:['Strike a lava stone on the black rock to split off a sharp flake: the first tool.','Gather sticks, driftwood, shells and limu washed up on the sand.',
       'Ring stones for a fire, add wood, and light it from the lantern. Cook beside it.','Build on the half-metre grid: posts, rails, floors, walls, thatch. A roof keeps rain off.',
       'Sit in the chair, lie in the hammock, play the ukulele (1–4), listen to the radio, and take photos (P).','Set a bamboo fish trap in the shallows; it fills by itself.']},
    {id:'mountain',t:'Kuahiwi',s:'the mountain',intro:'A green, fluted mountain about 75 m high to the north, with sea cliffs on its far side and cloud drifting round the summit. The wind grows with every metre you climb.',
     flora:[E('ʻŌhiʻa lehua','Metrosideros polymorpha','The first tree on new lava and the most common on the mountain. Small dark leaves and red pompom blossoms that the honeycreepers feed from.',['watch'],'ʻŌhiʻa lehua'),
       E('Koa','Acacia koa','Tall, with a broad crown and sickle-shaped grey-green leaves. Its wood made canoes.',['watch'],'Koa'),
       E('Hāpuʻu','Hawaiian tree fern','Fibrous trunks crowned with arching fronds, in the wetter gullies.',['watch'],'Hāpuʻu (tree fern)'),
       E('Loulu','Hawaiian fan palm','Slender palms with pleated fans, high on the ridges.',['watch'],'Loulu (fan palm)')],
     fauna:[E('Kao','feral goat','Herds on the steep slopes. Wary; creep close (Shift) and strike with the spear.',['hunt','food'],'Kao (feral goat)'),
       E('ʻIo','Hawaiian hawk','Soars in wide circles over the mountain, now and then beating its wings.',['watch','protected'],'ʻIo (Hawaiian hawk)')],
     todo:['Climb: gentle slopes you walk; past about 43° hold W to climb hand over hand on your Strength. Rest on easier ground before it runs out, or you slide.',
       'Find Ka Puna Huna, the hidden spring, behind fallen boulders on the south-east flank. The river starts there.','Stand on the summit for the view, the wind and the cloud.']},
    {id:'fountain',t:'Wailele',s:'the waterfall pool and the river',intro:'The river falls 14 m into a cliff-backed pool, then winds east through the forest to the sea. After heavy rain it rises, runs faster and roars louder.',
     flora:[E('Hāpuʻu','tree fern','Thrives in the spray and shade around the pool.',['watch'],'Hāpuʻu (tree fern)'),E('Ferns and anthuriums','the undergrowth','Crowd the damp banks.',['watch'])],
     fauna:[E('ʻŌpeʻapeʻa','Hawaiian hoary bat','Hawaiʻi’s only native land mammal. Flits low over the river at dusk and after dark.',['watch','protected'],'ʻŌpeʻapeʻa (hoary bat)'),
       E('Kia','axis deer','Comes down to drink at the forest edge. Very wary.',['hunt','food'],'Kia (axis deer)')],
     todo:['Swim in the pool; the river’s current carries you downstream.','Fill a bowl with fresh water at the spring under the knoll, or from a rain barrel.',
       'Dig grey clay from the spring mud with the digging stick.']},
    {id:'forest',t:'Wao Nahele',s:'the forest',intro:'A Hawaiian rainforest inland on the east side, climbing onto the mountain: tall koa and ʻōhiʻa over tree ferns, leaf litter underfoot, birdsong by day and an owl at night. Mist hangs here after rain.',
     flora:[E('Koa','Acacia koa','The tallest trees of the forest.',['watch'],'Koa'),E('ʻŌhiʻa lehua','with red lehua blossoms','The heart of the forest; the birds follow its flowers.',['watch'],'ʻŌhiʻa lehua'),
       E('Hāpuʻu','tree fern','The understorey: fronds at head height.',['watch'],'Hāpuʻu (tree fern)'),E('Kukui','candlenut','Pale silvery-green leaves; its oily nuts once lit lamps.',['watch'],'Kukui (candlenut)'),
       E('ʻŌhiʻa ʻai','mountain apple','Glossy leaves and red fruit.',['watch'],'ʻŌhiʻa ʻai (mountain apple)'),E('Banyan','an introduced giant','Two great banyans with hanging aerial roots that thicken into new trunks.',['watch'],'Banyan')],
     fauna:[E('Puaʻa','wild pig','Roots through the forest floor. Bolts at about 13 m unless you creep (Shift). Strike, then butcher it (E) for pork.',['hunt','food'],'Puaʻa (wild pig)'),
       E('Moa','red jungle fowl','Wild descendants of the birds the voyagers brought. Skittish.',['hunt','food'],'Moa (jungle fowl)'),
       E('Nēnē','Hawaiian goose','Grazes in pairs on the open grass near the forest. Hawaiʻi’s state bird.',['hunt','food'],'Nēnē (Hawaiian goose)'),
       E('Manakuke','small Indian mongoose','Darts across clearings; an introduced predator.',['watch'],'Manakuke (mongoose)'),
       E('ʻIʻiwi','scarlet honeycreeper','Scarlet with black wings and a curved bill made for lehua flowers.',['watch','protected'],'ʻIʻiwi (scarlet honeycreeper)'),
       E('ʻApapane','crimson honeycreeper','Deep crimson; its trills fill the canopy.',['watch','protected'],'ʻApapane (crimson honeycreeper)'),
       E('Pueo','Hawaiian short-eared owl','Perches by day and moves to another tree if you come too close. Calls after dark.',['watch','protected'],'Pueo (Hawaiian owl)'),
       E('Pulelehua','Kamehameha butterfly','Orange-red and black, one of only two native butterflies.',['watch'],'Pulelehua (Kamehameha butterfly)'),
       E("Jackson's chameleon",'introduced','Green, sitting still in the branches.',['watch'],"Jackson's chameleon"),
       E('Moʻo','gecko','Runs up and down the trunks.',['watch'],'Moʻo (gecko)'),
       E('Nananana makakiʻi','happy-face spider','Tiny and yellow, under fern leaves; each one’s markings are its own.',['watch'],'Nananana makakiʻi (happy-face spider)')],
     todo:['Hunt with the bamboo spear: approach slowly (Shift), strike, then butcher what you take (E) and roast the meat at the fire.',
       'Watch for the honeycreepers in the flowering ʻōhiʻa, and for bats over the river at dusk.','Gather fronds and bamboo with the axe.']},
    {id:'sea',t:'Lalo o ke Kai',s:'under the sea',intro:'A fringing reef rings the island 15–65 m offshore, 2–4 m down, then drops away to 18 m. Swim out until your feet leave the bottom and press C to dive.',
     flora:[E('Pōhaku puna','lobe and finger coral','Lumpy mounds and thickets of blunt fingers, the builders of the reef.',['watch'],null,n=>n.dive),
       E('Koʻa','cauliflower coral','Knobbly bushes in the surge on the reef crest.',['watch'],null,n=>n.dive),E('Pāpaua','rice coral plates','Overlapping brown plates with pale rims.',['watch'],null,n=>n.dive),
       E('ʻAkoʻakoʻa','mushroom coral','Loose discs with fine ridges on the sand.',['watch'],null,n=>n.dive),E('ʻĒkaha kū moana','black coral','Fine branching trees on the drop-off. Hawaiʻi’s state gem.',['watch','protected'],null,n=>n.dive),
       E('Limu','seaweed','Everywhere on the reef. Eat it as it is, feed it to the goat, or dig it into tired soil.',['gather','food'],'Limu')],
     fauna:[E('Lauʻīpala','yellow tang','Bright yellow schools over the reef.',['catch','food'],'Lauʻīpala (yellow tang)'),E('Kihikihi','Moorish idol','Banded, with a long trailing fin.',['catch','food'],'Kihikihi (Moorish idol)'),
       E('Manini','convict tang','Pale, with dark bars; big schools.',['catch','food'],'Manini (convict tang)'),E('Humuhumunukunukuāpuaʻa','reef triggerfish','Hawaiʻi’s state fish.',['catch','food'],'Humuhumunukunukuāpuaʻa (reef triggerfish)'),
       E('Uhu','parrotfish','Blue-green, grinding coral into sand.',['catch','food'],'Uhu (parrotfish)'),
       E('Heʻe','day octopus','Hides in holes and changes colour. It may ink and jet away; a spear helps.',['catch','food'],'Heʻe (octopus)'),
       E('Ula','spiny lobster','Under ledges with long feelers out. Flicks backwards if you miss.',['catch','food'],'Ula (spiny lobster)'),
       E('Wana','sea urchin','Black and spiny on the reef. The roe is rich.',['gather','food'],'Wana (sea urchin)'),
       E('Honu','green sea turtle','Grazes on limu and rises to breathe. Protected: swim with it, never take it.',['watch','protected'],'Honu (green sea turtle)'),
       E('Hāhālua','manta ray','Glides along the reef edge.',['watch'],'Hāhālua (manta ray)'),E('Manō','whitetip reef shark','Patrols the drop-off and circles you for a while if you come close. Harmless if left alone.',['watch'],'Manō (whitetip reef shark)')],
     todo:['Dive: C down, W where you look, Space up, Shift to glide. One breath lasts about 60 seconds; shell goggles (2 shells + fibre) add 25 and clear the view.',
       'Run out of air and you black out, waking on the beach without what you gathered on that dive. Your heartbeat warns you below 15 seconds.',
       'Spear fish with a bamboo spear (stone flake + bamboo); catch heʻe, ula and ʻaʻama by hand; gather wana and limu.','Past the reef’s edge the current turns you back.']},
  ];
  const place={'@rock':'the black lava rock','@self':'by itself (click)','@seep':'the spring mud','@bamboo':'a bamboo clump','@palm':'a palm'};
  const nm=k=>place[k]||(K[k]?K[k].n.toLowerCase():k);
  const making=()=>RECIPES.map(r=>`<li><b>${K[r.out[0][0]]?K[r.out[0][0]].n:r.out[0][0]}</b>: hold ${r.n>1?r.n+' × ':''}${nm(r.h)} and ${r.t==='@self'?'click':'use it on '+nm(r.t)}${r.hits>1?` (${r.hits} strikes)`:''}${r.keep?'; you keep the tool':''}.</li>`).join('');
  const food=()=>{const raw=[],cook=[];for(const k in K){const f=K[k];if(f.food==null||/^[cds]_/.test(k))continue;(f.cook?cook:raw).push(f.n);}
    return `<p><b>Eat as it is:</b> ${raw.join(', ')}.</p><p><b>Better cooked</b> (set by a lit fire for about 40 s; roasted food carries you further, dried food keeps): ${cook.join(', ')}.</p>
      <p><b>In the clay pot</b> with water, by the fire:</p><ul><li>pork with taro or sweet potato: kālua puaʻa</li><li>heʻe with coconut: heʻe lūʻau</li><li>crab or lobster: a seafood pot</li><li>taro with egg or fish: laulau</li><li>taro alone: poi</li><li>coconut with honey, milk or banana: haupia</li><li>anything else: island stew</li><li>add chili to any dish to make it spicy</li></ul>
      <p>Food gives strength in tiers: raw keeps you going, cooked and pot dishes let you walk faster and carry more for longer.</p>`;};
  const building=()=>`<p>Hold a building material and press <b>B</b>. R turns, F changes shape, the wheel sets the height; click to place. X takes a piece apart.</p><ul>${Object.values(FORMS).map(f=>`<li><b>${f.n}</b> from ${K[f.from]?K[f.from].n.toLowerCase():f.from}</li>`).join('')}</ul>
      <p><b>Homes:</b> two posts and a little thatch make a lean-to; four posts under six fronds a hale, where the fire stays lit in rain; twelve fronds, six wall boards and six floor boards a house.</p>
      <p><b>Growing:</b> till with the digging stick, plant what you can eat, water with a bowl. ${Object.values(CROPS).map(c=>c.n).join(', ')} grow here; taro wants wet ground by the spring, beans enrich the soil, the same crop twice tires it, and limu and droppings restore it.</p>
      <p><b>Animals at home:</b> a trough feeds the hens and the goat; a nest box gathers eggs; a bamboo hive near flowers gives honey and heavier beans.</p>`;
  const tagHtml=tags=>tags.map(t=>`<span class="tag ${t}">${T[t]}</span>`).join('');
  const entry=(x,n)=>{const seen=x.see?!!W.seen[x.see]:x.when?!!x.when(n):true;return `<div class="ent${seen?'':' unseen'}"><div><b>${x.n}</b> <i>${x.e}</i> ${tagHtml(x.tags)}${seen?'':'<em class="pencil">not yet seen</em>'}</div><p>${x.d}</p></div>`;};
  const pages=[{id:'journal',t:'Journal'},...ZONES.map(z=>({id:z.id,t:z.t,z})),{id:'making',t:'Making'},{id:'food',t:'Food'},{id:'build',t:'Building & growing'}];
  let cur=0;
  function render(){const pg=pages[cur],n=W.notes;let h='<nav>'+pages.map((p,i)=>`<button data-i="${i}" class="${i===cur?'on':''}">${p.t}</button>`).join('')+'</nav><div class="pg">';
    if(pg.id==='journal'){h+='<h4>Day '+(W.day+1)+' · '+(season()?'the wet months':'the dry months')+'</h4>';const found=Object.keys(n).filter(k=>NOTES[k]);
      h+=found.length?found.map(k=>'<p>'+NOTES[k]+'</p>').join(''):'<p class="pencil">Nothing written yet.</p>';const id=IDEAS.filter(i=>i[1](n)&&!n[i[2]]);if(id.length)h+='<hr>'+id.map(i=>'<p class="pencil">'+i[0]+'</p>').join('');}
    else if(pg.z){const z=pg.z;h+=`<h3>${z.t} · ${z.s}</h3><p class="intro">${z.intro}</p><h5>Plants</h5>${z.flora.map(x=>entry(x,n)).join('')}<h5>Animals</h5>${z.fauna.map(x=>entry(x,n)).join('')}<h5>What you can do</h5><ul>${z.todo.map(t=>'<li>'+t+'</li>').join('')}</ul>`;}
    else if(pg.id==='making')h+=`<h3>Making things</h3><p class="intro">Hold one thing and use it on another (left click). Everything you can make:</p><ul>${making()}</ul>`;
    else if(pg.id==='food')h+='<h3>Food and cooking</h3>'+food();
    else h+='<h3>Building and growing</h3>'+building();
    h+='</div><p class="foot pencil">← → or A D to turn the page · click a tab · J, E or Esc to close</p>';
    const el=$('bookpage');el.innerHTML=h;el.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{cur=+b.dataset.i;render();SFX.page();});}
  return{open(){const z=zoneState.cur,i=pages.findIndex(p=>p.id===z||(z==='undersea'&&p.id==='sea'));if(i>=0&&!this.opened)cur=i;this.opened=true;render();},
    turn(d){cur=(cur+d+pages.length)%pages.length;render();SFX.page();},zones:ZONES,pages};
})();

function openBook(){GUIDE.open();$('book').classList.add('on');bookOpen=true;SFX.page();$('book').dataset.fresh='';if(document.pointerLockElement)document.exitPointerLock();}
let bookOpen=false;function closeBook(){$('book').classList.remove('on');bookOpen=false;}

/* ───────── things lying in the world ───────── */
{ // scanned look for these kinds wherever they appear: on the ground, in hand, on shelves
  const PROPK={shell:['lambis_shell',{}],stone:['stone_01',{tint:new THREE.Color(.33,.31,.31)}],banana:['bananas',{}],barrel:['wine_barrel_01',{}],
    crate:['wooden_crate_01',{}],pot:['planter_pot_clay',{}],basket:['wicker_basket_02',{}]};
  for(const [k,[n,o]] of Object.entries(PROPK)){const mk=K[k].mk;K[k].mk=function(...a){return dressProp(mk.apply(this,a),n,o);};}
}
function spawn(kind,x,z,n=1,y){
  for(const o of W.items)if(o.kind===kind&&Math.hypot(o.x-x,o.z-z)<.35&&o.n+n<=12){o.n+=n;return o;}
  const it={kind,n,x,z,wkind:kind,verb:'pick up',label(){return K[kind].n+(it.n>1?'  ×'+it.n:'');},
    e(){const got=give(kind,it.n,null,null,true);if(got>0){it.n-=got;SFX.pickup();if(it.n<=0)despawn(it);}else SFX.knock&&noiseBurst(AU.pink,'lowpass',300,.5,.05,.01,.08);},
    use(k){return tryRecipe(k,kind,it);}};
  it.g=K[kind].mk();it.g.position.set(x,(y==null?groundAt(x,z):y)+.01,z);it.g.rotation.y=R()*6.28;it.g.userData.item=it;
  const px=new THREE.Mesh(geo.box,proxyMat);px.scale.set(.34,.3,.34);px.position.y=.12;it.g.add(px);
  scene.add(it.g);interact.push(it.g);W.items.push(it);return it;
}
function despawn(it){physForget(it.g);scene.remove(it.g);let i=interact.indexOf(it.g);if(i>=0)interact.splice(i,1);i=W.items.indexOf(it);if(i>=0)W.items.splice(i,1);}
const countWorld=k=>W.items.reduce((a,o)=>a+(o.kind===k?o.n:0),0);

/* ───────── what you carry ───────── */
const stackCap=k=>(K[k].cap||((W.basket?12:3)+(nowS()<W.buff.until?W.buff.carry:0)));
const slotCap=()=>W.basket?7:1;
const selKind=()=>W.sel>=0&&W.inv[W.sel]?W.inv[W.sel].kind:null;
const have=k=>{const s=W.inv.find(s=>s.kind===k);return s?s.n:0;};
function give(kind,n,x,z,noDrop){
  if(kind==='basket'&&!W.basket){W.basket=true;note('basket');n--;if(n<=0)return 1;}
  let got=0,s=W.inv.find(s=>s.kind===kind);
  if(s){const a=Math.min(n,stackCap(kind)-s.n);s.n+=a;got+=a;}
  else if(W.inv.length<slotCap()){const a=Math.min(n,stackCap(kind));W.inv.push({kind,n:a});got+=a;if(W.sel<0&&!held)W.sel=W.inv.length-1;}
  if(got<n&&!noDrop){const fx=x==null?player.x-Math.sin(player.yaw)*.8:x,fz=z==null?player.z-Math.cos(player.yaw)*.8:z;spawn(kind,fx+(R()-.5)*.3,fz+(R()-.5)*.3,n-got);got=n;}
  if(DIVE.on&&got>0)DIVE.log[kind]=(DIVE.log[kind]||0)+got;
  handDirty=true;return got;
}
function takeFrom(kind,n=1){const i=W.inv.findIndex(s=>s.kind===kind);if(i<0)return false;const s=W.inv[i];if(s.n<n)return false;s.n-=n;
  if(s.n<=0){W.inv.splice(i,1);if(W.sel===i)W.sel=-1;else if(W.sel>i)W.sel--;}handDirty=true;return true;}
const handG=new THREE.Group();camera.add(handG);let handDirty=true,handKind=null,handAnim=0;

