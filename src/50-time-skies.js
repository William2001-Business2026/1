/* ───────────────────────── time of day ───────────────────────── */
const KEYS=[ // elevation°, zenith, horizon, glow, cloud, sunColor, sunI, hemiI, day, exposure
  [66,[.06,.2,.6],[.42,.6,.84],[.9,.85,.75],[1,.97,.94],[1,.95,.86],4.6,1.5,1.05,.66],
  [35,[.075,.22,.6],[.46,.61,.82],[.95,.8,.6],[1,.94,.86],[1,.9,.74],6.2,1.7,1,.72],
  [14,[.09,.24,.60],[.50,.62,.80],[1,.74,.42],[1,.90,.78],[1,.82,.60],10,1.9,1,.80],
  [5,[.09,.19,.50],[.74,.56,.44],[1.1,.56,.18],[1,.66,.40],[1,.62,.32],7,1.4,.8,.86],
  [0,[.08,.13,.36],[.80,.38,.22],[1.4,.42,.07],[1,.40,.20],[1,.36,.12],2.6,.85,.5,.95],
  [-4,[.045,.07,.24],[.55,.22,.30],[1.0,.25,.14],[.60,.22,.30],[1,.4,.2],0,.42,.24,1.1],
  [-9,[.016,.028,.10],[.12,.07,.18],[.26,.08,.14],[.05,.04,.08],[1,.4,.2],0,.15,.08,1.35],
  [-18,[.003,.005,.016],[.009,.013,.028],[0,0,0],[.004,.005,.009],[1,.4,.2],0,.1,.03,1.7]];
function palette(e){
  let i=0;while(i<KEYS.length-2&&e<KEYS[i+1][0])i++;
  const a=KEYS[i],b=KEYS[i+1],t=clamp((a[0]-e)/(a[0]-b[0]),0,1),o=[];
  for(let k=1;k<a.length;k++)o.push(Array.isArray(a[k])?a[k].map((v,j)=>lerp(v,b[k][j],t)):lerp(a[k],b[k],t));
  return o;
}
const evening={s:0,running:false,elev:14,flashed:false};
function elevAt(s){
  if(s<.45)return lerp(14,.4,s/.45);
  if(s<.53)return lerp(.4,-1.3,(s-.45)/.08);
  if(s<.8)return lerp(-1.3,-12,(s-.53)/.27);
  return lerp(-12,-18,(s-.8)/.2);
}
let envElev=99;
/* ───────── photographed skies: loading, choosing and blending ─────────
   assets/sky/skies.json lists each sky with the range of sun elevations it covers (degrees), where its sun is
   (sunU, across the panorama), and how bright its sky is (Esky), so it can be scaled to the light of the moment. */
