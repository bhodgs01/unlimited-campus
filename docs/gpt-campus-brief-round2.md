# Unlimited Campus set pieces, round two: nature and more structures

Paste this entire file into a fresh ChatGPT conversation. It is self-contained: you do not need
the earlier brief. Everything you need is below, and the shopping list is at the end.

## What you are building

Small procedural 3D models, written as JavaScript functions against a tiny helper API, for
**Unlimited Campus**: a browser 3D campus for Unlimited Awesome, whose curriculum is the Six
Castles of Human Flourishing. Round one (49 pieces: six castles, the great hall, thirteen campus
buildings, twenty-four pieces of furniture) is live. This round adds **the nature that makes it
look planted rather than placed, and the structures that make it look like a whole campus**:
trees of several species, bushes, flower beds, rocks, and about thirty more buildings and
grounds structures.

You are not writing a three.js scene. You never create a mesh, a material or a light. You
describe shapes and which palette role paints them, and the engine does the rest.

## How your models are seen (read this before designing anything)

- **The campus is an island.** A lawn plateau on a low cliff in a blue sea, with a dense forest
  belt around its rim, a canal and harbour along the south shore, a lake to the west, two ponds
  to the east. Inside that: a circular plaza with the great hall and an amphitheater, a street
  grid of quads, six castle districts, three pitches, gardens and a market.
- **From the air, at an isometric angle, above and to the side**, at roughly 100 to 300 pixels
  for a building, 20 to 80 pixels for a tree or a bush. The camera orbits, so there is no back.
- **Nature pieces are instanced by the thousand.** Trees, bushes, rocks and beds are stamped
  2,000 to 5,000 times each from ONE build, so they must be **cheap** (the part caps below are
  hard), they must **look right at any rotation and at 0.7x to 1.4x scale**, and they carry
  **no spin and no pose** (instancing drops animation). Variety comes from the engine mixing
  species, scale and rotation, not from `rand()` inside one piece, so use `rand()` only for
  small things such as trunk lean or which side a branch leaves.
- **Trees are seen in groves**: eight to thirty of the same species clumped together, with a
  few of another species mixed in. A species must read as a species from the air: silhouette
  and canopy colour, not detail. Give every tree a real trunk that meets turf at `y = 0`.
- **Structures stand on flat lawn or paving at `y = 0`**, in rows 1 to 2 units apart. Give each
  a base slab 0.1 tall, a door on `+z`, windows as `STONE_DARK` insets with one or two `GLOW`.
- **There is a day and night cycle.** `CELL.GLOW` parts become lamplight at night and
  `CELL.ACCENT` neon bands brighten. Two or three glow points per building, none on nature.
- **In VR you stand in it.** Doors door-sized, steps step-sized, nothing sharp at ankle height.

**The look.** Warm limestone buildings, slate and terracotta roofs, electric purple (E501FF) and
lime (AFFF00) as the brand accents used sparingly. Trees are stylised low-poly, not realistic:
a trunk and two to five overlapping canopy blobs or cones. Think a well-made board game, not a
photograph.

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

**Colour notes for this round.** Foliage is `CELL.LEAF` (the engine resolves it per district,
mid green). An autumn tree paints its canopy `CELL.ROOF` (terracotta in some districts, slate
in others; both read as an off-species tree, which is what we want). A blossom tree paints its
canopy `CELL.LIGHT`. Flowers are `CELL.ACCENT` and `CELL.ACCENT2` in small blobs on a
`CELL.LEAF` or `CELL.EARTH` bed; a little goes a long way. Rocks are `CELL.STONE_DARK`.

## Scale and frame

