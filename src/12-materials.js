/* ───────────────────────── procedural textures ───────────────────────── */
function canvasTex(w,h,draw,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
const grainTex=canvasTex(512,512,(g,w,h)=>{const id=g.createImageData(w,h);const r=rng(5);
  for(let i=0;i<w*h;i++){const x=i%w,y=(i/w)|0;const n=.5*fbm(x*.05,y*.05,3)+.5*r();const v=200+n*55+(r()>.985?-70:0);
    id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=v;id.data[i*4+3]=255;}g.putImageData(id,0,0);},true);
const woodTex=canvasTex(512,256,(g,w,h)=>{g.fillStyle='#8b7a66';g.fillRect(0,0,w,h);const r=rng(9);
  for(let i=0;i<900;i++){const y=r()*h,l=40+r()*300,x=r()*w;g.strokeStyle=`rgba(${r()>.5?40:190},${r()>.5?30:170},${r()>.5?20:150},${.04+r()*.1})`;
    g.lineWidth=.5+r()*1.6;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+l*.3,y+r()*3-1.5,x+l*.6,y+r()*3-1.5,x+l,y+r()*2-1);g.stroke();}
  for(let i=0;i<5;i++){const x=r()*w,y=r()*h;const gr=g.createRadialGradient(x,y,1,x,y,9);gr.addColorStop(0,'rgba(50,35,25,.55)');gr.addColorStop(1,'rgba(50,35,25,0)');g.fillStyle=gr;g.fillRect(x-10,y-10,20,20);}},true);
const barkTex=canvasTex(128,512,(g,w,h)=>{g.fillStyle='#8a7d6c';g.fillRect(0,0,w,h);const r=rng(4);
  for(let y=0;y<h;y+=9+r()*5){g.fillStyle=`rgba(45,38,30,${.35+r()*.3})`;g.fillRect(0,y,w,1.5+r()*2);g.fillStyle='rgba(210,200,180,.12)';g.fillRect(0,y+3,w,2);}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(${60+r()*120|0},${50+r()*110|0},${40+r()*90|0},.14)`;g.fillRect(r()*w,r()*h,1+r()*2,3+r()*12);}},true);
const grassTex=canvasTex(128,128,(g,w,h)=>{const r=rng(8);for(let i=0;i<46;i++){const x=20+r()*88,top=8+r()*70,bend=(r()-.5)*46;
  g.strokeStyle=`rgb(${70+r()*70|0},${105+r()*75|0},${35+r()*35|0})`;g.lineWidth=1.5+r()*2.2;g.lineCap='round';g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x,h-40,x+bend,top);g.stroke();}});
const softTex=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
const clothTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#e9dfcb';g.fillRect(0,0,w,h);const cols=['#3f8a8c','#e9dfcb','#d98e5a','#e9dfcb','#2f6f77'];
  for(let i=0;i<16;i++){g.fillStyle=cols[i%cols.length];g.fillRect(0,i*16,w,i%2?5:11);}
  for(let x=0;x<w;x+=2){g.fillStyle='rgba(0,0,0,.06)';g.fillRect(x,0,1,h);}},true);
const radioTex=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#d9cfb8';g.fillRect(0,0,w,h);g.fillStyle='#2e6f73';g.fillRect(0,0,w,18);g.fillRect(0,h-14,w,14);
  g.fillStyle='#3a342c';for(let y=30;y<104;y+=7)for(let x=14;x<150;x+=7){g.beginPath();g.arc(x,y,2,0,7);g.fill();}
  g.fillStyle='#f4eedd';g.fillRect(166,30,76,30);g.strokeStyle='#8a2f22';g.lineWidth=2;g.beginPath();g.moveTo(210,30);g.lineTo(210,60);g.stroke();
  g.fillStyle='#3a342c';for(let x=170;x<240;x+=6)g.fillRect(x,52,1,6);g.beginPath();g.arc(184,86,11,0,7);g.arc(224,86,11,0,7);g.fill();});

/* ───────────────────────── scanned materials ─────────────────────────
   assets/tex/<name>_albedo.jpg: colour (sRGB). <name>_nr.jpg: normal X,Y and roughness (linear). From Poly Haven, CC0. */
const texLoader=new THREE.TextureLoader(),pbrCache={},gltfLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
function pbrTex(name){
  if(!pbrCache[name]){const a=texLoader.load('assets/tex/'+name+'_albedo.jpg'),n=texLoader.load('assets/tex/'+name+'_nr.jpg');
    a.colorSpace=THREE.SRGBColorSpace;for(const t of [a,n]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}pbrCache[name]={a,n};}
  return pbrCache[name];
}
// normal from a <name>_nr texture sample, in the mesh's own UV tangent frame
function nrNormal(nr,scale=1){const {vec2,vec3,float,sqrt,max,dot,normalMap}=TSL;const t=nr.rg.mul(2).sub(1);
  return normalMap(vec3(nr.r,nr.g,sqrt(max(float(1).sub(dot(t,t)),0)).mul(.5).add(.5)),vec2(scale));}

