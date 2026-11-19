# Testing and shipping

## Serve
```bash
python3 -m http.server 8765
```
Run it from the project root. Stop it afterwards with:
```bash
pkill -f "http.server 8765"
```

## Headless screenshots (WebGPU)
The container's Chromium uses SwiftShader. Real WebGPU canvases lose their device there, so `scripts/fakegpu.js` gives Three.js an offscreen texture and `window.__grab()` reads a frame back.

```bash
VIEWS='[["warm",0,88,0,-0.05],["start",0,88,0,-0.05],["pool",34,-62,0.5,0.25]]' Q=medium node scripts/views.js shotname webgpu
```
- Each view is `[name, x, z, yaw, pitch]`. Yaw 0 looks toward −z (north) and yaw π toward +z (south).
- **Frames lag:** the first view often captures the previous position, so repeat the first view (as `warm` above) and read the later images.
- Software rendering runs at under 10 FPS, so frame-rate numbers only compare builds with each other.
- Skip the slow arrival transition by setting `player.trans=1` after clicking Begin.
- For animals, read positions from `__hm.FAUNA.list` or `__hm.SEA.schools`, stand 2–3 m away, and set `sp.flee=0` so they do not run.
- Under water: set `player.uw=true`, `player.y=-depth-1.65`, and call `DIVE.start()`.

## Functional tests (WebGL, faster)
Drive the game through `window.__hm` in Playwright:
- swim, dive and black out (gathered items are lost, and you wake at `START`);
- catch and gather (a hit returns true and the item is given or dropped when the bag is full);
- hunt (`use('spear')` → dead → `e()` → meat);
- climb (the hint shows "Climbing" and strength drains);
- old saves load (`loadSave` of a v1 save, then check items on land and buildings moved rigidly);
- surfaces (`surfaceAt` gives water or rock where expected);
- count checks (`SEA.counts`, `FAUNA.counts`, `FLORA.kinds`) to confirm every species exists;
- a full flow audit: every recipe produces its output, every food can be eaten, every pot dish resolves, every building piece places, growth and a new day run, a save/load round trip keeps items, plots, pieces and seen marks, `zoneAt` is right for each zone, and every species has a book entry;
- a tour in the **default view (third person)** from where a player stands in each zone, plus night, rain and under water.

Always check the console for page errors and TSL errors, in both renderers.

## Performance comparison
Keep the previous commit in a git worktree served on another port. Measure frames over 20 s at the same spot with the same quality, plus `__gfx()` draw stats, and compare visible grass and vertex counts. Remove the worktree afterwards.

## Ship
1. Update `README.md`: controls, the new zone or system in player language, and credits.
2. Add credits for new CC BY assets to `assets/models/README.txt`.
3. Commit with a titled message whose body says what changed and why, with the session's attribution lines.
4. Push the working branch, then push to `main` if the user has authorised that.
5. Report what was verified and how, what could not be tested (real GPU, feel, sign-in end to end), and what is still weak.
6. If the user keeps a status page, update it with the new checks and improvements.
