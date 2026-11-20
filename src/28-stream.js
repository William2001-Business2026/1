/* ───────────────────────── streaming: living things built in chunks around you ─────────────────────────
   Grass, trees, plants, the reef and the animals' homes are not built over the whole island at load. Each system is a layer of
   square chunks; a chunk is built when the camera comes within the layer's radius and thrown away when it is well past it, so
   memory stays bounded however far you travel. The work is spread over frames: every frame the nearest waiting chunks are built,
   a little at a time (each build is a generator that yields often), within a few milliseconds. A chunk is seeded from its own
   coordinates, so the same tree stands in the same place every time you come back. Where things grow is asked of the shared
   ground truth only (heightAt, freshAt, masks, zoneAt, forestW, grassMask, riverQ, tnorm).
   Things fade in, never pop: each chunk's instances carry the time they were born and a root to measure distance from, and
   shaders dither them in over half a second and out toward the layer's edge (a screen-door pattern, the same in WebGPU and
   WebGL). Distances are measured from `uEye`, the player's camera, so the sun's shadow pass makes the same choices. */
const STREAM=(()=>{
  const layers=[],pending=[],uEye=TSL.uniform(new THREE.Vector3()),uNow=TSL.uniform(0);
  const stats={frameMs:0,maxMs:0,overBudget:0,hitches:[],built:0,dropped:0,frames:0};
  let budget=4,lastX=1e9,lastZ=1e9,boost=0;
  const hseed=(s,cx,cz)=>{let n=Math.imul(cx|0,73856093)^Math.imul(cz|0,19349663)^Math.imul(s|0,83492791);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))|0;};
  const near=(L,cx,cz,x,z)=>{const x0=cx*L.size,z0=cz*L.size,dx=Math.max(x0-x,0,x-x0-L.size),dz=Math.max(z0-z,0,z-z0-L.size);return Math.hypot(dx,dz);};
  // a layer: {name, size (m), seed, radius() (m, may follow quality), build(ch) a generator, dispose(ch), frame(x,z) each frame, prio (lower first)}
  const OFF=(new URLSearchParams(location.search).get('nostream')||'').split(',');  // for tests: ?nostream=trees,grass leaves those layers out
  function layer(o){const L=Object.assign({size:64,seed:1,prio:1,radius:()=>200,margin:12,chunks:new Map(),lx:1e9,lz:1e9,lr:0,built:0,dropped:0},o);if(OFF.includes(L.name))L.radius=()=>0;layers.push(L);return L;}
  function drop(ch){const L=ch.L;try{if(ch.state===2&&L.dispose)L.dispose(ch);else if(ch.state===1&&L.abort)L.abort(ch);}catch(e){console.warn('stream drop',L.name,e);}
    ch.state=-1;L.chunks.delete(ch.key);L.dropped++;stats.dropped++;}
  function scan(L,x,z){const R=L.radius(),keep=R+L.size*.5+L.margin;L.lx=x;L.lz=z;L.lr=R;
    const a=Math.floor((x-R)/L.size),b=Math.floor((x+R)/L.size),c=Math.floor((z-R)/L.size),d=Math.floor((z+R)/L.size);
    for(let cx=a;cx<=b;cx++)for(let cz=c;cz<=d;cz++){const k=cx+','+cz;if(L.chunks.has(k))continue;const dd=near(L,cx,cz,x,z);if(dd>R)continue;
      const ch={L,cx,cz,key:k,x0:cx*L.size,z0:cz*L.size,size:L.size,state:0,d:dd,it:null,R:rng(hseed(L.seed,cx,cz))};L.chunks.set(k,ch);pending.push(ch);}
    for(const ch of [...L.chunks.values()]){ch.d=near(L,ch.cx,ch.cz,x,z);if(ch.d>keep)drop(ch);}}
  function step(ch){const L=ch.L;if(!ch.it){ch.state=1;ch.it=L.build(ch);}
    let r;try{r=ch.it.next();}catch(e){console.warn('stream build',L.name,ch.key,e);r={done:true};ch.failed=true;}
    if(r.done){ch.state=2;ch.it=null;ch.born=uNow.value;L.built++;stats.built++;if(L.ready)L.ready(ch);return true;}return false;}
  return{layer,uEye,uNow,stats,layers,
    get budget(){return budget;},set budget(v){budget=v;},
    // build at least `ms` of work right now (used while the title screen loads, and by tests)
    prime(x,z,ms=1500){boost=ms;this.update(x,z);boost=0;},
    update(x,z){const t0=performance.now();uEye.value.set(x,camera.position.y,z);uNow.value=U.uTime.value;
      const moved=Math.hypot(x-lastX,z-lastZ);
      for(const L of layers){const R=L.radius();if(Math.hypot(x-L.lx,z-L.lz)>L.size*.2||Math.abs(R-L.lr)>.5)scan(L,x,z);}
      if(moved>.5){lastX=x;lastZ=z;for(const ch of pending)ch.d=near(ch.L,ch.cx,ch.cz,x,z);pending.sort((p,q)=>(p.d+p.L.prio*8)-(q.d+q.L.prio*8));}
      const lim=boost||budget;
      while(pending.length&&performance.now()-t0<lim){const ch=pending[0];if(ch.state<0){pending.shift();continue;}if(step(ch))pending.shift();}
      for(const L of layers)if(L.frame)L.frame(x,z);
      const ms=performance.now()-t0;stats.frameMs=ms;stats.frames++;if(ms>stats.maxMs)stats.maxMs=ms;
      if(!boost&&ms>budget*1.6){stats.overBudget++;stats.hitches.push([Math.round(uNow.value*10)/10,Math.round(ms*10)/10]);if(stats.hitches.length>40)stats.hitches.shift();}},
    counts(){const o={pending:pending.length};for(const L of layers){let n=0;for(const ch of L.chunks.values())if(ch.state===2)n++;o[L.name]={live:n,known:L.chunks.size,built:L.built,dropped:L.dropped};}return o;},
    // has every chunk within r of (x,z) been built, in every layer (or the one named)?
    settled(x,z,name){for(const L of layers){if(name&&L.name!==name)continue;for(const ch of L.chunks.values())if(ch.state!==2&&ch.d<L.radius()*.6)return false;}return true;},
    // the colliders a chunk adds: kept in the shared array while the chunk lives, taken out when it goes
    addCols(ch,list){ch.cols=list;for(const c of list){c._ch=ch;colliders.push(c);}if(typeof physTrunks==='function')physTrunks(ch,list,true);},
    dropCols(ch){if(!ch.cols||!ch.cols.length)return;let j=0;for(let i=0;i<colliders.length;i++){const c=colliders[i];if(c._ch!==ch)colliders[j++]=c;}colliders.length=j;
      if(typeof physTrunks==='function')physTrunks(ch,ch.cols,false);ch.cols=null;},
  };
})();
// the lanai and the arrival beach stay clear of plants (if this island has them)
function nearHome(x,z,r){try{if(typeof LANAI!=='undefined'&&Math.hypot(x-LANAI.x,z-LANAI.z)<r)return true;}catch(e){}return false;}
function nearStart(x,z,r){try{if(typeof START!=='undefined'&&Math.hypot(x-START.x,z-START.z)<r)return true;}catch(e){}return false;}
/* dithering: a per-pixel threshold (interleaved gradient noise) that turns a 0–1 fade into a pattern of kept and dropped pixels.
   Two versions of a thing cross-fade with no hole and no double where one keeps the pixels the other drops. */
const DITHER=(()=>{const {screenCoordinate,interleavedGradientNoise,step,float}=TSL;const ign=interleavedGradientNoise(screenCoordinate.xy);
  return{ign,keep:f=>step(ign,f),keepOther:f=>step(f,ign)};})();
