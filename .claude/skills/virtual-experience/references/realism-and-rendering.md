# Realism and rendering: rules and known pitfalls

## WebGPU / TSL rules
- Write shaders in TSL (`Fn`, `If`, `Loop`, `uniform`, `attribute`, `varyingProperty`) so that the same code runs on WebGPU and WebGL 2.
- Functions with `.setLayout()` mis-bind uniforms: use layouts only for pure maths (noise, hashes). Inline anything that reads a uniform.
- For instanced meshes, `positionLocal` inside `positionNode` is **after** the instance transform, so it is effectively world space for a mesh at the origin. `positionGeometry` is the raw vertex. For per-instance data (root, phase, side vector), add an `InstancedBufferAttribute` and read it with `attribute()`.
- For a loaded GLB, the GLTFLoader creates plain `MeshStandardMaterial`s. `colorNode` and `positionNode` only work on node materials, so convert first (`toNode(m)`), and drop emissive maps when recolouring.
- Shader functions you use must be destructured from `TSL` in that scope (missing `min` once broke the water shader).
- Placeholder textures must be filterable (Linear, not Nearest/Nearest), or you get "unresolved value nodeUniform_sampler".
- AO (GTAO) cannot read a multisampled depth texture: with AO on, use samples 0 and FXAA.
- Uniform bag `U` holds shared state: time, sun, cover, day, under-water, wet, swell, fog colour. Create new uniforms right after the sky module, before materials that use them.
- Dimmable lights: keep base values (`envBase`, `hemiBase`, `sunBase`) and multiply them each frame; never multiply a value that is not reset each frame.
- `scene.fog` is created once at start-up with density 0 (so all materials compile with fog) and only thickened under water or in mist.
- The frame loop starts at the very end of the module, so every module object exists before the first frame.

## Geometry pitfalls
- Compressed (quantised) GLB attributes clamp when moved or scaled in place. Copy them to floats first (`floatGeo`) before `applyMatrix4`, scale or translate. This once smeared a fern into a green slab.
- Bounding spheres of moving instanced meshes go stale: set them by hand (and set `frustumCulled=false` when needed), because raycasts use them.
- Heightfield cliffs zig-zag at 1.25 m resolution: soften rock masks (wide `smooth` on normal.y), avoid near-vertical carving, and keep cliffs short.
- Straight edges look artificial (reef drop-off, mountain ridges): wander them with noise.
- Raycasts ignore visibility, so give decorative instanced meshes `raycast=()=>{}`.

## Realism checklist (the "sticker" test)
1. **Lighting matches the surroundings:** foliage normals point outward from the crown or up from the ground, never per-card flat. Grass is lit like the ground.
2. **Colour comes from the ground:** roots and bases take the soil colour, patches follow the same noise as the terrain, and the terrain under vegetation is tinted toward it.
3. **No hard edges:** thin out by distance with per-instance rank, blend masks smoothly, avoid lone objects on bare sand.
4. **Density:** sparse looks dead. Fill leaf cards, cluster corals, mix sizes (a power curve on scale).
5. **Detail at the right scale:** polyp speckle on coral, lumps on lobe coral, ridges on mushroom coral, mottling on animals. Smooth spheres read as plastic.
6. **Physically plausible light:** under water, sunlight and sky light drop with depth. Falling water is white, not a mirror. Pale materials (kukui, white fish) must not bloom.
7. **Shapes from nature:** fluted ridges rather than cones or domes, tapered and twisting blades rather than flat strips, beaked heads rather than balls.
8. **Distance:** fog or haze fills what is past the terrain; the horizon island has light and shade and haze, not a flat cut-out.

## Performance rules
- Instancing plus chunks (16 m grass, 24 m reef, 64 m trees); visibility by distance; whole systems hidden when irrelevant (the reef while above water).
- Share heights from one grid (`TERR`) for terrain, sea depth texture and physics. Never recompute a million `heightAt` calls when the grid has them.
- Measure before and after with draw stats (`__gfx()`: triangles, calls, grass drawn) and frame time in the same headless setup. Keep the new build within about 1.5× the old visible cost, and let Auto quality absorb the rest.
- Lower quality levels shrink the radii and densities rather than switching features off abruptly.
