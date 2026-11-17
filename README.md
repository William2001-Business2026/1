# Hale Moku

*An evening on a small island.*

Hale Moku is a first-person 3D island you explore in the browser. You can walk the beach, pick things up, build with them, sit or lie down, play the ukulele and take photos. Every mesh, texture, light and sound is generated in code when the page loads; there are no model, image or audio files.

**Status:** pre-launch. Not yet published.

## Running it

The whole game is one page, `index.html`.

- **Quick look:** double-click `index.html`. Opened this way it loads Three.js from the jsDelivr CDN, so it needs an internet connection.
- **As it will be hosted:** serve the folder with any static web server, then open the address it prints. Served this way it uses the bundled copy of Three.js in `vendor/` and needs no internet.

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

A desktop browser (Chrome, Edge or Firefox) on a computer with a graphics card is recommended. The controls are keyboard and mouse.

## Controls

| Key | Action |
|---|---|
| W A S D | Walk |
| Mouse | Look around |
| Shift | Walk slowly |
| E | Interact: pick up, sit, lie down, stand up |
| Left click | Use what you are holding |
| G | Put down, or drop one of what you carry (Shift+G drops them all) |
| Wheel / Q | Change what is in your hand |
| B | Build with what you hold: R turns, F changes shape, wheel sets height |
| X | Take apart what you are looking at |
| 1 2 3 4 | Strum a chord while holding the ukulele |
| P | Save a photo |
| Esc | Pause |

## Saving

Your island is saved in the browser as you play, so it stays on that browser and device. To keep a copy or move it elsewhere, use **Settings → Your island → Save to file** and **Load from file**.

## Files

| Path | What it is |
|---|---|
| `index.html` | The entire game: page, styles and code |
| `vendor/three/` | Bundled copy of Three.js 0.170.0 (MIT licence, see `vendor/three/LICENSE`) |

## Licence

All rights reserved. This project is not open source. Three.js in `vendor/three/` is third-party code under its own MIT licence.
