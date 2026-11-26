# Hale Moku

*An evening on a small island.*

Hale Moku is a 3D island you explore in the browser, in third person (or first person, if you prefer). You can walk the beach, jump, pick things up, build with them, sit or lie down, play the ukulele and take photos. The skies, ground materials, boulders, most trees and the character are real-world scans, and the animals are rigged models; the rest, every sound included, is generated in code when the page loads.

**Home screen:** before you begin, a slow film of the island plays behind the menu. The camera drifts through the beach, the forest, the waterfall pool, the mountain and the reef, then descends over your lanai, with each zone's name and a line about it. It is the live world at the time of day you chose.

**Status:** pre-launch. Not yet published.

## Running it

The game is one page, `index.html`, with its code in `src/` (one file per system, read in order and run as one script). Serve the folder with any static web server, then open the address it prints. It uses the bundled copy of Three.js in `vendor/` and needs no internet. Opening `index.html` straight from disk no longer works, because a browser will not let a page read its own files that way.

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
- **Plans:** sketches of a lean-to shelter, a fence, a hale and a raft, with what each takes. They are examples, not rules: anything that stands, stands.

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

- **A real day:** time runs as in the big open-world games, a 48-minute day. The sun and moon are where they really are over Waipiʻo on the game's date: the sun rises in the east-southeast, stands about 50° high in the south at noon in November and sets in the west-southwest, and the moon rises, sets and waxes and wanes through its real phases. Shadows grow long and soft at sunrise and sunset and short at noon; by night the moon casts its own soft, cool shadows, and a moonless night is darker. Sitting makes time pass quickly. The time setting jumps to morning, midday, golden hour, sunset or night, as real times for that day.
- **Sky and light:** after dusk, cool moonlight keeps the night dark but readable. Five photographed HDRI skies (day, golden hour, sunset, afterglow, dusk) cross-fade as the sun moves. Each is turned to match the sun and lights the island (image-based lighting); the computed starry sky takes over at night.
- **Materials:** physically based (albedo, normal, roughness) scans for sand, wet sand, grassy ground, lava rock, deck boards and palm bark.
- **Island:** the whole of Hawaiʻi Island (the Big Island) at its real size, about 10,430 km², and real heights from US Geological Survey elevation data: Mauna Kea rises to 4,207 m and Mauna Loa to 4,169 m, and both stand on the horizon from the coast. The ground streams in around you: full detail close by, coarser farther away, out to the sea horizon.
- **Home:** you live in Waipiʻo Valley on the windward Hāmākua coast: a black-sand beach at the valley mouth, a river along the valley floor, rainforest, and Hiʻilawe falls dropping about 450 m into its plunge pool at the head of the valley. Trees, grass, the reef and animals grow around you wherever you go, by habitat, and stay put when you come back.
- **Zones:** the island is divided into zones, and the zone's name appears as you walk into it.
  - **Kahakai, the beach:** Waipiʻo's black-sand beach, where you arrive, with coconuts and building.
  - **Kuahiwi, the mountain:** the steep, fluted valley walls and the uplands above them, rising toward Mauna Kea, with a belt of trade-wind cloud on its flanks.
    - **Climbing:** gentle slopes you walk. Steeper ones slow you down. Past about 43° you climb hand over hand while holding W, using the **Strength** bar. If it runs out, or you let go on very steep ground, you slide back down. Strength returns when you stand on easier ground.
  - **Wailele, the waterfall pool:** Hiʻilawe pours over the lip and falls white about 450 m down a sheer amphitheatre of dark basalt, moss and ferns into a pool you can swim in. Spray bursts where it lands, foam spreads and rings ripple across the pool, and mist rolls downstream on the wind. With the sun behind you, look for a rainbow in the mist. From there a river winds east to the sea, and its current carries you downstream. On its way the river runs over and around rocks, piling up against them and trailing white water behind; where it reaches the sea its silty fresh water fans out through the surf. Close to the falls you hear the crash of water on water, not just the roar.
  - **Ke Ana, the lava tube:** hidden behind Hiʻilawe. Swim to the foot of the falls and step up behind the falling water into a lava tube that runs about 160 m into the mountain (inspired by Nāhuku on Kīlauea): round walls of lumpy, glazed black rock, a flat floor with puddles, ferns at the mouth, roots hanging from the roof, water dripping. The daylight fades as you go in and your eyes adjust over a few seconds; deeper in, a lantern helps. Inside, everything echoes, drops plink into the puddles and the falls go muffled behind you. It is a natural tube: nothing is buried here.
  - **Footprints:** the ground remembers where you walked. Each print is a decal laid on the slope at your foot and drawn as light on the ground already there: the wall facing the sun is lit, the far wall falls into shadow, so a print reads on black sand as well as pale. Deep in sand and riverbank mud, fainter on forest dirt, lighter still on grass, none on bare rock or the lānai deck. Step out of the sea or the river and your feet stay wet for about 25 s, leaving dark wet prints on any surface, rock included, that dry away. Prints fade over one to two minutes, faster in wind and rain, and the waves wash away those at the waterline in seconds. Animals leave their own: cloven hooves (puaʻa, kia, kao), three toes (nēnē, moa) and small paws (manakuke).
  - **The map notebook (M):** twelve blank pages and no map of the island: nothing draws itself and nothing marks where you are. You draw what you remember, freehand, with what you have found and carry, and each one marks the paper its own way. **Nānahu** (charcoal), taken from a fire ring once the fire has burned down, is grainy and catches on the paper's tooth. **Kukui ink**, soot from a kukui nut held burning over a shell, is a fine dark line that thins when you draw fast. **ʻAlaea**, red earth from slumped valley walls, is a dry, bristly stroke. **ʻŌlena**, the turmeric root of the wet forest, is a pale yellow wash with darker dried edges. **Pōpolo** berries from the open grass draw a translucent purple. Each piece lasts a length of line and drawing uses it up; turn the page with ← →, choose with 1–5, tear a page out if you want it gone. Kukui nuts, ʻōlena, pōpolo and ʻalaea grow a few at a time near you, each in its own kind of ground; they also dye wood like the other dyes. The drawings are saved with the island.
  - **Building with weight:** hold a material and press B. Build on the half-metre grid or, with T, place freely anywhere and turn by 15°; Shift + R tilts a piece (a sloping thatch for a lean-to, a brace). Posts, rails, beams, boards and logs can be cut shorter or longer with [ and ], from half to twice their usual length; a long one takes two pieces of wood. Every piece is a solid body to the physics, so what you drop lands on your floor. Anything placed without support, a post not set in the ground, a beam with nothing under its ends, falls when you let go of it, tumbles and lies where it lands, still a piece you can take apart (X) or build on; take away what holds something up and it comes down the same way. What holds what is the builder's support rule (a piece rests on the ground, a floor, or a piece it touches); the falling is Rapier's. Two driftwood logs lashed with a cord make a raft that floats on the river or the sea and that you can stand on. Riding a raft or a waʻa comes with getting around the island, later.
  - **Ka Puna Huna, the hidden spring:** the river's source, high on the mountain behind fallen boulders. Finding it adds a page to the journal.
  - **Ke Kai, the open sea.**
  - **Lalo o ke Kai, under the sea:** a fringing reef rings the island 15–65 m offshore, 2–4 m down, then drops away to 18 m. See the Undersea section below.
  - **Wao Nahele, the forest:** a Hawaiian rainforest inland on the east side, which also climbs the mountain. See the Forest section below.
