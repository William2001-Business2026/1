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
| `vendor/three/` | Bundled copy of Three.js 0.170.0 (MIT licence, see `vendor/three/LICENSE`) |
| `vendor/supabase/` | Bundled copy of supabase-js 2.119.0 (MIT licence) |
| `vendor/fonts/` | Pacifico and Quicksand fonts (SIL Open Font License, licences included) |

## Licence

All rights reserved. This project is not open source. Everything in `vendor/` is third-party code or fonts under its own licence.
