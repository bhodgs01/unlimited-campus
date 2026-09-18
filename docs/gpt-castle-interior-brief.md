# GPT brief - inside the castles: the Course Hall and the study pods

*Unlimited Campus, round five. Self-contained: everything you need is in this file. Written 2026-09-18.*

## What you are building

Alan Smithson has handed us three real courses (AI Master, Entrepreneurship, Gratitude), each one a
badge in one of his Six Castles of Human Flourishing. Today the castles are solid scenery you look at
from outside. You are building **the inside**: a round Course Hall with one doorway per module, and the
furniture of a study pod where a student watches, listens, reads, and then does something with their hands.

**The audience is children and teenagers, 13 and up, and this has to be FUN.** Think a good video
game's hub world, not a school corridor. Chunky confident shapes, bright playful accents against the
stone, props you want to walk over and touch. Nothing that looks like office furniture, nothing beige,
no cubicles. If a piece would be at home in a corporate training room, it is wrong.

## How your models are seen (read this before designing anything - it has CHANGED)

**Previous rounds told you these were seen from the air at 100 to 500 pixels, roofs mattering most, on
flat outdoor ground. For this batch that advice is wrong.** These pieces are INTERIOR. They are seen:

- **From eye height, standing among them.** The player walks the room on a keyboard (drop-in walk mode)
  or stands in it in a VR headset at real scale. There is no aerial view of these pieces. **Tops barely
  matter. What matters is what you see from 2 to 8 metres away, at 1.7 m off the floor, and what you see
  when you walk right up to it.**
- **Big on screen: 300 to 900 pixels.** A cinema wall fills the view. This is the largest anything has
  ever been rendered in this campus, so undersized detail now reads as missing detail. Put a bevel on the
  edge, a seam in the panel, a grain in the timber, a rivet on the bracket.
- **Indoors, lit warm.** The hall is lit by its own lamps and by the emissive bands on the walls.
  `CELL.GLOW` and `CELL.ACCENT` are doing real lighting work here, not a night-time twinkle, so put them
  where a room's light would come from: wall sconces, the rim of the dais, the strip over a doorway, the
  glow of a screen.
- **Walked around, not orbited.** Every side is seen, including the back and the underside of anything at
  knee height or above. No hollow backs.
- **Next to human beings 1.23 m tall.** The campus crowd is a stylised astronaut about three-quarters
  human height. Seats at about 0.45 m, counters at 0.9 m, doorways 2.2 m tall.

## The three courses these rooms serve

| Course | Castle | Modules | What a student actually does |
|---|---|---|---|
| **AI Master** | Creative Problem Solving | 9 | Writes prompts, makes art and stories with AI, builds small tools |
| **Entrepreneurship** | Economic Responsibility | 6 | Finds a problem, builds a business plan, runs a small venture |
| **Gratitude** | Perseverance | 4 | A 30-day practice, journaling, thank-you letters, a gratitude map of the world |

Every module ships the same media kit: a long video and a short one, a long podcast and a short one, a
PDF, an infographic, and the module text. The furniture below exists to make those five things feel like
places in a room rather than rows in a playlist.

## The helper API (this is all you get)

```js
// `c` is a Composer. `rand` is a seeded 0..1 random (same seed = same piece every time).
// A set piece is a function:
//
//   name(c, rand) {
//     ...build...
//     return { label: 'Great Hall', kind: 'hero', pose(t, parts) { ... } }
//   }
//
// c.geom(geometry, CELL, opts)   place a THREE geometry, painted one palette cell
//   geometry : any THREE.BufferGeometry built in the piece's own frame
//              (BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry,
//              TorusKnotGeometry, LatheGeometry, ExtrudeGeometry with a THREE.Shape, TubeGeometry
//              with a THREE.CatmullRomCurve3). You may call geometry.rotateX/Y/Z(rad) and
//              geometry.translate(x,y,z) BEFORE placing it, to tilt a part or offset it from its
//              pivot.
//   CELL     : one palette cell (see below)
//   opts     : { x, y, z }   offset in piece units                                  default 0
//              rx, ry, rz    rotation in radians about the part's own origin         default 0
//              s             uniform scale                                           default 1
//              emissive      0..1, the part glows in the dark                        default 0
//              spin          radians per second, the part rotates about its own Y    default 0
//              spinAxis      'x' | 'y' | 'z' for spin                                default 'y'
//              label         a short part name for the viewer's leader labels
//                            ('Keep', 'Drawbridge', 'Portico'). Only on parts that
//                            matter; six to twelve labels on a hero, none on a furniture piece.
//
// c.group(name, opts)   open a named pivot group at {x, y, z} (and optional rx, ry, rz).
//                       Every c.geom after this is placed INSIDE the group, relative to
//                       the group's origin, until c.end(). pose() can rotate or move the
//                       group by name. Groups may nest. Put the pivot where the real hinge
//                       is: a drawbridge pivots at its sill, a windmill sail at its hub.
// c.end()               close the innermost open group.
//
// pose(t, parts)        optional, hero pieces only. t is a 0..1 slider value the viewer
//                       controls (or, if you return { loop: seconds } beside pose, t runs
//                       0..1 over that many seconds and repeats). parts is a map of group
//                       name -> THREE.Group; set parts.bridge.rotation.x, parts.dome.rotation.y,
//                       etc. At most two posed groups per piece. Keep it linear and obvious.
//
// Handy local shortcut most pieces define first:
const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
const cyl = (r, h, cell, o = {}, seg = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, seg), cell, o)
```

