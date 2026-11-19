---
name: virtual-experience
description: How to plan, build and extend a realistic browser 3D "virtual experience" held to the standard of Red Dead Redemption 2 and Ghost of Tsushima (an explorable world game like Hale Moku, the Hawaiian island) with the same thinking logic and core structure every time. One self-contained index.html on Three.js WebGPU with a WebGL 2 fallback; zones; terrain, water, weather, flora and fauna systems; survival, crafting and food loops; adaptive quality for 1080p and 60 FPS; headless visual testing; shipping phase by phase. Use this skill whenever the user wants to create, extend, fix, reshape or review a virtual experience, a 3D world, an island or zone, a realistic browser game, or any part of Hale Moku (terrain, grass, trees, animals, sea, diving, rain, sound, chat, performance, assets). Use it even if they only say "add X to the island", "make it more realistic", "make it feel like RDR2 or Ghost of Tsushima" or "it feels like a sticker".
---

# Virtual experience

A virtual experience is an explorable, realistic 3D world that runs in the browser: you walk it in third person, gather, build, cook, swim, climb and watch the world live around you. **Hale Moku** (this repository) is the reference build. Every rule below was learned on it, and `references/architecture.md` maps where each piece lives in its code.

The aim is consistency: the same way of thinking, the same structure, and the same standard of finish, whether the task is a new world or one more feature in an existing one.

The project's reference games are **Red Dead Redemption 2** (a living, physical world) and **Ghost of Tsushima** (wind, beauty and composition). They set how the experience should feel. Borrow their qualities, never their content. `references/game-references.md` lists the qualities to aim for.

## The thinking logic

Work through these in order. Each exists because skipping it cost real time on Hale Moku.

### 1. Understand before you change

- Read the request for its **intent**, not only its words. "Make it twice as big" also means doubling counts, moving landmarks, migrating saves and checking frame cost. "Don't make it feel like a sticker" means objects must sit in their surroundings: lit like the ground, coloured from it, without hard edges.
- Inspect the code you will touch: grep the section, read the functions, find every hard-coded coordinate and count it depends on.
- List what you are unsure of. Decide everything that has a sensible default yourself.

### 2. Ask only what is the user's to decide, and recommend

Ask (one round, several questions together) when a choice changes what gets built and only the user can make it: theme and setting, what a vague word means ("fountain zone"), punishments and rules (air time, what happens on failure), what may be hunted. Put your recommendation first and explain the trade-off in one line each. Flag conflicts the user may not see, such as Asian rainforest animals on a Hawaiian island, or hunting an endangered species. Do not ask about things the code or a convention answers.

### 3. Plan in shippable parts

Big requests become **parts**, each one playable, tested, documented and pushed on its own: for example (1) terrain, zones and water, (2) undersea, (3) forest and animals, (4) climbing, weather and summit. Say the plan and the order up front. Track the parts as tasks.

### 4. Build to the standard

Hold every feature to the realism and performance standard in the next section, and name which reference-game qualities it should deliver (see `references/game-references.md`). Prefer real scanned or rigged assets (CC0 first, then CC BY with credits). Build in code where no good free asset exists, and say so. Keep every system tied to the shared ones: the same wind, height grid, time of day, water levels, zones, items and journal, so things feel like one world.

### 5. Look at it, then fix what is weak

After each part, render screenshots headlessly from the places a player will stand (see `references/testing-and-shipping.md`) and judge them honestly:

- Does anything look **pasted on**: flat lighting, hard edges, wrong colour against the ground, floating, sitting on bare sand where it would not grow?
- Is anything a smooth blob, a uniform colour, a straight line where nature is ragged, or a bright glow where it should be dim?
- Would it hold up next to Red Dead Redemption 2 or Ghost of Tsushima? Name the biggest gap (too sparse, too smooth, too evenly lit, too quiet) and close it first.

