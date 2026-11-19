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
| V | Switch between third-person and first-person view (or click the switch at the bottom right, or Settings → Camera) |
| J | Open the book |
| Shift | Walk slowly |
| Space | Jump (under water: swim up) |
| C | Dive when you are swimming; hold to go deeper |
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

## The book

Press **J** anywhere to open the book. It has:
- **Journal:** your own notes, written as you discover things, with hints of what to try next.
- **A page for each zone** (Kahakai, Kuahiwi, Wailele, Wao Nahele, Lalo o ke Kai): its plants, its animals (tagged food, hunt, catch, gather, protected or watch) and what you can do there. Everything is readable from the start, and entries you haven't seen yourself yet are marked "not yet seen".
- **Making, Food, and Building & growing:** every recipe, which foods to eat raw or cook, the pot dishes, the building pieces and homes, and the crops.

Turn pages with ← → or A D, or click a tab.

## Saving

Your island is saved in the browser as you play, so it stays on that browser and device. An island saved before the map was enlarged is moved onto the larger map when it loads: loose things and garden beds go to the same spots, and each building moves as one piece (fire pits start cold). To keep a copy or move it elsewhere, use **Settings → Your island → Save to file** and **Load from file**.

## Player chat

Players can talk about the game in a chat panel in the bottom-left corner. Chat needs a Google account; there are no guest accounts. Everyone shares the **General** room, and anyone can create a private room and invite others with its code.

