# Unlimited Campus set pieces, complete instructions

Paste this entire file into a fresh ChatGPT conversation. It is self-contained: you do not need
any earlier brief. Everything you need is below, and the shopping list is at the end.

## What you are building

Small procedural 3D models, written as JavaScript functions against a tiny helper API. They are
imported into **Unlimited Campus**, a browser-based 3D campus for Unlimited Awesome, an education
company whose curriculum is the **Six Castles of Human Flourishing**: Perseverance, Creative
Problem Solving & Critical Thinking, Teamwork & Mentorship, Economic Responsibility, Social
Impact, and Environmental Sustainability. Students earn 52 badges across the six castles.

The campus is one connected map: a formal university campus seen from the air, with a circular
plaza and amphitheater at the heart, six castle districts around it, tree-lined avenues, lakes,
sports fields and geometric gardens. Every building, tower, tree, bench and boat on it is one of
your pieces. The engine lays out the ground (lawns, paving, water, roads) and places your pieces
on it.

You are not writing a three.js scene. You never create a mesh, a material or a light. You describe
shapes and which palette role paints them, and the engine does the rest.

## How your models are seen (read this before designing anything)

- **From the air, at an isometric angle, above and to the side.** The reference is an aerial
  photograph of a real campus: rows of rectangular buildings with pitched or flat roofs, a round
  plaza in the middle with a columned hall and a semicircular stepped amphitheater, concentric
  ring paths with radial avenues, quads of buildings with courtyards, two lakes, three soccer
  pitches, circular hedge parterres. Roofs and tops matter most. The camera orbits, so there is
  no single "back" you can leave empty.
- **At roughly 150 to 500 pixels for a castle or the great hall**, 100 to 250 for a campus
  building, about half that for furniture. This is large. Detail pays off: a window every unit, a
  merlon every half unit, a rib on every arch, a chimney, a rooftop vent.
- **On flat ground.** Pads, lawns and paving are flat at `y = 0`. Nothing sits on a platform or a
  hex deck. Give every piece a base that meets turf or paving, not a plinth that floats.
- **Side by side in quads.** Campus buildings stand in rows and U shapes about 1 to 2 units apart,
  so respect the footprint envelopes below and keep the sides straight where a neighbour goes.
- **In VR you stand in it.** Everything is walked past at human height as well as looked down on.
  A door should be door-sized, steps should be step-sized, and nothing should have a hard edge at
  ankle height you would clip through.
- **There is a day and night cycle.** `CELL.ACCENT` glows softly at night and `CELL.GLOW` parts
  read as lit windows, lamps and beacons. Two or three glow points per piece is enough.

**The look of the castles specifically.** Unlimited Awesome already has artwork for its six
castles: real, heavy, stone castles (a French chateau with conical tower roofs and a moat; a
monolithic granite fortress on a crag) with **thin neon bands and rune strips in electric
purple and lime green** running along the walls, and purple and lime banners on the towers. Your
castles should read the same way: convincing stone masonry first, then one or two thin
`CELL.ACCENT` bands or strips (emissive) and `CELL.CLOTH` banners painted `CELL.ACCENT` or
`CELL.ACCENT2`. Not a cartoon castle, not a toy.

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

## Batch A: the six castles (hero, one per district)

These are the six headline pieces of the whole map, seen at up to 500 pixels and walked up to in
VR. Each must be unmistakably a different castle, and each must say what its castle teaches
without a word of text. Stone first, neon second: one or two thin `CELL.ACCENT` strips (emissive
0.6) along a wall or up a tower, `CELL.CLOTH` banners painted `ACCENT` or `ACCENT2` on the
towers, and a glowing gate. Every castle gets a proper approach on `+z`: steps or a bridge to a
gate that is door-sized.

