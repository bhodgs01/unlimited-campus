# Unlimited Campus, scope (2026-09-16)

Host: `unlimitedcampus.kcproto.com`. For Alan Smithson (Unlimited Awesome), who is dreaming of a
virtual campus for the Six Castles of Human Flourishing. Blake has a call with him 2026-09-17.
Goal for that call: a live, walkable dummy campus that matches the aerial reference he sent, with
VR on a Quest, built the way the Bot Farm and the Brain campus were built.

## The reference (his WhatsApp image)

An aerial rendering of a formal campus, roughly 16:9:

- **Heart:** a circular plaza. A columned hall with a pitched roof on the north side, a
  semicircular stepped amphitheater bowl on the south side facing it, three concentric ring paths,
  radial avenues out to the grid.
- **Grid:** a rectangular street grid around the circle. Blocks of buildings in rows and U shapes
  with small courtyards. Some blocks have orange terracotta roofs, most are grey slate or flat.
  Tree-lined roads on every edge.
- **Grounds:** a large lake with a sailboat (west), two ponds (north-east), three soccer pitches
  (west, south-east, east), circular hedge parterres and a formal garden square (south), a small
  group of tents/market stalls (south), dense trees along every road.

We reproduce this plan directly. The six castles are the one thing the reference does not have:
each castle becomes the headline building of one district on the grid.

## The plan

```
                    lake  |  dorm quad   | GREAT HALL | courtyard quad | ponds
                    pitch |  PERSEVERANCE|   plaza    |  CREATIVE      | lab quad
                          |  hedge maze  |amphitheater|  library       |
                    -------------------------------------------------------------
                    TEAMWORK quad | gardens + parterres | ECONOMIC chateau + moat
                    SOCIAL forum  | tents + cafe        | ENVIRONMENTAL terraces
                    pitch         | pitch               | greenhouse, fields
```

Six districts, one castle each, four to eight campus buildings each, one badge kiosk per badge
(52) standing in its castle's district. The great hall is the AI tutor's building. The Hall of
Mentors on the ring holds the 190 mentors as walking characters.

### Badge to castle mapping (INFERRED from the order on unlimitedawesome.com, confirm with Alan)

| Castle | Badges (site order) |
|---|---|
| Perseverance | Gratitude, Happiness, Grit, Meditation, Harmony, Health & Wellness, Purpose, Theta Flow |
| Economic Responsibility | Finance, Blockchain, Investor, Prosperity, Dharma, Deal Maker, Tax Master, Market Maven |
| Creative Problem Solving & Critical Thinking | Writing, Visionary, Innovator, Entrepreneurship, AI Master, Technology, Podcaster, Product Creator, Content Creator, Presenter, Art & Music Lover |
| Teamwork & Mentorship | Teamwork, Trailblazer, Leadership, Community Builder, Community Impact, Volunteer, Integrity & Ethics |
| Social Impact | Critical Thinking, Changemaker, Love, Empathy, Influencer, Great People, Humanitarian, Listener, Honour, Reformer, Cultures, World Religions |
| Environmental Sustainability | Earth Guardian, Recycler, Nature Guide, Space, Wave Rider, Planet Protector |

## Engine: fork the colony, not the galaxy

The Bot Farm (`~/colony`, fork of bot-crossing) is a clean standalone Vite + three.js app with
everything the campus needs and nothing tied to the Brain's galaxy page:

| Reused as-is from `~/colony` | Replaced |
|---|---|
| `core/engine.js` (renderer, loop, quality governor) | `world/plots.js` hex lattice -> `world/campus.js` declarative plan (blocks, roads, lawns, water, fields, plaza) |
| `core/camera.js` CameraRig (pan, wheel zoom at cursor, orbit, rest-to-iso, hold-to-save Home) | `game/colony.js` thread state -> `game/campus-state.js` (castles, badges, mentors, tutor) |
| `core/settings.js` + presets, `core/tiltshift.js` | `server/harnesses/*` -> none for the demo (static roster) |
| `world/sky.js` (day/night, stars), `world/surfaces.js` (deck, kerb textures) | HUD copy and cards |
| `vr.js` sidecar (local-floor, walk in head yaw, snap turn, laser cards, grip teleport) | |
| `agents/crew.js` + `astronauts.js` (KayKit rigged mannequin, walk/idle/wave/cheer) as students and mentors | |
| `server/serve.mjs` + `auth.mjs` (same-origin password gate) | |

