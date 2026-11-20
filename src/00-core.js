import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { mergeVertices as mergeVerts } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode.js';

const showErr=m=>{const el=document.getElementById('err');el.style.display='block';el.textContent='Error: '+m;};
window.addEventListener('error',e=>showErr(e.message));
window.addEventListener('unhandledrejection',e=>showErr((e.reason&&e.reason.message)||String(e.reason)));

/* ───────────────────────── utilities ───────────────────────── */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const DEG=Math.PI/180;
let FLORA_NEAR=48; // metres within which trees are drawn at full detail; quality lowers it
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=rng(20261116);
function h2(ix,iz){let n=Math.imul(ix,374761393)+Math.imul(iz,668265263);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967295;}
function vnoise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  return lerp(lerp(h2(ix,iz),h2(ix+1,iz),u),lerp(h2(ix,iz+1),h2(ix+1,iz+1),u),v);}
function fbm(x,z,o=4){let a=.5,s=0,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,z*f);f*=2.03;a*=.5;}return s;}
const srgb=(r,g,b)=>new THREE.Color().setRGB(r,g,b,THREE.SRGBColorSpace);

/* ───────────────────────── settings ───────────────────────── */
const settings={quality:'auto',showFps:false,view:'third',scale:1,shadows:true,post:true,fov:70,master:.8,amb:.8,music:.5,sens:1,invertY:false,bob:true,photo:false};
try{const saved=JSON.parse(localStorage.getItem('halemoku')||'{}');if(!saved.v)delete saved.quality;Object.assign(settings,saved);}catch(e){}
settings.v=2;
// physics state (the Rapier world itself is set up near the end of this script); declared early because loading a save already touches it
const PHYS={ready:false,R:null,world:null,bodies:new Map(),acc:0,pieceCols:[],me:null};
const PHYS_KINDS=new Set(['coco','bino','uke']);
const FLOATS=new Set(['coconut','log','plank','frond','bamboo','fibre','stick','seaweed','cocomeat','basket','crate','barrel','shellstring','mat','fishtrap']);

settings.photo=false;
const saveSettings=()=>{try{localStorage.setItem('halemoku',JSON.stringify(settings));}catch(e){}};

/* ───────────────────────── renderer ───────────────────────── */
// WebGPU where the browser supports it. Elsewhere Three.js falls back to WebGL 2 by itself, running the same shaders.
// Add ?renderer=webgl to the address to force the fallback.
const canvas=document.getElementById('c'),fpsEl=document.getElementById('fps');
const FORCE_GL=/[?&]renderer=webgl\b/.test(location.search);
const renderer=new THREE.WebGPURenderer({canvas,antialias:false,powerPreference:'high-performance',forceWebGL:FORCE_GL,reversedDepthBuffer:true}); // reversed depth: the island is seen from 5 cm to 200 km
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
await renderer.init();
const GFX_API=renderer.backend.isWebGPUBackend?'WebGPU':'WebGL 2';
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(settings.fov,16/9,.05,12000);
camera.rotation.order='YXZ'; scene.add(camera);

/* post-processing: scene → ambient occlusion (High only) → bloom → tone mapping → colour grade and film grain */
const post=new THREE.RenderPipeline(renderer); post.outputColorTransform=false;
const scenePass=TSL.pass(scene,camera,{samples:4});
const postU={uTime:TSL.uniform(0),uGrain:TSL.uniform(.035),uVig:TSL.uniform(.55),uUnder:TSL.uniform(0),uLookUp:TSL.uniform(0)};
let aoNode=null,aoClean=null,bloomNode=null,postKey='';
const gradeFn=(()=>{const {Fn,float,vec3,vec4,dot,mix,fract,hash,screenUV,screenCoordinate,sin,pow,max}=TSL;
  return Fn(([c])=>{const q=screenUV.sub(.5),k=c.rgb.mul(float(1).sub(dot(q,q).mul(postU.uVig))).toVar();
    // under water: red light is the first to go, and shafts of sunlight slant down from the surface
    const t=postU.uTime,x=screenUV.x,xs=x.add(screenUV.y.mul(.28)),rays=pow(max(sin(xs.mul(23).add(sin(xs.mul(7).add(t.mul(.3))).mul(2.6)).add(t.mul(.2))),0),4).mul(float(1).sub(screenUV.y).pow(1.5)).mul(postU.uLookUp).mul(.05);
    k.assign(mix(k,k.mul(vec3(.6,.9,1.05)).add(vec3(.55,.85,.9).mul(rays)),postU.uUnder));
    k.assign(mix(vec3(dot(k,vec3(.299,.587,.114))),k,1.1));k.assign(mix(k,k.mul(k).mul(float(3).sub(k.mul(2))),.3));
    const n=hash(screenCoordinate.x.floor().add(screenCoordinate.y.floor().mul(4099)).add(fract(postU.uTime).mul(611953).floor()));
    return vec4(k.add(n.sub(.5).mul(postU.uGrain)),c.a);});})();