| function | subject | what must read | pose |
|---|---|---|---|
| `castleperseverance` | Castle of Perseverance | A monolithic granite fortress on a rocky crag (`EARTH` + `STONE_DARK` crag to y -0.3, rising 1.5). Five or six tall flat-topped slab towers of different heights, stepped, the tallest in the middle, vertical rune strips (`ACCENT`, emissive) up the tower faces, a long switchback stair up the crag to the gate. Grit, weight, height. | `banner` group on the top tower sways, `loop: 5` |
| `castleeconomic` | Castle of Economic Responsibility | A French chateau: square central keep with a pyramid roof, six round towers with tall conical `ROOF`s, curtain walls between them, a `GLASS` moat ring with a stone bridge on `+z`, a formal parterre square inside the walls (`LEAF` low beds in a grid), gold-toned `ACCENT2` flags. Order, wealth, symmetry. | `drawbridge` group pivoted at the sill lowers over the moat, `t` 0 up to 1 down |
| `castlecreative` | Castle of Creative Problem Solving & Critical Thinking | A labyrinth castle: a maze forecourt of `LEAF` hedges (use the 1-unit hedge module logic inline) leading to a round keep topped by a `GLASS` observatory dome, with a great brass orrery ring (`METAL`, `spin` slowly) around the dome and a pair of interlocking gears on the gatehouse. Puzzle, logic, curiosity. | `dome` group rotates about y, `t` 0..1 = quarter turn |
| `castleteamwork` | Castle of Teamwork & Mentorship | Twin towers of equal height joined by a covered timber bridge (`WOOD`) high up, over a wide round-table hall (a low drum with a shallow dome and a ring of arched openings). A ring of eight small `ACCENT`/`ACCENT2` flags around the hall roof. Two gates, one each side, both open. Two things holding each other up. | `gateleft` and `gateright` groups swing open together |
| `castlesocial` | Castle of Social Impact | An open forum, not a fortress: a square cloister of arcaded walkways (arches on all four sides, `STONE`), a tall slender bell tower on one corner with a `METAL` bell, wide shallow steps on `+z` the full width of the front so the whole side is an entrance, a `GLOW` brazier at the centre of the courtyard. Welcome, openness. | `bell` group swings, `loop: 3` |
| `castleenvironmental` | Castle of Environmental Sustainability | A living castle: stepped stone terraces with `LEAF` planting on every level, a windmill on one tower (`CLOTH` sails, `spin`), a waterwheel on the side into a `GLASS` millrace (`spin`, `spinAxis: 'z'`), `GLASS` solar panels tilted on the south roofs, a `LEAF` living wall down one face, a rain cistern. Growth, stewardship. | none (two spins carry the motion) |

## Batch B: the heart of campus

The circular plaza in the middle of the map. The great hall stands on the north side of the
circle, the amphitheater bowl faces it from the south, the beacon and fountain sit on the ring
path, the gate stands where the main avenue enters the circle.

| function | subject | what must read | pose |
|---|---|---|---|
| `greathall` | the Great Hall, the campus's main building | A neoclassical hall: a wide flight of steps the full width of the front on `+z`, a portico of six columns under a triangular pediment, a long pitched `ROOF` with a central cupola/lantern (`GLASS` drum, `ROOF` cap, `GLOW` inside), tall arched windows down both flanks, two `ACCENT` strips framing the doors. The biggest ordinary building on the map. | `doors` group (two leaves) opens |
| `amphitheater` | the semicircular amphitheater | A half-bowl of eight concentric stone tiers (each tier a half-torus or lathe, `STONE`, with `STONE_DARK` risers), a flat stage platform at the open side on `+z`, two ramps down the straight edge, a low `METAL` rail on the top tier, four `GLOW` lamp posts on the rim. It is the thing that reads from the air. | none |
| `centralbeacon` | the campus beacon | A tall slender obelisk (`STONE`) on a three-step base, a floating `ACCENT` ring near the top (`spin`), a `GLOW` cap with emissive 1. Visible from every district. | none |
| `grandfountain` | the plaza fountain | Three stacked `STONE` basins, `GLASS` water discs in each, a central spire, `GLOW` uplights in the lowest basin, a low sitting rim. | `spire` group spins slowly, `loop: 12` |
| `ringpavilion` | a small open pavilion on the ring path (used four times) | Eight slim columns, a low `ROOF` octagon, a bench ring inside, one `GLOW` lantern under the roof. | none |
| `welcomegate` | the campus gate | Two stone piers with a shallow arch between, an `ACCENT` neon strip following the arch, two banner posts, a short run of railing either side. Door-sized opening plus room for two abreast. | none |

## Batch C: campus buildings (repeated in quads)

These are the rectangular blocks that fill the reference photo. They stand in rows and U shapes
about 1.5 units apart, so keep footprints rectangular, sides flat and roofs the best part. Use
`rand()` for a chimney, a lit window, a rooftop vent, a door side, never for the footprint.
Windows: `STONE_DARK` insets, one or two `GLOW` at night. Each building gets a plain door on
`+z` and a base slab 0.1 tall.

