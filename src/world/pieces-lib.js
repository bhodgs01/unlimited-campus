/**
 * The piece library. Every building, tower, tree, bench and boat on the campus is one of
 * these functions, built against the Composer in pieces.js (see docs/gpt-campus-brief.md).
 *
 * What is here now is the PLACEHOLDER set: one function per name in the brief, hand-built
 * so the campus reads as a campus before GPT's pieces arrive. `scripts/import-pieces.py`
 * replaces a placeholder by name when the real one lands, and adds anything new before
 * the END PIECES marker.
 */
export default function PIECES(THREE, CELL) {
  const P = Math.PI
  // Shared shorthand for the placeholders (GPT pieces define their own inside each function).
  const H = (c) => ({
    box: (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o),
    cyl: (r, h, cell, o = {}, seg = 14, r2) => c.geom(new THREE.CylinderGeometry(r, r2 == null ? r : r2, h, seg), cell, o),
    cone: (r, h, cell, o = {}, seg = 14) => c.geom(new THREE.ConeGeometry(r, h, seg), cell, o),
    sphere: (r, cell, o = {}, seg = 12) => c.geom(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), cell, o),
    torus: (r, t, cell, o = {}, arc = P * 2, seg = 32) => c.geom(new THREE.TorusGeometry(r, t, 8, seg, arc), cell, o),
    /** A grid of window insets on a wall facing +z (or rotated by ry), with a few lit by seed. */
    windows: (rand, w, h, cols, rows, o = {}, lit = 0.25) => {
      const sx = w / cols
      const sy = h / rows
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const on = rand() < lit
          c.geom(new THREE.BoxGeometry(sx * 0.42, sy * 0.5, 0.04), on ? CELL.GLOW : CELL.STONE_DARK, {
            x: (o.x || 0) + (i - (cols - 1) / 2) * sx * Math.cos(o.ry || 0),
            y: (o.y || 0) + (j - (rows - 1) / 2) * sy + sy * 0.05,
            z: (o.z || 0) + (i - (cols - 1) / 2) * sx * -Math.sin(o.ry || 0),
            ry: o.ry || 0,
            emissive: on ? 0.9 : 0,
          })
        }
    },
    /** A pitched roof over a w x d footprint: two slabs meeting at the ridge along x. */
    pitched: (w, d, rise, cell, o = {}) => {
      const half = d / 2
      const slope = Math.hypot(half, rise)
      const ang = Math.atan2(rise, half)
      const g1 = new THREE.BoxGeometry(w + 0.16, 0.08, slope + 0.1)
      g1.rotateX(-ang)
      g1.translate(0, rise / 2, half / 2)
      c.geom(g1, cell, o)
      const g2 = new THREE.BoxGeometry(w + 0.16, 0.08, slope + 0.1)
      g2.rotateX(ang)
      g2.translate(0, rise / 2, -half / 2)
      c.geom(g2, cell, o)
      // gable ends
      const shape = new THREE.Shape()
      shape.moveTo(-half, 0)
      shape.lineTo(half, 0)
      shape.lineTo(0, rise)
      shape.closePath()
      const gable = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false })
      gable.rotateY(P / 2)
      gable.translate(w / 2, 0, 0)
      c.geom(gable, CELL.STONE, { x: (o.x || 0), y: (o.y || 0), z: (o.z || 0) })
    },
    tower: (r, h, cell, o = {}, seg = 12) => {
      c.geom(new THREE.CylinderGeometry(r, r * 1.05, h, seg), cell, { x: o.x, y: (o.y || 0) + h / 2, z: o.z })
    },
  })

  return {
  // ───────────────────────── Batch A: the six castles ─────────────────────────
  castleperseverance(c, rand) {
    const { box, cyl, cone } = H(c)
    // the crag
    c.geom(new THREE.CylinderGeometry(3.2, 3.9, 1.5, 9), CELL.EARTH, { y: 0.45 })
    c.geom(new THREE.CylinderGeometry(2.6, 3.1, 0.6, 8), CELL.STONE_DARK, { y: 1.45 })
    // slab towers, tallest in the middle
    const towers = [[0, 0, 1.1, 5.2], [-1.6, -0.4, 0.8, 4.0], [1.5, -0.6, 0.8, 4.4], [-0.9, 1.2, 0.7, 3.4], [1.1, 1.1, 0.7, 3.7], [0.2, -1.7, 0.6, 3.0]]
    for (const [x, z, w, h] of towers) {
      box(w, h, w, CELL.STONE, { x, y: 1.75 + h / 2, z, label: h > 5 ? 'Keep' : undefined })
      box(w * 1.08, 0.18, w * 1.08, CELL.STONE_DARK, { x, y: 1.75 + h + 0.05, z })
      // rune strip up the +z face
      box(0.08, h * 0.7, 0.03, CELL.ACCENT, { x, y: 1.75 + h / 2, z: z + w / 2 + 0.02, emissive: 0.7 })
    }
    // switchback stair up the crag on +z
    for (let i = 0; i < 9; i++) box(1.2, 0.12, 0.34, CELL.STONE, { x: (i % 2 ? -1 : 1) * (1.2 - i * 0.1), y: 0.12 + i * 0.18, z: 3.2 - i * 0.28 })
    box(0.6, 0.7, 0.1, CELL.BLACK, { y: 2.05, z: 1.15, label: 'Gate' })
    c.group('banner', { x: 0, y: 6.95, z: 0 })
    cyl(0.04, 1.4, CELL.METAL, { y: 0.7 }, 6)
    box(0.02, 0.5, 0.8, CELL.ACCENT, { y: 1.15, z: 0.4, emissive: 0.4 })
    c.end()
    return { label: 'Castle of Perseverance', kind: 'hero', loop: 5, pose(t, parts) { parts.banner.rotation.y = Math.sin(t * P * 2) * 0.25 } }
  },
  castleeconomic(c, rand) {
    const { box, cyl, cone, torus } = H(c)
    // moat and island
    torus(3.6, 0.45, CELL.GLASS, { y: -0.12, rx: P / 2 }, P * 2, 40)
    c.geom(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 24), CELL.EARTH, { y: 0.15 })
    // curtain walls (a square of four)
    for (const [x, z, w, d] of [[0, -2.4, 4.8, 0.3], [0, 2.4, 4.8, 0.3], [-2.4, 0, 0.3, 4.8], [2.4, 0, 0.3, 4.8]]) box(w, 1.6, d, CELL.STONE, { x, y: 1.1, z })
    // six round towers with conical roofs
    const spots = [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4], [0, -2.4], [0, 2.4]]
    spots.forEach(([x, z], i) => {
      const h = i < 4 ? 2.6 : 2.1
      cyl(0.55, h, CELL.STONE, { x, y: 0.3 + h / 2, z })
      cone(0.68, 1.1, CELL.ROOF, { x, y: 0.3 + h + 0.5, z })
      torus(0.56, 0.03, CELL.ACCENT, { x, y: 0.3 + h * 0.6, z, rx: P / 2, emissive: 0.7 }, P * 2, 20)
    })
    // keep
    box(1.8, 3.2, 1.8, CELL.STONE, { y: 1.9, label: 'Keep' })
    cone(1.35, 1.2, CELL.ROOF, { y: 4.1 }, 4)
    box(0.06, 2.2, 1.0, CELL.ACCENT2, { x: 0.94, y: 2.0, emissive: 0.5 })
    // parterre inside the walls
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) box(0.9, 0.18, 0.9, CELL.LEAF, { x, y: 0.39, z })
    // gate and drawbridge on +z
    box(0.7, 0.9, 0.1, CELL.BLACK, { y: 0.75, z: 2.58, label: 'Gate' })
    c.group('drawbridge', { y: 0.32, z: 2.6 })
    box(0.8, 0.08, 1.3, CELL.WOOD, { y: 0, z: 0.65, label: 'Drawbridge' })
    c.end()
    box(0.9, 0.12, 1.2, CELL.STONE, { y: 0.06, z: 4.1 })
    return { label: 'Castle of Economic Responsibility', kind: 'hero', pose(t, parts) { parts.drawbridge.rotation.x = -(1 - t) * 1.35 } }
  },
  castlecreative(c, rand) {
    const { box, cyl, torus, sphere } = H(c)
    c.geom(new THREE.CylinderGeometry(3.6, 3.6, 0.2, 32), CELL.STONE, { y: 0.1 })
    // maze forecourt: concentric hedge rings with gaps
    for (let r = 1.9; r <= 3.2; r += 0.65) {
      const gap = rand() * P * 2
      torus(r, 0.16, CELL.LEAF, { y: 0.4, rx: P / 2, rz: gap }, P * 1.72, 48)
    }
    // round keep
    cyl(1.35, 2.8, CELL.STONE, { y: 1.6 }, 24)
    box(0.05, 2.4, 0.5, CELL.ACCENT, { x: 1.36, y: 1.6, emissive: 0.6 })
    c.geom(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 24), CELL.STONE_DARK, { y: 3.05 })
    // observatory dome and orrery ring
    c.group('dome', { y: 3.15 })
    c.geom(new THREE.SphereGeometry(1.15, 20, 12, 0, P * 2, 0, P / 2), CELL.GLASS, { label: 'Observatory' })
    box(0.2, 1.2, 0.06, CELL.STONE_DARK, { y: 0.55, z: 1.1 })
    c.end()
    torus(1.7, 0.05, CELL.METAL, { y: 3.9, rx: P / 2, spin: 0.35, label: 'Orrery' }, P * 2, 40)
    sphere(0.14, CELL.ACCENT2, { x: 1.7, y: 3.9, emissive: 0.8 })
    // gatehouse with gears
    box(1.2, 1.2, 0.8, CELL.STONE, { y: 0.8, z: 2.5 })
    box(0.5, 0.7, 0.1, CELL.BLACK, { y: 0.55, z: 2.92, label: 'Gate' })
    torus(0.32, 0.06, CELL.METAL, { x: -0.7, y: 1.6, z: 2.55, spin: 0.8 }, P * 2, 8)
    torus(0.22, 0.06, CELL.METAL, { x: 0.7, y: 1.6, z: 2.55, spin: -1.2 }, P * 2, 8)
    return { label: 'Castle of Creative Problem Solving', kind: 'hero', pose(t, parts) { parts.dome.rotation.y = t * P / 2 } }
  },
  castleteamwork(c, rand) {
    const { box, cyl, cone, torus } = H(c)
    // round-table hall
    cyl(2.4, 1.3, CELL.STONE, { y: 0.65 }, 28)
    c.geom(new THREE.SphereGeometry(2.4, 28, 12, 0, P * 2, 0, P / 2), CELL.ROOF, { y: 1.3, s: 0.85, label: 'Round Table Hall' })
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * P * 2
      box(0.36, 0.7, 0.05, CELL.BLACK, { x: Math.cos(a) * 2.42, y: 0.6, z: Math.sin(a) * 2.42, ry: -a })
    }
    // twin towers
    for (const s of [-1, 1]) {
      cyl(0.7, 4.6, CELL.STONE, { x: s * 2.9, y: 2.3 }, 16)
      cone(0.85, 1.0, CELL.ROOF, { x: s * 2.9, y: 5.1 })
      torus(0.72, 0.03, CELL.ACCENT, { x: s * 2.9, y: 3.3, rx: P / 2, emissive: 0.7 }, P * 2, 20)
      box(0.5, 0.7, 0.1, CELL.BLACK, { x: s * 2.9, y: 0.4, z: 0.72 })
    }
    // covered bridge between the towers
    box(4.6, 0.12, 0.8, CELL.WOOD, { y: 3.6, label: 'Bridge' })
    box(4.6, 0.7, 0.05, CELL.WOOD, { y: 3.95, z: 0.4 })
    box(4.6, 0.7, 0.05, CELL.WOOD, { y: 3.95, z: -0.4 })
    box(4.8, 0.08, 1.1, CELL.ROOF, { y: 4.35 })
    // ring of flags
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * P * 2
      cyl(0.02, 0.8, CELL.METAL, { x: Math.cos(a) * 1.7, y: 3.5, z: Math.sin(a) * 1.7 }, 6)
      box(0.02, 0.22, 0.34, CELL.CLOTH, { x: Math.cos(a) * 1.7, y: 3.8, z: Math.sin(a) * 1.7 + 0.17, ry: -a })
    }
    c.group('gateleft', { x: -0.4, y: 0, z: 2.4 })
    box(0.02, 0.9, 0.4, CELL.WOOD, { y: 0.45, z: 0.2 })
    c.end()
    c.group('gateright', { x: 0.4, y: 0, z: 2.4 })
    box(0.02, 0.9, 0.4, CELL.WOOD, { y: 0.45, z: 0.2 })
    c.end()
    return { label: 'Castle of Teamwork & Mentorship', kind: 'hero', pose(t, parts) { parts.gateleft.rotation.y = t * 1.2; parts.gateright.rotation.y = -t * 1.2 } }
  },
  castlesocial(c, rand) {
    const { box, cyl, cone } = H(c)
    c.geom(new THREE.BoxGeometry(6.4, 0.2, 6.4), CELL.STONE, { y: 0.1 })
    // cloister: four arcaded walkways
    for (const [x, z, w, d, ry] of [[0, -2.8, 6, 0.9, 0], [0, 2.8, 6, 0.9, 0], [-2.8, 0, 0.9, 6, 0], [2.8, 0, 0.9, 6, 0]]) {
      box(w, 0.1, d, CELL.ROOF, { x, y: 1.5, z })
      const n = 7
      for (let i = 0; i < n; i++) {
        const t = (i - (n - 1) / 2) / ((n - 1) / 2)
        const px = w > d ? x + t * (w / 2 - 0.3) : x + (x < 0 ? 0.35 : -0.35)
        const pz = w > d ? z + (z < 0 ? 0.35 : -0.35) : z + t * (d / 2 - 0.3)
        cyl(0.09, 1.3, CELL.STONE, { x: px, y: 0.85, z: pz }, 8)
      }
      box(w, 1.2, d * 0.35, CELL.STONE, { x: w > d ? x : x + (x < 0 ? -0.3 : 0.3), y: 0.8, z: w > d ? z + (z < 0 ? -0.3 : 0.3) : z, ry: w > d ? 0 : P / 2 })
    }
    // courtyard brazier
    cyl(0.4, 0.5, CELL.METAL_DARK, { y: 0.45 }, 10)
    c.geom(new THREE.SphereGeometry(0.28, 10, 8), CELL.GLOW, { y: 0.85, emissive: 1, label: 'Brazier' })
    // bell tower on a corner
    box(0.9, 5.2, 0.9, CELL.STONE, { x: -2.8, y: 2.8, z: -2.8, label: 'Bell Tower' })
    box(0.06, 3.6, 0.5, CELL.ACCENT, { x: -2.33, y: 2.8, z: -2.8, emissive: 0.6 })
    cone(0.7, 0.8, CELL.ROOF, { x: -2.8, y: 5.8, z: -2.8 }, 4)
    c.group('bell', { x: -2.8, y: 5.2, z: -2.8 })
    c.geom(new THREE.CylinderGeometry(0.16, 0.26, 0.34, 10), CELL.METAL, { y: -0.35, label: 'Bell' })
    c.end()
    // wide front steps on +z
    for (let i = 0; i < 4; i++) box(6.4 - i * 0.2, 0.1, 0.4, CELL.STONE, { y: 0.05 + i * 0.1, z: 3.5 - i * 0.4 })
    return { label: 'Castle of Social Impact', kind: 'hero', loop: 3, pose(t, parts) { parts.bell.rotation.z = Math.sin(t * P * 2) * 0.5 } }
  },
  castleenvironmental(c, rand) {
    const { box, cyl, cone, torus } = H(c)
    // stepped terraces with planting
    const tiers = [[6.0, 0.9], [4.6, 0.9], [3.2, 0.9]]
    let y = 0
    tiers.forEach(([w, h], i) => {
      box(w, h, w, CELL.STONE, { y: y + h / 2 })
      box(w - 0.4, 0.14, 0.6, CELL.LEAF, { y: y + h + 0.07, z: w / 2 - 0.5 })
      box(w - 0.4, 0.14, 0.6, CELL.LEAF, { y: y + h + 0.07, z: -w / 2 + 0.5 })
      box(0.6, 0.14, w - 1.6, CELL.LEAF, { y: y + h + 0.07, x: w / 2 - 0.5 })
      y += h
    })
    // living wall on the +z face of the keep
    box(2.4, 2.2, 2.4, CELL.STONE, { y: y + 1.1, label: 'Keep' })
    box(2.3, 2.0, 0.08, CELL.LEAF, { y: y + 1.1, z: 1.24, label: 'Living wall' })
    box(0.06, 1.8, 0.4, CELL.ACCENT, { x: 1.22, y: y + 1.1, emissive: 0.6 })
    // solar panels on the south roof
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BoxGeometry(0.6, 0.04, 0.9)
      g.rotateX(-0.45)
      c.geom(g, CELL.GLASS, { x: -0.8 + i * 0.8, y: y + 2.3, z: 0.4, label: i === 0 ? 'Solar' : undefined })
    }
    // windmill tower on a corner
    cyl(0.4, 3.4, CELL.STONE, { x: -2.2, y: 1.7, z: -2.2 }, 10)
    cone(0.5, 0.6, CELL.ROOF, { x: -2.2, y: 3.7, z: -2.2 })
    c.group('sails', { x: -2.2, y: 3.2, z: -1.75 })
    for (let i = 0; i < 4; i++) box(0.12, 1.5, 0.03, CELL.WOOD, { rz: (i * P) / 2, y: 0, spin: 0 })
    for (let i = 0; i < 4; i++) {
      const g = new THREE.BoxGeometry(0.26, 1.1, 0.02)
      g.translate(0.18, 0.7, 0)
      g.rotateZ((i * P) / 2)
      c.geom(g, CELL.CLOTH)
    }
    c.end()
    // waterwheel into a millrace on the +x side
    box(0.6, 0.2, 2.2, CELL.GLASS, { x: 3.3, y: 0.05 })
    torus(0.7, 0.08, CELL.WOOD, { x: 3.3, y: 0.7, ry: P / 2, spin: 0.9, spinAxis: 'x', label: 'Waterwheel' }, P * 2, 16)
    // cistern
    cyl(0.4, 0.7, CELL.METAL_DARK, { x: 2.2, y: y + 0.35, z: -2.2 }, 12)
    return { label: 'Castle of Environmental Sustainability', kind: 'hero', loop: 8, pose(t, parts) { parts.sails.rotation.z = t * P * 2 } }
  },

  // ───────────────────────── Batch B: the heart of campus ─────────────────────────
  greathall(c, rand) {
    const { box, cyl, windows, pitched } = H(c)
    // steps the full width of the front
    for (let i = 0; i < 5; i++) box(7.6 - i * 0.1, 0.1, 0.45, CELL.STONE, { y: 0.05 + i * 0.1, z: 3.4 - i * 0.45 })
    box(7.6, 0.5, 5.4, CELL.STONE, { y: 0.25, z: -0.3 })
    // the hall
    box(7.0, 2.6, 4.2, CELL.STONE, { y: 1.8, z: -0.6, label: 'Great Hall' })
    windows(rand, 6.4, 1.6, 7, 2, { y: 1.8, z: 1.52 }, 0.3)
    windows(rand, 4.0, 1.6, 4, 2, { x: -3.52, y: 1.8, z: -0.6, ry: P / 2 }, 0.3)
    windows(rand, 4.0, 1.6, 4, 2, { x: 3.52, y: 1.8, z: -0.6, ry: -P / 2 }, 0.3)
    // portico of six columns and a pediment
    for (let i = 0; i < 6; i++) cyl(0.18, 2.4, CELL.LIGHT, { x: -2.75 + i * 1.1, y: 1.7, z: 2.3 }, 12)
    box(6.8, 0.3, 1.6, CELL.STONE, { y: 3.05, z: 1.9 })
    const shape = new THREE.Shape()
    shape.moveTo(-3.5, 0); shape.lineTo(3.5, 0); shape.lineTo(0, 1.2); shape.closePath()
    const ped = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false })
    c.geom(ped, CELL.LIGHT, { y: 3.2, z: 2.5, label: 'Portico' })
    pitched(7.0, 4.4, 1.3, CELL.ROOF, { y: 3.1, z: -0.6 })
    // cupola
    cyl(0.6, 0.7, CELL.GLASS, { y: 4.7, z: -0.6 }, 12)
    cyl(0.45, 0.5, CELL.GLOW, { y: 4.7, z: -0.6, emissive: 1 }, 10)
    c.geom(new THREE.ConeGeometry(0.75, 0.6, 12), CELL.ROOF, { y: 5.3, z: -0.6, label: 'Cupola' })
    // doors and accent strips
    c.group('doors', { y: 0.5, z: 1.55 })
    box(0.5, 1.5, 0.06, CELL.WOOD, { x: -0.27, y: 0.75 })
    box(0.5, 1.5, 0.06, CELL.WOOD, { x: 0.27, y: 0.75 })
    c.end()
    box(0.08, 1.7, 0.05, CELL.ACCENT, { x: -0.7, y: 1.3, z: 1.56, emissive: 0.6 })
    box(0.08, 1.7, 0.05, CELL.ACCENT, { x: 0.7, y: 1.3, z: 1.56, emissive: 0.6 })
    return { label: 'Great Hall', kind: 'hero', pose(t, parts) { parts.doors.children[0].rotation.y = t * 1.3; parts.doors.children[1].rotation.y = -t * 1.3 } }
  },
  amphitheater(c, rand) {
    const { box, cyl, torus } = H(c)
    // eight half-ring tiers rising away from the stage; the open side faces +z
    const tier = (rIn, rOut, h) => {
      const s = new THREE.Shape()
      s.absarc(0, 0, rOut, 0, P, false)
      s.absarc(0, 0, rIn, P, 0, true)
      const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false })
      g.rotateX(P / 2) // lay flat: shape y -> -z, so the bowl opens toward -z; flip below
      g.rotateY(P)
      return g
    }
    for (let i = 0; i < 8; i++) {
      const rIn = 1.6 + i * 0.5
      const h = 0.24 * (i + 1)
      c.geom(tier(rIn, rIn + 0.5, h), i % 2 ? CELL.STONE : CELL.STONE_DARK, { y: h, label: i === 7 ? 'Top tier' : undefined })
    }
    // stage: a half disc at the open side, and a low back wall
    c.geom(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 32, 1, false, 0, P), CELL.STONE, { y: 0.15, ry: -P / 2, label: 'Stage' })
    box(3.4, 0.3, 0.9, CELL.STONE, { y: 0.15, z: 0.45 })
    // ramps down the straight edge, top rail and rim lamps
    for (const s of [-1, 1]) {
      const r = new THREE.BoxGeometry(0.8, 0.06, 4.0)
      r.rotateX(0.42)
      c.geom(r, CELL.STONE, { x: s * 5.6, y: 1.0, z: 0.9 })
    }
    torus(5.35, 0.03, CELL.METAL, { y: 2.0, rx: P / 2, rz: 0, ry: 0 }, P, 40)
    for (let i = 0; i < 4; i++) {
      const a = P * (0.12 + i * 0.25)
      cyl(0.04, 1.2, CELL.METAL_DARK, { x: Math.cos(a) * 5.3, y: 2.5, z: -Math.sin(a) * 5.3 }, 6)
      c.geom(new THREE.SphereGeometry(0.12, 8, 6), CELL.GLOW, { x: Math.cos(a) * 5.3, y: 3.15, z: -Math.sin(a) * 5.3, emissive: 1 })
    }
    return { label: 'Amphitheater', kind: 'hero' }
  },
  centralbeacon(c, rand) {
    const { box, torus, cyl } = H(c)
    for (let i = 0; i < 3; i++) box(2.2 - i * 0.5, 0.2, 2.2 - i * 0.5, CELL.STONE, { y: 0.1 + i * 0.2 })
    c.geom(new THREE.CylinderGeometry(0.16, 0.34, 5.2, 4), CELL.STONE, { y: 3.2, label: 'Obelisk' })
    torus(0.7, 0.05, CELL.ACCENT, { y: 5.2, rx: P / 2, spin: 0.6, emissive: 0.9 }, P * 2, 24)
    c.geom(new THREE.ConeGeometry(0.2, 0.5, 4), CELL.GLOW, { y: 6.05, emissive: 1, label: 'Beacon' })
    return { label: 'Campus Beacon', kind: 'landmark' }
  },
  grandfountain(c, rand) {
    const { cyl, torus } = H(c)
    cyl(2.2, 0.5, CELL.STONE, { y: 0.25 }, 32, 2.3)
    cyl(2.0, 0.1, CELL.GLASS, { y: 0.52 }, 32)
    cyl(1.3, 0.4, CELL.STONE, { y: 0.9 }, 24, 1.1)
    cyl(1.2, 0.08, CELL.GLASS, { y: 1.12 }, 24)
    cyl(0.6, 0.35, CELL.STONE, { y: 1.5 }, 16, 0.5)
    cyl(0.55, 0.08, CELL.GLASS, { y: 1.68 }, 16)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * P * 2
      c.geom(new THREE.SphereGeometry(0.1, 8, 6), CELL.GLOW, { x: Math.cos(a) * 1.6, y: 0.55, z: Math.sin(a) * 1.6, emissive: 1 })
    }
    c.group('spire', { y: 1.7 })
    cyl(0.06, 1.0, CELL.METAL, { y: 0.5 }, 8)
    c.geom(new THREE.SphereGeometry(0.16, 10, 8), CELL.ACCENT, { y: 1.05, emissive: 0.8 })
    c.end()
    return { label: 'Grand Fountain', kind: 'hero', loop: 12, pose(t, parts) { parts.spire.rotation.y = t * P * 2 } }
  },
  ringpavilion(c, rand) {
    const { cyl, cone, torus } = H(c)
    cyl(1.6, 0.16, CELL.STONE, { y: 0.08 }, 8)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * P * 2 + P / 8
      cyl(0.07, 1.8, CELL.STONE, { x: Math.cos(a) * 1.3, y: 1.05, z: Math.sin(a) * 1.3 }, 8)
    }
    cone(1.8, 0.7, CELL.ROOF, { y: 2.3 }, 8)
    torus(0.9, 0.12, CELL.WOOD, { y: 0.4, rx: P / 2 }, P * 2, 8)
    c.geom(new THREE.SphereGeometry(0.12, 8, 6), CELL.GLOW, { y: 1.75, emissive: 1 })
    return { label: 'Pavilion', kind: 'landmark' }
  },
  welcomegate(c, rand) {
    const { box, cyl, torus } = H(c)
    for (const s of [-1, 1]) {
      box(0.6, 2.6, 0.6, CELL.STONE, { x: s * 1.4, y: 1.3 })
      box(0.7, 0.2, 0.7, CELL.STONE_DARK, { x: s * 1.4, y: 2.7 })
      box(2.0, 0.6, 0.12, CELL.STONE, { x: s * 3.4, y: 0.3 })
      for (let i = 0; i < 6; i++) cyl(0.03, 0.6, CELL.METAL_DARK, { x: s * (2.6 + i * 0.32), y: 0.9 }, 6)
      cyl(0.04, 3.4, CELL.METAL, { x: s * 1.4, y: 4.4 }, 6)
      box(0.02, 0.5, 0.7, CELL.CLOTH, { x: s * 1.4, y: 5.7, z: 0.35 })
    }
    torus(1.7, 0.16, CELL.STONE, { y: 2.6, rx: 0 }, P, 24)
    torus(1.7, 0.03, CELL.ACCENT, { y: 2.6, z: 0.17, emissive: 0.9 }, P, 24)
    return { label: 'Welcome Gate', kind: 'landmark' }
  },

  // ───────────────────────── Batch C: campus buildings ─────────────────────────
  dormblock(c, rand) {
    const { box, windows } = H(c)
    const balconies = rand() < 0.5
    box(4.6, 0.1, 2.4, CELL.STONE_DARK, { y: 0.05 })
    box(4.5, 1.9, 2.2, CELL.STONE, { y: 1.05, label: 'Residence' })
    box(4.6, 0.12, 2.3, CELL.STONE_DARK, { y: 2.05 })
    windows(rand, 4.0, 1.5, 6, 3, { y: 1.05, z: 1.11 }, 0.3)
    windows(rand, 4.0, 1.5, 6, 3, { y: 1.05, z: -1.11, ry: P }, 0.2)
    if (balconies) for (let j = 0; j < 2; j++) box(4.2, 0.05, 0.3, CELL.METAL_DARK, { y: 0.75 + j * 0.62, z: 1.25 })
    box(0.5, 0.7, 0.05, CELL.WOOD, { y: 0.4, z: 1.12 })
    box(1.2, 0.2, 0.8, CELL.LEAF, { x: 1.2, y: 2.2, z: -0.3 })
    return { label: 'Residence', kind: 'landmark' }
  },
  courtyardhouse(c, rand) {
    const { box, windows, pitched } = H(c)
    const wings = [[0, -1.5, 4.6, 1.4], [-1.6, 0.3, 1.4, 2.4], [1.6, 0.3, 1.4, 2.4]]
    wings.forEach(([x, z, w, d], i) => {
      box(w, 1.3, d, CELL.STONE, { x, y: 0.65, z, label: i === 0 ? 'Courtyard House' : undefined })
      pitched(w, d, 0.55, CELL.ROOF, { x, y: 1.3, z })
      if (i === 0) windows(rand, w - 0.6, 1.0, 6, 2, { x, y: 0.7, z: z + d / 2 + 0.01 }, 0.3)
    })
    // courtyard tree and door
    c.geom(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), CELL.WOOD, { y: 0.3, z: 0.5 })
    c.geom(new THREE.SphereGeometry(0.5, 10, 8), CELL.LEAF, { y: 0.9, z: 0.5 })
    box(0.5, 0.7, 0.05, CELL.WOOD, { y: 0.35, z: -0.78 })
    box(0.3, 0.4, 0.3, CELL.STONE_DARK, { x: -1.8, y: 2.0, z: -1.5 })
    return { label: 'Courtyard House', kind: 'landmark' }
  },
  lecturehall(c, rand) {
    const { box, cyl, windows, pitched } = H(c)
    box(4.2, 0.1, 3.2, CELL.STONE_DARK, { y: 0.05 })
    box(4.0, 1.7, 3.0, CELL.STONE, { y: 0.95, label: 'Lecture Hall' })
    pitched(4.0, 3.0, 1.2, CELL.ROOF, { y: 1.8 })
    box(3.0, 0.2, 0.3, CELL.GLASS, { y: 2.95, z: 0.1 })
    for (let i = 0; i < 4; i++) cyl(0.1, 1.6, CELL.LIGHT, { x: -0.9 + i * 0.6, y: 0.9, z: 1.7 }, 8)
    box(2.4, 0.16, 0.8, CELL.STONE, { y: 1.75, z: 1.6 })
    windows(rand, 2.6, 1.0, 3, 1, { x: -2.01, y: 1.0, ry: P / 2 }, 0.3)
    box(0.6, 0.8, 0.05, CELL.WOOD, { y: 0.4, z: 1.51 })
    return { label: 'Lecture Hall', kind: 'landmark' }
  },
  library(c, rand) {
    const { box, cyl, windows } = H(c)
    box(4.8, 0.2, 2.8, CELL.STONE, { y: 0.1 })
    box(4.6, 2.0, 2.6, CELL.STONE, { y: 1.2, label: 'Library' })
    for (let i = 0; i < 6; i++) {
      const x = -2.0 + i * 0.8
      box(0.34, 1.2, 0.05, CELL.GLASS, { x, y: 1.2, z: 1.31 })
      box(0.34, 1.2, 0.05, CELL.GLASS, { x, y: 1.2, z: -1.31 })
    }
    box(4.7, 0.15, 2.7, CELL.STONE_DARK, { y: 2.25 })
    cyl(0.9, 0.5, CELL.STONE, { y: 2.55 }, 20)
    c.geom(new THREE.SphereGeometry(0.95, 20, 12, 0, P * 2, 0, P / 2), CELL.ROOF, { y: 2.8, label: 'Dome' })
    c.geom(new THREE.SphereGeometry(0.16, 8, 6), CELL.GLOW, { y: 3.85, emissive: 1 })
    for (let i = 0; i < 3; i++) box(2.0, 0.08, 0.3, CELL.STONE, { y: 0.04 + i * 0.08, z: 1.6 - i * 0.3 })
    box(0.7, 0.9, 0.05, CELL.WOOD, { y: 0.65, z: 1.31 })
    return { label: 'Library', kind: 'landmark' }
  },
  sciencelab(c, rand) {
    const { box, cyl } = H(c)
    box(4.0, 0.6, 2.8, CELL.STONE, { y: 0.3 })
    box(3.8, 2.0, 2.6, CELL.GLASS, { y: 1.6, label: 'Laboratory' })
    for (let i = 0; i < 5; i++) box(0.08, 2.0, 2.66, CELL.METAL, { x: -1.8 + i * 0.9, y: 1.6 })
    for (let j = 0; j < 3; j++) box(3.86, 0.08, 2.66, CELL.METAL, { y: 0.9 + j * 0.65 })
    box(1.2, 0.6, 1.0, CELL.METAL_DARK, { x: 1.0, y: 2.9, z: -0.5 })
    c.group('dish', { x: -1.0, y: 2.7, z: -0.4 })
    cyl(0.05, 0.6, CELL.METAL, { y: 0.3 }, 6)
    c.geom(new THREE.SphereGeometry(0.4, 12, 8, 0, P * 2, 0, P / 2.6), CELL.LIGHT, { y: 0.75, rx: P * 0.75, spin: 0.2, spinAxis: 'y' })
    c.end()
    box(0.6, 0.8, 0.05, CELL.WOOD, { y: 1.0, z: 1.31 })
    return { label: 'Science Lab', kind: 'landmark' }
  },
  fieldhouse(c, rand) {
    const { box, cyl } = H(c)
    box(4.8, 1.4, 3.0, CELL.STONE, { y: 0.7, label: 'Field House' })
    const g = new THREE.CylinderGeometry(1.5, 1.5, 4.8, 24, 1, false, 0, P)
    g.rotateZ(P / 2)
    c.geom(g, CELL.ROOF, { y: 1.4 })
    box(1.2, 1.0, 0.06, CELL.WOOD, { y: 0.5, z: 1.51 })
    for (let i = 0; i < 5; i++) box(0.5, 0.3, 0.04, CELL.GLASS, { x: -1.8 + i * 0.9, y: 1.2, z: 1.51 })
    cyl(0.05, 2.6, CELL.METAL, { x: 2.6, y: 1.3, z: 1.6 }, 6)
    box(0.5, 0.3, 0.2, CELL.GLOW, { x: 2.6, y: 2.7, z: 1.6, emissive: 0.7 })
    return { label: 'Field House', kind: 'landmark' }
  },
  clocktower(c, rand) {
    const { box, cyl, cone } = H(c)
    box(1.3, 0.3, 1.3, CELL.STONE_DARK, { y: 0.15 })
    box(1.0, 4.4, 1.0, CELL.STONE, { y: 2.5, label: 'Clock Tower' })
    box(1.1, 0.12, 1.1, CELL.ACCENT, { y: 3.9, emissive: 0.6 })
    for (let i = 0; i < 4; i++) {
      const a = (i * P) / 2
      const x = Math.sin(a) * 0.52
      const z = Math.cos(a) * 0.52
      c.geom(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 20), CELL.LIGHT, { x, y: 4.4, z, rx: P / 2, ry: a })
      c.geom(new THREE.BoxGeometry(0.04, 0.26, 0.02), CELL.METAL_DARK, { x, y: 4.5, z: z + (i === 0 ? 0.03 : 0), ry: a })
      c.geom(new THREE.BoxGeometry(0.04, 0.2, 0.02), CELL.METAL_DARK, { x, y: 4.4, z, ry: a, rz: 1.2, spin: 0.05, spinAxis: 'z' })
    }
    cone(0.9, 0.9, CELL.ROOF, { y: 5.15 }, 4)
    box(0.5, 0.7, 0.05, CELL.WOOD, { y: 0.65, z: 0.51 })
    return { label: 'Clock Tower', kind: 'landmark' }
  },
  greenhouse(c, rand) {
    const { box, cyl, pitched } = H(c)
    box(3.4, 0.4, 2.0, CELL.STONE_DARK, { y: 0.2 })
    box(3.3, 1.1, 1.9, CELL.GLASS, { y: 0.95, label: 'Greenhouse' })
    for (let i = 0; i < 6; i++) box(0.05, 1.1, 1.92, CELL.METAL, { x: -1.5 + i * 0.6, y: 0.95 })
    const g1 = new THREE.BoxGeometry(3.4, 0.04, 1.15); g1.rotateX(-0.55); g1.translate(0, 0.32, 0.5)
    c.geom(g1, CELL.GLASS, { y: 1.5 })
    const g2 = new THREE.BoxGeometry(3.4, 0.04, 1.15); g2.rotateX(0.55); g2.translate(0, 0.32, -0.5)
    c.geom(g2, CELL.GLASS, { y: 1.5 })
    for (let i = 0; i < 3; i++) box(0.9, 0.3, 1.3, CELL.LEAF, { x: -1.0 + i * 1.0, y: 0.55 })
    cyl(0.12, 1.4, CELL.STONE_DARK, { x: -1.5, y: 1.4, z: -0.8 }, 8)
    return { label: 'Greenhouse', kind: 'landmark' }
  },
  cafepavilion(c, rand) {
    const { box, cyl } = H(c)
    box(4.0, 0.12, 3.0, CELL.STONE, { y: 0.06 })
    for (const x of [-1.8, 0, 1.8]) for (const z of [-1.3, 1.3]) cyl(0.07, 1.6, CELL.METAL, { x, y: 0.9, z }, 8)
    box(4.6, 0.1, 3.6, CELL.ROOF, { y: 1.75, label: 'Cafe' })
    box(1.6, 0.8, 0.6, CELL.WOOD, { x: -1.0, y: 0.5, z: -0.9 })
    for (let i = 0; i < 4; i++) {
      const x = 0.4 + (i % 2) * 1.2
      const z = -0.4 + Math.floor(i / 2) * 1.2
      cyl(0.32, 0.05, CELL.WOOD, { x, y: 0.62, z }, 12)
      cyl(0.04, 0.6, CELL.METAL_DARK, { x, y: 0.3, z }, 6)
      for (let k = 0; k < 3; k++) cyl(0.09, 0.04, CELL.WOOD, { x: x + Math.cos(k * 2.1) * 0.5, y: 0.35, z: z + Math.sin(k * 2.1) * 0.5 }, 8)
    }
    for (let i = 0; i < 5; i++) c.geom(new THREE.SphereGeometry(0.06, 6, 5), CELL.GLOW, { x: -1.6 + i * 0.8, y: 1.55, z: 1.5, emissive: 1 })
    return { label: 'Campus Cafe', kind: 'landmark' }
  },
  studiohall(c, rand) {
    const { box } = H(c)
    box(4.2, 1.5, 3.0, CELL.STONE, { y: 0.75, label: 'Studio' })
    for (let i = 0; i < 3; i++) {
      const x = -1.4 + i * 1.4
      const s = new THREE.Shape(); s.moveTo(-0.7, 0); s.lineTo(0.7, 0); s.lineTo(0.7, 0.8); s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth: 3.0, bevelEnabled: false }); g.translate(0, 0, -1.5)
      c.geom(g, CELL.ROOF, { x, y: 1.5 })
      box(0.06, 0.8, 3.0, CELL.GLASS, { x: x + 0.7, y: 1.9 })
    }
    box(4.3, 0.08, 0.06, CELL.ACCENT2, { y: 1.48, z: 1.52, emissive: 0.5 })
    box(1.4, 1.1, 0.05, CELL.METAL_DARK, { x: -0.8, y: 0.55, z: 1.51 })
    return { label: 'Studio Hall', kind: 'landmark' }
  },
  boathouse(c, rand) {
    const { box, cyl, pitched } = H(c)
    box(2.6, 1.3, 2.4, CELL.WOOD, { y: 0.65, z: -0.4, label: 'Boathouse' })
    box(2.0, 1.1, 0.1, CELL.BLACK, { y: 0.6, z: 0.82 })
    pitched(2.6, 2.4, 0.8, CELL.ROOF, { y: 1.3, z: -0.4 })
    const ramp = new THREE.BoxGeometry(2.0, 0.06, 2.0); ramp.rotateX(0.15)
    c.geom(ramp, CELL.WOOD, { y: -0.1, z: 1.7 })
    box(1.0, 0.25, 0.4, CELL.WOOD, { y: 0.15, z: 0.3 })
    cyl(0.16, 0.16, CELL.RED, { x: 1.2, y: 0.9, z: 0.86, rx: P / 2 }, 12)
    return { label: 'Boathouse', kind: 'landmark' }
  },
  observatory(c, rand) {
    const { box, cyl, torus } = H(c)
    cyl(1.3, 1.6, CELL.STONE, { y: 0.8, label: 'Observatory' }, 20)
    box(2.0, 0.1, 1.2, CELL.STONE, { x: 1.6, y: 1.55, z: 0 })
    torus(1.0, 0.02, CELL.METAL, { x: 1.6, y: 1.9, z: 0, rx: P / 2 }, P, 12)
    c.group('dome', { y: 1.6 })
    c.geom(new THREE.SphereGeometry(1.25, 20, 12, 0, P * 2, 0, P / 2), CELL.LIGHT, { label: 'Dome' })
    box(0.3, 1.3, 0.06, CELL.STONE_DARK, { y: 0.6, z: 1.2 })
    c.end()
    box(0.5, 0.7, 0.05, CELL.WOOD, { y: 0.35, z: 1.31 })
    return { label: 'Observatory', kind: 'landmark', pose(t, parts) { parts.dome.rotation.y = t * P } }
  },
  mentorshall(c, rand) {
    const { cyl, box, torus } = H(c)
    cyl(2.6, 0.3, CELL.STONE, { y: 0.15 }, 28)
    cyl(2.3, 2.0, CELL.STONE, { y: 1.3, label: 'Hall of Mentors' }, 28)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * P * 2
      box(0.28, 2.0, 0.2, CELL.LIGHT, { x: Math.cos(a) * 2.35, y: 1.3, z: Math.sin(a) * 2.35, ry: -a })
      c.geom(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12), CELL.ACCENT2, { x: Math.cos(a + P / 12) * 2.36, y: 1.9, z: Math.sin(a + P / 12) * 2.36, rx: P / 2, ry: -a - P / 12, emissive: 0.6 })
    }
    c.geom(new THREE.SphereGeometry(2.3, 28, 12, 0, P * 2, 0, P / 2), CELL.ROOF, { y: 2.3, s: 0.6 })
    c.geom(new THREE.SphereGeometry(0.18, 8, 6), CELL.GLOW, { y: 3.75, emissive: 1 })
    box(1.0, 1.4, 0.1, CELL.BLACK, { y: 0.9, z: 2.3 })
    for (let i = 0; i < 3; i++) box(2.2, 0.1, 0.3, CELL.STONE, { y: 0.05 + i * 0.1, z: 3.0 - i * 0.3 })
    return { label: 'Hall of Mentors', kind: 'landmark' }
  },

  // ───────────────────────── Batch D: grounds furniture ─────────────────────────
  campustree(c, rand) {
    const { cyl, sphere } = H(c)
    const yaw = rand() * P * 2
    cyl(0.08, 0.9, CELL.WOOD, { y: 0.45 }, 7, 0.11)
    sphere(0.62, CELL.LEAF, { y: 1.35 })
    sphere(0.48, CELL.LEAF, { x: Math.cos(yaw) * 0.4, y: 1.55, z: Math.sin(yaw) * 0.4 })
    sphere(0.42, CELL.LEAF, { x: -Math.cos(yaw) * 0.35, y: 1.15, z: -Math.sin(yaw) * 0.35 })
    return { label: 'Tree', kind: 'landmark' }
  },
  campustreetall(c, rand) {
    const { cyl } = H(c)
    cyl(0.06, 0.5, CELL.WOOD, { y: 0.25 }, 6)
    const g = new THREE.SphereGeometry(0.35, 8, 10); g.scale(1, 3.2, 1)
    c.geom(g, CELL.LEAF, { y: 1.5, ry: rand() * 3 })
    return { label: 'Cypress', kind: 'landmark' }
  },
  campustreeflat(c, rand) {
    const { cyl, sphere } = H(c)
    cyl(0.1, 0.7, CELL.WOOD, { y: 0.35 }, 7, 0.14)
    const a = rand() * P * 2
    cyl(0.05, 0.6, CELL.WOOD, { x: Math.cos(a) * 0.25, y: 0.85, z: Math.sin(a) * 0.25, rz: 0.6 }, 5)
    const g = new THREE.SphereGeometry(1.2, 12, 8); g.scale(1, 0.45, 1)
    c.geom(g, CELL.LEAF, { y: 1.25 })
    const g2 = new THREE.SphereGeometry(0.8, 10, 7); g2.scale(1, 0.5, 1)
    c.geom(g2, CELL.LEAF, { x: Math.cos(a) * 0.5, y: 1.5, z: Math.sin(a) * 0.5 })
    return { label: 'Parkland Tree', kind: 'landmark' }
  },
  hedgestraight(c, rand) {
    c.geom(new THREE.BoxGeometry(1.0, 0.7, 0.5), CELL.LEAF, { y: 0.35 })
    return { label: 'Hedge', kind: 'landmark' }
  },
  hedgecorner(c, rand) {
    c.geom(new THREE.BoxGeometry(0.5, 0.7, 0.5), CELL.LEAF, { x: 0.25, y: 0.35 })
    c.geom(new THREE.BoxGeometry(0.5, 0.7, 0.5), CELL.LEAF, { y: 0.35, z: 0.25 })
    return { label: 'Hedge corner', kind: 'landmark' }
  },
  hedgering(c, rand) {
    const { torus, sphere } = H(c)
    torus(1.3, 0.25, CELL.LEAF, { y: 0.35, rx: P / 2, rz: P / 2 + 0.2 }, P * 1.85, 40)
    c.geom(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 24), CELL.EARTH, { y: 0.05 })
    for (let i = 0; i < 4; i++) sphere(0.28, CELL.LEAF, { x: Math.cos(i * 1.57) * 0.55, y: 0.3, z: Math.sin(i * 1.57) * 0.55 })
    return { label: 'Parterre ring', kind: 'landmark' }
  },
  gardenparterre(c, rand) {
    const { box, cyl } = H(c)
    box(3.0, 0.06, 3.0, CELL.EARTH, { y: 0.03 })
    for (const [x, z] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) box(1.2, 0.22, 1.2, CELL.LEAF, { x, y: 0.15, z })
    cyl(0.15, 0.5, CELL.STONE, { y: 0.3 }, 10, 0.2)
    c.geom(new THREE.SphereGeometry(0.2, 10, 8), CELL.LEAF, { y: 0.7 })
    return { label: 'Parterre', kind: 'landmark' }
  },
  lamppost(c, rand) {
    const { cyl, box } = H(c)
    cyl(0.05, 1.4, CELL.METAL_DARK, { y: 0.7 }, 8, 0.08)
    box(0.4, 0.04, 0.04, CELL.METAL_DARK, { x: 0.2, y: 1.4 })
    c.geom(new THREE.SphereGeometry(0.11, 8, 6), CELL.GLOW, { x: 0.38, y: 1.36, emissive: 0.9 })
    return { label: 'Lamp', kind: 'landmark' }
  },
  parkbench(c, rand) {
    const { box } = H(c)
    for (const x of [-0.42, 0.42]) box(0.06, 0.25, 0.4, CELL.METAL_DARK, { x, y: 0.125 })
    for (let i = 0; i < 3; i++) box(1.0, 0.03, 0.1, CELL.WOOD, { y: 0.26, z: -0.14 + i * 0.14 })
    for (let i = 0; i < 2; i++) box(1.0, 0.03, 0.08, CELL.WOOD, { y: 0.4 + i * 0.12, z: -0.2 })
    return { label: 'Bench', kind: 'landmark' }
  },
  bikerack(c, rand) {
    const { box, torus } = H(c)
    box(1.4, 0.04, 0.3, CELL.METAL_DARK, { y: 0.02 })
    for (let i = 0; i < 5; i++) torus(0.18, 0.02, CELL.METAL, { x: -0.56 + i * 0.28, y: 0.2, ry: P / 2 }, P, 10)
    return { label: 'Bike rack', kind: 'landmark' }
  },
  flagpole(c, rand) {
    const { cyl, box } = H(c)
    cyl(0.12, 0.1, CELL.STONE, { y: 0.05 }, 8)
    cyl(0.025, 2.4, CELL.METAL, { y: 1.2 }, 6)
    c.group('banner', { y: 2.3 })
    box(0.02, 0.4, 0.7, CELL.ACCENT, { y: -0.2, z: 0.35, emissive: 0.4 })
    box(0.02, 0.2, 0.4, CELL.ACCENT2, { y: -0.6, z: 0.2, emissive: 0.3 })
    c.end()
    return { label: 'Flagpole', kind: 'landmark', loop: 4, pose(t, parts) { parts.banner.rotation.y = Math.sin(t * P * 2) * 0.35 } }
  },
  signpost(c, rand) {
    const { cyl, box } = H(c)
    cyl(0.04, 1.6, CELL.WOOD, { y: 0.8 }, 6)
    for (let i = 0; i < 3; i++) box(0.5, 0.12, 0.03, CELL.WOOD, { x: 0.22, y: 1.5 - i * 0.18, ry: i * 1.1 })
    box(0.02, 0.4, 0.03, CELL.ACCENT, { y: 1.3, emissive: 0.5 })
    return { label: 'Signpost', kind: 'landmark' }
  },
  soccergoal(c, rand) {
    const { box } = H(c)
    box(0.03, 0.55, 0.03, CELL.METAL, { x: -0.7, y: 0.275 })
    box(0.03, 0.55, 0.03, CELL.METAL, { x: 0.7, y: 0.275 })
    box(1.43, 0.03, 0.03, CELL.METAL, { y: 0.55 })
    for (let i = 0; i < 3; i++) box(1.4, 0.01, 0.01, CELL.LIGHT, { y: 0.15 + i * 0.15, z: -0.2 - i * 0.05 })
    return { label: 'Goal', kind: 'landmark' }
  },
  bleacher(c, rand) {
    const { box } = H(c)
    for (let i = 0; i < 4; i++) {
      box(2.5, 0.05, 0.3, CELL.WOOD, { y: 0.2 + i * 0.22, z: -i * 0.3 })
      box(2.5, 0.2, 0.05, CELL.METAL_DARK, { y: 0.1 + i * 0.22, z: 0.15 - i * 0.3 })
    }
    box(2.5, 0.04, 0.04, CELL.METAL, { y: 1.3, z: -0.95 })
    return { label: 'Bleacher', kind: 'landmark' }
  },
  floodlight(c, rand) {
    const { cyl, box } = H(c)
    cyl(0.05, 3.0, CELL.METAL, { y: 1.5 }, 6, 0.08)
    box(0.7, 0.4, 0.1, CELL.METAL_DARK, { y: 3.0, rx: 0.4 })
    for (let i = 0; i < 6; i++) box(0.18, 0.15, 0.02, CELL.GLOW, { x: -0.22 + (i % 3) * 0.22, y: 2.93 + Math.floor(i / 3) * 0.17, z: 0.06, rx: 0.4, emissive: 0.6 })
    return { label: 'Floodlight', kind: 'landmark' }
  },
  sailboat(c, rand) {
    const { box, cyl } = H(c)
    c.group('hull', { y: 0 })
    const g = new THREE.CylinderGeometry(0.28, 0.14, 1.8, 8, 1, false); g.rotateZ(P / 2); g.scale(1, 0.6, 1)
    c.geom(g, CELL.WOOD, { y: 0.14, label: 'Hull' })
    cyl(0.025, 1.6, CELL.WOOD, { y: 0.95, x: 0.1 }, 6)
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.7, 0); s.lineTo(0, 1.3); s.closePath()
    c.geom(new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), CELL.LIGHT, { x: -0.6, y: 0.35, z: 0 , ry: P / 2 })
    const j = new THREE.Shape(); j.moveTo(0, 0); j.lineTo(-0.5, 0); j.lineTo(0, 1.0); j.closePath()
    c.geom(new THREE.ExtrudeGeometry(j, { depth: 0.01, bevelEnabled: false }), CELL.CLOTH, { x: 0.12, y: 0.35, z: 0, ry: P / 2 })
    box(0.4, 0.03, 0.03, CELL.WOOD, { x: -0.7, y: 0.3 })
    c.end()
    return { label: 'Sailboat', kind: 'landmark', loop: 6, pose(t, parts) { parts.hull.rotation.z = Math.sin(t * P * 2) * 0.06; parts.hull.rotation.x = Math.cos(t * P * 2) * 0.03 } }
  },
  rowboat(c, rand) {
    const { box } = H(c)
    const g = new THREE.CylinderGeometry(0.2, 0.1, 1.2, 8); g.rotateZ(P / 2); g.scale(1, 0.5, 1)
    c.geom(g, CELL.WOOD, { y: 0.1 })
    for (const x of [-0.25, 0.25]) box(0.05, 0.03, 0.34, CELL.WOOD, { x, y: 0.18 })
    box(1.0, 0.02, 0.02, CELL.WOOD, { y: 0.2, z: 0.16, ry: 0.15 })
    return { label: 'Rowboat', kind: 'landmark' }
  },
  pier(c, rand) {
    const { box, cyl } = H(c)
    box(1.0, 0.06, 3.0, CELL.WOOD, { y: 0.25 })
    for (const z of [-1.3, -0.4, 0.5, 1.4]) for (const x of [-0.4, 0.4]) cyl(0.05, 0.6, CELL.WOOD, { x, y: 0, z }, 6)
    cyl(0.06, 0.4, CELL.METAL_DARK, { x: 0.4, y: 0.45, z: 1.3 }, 8)
    cyl(0.14, 0.14, CELL.RED, { x: -0.5, y: 0.7, z: 0.6, ry: P / 2, rx: P / 2 }, 12)
    return { label: 'Pier', kind: 'landmark' }
  },
  footbridge(c, rand) {
    const { box } = H(c)
    for (let i = 0; i < 9; i++) {
      const t = (i - 4) / 4
      const y = 0.3 * (1 - t * t)
      box(0.5, 0.08, 1.2, CELL.STONE, { x: (i - 4) * 0.48, y: y + 0.04, rz: -t * 0.16 })
      box(0.5, 0.25, 0.06, CELL.STONE, { x: (i - 4) * 0.48, y: y + 0.2, z: 0.6, rz: -t * 0.16 })
      box(0.5, 0.25, 0.06, CELL.STONE, { x: (i - 4) * 0.48, y: y + 0.2, z: -0.6, rz: -t * 0.16 })
    }
    return { label: 'Footbridge', kind: 'landmark' }
  },
  gazebo(c, rand) {
    const { cyl, cone, torus } = H(c)
    cyl(1.1, 0.1, CELL.WOOD, { y: 0.05 }, 6)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * P * 2 + P / 6
      cyl(0.05, 1.5, CELL.WOOD, { x: Math.cos(a) * 0.95, y: 0.8, z: Math.sin(a) * 0.95 }, 6)
    }
    cone(1.3, 0.7, CELL.ROOF, { y: 1.85 }, 6)
    torus(0.95, 0.02, CELL.WOOD, { y: 0.5, rx: P / 2, rz: 0.6 }, P * 1.65, 24)
    return { label: 'Gazebo', kind: 'landmark' }
  },
  shuttlestop(c, rand) {
    const { box, cyl } = H(c)
    box(2.0, 0.06, 0.9, CELL.STONE, { y: 0.03 })
    for (const x of [-0.9, 0.9]) cyl(0.04, 1.5, CELL.METAL, { x, y: 0.75, z: -0.4 }, 6)
    box(2.0, 1.2, 0.03, CELL.GLASS, { y: 0.8, z: -0.42 })
    box(2.1, 0.05, 1.0, CELL.METAL_DARK, { y: 1.5 })
    box(1.4, 0.04, 0.3, CELL.WOOD, { y: 0.35, z: -0.2 })
    cyl(0.03, 1.4, CELL.METAL, { x: 1.2, y: 0.7, z: 0.3 }, 6)
    box(0.3, 0.2, 0.02, CELL.LIGHT, { x: 1.2, y: 1.3, z: 0.3 })
    return { label: 'Shuttle stop', kind: 'landmark' }
  },
  badgepillar(c, rand) {
    const { cyl, torus, box } = H(c)
    cyl(0.32, 0.1, CELL.STONE, { y: 0.05 }, 8)
    cyl(0.12, 1.5, CELL.STONE, { y: 0.85 }, 8, 0.16)
    box(0.34, 0.06, 0.34, CELL.ACCENT, { y: 0.13, emissive: 0.5 })
    torus(0.24, 0.025, CELL.METAL, { y: 1.45, ry: 0 }, P * 2, 20)
    c.geom(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20), CELL.ACCENT2, { y: 1.45, rx: P / 2, spin: 0.6, spinAxis: 'y', emissive: 0.7, label: 'Badge' })
    return { label: 'Badge', kind: 'landmark' }
  },
  castlebanner(c, rand) {
    const { cyl, box } = H(c)
    cyl(0.04, 2.2, CELL.METAL, { y: 1.1 }, 6)
    box(1.2, 0.04, 0.04, CELL.METAL, { y: 2.15 })
    c.group('banners', { y: 2.15 })
    box(0.4, 1.0, 0.02, CELL.ACCENT, { x: -0.35, y: -0.5, emissive: 0.4 })
    box(0.4, 1.0, 0.02, CELL.ACCENT2, { x: 0.35, y: -0.5, emissive: 0.3 })
    c.end()
    return { label: 'Banner', kind: 'landmark', loop: 5, pose(t, parts) { parts.banners.rotation.x = Math.sin(t * P * 2) * 0.15 } }
  },
  rocketstatue(c, rand) {
    const { cyl, cone, box, torus } = H(c)
    box(1.4, 0.5, 1.4, CELL.STONE, { y: 0.25 })
    for (let i = 0; i < 3; i++) box(1.42, 0.03, 0.03, CELL.ACCENT, { y: 0.12 + i * 0.13, z: 0.71, emissive: 0.6 })
    c.group('rocket', { y: 0.5, rz: -0.2 })
    cyl(0.22, 1.5, CELL.LIGHT, { y: 1.0 }, 14)
    cone(0.22, 0.5, CELL.RED, { y: 2.0 }, 14)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * P * 2
      const g = new THREE.BoxGeometry(0.06, 0.5, 0.35); g.translate(0, 0, 0.3)
      g.rotateY(a)
      c.geom(g, CELL.RED, { y: 0.45 })
    }
    c.geom(new THREE.SphereGeometry(0.08, 8, 6), CELL.GLASS, { y: 1.3, z: 0.2 })
    torus(0.18, 0.05, CELL.GLOW, { y: 0.22, rx: P / 2, emissive: 1 }, P * 2, 14)
    c.end()
    return { label: 'Launchpad', kind: 'landmark' }
  },
  // END PIECES
  }
}