Fix the weakest things before moving on. If it still is not good enough, say what remains weak.

### 6. Ship and report truthfully

Update the README (player-facing, plain words) and the asset credits, commit with a clear message, and push. Then report what you built, what you verified and how, what you could not test (real-GPU frame rate, feel, sign-in end to end) and what is still weak. Never claim a thing works that you did not check.

## The standard

| Area | Standard |
|---|---|
| Rendering | Three.js WebGPU build (TSL shaders) with an automatic WebGL 2 fallback, and `?renderer=webgl` to force it. Vendored locally; no build step. |
| Targets | 1920×1080 cap, 16:9 letterboxed, 60 FPS cap, never below 30. An Auto quality ladder steps down within about 2 s of slow frames and back up after about 8 s of smooth ones. |
| Look | PBR materials from 2K scans, photographed HDRI skies blended through the day, dynamic shadows (cascaded on High), bloom and AO on High, a filmic grade. The benchmark is Red Dead Redemption 2 and Ghost of Tsushima: their qualities, never their content. |
| Life | One shared wind moves grass, plants and trees. Animals have behaviour (wander, graze, flee, perch, soar). Sound changes by zone and by what is near. |
| Ground truth | Every placement queries the same height and water functions, so nothing floats, sinks or grows in a river. |
| Scale | Dense things (grass, coral, trees) are instanced in chunks, with distance detail and culling, and their count scales with quality. |
| Culture | Real names with correct diacritics (ʻokina, kahakō for Hawaiian), real species in their real habitats, and protected species treated as protected. |
| Safety | No secrets in the repo; the chat uses only the publishable key, with rules enforced in the database. Avoid key bindings that collide with browser shortcuts (Ctrl+W closes the tab). |

## Core structure

```
index.html             the whole game: styles, HUD, and one module script in labelled sections
chat.js, chat.css      optional multiplayer chat panel (Supabase, Google sign-in only)
chat-config.js         public URL and publishable key only
supabase/migrations/   database schema and row-level security
assets/sky/            HDRI skies + skies.json (sun direction, exposure, time range)
assets/tex/            2K PBR sets: <name>_albedo.jpg and <name>_nr.jpg (normal XY, roughness)
assets/models/         compressed GLB (meshopt, WebP), with README.txt credits; props/, fauna/
vendor/                three (WebGPU build and addons), rapier, supabase-js, fonts
README.md              what a player and a host need to know, and asset credits
```

The order of sections in `index.html`, and the contract each one keeps, is in `references/architecture.md`. When adding a system, follow the module pattern there: an IIFE that builds its meshes, registers interactables, and returns `update(dt, time)` called from the frame loop. Look things up through the shared functions (`heightAt`, `freshAt`, `masks`, `zoneAt`, `windAt`) rather than duplicating them.

## Where to look next

- `references/game-references.md`: what to take from Red Dead Redemption 2 and Ghost of Tsushima, and how to use them when planning and judging.
- `references/architecture.md`: section-by-section map of the reference build, the shared functions, and the module pattern.
- `references/world-systems.md`: how each system works and the design decisions behind it (terrain and zones, water, grass, trees, reef, animals, diving, climbing, weather, sound, items and food, saves, chat).
- `references/realism-and-rendering.md`: the WebGPU/TSL rules and the realism fixes, including every pitfall already hit, with its cause and fix. Read it before writing shaders or loading models.
- `references/assets-pipeline.md`: where assets come from, licence rules, the download and compression pipeline, and credits.
- `references/testing-and-shipping.md`: headless WebGPU screenshots, functional tests, performance comparison, and the commit-and-push routine.
- `scripts/`: `fakegpu.js` (headless WebGPU capture shim), `views.js` (screenshots from chosen spots; `VIEW=third|first`), `prep_model.mjs` (compress and clean a downloaded GLB, keep and rename clips), `prep_tree.mjs` (turn a film tree scan into near and far game trees).