| function | subject | what must read | pose |
|---|---|---|---|
| `dormblock` | a student residence | A 3-storey slab, 4.5 x 2.2, flat roof with a parapet, a regular window grid (6 x 3 per long side), a rooftop `LEAF` planter, two variants by seed (balconies or not). | none |
| `courtyardhouse` | a U-shaped residence (the orange-roofed quads in the reference) | Two storeys in a U around a small courtyard open on `+z`, pitched `ROOF` on all three wings, dormer windows, a `LEAF` tree in the courtyard, chimneys. | none |
| `lecturehall` | a lecture building | A steep pitched `ROOF` over a 2-storey hall, a four-column portico on `+z`, a clerestory strip of `GLASS` along the ridge, a raked side wall. | none |
| `library` | the library | A long hall with a row of tall arched `GLASS` windows down each flank, a central `STONE` dome on a drum, a reading-room lantern (`GLOW`) on top, wide steps. | none |
| `sciencelab` | a laboratory | A `GLASS` curtain-wall box on a `STONE` base, exposed `METAL` frame, a rooftop plant room, a small dish (`spin` slowly). | none |
| `fieldhouse` | the gym by the sports fields | A long barrel-vault `ROOF`, big double doors, a strip of high windows, a floodlight on the corner. | none |
| `clocktower` | the campus clock tower | A square `STONE` tower 5 tall, a clock face on each side (a `LIGHT` disc with two `METAL` hands; the minute hand `spin`s slowly), a pyramid `ROOF`, an `ACCENT` band under the clocks. | none |
| `greenhouse` | a glasshouse | A ridge-roofed `GLASS` house on a low brick base, `LEAF` beds inside visible through the glass, a chimney stack. | none |
| `cafepavilion` | the campus cafe | An open-sided pavilion: slim columns, a flat `ROOF` with a wide overhang, a counter block inside, round tables and stools (`WOOD`, no chairs with backs), string of `GLOW` lamps under the eaves. | none |
| `studiohall` | a creative studio | A sawtooth (north-light) `ROOF` of three bays, big `GLASS` faces on the sawtooth, a roller door on `+z`, an `ACCENT2` stripe along the eave. | none |
| `boathouse` | the boathouse on the lake | A gabled timber shed with its front open to `+z`, a `WOOD` ramp sloping down to y 0 and beyond to -0.3 (the engine puts water there), a rowboat inside, a lifebuoy (`RED`). | none |
| `observatory` | the observatory | A cylindrical drum with a hemispherical dome, a slot in the dome, a small terrace with rail. | `dome` group rotates about y |
| `mentorshall` | the Hall of Mentors | A round hall with a ring of 12 tall pilasters, a shallow dome, a wide entrance on `+z`, a ring of `ACCENT2` roundels between the pilasters, a small `GLOW` lantern on top. | none |

## Batch D: grounds furniture (repeated dozens of times)

World furniture. It repeats, so it must look right at any rotation and never have a distinctive
silhouette that gets boring. Read from eye level as well as from above. Sit on turf, not on a
plinth.

