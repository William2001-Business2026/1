/* ───────────────────────── audio (all synthesised) ───────────────────────── */
const AU={ctx:null};
const midi=m=>440*Math.pow(2,(m-69)/12);
function initAudio(){
  if(AU.ctx){AU.ctx.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
  const ctx=AU.ctx=new AC(),sr=ctx.sampleRate;
  const G=(v,dest)=>{const g=ctx.createGain();g.gain.value=v;if(dest)g.connect(dest);return g;};
  AU.master=G(settings.master,ctx.destination);
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;AU.uwF=ctx.createBiquadFilter();AU.uwF.type='lowpass';AU.uwF.frequency.value=20000;comp.connect(AU.uwF);AU.uwF.connect(AU.master);
  AU.amb=G(settings.amb,comp);AU.mus=G(settings.music,comp);AU.sfx=G(.9,comp);AU.musDuck=G(1,AU.mus);
  // the lava tube's echo: a long, dark reverb, sent from the world's sounds and your own while you are inside
  {const n=Math.floor(ctx.sampleRate*2.6),ir=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++){const t=i/ctx.sampleRate;d[i]=(Math.random()*2-1)*Math.exp(-t*2.4)*(t<.012?t/.012:1)*(1-.6*Math.exp(-t*30));}}
   AU.caveRev=ctx.createConvolver();AU.caveRev.buffer=ir;AU.caveSend=G(0,AU.caveRev);AU.caveRev.connect(comp);AU.amb.connect(AU.caveSend);AU.sfx.connect(AU.caveSend);}
  // reverb impulse
  const ir=ctx.createBuffer(2,sr*3.2,sr);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.6);}
  AU.rev=ctx.createConvolver();AU.rev.buffer=ir;AU.revOut=G(.9,AU.musDuck);AU.rev.connect(AU.revOut);
  AU.revSfx=ctx.createConvolver();AU.revSfx.buffer=ir;AU.revSfx.connect(G(.35,AU.sfx));
  // noise buffers
  const mk=(kind)=>{const b=ctx.createBuffer(2,sr*4,sr);for(let c=0;c<2;c++){const d=b.getChannelData(c);let l=0,b0=0,b1=0,b2=0;
    for(let i=0;i<d.length;i++){const w=Math.random()*2-1;if(kind==='white')d[i]=w;else if(kind==='brown'){l=(l+.02*w)/1.02;d[i]=l*3.5;}
      else{b0=.99765*b0+w*.099046;b1=.963*b1+w*.2965164;b2=.57*b2+w*1.0526913;d[i]=(b0+b1+b2+w*.1848)*.2;}}}return b;};
  AU.white=mk('white');AU.brown=mk('brown');AU.pink=mk('pink');
  const loop=(buf,dest)=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.connect(dest);s.start(0,Math.random()*3);return s;};
  const filt=(type,f,q,dest)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;if(dest)b.connect(dest);return b;};
  AU.G=G;AU.filt=filt;AU.loop=loop;
  // surf: low rumble + wash
  AU.nat=G(1,AU.amb);AU.fallSyn=null;AU.surfG=G(0,AU.nat);AU.surfF=filt('lowpass',600,.3,AU.surfG);loop(AU.brown,AU.surfF);
  AU.washG=G(0,AU.nat);AU.washF=filt('bandpass',1800,.4,AU.washG);loop(AU.pink,AU.washF);
  // wind and palm rustle
  AU.windG=G(0,AU.nat);loop(AU.pink,filt('bandpass',420,.5,AU.windG));
  AU.rustG=G(0,AU.nat);loop(AU.white,filt('highpass',4200,.3,filt('lowpass',9000,.3,AU.rustG)));
  // the waterfall: a deep roar and a bright hiss, heard from where it falls and fading with distance
  AU.fallP=ctx.createPanner();AU.fallP.panningModel='equalpower';AU.fallP.distanceModel='inverse';AU.fallP.refDistance=7;AU.fallP.rolloffFactor=1.15;AU.fallP.connect(AU.amb);
  {const fp=FRESH.fallAt;if(AU.fallP.positionX){AU.fallP.positionX.value=fp.x;AU.fallP.positionY.value=fp.y+5;AU.fallP.positionZ.value=fp.z;}else AU.fallP.setPosition(fp.x,fp.y+5,fp.z);}
  AU.fallSyn=G(1,AU.fallP);AU.fallG=G(.6,AU.fallSyn);loop(AU.brown,filt('lowpass',620,.4,AU.fallG));loop(AU.pink,filt('bandpass',2400,.6,G(.35,AU.fallG)));
  // close to the plunge: the crash of water hitting water, sharp and bright, which only the last few tens of metres let you hear
  AU.splashP=ctx.createPanner();AU.splashP.panningModel='equalpower';AU.splashP.distanceModel='exponential';AU.splashP.refDistance=6;AU.splashP.rolloffFactor=1.6;AU.splashP.connect(AU.amb);
  {const fp=FRESH.fallAt;if(AU.splashP.positionX){AU.splashP.positionX.value=fp.x;AU.splashP.positionY.value=fp.y+.5;AU.splashP.positionZ.value=fp.z;}else AU.splashP.setPosition(fp.x,fp.y+.5,fp.z);}
  AU.splashG=G(.55,AU.splashP);loop(AU.white,filt('highpass',1800,.4,filt('peaking',4200,.8,AU.splashG)));loop(AU.pink,filt('bandpass',900,.9,G(.4,AU.splashG)));
  // the river's babble, and the wind's howl over the summit
  AU.riverG=G(0,AU.nat);AU.riverF=filt('bandpass',1500,1.1,AU.riverG);loop(AU.pink,AU.riverF);
  AU.howlG=G(0,AU.amb);AU.howlF=filt('bandpass',760,6,AU.howlG);loop(AU.pink,AU.howlF);
  AU.canopyG=G(0,AU.nat);loop(AU.pink,filt('highpass',1600,.4,filt('lowpass',7000,.4,AU.canopyG)));
  AU.uwG=G(0,AU.amb);loop(AU.brown,filt('lowpass',240,.5,AU.uwG));loop(AU.pink,filt('bandpass',900,2,G(.15,AU.uwG))); // the hush and crackle of the reef
  // night insects
  AU.crick=G(0,AU.nat);{const o=ctx.createOscillator();o.frequency.value=4350;const g1=G(.5),g2=G(0);
    const l1=ctx.createOscillator();l1.frequency.value=27;const lg1=G(.5);l1.connect(lg1);lg1.connect(g1.gain);
    const l2=ctx.createOscillator();l2.type='square';l2.frequency.value=1.35;const lg2=G(.5);l2.connect(lg2);lg2.connect(g2.gain);g2.gain.value=.5;
    o.connect(g1);g1.connect(g2);g2.connect(filt('lowpass',5200,.5,AU.crick));o.start();l1.start();l2.start();}
  // radio chain (positional)
  AU.pan=ctx.createPanner();AU.pan.panningModel='equalpower';AU.pan.distanceModel='inverse';AU.pan.refDistance=1.4;AU.pan.rolloffFactor=1.7;AU.pan.connect(AU.amb);
  AU.radioDuck=G(1,AU.pan);AU.radioBus=filt('highpass',380,.7,filt('lowpass',3300,.7,AU.radioDuck));
  AU.staticG=G(0,AU.radioBus);loop(AU.white,filt('bandpass',2400,.6,AU.staticG));
  AU.gtrG=G(0,AU.radioBus);
  AU.voiceG=G(0,AU.radioBus);{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=112;AU.voiceO=o;AU.voiceEnv=G(0);
    AU.f1=filt('bandpass',650,5);AU.f2=filt('bandpass',1250,7);o.connect(AU.voiceEnv);AU.voiceEnv.connect(AU.f1);AU.voiceEnv.connect(AU.f2);AU.f1.connect(AU.voiceG);AU.f2.connect(G(.7,AU.voiceG));o.start();}
  // plucked strings (Karplus-Strong), cached per note
  AU.ks={};
  AU.pluckBuf=(m)=>{if(AU.ks[m])return AU.ks[m];const f=midi(m),n=Math.floor(sr*2.4),buf=ctx.createBuffer(1,n,sr),d=buf.getChannelData(0),N=Math.max(2,Math.round(sr/f)),ring=new Float32Array(N);
    for(let i=0;i<N;i++)ring[i]=Math.random()*2-1;for(let k=0;k<3;k++)for(let i=0;i<N;i++)ring[i]=(ring[i]+ring[(i+1)%N])*.5;
    let mx=0;for(let i=0;i<N;i++)mx=Math.max(mx,Math.abs(ring[i]));for(let i=0;i<N;i++)ring[i]/=mx;
    const damp=m>66?.9935:.996;let idx=0;for(let i=0;i<n;i++){const a=ring[idx],b=ring[(idx+1)%N];d[i]=a*Math.min(1,(n-i)/2000);ring[idx]=(a+b)*.5*damp;idx=(idx+1)%N;}
    return AU.ks[m]=buf;};
  AU.pluck=(m,when,gain,dest)=>{const s=ctx.createBufferSource();s.buffer=AU.pluckBuf(m);const g=G(gain,dest);s.connect(g);s.start(when);return g;};
  const bodyIR=ctx.createBuffer(1,Math.floor(sr*.07),sr);{const d=bodyIR.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/sr;d[i]=(Math.sin(t*2*Math.PI*310)*.6+Math.sin(t*2*Math.PI*640)*.3+Math.sin(t*2*Math.PI*1150)*.15+(Math.random()-.5)*.15)*Math.exp(-t*70);}d[0]=1;}
  const body=dest=>{const cv=ctx.createConvolver();cv.buffer=bodyIR;cv.connect(dest);return cv;};
  AU.ukeBus=body(G(.5,AU.sfx));AU.ukeRev=G(.3,AU.revSfx);
  AU.t={pad:ctx.currentTime+.3,bell:ctx.currentTime+5,bird:ctx.currentTime+4,gtr:0,voice:0,bar:0,chord:0};
}
function noiseBurst(buf,type,f,q,gain,att,dec,dest,f2){
  const c=AU.ctx;if(!c)return;const t=c.currentTime,s=c.createBufferSource();s.buffer=buf;const fl=AU.filt(type,f,q);const g=AU.G(0,dest||AU.sfx);
  s.connect(fl);fl.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);
  if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+att+dec);s.start(t,Math.random()*3,att+dec+.05);
}
function tone(f0,f1,gain,dec,type='sine',dest){
  const c=AU.ctx;if(!c)return;const t=c.currentTime,o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dec);
  const g=AU.G(0,dest||AU.sfx);o.connect(g);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.start(t);o.stop(t+dec+.05);
}
const SFX={
  drip(v=1){if(!AU.ctx)return;tone(2300+Math.random()*1100,1500,.07*v,.06);},                    // a drop into a puddle, in the tube
  step(surf,vol){ if(!AU.ctx)return; const v=vol*(.8+Math.random()*.4);
    if(surf==='sand'){noiseBurst(AU.pink,'lowpass',700+Math.random()*300,.5,.22*v,.012,.16);noiseBurst(AU.white,'bandpass',2600,.8,.03*v,.03,.1);}
    else if(surf==='grass'){noiseBurst(AU.white,'bandpass',3200+Math.random()*800,.6,.05*v,.02,.14);noiseBurst(AU.pink,'lowpass',500,.5,.12*v,.01,.1);}
    else if(surf==='wood'){tone(105+Math.random()*20,62,.3*v,.11);noiseBurst(AU.pink,'lowpass',900,.6,.12*v,.004,.05);}
    else if(surf==='rock'){noiseBurst(AU.white,'bandpass',1700+Math.random()*500,1.2,.09*v,.003,.06);tone(150,90,.08*v,.05);}
    else{noiseBurst(AU.white,'bandpass',900,.7,.16*v,.02,.35,null,2200);noiseBurst(AU.pink,'lowpass',500,.5,.14*v,.01,.2);} },
  sip(){noiseBurst(AU.white,'bandpass',900,3,.07,.12,.2,null,2600);setTimeout(()=>tone(260,170,.07,.09),380);},
  clink(){tone(2350,2300,.06,.12);tone(3920,3900,.03,.07);tone(140,90,.12,.06);},
  knock(){tone(190,120,.25,.09);tone(430,380,.08,.05);},
  thud(v=1){tone(85,48,.4*v,.2);noiseBurst(AU.pink,'lowpass',400,.5,.25*v,.005,.12);},
  splash(v=1){noiseBurst(AU.white,'bandpass',700,.6,.3*v,.01,.55,null,2600);noiseBurst(AU.pink,'lowpass',600,.5,.25*v,.01,.3);},
  click(){noiseBurst(AU.white,'bandpass',3000,2,.12,.001,.025);},
  flame(on){SFX.click();if(on)noiseBurst(AU.pink,'bandpass',500,.8,.1,.05,.4,null,1400);else noiseBurst(AU.pink,'lowpass',900,.5,.06,.02,.25);},
  rinse(){noiseBurst(AU.white,'bandpass',1200,.8,.18,.1,.9,null,2800);setTimeout(()=>noiseBurst(AU.white,'bandpass',1800,1,.12,.05,.5,null,900),350);},
  cloth(){noiseBurst(AU.pink,'bandpass',900,.5,.12,.08,.5);tone(70,50,.12,.3);},
  pickup(){noiseBurst(AU.pink,'bandpass',1500,.8,.05,.01,.08);},
  strum(i){ if(!AU.ctx)return; const ch=[[67,60,64,72],[69,60,64,69],[69,60,65,69],[67,62,65,71]][i],t=AU.ctx.currentTime+.01;
    ch.forEach((m,k)=>{const g=AU.pluck(m,t+k*.028+Math.random()*.006,.34,AU.ukeBus);g.connect(AU.ukeRev);}); }
};
const RADIO_MODES=['off','static','slack-key guitar','surf report'];
function scheduleAudio(dt,time){
  const c=AU.ctx;if(!c||c.state!=='running')return;const now=c.currentTime,T=AU.t,tc=.25;
  // ambience follows the place and the hour
  const h=heightAt(player.x,player.z),cm=masks(player.x,player.z),prox=clamp(1.05-h*.06,.2,1)*clamp(1.12-Math.max(0,cm.d)/42,.05,1),night=smooth(0,-10,evening.elev); // surf fades inland and uphill
  const sw=Math.pow(.5+.5*Math.sin(time*WW+2.4),3)*.75+(.5+.5*Math.sin(time*2*Math.PI/23+1))*.25;
  if(sw>.78&&!AU.crash){AU.crash=true;noiseBurst(AU.pink,'lowpass',1700,.4,.2*prox,.6,2.4,AU.amb,320);noiseBurst(AU.white,'bandpass',4300,.5,.045*prox*prox,1.4,3.2,AU.amb,2400);}else if(sw<.3)AU.crash=false;
  AU.surfG.gain.setTargetAtTime(prox*(.1+.2*sw),now,tc);AU.surfF.frequency.setTargetAtTime(380+900*sw,now,tc);
  AU.washG.gain.setTargetAtTime(prox*prox*(.02+.16*Math.pow(sw,1.6)),now,tc);AU.washF.frequency.setTargetAtTime(1200+2200*sw,now,tc);
  const gust=fbm(time*.13,3.3,3);
  {const fw=Math.max(forestW(player.x,player.z),smooth(8,20,mountainH(player.x,player.z))*.6);AU.canopyG.gain.setTargetAtTime(fw*(.02+.06*gust)*(1-U.uUnder.value),now,.5);
   if(fw>.25&&now>(T.song||0)&&!U.uUnder.value){const day=night<.5;T.song=now+(day?1.2+Math.random()*3.5:6+Math.random()*10);const p=c.createStereoPanner?c.createStereoPanner():AU.G(1);if(p.pan)p.pan.value=Math.random()*1.6-.8;p.connect(AU.amb);p.connect(AU.revSfx);
     if(day){const kind=Math.random(),n=kind<.5?5+(Math.random()*6|0):3,base=kind<.5?3200+Math.random()*900:2100+Math.random()*500;   // ʻapapane trills and ʻamakihi whistles
       for(let i=0;i<n;i++){const t=now+.05+i*(kind<.5?.07:.22),o=c.createOscillator(),g=AU.G(0,p),f=base*(1+(Math.random()-.5)*.2);o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*(kind<.5?1.25:.7),t+(kind<.5?.05:.18));
         g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018*fw,t+.012);g.gain.exponentialRampToValueAtTime(.0005,t+(kind<.5?.06:.2));o.connect(g);o.start(t);o.stop(t+.25);}}
     else{for(let i=0;i<2;i++){const t=now+.05+i*.55,o=c.createOscillator(),g=AU.G(0,p);o.type='sine';o.frequency.setValueAtTime(420,t);o.frequency.linearRampToValueAtTime(380,t+.35); // a pueo calling
       g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03*fw,t+.06);g.gain.exponentialRampToValueAtTime(.0005,t+.4);o.connect(g);o.start(t);o.stop(t+.45);}}}}
  const und=U.uUnder.value;AU.uwF.frequency.setTargetAtTime(und?480:20000,now,.06);AU.uwG.gain.setTargetAtTime(und*.5,now,.25);
  if(und&&now>(T.exh||0)){T.exh=now+3.2+Math.random()*2.4;for(let i=0;i<7;i++){const o=c.createOscillator(),g=AU.G(0,AU.sfx),t=now+.05+i*.07+Math.random()*.05,f0=180+Math.random()*260; // breath out: a stream of bubbles
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*2.4,t+.06);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+.09);o.connect(g);o.start(t);o.stop(t+.1);}}
  if(und&&DIVE.air<15&&now>(T.beat||0)){T.beat=now+.85;for(const [dt0,v] of [[0,.22],[.17,.14]]){const o=c.createOscillator(),g=AU.G(0,AU.sfx),t=now+dt0; // your heart, as the air runs out
    o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);o.start(t);o.stop(t+.18);}}
  const alt=smooth(8,58,player.y);                                                              // the higher you climb, the harder it blows
  AU.windG.gain.setTargetAtTime((.03+.07*gust)*(1+4.5*alt),now,.6);AU.rustG.gain.setTargetAtTime((.006+.03*smooth(.4,.75,gust))*(1-.4*night)*(1-.75*alt),now,.5);
  AU.howlG.gain.setTargetAtTime(alt*alt*(.015+.1*smooth(.4,.85,gust)),now,.5);AU.howlF.frequency.setTargetAtTime(560+620*gust,now,.8);
  {const q=riverQ(player.x,player.z);let rv=0;if(q){const i=Math.floor(q.i),gr=Math.max(0,RIVER.wl[i]-RIVER.wl[Math.min(RIVER.P.length-1,i+2)])/2;rv=smooth(q.w+28,q.w,q.d)*clamp(.35+gr*25,.35,1.4);}
   AU.riverG.gain.setTargetAtTime(.1*rv,now,.4);if(AU.caveSend){const c=TUBE.st.s>=0?.3+.7*TUBE.st.cave:0;AU.caveSend.gain.setTargetAtTime(c*.85,now,.3);AU.fallG.gain.setTargetAtTime(.6*(1-.8*TUBE.st.cave),now,.4);AU.splashG&&AU.splashG.gain.setTargetAtTime(.55*(1-.9*TUBE.st.cave),now,.4);}AU.riverF.frequency.setTargetAtTime(1150+700*vnoise(time*2.3,7),now,.08);
   if(rv>.05&&now>(T.burble||0)){T.burble=now+.05+Math.random()*.25;const o=c.createOscillator(),g=AU.G(0,AU.amb),t=now+.01,f=420+Math.random()*900; // water plopping over stones
     o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.9,t+.06);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012*rv,t+.008);g.gain.exponentialRampToValueAtTime(.0005,t+.08);o.connect(g);o.start(t);o.stop(t+.1);}}
  {const ds=Math.hypot(player.x-SPRING.x,player.z-SPRING.z);if(ds<16&&now>(T.bub||0)){T.bub=now+.15+Math.random()*.6;const o=c.createOscillator(),g=AU.G(0,AU.amb),t=now+.01,f=300+Math.random()*400; // the spring welling up
     o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*2.6,t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03*smooth(16,2,ds),t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+.12);o.connect(g);o.start(t);o.stop(t+.14);}}
  AU.crick.gain.setTargetAtTime(.012*night*(1-.5*prox+.3),now,1.5);
  // distant seabirds until dusk
  if(now>T.bird){T.bird=now+7+Math.random()*14;if(evening.elev>.5&&prox>.3){const p=c.createStereoPanner?c.createStereoPanner():AU.G(1);if(p.pan)p.pan.value=Math.random()*1.6-.8;p.connect(AU.amb);p.connect(AU.revSfx);
    const n=2+(Math.random()*3|0),base=2300+Math.random()*900;for(let i=0;i<n;i++){const t=now+.1+i*(.16+Math.random()*.05),o=c.createOscillator(),g=AU.G(0,p);
      o.frequency.setValueAtTime(base*.8,t);o.frequency.linearRampToValueAtTime(base*1.25,t+.05);o.frequency.linearRampToValueAtTime(base*.7,t+.13);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022,t+.03);g.gain.linearRampToValueAtTime(0,t+.14);o.connect(g);o.start(t);o.stop(t+.2);}}}
  // background music: slow pads and a few bells
  const CH=[[48,55,64,71,74],[45,52,60,67,71],[41,48,57,64,67],[43,50,59,64,69]];
  if(now>T.pad-1){const ch=CH[T.chord++%4],t=T.pad,len=15;T.pad+=len;
    const lp=AU.filt('lowpass',900,.3,AU.musDuck);lp.connect(AU.rev);
    ch.forEach((m,i)=>{for(const det of[-5,6]){const o=c.createOscillator();o.type=i<2?'sine':'triangle';o.frequency.value=midi(m);o.detune.value=det+Math.random()*3;
      const g=AU.G(0,lp);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(i<2?.05:.026,t+5.5);g.gain.setValueAtTime(i<2?.05:.026,t+len-2);g.gain.linearRampToValueAtTime(0,t+len+6);
      o.connect(g);o.start(t);o.stop(t+len+6.2);}});}
  if(now>T.bell-.2){const t=T.bell;T.bell+=3.5+Math.random()*6;const m=[72,74,76,79,81,84,79,76][Math.random()*8|0],o=c.createOscillator(),o2=c.createOscillator(),g=AU.G(0,AU.rev);
    o.frequency.value=midi(m);o2.frequency.value=midi(m)*2.01;const g2=AU.G(.18,g);o.connect(g);o2.connect(g2);g.connect(AU.musDuck);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+3.6);o.start(t);o2.start(t);o.stop(t+3.7);o2.stop(t+3.7);}
  // radio programmes
  const mode=RADIO_MODES[radio.mode];
  AU.staticG.gain.setTargetAtTime(mode==='static'?.16*(.7+.3*Math.sin(time*7.3)*Math.sin(time*1.7)):0,now,.08);
  AU.gtrG.gain.setTargetAtTime(mode==='slack-key guitar'?1:0,now,.15);AU.voiceG.gain.setTargetAtTime(mode==='surf report'?.5:0,now,.15);
  AU.musDuck.gain.setTargetAtTime(mode==='slack-key guitar'&&AU.radioDuck.gain.value>.3?.35:1,now,1.2);
  if(mode==='slack-key guitar'){const e8=.36;if(T.gtr<now)T.gtr=now+.1;
    while(T.gtr<now+.4){const bar=T.bar++,ch=[[48,55,60,64,67,72],[48,55,60,64,67,72],[41,48,57,60,65,69],[48,55,60,64,67,72],[43,50,59,62,65,67],[43,50,59,62,65,71],[48,55,60,64,67,72],[48,52,60,64,67,76]][bar%8],r=rng(bar*77+3);
      for(let i=0;i<8;i++){const t=T.gtr+i*e8+(i%2?.035:0);if(i%2===0)AU.pluck(ch[(i/2)%2],t,.5,AU.gtrG);
        if(r()<(i%2?.8:.45))AU.pluck(ch[2+(r()*4|0)]+(r()<.15?2:0),t+.01,.34,AU.gtrG);if(i===7&&r()<.5)AU.pluck(ch[5],t+e8*.5,.25,AU.gtrG);}
      T.gtr+=8*e8;}}
  if(mode==='surf report'){if(T.voice<now)T.voice=now+.05;
    while(T.voice<now+.3){const t=T.voice,pause=Math.random()<.12,d=pause?.35+Math.random()*.5:.1+Math.random()*.16;
      if(!pause){AU.voiceEnv.gain.setTargetAtTime(.5+Math.random()*.5,t,.02);AU.voiceEnv.gain.setTargetAtTime(.05,t+d*.7,.03);
        AU.voiceO.frequency.setTargetAtTime(100+Math.random()*38,t,.04);AU.f1.frequency.setTargetAtTime(380+Math.random()*450,t,.03);AU.f2.frequency.setTargetAtTime(950+Math.random()*1100,t,.03);}
      else AU.voiceEnv.gain.setTargetAtTime(0,t,.04);T.voice+=d;}}
  // listener
  const L=c.listener,p=camera.position,f=_fwd.set(0,0,-1).applyQuaternion(camera.quaternion);
  if(L.positionX){L.positionX.value=p.x;L.positionY.value=p.y;L.positionZ.value=p.z;L.forwardX.value=f.x;L.forwardY.value=f.y;L.forwardZ.value=f.z;L.upX.value=0;L.upY.value=1;L.upZ.value=0;}
  else{L.setPosition(p.x,p.y,p.z);L.setOrientation(f.x,f.y,f.z,0,1,0);}
  radioG.getWorldPosition(_v);if(AU.pan.positionX){AU.pan.positionX.value=_v.x;AU.pan.positionY.value=_v.y;AU.pan.positionZ.value=_v.z;}else AU.pan.setPosition(_v.x,_v.y,_v.z);
}
const _fwd=new THREE.Vector3(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();

