/* ───────── recorded sound ─────────
   Real recordings (CC0, from Freesound; see assets/audio/CREDITS.json) under the island's sound: surf on the shore, the
   waterfall, the river, rain, the forest by day, coquí frogs and insects by night, wind in the bushes, a cave's drips. Each is a
   seamless loop that plays at the level the island's own sound engine already works out for that place, hour and weather
   (the synthesised layers still run underneath, turned down, for the moment-to-moment detail: each wave's crash, each gust). */
const REC=(()=>{
  const FILES=['surf','falls','river','rain','birds','night','wind','cave'],L={};let started=false,ready=false,t=0;
  async function start(){started=true;const c=AU.ctx;
    await Promise.all(FILES.map(async k=>{try{const r=await fetch('assets/audio/'+k+'.ogg');if(!r.ok)return;const buf=await c.decodeAudioData(await r.arrayBuffer());
      const s=c.createBufferSource();s.buffer=buf;s.loop=true;const g=AU.G(0,k==='falls'?AU.fallP:AU.amb);s.connect(g);s.start(c.currentTime+.05,Math.random()*buf.duration);L[k]={s,g};}catch(e){console.warn('Sound',k,e);}}));
    ready=Object.keys(L).length>0;}
  const v=n=>AU[n]&&AU[n].gain?AU[n].gain.value:0;
  function tick(dt){const c=AU.ctx;if(!c||c.state!=='running'||!AU.nat)return;if(!started)start();if(!ready||(t-=dt)>0)return;t=.1;const now=c.currentTime;
    const day=U.uDay.value,cave=TUBE.st.cave,und=U.uUnder.value?.15:1;
    const want={surf:(v('surfG')*1.6+v('washG')*2.2),falls:v('fallG')*.9,river:v('riverG')*2.4,rain:(v('rainG')+v('rainLeafG')*.8+v('rainRoofG')*.6+v('rainSeaG')*.6)*1.6,
      birds:v('canopyG')*7*Math.max(0,day-.15),night:v('crick')*5+Math.max(0,.35-day)*.08*(1-cave),wind:(v('windG')+v('rustG'))*1.8,cave:cave*.45};
    for(const k in L){const g=Math.min(.75,(want[k]||0)*(k==='cave'?1:und));L[k].g.gain.setTargetAtTime(g,now,.4);}
    AU.nat.gain.setTargetAtTime(.35,now,1);if(AU.fallSyn)AU.fallSyn.gain.setTargetAtTime(.3,now,1);}   // the synthesised layers stay underneath, for detail
  return{tick,get ready(){return ready;},get layers(){return Object.keys(L);}};
})();