The chat runs on [Supabase](https://supabase.com) and is **off until it is configured**; the game works normally without it. To switch it on:

1. Create a Supabase project and run `supabase/migrations/0001_chat.sql` in its SQL editor.
2. Then run `supabase/migrations/0002_google_only.sql`, which stops guest (anonymous) accounts from reading or posting.
3. In the Supabase dashboard, under Authentication, enable the **Google** provider, keep **Anonymous sign-ins** off, and add the game's web address as the Site URL.
4. Put the project URL and the *publishable* (anon) key in `chat-config.js`. Never use the service-role or secret key.

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
| `vendor/rapier/` | Rapier 0.19.3 physics engine, WebAssembly embedded (Apache-2.0) |
| `vendor/supabase/` | Bundled copy of supabase-js 2.119.0 (MIT licence) |
| `vendor/fonts/` | Pacifico and Quicksand fonts (SIL Open Font License, licences included) |

## Realism

- **Sky and light:** after dusk, cool moonlight keeps the night dark but readable. Five photographed HDRI skies (day, golden hour, sunset, afterglow, dusk) cross-fade as the sun moves. Each is turned to match the sun and lights the island (image-based lighting); the computed starry sky takes over at night.
- **Materials:** physically based (albedo, normal, roughness) scans for sand, wet sand, grassy ground, lava rock, deck boards and palm bark.
- **Island:** about 250 m across and 310 m from north to south, with a lumpy grassy knoll, rolling ground inland, a lava coast to the west and 34 palms.
- **Zones:** the island is divided into zones, and the zone's name appears as you walk into it.
  - **Kahakai, the beach:** where you arrive, with coconuts and building.
  - **Kuahiwi, the mountain:** a green, fluted mountain about 75 m high, with sea cliffs on its north side and a cap of cloud drifting around the summit.
    - **Climbing:** gentle slopes you walk. Steeper ones slow you down. Past about 43° you climb hand over hand while holding W, using the **Strength** bar. If it runs out, or you let go on very steep ground, you slide back down. Strength returns when you stand on easier ground.
  - **Wailele, the waterfall pool:** a 14 m waterfall pours over a glassy lip and falls white down a gorge of wet, dark rock into a pool you can swim in. Spray bursts where it lands, foam spreads and rings ripple across the pool, and mist rolls downstream on the wind. With the sun behind you, look for a rainbow in the mist. From there a river winds east to the sea, and its current carries you downstream.
  - **Ka Puna Huna, the hidden spring:** the river's source, high on the mountain behind fallen boulders. Finding it adds a page to the journal.
  - **Ke Kai, the open sea.**
  - **Lalo o ke Kai, under the sea:** a fringing reef rings the island 15–65 m offshore, 2–4 m down, then drops away to 18 m. See the Undersea section below.
  - **Wao Nahele, the forest:** a Hawaiian rainforest inland on the east side, which also climbs the mountain. See the Forest section below.
- **Sound by zone:** the surf fades as you go inland. The waterfall roars louder as you get near it, and the river babbles and plops over stones close by. The spring bubbles. Wind grows stronger with height and howls over the summit.
- **Grass:** 120,000 tufts of blades. Close by they are full tufts; further out they are lighter tufts that thin out gradually, and past that the ground's own green takes over, so there is no hard edge. The blades are lit the way the ground is and share its colours and dry and lush patches, so they sit in the soil rather than on top of it. Lower quality levels draw a smaller area of grass.
- **Wind:** a shared wind with travelling gusts bends the grass, shrubs and palm fronds; grass parts around the player.
- **Character:** a rigged, animated islander seen in third person, wearing a malo of patterned kapa that sways as you walk. The camera pulls in when a tree or boulder is in the way. The camera orbits freely while you walk; the body turns toward where you go and plays idle, walk, jog, jump, landing and swim animations. Held items sit in the right hand. Sitting, the hammock and the binoculars use first-person views.
- **Plants:** scanned fern clumps and anthuriums replace the leaf-card shrubs and lean and flutter in the same wind as the grass.
- **Props:** scanned binoculars, oil lantern, rocking chair, conch shells, lava stones, bananas, rain barrel, storage crate, clay pot and basket replace the shape-built versions, fitted to the same size so everything works as before.
- **Animals:** rigged, textured hens, a rooster and a goat. Each keeps its wandering, pecking, grazing and feeding behaviour; the hen plays its own walk-and-peck animation, and the rooster's and goat's legs swing as they walk.
- **Physics:** [Rapier](https://rapier.rs) rigid bodies. Things you drop or throw (resources, the coconut, binoculars, ukulele) fall, bounce, tumble and roll on the terrain, deck, rocks, palm trunks and your buildings; coconuts and wood float, stones sink; walking into loose items pushes them. Bodies are removed once things come to rest. The cup and lantern are still set down upright, and buildings keep their own support rules.
- **Shadows:** dynamic sun shadows. High uses cascaded shadow maps (three 2048 px maps out to 140 m): sharp up close and still present in the distance, plus lantern shadows. Medium and Low use one map that follows you.

## Rain

Rain squalls blow through now and then, more often in the wet season.
- The ground darkens and turns glossy as it soaks in, and puddles gather in flat hollows. Afterwards it dries over a few minutes.
- After a while in heavy rain the river swells: it rises, runs faster and whiter, and the waterfall roars louder.
- Rain sounds different depending on what it falls on: a hiss on open ground, a patter on the forest canopy, drumming on a roof and a wide hush on the sea. Under water it is silent.
- Mist settles in the forest after rain and hangs around the summit.

## Undersea

- **Diving:** swim out until your feet leave the bottom, then press **C**. W swims where you look, Space rises, C goes deeper, and Shift glides slowly. Past the reef's edge the current turns you back.
- **Air:** one breath lasts about 60 seconds, shown by the Air bar. **Shell goggles** add 25 seconds and let you see further (2 shells on fibre). Below 15 seconds you hear your heartbeat. If you run out, you black out and wake on the beach, and whatever you gathered on that dive is lost.
- **The reef:** six Hawaiian corals grow at their natural depths: lobe and finger coral (pōhaku puna), cauliflower coral (koʻa), rice-coral plates, mushroom coral and black coral on the drop-off. Limu grows between them, on a floor of coral rubble with sand in the grooves.
- **Fish:** schools of lauʻīpala (yellow tang), kihikihi (Moorish idol), manini (convict tang), humuhumunukunukuāpuaʻa and uhu (parrotfish) wander over the reef and scatter from you.
- **Larger animals:** honu (green sea turtles) graze and rise to breathe, a hāhālua (manta ray) glides along the edge, and manō (whitetip reef sharks) patrol the drop-off and circle you for a while if you come close. Honu are protected, so you can swim with them but not take them.
- **Food from the sea:**
  - Spear fish with a **bamboo spear** (a stone flake on bamboo).
  - Catch heʻe (octopus), ula (spiny lobster) and ʻaʻama (rock crabs). They are shy, and they ink, flee or scuttle off if you crowd them.
  - Gather wana (sea urchins) and limu. Pry ʻopihi off the wet lava rocks with a stone flake.
  - Octopus, lobster, crab and fish roast at the fire. Wana, ʻopihi and limu are eaten raw.
  - In the pot, heʻe with coconut makes heʻe lūʻau, and crab or lobster makes a seafood pot.
- **Under water:** blue-green haze, red light absorbed, rippling light on the seabed, light shafts from the surface, and a bright window straight up through the surface. Sound is muffled, your breath bubbles, and the reef crackles.

## Forest

- **Trees:** ten Hawaiian trees. Most are now real photo-scanned trees, every leaf moving in the one wind, with a lighter version drawn when they are far away. Each grows where it would in nature:
  - koa, ʻōhiʻa lehua (with red lehua blossoms) and hāpuʻu tree ferns in the forest and up the mountain;
  - loulu fan palms on the mountain;
  - milo, the spreading shade tree of the shore;
  - wiliwili on the dry lava side;
  - ʻulu (breadfruit) near the lanai;
  - kukui and ʻōhiʻa ʻai (mountain apple) through the forest;
  - two great banyans with hanging aerial roots (these, the loulu and the hāpuʻu trunks are still built in code).
- **Forest floor:** dark leaf litter, ferns and anthuriums, with little grass.
- **Animals:** 15 kinds.
  - **Hunted for food with the bamboo spear:** puaʻa (wild pigs), kia (axis deer), kao (feral goats) on the mountain, moa (jungle fowl) and nēnē. They graze and wander. When they notice you they freeze, heads up, and watch; come closer and they bolt, gathering speed as they go. Bodies follow the slope, feet keep pace with the ground, and a clean strike drops the animal onto its side. Holding Shift lets you creep nearer and strike more surely. Butcher what you take (E) for pork, venison, goat meat or fowl, then roast it at the fire. Pork with taro or sweet potato in the pot makes kālua puaʻa.
  - **To watch:**
    - the mongoose;
    - ʻiʻiwi and ʻapapane flitting between the ʻōhiʻa;
    - a pueo that moves to another tree if you come too close;
    - ʻio soaring over the mountain;
    - ʻōpeʻapeʻa (bats) over the river at dusk;
    - Kamehameha butterflies;
    - Jackson's chameleons in the branches;
    - moʻo (geckos) on the trunks;
    - the tiny happy-face spider on fern leaves.
- **Sound:** a canopy rustle, ʻapapane trills and ʻamakihi whistles by day, and a pueo calling after dark.

## Asset credits

Skies, materials and the boulder are from [Poly Haven](https://polyhaven.com) under CC0 (public domain). Each folder's JSON file lists the exact source asset.

The scanned trees are Poly Haven's island_tree_01, island_tree_02, island_tree_03, jacaranda_tree and tree_small_02 (CC0), standing in for the Hawaiian species named in the game; the tree-fern crowns are fern_02. Leaves were thinned and simplified so a forest of them runs in a browser.

The character, hair and animations are from Quaternius's Universal Base Characters and Universal Animation Library ([quaternius.com](https://quaternius.com)), CC0 as downloaded. See `assets/models/README.txt`; please don't extract them for use as standalone assets.

The animals are from Sketchfab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
[Goat](https://sketchfab.com/3d-models/goat-5d7431517b634f4e9e8c0f3729cd9c59) by GerardoA400,
[Chicken](https://sketchfab.com/3d-models/chicken-4ab19d3a675343959815ae770f8b178e) by MAXDESIGN-3D and
[Chicken walk](https://sketchfab.com/3d-models/chicken-walk-4f17286860b84c90b8e0671003a896a8) by LostBoyz2078.
Textures were resized and compressed, and leg and neck motion is added in code.

The forest animals are also from Sketchfab under CC BY 4.0, some standing in for close relatives and recoloured:
[Deer](https://sketchfab.com/3d-models/deer-144b33ab9e3345cb92b41bf297a38b7d) by chemchamroeun1988 (axis deer (kia)),
[Wild Boar](https://sketchfab.com/3d-models/wild-boar-0a4b91157dac470a9551755bcad9b5b3) by emptypen2477 (wild pig (puaʻa), with its own grazing, walking, trotting, running and alarm animations; the dark coat is painted in code),
[Bat](https://sketchfab.com/3d-models/bat-28af38de4d2c401d809148c7f63a73f9) by matisosanimation (ʻōpeʻapeʻa),
[Animated Flying Fluttering Butterfly Loop](https://sketchfab.com/3d-models/animated-flying-fluttering-butterfly-loop-80f8d9a6dadc411e89ca366cb0cfb0d9) by LasquetiSpice (Kamehameha butterfly, tinted),
[Chameleon](https://sketchfab.com/3d-models/chameleon-c91b9fad77fc4af998da3ea252037fad) by nikohard (Jackson's chameleon, recoloured green),
[Common Barn Owl](https://sketchfab.com/3d-models/common-barn-owl-19c989a6681145bc999c332699eb852e) by cmp_innovation_studio (pueo, tinted brown),
[Red-tailed Hawk - in Flight](https://sketchfab.com/3d-models/red-tailed-hawk-in-flight-4abcab5af9044a939fb5a55bff9e5000) by OSU.Multimedia (ʻio),
[Canada Goose](https://sketchfab.com/3d-models/canada-goose-50f4ace96846465f85f2e9a9f5c84453) by cmp_innovation_studio (nēnē),
[Ferret](https://sketchfab.com/3d-models/ferret-a5c717c20b08461aa1d9ce462f3e019e) by sdpm (mongoose, tinted),
[Animated Hovering Flying Hummingbird Loop](https://sketchfab.com/3d-models/animated-hovering-flying-hummingbird-loop-102884713a2742ce829e368d2a790c45) by LasquetiSpice (ʻiʻiwi and ʻapapane, recoloured).

## Licence

All rights reserved. This project is not open source. Everything in `vendor/` is third-party code or fonts under its own licence.
