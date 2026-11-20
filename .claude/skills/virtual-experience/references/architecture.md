# Architecture of the reference build (Hale Moku)

The game's code is in `src/`, one file per system, in labelled sections (`/* ───── name ───── */`). `index.html` holds the styles, the HUD markup and a small loader that fetches the parts **in a fixed order** and runs them as **one module**, so every part shares one scope, exactly as when it was a single script. No bundler and no imports between parts: a part simply uses what an earlier part defined. `window.__where(n)` turns a line number from an error into `file:line`. Ownership of each file, for team work, is in `src/README.md`. Comments explain *why*, in plain words.

Adding a file: put it in `src/`, add it to `PARTS` in `index.html` at the point in the order where what it needs is already defined, and add it to `src/README.md`.

## Section order and what each one owns

| Section | Owns | Notes |
|---|---|---|
| Import map, fonts, styles, HUD markup | `#hud`, `#label`, `#toast`, `#hint`, menu | Import map points `three` and `three/webgpu` at `vendor/three/build/three.webgpu.js` when served, and a CDN when opened as a file. |
| utilities | `clamp`, `lerp`, `smooth`, `rng(seed)`, `vnoise`, `fbm`, `srgb` | Deterministic noise everywhere, so the world is the same on every load. |
| settings | `settings` saved in localStorage (`halemoku`) with a version | |
| renderer | `WebGPURenderer` (forceWebGL by URL), `RenderPipeline` post (AO → bloom → tone map → grade) | `postU` uniforms: time, grain, vignette, under-water. |
| frame rate and resolution | `PRESETS`, `AUTO_LEVELS`, `perfTick`, `sizeRenderer`, frame limiter | Quality knobs: scale, shadow size, MSAA, AO, bloom, grass density, CSM. |
| island shape | `MAP`, `coastR`/`coastAt`, `masks(x,z)` → `{r,th,d,lava}`, `heightBase`, `RIVER`, `riverQ`, `heightRaw`, `heightAt`, `freshAt`, `zoneAt`, `grassMask`, `surfaceAt` | **The single source of ground truth.** `d` is the distance from the coast in metres. Functions take `S` (scale) so the old map can still be evaluated for save migration. |
| procedural textures, scanned materials | `canvasTex`, `pbrTex(name)` → `{a,n}`, `nrNormal` | |
| sky | TSL sky, HDRI blend (`skyHDR`, `SKYU`), uniforms `U` (sun, time, cover, day, under, wet, swell, fog colour) | `U` is the shared uniform bag for all shaders. |
| lights | sun (CSM on High), hemisphere, environment intensity | Base values are kept (`envBase`, `hemiBase`) so they can be dimmed under water. |
| terrain | `PlaneGeometry(SIZE, SEG)`; per-vertex colour and `aMat` (0 sand, ~1 grass, 2 rock) | Heights go into `TERR` (shared with the sea shader and the physics ground) and grass coverage into `TGRASS`. |
| ocean | ring geometry, TSL water shader (waves, foam, Snell's window from below) | Reads the height texture made from `TERR`. |
| fresh water | river ribbon, pool and spring discs, waterfall spray | One shader, `aFlow` and `aFoam` per vertex, `U.uSwell` after rain. |
| vegetation | palms, `GRASS` (chunked instancing with LOD), shrubs/ferns, rocks | `windAt(p)` returns push x, push z and gust. |
| lanai, props, items | interactable objects, `addItem`, `fixture` | |
| time of day, skies | `applyTime`, `pickSky` | |
| audio | WebAudio, all synthesised: noise buffers, filters, `scheduleAudio` per frame | A master low-pass is used for muffling under water. |
| player | movement (walk, swim, dive, climb, slide), camera (first and third person), `DIVE`, `STAM` | |
| frame loop | `frame(now)`, which calls each system's update | Started by `requestAnimationFrame(frame)` at the very end, after all modules exist. |
| notebook | `NOTES` journal entries, `note(id)` | |
| items and making | `K` item table, `RECIPES`, `tryRecipe`, `eat`, `dishOf` | Cooked versions (`c_`, `d_`) are generated from `cook:1`. |
| planting, building, structure | plots and crops; free building pieces on a half-metre grid; support rules | |
| creatures | farm chickens and goat, `dressAnimal` (rigged models) | |
| weather, slow clock, saving | `updateWeather`, `tick`, `serialize`/`loadSave` (versioned, with migration) | |
| zone modules | `SEA` (undersea), `FLORA` (trees), `FAUNA` (forest animals), `SUMMIT` (cloud cap) | Each is an IIFE returning `update`/`tick`. |
| physics | Rapier world: a terrain trimesh from `TERR`, dropped items, buoyancy | |
| test hooks | `window.__hm` (player, systems, give, spawn, …) and `window.__gfx()` (renderer stats) | Kept for automated testing. |

## Shared functions every system must use

- `heightAt(x,z)`: the ground height, including river carving and flattening around the deck.
- `freshAt(x,z)`: the fresh-water level (river, pool, spring) or `null`. The sea level is `water.position.y`.
- `masks(x,z)`: the distance from the coast, angle, and lava weight.
- `zoneAt(x,z)`, `forestW(x,z)`, `mountainH(x,z)`: what kind of place this is.
- `windAt(positionLocal.xz)` (TSL): the one wind for every plant.
- `give(kind,n)`, `takeFrom`, `have`, `spawn`, `note`, `toast`: the inventory and feedback.
- `interact` array plus `userData.item = {label(), verb, e(), use(k)}`: anything you can look at. The look ray also records `hitId` for instanced meshes.

## The module pattern

```js
/* ───────── Name: what it is, in one sentence ─────────
   What lives here, why it is built this way, and what it is tied to. */
const NAME=(()=>{
  // build: geometry, materials, placement using heightAt/masks/zones
  // register: interact.push(mesh); mesh.userData.item={...}
  return{update(dt,time){/* visibility by distance, animation, behaviour */},counts:{/* for tests */}};
})();
```

Call `NAME.update(dt,time)` from the frame loop next to the others. Expose it on `window.__hm` for tests.

## Placement conventions

- **Coordinates:** x is east and z is south; the sun sets to the west-south-west. Animals use `yaw = atan2(dx, dz)` with the model facing +z.
- **Landmarks** are named constants (`LANAI`, `START`, `POOL`, `SPRING`, `PEAK`, `FOREST`). Things near a landmark are placed relative to it, so moving the landmark moves its surroundings rigidly.
- **Scatter** uses seeded `rng`, never `Math.random`, so the world is identical on every load. Use `Math.random` only for runtime behaviour.
- **Never** put things on the deck, in water, on cliffs (steep `tnorm`), on the arrival beach, or on bare sand where they would not grow.

## Saves

The save format is versioned (`v`). When the map changes, write a migration (`fromSmallIsland`): items and plots move one by one; buildings move as rigid groups, with y shifted by the ground difference; fire state resets. Keep old-map functions (`S=1`) so the migration can read old heights.
