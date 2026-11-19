// Test-only shim: this headless browser loses its WebGPU instance when a real canvas is configured.
// Hand Three.js a stand-in context that renders into an ordinary GPU texture, and read frames back from it.
(()=>{
  const orig=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...a){
    if(type!=='webgpu')return orig.call(this,type,...a);
    const canvas=this;let cfg=null,tex=null;
    const ctx={canvas,configure(c){cfg=c;tex=null;},unconfigure(){cfg=null;},getConfiguration(){return cfg;},
      getCurrentTexture(){const w=canvas.width,h=canvas.height;if(!tex||tex.width!==w||tex.height!==h){if(tex)tex.destroy();
        tex=cfg.device.createTexture({size:[w,h],format:cfg.format,usage:(cfg.usage||0)|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC|GPUTextureUsage.TEXTURE_BINDING});}return tex;}};
    window.__fakeGPU=ctx;return ctx;
  };
  window.__grab=async()=>{const ctx=window.__fakeGPU;if(!ctx)return null;const tex=ctx.getCurrentTexture(),dev=ctx.getConfiguration().device;
    const w=tex.width,h=tex.height,bpr=Math.ceil(w*4/256)*256;const buf=dev.createBuffer({size:bpr*h,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    const e=dev.createCommandEncoder();e.copyTextureToBuffer({texture:tex},{buffer:buf,bytesPerRow:bpr},[w,h]);dev.queue.submit([e.finish()]);
    await buf.mapAsync(GPUMapMode.READ);const src=new Uint8Array(buf.getMappedRange());const c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d'),id=g.createImageData(w,h),bgra=ctx.getConfiguration().format.startsWith('bgra');
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*bpr+x*4,o=(y*w+x)*4;id.data[o]=src[i+(bgra?2:0)];id.data[o+1]=src[i+1];id.data[o+2]=src[i+(bgra?0:2)];id.data[o+3]=255;}
    g.putImageData(id,0,0);buf.unmap();buf.destroy();return c.toDataURL('image/png');};
  const o=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...a){const d=await o.apply(this,a);
    window.__dev=d;d.lost.then(i=>console.error('DEVICE LOST '+i.message));d.addEventListener('uncapturederror',e=>console.error('GPU ERROR '+e.error.message.slice(0,700)));return d;};
  // a real canvas makes the CPU wait for the GPU; this stand-in does not, so wait for each frame's GPU work by hand
  const raf=window.requestAnimationFrame.bind(window);let pending=false;
  window.requestAnimationFrame=function(cb){if(cb.name!=='frame')return raf(cb);
    return raf(function tick(t){if(pending)return raf(tick);cb(t);
      if(window.__dev){pending=true;window.__dev.queue.onSubmittedWorkDone().then(()=>{pending=false;},()=>{pending=false;});}});};
  const q=new URLSearchParams(location.search).get('testquality');if(q)localStorage.setItem('halemoku',JSON.stringify({v:2,quality:q}));
})();
