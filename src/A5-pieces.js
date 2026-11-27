/* ───────── building with weight: pieces that stand, lean and fall ─────────
   Every piece you build is a solid body to the physics, so what you drop lands on your floor and rolls off your roof. Anything
   placed without support (a post not set in the ground, a beam with nothing under its ends, a board in mid-air) falls when you let
   go of it, tumbles and lies where it lands, and is still a piece you can pick up (X) or build on. Take away what holds something up
   and it comes down the same way. What holds what is the support rule of the builder (a piece rests on the ground, on a floor, or
   against a piece it touches); the fall itself is Rapier's. Pieces at rest are fixed bodies, so a finished house costs nothing. */
const PIECEPHYS=(()=>{
  const fixed=new Map(),V=THREE.Vector3;
  const solid=f=>!hangs(f)&&f!=='mat'&&f!=='channel'&&f!=='raft';   // a raft moves on the water: no fixed body
  const walk=f=>f==='floor'||f==='path'||f==='raft'||f==='bench';          // walked on or over: they carry you, they do not stop you
  function add(pc){if(pc.fall||!PHYS.ready||!solid(pc.f))return;if(fixed.has(pc))remove(pc);
    const body=SOLID.add(pc.g,{blocks:!walk(pc.f)&&!pc.q});if(body)fixed.set(pc,body);}                 // a fitted skin; a fallen piece lies low and does not stop you
  function remove(pc){if(fixed.has(pc))SOLID.remove(pc.g);fixed.delete(pc);}
  function land(pc,g){pc.fall=false;const gy=groundAt(g.position.x,g.position.z);if(g.position.y<gy-.5)g.position.y=gy;            // never lost under the ground
    pc.x=g.position.x;pc.y=g.position.y;pc.z=g.position.z;pc.q=g.quaternion.toArray();g.updateMatrixWorld(true);add(pc);recompute();}
  function fall(pc){remove(pc);pc.fall=true;pc.g.updateMatrixWorld(true);
    const ok=physDrop(pc.g,{vel:{x:(Math.random()-.5)*.3,y:-.3,z:(Math.random()-.5)*.3},onRest:g=>{land(pc,g);SFX.thud&&SFX.thud(.45);}});
    if(!ok){pc.g.position.y=Math.max(groundAt(pc.x,pc.z),floorY(pc.x,pc.z,pc.y)||-99);land(pc,pc.g);}}                          // no physics here: it just drops
  // bodies for what was built before the physics was ready, and the rafts' bob on the water
  function tick(dt){if(PHYS.ready&&fixed.size<W.pieces.length)for(const pc of W.pieces)if(!fixed.has(pc)&&!pc.fall)add(pc);
    for(const pc of W.pieces)if(pc.f==='raft'&&!pc.fall){pc.g.position.y=pc.y+Math.sin(time*1.1+pc.x)*.025;pc.g.rotation.z=Math.sin(time*.8+pc.z)*.025;pc.g.rotation.x=Math.sin(time*.9+pc.x*.7)*.02;}}
  return{add,remove,fall,tick,get bodies(){return fixed.size;}};
})();

/* a raft: two driftwood logs lashed with cord, a deck of bamboo slats across them. It sits on the water, river or sea, and you can stand on it. */
K.raft={n:'Raft',cap:1,hs:.25,place:1,mk(){const g=new THREE.Group(),lg=wood(C_DRIFT),m=mt(...C_BAM,.45),c=mt(.66,.53,.34,.9);
  for(const z of[-.32,.32])part(g,'cyl',lg,.13,2.1,.13,0,.06,z,0,0,Math.PI/2);                                            // the two logs
  for(let i=0;i<9;i++){const x=-.88+i*.22;part(g,'cyl',m,.03,1,.03,x,.2,0,Math.PI/2,0,0);for(const z of[-.32,.32])part(g,'tor',c,.05,.05,.12,x,.17,z,0,0,0);}return g;}};
FORMS.raft={n:K.raft.n,from:'raft',mk:()=>K.raft.mk(),y:0};DIM.raft=[.2,1];
RECIPES.push({h:'log',n:2,t:'cord',out:[['raft',1]],note:'raft'});
Object.assign(NOTES,{fall:'What I put up without anything under it came down. Posts set in the ground stand; the rest has to rest on something.',
  raft:'Two driftwood logs lashed with cord, a deck across them. It floats.',shape:'A piece can be cut to the length I want. A long one takes two.'});
