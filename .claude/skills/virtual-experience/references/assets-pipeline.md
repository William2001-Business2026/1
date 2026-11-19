# Assets: sources, licences, pipeline, credits

## Order of preference
1. **CC0:** Poly Haven (HDRI skies, 2K PBR textures, props, plants, boulders), ambientCG, Quaternius (character and animations, CC0 as downloaded).
2. **CC BY 4.0:** Sketchfab models with "CC Attribution". Credit each one (title, author, link, what changed) in `assets/models/README.txt` and in the README.
3. **Built in code:** where no good free asset exists (corals, sea creatures, Hawaiian trees, small creatures). Say so in the report.
4. **AI-generated (Higgsfield or similar):** only if the user agrees, because it costs credits.

Never use NonCommercial, NoDerivatives, "Standard" or editorial licences, or models that look like assets ripped from a commercial game (for example a "game-ripper" account or the same model reposted under several names).

## Picking a model
- Search the Sketchfab API with `downloadable=true`, filter out disallowed licences and anything over about 200k faces, and fetch the thumbnails into a contact sheet to judge realism at a glance.
- Prefer rigged and animated models. Avoid morph-target animations, which are huge.
- A close relative is fine as a stand-in (Canada goose for nēnē, red-tailed hawk for ʻio, hummingbird recoloured for honeycreepers). Name it as the local species in the game, and list the stand-ins in the credits.
- Render front and side previews (`scripts/views.js`) to learn which way each model faces and whether it has a display base to cut off.

## Download
Sketchfab: `GET https://api.sketchfab.com/v3/models/{uid}` (licence, author, URL) and `/download` (a temporary GLB URL). Use the header `Authorization: Token proxy-injected`; the environment's network secret supplies the real token. Never ask for the token in chat, and never write it to a file.

## Compress and clean (`scripts/prep_model.mjs`)
```bash
node prep_model.mjs in.glb out.glb '{"keepAnims":["Idle","Walk"],"tris":9000,"tex":1024}'
```
It removes unwanted animations, converts spec-gloss materials to metal-rough, simplifies static meshes to a triangle budget, then resamples, dedups, prunes, converts textures to WebP at the given size and applies meshopt compression. It needs `@gltf-transform/core`, `extensions` and `functions`, plus `meshoptimizer` and `sharp`.

Budgets that worked: small creatures 4k triangles at 512 px; animals 8–10k triangles at 1024 px; whole fauna set about 6 MB.

## In the game
- **Rigged models:** `cloneSkinned`, scale to the target size, turn so they face +z, keep the mixer.
- **Static models:** `bake` into a canonical mesh. Cut a display base with `cut` (a fraction of the height). Recolour in a shader by luminance (`recolour`) for stand-ins.
- **Textures and skies** have JSON sidecars (source asset, sun direction, exposure).
