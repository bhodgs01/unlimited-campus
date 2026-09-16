# Unlimited Campus

A walkable 3D and VR campus for Unlimited Awesome's **Six Castles of Human Flourishing**,
built by KC Proto. Browser three.js, WebXR on a Quest, no app to install.

- `src/world/campus.js` is the plan: plaza, grid, districts, lake, pitches, gardens.
- `src/world/pieces-lib.js` holds every building and piece of furniture as a small procedural
  function; `docs/gpt-campus-brief.md` is the brief they are built to and
  `scripts/import-pieces.py` drops a delivered batch in by name.
- The engine (renderer, camera rig, sky, settings, rigged crew, VR sidecar) is shared with the
  Bot Farm colony, itself a fork of jarrenrocks/bot-crossing (MIT). Crew and tree models are
  KayKit (CC0), see `public/assets/CREDITS.md`.

```sh
npm install
npm run dev        # http://127.0.0.1:5275
npm run build && npm run serve
```

`CAMPUS_PASSWORD` gates the public host; unset means open.