## Palette (the only colors that exist)

Cells are roles, not colors. The engine resolves each cell to the district's own palette, so the
same building reads right in the Perseverance district and the Environmental one. Pick cells by
what the part is made of, not by what color you want.

| Cell | Role | Use for |
|---|---|---|
| `CELL.STONE` | masonry, plaster, limestone, concrete | walls, piers, domes, bases, steps, paving |
| `CELL.STONE_DARK` | darker masonry, shadow side, mortar lines | inset panels, arrow loops, doorways, window reveals |
| `CELL.WOOD` | timber | beams, doors, decks, hulls, frames, benches, piers |
| `CELL.METAL` | steel, iron, bronze | railings, masts, goal frames, lamp arms, clock hands |
| `CELL.METAL_DARK` | cast iron, gunmetal | chains, tires, floodlight heads, vents |
| `CELL.CLOTH` | canvas, linen, sail, membrane | banners, sails, awnings, tents, flags |
| `CELL.GLASS` | glass, water, screens off | windows, curtain walls, ponds, moats, fountain water |
| `CELL.ROOF` | roofing | **every pitched or conical roof.** Terracotta in one district, slate in another; the engine decides |
| `CELL.LEAF` | foliage | tree canopies, hedges, planting beds, living walls |
| `CELL.ACCENT` | **electric purple (E501FF)**, the brand color | the ONE thing carrying the brand: a neon band on a wall, a rune strip, a banner, a beacon cap. **Glows softly at night.** |
| `CELL.ACCENT2` | **lime green (AFFF00)**, the second brand color | a second banner, a trim line, a badge disc. Never more than a few parts |
| `CELL.GLOW` | warm light | lit windows, lamps, the lantern, the fountain uplight; pair with `emissive` |
| `CELL.RED` | signal red | a single hot part, a warning bit, a lifebuoy |
| `CELL.BLACK` | near black | openings, tires, mouths of tunnels, dark doorways |
| `CELL.LIGHT` | off-white | sails, awnings, the light side of a shape, clock faces |
| `CELL.EARTH` | soil, mulch, gravel | garden beds, a crag, a riverbank, a running track |

There is **no blue, no yellow** cell by name. Water is `CELL.GLASS`. Sky is nothing; leave it out.
Grass is not yours to draw; the engine lays the lawn. `ROOF` and `LEAF` are new in this project
and did not exist in earlier briefs; use them.

## Scale and frame

- Units: 1 unit is roughly one human height, about 1.7 m. Author to these envelopes:
  - **castle** (the headline of a district, six of them): up to 8 units wide, 7 tall, under 320
    parts. A castle is the biggest thing on the map after the great hall.
  - **heart piece** (great hall, amphitheater): up to 8 wide, 5 tall, under 240 parts.
  - **campus building** (dorms, halls, library, labs): 3 to 5 units wide, 2 to 4 tall, footprint
    inside 5 x 5, under 120 parts. Rectangular footprints, straight sides; they stand in rows.
  - **furniture** (trees, hedges, lamps, benches, boats, kiosks): 0.5 to 3 units wide, under 40
    parts. Hedge modules must tile: exactly 1.0 unit long, 0.5 wide, 0.7 tall, ends flat.
- `y = 0` is the ground. Build upward. Nothing below `y = 0` except a foundation, moat or a crag
  cut to `y = -0.3`.
- Origin `(0, 0, 0)` is the centre of the piece's footprint.
- Put the entrance or the interesting side toward `+z`. The engine faces `+z` toward the nearest
  avenue.
