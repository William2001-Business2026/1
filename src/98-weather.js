/* ───────── weather ───────── */
let raining=0,sunBase=1;
const rainN=900,rainPos=new Float32Array(rainN*6),rainSeed=new Float32Array(rainN*3);
for(let i=0;i<rainN;i++){rainSeed[i*3]=(Math.random()-.5)*18;rainSeed[i*3+1]=Math.random()*10;rainSeed[i*3+2]=(Math.random()-.5)*18;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainMesh=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xcfd8e0,transparent:true,opacity:0,depthWrite:false}));rainMesh.frustumCulled=false;rainMesh.visible=false;scene.add(rainMesh);
function updateWeather(dt){
  if(state==='play'&&!evening.running&&W.clock.phase!=='night'){
    if(W.rainLeft>0)W.rainLeft-=dt;else{W.rainIn-=dt;if(W.rainIn<=0){W.rainLeft=season()?70+Math.random()*60:30+Math.random()*25;W.rainIn=(season()?220:800)+Math.random()*(season()?260:700);
      for(const pc of W.pieces)if(pc.f==='crate'&&pc.d.st&&!roofed(pc.x,pc.z))for(const s of pc.d.st)if(isFood(s.kind)&&!/^d_/.test(s.kind)&&s.n>1)s.n--;}}
  }else if(evening.running)W.rainLeft=0;
  raining=lerp(raining,W.rainLeft>0?1:0,1-Math.exp(-dt*.45));
  U.uWet.value=clamp(U.uWet.value+(raining>.3?dt/25:-dt/150),0,1);U.uSwell.value=clamp(U.uSwell.value+(raining>.5?dt/60:-dt/240),0,1); // soaks in over half a minute, dries over minutes; the river swells after a while
  U.uCover.value=Math.max(raining,W.rainLeft<=0&&W.rainIn<30&&W.clock.phase!=='night'&&!evening.running?(1-W.rainIn/30)*.65:0);
  sun.intensity=sunBase*(1-.75*U.uCover.value)*(U.uUnder.value?.42*Math.exp(-Math.max(0,water.position.y-camera.position.y)*.07):1)*(1-.98*TUBE.st.cave); // sea water swallows sunlight with depth; rock shuts it out of the lava tube
  rainMesh.visible=raining>.02&&TUBE.st.s<3;                                    // no rain a few steps into the lava tube
  if(rainMesh.visible){rainMesh.material.opacity=raining*.35;const c=camera.position;
    for(let i=0;i<rainN;i++){let y=rainSeed[i*3+1]-dt*13;if(y<0)y+=10;rainSeed[i*3+1]=y;const x=c.x+rainSeed[i*3],z=c.z+rainSeed[i*3+2],yy=c.y-4+y;
      rainPos[i*6]=x;rainPos[i*6+1]=yy;rainPos[i*6+2]=z;rainPos[i*6+3]=x+.03;rainPos[i*6+4]=yy+.35;rainPos[i*6+5]=z;}
    rainGeo.attributes.position.needsUpdate=true;
    for(const pc of W.pieces)if(pc.f==='barrel'){const was=pc.d.w>0;pc.d.w=Math.min(20,(pc.d.w||0)+dt/6*raining*(roofs.some(t=>Math.hypot(t.x-pc.x,t.z-pc.z)<1.8)?2:1));if(!was&&pc.d.w>0)recompute();}}
  for(const pc of W.pieces)if(pc.f==='barrel'){const w=pc.g.getObjectByName('water');w.visible=pc.d.w>.2;w.position.y=.1+.65*Math.min(1,(pc.d.w||0)/20);}
  if(AU.rainG){const t=AU.ctx.currentTime,fw=forestW(player.x,player.z),cm=masks(player.x,player.z),roof=sheltered(player)||roofed(player.x,player.z)||TUBE.st.s>4,und=U.uUnder.value;
    AU.rainG.gain.setTargetAtTime(raining*.3*(1-.5*fw)*(1-und),t,.4);                                      // the hiss of rain on open ground and sea
    AU.rainLeafG.gain.setTargetAtTime(raining*.22*fw*(1-und),t,.4);AU.rainRoofG.gain.setTargetAtTime(raining*(roof?.35:0)*(1-und),t,.3);AU.rainSeaG.gain.setTargetAtTime(raining*.18*smooth(10,-20,cm.d)*(1-und),t,.5);
    if(AU.fallG)AU.fallG.gain.setTargetAtTime(.6+U.uSwell.value*.5,t,1);
    AU.preG.gain.setTargetAtTime(radio.mode>0&&W.rainLeft<=0&&W.rainIn<40&&W.clock.phase!=='night'?.22*(.5+.5*Math.sin(time*9)*Math.sin(time*2.3)):0,t,.1);}
}