- Units: 1 unit is roughly one human height, about 1.7 m. Author to these envelopes:
  - **nature piece** (trees, bushes, beds, rocks): under **24 parts** (trees under 16),
    footprint inside 3 x 3, height 1 to 3.2 for a tree, under 0.9 for a bush or bed.
  - **grounds structure** (bandstand, playground, bus stop, kiosk): under 60 parts, inside 4 x 4.
  - **building** (union, dining hall, tower, museum): 3 to 6 units wide, 2 to 5 tall, footprint
    inside 6 x 6, under 140 parts. Towers may reach 6 tall.
  - **hero** (lighthouse, wind turbine, stadium stand): under 200 parts, inside 8 x 8.
- `y = 0` is the ground. Build upward. Nothing below `y = 0` except a foundation to `y = -0.1`.
- Origin `(0, 0, 0)` is the centre of the piece's footprint. Entrance toward `+z`.
- Use `rand()` for small variety only, never for the footprint.
- Nature pieces: no `spin`, no `pose`, no `emissive`, no `label`. Structures: one `spin` at most
  (the turbine, a weathervane), at most two `pose` groups on a hero, two or three `emissive`
  points, six to twelve labels on a hero, none on furniture.
- Real proportions matter more than real dimensions. A storey is about 0.6 units. A door is 0.5
  wide and 0.65 tall. A birch is thin and tall; an oak is wide and round; a pine is a stack of
  cones; a willow droops.

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

- Nature pieces are instanced: no `spin`, `pose`, `emissive` or `label` on them, and keep them
  under the part caps. A 40-part tree stamped 4,000 times is 160,000 parts.

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
**Batch E (nature) is the one that changes the whole map; deliver it first if time is short.**

## Batch E: nature (instanced by the thousand, under 24 parts, trees under 16)

| function | subject | what must read |
|---|---|---|
| `oaktree` | a broad oak | Thick `WOOD` trunk with one fork, three or four overlapping `LEAF` spheres making a wide round crown, 2.6 tall, 2.8 wide. The default campus tree. |
| `pinetree` | a pine / fir | Straight trunk, three stacked `LEAF` cones narrowing upward, 3.0 tall, 1.4 wide. Groves of these ring the island. |
| `birchtree` | a birch | Thin `LIGHT` trunk (pale bark), a tall narrow `LEAF` ellipsoid crown, 2.8 tall, 1.1 wide. Planted in loose lines. |
| `willowtree` | a weeping willow | Leaning trunk, a wide flattened `LEAF` dome with four or five drooping `LEAF` cones hanging from its rim, 2.2 tall, 2.6 wide. For the lake and canal banks. |
| `cherrytree` | a blossom tree | Slim trunk, three `LIGHT` spheres (blossom) with one small `LEAF` sphere, 1.9 tall. Along the avenues in spring groups. |
| `autumntree` | an autumn maple | Like the oak but smaller (2.2 tall) with the crown in `CELL.ROOF`. A few per grove. |
| `cypresstree` | a tall cypress | A single tall narrow `LEAF` ellipsoid on a short trunk, 3.2 tall, 0.7 wide. Formal lines beside paths. |
| `saplingtree` | a young tree with a stake | Thin trunk, one small `LEAF` sphere, a `WOOD` stake and tie, 1.2 tall. Newly planted rows. |
| `bushround` | a round shrub | Two or three `LEAF` spheres, 0.8 tall, 1.0 wide. |
| `bushwide` | a spreading shrub | Three or four `LEAF` spheres low and wide, 0.5 tall, 1.6 wide. |
| `bushflower` | a flowering shrub | A `LEAF` sphere with four or five small `ACCENT2` spheres on it, 0.8 tall. |
| `topiaryball` | a clipped ball on a stem | A `LEAF` sphere on a short `WOOD` stem, 1.0 tall. Pairs at doors. |
| `topiarycone` | a clipped cone | A `LEAF` cone, 1.4 tall, 0.6 wide. |
| `flowerbed` | a flower bed | A low `EARTH` disc 1.6 across with eight to ten small `ACCENT` and `ACCENT2` spheres and a few `LEAF` ones. |
| `flowerstrip` | a flower border, tiles end to end | EXACTLY 1.0 long (x), 0.4 wide, 0.3 tall: an `EARTH` box with a row of small `ACCENT2` / `LEAF` spheres. |
| `rock` | a boulder | Two or three `STONE_DARK` dodecahedra or spheres overlapping, 0.8 tall. |
| `rockcluster` | a group of rocks | Four or five `STONE_DARK` boulders of different sizes with a `LEAF` tuft, 2 wide. |
| `reedclump` | reeds at the water's edge | Six to ten thin tall `LEAF` cylinders leaning slightly, 1.0 tall, on a small `EARTH` pad. |
| `lilypads` | lily pads | Five or six flat `LEAF` discs of different sizes on the water plane with one `ACCENT2` bud. Sits at y = 0. |
| `treestump` | a cut stump | A short `WOOD` cylinder with a `LIGHT` top disc, 0.4 tall. |
| `logpile` | stacked logs | Five or six `WOOD` cylinders lying stacked, 0.7 tall, 1.4 long. |
| `planterbox` | a wooden planter | A `WOOD` box 1.0 x 0.5 with `LEAF` and `ACCENT` blobs inside, 0.6 tall. |