| function | subject | what must read | pose |
|---|---|---|---|
| `campustree` | a round-crown tree (the avenue tree) | `WOOD` trunk, three or four overlapping `LEAF` spheres, 2.0 tall, slight yaw by seed. | none |
| `campustreetall` | a tall narrow tree (cypress / poplar) | `WOOD` trunk, a tall `LEAF` ellipsoid, 2.6 tall, 0.7 wide. | none |
| `campustreeflat` | a spreading tree (parkland) | Low wide `LEAF` layers, 1.6 tall, 2.4 wide, a visible branch fork. | none |
| `hedgestraight` | a hedge module, tiles end to end | EXACTLY 1.0 long (x), 0.5 wide, 0.7 tall, flat ends, `LEAF`, slight top rounding. | none |
| `hedgecorner` | a hedge corner, 90 degrees | Two half-modules meeting at a right angle in the +x/+z quadrant, same section as `hedgestraight`. | none |
| `hedgering` | a hedge circle for the parterres | A `LEAF` torus 2.6 across, 0.5 section, with one gap on `+z`, an `EARTH` bed inside with four `LEAF` mounds. | none |
| `gardenparterre` | a formal garden square | A 3 x 3 square: gravel (`EARTH`) paths in a cross and a ring, low `LEAF` beds in the quarters, a small `STONE` urn at the centre. | none |
| `lamppost` | a campus lamp post | 1.4 tall `METAL_DARK` post, an arm, a `GLOW` lantern head, emissive 0.8. | none |
| `parkbench` | a bench | `WOOD` slats on two `METAL_DARK` ends, 1.0 long, sits at 0.25. | none |
| `bikerack` | a bike rack | Five `METAL` hoops in a row on a base, no bikes. | none |
| `flagpole` | a flagpole with a banner | `METAL` pole 2.4 tall, a `CLOTH` banner painted `ACCENT`, a second smaller `ACCENT2` pennant. | `banner` group sways, `loop: 4` |
| `signpost` | a campus signpost | A post with three blank `WOOD` boards pointing different ways, one `ACCENT` edge strip. | none |
| `soccergoal` | a goal | `METAL` frame 1.4 wide, 0.55 tall, a `LIGHT` net implied by three thin bars across the back. | none |
| `bleacher` | a stand for a pitch | Four `METAL_DARK` steps with `WOOD` seat boards, 2.5 long, a back rail. | none |
| `floodlight` | a floodlight mast | A tall `METAL` mast 3.0, a head of six `METAL_DARK` lamps in a grid, `GLOW` faces, emissive 0.6. | none |
| `sailboat` | the sailboat on the lake | `WOOD` hull 1.8 long, a mast, a `LIGHT` mainsail and jib (`CLOTH`), a tiller. Sits at y 0 (the engine floats it). | `hull` group rocks about z, `loop: 6` |
| `rowboat` | a rowboat | `WOOD` hull 1.2 long, two thwarts, oars shipped. | none |
| `pier` | a timber pier | `WOOD` deck 3.0 long on posts, a mooring bollard, a `RED` lifebuoy on a post. | none |
| `footbridge` | a stone arch bridge over water | `STONE` arch 4.0 long, 1.2 wide, low parapets, the deck rising 0.3 in the middle, approach ramps to y 0. | none |
| `gazebo` | a garden gazebo | Six slim `WOOD` posts, a conical `ROOF`, a rail between posts except on `+z`, a bench ring. | none |
| `shuttlestop` | a shuttle stop | A `GLASS` shelter on a `METAL` frame, a bench, a blank sign post, 2.0 long. | none |
| `badgepillar` | a badge kiosk (used 52 times, one per badge) | A slim `STONE` totem 1.6 tall on a small base, a floating `ACCENT2` disc near the top (`spin` 0.6) inside a `METAL` ring, an `ACCENT` band at the base, emissive 0.7 on the disc. The engine tints the disc per badge. | none |
| `castlebanner` | a district banner post (at each district gate) | A `METAL` post with a crossbar and two hanging `CLOTH` banners, one `ACCENT`, one `ACCENT2`, 2.2 tall. | `banners` group sways, `loop: 5` |
| `rocketstatue` | the launchpad statue on the plaza | A stylised rocket (`LIGHT` body, `RED` fins, `GLASS` porthole, `GLOW` exhaust ring) angled 12 degrees up on a `STONE` plinth with three `ACCENT` strips, 2.6 tall. Represents the student launchpad. No figures. | none |

## Checklist before you send a batch

- Every name in the tables above is present, spelled exactly, nothing extra, nothing renamed.
- The file contains only `const PIECES = { ... }`. No helpers outside the pieces, no exports.
- `grep` your file for `window.`, `document.`, `fetch(`, `Math.random`, `import `, `new THREE.Mesh`,
  `eval(`, `Function(`, `applyQuaternion`. All must be zero.
- Every piece returns `{ label, kind }`. Heroes that move return `pose` (and `loop` if it should
  run by itself). No more than two posed groups per piece.
- Every piece stands on `y = 0` with a base that meets ground. Origin at the footprint centre.
  Entrance toward `+z`.
- Envelopes respected: castles 8 x 7 under 320 parts, heart pieces 8 x 5 under 240, buildings
  5 x 5 under 120, furniture under 40. Hedge modules exactly 1.0 x 0.5 x 0.7.
- Roofs are `CELL.ROOF`, foliage is `CELL.LEAF`, water is `CELL.GLASS`, purple is `CELL.ACCENT`
  and used sparingly, lime is `CELL.ACCENT2` and used more sparingly still.
- No people, animals, faces, text, textures, logos.
- A README noting any deliberate cap exceptions.
