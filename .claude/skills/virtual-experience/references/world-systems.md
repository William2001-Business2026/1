# World systems and the decisions behind them

Each entry says what the system does, how, and why it was done that way. Keep these decisions unless the user asks otherwise.

## Terrain and zones
- **Shape:** coast radius by angle (`coastR`), plus lobes for big features (the north lobe holds the mountain). `heightBase` layers a beach profile, rolling noise inland, a lava coast, a knoll, the mountain (Hawaiian fluted ridges: `1-|sin(angle*7+warp)|`), and the reef offshore.
- **Carving:** water is carved into the ground, not floated on it. `heightRaw` carves the river channel and banks (`riverQ`: nearest point, level, width, depth, flow direction) and the plunge pool and spring basins with soft-min blends.
- **Water levels:** computed from the ground along the path and always falling downhill (min of the previous level minus a step, and the ground minus a margin), with an explicit drop for the waterfall.
- **Look by vertex:** steep slopes become pale mossy cliff rock, not black. River banks are damp and dark, forest floor is leaf litter, the reef floor is coral rubble with sand in the grooves.
- **Zones:** beach, mountain, waterfall pool, forest, open sea, under the sea. The zone's name (Hawaiian · English) appears when you have been in it for 1.2 s. A zone label is shown only once its content exists.

## Grass (anti-sticker)
- 150k tufts in 16 m chunks. Close chunks draw full tufts (11 blades); further ones draw light tufts (5 blades) that thin out by a per-instance rank, so they sink away rather than pop. Past that, the green ground takes over.
- **Blades:** lit with an up-biased normal plus the visible side (`normalLocal * faceDirection`). Their colour starts from the soil at the root, and they follow the soil's dry and lush patches. The soil under grass is greened and shaded to match.
- **Quality** scales the near ring, far ring and density.

## Water
- **Sea:** ring mesh, waves, foam and lace on the shore, sky reflection, caustics on the shallows. Seen from below it shows a bright window straight up and fades into the haze.
- **Fresh water:** a ribbon along the river (5 columns), discs for the pool and spring, and a single flow shader. Foam comes from the steepness of the drop. After rain the river swells: higher, faster, whiter and louder.
- **Waterfall (the game way, `FALLS`):** not a strip on the slope but layers. A core sheet leaves the lip on a free-fall curve and never passes inside the rock (march out from the lip until the ground is below the water); a looser veil in front with torn edges that widen as it falls; textures move on the water's *travel time* (`(√(v0²+2gh)−v0)/g`), so the flow speeds up and stretches; strands peel off the sides (they follow a table of the sheet's shape, never per-frame terrain queries); spray bursts at the foot; lacy plunge foam and rings spread on the pool; mist rolls downstream with the wind and shows a rainbow 40–42° from the antisolar point; the rock around it is bare, dark and wet (a gorge mask in the terrain material). Additive particles fade by instance colour and are scaled by daylight so nothing glows at night.
- **Swimming:** the water depth is `freshAt ?? sea` minus the ground. Rivers carry you downstream.

## Under the sea
- Reef 15–65 m offshore, 2–4 m down, with spur-and-groove relief, then a wandering drop-off to 18 m.
- Corals built in code per kind (lobe, finger, cauliflower, rice plates, mushroom, black coral) plus swaying limu, placed by depth band, in 24 m chunks drawn only when the camera is in or just above the water.
- **Fish:** instanced schools per species, with a canvas texture side pattern, a tail wave in the vertex shader (per-instance side vector), wandering and scattering from the player.
- **Creatures:** honu, manta and sharks swim with behaviour. Heʻe, ula and ʻaʻama can be caught and may ink, flee or scuttle. Wana, ʻopihi and limu are gathered (ʻopihi needs a stone flake).
- **Diving:** C dives; W swims along the look direction; Space rises. Air lasts 60 s (+25 with goggles). Below 15 s you hear a heartbeat. Running out blacks you out and you wake on the beach without that dive's catch (`DIVE.log`).
- **Under-water look:** fog and background become the haze colour, the sky is hidden, sunlight and sky light are dimmed with depth, caustics cover the reef, slanted light shafts in the grade, muffled sound with bubbles.