- **Sound by zone:** the surf fades as you go inland. The waterfall roars louder as you get near it, and the river babbles and plops over stones close by. The spring bubbles. Wind grows stronger with height and howls over the summit.
- **Grass:** 120,000 tufts of blades. Close by they are full tufts; further out they are lighter tufts that thin out gradually, and past that the ground's own green takes over, so there is no hard edge. The blades are lit the way the ground is and share its colours and dry and lush patches, so they sit in the soil rather than on top of it. Lower quality levels draw a smaller area of grass.
- **Wind:** a shared wind with travelling gusts bends the grass, shrubs and palm fronds; grass parts around the player.
- **Character:** a real, photo-scanned man, a modern islander in a polo shirt and shorts, seen in third person. He walks, jogs, sprints, swims, jumps, sits and kneels with a full animation library, carried over onto his scanned body when the game loads. He moves with weight, the way characters in big open-world games do: he gathers speed and slows to a stop instead of starting and stopping dead, his walk flows into a jog as he speeds up on one shared step cycle so his feet never slide, he banks into turns and leans as he speeds up, his feet settle on slopes and steps, his head turns to where you look, and he breathes while standing. He leans into a climb and sits back going downhill, and shifts his weight from foot to foot while he waits. When you touch something he looks at it first, turns to face it, and kneels, bends or reaches to its height, his hand going to it. He carries what you hold in front of him, a lantern low at his side. The camera pulls in when a tree or boulder is in the way. The camera orbits freely while you walk; the body turns toward where you go and plays idle, walk, jog, jump, landing and swim animations. Held items sit in the right hand. Sitting, the hammock and the binoculars use first-person views.
- **Plants:** scanned fern clumps and anthuriums replace the leaf-card shrubs and lean and flutter in the same wind as the grass.
- **Props:** scanned binoculars, oil lantern, rocking chair, conch shells, lava stones, bananas, rain barrel, storage crate, clay pot and basket replace the shape-built versions, fitted to the same size so everything works as before.
- **Animals:** rigged, textured hens, a rooster and a goat. Each keeps its wandering, pecking, grazing and feeding behaviour; the hen plays its own walk-and-peck animation, and the rooster's and goat's legs swing as they walk.
- **Physics:** [Rapier](https://rapier.rs) rigid bodies. Things you drop or throw (resources, the coconut, binoculars, ukulele) fall, bounce, tumble and roll on the terrain, deck, rocks, palm trunks and your buildings; coconuts and wood float, stones sink; walking into loose items pushes them. Bodies are removed once things come to rest. The cup and lantern are still set down upright, and buildings keep their own support rules.
- **Shadows:** dynamic sun shadows. High uses cascaded shadow maps (three 2048 px maps out to 140 m): sharp up close and still present in the distance, plus lantern shadows. Medium and Low use one map that follows you.

## Physics

- **Falling:** fall hard (from about 6 m) and your body goes limp: arms, legs, head and torso tumble as real linked bodies, down whatever is below you, and come to rest. Then you get up, through a kneel. Fall a long way (over 25 m) and you are knocked out, and wake on the beach.
- **Hunting:** a struck animal topples over and rolls down the slope as a real body, and lies where it stops.
- **Things you drop or throw** fall, bounce, roll downhill, float or sink, and your body pushes them as you walk.

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
- **Forest floor:** dark leaf litter, ferns and anthuriums, with fallen trunks, old stumps, mossy rocks and roots scattered under the trees. From the valley rim the forest shows as a canopy of crowns and shadowed gaps, in stands of dark ʻōhiʻa, brighter koa and pale kukui.
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

Elevation: USGS 3DEP via AWS Terrain Tiles (public domain for the United States; sea floor from the same tiles' bathymetry).

More trees from Sketchfab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), standing in for Hawaiian species:
[Acacia tree](https://sketchfab.com/3d-models/acacia-tree-bb14c2bb679b4d0bb1c578a27e2ddabf) by evolveduk (koa),
[Coconut Palm](https://sketchfab.com/3d-models/coconut-palm-26e787f2ff2e4c0fb004c3b0210805a3) by evolveduk (the coconut palms' crowns),
[Chinese Banyan (Ficus Microcarpa)](https://sketchfab.com/3d-models/chinese-banyan-ficus-microcarpa-2a0dbcdf8f5d48f5ad79987c7a8170ce) by Valery.Li (banyan),
[Livistona Chinensis - Fan Palm](https://sketchfab.com/3d-models/free-livistona-chinensis-fan-palm-f59bab2a81244b869e1ca5aefd4ad94a) by AllQuad (loulu crown) and
[Realistic HD Bottlebrush laevis](https://sketchfab.com/3d-models/realistic-hd-bottlebrush-laevis-120-17859f7b38784420bdefe734533b0263) by PlantCatalog (young ʻōhiʻa, for its red brush flowers).
Each has a near and a far version, simplified and compressed.

The forest floor's fallen trunk, stump, mossy rocks and roots are Poly Haven's dead_tree_trunk, tree_stump_01, rock_moss_set_01 and root_cluster_01 (CC0).

The other scanned trees are Poly Haven's island_tree_01, island_tree_02, island_tree_03 and tree_small_02 (CC0), standing in for the Hawaiian species named in the game; the tree-fern crowns are fern_02. Leaves were thinned and simplified so a forest of them runs in a browser.

The character is [Human 3D model scanned with iPhone X](https://sketchfab.com/3d-models/human-3d-model-scanned-with-iphone-x-73e467dfc8a04914bb314a9410077858) by in3D_io (CC BY 4.0); its own animation was removed. The animations are from Quaternius's Universal Animation Library, retargeted onto the scan in the game, and the base character it was made for (Universal Base Characters, with its hair) is the fallback if the scan does not load. Both are from [quaternius.com](https://quaternius.com), CC0 as downloaded. See `assets/models/README.txt`; please don't extract them for use as standalone assets.

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