Plus, lifted from the Brain's `planet-pieces.js`: the **Composer** (`c.geom` / `c.group` /
`c.end`, role palette, `build(name)`), ported to an ES module `world/pieces.js` with two new cells,
`ROOF` and `LEAF`, resolved per district. `scripts/import-pieces.py` copied verbatim.

Scale: the colony is 1 unit = 1 m for walking; pieces are authored at 1 unit = 1.7 m and scaled
1.7x on placement. Castle footprint about 14 m, campus building 5 to 8 m, the plaza 60 m across,
the whole map about 260 x 150 m.

## Split: what GPT builds, what we build

| GPT (self-contained objects against the Composer API, batch, importer) | Us (engine and surgery) |
|---|---|
| The six castles (batch A) | Repo, Flux app, tunnel route, auth, Kuma |
| Great hall, amphitheater, beacon, fountain, pavilion, gate (batch B) | `campus.js` plan: ground plane, lawns, paving, roads with kerbs, water discs, pitches with lines, the circular plaza tiers |
| 13 campus buildings (batch C) | Placement: quads from the plan, `+z` toward the nearest avenue, seeds |
| 24 furniture pieces: trees, hedges, lamps, benches, boats, badge kiosks (batch D) | Hedge maze and parterre generator from the hedge modules |
| | Students and mentors: roster, wander on lawns and paths, idle at kiosks |
| | HUD: castle card (name, blurb, badge list), badge card, mentor card, district chips, Home, Orbit, Galaxy, VR |
| | Camera: fly-in on load from high above to the plaza (the demo moment), click castle = fly + card |
| | VR: start at the welcome gate facing the plaza |

The brief for GPT is `docs/gpt-campus-brief.md` (one file, paste whole). 49 pieces in four
batches; A and B are the demo, C and D fill the map.

## Build order

1. **Shell** (engine fork, campus plan with placeholder boxes in every slot, camera, day/night,
   deploy at the host behind the password gate). Placeholder boxes already read as a campus from
   the air because the plan is the reference.
2. **GPT batch A + B import** -> castles and the heart replace their placeholders.
3. **Crew**: students wandering, mentors in and around the Hall of Mentors, tutor at the great hall.
4. **Cards + fly-in**: click a castle, see its badges; page load flies from orbit to the plaza.
5. **VR** on the Quest: walk the plaza, laser a castle for its card, grip to teleport.
6. **Batch C + D import** -> full map.

## Deploy

- Source: new GitHub repo `bhodgs01/unlimited-campus` (copy of the colony tree, not a branch of
  it; `~/colony` is shared with other sessions).
- Flux `apps/unlimited-campus`: same initContainer clone + `npm run build` pattern as
  `apps/bot-farm`, `CAMPUS_REF` SHA pin, node:20-slim serving `server/serve.mjs`.
- Route `unlimitedcampus.kcproto.com -> http://unlimited-campus.unlimited-campus.svc.cluster.local:5274`
  via `/ip`. Password gate (bot-farm `auth.mjs`) so it is demo-only. `noindex`.
- Kuma monitor on `/api/health`.
- Umami tag when it goes public.

## Open questions for Alan (ask on the call)

1. Badge to castle mapping: is the inferred table right? Are all 52 current, and which four make
   it 56?
2. Is METAVRSE still an option for the final build, or is browser three.js + WebXR the path?
   (The dummy is three.js either way.)
3. What does a student DO on the campus: walk to a castle to open a lesson, earn a badge and see
   its kiosk light up, meet a mentor avatar?
4. Multiplayer: do students see each other? (Changes the server from static to a presence
   service.)
5. Where does the AI tutor live: the great hall, or beside the student everywhere?
6. Existing 3D assets from METAVRSE or the castle artwork source files we could reuse.
