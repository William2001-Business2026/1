/* ───────── atmosphere: sun shafts, light off the ground, fog in the valleys ─────────
   - Sun shafts (00-core's god rays): fed each frame with where the sun is on screen and how strongly to draw them: facing the
     sun, low sun stronger, cloud and the lava tube shut them off.
   - Light off the ground: the sky light's lower half takes the colour of what is under you and how brightly the sun lights it,
     so you are lit warm from below on sunlit sand, green over grass, dim under the forest: a cheap stand-in for bounced light.
   - Fog banks: soft layers that lie over the low ground near you at dawn and after rain, drift with the wind, and thin out as
     you walk into them, so they read as banks from a distance and as haze inside. */
const ATMOS=(()=>{
  const V=new THREE.Vector3(),F=new THREE.Vector3(),ALB=new THREE.Color(),G=new THREE.Color();let bT=0;
  const albedo=(x,z)=>{if(TUBE.inside(x,z,camera.position.y-1.6))return ALB.setRGB(.05,.045,.04);const s=surfaceAt(x,z);
    if(s==='water')return ALB.setRGB(.05,.11,.11);if(s==='wood')return ALB.setRGB(.42,.32,.22);if(forestW(x,z)>.35)return ALB.setRGB(.12,.13,.07);
    if(s==='grass')return ALB.setRGB(.22,.3,.12);if(s==='sand')return heightAt(x,z)<4?ALB.setRGB(.2,.18,.15):ALB.setRGB(.5,.42,.3);return ALB.setRGB(.1,.095,.09);};
  // fog banks: a few soft sheets in stacks
  const tex=canvasTex(256,256,(c,w,h)=>{const r=rng(5);c.clearRect(0,0,w,h);for(let i=0;i<70;i++){const x=w*(.15+.7*r()),y=h*(.15+.7*r()),R=20+r()*55,g=c.createRadialGradient(x,y,0,x,y,R);
    g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);}});
  const fogMat=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,fog:true,side:THREE.DoubleSide});
  const uFog=TSL.uniform(0),uFogC=TSL.uniform(new THREE.Color(.8,.82,.84));
  {const {texture,uv,vec4,positionWorld,cameraPosition,length,float,smoothstep,vec2}=TSL,q=uv(),drift=vec2(U.uTime.mul(.004),U.uTime.mul(.0025));
   const a=texture(tex,q.add(drift)).a.mul(texture(tex,q.mul(1.7).sub(drift.mul(1.4))).a.mul(1.6)).mul(smoothstep(0,.25,q.x).mul(smoothstep(1,.75,q.x)).mul(smoothstep(0,.25,q.y)).mul(smoothstep(1,.75,q.y)));
   const near=smoothstep(4,22,length(positionWorld.xz.sub(cameraPosition.xz)));      // thin out as you walk into it
   fogMat.colorNode=vec4(uFogC,a.mul(uFog).mul(near).mul(2.2));}
  // each bank: upright soft puffs spread over a hollow, turned to face you, low and wide, so it reads as a volume from the ground
  const puff=new THREE.PlaneGeometry(1,1).translate(0,.5,0),banks=[],R5=rng(77);
  for(let i=0;i<5;i++){const g=new THREE.Group();for(let k=0;k<14;k++){const m=new THREE.Mesh(puff,fogMat),w=14+R5()*14;m.scale.set(w,3+R5()*4,1);
      m.position.set((R5()-.5)*55,-.5+R5()*2.5,(R5()-.5)*55);m.renderOrder=3;m.frustumCulled=false;m.raycast=()=>{};g.add(m);}
    g.visible=false;scene.add(g);banks.push({g,x:0,z:0,t:-1});}
  let fogK=0;
  /* cloud shadows: fair-weather trade cumulus about a kilometre up drift over the island with the wind, each throwing a soft
     shadow a few hundred metres across, more of them and larger as the sky clouds over before rain. The sun's own colour is
     varied across the ground (the shadow is cast along the sun's direction from the cloud layer), so every lit surface gets
     them, with or without shadow maps. sunC carries the sun's colour times its intensity, which a light's own colour node replaces. */
  const sunC=TSL.uniform(new THREE.Color()),uCS=TSL.uniform(1);
  {const {Fn,positionWorld,vec2,float,max}=TSL;
   sun.colorNode=Fn(()=>{const sd=U.uSunDir,lift=float(950).div(max(sd.y,.12));
     const p=positionWorld.xz.add(vec2(sd.x,sd.z).mul(lift)).sub(WIND.dir.mul(U.uTime.mul(7)));      // cloud base 950 m, drifting ~7 m/s
     const n=vn(p.mul(1/260)).mul(.65).add(vn(p.mul(1/90).add(17)).mul(.35)),th=float(.55).sub(U.uCover.mul(.25));
     return sunC.mul(float(1).sub(sstep(th,th.add(.16),n).mul(.68).mul(uCS)));})();}
  const cloudAt=(x,z)=>{const sd=U.uSunDir.value,l=950/Math.max(sd.y,.12),t=U.uTime.value*7,wd=WIND.dir.value,px=x+sd.x*l-wd.x*t,pz=z+sd.z*l-wd.y*t;   // the same, on the CPU
    const n=vnC(px/260,pz/260)*.65+vnC(px/90+17,pz/90+17)*.35,th=.55-U.uCover.value*.25;return smooth(th,th+.16,n)*.68*uCS.value;};
  function light(){sunC.value.copy(sun.color).multiplyScalar(sun.intensity);uCS.value=1-.6*U.uCover.value;}   // every frame, before the render
  function placeBank(b){const c=camera.position;for(let t=0;t<12;t++){const a=Math.random()*6.283,d=25+Math.random()*120,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,h=heightAt(x,z);
      if(h<1)continue;let lower=0;for(let j=0;j<6;j++){const aa=j*1.047;if(heightAt(x+Math.cos(aa)*40,z+Math.sin(aa)*40)>h+4)lower++;}   // a hollow: higher ground round it
      if(lower<3&&h>40)continue;b.x=x;b.z=z;b.y=h;b.t=0;b.life=90+Math.random()*120;b.g.position.set(x,h,z);b.g.visible=true;return;}b.g.visible=false;}
  function tick(dt){
    const c=camera.position,sd=U.uSunDir.value,cave=TUBE.st.cave,und=U.uUnder.value;
    // sun shafts
    V.copy(c).addScaledVector(sd,1000).project(camera);camera.getWorldDirection(F);const face=F.dot(sd),onScr=Math.abs(V.x)<1.6&&Math.abs(V.y)<1.6&&V.z<1;
    GR.sun.value.set(V.x*.5+.5,V.y*.5+.5);
    const want=onScr&&face>0&&sd.y>-.03?smooth(.2,.75,face)*(.45+.55*smooth(.55,.05,sd.y))*(1-.75*U.uCover.value)*(1-cave)*(und?0:1)*Math.min(1,sun.intensity/2):0;
    GR.k.value=lerp(GR.k.value,want,1-Math.exp(-dt*3));if(window.__grk!=null)GR.k.value=window.__grk;GR.col.value.copy(sun.color);
    // light off the ground
    if((bT-=dt)<=0&&hemi.userData.g0){bT=.25;const A=albedo(c.x,c.z),lit=Math.min(1,sun.intensity/3)*(1-cave);
      G.copy(hemi.userData.g0).multiplyScalar(.55).add(new THREE.Color(A.r*(.6+2.4*lit),A.g*(.6+2.4*lit),A.b*(.6+2.4*lit)));hemi.userData.gWant=G.clone();}
    if(settings.gi&&settings.post){if(hemi.userData.g0)hemi.groundColor.copy(hemi.userData.g0);}else if(hemi.userData.gWant)hemi.groundColor.lerp(hemi.userData.gWant,1-Math.exp(-dt*2));   // with true bounced light on, no stand-in
    // fog: thick at dawn and after rain, a little in the evening, none at midday; fog colour follows the sky
    const h=W.clock.h,dawn=smooth(4.6,6.2,h)*smooth(9.2,7.4,h),eve=smooth(17,19,h)*smooth(23,20.5,h)*.35,wet=Math.max(typeof raining!=='undefined'?raining:0,(W.rainLeft>0?.6:0));
    fogK=lerp(fogK,Math.min(1,dawn*.9+eve+wet*.7)*(cave>.2?0:1)*(und?0:1)*(activeGfx().grass<.2?.6:1),1-Math.exp(-dt*.3));if(window.__fogk!=null)fogK=window.__fogk;uFog.value=fogK;
    if(scene.fog)uFogC.value.copy(scene.fog.color).lerp(new THREE.Color(1,1,1),.25*U.uDay.value);
    const wd=WIND.dir.value;for(const b of banks){if(fogK<.03){b.g.visible=false;b.t=-1;continue;}
      if(b.t<0||b.t>b.life||Math.hypot(b.x-c.x,b.z-c.z)>200)placeBank(b);b.t+=dt;b.x+=wd.x*dt*.6;b.z+=wd.y*dt*.6;
      const life=window.__fogk!=null?1:smooth(0,15,b.t)*smooth(b.life,b.life-15,b.t);b.g.position.set(b.x,b.y,b.z);b.g.scale.setScalar(.8+.4*life);for(const m of b.g.children){m.visible=life>.02;m.rotation.y=Math.atan2(c.x-b.x-m.position.x,c.z-b.z-m.position.z);}}}
  return{tick,light,cloudAt,get fog(){return fogK;}};
})();