function buildPost(g){
  // ambient occlusion has to read the depth buffer, which WebGPU cannot do from a multisampled one,
  // so with AO the scene renders without MSAA and is smoothed with FXAA after tone mapping instead
  const samples=g.ao?0:g.aa,useFxaa=g.ao&&g.aa>0;
  const key=[g.ao,g.bloom,g.grade,samples,useFxaa].join();if(key===postKey)return;postKey=key;
  const {vec4}=TSL;
  scenePass.options.samples=samples;
  const col=scenePass.getTextureNode('output');let hdr=col;
  if(g.ao){
    if(!aoNode){const depth=scenePass.getTextureNode('depth');
      aoNode=ao(depth,null,camera);aoNode.resolutionScale=.5;
      aoNode.radius.value=.55;aoNode.distanceExponent.value=1.4;aoNode.thickness.value=1.3;aoNode.scale.value=1.15;aoNode.samples.value=8;
      aoClean=denoise(aoNode.getTextureNode(),depth,null,camera);
      for(const [k,v] of [['lumaPhi',10],['depthPhi',2],['normalPhi',3],['radius',4]])if(aoClean[k]&&'value' in aoClean[k])aoClean[k].value=v;}
    hdr=vec4(col.rgb.mul(aoClean.r),col.a);
  }
  if(g.bloom){if(!bloomNode)bloomNode=bloom(col,.32,.7,1.15);hdr=hdr.add(bloomNode);}
  let out=TSL.renderOutput(hdr);
  if(useFxaa)out=fxaa(out);
  if(g.grade)out=gradeFn(out);
  post.outputNode=out;post.needsUpdate=true;
}

/* ───────────────────────── frame rate and resolution ─────────────────────────
   Target: 1920×1080, 16:9, 60 FPS, never below 30.
   - The canvas is always 16:9, letterboxed to fit the window.
   - The 3D view renders at most 1920×1080 pixels, whatever the screen or pixel density.
   - Frames are capped at 60 per second, so 120 Hz and 144 Hz screens do not do double the work.
   - On Auto, quality steps down when the frame rate drops and back up when there is headroom. */
const PRESETS={ // aa: MSAA samples (WebGPU allows 1 or 4); shadowEvery: redraw the sun's shadow map every n frames
  low:   {scale:.75,shadow:1024,shadowEvery:3,aa:0,ao:false,bloom:false,grass:.35,lantern:false},
  medium:{scale:1,  shadow:2048,shadowEvery:2,aa:4,ao:false,bloom:true, grass:.7, lantern:false},
  high:  {scale:1,  shadow:2048,shadowEvery:1,aa:4,ao:true, bloom:true, grass:1,  lantern:true,csm:true} // csm: three cascaded 2048 px shadow maps out to 140 m
};
const AUTO_LEVELS=[ // best first; Auto starts at Medium
  {...PRESETS.high,name:'High'},
  {...PRESETS.medium,name:'Medium'},
  {...PRESETS.medium,scale:.85,name:'Medium, 85%'},
  {...PRESETS.medium,scale:.7,aa:0,name:'Medium, 70%'},
  {...PRESETS.low,name:'Low'},
  {...PRESETS.low,scale:.6,name:'Low, 60%'},
  {...PRESETS.low,scale:.5,name:'Low, 50%'}
];
const TARGET_FPS=60,MIN_FPS=30,FRAME_MS=1000/TARGET_FPS,MAX_W=1920,MAX_H=1080;
const perf={level:1,fps:0,prevFps:0,frames:0,windowStart:0,goodSince:0,settleUntil:0,lastUp:{level:-1,at:-1e9},blocked:{},fails:{},
  dropFrom:null,ceiling:TARGET_FPS,nextT:0,shadowTick:0,shotCell:''};
