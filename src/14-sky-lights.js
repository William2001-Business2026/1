/* ───────────────────────── sky ───────────────────────── */
/* Shaders are written in TSL, Three.js's shading language. The same code compiles to WGSL for
   WebGPU and to GLSL for the WebGL 2 fallback, so both renderers draw the same island. */
const WK=6,WW=.7;
const {U,uRipplesNode,sstep,hash21,vn,fbmN,grey,skyBase,skyRad,wavePh,waveAmp,skyMat,envSkyMat,SKYU}=(()=>{
const {Fn,If,Loop,uniform,uniformArray,texture,float,vec2,vec3,dot,fract,floor,mix,clamp,max,pow,exp,sin,sqrt,length,normalize,step,atan,acos,dFdx,dFdy,positionLocal}=TSL;
const U={ // shared uniforms (same names and .value API as before)
  uTime:uniform(0),uSunDir:uniform(new THREE.Vector3(0,1,0)),uZenith:uniform(new THREE.Color()),uHorizon:uniform(new THREE.Color()),
  uGlow:uniform(new THREE.Color()),uSunDisc:uniform(new THREE.Color()),uCloud:uniform(new THREE.Color()),uStars:uniform(0),
  uFlash:uniform(0),uCover:uniform(0),uFlashDir:uniform(new THREE.Vector3()),uBio:uniform(0),uDay:uniform(1),uHeight:{value:null},
  uRipples:{value:Array.from({length:8},()=>new THREE.Vector3(0,0,-100))}
};
const uRipplesNode=uniformArray(U.uRipples.value,'vec3');
// smoothstep written out, so reversed edges (a > b) behave the same on every GPU and shading language
const sstep=(a,b,x)=>{const t=clamp(float(x).sub(a).div(float(b).sub(a)),0,1);return t.mul(t).mul(float(3).sub(t.mul(2)));};
const hash21=Fn(([p0])=>{const p=fract(p0.mul(vec2(123.34,456.21))).toVar();p.addAssign(dot(p,p.add(45.32)));return fract(p.x.mul(p.y));})
  .setLayout({name:'hash21',type:'float',inputs:[{name:'p0',type:'vec2'}]});
const hash31=Fn(([p0])=>{const p=fract(p0.mul(.3183099).add(.1)).mul(17).toVar();return fract(p.x.mul(p.y).mul(p.z).mul(p.x.add(p.y).add(p.z)));})
  .setLayout({name:'hash31',type:'float',inputs:[{name:'p0',type:'vec3'}]});
const vn=Fn(([p])=>{const i=floor(p),f0=fract(p),f=f0.mul(f0).mul(float(3).sub(f0.mul(2)));
  return mix(mix(hash21(i),hash21(i.add(vec2(1,0))),f.x),mix(hash21(i.add(vec2(0,1))),hash21(i.add(vec2(1,1))),f.x),f.y);})
  .setLayout({name:'vn',type:'float',inputs:[{name:'p',type:'vec2'}]});
const fbmN=Fn(([p0])=>{const p=vec2(p0).toVar(),a=float(.5).toVar(),s=float(0).toVar();
  Loop(5,()=>{s.addAssign(a.mul(vn(p)));p.assign(p.mul(2.03).add(17.1));a.mulAssign(.5);});return s;})
  .setLayout({name:'fbmN',type:'float',inputs:[{name:'p0',type:'vec2'}]});
const grey=(c)=>mix(c,vec3(dot(c,vec3(.33))).mul(.8),U.uCover.mul(.7));
const skyBase=Fn(([d])=>{const y=max(d.y,0),t=pow(float(1).sub(y),3.5);const c=mix(U.uZenith,U.uHorizon,t).toVar();const sd=max(dot(d,U.uSunDir),0);
  c.addAssign(U.uGlow.mul(pow(sd,7).mul(.22).mul(t.mul(.85).add(.15)).add(pow(sd,64).mul(.7).add(pow(sd,600).mul(1.2)).mul(float(1).sub(U.uFlash.mul(.85))))));
  return c;}); // inlined, not a WGSL function: uniforms inside setLayout() functions get mis-bound in this Three.js version
const wavePh=(p,d0)=>d0.mul(6).add(U.uTime.mul(.7)).add(vn(p.mul(.045)).mul(7));
const waveAmp=(d0)=>mix(.17,.03,sstep(0,3,d0));
const starLayer=Fn(([d,sc,th])=>{const p=d.mul(sc),ip=floor(p),fp=fract(p).sub(.5),h=hash31(ip);
  const o=vec3(hash31(ip.add(3.1)),hash31(ip.add(7.7)),hash31(ip.add(11.3))).sub(.5);const dist=length(fp.sub(o.mul(.6)));
  const tw=sin(U.uTime.mul(h.mul(5).add(2)).add(h.mul(90))).mul(.25).add(.75);
  return step(th,h).mul(sstep(.2,0,dist)).mul(fract(h.mul(91.7)).mul(.65).add(.35)).mul(tw);}); // inlined (uses a uniform)
/* Photographed skies (Poly Haven HDRIs, see assets/sky). Two are on the GPU at a time and cross-fade as the sun
   moves; each is turned so its own sun direction matches the game's sun, and scaled to the light level of the moment. */
const blank=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1);blank.magFilter=blank.minFilter=THREE.LinearFilter;blank.needsUpdate=true;
// each shader that shows the sky gets its own texture lookups (shared ones lose their sampler in this Three.js
// version); they are listed here so a sky swap reaches all of them
const skyLookups={A:[],B:[]},skyCurrent={A:blank,B:blank}; // shaders compiled later start from the current sky
const lookSky=(slot,uvq,gx,gy)=>{const t=texture(skyCurrent[slot],uvq),g=t.grad(gx,gy);skyLookups[slot].push(t,g);return g;};
const SKYU={setTex:(slot,tex)=>{skyCurrent[slot]=tex;for(const n of skyLookups[slot])n.value=tex;},mix:uniform(1),rotA:uniform(0),rotB:uniform(0),gainA:uniform(0),gainB:uniform(0),lightA:uniform(0),lightB:uniform(0),hdri:uniform(0)};
const skyHDR=(d,forLight)=>Fn(()=>{ // forLight: the brightness the island is lit with, rather than the brightness you see
  const phi=atan(d.z,d.x),th=acos(clamp(d.y,0,1)),v=float(1).sub(th.div(Math.PI/2));
  // texture gradients worked out from the view direction, so there is no seam where the panorama wraps around
  const dx=dFdx(d),dy=dFdy(d),r2=max(d.x.mul(d.x).add(d.z.mul(d.z)),1e-6),sn=max(sqrt(float(1).sub(d.y.mul(d.y))),1e-3);
  const gx=vec2(d.x.mul(dx.z).sub(d.z.mul(dx.x)).div(r2).div(2*Math.PI),dx.y.div(sn).div(Math.PI/2));
  const gy=vec2(d.x.mul(dy.z).sub(d.z.mul(dy.x)).div(r2).div(2*Math.PI),dy.y.div(sn).div(Math.PI/2));
  const uvA=vec2(fract(phi.add(SKYU.rotA).div(2*Math.PI).add(.5)),v),uvB=vec2(fract(phi.add(SKYU.rotB).div(2*Math.PI).add(.5)),v);
  const a=lookSky('A',uvA,gx,gy).rgb.mul(forLight?SKYU.lightA:SKYU.gainA),b=lookSky('B',uvB,gx,gy).rgb.mul(forLight?SKYU.lightB:SKYU.gainB);
  return mix(b,a,SKYU.mix);
})();
// sky radiance without stars or sun disc, for reflections and the distant haze
const skyRad=(d)=>grey(mix(skyBase(d),skyHDR(d,false),SKYU.hdri));
const skyColor=(withSun)=>Fn(()=>{
  const d=normalize(positionLocal).toVar();
  const c=skyBase(d).toVar();const sd=dot(d,U.uSunDir);
  // computed trade-wind clouds, only needed while the photographed sky is not fully shown (night)
  If(d.y.greaterThan(0).and(SKYU.hdri.lessThan(.999)),()=>{
    const p=d.xz.div(d.y.add(.12)).mul(1.25).add(vec2(U.uTime.mul(.004),U.uTime.mul(.0015)));
    const n=fbmN(p).add(fbmN(p.mul(3.1).add(4)).mul(.25));
    const a=sstep(float(.62).sub(U.uCover.mul(.5)),float(.92).sub(U.uCover.mul(.45)),n).mul(sstep(0,.1,d.y)).mul(sstep(1,float(.35).sub(U.uCover.mul(.35)),d.y));
    const ps=max(sd,0);
    const cc=U.uCloud.mul(pow(ps,3).mul(.9).add(.55)).add(U.uGlow.mul(pow(ps,8)).mul(.5)).mul(mix(1,.5,U.uCover));
    c.assign(mix(c,cc,a.mul(.82)));
  });
  c.assign(grey(mix(c,skyHDR(d,!withSun),SKYU.hdri)));
  // stars and Milky Way
  If(U.uStars.greaterThan(.001).and(d.y.greaterThan(-.02)),()=>{
    const mn=normalize(vec3(.42,.28,.86)),bq=dot(d,mn).div(.2),band=exp(bq.mul(bq).negate());
    const dust=fbmN(d.xy.mul(5).add(d.z.mul(3)));
    const s=starLayer(d,110,float(.988).sub(band.mul(.03))).add(starLayer(d,230,float(.984).sub(band.mul(.05))).mul(.5));
    const mw=vec3(.02,.022,.032).mul(band).mul(dust.mul(1.4).add(.3)).mul(sstep(.3,.75,dust.add(band.mul(.35))));
    c.addAssign(vec3(1,.96,.9).mul(s).mul(1.6).add(mw).mul(U.uStars).mul(sstep(-.02,.12,d.y)).mul(float(1).sub(U.uCover)));
  });
  if(withSun){
    // sun disc
    c.addAssign(U.uSunDisc.mul(sstep(Math.cos(.0165),Math.cos(.0145),sd)).mul(sstep(-.004,.004,d.y)));
    // green flash
    const fd=dot(d,U.uFlashDir),fc=sstep(Math.cos(.036),Math.cos(.012),fd);
    c.assign(mix(c,vec3(.05,1.7,.42),U.uFlash.mul(fc).mul(.95)).add(vec3(.01,.5,.13).mul(U.uFlash).mul(sstep(Math.cos(.17),Math.cos(.03),fd))));
  }
  return c;
});
const skyMat=new THREE.MeshBasicNodeMaterial({side:THREE.BackSide,depthWrite:false,fog:false});
skyMat.colorNode=skyColor(true)();
// the sky that lights the island: no sun disc (the sun's light comes from the sun lamp)
const envSkyMat=new THREE.MeshBasicNodeMaterial({side:THREE.BackSide,depthWrite:false,fog:false});
envSkyMat.colorNode=skyColor(false)();
return {U,uRipplesNode,sstep,hash21,vn,fbmN,grey,skyBase,skyRad,wavePh,waveAmp,skyMat,envSkyMat,SKYU};
})();
U.uWet=TSL.uniform(0);U.uSwell=TSL.uniform(0); // how wet the ground is after rain, and how swollen the river
U.uUnder=TSL.uniform(0);U.uFogCol=TSL.uniform(new THREE.Color()); // under water: 1 while the camera is below the surface, and the colour of the haze
const sky=new THREE.Mesh(new THREE.SphereGeometry(4800,48,24),skyMat);
sky.frustumCulled=false; sky.renderOrder=-10; scene.add(sky);
const envScene=new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),envSkyMat));
const pmrem=new THREE.PMREMGenerator(renderer); let envRT=null;
scene.environmentIntensity=.55;

/* ───────────────────────── lights ───────────────────────── */
const sun=new THREE.DirectionalLight(0xffffff,1); sun.castShadow=true;
sun.shadow.camera.left=-46;sun.shadow.camera.right=46;sun.shadow.camera.top=46;sun.shadow.camera.bottom=-46;
sun.shadow.camera.near=1;sun.shadow.camera.far=420;sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;
scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xffffff,0xffffff,1); scene.add(hemi);
const moon=new THREE.DirectionalLight(0x8ea4e6,0);moon.position.set(0,90,-60);scene.add(moon,moon.target);

