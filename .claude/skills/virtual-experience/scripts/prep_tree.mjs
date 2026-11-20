// node prep_tree.mjs in.gltf out.glb '{"leafMat":"frond","opaque":true,"trunk":2500,"branches":5000,"keep":0.3,"grow":1.45,"leafTris":30000,"tex":1024}'  (far version: keep .03-.09, grow 2.2-2.8, leafTris 5000, tex 512)
// Turns a film-quality tree scan into a game tree: trunk and branches simplified, leaves thinned to whole leaves
// (each kept leaf enlarged about its own centre so the canopy stays full), leaves alpha-tested, textures WebP.
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,textureCompress,meshopt,weld,dequantize} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';import sharp from 'sharp';
const [,,inp,out,optS]=process.argv;const opt=JSON.parse(optS||'{}');await MeshoptEncoder.ready;await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});await MeshoptDecoder.ready;const doc=await io.read(inp);await doc.transform(dequantize()); // reads compressed (quantized) GLBs too
const rnd=(()=>{let s=12345;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};})();
let report=[];
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const mat=p.getMaterial(),name=(mat&&mat.getName()||'').toLowerCase(),idx=p.getIndices().getArray(),pos=p.getAttribute('POSITION').getArray(),uv=p.getAttribute('TEXCOORD_0')?.getArray();
  const tris=idx.length/3;
  if(new RegExp(opt.leafMat||'leaves|leaf').test(name)){ // leafMat: a regex for the foliage materials' names
    // whole leaves: connected pieces of the mesh
    const vc=pos.length/3,par=new Int32Array(vc);for(let i=0;i<vc;i++)par[i]=i;const f=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
    for(let t=0;t<idx.length;t+=3){const a=f(idx[t]),b=f(idx[t+1]),c=f(idx[t+2]);par[b]=a;par[c]=a;}
    const comp=new Map();for(let t=0;t<idx.length;t+=3){const r=f(idx[t]);let c=comp.get(r);if(!c){c={tris:[],n:0};comp.set(r,c);}c.tris.push(t);}
    const comps=[...comp.values()],keepFrac=opt.keep||Math.min(1,(opt.leaves||9000)/tris);const kept=[];const grow=opt.grow||Math.min(3,1/Math.sqrt(keepFrac)*.75);
    const newPos=new Float32Array(pos);const out=[];
    for(const c of comps){if(rnd()>keepFrac)continue;const vs=new Set();for(const t of c.tris)for(let k=0;k<3;k++)vs.add(idx[t+k]);
      let cx=0,cy=0,cz=0;for(const v of vs){cx+=pos[v*3];cy+=pos[v*3+1];cz+=pos[v*3+2];}cx/=vs.size;cy/=vs.size;cz/=vs.size;
      for(const v of vs){newPos[v*3]=cx+(pos[v*3]-cx)*grow;newPos[v*3+1]=cy+(pos[v*3+1]-cy)*grow;newPos[v*3+2]=cz+(pos[v*3+2]-cz)*grow;}
      for(const t of c.tris)out.push(idx[t],idx[t+1],idx[t+2]);kept.push(c);}
    p.getAttribute('POSITION').setArray(newPos);
    let ix=new Uint32Array(out);const lt=opt.leafTris||16000;
    if(ix.length/3>lt){const attr=new Float32Array(vc*2);if(uv)attr.set(uv.subarray(0,vc*2));             // then simplify each kept leaf, keeping its outline and texture
      const [res]=MeshoptSimplifier.simplifyWithAttributes(ix,newPos,3,attr,2,[2,2],null,3*Math.floor(lt),.2,['Permissive']);ix=res;}
    p.getIndices().setArray(ix);
    if(mat){if(!opt.opaque){mat.setAlphaMode('MASK');mat.setAlphaCutoff(.45);}mat.setDoubleSided(true);} // opaque: leaves are geometry, not cut-out cards
    report.push(`${name}: ${comps.length} leaves, kept ${kept.length}, ${p.getIndices().getCount()/3} tris, grown ${grow.toFixed(2)}x`);
  }else{
    const target=/trunk/.test(name)||!/branch/.test(name)&&tris<60000?(opt.trunk||3000):(opt.branches||5000);
    const vc=pos.length/3,attr=new Float32Array(vc*2);if(uv)attr.set(uv.subarray(0,vc*2));
    const [res,err]=MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(idx),pos,3,attr,2,[.6,.6],null,Math.max(300,3*Math.floor(Math.min(tris,target))),.05,['Permissive']);
    p.getIndices().setArray(res);report.push(`${name}: ${tris} → ${res.length/3} tris (err ${err.toFixed(3)})`);
  }}
await doc.transform(prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[opt.tex||1024,opt.tex||1024],quality:80}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(out,doc);console.log(out);for(const r of report)console.log('  '+r);
