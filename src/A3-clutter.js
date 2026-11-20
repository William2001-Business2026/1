/* ───────── the forest floor: fallen trunks, stumps, mossy rocks and roots (Poly Haven, CC0) ─────────
   Streamed in 32 m chunks around you like the trees, and placed by the same ground truth: under the forest, on ground that is
   not too steep, never in water or on the paths home. Each piece sits a little sunk into the ground and tipped to its slope;
   the big ones block your way. Counts scale with quality. */
const CLUTTER=(()=>{
  const KINDS=[['dead_tree_trunk',.22,[.8,1.25],.55],['tree_stump_01',.2,[.7,1.2],.45],['rock_moss_set_01',.4,[.5,1.3],.5],['root_cluster_01',.18,[.6,1.1],0]]; // file, share, size range, collider radius per metre
  const V=[],CAP=420;let ready=false;const live=new Set();
  Promise.all(KINDS.map(k=>gltfLoader.loadAsync('assets/models/clutter/'+k[0]+'.glb'))).then(gls=>{
    gls.forEach((gl,ki)=>{gl.scene.updateMatrixWorld(true);gl.scene.traverse(o=>{if(!o.isMesh)return;const geo=floatGeo(o.geometry).applyMatrix4(o.matrixWorld);geo.computeBoundingBox();
      const b=geo.boundingBox,c=b.getCenter(new THREE.Vector3());geo.translate(-c.x,-b.min.y,-c.z);geo.computeBoundingSphere();const r=Math.max(b.max.x-b.min.x,b.max.z-b.min.z)/2;
      const m=o.material.clone();if(m.color)m.color.multiply(new THREE.Color(.62,.7,.52));                      // darker and mossier: wet, shaded rainforest floor
      const im=new THREE.InstancedMesh(geo,m,CAP);im.count=0;im.castShadow=im.receiveShadow=true;im.frustumCulled=false;im.raycast=()=>{};scene.add(im);V.push({ki,im,r});});});
    ready=true;for(const ch of L.chunks.values())if(ch.state===2)place(ch);redraw();}).catch(e=>console.warn('Forest-floor pieces did not load:',e));
  const q=()=>activeGfx().grass;
  function* build(ch){const R=ch.R,out=[];const n=Math.round(9*q());
    for(let i=0;i<n*3&&out.length<n;i++){const x=ch.x0+R()*32,z=ch.z0+R()*32,u=R(),s=R(),yw=R()*6.283;
      if(forestW(x,z)<.42||heightAt(x,z)<2||freshAt(x,z)!=null)continue;const rq=riverQ(x,z);if(rq&&rq.d<rq.w+3)continue;
      const nn=tnorm(x,z);if(nn.y<.78)continue;if(Math.hypot(x-LANAI.x,z-LANAI.z)<20||Math.hypot(x-START.x,z-START.z)<20)continue;
      let a=u,k=0;for(;k<KINDS.length-1;k++){a-=KINDS[k][1];if(a<=0)break;}out.push({k,x,z,s,yw,nn});}
    yield;ch.items=out;}
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Qy=new THREE.Quaternion(),S=new THREE.Vector3(),P=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
  function place(ch){if(!ready||!ch.items)return;ch.cols=[];ch.mats=ch.items.map(it=>{const vs=V.filter(v=>v.ki===it.k);if(!vs.length)return null;const v=vs[Math.floor(it.s*vs.length*7)%vs.length],K=KINDS[it.k];
      const sc=K[2][0]+(K[2][1]-K[2][0])*it.s;Q.setFromUnitVectors(Y,it.nn);Qy.setFromAxisAngle(Y,it.yw);Q.multiply(Qy);
      const h=Math.min(heightAt(it.x,it.z),heightAt(it.x+v.r*sc*.6,it.z),heightAt(it.x-v.r*sc*.6,it.z),heightAt(it.x,it.z+v.r*sc*.6),heightAt(it.x,it.z-v.r*sc*.6));
      P.set(it.x,h-.06*sc,it.z);S.setScalar(sc);if(K[3]&&v.r*sc>.35){const c={x:it.x,z:it.z,r:v.r*sc*K[3]};colliders.push(c);ch.cols.push(c);}
      return{v,m:new THREE.Matrix4().compose(P,Q,S)};}).filter(Boolean);live.add(ch);}
  function redraw(){for(const v of V)v.im.count=0;for(const ch of live)for(const e of ch.mats){const im=e.v.im;if(im.count>=CAP)continue;im.setMatrixAt(im.count++,e.m);}for(const v of V)v.im.instanceMatrix.needsUpdate=true;}
  const L=STREAM.layer({name:'clutter',size:32,seed:256,prio:2,radius:()=>45+50*q(),margin:12,build,
    ready(ch){place(ch);redraw();},
    dispose(ch){live.delete(ch);for(const c of ch.cols||[]){const i=colliders.indexOf(c);if(i>=0)colliders.splice(i,1);}redraw();}});
  return{L,get count(){let n=0;for(const ch of live)n+=ch.mats.length;return n;}};
})();
