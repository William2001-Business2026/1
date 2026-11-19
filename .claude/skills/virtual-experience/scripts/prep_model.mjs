// node prep_model.mjs in.glb out.glb '{"keepAnims":["Idle"],"tris":8000,"tex":1024,"dropMeshes":["Base"]}'
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {metalRough,prune,dedup,resample,textureCompress,meshopt,weld} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';import sharp from 'sharp';
const [,,inp,out,optS]=process.argv;const opt=JSON.parse(optS||'{}');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(inp);const root=doc.getRoot();
if(opt.keepAnims)for(const a of root.listAnimations())if(!opt.keepAnims.some(k=>a.getName().includes(k)))a.dispose();
if(root.listExtensionsUsed().some(e=>e.extensionName==='KHR_materials_pbrSpecularGlossiness'))await doc.transform(metalRough());
if(opt.dropMeshes)for(const n of root.listNodes()){const m=n.getMesh();if(m&&opt.dropMeshes.some(k=>m.getName().includes(k)||n.getName().includes(k)))n.setMesh(null);}
if(opt.tris){for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){if(p.listTargets().length)continue;const pos=p.getAttribute('POSITION').getArray(),idx=p.getIndices().getArray(),uv=p.getAttribute('TEXCOORD_0')?.getArray();
  const vc=pos.length/3,attr=new Float32Array(vc*2);if(uv)attr.set(uv.subarray(0,vc*2));const target=Math.min(idx.length,Math.round(opt.tris*3*(idx.length/3)/Math.max(opt.tris,totalTris(root))));
  const [res]=MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(idx),pos,3,attr,2,[.5,.5],null,Math.max(3*Math.floor(target/3),300),.02,['Permissive']);p.getIndices().setArray(res);}}
function totalTris(r){let n=0;for(const m of r.listMeshes())for(const p of m.listPrimitives())n+=p.getIndices()?p.getIndices().getCount()/3:0;return n;}
await doc.transform(resample(),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[opt.tex||1024,opt.tex||1024],quality:82}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(out,doc);console.log(out,'tris',totalTris(root),'anims',root.listAnimations().map(a=>a.getName()).join(','));
