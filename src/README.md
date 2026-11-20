# src: the game's code, one file per system

`index.html` loads these files **in the order listed there (`PARTS`)** and runs them as one script: every file shares one scope, and
a file may use anything a file earlier in the order defined. There are no imports between them and no build step.

Order matters for top-level code only. Code inside functions, `update()` methods and the frame loop can use names defined later,
because it runs after every file has loaded.

## Who owns what

The two builders and the lead each own their own files. Edit another owner's file only for a small hook (one line to call your
system from the frame loop, for example) and say so in your report. The lead merges.

| Owner | Files | Covers |
|---|---|---|
| **Lead** | `00-core.js`, `40-lanai-props.js`, `70-reel-menu.js`, `80-frame.js`, `90-world-state.js`, `94-making-building.js`, `97-fixtures.js`, `99-clock-hands-save.js`, `A6-physics.js` | Imports, settings, renderer and quality ladder; props; home screen and menu; frame loop; items, notebook, book; making and building; saving; physics |
| **Builder: living world** | `30-vegetation.js`, `60-player.js`, `92-hero.js`, `96-creatures.js`, `A0-sea-life.js`, `A2-forest.js`, `A4-fauna.js` | Trees and plants, the player's body and movement, the character, every animal on land and in the sea |
| **Builder: environment** | `10-island.js`, `12-materials.js`, `14-sky-lights.js`, `16-terrain.js`, `20-water.js`, `50-time-skies.js`, `52-audio.js`, `98-weather.js` | The island's shape and ground truth, terrain and its materials, sky, sun, moon and shadows, time of day, sea, river and waterfall, weather, sound |

## Shared contracts (do not break them without the lead)

- **Ground truth** (`10-island.js`): `heightAt(x,z)`, `freshAt(x,z)`, `masks(x,z)`, `zoneAt(x,z)`, `surfaceAt(x,z)`, `forestW(x,z)`,
  `riverQ(x,z)`, the terrain grid `TERR`/`TGRASS`. Everything that places or moves things asks these.
- **Shared uniforms** `U` (`00-core.js`/`14-sky-lights.js`): `uTime`, `uSunDir`, `uDay`, `uWet`, `uSwell`, `uUnder`, `uCover`, `uFogCol`…
- **Wind**: `windAt` (TSL) and `WIND` (CPU) for anything that sways.
- **Colliders**: `colliders` `{x,z,r}`; the physics world `PHYS`.
- **Test hook**: `window.__hm` (`A4-fauna.js`, at the end of the fauna section). Add what your tests need; never remove.
- **Module pattern**: a system is an IIFE that builds its meshes and returns `update(dt,time)`, called once from `80-frame.js`.