const SKIES=await fetch('assets/sky/skies.json').then(r=>r.ok?r.json():{skies:[]}).then(j=>j.skies||[]).catch(()=>[]);
const SKY_FADE=1.5,SKY_K=.45; // half-width of a cross-fade, degrees; overall sky brightness
const maxTex=(()=>{try{const b=renderer.backend;return b.isWebGPUBackend?b.device.limits.maxTextureDimension2D:b.gl.getParameter(b.gl.MAX_TEXTURE_SIZE);}catch(e){return 4096;}})();
const skyLowRes=maxTex<8192||(navigator.deviceMemory||8)<=4;
const skyTex=new Map();
function skyTexture(sk){
  let e=skyTex.get(sk.name);
  if(!e){e={tex:null};skyTex.set(sk.name,e);
    fetch('assets/sky/'+sk.name+'.jpg').then(r=>r.blob())
      .then(b=>createImageBitmap(b,{imageOrientation:'flipY',...(skyLowRes?{resizeWidth:4096,resizeHeight:1024,resizeQuality:'high'}:{})}))
      .then(bmp=>{if(skyTex.get(sk.name)!==e){bmp.close&&bmp.close();return;}
        const t=new THREE.Texture(bmp);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;
        t.anisotropy=8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;e.tex=t;applyTime(true);})
      .catch(err=>console.warn('Sky image '+sk.name+' did not load:',err));}
  return e.tex;
}
function pickSky(e,hI){
  const n=SKIES.length;if(!n){SKYU.hdri.value=0;return 0;}
  let A=SKIES.findIndex(sk=>e>=sk.lo);if(A<0)A=n-1;let B=A,t=1;
  for(let k=0;k<n-1;k++){const b=SKIES[k].lo;if(Math.abs(e-b)<SKY_FADE){A=k;B=k+1;t=smooth(b-SKY_FADE,b+SKY_FADE,e);break;}}
  // fetch the skies that are coming up, and let go of ones far from the current light
  SKIES.forEach((sk,i)=>{const dist=e>sk.hi?e-sk.hi:e<sk.lo?sk.lo-e:0;
    if(dist<4||i===A||i===B)skyTexture(sk);
    else if(dist>8&&skyTex.has(sk.name)){const c=skyTex.get(sk.name);if(c.tex)c.tex.dispose();skyTex.delete(sk.name);}});
  let ta=skyTexture(SKIES[A]),tb=skyTexture(SKIES[B]);
  if(!ta&&!tb){SKYU.hdri.value=0;return 0;}
  if(!ta){A=B;ta=tb;t=0;}if(!tb){B=A;tb=ta;t=1;}
  const phiSun=Math.atan2(U.uSunDir.value.z,U.uSunDir.value.x),K=Math.PI*hI*SKY_K;
  const set=(sk,slot)=>{SKYU.setTex(slot,skyTex.get(sk.name).tex);SKYU['rot'+slot].value=(sk.sunU-.5)*Math.PI*2-phiSun;
    const light=K*sk.scale/sk.Esky;SKYU['light'+slot].value=light;SKYU['gain'+slot].value=light*(sk.look||1);};
  set(SKIES[A],'A');set(SKIES[B],'B');SKYU.mix.value=t;
  const last=SKIES[n-1].lo,w=smooth(last-SKY_FADE,last+SKY_FADE,e); // below the last sky, the computed night sky takes over
  SKYU.hdri.value=w;return w;
}
let envBase=.55,hemiBase=1; // sky light before any dimming under water
function applyTime(force){
  let e,hx=SUN_AZ.x,hz=SUN_AZ.y;
  if(W.clock.phase==='day'){const u=W.clock.dayT,pk=season()?50:66;e=14+(pk-14)*Math.sin(Math.PI*u);const ph=(165+(48-165)*u)*DEG;hx=-Math.cos(ph);hz=Math.sin(ph);}else e=elevAt(evening.s);
  evening.elev=e;
  const [zen,hor,glow,cloud,sc,sI,hI,day,expo]=palette(e), er=e*DEG;
  U.uSunDir.value.set(hx*Math.cos(er),Math.sin(er),hz*Math.cos(er)).normalize();
  U.uZenith.value.setRGB(...zen);U.uHorizon.value.setRGB(...hor);U.uGlow.value.setRGB(...glow);U.uCloud.value.setRGB(...cloud);
  const vis=smooth(-1.0,.3,e);
  U.uSunDisc.value.setRGB(...sc).multiplyScalar((2.5+36*clamp(e/14,0,1))*vis);
  U.uStars.value=smooth(-4.5,-13,e); U.uDay.value=day;
  U.uFlash.value=smooth(-.25,-.6,e)*smooth(-1.15,-.8,e);
  const fe=.45*DEG; U.uFlashDir.value.set(SUN_AZ.x*Math.cos(fe),Math.sin(fe),SUN_AZ.y*Math.cos(fe));
  U.uBio.value=smooth(.86,.96,evening.s);
  sun.color.setRGB(...sc); sun.intensity=sI; sunBase=sI; sun.castShadow=settings.shadows&&sI>.05;
  hemi.color.setRGB(...zen).lerp(new THREE.Color(...hor),.55); hemi.groundColor.setRGB(hor[0]*.5+.1*day,hor[1]*.45+.08*day,hor[2]*.4+.05*day);
  const hw=pickSky(e,hI); // with a photographed sky, the sky itself lights the island instead of the flat hemisphere light
  hemi.intensity=hemiBase=hI*(1-hw); scene.environmentIntensity=envBase=.55+.45*hw;
  {const nt=smooth(-3,-11,e);moon.intensity=.32*nt;moon.color.setRGB(.55,.64,.9);moon.position.set(-hx*60,90,-hz*60);  // moonlight: cool, from high in the east, so night is dark but readable
   if(nt>0){hemi.intensity=hemiBase=Math.max(hemiBase,.14*nt);hemi.color.lerp(new THREE.Color(.45,.55,.85),nt*.6);}}
  renderer.toneMappingExposure=expo;
  farMat.color.setRGB(...hor).lerp(new THREE.Color(...zen),.45).multiplyScalar(.8);
  if(force)sun.shadow.needsUpdate=true;
  if(force||Math.abs(e-envElev)>.6){envElev=e;const n=pmrem.fromScene(envScene,0,1,300);if(envRT)envRT.dispose();envRT=n;scene.environment=n.texture;}
}