IDEAS.push(['Two driftwood logs and a cord: something that floats.',n=>n.cord,'raft']);

/* plans in the field guide: four ways to build things, as sketches. Examples only: build what you like. */
{const sk=(w,h,body)=>`<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:360px;display:block;margin:6px 0 4px" fill="none" stroke="#4a3a28" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
 const post=(x,y0,y1)=>`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`,ground=(w,y)=>`<path d="M6 ${y} H${w-6}" stroke-dasharray="2 5" stroke-width="1.4"/>`;
 const thatch=(x0,y0,x1,y1)=>{let s=`<path d="M${x0} ${y0} L${x1} ${y1}" stroke-width="3"/>`;for(let i=0;i<9;i++){const t=i/8,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;s+=`<path d="M${x} ${y} l-4 12" stroke-width="1.2"/>`;}return s;};
 const PL=[
  {t:'A lean-to shelter',d:'Two posts set in the ground, a rail lashed across their tops, and thatch laid sloping from the rail to the ground behind (turn the thatch with Shift + R to tilt it). Out of the rain for one; a fire in front of it.',
   need:'2 sticks as posts, 1 stick as a rail, 2 to 4 fronds',svg:sk(300,130,ground(300,118)+`<line x1="232" y1="30" x2="232" y2="108" stroke-dasharray="5 4" stroke-width="1.6"/><line x1="210" y1="40" x2="232" y2="30" stroke-width="1.8"/>`+post(210,118,40)+thatch(210,40,70,118)+`<path d="M232 30 L92 108" stroke-width="1.4" stroke-dasharray="4 4"/><circle cx="250" cy="108" r="5" stroke-width="1.4"/><path d="M246 106 l4 -9 l4 9" stroke-width="1.4"/>`)},   // side on: posts, the rail between them, the thatch to the ground, the fire in front
  {t:'A fence',d:'Posts a long step apart in a line, with two rails between each pair, low and high. Make the rails longer ([ and ]) to space the posts further. It keeps the goat where you want it.',
   need:'a stick per post, two per gap for rails',svg:sk(300,110,ground(300,100)+[40,110,180,250].map(x=>post(x,100,30)).join('')+`<line x1="34" y1="48" x2="256" y2="48"/><line x1="34" y1="74" x2="256" y2="74"/>`)},
  {t:'A hale',d:'Four posts at the corners, bamboo beams across the tops, and pitched thatch over them, six fronds or more. Walls of boards and a floor of boards make it a house. The fire stays lit inside it in the rain.',
   need:'4 posts, 2 to 4 beams, 6 fronds; for a house 6 wall boards and 6 floor boards',svg:sk(300,150,ground(300,138)+post(70,138,70)+post(230,138,70)+post(110,128,64)+post(190,128,64)+`<line x1="60" y1="70" x2="240" y2="70"/>`+thatch(150,22,52,78)+thatch(150,22,248,78)+`<rect x="98" y="96" width="104" height="42" stroke-width="1.2" stroke-dasharray="4 3"/>`)},
  {t:'A raft',d:'Two driftwood logs lashed with a cord, a deck of slats across them: hold the two logs and use them on the cord. Set it on the river or the sea and it floats; you can stand on it.',
   need:'2 driftwood logs, 1 cord',svg:sk(300,100,`<path d="M10 74 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke-width="1.3"/>`+`<rect x="48" y="40" width="204" height="13" rx="6"/><rect x="48" y="58" width="204" height="13" rx="6"/>`+[0,1,2,3,4,5,6,7,8].map(i=>`<line x1="${62+i*22}" y1="30" x2="${62+i*22}" y2="78" stroke-width="1.6"/>`).join(''))}];
 GUIDE.pages.push({id:'plans',t:'Plans',html:()=>`<h3>Plans</h3><p class="intro">Ways I have seen things built. They are only examples: anything that stands, stands. Hold a material and press <b>B</b>; <b>T</b> switches between the half-metre grid and free placing, <b>R</b> turns (Shift + R tilts), <b>[ ]</b> cut a post or a board shorter or longer, <b>F</b> changes the piece, the wheel sets the height. What you place without support falls and lies where it lands.</p>`+
   PL.map(p=>`<h5>${p.t}</h5>${p.svg}<p>${p.d}</p><p class="pencil">${p.need}</p>`).join('')});}