- Use `rand()` for small variety, such as which side a door is on, a chimney or not, one window
  lit or dark, so two copies of a dorm block are not clones. Never let `rand()` change the
  footprint.
- One `spin` per furniture piece, at most two `pose` groups per hero piece, two or three
  `emissive` points per piece. If it is not obvious what moves, nothing should.
- Real proportions matter more than real dimensions. A storey is about 0.6 units. A door is 0.5
  wide and 0.65 tall. A step is 0.1 tall. A conical tower roof is about 1.5 times as tall as it is
  wide. Get the ratio right and the piece reads.

## Worked example 1: a lighthouse (a furniture-sized piece, one spinning glow)

```js
  lighthouse(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, seg = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, seg), cell, o)
    // rock and a keeper's cottage, the cottage side chosen by seed
    c.geom(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 9), CELL.EARTH, { y: 0.15 })
    const side = rand() < 0.5 ? -1 : 1
    box(0.9, 0.55, 0.7, CELL.STONE, { x: side * 0.85, y: 0.57, z: 0.2 })
    const roof = new THREE.ConeGeometry(0.62, 0.35, 4); roof.rotateY(Math.PI / 4)
    c.geom(roof, CELL.ROOF, { x: side * 0.85, y: 1.02, z: 0.2 })
    // the tower: a tapered shaft with two accent bands
    c.geom(new THREE.CylinderGeometry(0.32, 0.42, 2.0, 14), CELL.LIGHT, { y: 1.3 })
    cyl(0.4, 0.16, CELL.ACCENT, { y: 0.9 }, 14)
    cyl(0.36, 0.16, CELL.ACCENT, { y: 1.7 }, 14)
    // gallery, lamp room, and the lamp itself, which turns
    cyl(0.5, 0.08, CELL.METAL_DARK, { y: 2.34 }, 14)
    cyl(0.3, 0.42, CELL.GLASS, { y: 2.6 }, 10)
    const lamp = new THREE.BoxGeometry(0.5, 0.18, 0.12)
    c.geom(lamp, CELL.GLOW, { y: 2.6, emissive: 1, spin: 1.4 })
    c.geom(new THREE.ConeGeometry(0.36, 0.3, 10), CELL.ROOF, { y: 2.96 })
    return { label: 'Lighthouse', kind: 'landmark' }
  },
```

## Worked example 2: a trebuchet (a hero piece, one posed group, labelled parts)

```js
  trebuchet(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, seg = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, seg), cell, o)
    // base frame: two skids and cross ties
    for (const z of [-0.6, 0.6]) box(4.0, 0.16, 0.16, CELL.WOOD, { y: 0.08, z })
    for (const x of [-1.6, 0, 1.6]) box(0.16, 0.16, 1.36, CELL.WOOD, { x, y: 0.08 })
    // the A-frames, one each side, leaning in to the axle
    for (const z of [-0.6, 0.6]) for (const s of [-1, 1]) {
      const leg = new THREE.BoxGeometry(0.14, 2.6, 0.14); leg.rotateZ(s * 0.32)
      c.geom(leg, CELL.WOOD, { x: s * 0.45, y: 1.3, z, label: s === 1 && z === 0.6 ? 'Frame' : undefined })
    }
    // the axle, across the top of both frames
    const axle = new THREE.CylinderGeometry(0.07, 0.07, 1.5, 10); axle.rotateX(Math.PI / 2)
    c.geom(axle, CELL.METAL_DARK, { y: 2.5, label: 'Axle' })
    // everything that swings lives in the 'arm' group, pivoted at the axle
    c.group('arm', { y: 2.5, rz: -0.9 })
      // long arm toward -x, short arm toward +x (5 : 1)
      box(3.2, 0.16, 0.16, CELL.WOOD, { x: -1.4, label: 'Throwing arm' })
      box(0.7, 0.22, 0.22, CELL.WOOD, { x: 0.45 })
      // counterweight box hanging off the short end
      c.group('weight', { x: 0.8 })
        box(0.06, 0.5, 0.06, CELL.METAL, { y: -0.25 })
        box(0.7, 0.55, 0.7, CELL.WOOD, { y: -0.75, label: 'Counterweight' })
        box(0.72, 0.06, 0.72, CELL.METAL_DARK, { y: -0.5 })
      c.end()
      // sling and stone at the long end
      box(0.03, 1.1, 0.03, CELL.METAL_DARK, { x: -3.0, y: -0.55, label: 'Sling' })
      c.geom(new THREE.SphereGeometry(0.16, 10, 8), CELL.STONE_DARK, { x: -3.0, y: -1.1, label: 'Stone' })
    c.end()
    // a windlass at the back and a trigger post
    const drum = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 10); drum.rotateX(Math.PI / 2)
    c.geom(drum, CELL.WOOD, { x: 1.7, y: 0.45, spin: 0 , label: 'Windlass' })
    box(0.1, 0.6, 0.1, CELL.METAL, { x: -1.5, y: 0.4, label: 'Trigger' })
    return {
      label: 'Counterweight trebuchet', kind: 'hero',
      // t: 0 = cocked (arm down at the front), 1 = released (arm over the top)
      pose(t, parts) {
        parts.arm.rotation.z = -0.9 + t * 2.2
        parts.weight.rotation.z = -(-0.9 + t * 2.2)   // the box hangs plumb
      },
    }
  },
```

