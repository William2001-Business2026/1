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

Budgets that worked: small creatures 4k triangles at 512 px; animals 8–10k triangles at 1024 px (a rigged boar at 34k with 7 clips was 0.8 MB); whole fauna set about 6 MB. Keep only the clips the game plays and `rename` them to short role names; dropped clips must have their samplers and keyframes disposed too, or they stay in the file (a fixed bug: the boar was 9.8 MB before).

## Trees (`scripts/prep_tree.mjs`)
Poly Haven tree scans are film assets (hundreds of thousands of triangles). Make a near version (keep .2–.4 of the leaves, grow 1.4–1.6, about 30k leaf triangles, 1K textures) and a far one (keep .03–.09, grow 2.2–2.8, about 5k, 512 px). Poly Haven's API is `api.polyhaven.com/files/<id>`; files come from dl.polyhaven.org. Its thumbnail CDN may be blocked, so render previews locally.

## Characters: retargeting at load
A scanned or other rigged person rarely shares the animation library's skeleton. Retarget once at load (`retargetHero` in the reference build): map bones by name, turn and scale the new body to face and match the old one, line the two rest poses up limb by limb (rotate each target bone so it points where the source bone points, for T-pose versus A-pose), then for each frame carry each bone's world rotation *away from its rest* across, convert to local under the target's parent, keep quaternions in one hemisphere, and move the pelvis by the source's offset scaled by leg length. Keep the old character as the fallback. Scans with only 20–30 bones have no fingers or toes; that is fine at third-person distance.

## In the game
- **Rigged models:** `cloneSkinned`, scale to the target size, turn so they face +z, keep the mixer.
- **Static models:** `bake` into a canonical mesh. Cut a display base with `cut` (a fraction of the height). Recolour in a shader by luminance (`recolour`) for stand-ins.
- **Textures and skies** have JSON sidecars (source asset, sun direction, exposure).