## Batch F: more buildings (under 140 parts, footprint inside 6 x 6)

| function | subject | what must read | pose |
|---|---|---|---|
| `studentunion` | the student union | Two joined blocks, one 3 storeys with a `GLASS` curtain wall, one 2 storeys with a `ROOF` pitch, a wide entrance canopy on `+z`, an `ACCENT` band along the canopy. | none |
| `dininghall` | the dining hall | A long hall with a high pitched `ROOF`, a row of tall arched windows, a clerestory, a `GLOW` lantern, and an outdoor terrace of tables on `+z`. | none |
| `meditationhall` | a quiet hall for the Perseverance castle's badges | A square pavilion with a three-tier pagoda-style `ROOF`, open sides between posts, a `GLOW` lantern under each eave, a gravel `EARTH` forecourt with three `STONE_DARK` stones. | none |
| `artmuseum` | an art museum | A `LIGHT` box with one sawtooth skylight row, a cantilevered entrance box, a sculpture court with an abstract `ACCENT` ring on a plinth. | none |
| `sciencetower` | a science tower | A slim 6-tall tower: `STONE` base, `GLASS` upper storeys with `METAL` fins, a rooftop dish (spin slowly), an `ACCENT` band at the top. | none |
| `dormtower` | a residence tower | A 4-storey `STONE` tower with a regular window grid, balconies, a rooftop `LEAF` garden. | none |
| `lecturecomplex` | a lecture complex | Three pitched-roof wings in a fan around a shared `GLASS` foyer. | none |
| `librarywing` | a library annex | A long low hall of tall arched `GLASS` windows with a reading-room lantern, joins the library. | none |
| `sportshall` | a sports hall | A big box with a shallow barrel `ROOF`, high strip windows, big doors, a floodlight. | none |
| `bellpavilion` | a bell pavilion | Four `STONE` piers, a pitched `ROOF`, a `METAL` bell hung between; the bell is a `bell` group. | `bell` swings, `loop: 4` |
| `watertower` | a water tower | A `METAL` tank on four braced legs, 4 tall, an `ACCENT` band round the tank. | none |
| `windturbine` | a wind turbine | A tall `LIGHT` mast 6 tall with a three-blade rotor in a `rotor` group that spins slowly about z. | `rotor` spins (use `spin` on the hub) |
| `solarfield` | a solar array module, tiles in rows | Six tilted `GLASS` panels on `METAL` frames in a 3 x 2 block, 3 x 2 footprint. | none |
| `greenhousedome` | a botanical dome | A `GLASS` geodesic-looking hemisphere (a sphere cut at the ground with `METAL` ribs) 3 wide with `LEAF` inside. | none |
| `busstation` | the campus bus station | A long `ROOF` canopy on `METAL` posts, a `GLASS` waiting room, two bays. | none |
| `campusbus` | a campus shuttle bus | A `LIGHT` bus body with `GLASS` windows, `METAL_DARK` wheels, an `ACCENT` stripe, 2.4 long. Parked. | none |
| `foodtruck` | a food truck | A `ACCENT2` van body, a serving hatch on `+z` with an awning, `GLOW` inside the hatch. | none |
| `treehouse` | a treehouse | A `WOOD` cabin on a platform in an oak (`LEAF` spheres around it), a rope ladder of thin `WOOD` rungs. | none |
| `bandstand` | a bandstand | An octagonal `STONE` base, eight slim posts, a `ROOF` dome, a `METAL` rail. | none |
| `playground` | a playground | A `WOOD` climbing frame, a slide, two swings on a frame, on an `EARTH` pad 4 x 4. | none |
| `tenniscourt` | a tennis court | A flat `EARTH` (clay) rectangle 5 x 3 with `LIGHT` line boxes and a `METAL` net. | none |
| `swimmingpool` | an outdoor pool | A `GLASS` rectangle 5 x 2.5 recessed in a `STONE` deck with lane lines, a diving block, two loungers. | none |
| `skatepark` | a skate park | A `STONE` bowl (a lathe half-bowl) and a quarter-pipe, 4 x 4. | none |
| `stadiumstand` | a covered stand for a pitch | Six stepped tiers of `WOOD` seats on `METAL_DARK` risers with a cantilevered `ROOF`, 6 long. | none |
| `scoreboard` | a scoreboard | A `METAL_DARK` panel on two posts with a `GLOW` strip, 2 wide. | none |
| `lighthouse` | a lighthouse on the south shore | A tapered `LIGHT` tower 6 tall with two `ACCENT` bands, a `GLASS` lamp room, a `GLOW` lamp that spins, a keeper's cottage. | none |
| `ferryterminal` | a ferry terminal on the harbour | A `ROOF` canopy over a `GLASS` hall on a `STONE` quay, a gangway sloping to y 0, a `RED` lifebuoy. | none |
| `boatshed` | a boat rental shed | A small `WOOD` shed with three canoes (`ACCENT`, `ACCENT2`, `LIGHT`) racked on its side. | none |
| `sundial` | a sundial | A `STONE` pedestal with a `METAL` gnomon on a `LIGHT` disc, 1.0 tall. | none |
| `statueplinth` | an abstract statue | A `STONE` plinth with a `METAL` spiral or torus knot on top, 2.2 tall. No figures. | none |
| `bikeshed` | a covered bike shed | A `ROOF` lean-to on `METAL` posts over two bike racks. | none |
| `noticeboard` | a notice board | A `WOOD` frame with a blank `LIGHT` board and a small `ROOF` cap, 1.4 tall. | none |
| `phonebooth` | an info kiosk | A `GLASS` box on a `STONE` base with an `ACCENT` roof band and a `GLOW` inside, 1.5 tall. | none |

## Checklist before you send a batch

- Every name in the tables above is present, spelled exactly, nothing extra, nothing renamed.
- The file contains only `const PIECES = { ... }`. No helpers outside the pieces, no exports.
- `grep` your file for `window.`, `document.`, `fetch(`, `Math.random`, `import `, `new THREE.Mesh`,
  `eval(`, `Function(`, `applyQuaternion`. All must be zero.
- Batch E pieces: under 24 parts (trees under 16), no spin, pose, emissive or label.
- Every piece stands on `y = 0` with a base that meets ground. Origin at the footprint centre.
- Roofs `CELL.ROOF`, foliage `CELL.LEAF` (autumn `ROOF`, blossom `LIGHT`), water `CELL.GLASS`,
  purple `CELL.ACCENT` sparingly, lime `CELL.ACCENT2` more sparingly still.
- No people, animals, faces, text, textures, logos.
- A README noting any deliberate cap exceptions.