function activeGfx(){return settings.quality==='auto'?AUTO_LEVELS[perf.level]:{...PRESETS[settings.quality],name:settings.quality[0].toUpperCase()+settings.quality.slice(1)};}
function setAutoLevel(l,now){
  l=clamp(l,0,AUTO_LEVELS.length-1);if(l===perf.level)return;
  if(l<perf.level)perf.lastUp={level:l,at:now};
  perf.level=l;perf.prevFps=0;perf.goodSince=now;perf.settleUntil=now+2500;applyGraphics();
}
function showFps(){
  if(!fpsEl.classList.contains('on'))return;
  const g=activeGfx(),sc=Math.round(clamp(g.scale*settings.scale,.4,1)*100);
  fpsEl.textContent=`${Math.round(perf.fps)} FPS · ${GFX_API} · ${canvas.width}×${canvas.height}${sc<100?' @ '+sc+'%':''} · ${settings.quality==='auto'?'Auto: '+g.name:g.name}`;
}
// Called once per drawn frame. Judges the frame rate over one-second windows.
function perfTick(now){
  if(!perf.windowStart){perf.windowStart=now;perf.goodSince=now;return;}
  perf.frames++;
  const span=now-perf.windowStart;if(span<1000)return;
  const fps=perf.frames*1000/span;perf.frames=0;perf.windowStart=now;
  if(span>2500||document.hidden){perf.prevFps=0;perf.goodSince=now;return;} // the tab was hidden or the page stalled: not a fair sample
  const prev=perf.prevFps;perf.prevFps=fps;perf.fps=fps;showFps();
  if(settings.quality!=='auto'||now<perf.settleUntil)return;
  const target=Math.min(TARGET_FPS,perf.ceiling),slow=target*.85;
  if(perf.dropFrom){const d=perf.dropFrom;perf.dropFrom=null;
    // lowering quality did not raise the frame rate, so the screen's refresh rate is the limit, not the GPU: go back
    if(fps<d.fps+3&&d.fps>=MIN_FPS){perf.ceiling=Math.max(MIN_FPS,Math.floor(d.fps));setAutoLevel(d.level,now);return;}}
  if(prev&&prev<slow&&fps<slow){ // two slow seconds in a row
    if(perf.lastUp.level===perf.level&&now-perf.lastUp.at<8000){ // a step up that did not hold: wait 1, 2, 4… minutes before trying it again
      const n=perf.fails[perf.level]=(perf.fails[perf.level]||0)+1;perf.blocked[perf.level]=now+60000*Math.pow(2,Math.min(n-1,4));}
    const worst=Math.max(fps,prev);perf.dropFrom={level:perf.level,fps:worst};
    setAutoLevel(perf.level+(worst<MIN_FPS?2:1),now);return;}
  if(fps<slow){perf.goodSince=now;return;}
  if(fps>=target*.95&&perf.level>0&&now-perf.goodSince>8000&&!((perf.blocked[perf.level-1]||0)>now))setAutoLevel(perf.level-1,now); // 8 smooth seconds: try one step better
}
function sizeRenderer(){
  // the canvas CSS keeps it 16:9 and centred; render at the screen's pixel density, but never above 1920×1080
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  const pr=Math.min(devicePixelRatio||1,MAX_W/w,MAX_H/h);
  renderer.setPixelRatio(pr);renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
}