## Hard rules, and the ones that have actually bitten

The importer is a script, not a person. It **rejects any function containing** `window.`,
`document.`, `fetch(`, `Math.random`, `import `, `new THREE.Mesh`, `eval(` or `Function(`. These
have each cost a re-roll:

- A local variable named `window` (for a building's window) trips the `window.` check. Call it
  `pane` or `opening`. You will be drawing hundreds of windows in this round, so decide this once.
- Do not use `BufferGeometry.applyQuaternion`; it is absent in one of the two engines these pieces
  are shared with. Use `geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q))`,
  or simply set `rx` / `ry` / `rz` in the options.
- Randomness comes from the `rand` argument only. It is seeded, so the same piece looks the same
  every time, which is the point.
- No people, no animals, no faces. Students and mentors walk the campus as separate rigged
  characters the engine already has. Statues are abstract (a rocket, a torch, a sphere on a
  plinth), never a figure.
- No text and no textures. There is no way to draw either. A clock face is a disc with two hands;
  a sign is a blank board; a scoreboard is a dark panel with a glow strip.
- No trademarks, no real logos, no company names in shapes.

## What to deliver

- One file per batch, containing only `const PIECES = { ...functions... }` with the function names
  exactly as listed below (lowercase, no spaces). Comments inside functions are welcome and read.
- Every function returns `{ label, kind }`; heroes add `pose` and optionally `loop`.
- If a piece needs a cell the table does not have, use the nearest role and say so in a comment.
- Do not write helper functions outside the pieces; each piece stands alone.
- A README listing any place you deliberately exceeded a part cap or a pose limit, and why.
- Per-piece PNG previews if you can render them; they are how the pieces get checked before
  import.

---

# The shopping list

Batches are in the order they will be imported. Within a batch, the order is the priority.
**Batch A and B are the demo; if time is short, deliver A and B first and send the rest after.**
## Scale for THIS batch (the envelopes above are outdoor buildings; these are rooms)

Pieces are authored at **1 unit = 1.7 m** exactly as before, and the origin sits on the floor at the
centre of the footprint. The room they furnish is a circle about **20 m across** (11.8 units) with walls
about **7 m** high (4.1 units).

| piece kind | footprint (units) | height (units) |
|---|---|---|
| wall segment, module gate | up to 4 wide | 2.4 to 4.1 |
| cinema wall, infographic wall | 3 to 5 wide | 2 to 3 |
| dais, progress pillar | 3 to 4 across | 0.3 (dais) / 2.5 (pillar) |
| bench, beanbags, lectern, plinth, console, workbench, globe | 0.8 to 2.5 | 0.3 to 1.4 |
| journal, trophy shelf, cannon, banner, brazier | 0.5 to 1.5 | 0.4 to 2.6 |

A doorway is 2.2 m (1.3 units) tall. A seat is 0.45 m (0.26 units). A counter is 0.9 m (0.53 units).


## The shopping list

Twenty-one pieces in three batches. Batch A is the room itself and matters most: without it there is no
interior at all.

### Batch A - the Course Hall (the hub room)

| function name | subject | what must read | pose |
|---|---|---|---|
| `coursehallfloor` | Round stone floor with a lime inlay ring and a compass rose at the centre | A room's floor, worn smooth, the ring reading as a progress track | static |
| `coursehallwall` | One curved wall segment of the round hall: stone courses, a thin purple rune band, a sconce | Stone first, neon second. Segments repeat round the circle | static |
| `modulegate` | A doorway into one module: stone arch, a lime keystone gem, a curtain of light across it | Locked (dark gem, dim curtain) and unlocked (lit) must both read from the same model | `loop` shimmering curtain |
| `modulegatenumber` | A hanging numbered plaque for a module gate, 1 to 9 | Readable at 3 m, like a shop sign: chunky, carved, confident | `loop` slow swing |
| `conciergedais` | Raised round dais at the centre where the guide stands, steps up on two sides | The stage of the room, a rim of lime light, banners behind | static |
| `hallbanner` | Tall hanging banner on a pole for the dais, castle colours | Cloth with weight, a fringe, a crest panel | `loop` gentle wave |
| `hallbrazier` | A warm standing light: a brazier or lantern on a stand | The room's fire. Big glow, a visible flame shape | `loop` flicker |
| `progresspillar` | A pillar of stacked rings that fill with light as modules are finished | A score meter you can read across the room | static |

### Batch B - the study pod (one module's room)

| function name | subject | what must read | pose |
|---|---|---|---|
| `cinemawall` | A huge screen framed in stone and brass with a lit surround and a blank panel face | The screen face MUST be one flat quad facing +z: the engine paints the video onto it | static |
| `listeningbench` | A curved padded bench for two or three with a speaker horn at each end | Comfortable and inviting, a place to sit and listen to the podcast | static |
| `beanbagcluster` | Three fat beanbags and a low rug | Soft, playful, kid furniture. The opposite of a classroom chair | static |
| `infographicwall` | A leaning display wall with a big blank panel, a chunky frame and a step to stand on | The panel face must be one flat quad facing +z for the engine to paint the infographic onto | static |
| `readerlectern` | A reading lectern holding an open book, with a lamp on a swan neck | Where the text and PDF live. The open pages are a flat quad facing up | static |
| `podcaststand` | A standing microphone with a headphone hook | Signals "listen here" from across the room | `loop` slow bob on the headphones |
| `questplinth` | A waist-high plinth with a glowing lime socket on top, empty and waiting | Where a quest prop drops in. Reads as "put something here" | `loop` pulse |

### Batch C - the quest props and the rewards

These are the things a child actually does something with, so they should be the most characterful
pieces in the batch.

| function name | subject | what must read | pose |
|---|---|---|---|
| `gratitudeglobe` | A chest-high globe on a stand with ten pin sockets, three pins already placed | The Gratitude quest: pin ten ways gratitude is expressed worldwide | `loop` slow spin |
| `gratitudejournal` | A thick open journal on a small stand, a pen, a stack of written cards | The 30-day practice: warm, handwritten, personal | static |
| `ideaworkbench` | A workbench with a business plan laid out in parts: sticky notes, a model shopfront, coins, a small sign | The Entrepreneurship quest: assemble a plan from parts | static |
| `promptconsole` | A chunky retro-futuristic console with a keyboard, a glowing screen and one big lever | The AI Master quest: type a prompt, pull the lever, something happens | `loop` screen flicker and a lamp sweep |
| `badgetrophyshelf` | A cabinet of badge trophies, most sockets empty, three filled and glowing | Your collection so far. It should make you want the empty ones | static |
| `confetticannon` | A stubby ceremonial cannon on a base aimed up, lime and purple ribbons round it | Fired when a module or a badge is finished | `loop` twitch |


## Traps that have actually bitten on this project

- **The importer rejects a piece outright** if the code contains `Math.random`, `import `,
  `new THREE.Mesh`, `document.`, `window.`, `fetch(`, `eval(` or `Function(`. Use the `rand` argument for
  randomness and `c.geom(...)` for geometry. A rejected piece is simply missing from the campus.
- **`applyQuaternion` does not exist in this build.** Do not call it.
- **A piece that returns a `pose` must not also move its own parts.** Return the pose function and let the
  engine drive it.
- **A face the engine paints on must be a single quad facing +z**, centred on the piece's own origin, with
  nothing in front of it. That applies to `cinemawall`, `infographicwall` and `readerlectern`. If you
  decorate the face, the video lands on your decoration.
- **Nothing floats.** Every piece meets the floor. In VR the player's feet are on that floor, and a gap at
  ankle height is very visible.
- **No text, letters or numerals drawn as geometry**, with one exception: `modulegatenumber`, where the
  numeral is the subject. Everywhere else signs are blank panels the engine fills.

## Checklist before you send a batch

1. Every function is named exactly as the table says, and every one in the table is present.
2. None of the banned tokens appear anywhere in the file.
3. Every piece meets `y = 0` and has no hollow back.
4. Pieces meant to be painted expose one clean quad facing +z.
5. Each piece has at most two or three `CELL.GLOW` or `CELL.ACCENT` accents, placed where a room's light
   would come from.
6. Read each piece back and ask: would a 13-year-old think this room looks fun, or like school? If it is
   the second one, make it chunkier, brighter and stranger.
