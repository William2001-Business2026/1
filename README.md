# Hale Moku

*An evening on a small island.*

Hale Moku is a 3D island you explore in the browser, in third person (or first person, if you prefer). You can walk the beach, jump, pick things up, build with them, sit or lie down, play the ukulele and take photos. The skies, ground materials and boulders are real-world scans, and the character is a rigged, animated model; everything else, every sound included, is generated in code when the page loads.

**Status:** pre-launch. Not yet published.

## Running it

The whole game is one page, `index.html`.

- **Quick look:** double-click `index.html`. Opened this way it loads Three.js from the jsDelivr CDN, so it needs an internet connection.
- **As it will be hosted:** serve the folder with any static web server, then open the address it prints. Served this way it uses the bundled copy of Three.js in `vendor/` and needs no internet.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

A desktop browser on a computer with a graphics card is recommended. The controls are keyboard and mouse.

## Graphics and performance

The island is drawn with **WebGPU** where the browser supports it (current Chrome and Edge, Safari 26 and later, Firefox on Windows). Other browsers automatically fall back to **WebGL 2** with the same shaders, so the island looks the same either way. Add `?renderer=webgl` to the address to force the fallback.

| Target | How it is met |
|---|---|
| 1920 × 1080 resolution | The 3D view renders at the screen's pixel density but never above 1920 × 1080 pixels. |
| 16:9 aspect ratio | The view is always 16:9, centred and letterboxed to fit the window. |
| 60 FPS | Frames are capped at 60 per second, including on 120 Hz and 144 Hz screens. |
| At least 30 FPS | On **Auto** quality (the default), the game lowers quality within about two seconds when the frame rate drops, and raises it again after eight smooth seconds. |

Auto moves between seven levels, from High (ambient occlusion, 4096-pixel shadows, lantern shadows) down to Low at 50% render scale. It detects screens that refresh slower than 60 Hz and does not lower quality for them. **Settings → Show frame rate** displays the live frame rate, renderer, render size and current level. Choosing Low, Medium or High turns Auto off.

Very old or very weak graphics chips may still fall below 30 FPS at the lowest level.

## Controls

| Key | Action |
|---|---|
| W A S D | Walk |
| Mouse | Look around (in third person, turns the camera around you) |
| V | Switch between third-person and first-person view |
| Shift | Walk slowly |
| Space | Jump |
| E | Interact: pick up, sit, lie down, stand up |
| Left click | Use what you are holding |
| G | Put down, or drop one of what you carry (Shift+G drops them all) |
| Wheel / Q | Change what is in your hand |
| B | Build with what you hold: R turns, F changes shape, wheel sets height |
| X | Take apart what you are looking at |
| 1 2 3 4 | Strum a chord while holding the ukulele |
| P | Save a photo |
| Enter | Type in the chat (when chat is switched on) |
| Esc | Pause |

## Saving

Your island is saved in the browser as you play, so it stays on that browser and device. To keep a copy or move it elsewhere, use **Settings → Your island → Save to file** and **Load from file**.

## Player chat

Players can talk about the game in a chat panel in the bottom-left corner. They choose to join with Google or as a guest (with an optional nickname). Everyone shares the **General** room, and anyone can create a private room and invite others with its code.

The chat runs on [Supabase](https://supabase.com) and is **off until it is configured**; the game works normally without it. To switch it on:

1. Create a Supabase project and run `supabase/migrations/0001_chat.sql` in its SQL editor.
2. In the Supabase dashboard, under Authentication, enable **Anonymous sign-ins** (for guests) and the **Google** provider, and add the game's web address as the Site URL.
3. Put the project URL and the *publishable* (anon) key in `chat-config.js`. Never use the service-role or secret key.

Built-in safeguards: messages are limited to 500 characters and 5 per 10 seconds per player, a small word filter stars out listed words, and database rules stop players reading private rooms they have not joined or posting under another name.

## Files

| Path | What it is |
|---|---|
| `index.html` | The entire game: page, styles and code |
| `chat.js`, `chat.css` | The chat panel |
| `chat-config.js` | Chat connection details (empty until set up) |
| `supabase/migrations/` | Database setup for the chat |
| `assets/sky/` | Photographed skies: 8192×2048 upper-hemisphere JPEGs and `skies.json` (sun direction, brightness, time-of-day range) |
| `assets/tex/` | Scanned 2K materials: `<name>_albedo.jpg` and `<name>_nr.jpg` (normal X/Y + roughness) |
| `assets/models/` | Scanned models as compressed GLB |
| `vendor/three/` | Bundled copy of Three.js 0.186.1, WebGPU build (MIT licence, see `vendor/three/LICENSE`) |
| `vendor/supabase/` | Bundled copy of supabase-js 2.119.0 (MIT licence) |
| `vendor/fonts/` | Pacifico and Quicksand fonts (SIL Open Font License, licences included) |

## Realism

- **Sky and light:** five photographed HDRI skies (day, golden hour, sunset, afterglow, dusk) cross-fade as the sun moves. Each is turned to match the sun and lights the island (image-based lighting); the computed starry sky takes over at night.
- **Materials:** physically based (albedo, normal, roughness) scans for sand, wet sand, grassy ground, lava rock, deck boards and palm bark.
- **Wind:** a shared wind with travelling gusts bends 12,000 tufts of real grass blades, shrubs and palm fronds; grass parts around the player.
- **Character:** a rigged, animated islander seen in third person. The camera orbits freely while you walk; the body turns toward where you go and plays idle, walk, jog, jump, landing and swim animations. Held items sit in the right hand. Sitting, the hammock and the binoculars use first-person views.
- **Plants:** scanned fern clumps and anthuriums replace the leaf-card shrubs and lean and flutter in the same wind as the grass.
- **Props:** scanned binoculars, oil lantern, rocking chair, conch shells, lava stones, bananas, rain barrel, storage crate, clay pot and basket replace the shape-built versions, fitted to the same size so everything works as before.
- **Animals:** rigged, textured hens, a rooster and a goat. Each keeps its wandering, pecking, grazing and feeding behaviour; the hen plays its own walk-and-peck animation, and the rooster's and goat's legs swing as they walk.
- **Shadows:** dynamic sun shadows (up to 4096 px on High) and lantern shadows on High.

## Asset credits

Skies, materials and the boulder are from [Poly Haven](https://polyhaven.com) under CC0 (public domain). Each folder's JSON file lists the exact source asset.

The character, hair and animations are from Quaternius's Universal Base Characters and Universal Animation Library ([quaternius.com](https://quaternius.com)), CC0 as downloaded. See `assets/models/README.txt`; please don't extract them for use as standalone assets.

The animals are from Sketchfab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
[Goat](https://sketchfab.com/3d-models/goat-5d7431517b634f4e9e8c0f3729cd9c59) by GerardoA400,
[Chicken](https://sketchfab.com/3d-models/chicken-4ab19d3a675343959815ae770f8b178e) by MAXDESIGN-3D and
[Chicken walk](https://sketchfab.com/3d-models/chicken-walk-4f17286860b84c90b8e0671003a896a8) by LostBoyz2078.
Textures were resized and compressed, and leg and neck motion is added in code.

## Licence

All rights reserved. This project is not open source. Everything in `vendor/` is third-party code or fonts under its own licence.