## Trees and forest
- **Real scans first.** Most species are drawn by Poly Haven CC0 tree scans standing in for the local species (tinted per kind; ʻōhiʻa gets red lehua mixed into the upper canopy in the shader). Each scan has a near version (30–45k triangles) and a far one (5–9k), made with `scripts/prep_tree.mjs`, swapped per 64 m chunk at a quality-scaled distance, with the code-built tree kept as a hidden fallback. All sway in the shared wind, weighted by height.
- **Making a game tree from a film scan** (`prep_tree.mjs`): find each leaf as a connected component, keep a fraction of whole leaves, enlarge each kept leaf about its own centre so the canopy stays full, then simplify; alpha-test (MASK, cutoff .45), double-sided. Thinning by simplifying alone leaves a sparse, dead-looking crown.
- **Built in code** where no scan fits (banyan, loulu, the hāpuʻu trunk: rough, bulging, with a flared base). Replace a code tree that looks fake with a real species a scan can draw (the shore's hala became milo) rather than keeping it.
- **Placement:** by habitat (forest mask, mountain height, shore, dry side, near people), with grid-hashed spacing; instanced per kind in 64 m chunks; trunks block the player.
- **Lesson:** sparse sprigs read as dead trees. Fill the cards.

## Animals
- **Ground animals** (wander, graze, flee; Shift to sneak); **perch**; **soar**; **bats at dusk**; **flit** (honeycreepers); **flutter** (butterflies); **climbers** on trunks; and tiny ones on leaves.
- **Models:** rigged where possible (mixer with idle, graze, walk, run). Static scans are baked to a canonical mesh (y up, feet at 0, facing +z) and their legs swing in the vertex shader about the hip, diagonal pairs or alternate for birds. Rigged ones without walk clips swing their leg bones.
- **Behaviour that reads as alive:** notice → freeze and watch (turn to you, ~1 s) → bolt; sneaking shrinks every distance. Speed eases up and down; walk, trot and run clips play at the rate their speed calls for; bodies tilt to the slope. A kill eases the body over onto its side in about half a second (a rigged "die" clip may only be a flinch: check it before relying on it).
- **A rigged model with no textures** can still look right: shade it in TSL from `positionGeometry` (bind-pose space): coat colour, grizzle noise, paler back, snout, hooves. Expect albedo to read brighter than the numbers: Hawaiian feral pigs needed about 0.01–0.05 linear.
- **Hunting:** spear strike (better if sneaking) → the animal falls → E to butcher → meat item → cook. Protected species (honu) can be swum with but not taken.

## Player movement
- Walk, run (Shift is slow and quiet), jump with gravity, steep ground slows you down.
- Climbing: past a grade of about 0.95 (about 43°) you climb with W using a Strength bar (25 s). Strength drains with steepness. With none left, or letting go on a grade above 1.25, you slide. It recovers on easy ground.
- Diving as above. Third-person camera kept above ground and on the right side of the water surface.

## Weather and time
- The time of day blends photographed skies (day, golden hour, sunset, afterglow, dusk) into a computed starry night.
- Rain squalls: `U.uWet` soaks in over about 25 s and dries over minutes (dark, glossy ground; puddles in flat hollows); `U.uSwell` rises after about a minute of heavy rain. Mist hangs in the forest after rain and around the summit, with a wispy cloud cap drifting round the peak.

## Sound (synthesised WebAudio)
- **Beds:** surf scaled by distance to the coast; wind that grows with height and howls on the summit; a positional waterfall roar; river babble plus plops near water; spring bubbles; canopy rustle and birdsong in the forest; owl calls at night; muffled sound under water with bubbles and a heartbeat at low air.
- **Rain by surface:** open ground, canopy patter, roof drumming, sea hush.
- If realistic recordings are wanted, they need a CC0 source and network access; ask first.

## The book (J)
- **Pages:** a field guide, open anywhere. Journal (first-person notes and hints); one page per zone with plants, animals (tagged food, hunt, catch, gather, protected, watch) and what you can do; then Making, Food and Building & growing, generated from `RECIPES`, `K`, `FORMS` and `CROPS`, so the book can never drift from the game.
- **Seen marks:** everything is readable from the start; `W.seen[label]` marks what the player has looked at or come near.
- **When adding a species, item or activity:** add it to the guide too. The flow test checks that every species in the world has a guide entry.

## Items, food and the journal
- The `K` table holds the shape (`mk()`), food tier, `cook:1` (which generates roasted and dried versions), and a tool flag. Recipes are "hold one thing, use it on another".
- Pot dishes come from ingredient sets (`dishOf`).
- The journal (`NOTES`) is the only guidance, written after the fact in the first person. Add an entry for each new discovery.

## Chat (optional)
- Supabase with row-level security, Google sign-in only. A restrictive policy blocks anonymous accounts; room functions check too. The General room plus private rooms by invite code, rate limits, and a word filter. Only the publishable key is in the client.

## Home screen
- A live title film behind the menu, as games do: a list of shots, each `[from, to]` camera and look-at points built when the shot starts (some follow the world: the waterfall's foot, a fish school, a clear path found among the trunk colliders), eased with a cosine, a slightly longer lens than play, a dip to black between shots, and a caption (Hawaiian name, English name, one line) with progress marks.
- The menu moves aside (top-left over a soft gradient) so the world shows and other panels (chat) stay clear; on phones it stays centred and the caption goes to the top.
- Begin cuts straight to the player under a short fade; flying the camera from a far shot to the player crosses the whole island and looks wrong.
- Place cameras by rule, not by hand-picked coordinates: hand-picked spots ended inside a tree twice. Check clearance against colliders and keep each shot about its own zone.

## The sky clock (sun, moon, shadows)
- One real clock (`SKYCLOCK`, a 48-minute day): NOAA solar equations and a low-precision lunar theory for the site's latitude and
  longitude on the game's date; the moon's phase from the angle between them. Every old phase flag (day, golden, night, the evening's
  events) is derived from the sun's height, so other systems keep working. Presets are real times found by the sun's height.
- The shadow-casting lamp is the sun by day and the moon by night (moonlight casts soft, cool shadows). Let the lamp go down to about
  2° for long sunrise and sunset shadows; at golden hour the sun must be strong against a dimmer sky or the shadows vanish.
- The moon disc is lit from the real sun direction in the sky shader, so its phase is always right.

## Character motion and physics
- Momentum on the player's velocity; idle, walk and jog blended by real speed on one shared step cycle (advance the cycle by
  ground covered, set each clip's time from it); bank into turns, lean with acceleration; head look toward the camera (never over
  the shoulder); breathing while still.
- Ragdoll: capsules sized from the skeleton's own joints, spherical joints, a collision group that ignores itself and the player
  capsule; bones follow bodies parents-first; start only over ground the physics already has; get up by easing from the saved
  lying pose into an animation. Killed animals: a rigid body with a roll impulse, left where it rests.
- Fern fronds cannot be thinned like tree canopies (they lose their leaflets and look like confetti); they need cards or a full
  model, which is too heavy for hundreds of instances.
