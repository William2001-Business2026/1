/* ───────── fixtures: the spring, the bamboo, the palms, the notebook, the old garden ───────── */
RECIPES.push({h:'digstick',keep:1,t:'@seep',out:[['clay',1]],note:'clay',hits:2,toHand:1},{h:'axe',keep:1,t:'@bamboo',out:[['bamboo',2]],hits:3,toHand:1},{h:'axe',keep:1,t:'@palm',out:[['frond',2]],hits:3,toHand:1});
function fixture(g,item,w,h,d){const px=new THREE.Mesh(geo.box,proxyMat);px.scale.set(w,h,d);px.position.y=h/2;g.add(px);g.userData.item=item;scene.add(g);interact.push(g);return g;}
let springIx,barrelLook=null;
{ const g=new THREE.Group(),y=heightAt(SEEP.x,SEEP.z);g.position.set(SEEP.x,y,SEEP.z);
  const mud=part(g,'disc',new THREE.MeshStandardMaterial({color:srgb(.16,.12,.08),roughness:.35,polygonOffset:true,polygonOffsetFactor:-4}),2.2,2.2,2.2,0,.06,0,-Math.PI/2);mud.castShadow=false;
  const wat=part(g,'disc',new THREE.MeshStandardMaterial({color:srgb(.08,.2,.2),roughness:.04,polygonOffset:true,polygonOffsetFactor:-6}),.8,.8,.8,0,.08,0,-Math.PI/2);wat.castShadow=false;
  for(let i=0;i<8;i++){const a=i*.8+.2;part(g,'sph',stoneM(),.16+R()*.1,.1+R()*.06,.15,Math.cos(a)*.95,.06,Math.sin(a)*.95,0,R()*3,0);}
  for(let i=0;i<9;i++){const a=R()*6.28,q=1.2+R()*1;part(g,'leaf',lm(.18,.42,.16),.1,1,.5,Math.cos(a)*q,.05,Math.sin(a)*q,-.9+R()*.4,a,0);}
  springIx={label:()=>'Spring',verb:'',use(k){if(k==='bowl'){takeFrom('bowl',1);give('water',1);SFX.pour();note('water');handAnim=1;return true;}if(k==='digstick')return tryRecipe(k,'@seep');return false;}};
  fixture(g,springIx,1.9,.5,1.9);
  const b=new THREE.Group();b.position.set(GROVE.x,heightAt(GROVE.x,GROVE.z),GROVE.z);
  for(let i=0;i<26;i++){const a=R()*6.28,q=Math.sqrt(R())*1.8,h=4+R()*3,x=Math.cos(a)*q,z=Math.sin(a)*q,ln=(R()-.5)*.25;
    part(b,'cyl',mt(...C_BAM,.4),.04,h,.05,x,h/2-.3,z,ln,0,ln*.6);for(let j=0;j<5;j++)part(b,'leaf',lm(.3,.5,.18),.07,1,.55,x+ln*h*.3,h*.55+j*h*.09,z,-.3+R()*.9,R()*6.28,0);}
  fixture(b,{label:()=>'Bamboo',verb:'',use(k){return k==='axe'&&tryRecipe(k,'@bamboo');}},3.4,3,3.4);colliders.push({x:GROVE.x,z:GROVE.z,r:1.6});
  for(const p of palms){const t=new THREE.Group();t.position.set(p.x,p.y,p.z);fixture(t,{label:()=>'Coconut palm',verb:'',use(k){return k==='axe'&&tryRecipe(k,'@palm');}},.6,2.6,.6);}
  const sh=scene.userData.shrubs;sh.userData.item={label:()=>'Naupaka',get verb(){return W.nodes.flower<=0?'pick flowers':'';},e(){if(W.nodes.flower<=0){give('flower',2);W.nodes.flower=25;SFX.pickup();}}};interact.push(sh);
  const nb=new THREE.Group();part(nb,'box',mt(.33,.2,.12,.6),.15,.022,.2,0,.011,0);part(nb,'box',mt(.9,.86,.74,.9),.14,.016,.19,.004,.014,0);part(nb,'box',mt(.33,.2,.12,.6),.15,.004,.2,0,.026,0);
  nb.position.set(TABLE.x+.18,DECK_Y+TABLE_TOP+.013,TABLE.z-.04);nb.rotation.y=.5;fixture(nb,{label:()=>'Notebook',verb:'read',e(){openBook();}},.2,.1,.24);
  for(const[dx,dz,l]of[[-.8,-.7,.9],[.9,-.6,.7],[.7,.9,1.1]]){const s=new THREE.Mesh(geo.cyl,wood(C_DRIFT));s.scale.set(.025,l,.025);s.position.set(OLDPLOT.x+dx,heightAt(OLDPLOT.x+dx,OLDPLOT.z+dz)+l/2-.1,OLDPLOT.z+dz);s.rotation.z=(R()-.5)*.3;s.castShadow=true;scene.add(s);}
}

