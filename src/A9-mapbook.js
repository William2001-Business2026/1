/* ───────── the map notebook: blank pages, and only what you remember ─────────
   Press M for the notebook. Its pages start blank and nothing draws itself: there is no map of the island and no mark for where
   you are. You draw with what you have found and carry, and each one marks the paper its own way:
     nānahu (charcoal)  from a fire that has burned down: grainy, soft, catching on the tooth of the paper
     kukui ink          soot from a kukui nut burned over a shell: a fine dark line, thinner when you draw fast
     ʻalaea             red earth from slumped banks: a dry, broken, bristly stroke
     ʻōlena             the yellow root of the wet forest: a pale wash, darker where it dries at the edges
     pōpolo             purple-black berries: a translucent purple that bleeds a little into the paper
   Each piece lasts a certain length of line; drawing uses it up and then takes the next from what you carry. */
const MAPBOOK=(()=>{
  // ── what you draw with: carried things like any other
  const rough=(c,ro=.9)=>mt(...c,ro);
  K.charcoal={n:'Nānahu (charcoal)',dye:[.14,.13,.12],mk(){const g=new THREE.Group();for(let i=0;i<3;i++)part(g,'box',rough([.06,.055,.05]),.05+i*.012,.025,.03,(i-1)*.04,.014,(i%2)*.02,0,i*.9,.2*i);return g;}};
  K.kukui={n:'Kukui nuts',mk(){const g=new THREE.Group();for(let i=0;i<3;i++)part(g,'sph',rough([.17,.13,.09],.6),.026,.022,.026,(i-1)*.05,.022,(i%2)*.03,0,i,0);return g;}};
  K.ink={n:'Kukui ink in a shell',mk(){const g=new THREE.Group();part(g,'half',mt(.93,.85,.78,.3,{side:THREE.DoubleSide}),.05,.03,.06,0,.03,0,Math.PI);part(g,'disc',mt(.03,.025,.02,.15),.042,.042,.05,0,.026,0,-Math.PI/2);return g;}};
  K.alaea={n:'ʻAlaea (red earth)',dye:[.6,.24,.14],mk(){const g=new THREE.Group();for(let i=0;i<4;i++)part(g,'sph',rough([.5,.17,.09]),.04+i%2*.015,.03,.04,(i%2)*.06-.03,.025,(i>>1)*.05-.025,0,i,0);return g;}};
  K.olena={n:'ʻŌlena (turmeric root)',dye:[.86,.63,.14],mk(){const g=new THREE.Group();for(let i=0;i<3;i++)part(g,'cyl',rough([.78,.5,.16],.7),.016,.1,.016,(i-1)*.03,.016,0,0,i*.5-.5,Math.PI/2);
      for(let i=0;i<3;i++)part(g,'leaf',lm(.24,.42,.14),.08,1,.36,-.04,.03+i*.01,0,0,i*.7-.7,0);return g;}};
  K.popolo={n:'Pōpolo berries',dye:[.32,.14,.36],mk(){const g=new THREE.Group();part(g,'cyl',lm(.22,.34,.12),.004,.16,.004,0,.01,0,0,0,Math.PI/2);
      for(let i=0;i<4;i++)part(g,'leaf',lm(.2,.36,.13),.05,1,.09,(i-1.5)*.04,.012,0,0,i*1.6,0);for(let i=0;i<9;i++)part(g,'sph',mt(.13,.06,.16,.25),.011,.011,.011,.06+(i%3)*.016,.02+(i/3|0)*.01,(i%2)*.014-.007);return g;}};
  Object.assign(NOTES,{
    charcoal:'The fire burned down to black. Charcoal smudges wherever it touches: something to draw with.',
    kukui:'Kukui nuts under the pale-leaved trees, oily inside. They burn like a candle.',
    ink:'A kukui nut held burning over a shell leaves a soft black soot. Wetted, it is ink: a fine line.',
    alaea:'ʻAlaea, red earth where a bank has slumped. It stains the fingers rust.',
    olena:'ʻŌlena, a root in the wet forest. Bright yellow inside; it stains everything it touches.',
    popolo:'Pōpolo berries, purple-black. The juice runs purple.',
    map:'My notebook has blank pages. What goes on them is only what I remember, in whatever I have to draw with.'});
  IDEAS.push(['A fire that burns down leaves charcoal in the ring.',n=>n.fire,'charcoal'],['Kukui burns like a candle. Its soot, caught on a shell?',n=>n.kukui,'ink'],
    ['The notebook (M) has blank pages.',()=>1,'map']);

  IDEAS.push(['Some things stain the fingers: red earth where banks slump, a yellow root in the wet forest, purple berries at the forest edge.',n=>n.map,'popolo']);
  {const g0=give;give=function(kind,...a){const r=g0(kind,...a);if(r>0&&(kind==='kukui'||kind==='alaea'||kind==='olena'||kind==='popolo'))note(kind);return r;};}
  {const Z=id=>GUIDE.zones.find(z=>z.id===id),E=(n,e,d,tags,when)=>({n,e,d,tags,when});
    Z('beach').todo.push('Draw your own map in the notebook (M). Its pages are blank and nothing marks where you are: you draw what you remember with what you carry. Charcoal comes from a fire ring once the fire has burned down.');
    Z('forest').flora.push(E('ʻŌlena','turmeric','A ginger-like plant of the wet forest, often near streams. Its root is bright yellow and stains everything: a yellow wash in the notebook.',['gather','use'],n=>n.olena),
      E('Pōpolo','Hawaiian nightshade','A weedy shrub of open grass and forest edges with purple-black berries. Their juice draws purple.',['gather','use'],n=>n.popolo));
    Z('forest').todo.push('Gather kukui nuts under the kukui trees; hold one burning over a lit fire with a shell in your basket to catch the soot as ink.','Look for ʻalaea, red earth, where the valley walls have slumped.');}
  // ── where they are found: a few at a time around you, in their own kind of ground
  const KINDS={
    kukui:{per:3,at(x,z){const t=FLORA.near(x,z,45).filter(t=>t.kind==='kukui');if(!t.length)return null;const k=t[Math.floor(Math.random()*t.length)],a=Math.random()*6.283,q=1+Math.random()*3;return[k.x+Math.cos(a)*q,k.z+Math.sin(a)*q];}},
    olena:{per:2,ok(x,z,h){if(forestW(x,z)<.22||h>900||GROUND.slopeAt(x,z)>.6)return false;const rq=riverQ(x,z);return(rq&&rq.d<rq.w+40)||Math.random()<.3;}},
    popolo:{per:2,ok(x,z,h){const f=forestW(x,z),m=masks(x,z);return f<.5&&h>2.5&&h<1300&&m.lava<.5&&GROUND.slopeAt(x,z)<.6&&grassMask(x,z,h,m)>.35;}},   // weedy, in the open grass and the forest edge
    alaea:{per:2,ok(x,z,h){const s=GROUND.slopeAt(x,z);return s>.22&&s<1.3&&h>6&&h<1000&&forestW(x,z)<.5&&masks(x,z).lava<.4;}},            // where a bank has slumped
  };
  let fT=3;
  function forage(){const px=player.x,pz=player.z;
    for(const [k,o] of Object.entries(KINDS)){
      for(const it of W.items.filter(i=>i.kind===k&&i.wild))if(Math.hypot(it.x-px,it.z-pz)>220)despawn(it);       // left far behind: it grows again somewhere else
      if(W.items.filter(i=>i.kind===k&&Math.hypot(i.x-px,i.z-pz)<60).length>=o.per)continue;
      for(let t=0;t<14;t++){let p;if(o.at)p=o.at(px,pz);else{const a=Math.random()*6.283,q=10+Math.random()*42;p=[px+Math.cos(a)*q,pz+Math.sin(a)*q];}
        if(!p)break;const[x,z]=p,h=heightAt(x,z),fw=freshAt(x,z);if(h<1||onDeck(x,z)||(fw!=null&&fw>h-.05)||TUBE.inside(x,z,h))continue;
        if(o.ok&&!o.ok(x,z,h))continue;if(Math.hypot(x-px,z-pz)<6)continue;spawn(k,x,z,1).wild=true;break;}}}

  // ── the notebook itself
  const PW=1000,PH=700,PAGES=12;
  const MB=()=>{const m=W.map||(W.map={});m.pages=m.pages||[];m.left=m.left||{};m.cur=m.cur||0;return m;};
  const INKS=[
    {k:'charcoal',len:4000,col:'#1c1a18'},{k:'ink',len:6000,col:'#1a1410'},{k:'alaea',len:2400,col:'#9a3a22'},{k:'olena',len:2000,col:'#dcaa22'},{k:'popolo',len:2800,col:'#4e1f52'}];
  const css=`#mapbook{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;gap:18px;background:rgba(10,8,5,.55)}
    #mapbook.on{display:flex}#mapbook .pg{position:relative;box-shadow:0 18px 50px rgba(0,0,0,.5);border-radius:3px;overflow:hidden;line-height:0}
    #mapbook canvas{display:block;width:min(calc(100vw - 250px),calc((100vh - 70px)*1.4286));height:auto;cursor:crosshair;touch-action:none}
    #mapbook .tools{display:flex;flex-direction:column;gap:6px;font:15px Georgia,serif;color:#efe6d2;width:196px}
    #mapbook .tools button{display:flex;align-items:center;gap:8px;text-align:left;font:inherit;background:rgba(255,248,235,.07);border:1px solid rgba(255,248,235,.18);color:inherit;border-radius:4px;padding:6px 8px;cursor:pointer;font-size:13.5px;line-height:1.2}
    #mapbook .tools button.on{background:rgba(255,248,235,.2);border-color:rgba(255,248,235,.55)}#mapbook .tools button.none{opacity:.38}
    #mapbook .tools i{display:inline-block;width:14px;height:14px;border-radius:50%;flex:none;box-shadow:0 0 0 1px rgba(255,248,235,.45)}#mapbook .tools small{opacity:.7;margin-left:auto;font-size:12px}
    #mapbook .tools p{margin:8px 0 0;font-size:12.5px;line-height:1.45;opacity:.75}#mapbook .num{position:absolute;bottom:12px;right:18px;font:italic 14px Georgia,serif;color:rgba(60,45,30,.55);line-height:1}`;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
  const root=Object.assign(document.createElement('div'),{id:'mapbook'});
  root.innerHTML='<div class="tools"></div><div class="pg"><canvas width="'+PW+'" height="'+PH+'"></canvas><div class="num"></div></div>';document.body.appendChild(root);
  const cv=root.querySelector('canvas'),cx=cv.getContext('2d'),tools=root.querySelector('.tools'),num=root.querySelector('.num');
  // paper: warm, uneven, with fibres and a faint foxing; the same sheet for every page with its own small differences
  const paper=document.createElement('canvas');paper.width=PW;paper.height=PH;
  {const c=paper.getContext('2d'),r=rng(7);c.fillStyle='#e8dcc0';c.fillRect(0,0,PW,PH);const id=c.getImageData(0,0,PW,PH),d=id.data;
    for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const i=(y*PW+x)*4,n=(r()-.5)*10+6*Math.sin(x*.013+Math.sin(y*.021)*2)*Math.sin(y*.017),v=Math.hypot((x-PW/2)/PW,(y-PH/2)/PH);
      const e=-30*Math.max(0,v-.38);d[i]+=n+e;d[i+1]+=n+e*1.1;d[i+2]+=n+e*1.4;}c.putImageData(id,0,0);
    c.globalAlpha=.06;c.strokeStyle='#6b5535';for(let i=0;i<500;i++){const x=r()*PW,y=r()*PH,a=r()*6.28,l=4+r()*14;c.lineWidth=.5+r()*.6;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a+1)*l*.5,y+Math.sin(a+1)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}
    c.globalAlpha=1;for(let i=0;i<7;i++){const x=r()*PW,y=r()*PH,R0=8+r()*30,g=c.createRadialGradient(x,y,0,x,y,R0);g.addColorStop(0,'rgba(150,105,50,.07)');g.addColorStop(1,'rgba(150,105,50,0)');c.fillStyle=g;c.fillRect(x-R0,y-R0,R0*2,R0*2);}
    c.fillStyle='rgba(70,50,30,.08)';c.fillRect(0,0,6,PH);}
  const tooth=(x,y)=>{const s=Math.sin(x*12.9898+y*78.233)*43758.5453;return s-Math.floor(s);};    // the grain of the paper, fixed in place
  // one segment of each material; r is the stroke's own random stream so a page redraws exactly as it was drawn
  function seg(m,a,b,r,first,br){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||.001,ux=dx/L,uy=dy/L,nx=-uy,ny=ux;cx.globalCompositeOperation='multiply';
    if(m==='charcoal'){cx.fillStyle='rgba(28,26,24,.05)';cx.lineCap='round';cx.strokeStyle='rgba(40,36,32,.06)';cx.lineWidth=8;cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();
      for(let t=0;t<L;t+=.8){const x=a[0]+ux*t,y=a[1]+uy*t;for(let j=0;j<4;j++){const o=(r()-.5)*5.5,px=x+nx*o,py=y+ny*o;if(tooth(px|0,py|0)>.62+Math.abs(o)*.05)continue;
        cx.fillStyle=`rgba(26,24,22,${.2+r()*.25})`;cx.fillRect(px,py,.9+r()*.9,.9+r()*.9);}}}
    else if(m==='ink'){const w=Math.max(.7,2.5-L*.09);cx.strokeStyle='rgba(26,20,16,.9)';cx.lineCap='round';cx.lineWidth=w;cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();
      if(first){cx.fillStyle='rgba(26,20,16,.85)';cx.beginPath();cx.arc(a[0],a[1],1.8+r()*1.2,0,6.283);cx.fill();}}
    else if(m==='alaea'){const B=br||[];for(let t=0;t<L;t+=.7){const x=a[0]+ux*t,y=a[1]+uy*t;for(const q of B){const px=x+nx*q.o,py=y+ny*q.o;   // a dry brush: each bristle keeps its line,
        if(tooth(px|0,py|0)>q.k)continue;cx.fillStyle=`rgba(150,50,28,${q.a})`;cx.fillRect(px-.6,py-.6,1.3,1.3);}}}                    // and skips where the paper's grain stands up
    else if(m==='popolo'){cx.lineCap='round';cx.strokeStyle='rgba(80,30,84,.1)';cx.lineWidth=8;cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();
      cx.strokeStyle='rgba(78,28,82,.42)';cx.lineWidth=3.6;cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();
      if(r()<.03||first){cx.fillStyle='rgba(78,28,82,.25)';cx.beginPath();cx.arc(b[0]+(r()-.5)*3,b[1]+(r()-.5)*3,2+r()*3,0,6.283);cx.fill();}}
    cx.globalCompositeOperation='source-over';}
  // ʻōlena is a wash: the whole stroke is laid at once, so it never darkens where it crosses itself, with a darker dried edge
  const wc=document.createElement('canvas');wc.width=PW;wc.height=PH;const w2=wc.getContext('2d');
  function wash(p){if(p.length<4)return;const path=()=>{w2.beginPath();w2.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)w2.lineTo(p[i],p[i+1]);};w2.clearRect(0,0,PW,PH);w2.lineCap=w2.lineJoin='round';
    w2.strokeStyle='rgb(214,150,40)';w2.lineWidth=19;path();w2.stroke();w2.strokeStyle='rgb(238,196,92)';w2.lineWidth=14;path();w2.stroke();   // the dried edge, then the paler body over it
    cx.globalCompositeOperation='multiply';cx.globalAlpha=.42;cx.drawImage(wc,0,0);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';}
  const bristles=s=>{const r=rng(s);return Array.from({length:11},(_,j)=>({o:(j-5)*1.05+(r()-.5)*.7,k:.35+r()*.55,a:.18+r()*.3}));};
  function drawStroke(s){const p=s.p;if(s.m==='olena'){wash(p);return;}const br=s.m==='alaea'?bristles(s.s):null;for(let i=2;i<p.length;i+=2)seg(s.m,[p[i-2],p[i-1]],[p[i],p[i+1]],rng(s.s*31+i),i===2,br);}
  function redraw(){cx.globalCompositeOperation='source-over';cx.drawImage(paper,0,0);const pg=MB().pages[MB().cur]||[];
    if(MB().cur%2){cx.fillStyle='rgba(70,50,30,.08)';cx.fillRect(PW-6,0,6,PH);}
    for(const s of pg)drawStroke(s);
    num.textContent=(MB().cur+1)+' / '+PAGES;}
  // ── materials: what you carry, and how much is left of the piece in use
  let sel=MB().sel||'charcoal';
  const avail=k=>(MB().left[k]||0)>0||have(k)>0;
  function paintTools(){tools.innerHTML=INKS.map((m,i)=>{const n=have(m.k),l=MB().left[m.k]||0;return `<button data-k="${m.k}" class="${m.k===sel?'on':''} ${avail(m.k)?'':'none'}"><i style="background:${m.col}"></i>${i+1} ${K[m.k].n.replace(/ \(.*\)/,'').replace(' in a shell','').replace(' berries','')}<small>${n}${l>0?' +'+Math.ceil(l/m.len*100)+'%':''}</small></button>`;}).join('')+
    `<p>${INKS.some(m=>avail(m.k))?'Drag on the page to draw. 1–5 change what you draw with. ← → turn the page.':'You have nothing to draw with. A fire that has burned down leaves charcoal in the ring.'}</p><button data-tear>Tear out this page</button><p>M or Esc to close</p>`;
    tools.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{sel=b.dataset.k;MB().sel=sel;paintTools();});
    tools.querySelector('[data-tear]').onclick=()=>{if((MB().pages[MB().cur]||[]).length&&confirm('Tear this page out of the notebook?')){MB().pages[MB().cur]=[];SFX.page();redraw();}};}
  function spend(m,L){const I=INKS.find(i=>i.k===m);MB().left[m]=(MB().left[m]||0)-L;if(MB().left[m]<=0){if(takeFrom(m,1)){MB().left[m]+=I.len;if(m==='ink')give('shell',1);}else{MB().left[m]=0;return false;}}return true;}
  // ── drawing
  let cur=null,on=false;
  const pt=e=>{const b=cv.getBoundingClientRect();return[Math.round((e.clientX-b.left)/b.width*PW*2)/2,Math.round((e.clientY-b.top)/b.height*PH*2)/2];};
  cv.addEventListener('pointerdown',e=>{if(!avail(sel)){toast('Nothing left to draw with in '+K[sel].n.toLowerCase()+'.');return;}cv.setPointerCapture(e.pointerId);
    const p=pt(e);cur={m:sel,s:(Math.random()*1e9)|0,p:[p[0],p[1]]};(MB().pages[MB().cur]||(MB().pages[MB().cur]=[])).push(cur);});
  cv.addEventListener('pointermove',e=>{if(!cur)return;const p=cur.p,q=pt(e),lx=p[p.length-2],ly=p[p.length-1],L=Math.hypot(q[0]-lx,q[1]-ly);if(L<2.5)return;
    if(!spend(cur.m,L)){toast('That was the last of the '+K[cur.m].n.toLowerCase().replace(/ \(.*\)/,'')+'.');cur=null;paintTools();return;}
    p.push(q[0],q[1]);if(cur.m==='olena')redraw();else seg(cur.m,[lx,ly],q,rng(cur.s*31+p.length-2),p.length===4,cur.m==='alaea'?bristles(cur.s):null);
    if(Math.random()<.02)paintTools();if(cur.m==='charcoal'||cur.m==='alaea')scratch(L);});
  const end=()=>{if(cur){if(cur.p.length<4)MB().pages[MB().cur].pop();cur=null;paintTools();note('map');}};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  let scrT=0;function scratch(L){if(time-scrT<.05||!AU.ctx)return;scrT=time;noiseBurst(AU.white,'bandpass',sel==='charcoal'?2400:1500,.9,.025,.005,.04);}
  const chatBox=()=>{let n=document.querySelector('.c-title');while(n&&n.parentElement&&n.parentElement!==document.body)n=n.parentElement;return n;};
  function open(){if(on)return;on=true;root.classList.add('on');const cb=chatBox();if(cb)cb.style.visibility='hidden';if(document.pointerLockElement)document.exitPointerLock();for(const k in keys)keys[k]=false;MB().cur=Math.min(MB().cur||0,PAGES-1);
    if(!avail(sel)){const f=INKS.find(m=>avail(m.k));if(f)sel=f.k;}redraw();paintTools();SFX.page();note('map');}
  function close(){on=false;cur=null;root.classList.remove('on');const cb=chatBox();if(cb)cb.style.visibility='';}
  function turn(d){MB().cur=(MB().cur+d+PAGES)%PAGES;redraw();SFX.page();}
  function key(e){if(e.code==='KeyM'||e.code==='Escape'){close();return true;}if(e.code==='ArrowLeft'||e.code==='KeyA'){turn(-1);return true;}if(e.code==='ArrowRight'||e.code==='KeyD'){turn(1);return true;}
    const n=+e.key;if(n>=1&&n<=INKS.length){sel=INKS[n-1].k;MB().sel=sel;paintTools();}return true;}
  function tick(dt){if((fT-=dt)<=0){fT=6;forage();}}
  return{open,close,key,tick,turn,get on(){return on;},get sel(){return sel;},KINDS,INKS,forage,canvas:cv,redraw};
})();
