/* ───────────────────────── time of day ───────────────────────── */
const KEYS=[ // elevation°, zenith, horizon, glow, cloud, sunColor, sunI, hemiI, day, exposure
  [66,[.06,.2,.6],[.42,.6,.84],[.9,.85,.75],[1,.97,.94],[1,.95,.86],4.6,1.5,1.05,.66],
  [35,[.075,.22,.6],[.46,.61,.82],[.95,.8,.6],[1,.94,.86],[1,.9,.74],6.2,1.7,1,.72],
  [14,[.09,.24,.60],[.50,.62,.80],[1,.74,.42],[1,.90,.78],[1,.80,.56],13,1.35,1,.80],
  [5,[.09,.19,.50],[.74,.56,.44],[1.1,.56,.18],[1,.66,.40],[1,.6,.3],11,.95,.8,.86],
  [0,[.08,.13,.36],[.80,.38,.22],[1.4,.42,.07],[1,.40,.20],[1,.36,.12],4,.7,.5,.95],
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
/* ───────── the sky clock: a real sun and moon over Waipiʻo ─────────
   Time runs at the pace of the big open-world games: 30 game seconds a second, so a day is 48 minutes. The sun is placed
   by the NOAA solar equations for 20.1° N, 155.6° W on the game's date (the year turns with W.day, from 20 November), and the moon by
   a low-precision lunar theory (about a degree), so they rise, cross and set where they really would; the moon's phase comes from
   the angle between them. Everything else (sky, light, shadows, water, the evening's events) reads this one clock. */
const SKYCLOCK=(()=>{
  const LAT=20.12*DEG,LON=-155.59,TZ=-10,RATE=30,EPOCH=Date.UTC(2026,10,20,10),J2000=Date.UTC(2000,0,1,12);
  const st={sunEl:14,sunAz:250,moonEl:-30,moonAz:90,illum:.5,dir:new THREE.Vector3(),light:new THREE.Vector3(),moonDir:new THREE.Vector3()};
  const r=Math.PI/180,norm=a=>((a%360)+360)%360;
  function altAz(ra,dec,lst){const H=(lst-ra)*r,el=Math.asin(Math.sin(LAT)*Math.sin(dec*r)+Math.cos(LAT)*Math.cos(dec*r)*Math.cos(H));
    const az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(LAT)-Math.tan(dec*r)*Math.cos(LAT))/r+180;return[el/r,norm(az)];}
  function compute(day,h){ // h: local hours (HST)
    const t=EPOCH+(day*24+h)*3600e3,d=(t-J2000)/864e5,ob=23.439-4e-7*d;
    const Ls=norm(280.46+.9856474*d),Ms=norm(357.528+.9856003*d)*r,lamS=Ls+1.915*Math.sin(Ms)+.02*Math.sin(2*Ms);  // the sun's ecliptic longitude
    const raS=Math.atan2(Math.cos(ob*r)*Math.sin(lamS*r),Math.cos(lamS*r))/r,decS=Math.asin(Math.sin(ob*r)*Math.sin(lamS*r))/r;
    const lst=norm(280.46061837+360.98564736629*d+LON);
    [st.sunEl,st.sunAz]=altAz(raS,decS,lst);
    const L=norm(218.316+13.176396*d),M=norm(134.963+13.064993*d)*r,F=norm(93.272+13.22935*d)*r,D=norm(297.85+12.190749*d)*r;
    const lam=L+6.289*Math.sin(M)-1.274*Math.sin(M-2*D)+.658*Math.sin(2*D),bet=5.128*Math.sin(F);         // the moon's, with its biggest wobbles
    const x=Math.cos(bet*r)*Math.cos(lam*r),y=Math.cos(ob*r)*Math.cos(bet*r)*Math.sin(lam*r)-Math.sin(ob*r)*Math.sin(bet*r),z=Math.sin(ob*r)*Math.cos(bet*r)*Math.sin(lam*r)+Math.cos(ob*r)*Math.sin(bet*r);
    [st.moonEl,st.moonAz]=altAz(Math.atan2(y,x)/r,Math.asin(z)/r,lst);
    st.illum=(1-Math.cos((lam-lamS)*r))/2;                                                               // 0 new moon, 1 full
    const v=(el,az,o)=>o.set(Math.sin(az*r)*Math.cos(el*r),Math.sin(el*r),-Math.cos(az*r)*Math.cos(el*r)); // +x east, −z north
    v(st.sunEl+(st.sunEl>-1?.5*Math.exp(-st.sunEl/2.5):0),st.sunAz,st.dir);v(st.moonEl,st.moonAz,st.moonDir); // a touch of refraction lifts the sun at the horizon
    return st;}
  // the hour (afternoon or morning) when the sun stands at a given height today, for the time presets
  function hourAt(el,afternoon){let a=afternoon?12:4,b=afternoon?20:12;for(let i=0;i<40;i++){const m=(a+b)/2;compute(W.day,m);const up=st.sunEl>el;if(afternoon?up:!up)a=m;else b=m;}const h=(a+b)/2;compute(W.day,W.clock.h);return h;}
  function derive(){const c=W.clock,e=st.sunEl;compute(W.day,c.h);                                       // the old phase flags, from the real sun
    c.phase=st.sunEl<-6?'night':c.h>=12&&st.sunEl<14?'golden':'day';evening.elev=st.sunEl;
    const before=evening.s;evening.s=clamp((14-st.sunEl)/32,0,1);return before;}
  return{st,RATE,compute,derive,hourAt,
    tick(dt){const c=W.clock,before=evening.s;c.h+=dt*RATE/3600*(c.fast?40:1);
      if(c.h>=24){c.h-=24;W.day++;if(typeof dayTurned==='function')dayTurned();}
      derive();
      if(c.h>=12){if(AU.ctx&&before<.08&&evening.s>=.08)AU.radioDuck.gain.setTargetAtTime(0,AU.ctx.currentTime,1.3);if(before<.08&&evening.s>=.08)radio.mode=0;
        if(before<.9&&evening.s>=.9)toast('The surf is glowing.',6);}},
    label(){const h=W.clock.h,hh=Math.floor(h),mm=Math.floor((h-hh)*60),ap=hh<12?'am':'pm',h12=((hh+11)%12)+1;return h12+':'+String(mm).padStart(2,'0')+' '+ap;}};
})();
function elevAt(s){
  if(s<.45)return lerp(14,.4,s/.45);
  if(s<.53)return lerp(.4,-1.3,(s-.45)/.08);
  if(s<.8)return lerp(-1.3,-12,(s-.53)/.27);
  return lerp(-12,-18,(s-.8)/.2);
}
let envElev=99;const EXPO={base:1};
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
  SKYCLOCK.derive();const S=SKYCLOCK.st,e=S.sunEl,hl=Math.hypot(S.dir.x,S.dir.z)||1,hx=S.dir.x/hl,hz=S.dir.z/hl;
  const [zen,hor,glow,cloud,sc,sI,hI,day,expo]=palette(e);
  U.uSunDir.value.copy(S.dir).normalize();U.uMoonDir.value.copy(S.moonDir);
  U.uMoonL.value=smooth(-1,3,S.moonEl)*(.15+.85*S.illum);
  U.uZenith.value.setRGB(...zen);U.uHorizon.value.setRGB(...hor);U.uGlow.value.setRGB(...glow);U.uCloud.value.setRGB(...cloud);
  const vis=smooth(-1.0,.3,e);
  U.uSunDisc.value.setRGB(...sc).multiplyScalar((2.5+36*clamp(e/14,0,1))*vis);
  U.uStars.value=smooth(-4.5,-13,e); U.uDay.value=day;
  U.uFlash.value=smooth(-.25,-.6,e)*smooth(-1.15,-.8,e);
  const fe=.45*DEG; U.uFlashDir.value.set(SUN_AZ.x*Math.cos(fe),Math.sin(fe),SUN_AZ.y*Math.cos(fe));
  U.uBio.value=smooth(.86,.96,evening.s);
  // the lamp that casts the shadows is the sun by day and the moon by night (moonlight casts real, soft, cool shadows)
  const moonI=.55*S.illum*smooth(1,14,S.moonEl)*smooth(-3,-9,e);
  if(sI>.02||moonI<.01){sun.color.setRGB(...sc);sun.intensity=sI;S.light.copy(S.dir);}
  else{sun.color.setRGB(.6,.68,.95);sun.intensity=moonI;S.light.copy(S.moonDir);}
  sunBase=sun.intensity;sun.castShadow=shadowsOn()&&sun.intensity>.02;
  hemi.color.setRGB(...zen).lerp(new THREE.Color(...hor),.55); hemi.groundColor.setRGB(hor[0]*.5+.1*day,hor[1]*.45+.08*day,hor[2]*.4+.05*day);
  const hw=pickSky(e,hI); // with a photographed sky, the sky itself lights the island instead of the flat hemisphere light
  hemi.intensity=hemiBase=hI*(1-hw); scene.environmentIntensity=envBase=.55+.45*hw;
  {const nt=smooth(-3,-11,e),mf=.35+.65*S.illum*smooth(-2,10,S.moonEl);moon.intensity=.12*nt*mf;moon.color.setRGB(.55,.64,.9);moon.position.copy(S.moonDir).multiplyScalar(90); // the night sky's own glow; darker on a moonless night
   if(nt>0){hemi.intensity=hemiBase=Math.max(hemiBase,.14*nt*mf);hemi.color.lerp(new THREE.Color(.45,.55,.85),nt*.6);}}
  renderer.toneMappingExposure=EXPO.base=expo;
  farMat.color.setRGB(...hor).lerp(new THREE.Color(...zen),.45).multiplyScalar(.8);
  if(force)sun.shadow.needsUpdate=true;
  if(force||Math.abs(e-envElev)>.6){envElev=e;const n=pmrem.fromScene(envScene,0,1,300);if(envRT)envRT.dispose();envRT=n;scene.environment=n.texture;}
}

