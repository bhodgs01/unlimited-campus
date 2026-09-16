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
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const gate=(o={})=>{A(.62,.98,.15,.28,CELL.STONE,o);B(.60,.79,.035,CELL.WOOD,{...o,y:(o.y||0)+.395});B(.055,.73,.035,CELL.GLOW,{...o,x:(o.x||0)+.27,y:(o.y||0)+.43,z:(o.z||0)+.16,emissive:.6});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:0.0250001,z:-0.34249995});

    const crag=new THREE.Shape();[[-3.15,-1.2],[-2.3,-2.75],[1.3,-2.9],[3.1,-1.4],[2.95,1.1],[2.6,1.9],[1.55,1.7],[.7,1.75],[-.25,1.65],[-1.5,1.75],[-2.7,1.5]].forEach(([x,z],i)=>i?crag.lineTo(x,z):crag.moveTo(x,z));crag.closePath();const rock=new THREE.ExtrudeGeometry(crag,{depth:1.8,bevelEnabled:false});rock.rotateX(Math.PI/2);c.geom(rock,CELL.STONE_DARK,{y:1.5,label:'Granite crag'});
    for(let i=0;i<7;i++){const a=.9+i*Math.PI*1.45/7;const q=new THREE.ConeGeometry(.71,1.5,5);q.scale(1,1,.7);c.geom(q,i%2?CELL.STONE_DARK:CELL.EARTH,{x:2.25*Math.sin(a),y:.6,z:2.25*Math.cos(a)});}
    const towers=[[-1.9,-.9,3.5,1.05],[1.9,-.9,3.8,1.05],[-1.05,.65,2.7,1.15],[1.05,.65,3.0,1.15],[0,-.65,4.6,1.35],[0,1.2,1.8,1.0]];
    towers.forEach(([x,z,h,w],j)=>{B(w,h,w,CELL.STONE,{x,y:1.35+h/2,z,label:j===4?'Stepped central keep':undefined});B(w+.1,.18,w+.1,CELL.STONE_DARK,{x,y:1.35+h-.09,z});for(let f=0;f<4;f++){const a=f*Math.PI/2;for(let k=0;k<3;k++)B(.075,.55,.036,CELL.STONE_DARK,{x:x+Math.sin(a)*(w/2+.008),y:1.9+k*.83,z:z+Math.cos(a)*(w/2+.008),ry:a});}for(let k=1;k<h/.46;k++)B(w+.012,.022,w+.012,CELL.STONE_DARK,{x,y:1.35+k*.46,z});});
    for(const x of [-.28,.28])B(.055,3.9,.03,CELL.ACCENT,{x,y:3.8,z:.038,emissive:.6,label:x<0?'Vertical rune':undefined});
    gate({y:1.50,z:1.71,label:'Summit gate'});
    // Switchback flights stay outside the crag; fourteen 0.1-unit risers.
    for(let i=0;i<7;i++){B(.255,.1*(i+1),.68,CELL.STONE,{x:-.95+i*.255,y:.05*(i+1),z:3.18,label:i===0?'Lower stair':undefined});B(.255,.70+.1*(i+1),.68,CELL.STONE,{x:.58-i*.255,y:(.70+.1*(i+1))/2,z:2.36,label:i===0?'Upper stair':undefined});}
    B(.54,.70,1.50,CELL.STONE,{x:.96,y:.35,z:2.77,label:'Switchback landing'});B(1.22,.10,.94,CELL.STONE,{x:-.54,y:1.45,z:1.97});
    for(const z of [2.0,3.56])rod([-.95,z===2?1.79:.43,z],[.71,z===2?1.09:1.10,z],.025,CELL.METAL_DARK);
    c.group('banner',{y:6.03,z:-.65});C(.025,.70,CELL.METAL,{y:.35});P([[0,0],[.55,-.03],[.50,-.34],[0,-.30]],.025,CELL.ACCENT2,{y:.64,label:'Summit banner'});c.end();
    c.end();
    return {label:"Castle of Perseverance",kind:'hero',loop:5,pose(t,p){p.banner.rotation.z=.10*Math.sin(2*Math.PI*t);}};
  },
  castleeconomic(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};
    const roundtower=(x,z,h,r=.53)=>{C(r,h,CELL.STONE,{x,z,y:h/2});for(const y of [.16,h*.48,h-.1])C(r+.04,.10,CELL.STONE_DARK,{x,z,y});c.geom(new THREE.ConeGeometry(r+.09,(r+.09)*3,16),CELL.ROOF,{x,z,y:h+(r+.09)*1.5});for(let j=0;j<4;j++){const a=j*Math.PI/2;B(.115,.48,.035,CELL.STONE_DARK,{x:x+(r+.009)*Math.sin(a),y:h-.53,z:z+(r+.009)*Math.cos(a),ry:a});}};

    const moat=new THREE.Shape();moat.absarc(0,0,3.87,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,3.25,0,Math.PI*2,true);moat.holes.push(hole);const water=new THREE.ExtrudeGeometry(moat,{depth:.045,bevelEnabled:false,curveSegments:40});water.rotateX(-Math.PI/2);c.geom(water,CELL.GLASS,{y:-.05,label:'Moat'});
    B(5.9,.10,5.7,CELL.STONE,{y:.05,label:'Inner court'});
    B(2.05,2.65,1.95,CELL.STONE,{y:1.425,z:-.55,label:'Central keep'});c.geom(new THREE.ConeGeometry(1.60,1.55,4).rotateY(Math.PI/4),CELL.ROOF,{y:3.525,z:-.55});
    for(const x of [-2.28,2.28])for(const z of [-2.16,0,2.16])roundtower(x,z,z===0?2.5:2.9,.51);
    for(const x of [-2.28,2.28])B(.27,1.45,4.5,CELL.STONE,{x,y:.825,label:x<0?'Curtain wall':undefined});B(4.6,1.45,.28,CELL.STONE,{y:.825,z:-2.16});
    for(const x of [-1.42,1.42])B(1.20,1.45,.28,CELL.STONE,{x,y:.825,z:2.16});A(.80,1.67,.22,.44,CELL.STONE,{y:.1,z:2.16,label:'Gatehouse'});
    for(const x of [-2.28,2.28])for(let i=0;i<10;i++)B(.32,.23,.25,CELL.STONE,{x,y:1.66,z:-2.12+i*.47});
    for(const z of [-2.16,2.16])for(let i=0;i<9;i++){const x=-1.92+i*.48;if(z<0||Math.abs(x)>.5)B(.26,.23,.31,CELL.STONE,{x,y:1.66,z});}
    for(const x of [-.76,0,.76])for(const y of [.8,1.7,2.45])pane(.24,.38,{x,y,z:-1.532,ry:Math.PI});
    for(const x of [-.76,0,.76])for(const y of [.8,1.7,2.45])pane(.24,.38,{x,y,z:.444});
    for(const x of [-.7,.7])for(const z of [.85,1.48])B(.48,.20,.41,CELL.LEAF,{x,y:.20,z,label:x<0&&z<1?'Formal parterre':undefined});
    B(1.0,.14,.78,CELL.STONE,{y:.07,z:3.40,label:'Stone approach'});
    c.group('drawbridge',{y:.14,z:2.30,rx:-Math.PI/2});B(.78,.085,1.20,CELL.WOOD,{y:.05,z:.6,label:'Hinged drawbridge'});for(const x of [-.33,.33])B(.04,.035,1.19,CELL.METAL_DARK,{x,y:.11,z:.60});c.end();
    B(.055,.78,.035,CELL.GLOW,{x:.37,y:.52,z:2.41,emissive:.6});B(2.06,.045,.04,CELL.ACCENT,{y:2.57,z:.442,emissive:.6});
    for(const x of [-2.28,2.28])flag(x,4.72,-2.16,CELL.ACCENT2);
    return {label:"Castle of Economic Responsibility",kind:'hero',pose(t,p){p.drawbridge.rotation.x=-(1-t)*Math.PI/2;}};
  },
  castlecreative(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const dome=(r,h,k,o={})=>{const a=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);a.scale(1,h/r,1);c.geom(a,k,o);};
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};
    const archpane=(w,h,o={})=>{const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false,curveSegments:12});c.geom(a,CELL.GLASS,o);A(w,h+.065,.065,.085,CELL.STONE_DARK,o);};
    const hedge=(length,o={})=>{const s=new THREE.Shape();s.moveTo(-.25,0);s.lineTo(.25,0);s.lineTo(.25,.60);s.quadraticCurveTo(.25,.70,.15,.70);s.lineTo(-.15,.70);s.quadraticCurveTo(-.25,.70,-.25,.60);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:length,bevelEnabled:false,curveSegments:6});a.translate(0,0,-length/2);a.rotateY(Math.PI/2);c.geom(a,CELL.LEAF,o);};
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.03,z:-0.20500004});

    C(1.50,2.55,CELL.STONE,{y:1.275,z:-.75,label:'Round keep'},24);for(const y of [.15,1.45,2.53])C(1.55,.12,CELL.STONE_DARK,{y,z:-.75},24);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;archpane(.29,.70,{x:1.505*Math.sin(a),y:1.63,z:-.75+1.505*Math.cos(a),ry:a});}
    c.group('dome',{y:2.61,z:-.75});dome(1.48,1.10,CELL.GLASS,{label:'Observatory dome'});for(let i=0;i<4;i++){const g=new THREE.TorusGeometry(1.5,.025,6,48,Math.PI);g.rotateY(i*Math.PI/4);c.geom(g,CELL.METAL);}B(.085,.22,1.13,CELL.METAL,{y:1.06,z:.1});c.end();
    const rings=[];for(const a of [-.55,.55]){const r=new THREE.TorusGeometry(1.92,.055,8,56);r.rotateX(a);rings.push(r);}const orb=new THREE.SphereGeometry(.17,10,8);orb.translate(1.92,0,0);rings.push(orb);pack(rings,CELL.METAL,{y:3.0,z:-.75,spin:.15,label:'Great orrery'});
    for(const x of [-2.5,2.5]){B(.64,1.55,1.65,CELL.STONE,{x,y:.775,z:-.4});roof(.82,1.83,.80,{x,y:1.55,z:-.4});}
    for(const x of [-2.5,2.5])for(const z of [-.88,-.10])pane(.23,.45,{x:x+Math.sign(x)*.327,y:.93,z,ry:Math.sign(x)*Math.PI/2});
    B(5.5,.07,2.8,CELL.EARTH,{y:.035,z:1.75,label:'Maze forecourt'});
    for(const x of [-2.4,-1.4,1.4,2.4])hedge(1,{x,y:.07,z:2.67});for(const x of [-2.65,2.65])for(const z of [.75,1.75,2.75])hedge(1,{x,y:.07,z,ry:Math.PI/2});
    for(const x of [-1.3,1.3]){hedge(1,{x,y:.07,z:1.68});hedge(1,{x:x+Math.sign(x)*.28,y:.07,z:1.12,ry:Math.PI/2});}
    A(.70,1.28,.22,.45,CELL.STONE,{z:1.05,label:'Gear gate'});B(.065,.8,.055,CELL.GLOW,{x:.3,y:.44,z:1.30,emissive:.6});
    for(const x of [-.49,.49]){const geos=[new THREE.TorusGeometry(.46,.09,6,20)];for(let i=0;i<12;i++){const a=i*Math.PI/6,q=new THREE.BoxGeometry(.14,.17,.13);q.translate(0,.47,0);q.rotateZ(a);geos.push(q);}for(let i=0;i<3;i++)geos.push(new THREE.BoxGeometry(.75,.07,.10).rotateZ(i*Math.PI/3));pack(geos,CELL.METAL_DARK,{x,y:1.64,z:1.19,rz:x<0?0:Math.PI/12,label:x<0?'Meshing gear pair':undefined});}
    B(.045,1.95,.03,CELL.ACCENT,{x:-2.5,y:1.10,z:.442,emissive:.6,label:'Rune strip'});flag(2.5,2.36,-.4,CELL.ACCENT2);
    c.end();
    return {label:"Castle of Creative Problem Solving",kind:'hero',pose(t,p){p.dome.rotation.y=t*Math.PI/2;}};
  },
  castleteamwork(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const dome=(r,h,k,o={})=>{const a=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);a.scale(1,h/r,1);c.geom(a,k,o);};
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};
    const roundtower=(x,z,h,r=.53)=>{C(r,h,CELL.STONE,{x,z,y:h/2});for(const y of [.16,h*.48,h-.1])C(r+.04,.10,CELL.STONE_DARK,{x,z,y});c.geom(new THREE.ConeGeometry(r+.09,(r+.09)*3,16),CELL.ROOF,{x,z,y:h+(r+.09)*1.5});for(let j=0;j<4;j++){const a=j*Math.PI/2;B(.115,.48,.035,CELL.STONE_DARK,{x:x+(r+.009)*Math.sin(a),y:h-.53,z:z+(r+.009)*Math.cos(a),ry:a});}};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:-0.96});

    for(const x of [-2.05,2.05]){roundtower(x,-.65,3.4,.66);B(.06,2.3,.035,CELL.ACCENT,{x,y:2.1,z:.02,emissive:.6,label:x<0?'Equal west tower':'Equal east tower'});}
    B(3.3,.18,.87,CELL.WOOD,{y:2.62,z:-.65,label:'Shared high bridge'});for(const z of [-1.05,-.25]){B(3.3,.13,.08,CELL.WOOD,{y:3.47,z});for(const x of [-1.5,-.75,0,.75,1.5])B(.075,.87,.075,CELL.WOOD,{x,y:3.05,z});}roof(1.06,3.55,.48,{y:3.54,z:-.65,ry:Math.PI/2});
    C(1.9,.14,CELL.STONE,{y:.07,z:1.15,label:'Round-table hall'},32);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;if(i===0||i===6)continue;A(.68,1.33,.10,.24,CELL.STONE,{x:1.66*Math.sin(a),y:.14,z:1.15+1.66*Math.cos(a),ry:a});}
    C(1.83,.12,CELL.STONE,{y:1.50,z:1.15});dome(1.88,.52,CELL.STONE,{y:1.56,z:1.15,label:'Council dome'});
    C(.69,.10,CELL.WOOD,{y:.62,z:1.15});C(.15,.48,CELL.STONE,{y:.33,z:1.15,label:'Round table'});
    for(let i=0;i<8;i++){const a=i*Math.PI/4;flag(1.56*Math.sin(a),1.88,1.15+1.56*Math.cos(a),i%2?CELL.ACCENT2:CELL.ACCENT);}
    for(const s of [-1,1]){const name=s<0?'gateleft':'gateright';c.group(name,{x:s*.36,y:.14,z:2.88});B(.36,.75,.07,CELL.WOOD,{x:-s*.18,y:.375,label:s<0?'Paired welcome gates':undefined});c.end();}
    B(.055,.78,.045,CELL.GLOW,{x:.39,y:.54,z:2.93,emissive:.6});for(let i=0;i<2;i++)B(1.28,.07*(i+1),.20,CELL.STONE,{y:.035*(i+1),z:3.22-i*.20});
    c.end();
    return {label:"Castle of Teamwork and Mentorship",kind:'hero',pose(t,p){p.gateleft.rotation.y=-t*1.35;p.gateright.rotation.y=t*1.35;}};
  },
  castlesocial(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.005,z:-0.2825});

    B(6.35,.10,6.0,CELL.STONE,{y:.05,label:'Open forum paving'});
    for(const z of [-2.56,2.56])for(let i=0;i<6;i++)A(.73,1.7,.12,.42,CELL.STONE,{x:-2.35+i*.94,y:.1,z,label:i===0&&z>0?'Public arcade':undefined});
    for(const x of [-2.82,2.82])for(let i=0;i<5;i++)A(.73,1.7,.12,.42,CELL.STONE,{x,y:.1,z:-1.88+i*.94,ry:Math.PI/2});
    for(const x of [-2.83,2.83])roof(.86,5.82,.42,{x,y:1.82});for(const z of [-2.56,2.56])roof(.90,6.1,.42,{y:1.82,z,ry:Math.PI/2});
    B(1.02,3.25,1.02,CELL.STONE,{x:-2.56,y:1.625,z:-2.3,label:'Corner bell tower'});
    for(const z of [-2.74,-1.86])A(.55,.94,.12,.15,CELL.STONE,{x:-2.56,y:3.23,z});for(const x of [-3,-2.12])A(.55,.94,.12,.15,CELL.STONE,{x,y:3.23,z:-2.3,ry:Math.PI/2});
    c.geom(new THREE.ConeGeometry(.84,1.50,4).rotateY(Math.PI/4),CELL.ROOF,{x:-2.56,y:4.95,z:-2.3,label:'Bell roof'});
    c.group('bell',{x:-2.56,y:4.10,z:-2.3});c.geom(new THREE.CylinderGeometry(.12,.30,.44,16),CELL.METAL,{y:-.26,label:'Forum bell'});C(.32,.06,CELL.METAL,{y:-.50});E(.055,.08,.055,CELL.METAL_DARK,{y:-.56});c.end();
    for(let i=0;i<3;i++)B(5.95,.1*(i+1),.21,CELL.STONE,{y:.05*(i+1),z:3.47-i*.21,label:i===0?'Wide public steps':undefined});
    C(.60,.20,CELL.STONE,{y:.20,label:'Courtyard hearth'});c.geom(new THREE.CylinderGeometry(.48,.23,.36,16),CELL.METAL_DARK,{y:.46});E(.32,.20,.32,CELL.GLOW,{y:.65,emissive:.75,label:'Shared brazier'});
    B(.045,2.8,.035,CELL.ACCENT,{x:-2.85,y:1.6,z:-1.772,emissive:.6});B(.055,.82,.05,CELL.GLOW,{x:.37,y:.57,z:2.80,emissive:.6});flag(2.8,2.20,-2.56,CELL.ACCENT2);
    c.end();
    return {label:"Castle of Social Impact",kind:'hero',loop:3,pose(t,p){p.bell.rotation.z=.27*Math.sin(2*Math.PI*t);}};
  },
  castleenvironmental(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};
    const gate=(o={})=>{A(.62,.98,.15,.28,CELL.STONE,o);B(.60,.79,.035,CELL.WOOD,{...o,y:(o.y||0)+.395});B(.055,.73,.035,CELL.GLOW,{...o,x:(o.x||0)+.27,y:(o.y||0)+.43,z:(o.z||0)+.16,emissive:.6});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.42084352,z:-0.01000005});

    for(let i=0;i<3;i++){const w=5.7-i*1.25,d=4.2-i*.87;B(w,.65,d,CELL.STONE,{y:.325+i*.65,z:-.7-i*.28,label:i===0?'Stepped terraces':undefined});for(const x of [-1,1])B(.28,.15,d-.15,CELL.LEAF,{x:x*(w/2-.2),y:.72+i*.65,z:-.7-i*.28});B(w-.7,.15,.30,CELL.LEAF,{y:.72+i*.65,z:-.7-i*.28-d/2+.2});}
    C(.73,3.75,CELL.STONE,{x:-1.0,y:1.875,z:-1.30,label:'Wind tower'});c.geom(new THREE.ConeGeometry(.87,1.15,16),CELL.ROOF,{x:-1,y:4.325,z:-1.3});
    const sails=[];for(let i=0;i<4;i++){const arm=new THREE.BoxGeometry(.075,2.35,.075);arm.rotateZ(i*Math.PI/2);sails.push(arm);const sail=new THREE.BoxGeometry(.34,.76,.045);sail.translate(.12,.74,.02);sail.rotateZ(i*Math.PI/2);sails.push(sail);}pack(sails,CELL.CLOTH,{x:-1,y:3.25,z:-.49,spin:.45,spinAxis:'z',label:'Windmill sails'});C(.14,.18,CELL.METAL,{x:-1,y:3.25,z:-.4,rx:Math.PI/2});
    const wheel=[new THREE.TorusGeometry(.85,.085,8,32)];for(let i=0;i<12;i++){const q=new THREE.BoxGeometry(.19,.30,.43);q.translate(0,.81,0);q.rotateZ(i*Math.PI/6);wheel.push(q);}for(let i=0;i<4;i++)wheel.push(new THREE.BoxGeometry(1.65,.07,.07).rotateZ(i*Math.PI/4));pack(wheel,CELL.WOOD,{x:2.76,y:1.01,z:.06,spin:.32,spinAxis:'z',label:'Waterwheel'});
    B(1.03,.055,4.25,CELL.GLASS,{x:2.70,y:.025,z:.15,label:'Millrace'});
    for(const x of [.35,1.3]){B(.78,.07,1.00,CELL.GLASS,{x,y:2.24,z:-.85,rx:.40,label:x<1?'South solar roof':undefined});for(const dx of [-.37,.37])B(.035,.08,1.02,CELL.METAL,{x:x+dx,y:2.24,z:-.85,rx:.40});}
    for(let i=0;i<3;i++){const w=5.7-i*1.25,z=1.4-i*.715;for(const y of [.20,.40])B(w-.06,.021,.03,CELL.STONE_DARK,{y:y+i*.65,z:z+.012});for(let j=0;j<5;j++)B(.025,.56,.032,CELL.STONE_DARK,{x:(j-2)*(w/5),y:.325+i*.65,z:z+.012});}
    B(.055,1.2,2.2,CELL.LEAF,{x:-2.855,y:.70,z:-.75,label:'Living wall'});C(.46,.93,CELL.METAL,{x:-2.26,y:.465,z:1.13,label:'Rain cistern'});T([[-2.26,.95,1.13],[-2.26,1.8,1.13],[-1.93,1.8,.1]],.055,CELL.METAL);
    gate({z:1.41,label:'Garden gate'});for(let i=0;i<5;i++)B(.87,.1*(i+1),.24,CELL.STONE,{x:.15,y:.05*(i+1),z:2.70-i*.24});
    B(.045,2.50,.035,CELL.ACCENT,{x:-1,y:1.6,z:-.556,emissive:.6});flag(.4,2.0,-2.55,CELL.ACCENT2);
    c.end();
    return {label:"Castle of Environmental Sustainability",kind:'hero'};
  },

  // ───────────────────────── Batch B: the heart of campus ─────────────────────────
  greathall(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const col=(x,z,h,y=0)=>{C(.105,h,CELL.STONE,{x,y:y+h/2,z});B(.29,.10,.29,CELL.STONE,{x,y:y+.05,z});B(.29,.10,.29,CELL.STONE,{x,y:y+h-.05,z});};
    const archpane=(w,h,o={})=>{const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false,curveSegments:12});c.geom(a,CELL.GLASS,o);A(w,h+.065,.065,.085,CELL.STONE_DARK,o);};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:-0.59000001});

    B(6.4,.10,3.8,CELL.STONE,{y:.05,label:'Hall foundation'});B(5.75,1.80,2.92,CELL.STONE,{y:1.0,z:-.25,label:'Great hall'});
    roof(3.22,6.10,1.10,{y:1.90,z:-.25,ry:Math.PI/2,label:'Long pitched roof'});
    for(const z of [-1.725,1.225])for(let i=0;i<7;i++)archpane(.35,1.1,{x:-2.46+i*.82,y:.50,z,ry:z<0?Math.PI:0});
    for(const x of [-2.886,2.886])for(const z of [-1.05,-.25,.55])archpane(.32,1.02,{x,y:.45,z,ry:Math.sign(x)*Math.PI/2});
    for(const x of [-2.36,-1.42,-.47,.47,1.42,2.36])col(x,2.02,1.77,.30);
    B(5.28,.15,1.18,CELL.STONE,{y:2.14,z:1.91,label:'Six-column portico'});P([[-2.73,0],[2.73,0],[0,.79]],1.50,CELL.STONE,{y:2.22,z:1.91,label:'Pediment'});roof(5.65,1.40,.81,{y:2.25,z:1.91});P([[-2.18,.10],[2.18,.10],[0,.68]],.025,CELL.STONE_DARK,{y:2.22,z:2.686});
    for(let i=0;i<3;i++)B(5.7,.10*(i+1),.24,CELL.STONE,{y:.05*(i+1),z:2.96-i*.24,label:i===0?'Broad entrance steps':undefined});
    B(1.05,1.1,.055,CELL.STONE_DARK,{y:.85,z:1.239});
    c.group('doors',{x:-.48,y:.30,z:1.29});B(.48,.85,.065,CELL.WOOD,{x:.24,y:.425,label:'Portico doors'});B(.032,.78,.018,CELL.ACCENT,{x:.035,y:.43,z:.043,emissive:.6});c.end();
    c.group('doorright',{x:.48,y:.30,z:1.29});B(.48,.85,.065,CELL.WOOD,{x:-.24,y:.425});B(.032,.78,.018,CELL.ACCENT,{x:-.035,y:.43,z:.043,emissive:.6});c.end();
    C(.66,.15,CELL.STONE,{y:2.99,z:-.25});C(.52,.68,CELL.GLASS,{y:3.39,z:-.25,label:'Glazed cupola'},16);for(let i=0;i<8;i++){const a=i*Math.PI/4;C(.028,.7,CELL.METAL,{x:.52*Math.sin(a),y:3.39,z:-.25+.52*Math.cos(a)});}C(.19,.41,CELL.GLOW,{y:3.40,z:-.25,emissive:.75,label:'Cupola lantern'});c.geom(new THREE.ConeGeometry(.69,.58,8),CELL.ROOF,{y:4.02,z:-.25});C(.028,.22,CELL.METAL,{y:4.42,z:-.25});
    c.end();
    return {label:"Great Hall",kind:'hero',pose(t,p){p.doors.rotation.y=-t*1.35;p.doorright.rotation.y=t*1.35;}};
  },
  amphitheater(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:0.96});

    // Half-annular solids leave the stage mouth open on +z.
    const tier=(r0,r1,h,k,o={})=>{const s=new THREE.Shape();s.absarc(0,0,r1,0,Math.PI,false);s.lineTo(-r0,0);s.absarc(0,0,r0,Math.PI,0,true);s.closePath();const q=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:40});q.rotateX(-Math.PI/2);c.geom(q,k,o);};
    for(let i=0;i<8;i++){const r=1.14+i*.335;const h=.10+i*.10;tier(r,r+.333,h,CELL.STONE_DARK,{z:.7,label:i===7?'Upper retaining wall':undefined});tier(r,r+.31,.06,CELL.STONE,{y:h,z:.7,label:i===3?'Eight seating tiers':undefined});}
    B(2.0,.10,1.65,CELL.STONE,{y:.05,z:.32,label:'Open stage'});
    for(const x of [-2.48,2.48])P([[-1.23,0],[1.23,0],[1.23,.84],[-1.23,.04]],.49,CELL.STONE,{x,y:0,z:.96,ry:x<0?Math.PI:0,label:x<0?'Accessible side approach':undefined});
    const rail=[];for(let i=0;i<=48;i++){const a=i*Math.PI/48;rail.push([3.80*Math.cos(a),1.13,.7-3.80*Math.sin(a)]);}T(rail,.027,CELL.METAL,{label:'Upper safety rail'});for(let i=0;i<=16;i++){const a=i*Math.PI/16;C(.025,.40,CELL.METAL,{x:3.80*Math.cos(a),y:.94,z:.7-3.80*Math.sin(a)});}
    const bulbs=[];for(const a of [.3,1.1,2.04,2.84]){const x=3.62*Math.cos(a),z=.7-3.62*Math.sin(a);C(.038,1.2,CELL.METAL_DARK,{x,y:1.40,z});const q=new THREE.SphereGeometry(.105,8,6);q.translate(x,2.07,z);bulbs.push(q);}pack(bulbs,CELL.GLOW,{emissive:.75,label:'Four aisle lamps'});
    c.end();
    return {label:"Campus Amphitheater",kind:'hero'};
  },
  centralbeacon(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);

    for(let i=0;i<3;i++)B(1.45-i*.28,.10,1.45-i*.28,CELL.STONE,{y:.05+i*.10});
    c.geom(new THREE.CylinderGeometry(.18,.32,2.4,4).rotateY(Math.PI/4),CELL.STONE,{y:1.5});c.geom(new THREE.ConeGeometry(.255,.35,4).rotateY(Math.PI/4),CELL.GLOW,{y:2.875,emissive:1});
    const ring=new THREE.TorusGeometry(.48,.035,8,32);ring.rotateX(Math.PI/2);ring.rotateZ(.20);c.geom(ring,CELL.ACCENT,{y:2.38,spin:.30,emissive:.6});
    return {label:"Central Beacon",kind:'landmark'};
  },
  grandfountain(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};

    C(1.40,.12,CELL.STONE,{y:.06,label:'Sitting rim'},32);R(1.23,.13,CELL.STONE,{y:.20,rx:Math.PI/2,label:'Lower basin'});C(1.20,.035,CELL.GLASS,{y:.18},32);
    C(.19,1.1,CELL.STONE,{y:.65,label:'Central stem'});for(const [r,y] of [[.82,.68],[.49,1.22]]){c.geom(new THREE.CylinderGeometry(r,r*.65,.14,24),CELL.STONE,{y:y-.07,label:r>.5?'Middle basin':'Upper basin'});R(r-.045,.06,CELL.STONE,{y,rx:Math.PI/2});C(r-.10,.025,CELL.GLASS,{y:y+.016},24);}
    const lamps=[];for(let i=0;i<4;i++){const a=i*Math.PI/2,q=new THREE.SphereGeometry(.07,8,6);q.translate(.94*Math.sin(a),.20,.94*Math.cos(a));lamps.push(q);}pack(lamps,CELL.GLOW,{emissive:.7,label:'Basin uplights'});
    c.group('spire',{y:1.22});c.geom(new THREE.ConeGeometry(.14,.67,8),CELL.STONE,{y:.36,label:'Turning spire'});R(.19,.025,CELL.METAL,{y:.49,rz:.45});c.end();
    return {label:"Grand Fountain",kind:'hero',loop:12,pose(t,p){p.spire.rotation.y=t*Math.PI*2;}};
  },
  ringpavilion(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);

    C(1.34,.08,CELL.STONE,{y:.04},8);for(let i=0;i<8;i++){const a=i*Math.PI/4;C(.055,1.23,CELL.STONE,{x:1.05*Math.sin(a),y:.695,z:1.05*Math.cos(a)});}
    c.geom(new THREE.ConeGeometry(1.47,.37,8).rotateY(Math.PI/8),CELL.ROOF,{y:1.535});
    const bench=new THREE.TorusGeometry(.80,.10,4,24,Math.PI*1.65);bench.rotateX(Math.PI/2);bench.rotateY(.55);bench.scale(1,.38,1);c.geom(bench,CELL.WOOD,{y:.31});for(const x of [-.64,.64])B(.08,.23,1.0,CELL.STONE,{x,y:.195});C(.08,.18,CELL.GLOW,{y:1.18,emissive:.7});
    return {label:"Ring Pavilion",kind:'landmark'};
  },
  welcomegate(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const flag=(x,y,z,k=CELL.ACCENT)=>{C(.022,.85,CELL.METAL,{x,y:y+.425,z});P([[0,0],[.47,-.02],[.42,-.35],[0,-.32]],.024,k,{x,y:y+.77,z});};

    for(const x of [-.94,.94]){B(.44,1.65,.48,CELL.STONE,{x,y:.825});B(.55,.10,.59,CELL.STONE,{x,y:1.70});flag(x,1.75,0,x<0?CELL.ACCENT:CELL.ACCENT2);}
    A(1.38,1.90,.16,.32,CELL.STONE);const glow=new THREE.TorusGeometry(.77,.022,6,32,Math.PI);c.geom(glow,CELL.ACCENT,{y:1.05,z:.18,emissive:.6});
    for(const s of [-1,1]){B(.42,.045,.045,CELL.METAL,{x:s*1.24,y:.75});for(let i=0;i<4;i++)B(.025,.72,.025,CELL.METAL,{x:s*(1.10+i*.12),y:.36});}
    return {label:"Welcome Gate",kind:'landmark'};
  },

  // ───────────────────────── Batch C: campus buildings ─────────────────────────
  dormblock(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};

    B(4.50,.10,2.20,CELL.STONE,{y:.05});B(4.24,1.92,1.94,CELL.STONE,{y:1.06});
    const lit=Math.floor(rand()*18),balconies=rand()<.5;for(const s of [-1,1])for(let j=0;j<3;j++)for(let i=0;i<6;i++){const x=-1.78+i*.71,y=.49+j*.60;pane(.38,.34,{x,y,z:s*.976,ry:s<0?Math.PI:0},s>0&&i+j*6===lit);}
    for(const z of [-1.0,1.0])B(4.3,.17,.07,CELL.STONE,{y:2.105,z});for(const x of [-2.12,2.12])B(.08,.17,2.0,CELL.STONE,{x,y:2.105});B(4.21,.09,1.91,CELL.ROOF,{y:2.03});
    B(1.5,.16,.40,CELL.STONE_DARK,{y:2.14,z:-.44});B(1.39,.12,.31,CELL.LEAF,{y:2.25,z:-.44});B(.5,.65,.045,CELL.WOOD,{y:.425,z:1.008});
    if(balconies)for(const x of [-1.07,1.07]){B(.55,.06,.19,CELL.STONE,{x,y:1.41,z:.99});B(.53,.24,.025,CELL.METAL,{x,y:1.56,z:1.08});}
    return {label:"Student Residence",kind:'landmark'};
  },
  courtyardhouse(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};

    B(4.6,.10,4.4,CELL.STONE,{y:.05});for(const x of [-1.66,1.66]){B(1.14,1.25,3.95,CELL.STONE,{x,y:.725});roof(1.36,4.10,.65,{x,y:1.35});}
    B(3.34,1.25,1.08,CELL.STONE,{y:.725,z:-1.49});roof(1.31,3.40,.65,{y:1.35,z:-1.49,ry:Math.PI/2});
    for(const x of [-1.66,1.66]){pane(.41,.4,{x,y:.9,z:1.99});B(.5,.65,.05,CELL.WOOD,{x,y:.425,z:2.01});for(const z of [-1.0,0,1.0]){pane(.32,.42,{x:x+Math.sign(x)*.576,y:.87,z,ry:Math.sign(x)*Math.PI/2});const dx=x+Math.sign(x)*.43;B(.38,.36,.45,CELL.STONE,{x:dx,y:1.70,z});roof(.51,.42,.23,{x:dx,y:1.88,z,ry:Math.sign(x)*Math.PI/2});pane(.26,.22,{x:dx+Math.sign(x)*.197,y:1.73,z,ry:Math.sign(x)*Math.PI/2});}}
    C(.075,.7,CELL.WOOD,{y:.45,z:.45});E(.45,.45,.45,CELL.LEAF,{y:1.07,z:.45});for(const x of [-1.66,1.66]){B(.24,.60,.29,CELL.STONE,{x,y:1.99,z:-1.5});B(.30,.07,.35,CELL.STONE_DARK,{x,y:2.31,z:-1.5});}B(.19,.23,.027,CELL.GLOW,{x:rand()<.5?-1.66:1.66,y:.9,z:2.03,emissive:.5});
    return {label:"Courtyard House",kind:'landmark'};
  },
  lecturehall(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const col=(x,z,h,y=0)=>{C(.105,h,CELL.STONE,{x,y:y+h/2,z});B(.29,.10,.29,CELL.STONE,{x,y:y+.05,z});B(.29,.10,.29,CELL.STONE,{x,y:y+h-.05,z});};
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};

    B(4.4,.10,4.2,CELL.STONE,{y:.05});P([[-1.9,0],[1.9,0],[1.9,1.50],[-1.9,1.20]],2.8,CELL.STONE,{y:.1,z:-.45});roof(4.05,3.04,1.02,{y:1.6,z:-.45});B(.20,.25,2.80,CELL.GLASS,{y:2.65,z:-.45});roof(.35,2.91,.14,{y:2.79,z:-.45});
    for(const x of [-1.5,-.5,.5,1.5])col(x,1.52,1.23,.2);B(3.8,.14,1.01,CELL.STONE,{y:1.5,z:1.5});roof(4.01,1.14,.46,{y:1.57,z:1.5});
    for(const x of [-1.91,1.91])for(const z of [-1.38,-.48,.42])pane(.47,.54,{x,y:.88,z,ry:Math.sign(x)*Math.PI/2});B(.52,.65,.04,CELL.WOOD,{y:.425,z:.97});B(1.2,.10,.3,CELL.STONE,{y:.15,z:1.84});B(.30,.28,.03,CELL.GLOW,{x:rand()<.5?-1.35:1.35,y:1.05,z:.98,emissive:.5});
    return {label:"Lecture Hall",kind:'landmark'};
  },
  library(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const dome=(r,h,k,o={})=>{const a=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);a.scale(1,h/r,1);c.geom(a,k,o);};
    const archpane=(w,h,o={})=>{const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false,curveSegments:12});c.geom(a,CELL.GLASS,o);A(w,h+.065,.065,.085,CELL.STONE_DARK,o);};

    B(4.7,.10,3.6,CELL.STONE,{y:.05});B(4.38,1.49,2.5,CELL.STONE,{y:.845,z:-.2});B(4.5,.14,2.62,CELL.STONE,{y:1.66,z:-.2});
    for(const z of [-1.46,1.06])for(let i=0;i<6;i++)archpane(.43,1.04,{x:-1.86+i*.744,y:.35,z,ry:z<0?Math.PI:0});
    C(.87,.55,CELL.STONE,{y:1.98,z:-.2},24);dome(.96,.60,CELL.STONE,{y:2.255,z:-.2});C(.19,.24,CELL.GLOW,{y:2.91,z:-.2,emissive:.7});c.geom(new THREE.ConeGeometry(.29,.19,12),CELL.ROOF,{y:3.125,z:-.2});
    A(.62,1.06,.15,.20,CELL.STONE,{y:.2,z:1.18});B(.6,.65,.05,CELL.WOOD,{y:.525,z:1.30});for(let i=0;i<2;i++)B(2.15,.1*(i+1),.23,CELL.STONE,{y:.05*(i+1),z:1.66-i*.23});if(rand()<.5)B(.42,.12,.40,CELL.METAL_DARK,{x:1.7,y:1.79,z:-.6});
    return {label:"Campus Library",kind:'landmark'};
  },
  sciencelab(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);

    B(4.5,.10,3.3,CELL.STONE,{y:.05});B(4.12,.46,2.94,CELL.STONE,{y:.33});B(4.1,1.03,2.92,CELL.GLASS,{y:1.08});
    for(const x of [-2.08,-1.04,0,1.04,2.08])for(const z of [-1.49,1.49])B(.07,1.58,.07,CELL.METAL,{x,y:.89,z});for(const y of [.58,1.12,1.62]){for(const z of [-1.49,1.49])B(4.2,.07,.07,CELL.METAL,{y,z});for(const x of [-2.08,2.08])B(.07,.07,3.04,CELL.METAL,{x,y});}
    B(4.26,.13,3.1,CELL.ROOF,{y:1.71});B(1.34,.58,1.14,CELL.STONE,{x:-.74,y:2.06,z:-.4});for(let i=0;i<4;i++)B(.85,.06,.04,CELL.METAL_DARK,{x:-.74,y:1.86+i*.12,z:.19});B(.52,.65,.045,CELL.WOOD,{y:.425,z:1.52});
    C(.06,.54,CELL.METAL,{x:1.28,y:2.04,z:-.40});const dish=new THREE.SphereGeometry(.42,16,8,0,Math.PI*2,0,Math.PI/2);dish.rotateX(-.7);c.geom(dish,CELL.METAL,{x:1.28,y:2.43,z:-.4,spin:.20});B(.35,.28,.035,CELL.GLOW,{x:rand()<.5?-1.5:1.5,y:1.36,z:1.505,emissive:.5});
    return {label:"Science Laboratory",kind:'landmark'};
  },
  fieldhouse(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};

    B(4.6,.10,3.8,CELL.STONE,{y:.05});B(4.24,1.12,3.45,CELL.STONE,{y:.66});const vault=new THREE.CylinderGeometry(1.76,1.76,4.46,24,1,true,0,Math.PI);vault.rotateZ(Math.PI/2);vault.scale(1,.53,1);c.geom(vault,CELL.ROOF,{y:1.23});
    for(const x of [-2.23,2.23]){const pts=[[-1.76,0],[1.76,0]];for(let i=0;i<=16;i++){const a=i*Math.PI/16;pts.push([1.76*Math.cos(a),.9328*Math.sin(a)]);}P(pts,.065,CELL.STONE,{x,y:1.23,ry:Math.PI/2});}
    for(const z of [-1.736,1.736])for(let i=0;i<7;i++)pane(.46,.24,{x:-1.8+i*.6,y:.99,z,ry:z<0?Math.PI:0});for(const x of [-.32,.32])B(.60,.78,.04,CELL.WOOD,{x,y:.49,z:1.77});
    C(.035,1.79,CELL.METAL,{x:2.13,y:.995,z:1.48});B(.28,.18,.14,CELL.METAL_DARK,{x:2.13,y:1.98,z:1.48});B(.23,.13,.026,CELL.GLOW,{x:2.13,y:1.98,z:1.56,emissive:.65});if(rand()<.5)B(.38,.15,.35,CELL.METAL_DARK,{x:1.2,y:2.14});
    return {label:"Fieldhouse",kind:'landmark'};
  },
  clocktower(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);

    B(3,.10,3,CELL.STONE,{y:.05});B(1.30,3.65,1.30,CELL.STONE,{y:1.925});for(const y of [.28,1.35,2.40,3.30])B(1.40,.10,1.40,CELL.STONE_DARK,{y});B(1.48,.68,1.48,CELL.STONE,{y:3.92});B(1.53,.055,1.53,CELL.ACCENT,{y:3.56,emissive:.6});
    for(let i=0;i<4;i++){const a=i*Math.PI/2;c.group('clock'+i,{x:.758*Math.sin(a),y:3.97,z:.758*Math.cos(a),ry:a});C(.265,.028,CELL.LIGHT,{rx:Math.PI/2});R(.276,.025,CELL.METAL);const m=new THREE.BoxGeometry(.025,.23,.025);m.translate(0,.10,.027);c.geom(m,CELL.METAL,{spin:.05,spinAxis:'z'});B(.14,.033,.026,CELL.METAL,{x:.055,y:.036,z:.028,rz:.5});c.end();for(const y of [.85,1.9,2.95])B(.16,.38,.03,CELL.STONE_DARK,{x:.658*Math.sin(a),y,z:.658*Math.cos(a),ry:a});}
    c.geom(new THREE.ConeGeometry(1.12,.64,4).rotateY(Math.PI/4),CELL.ROOF,{y:4.61});C(.027,.07,CELL.METAL,{y:4.965});B(.5,.65,.04,CELL.WOOD,{y:.425,z:.673});B(.16,.25,.025,CELL.GLOW,{y:2.95,z:rand()<.5?.68:-.68,emissive:.5});
    return {label:"Campus Clock Tower",kind:'landmark'};
  },
  greenhouse(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};

    B(4.5,.10,3.2,CELL.STONE,{y:.05});for(const z of [-1.38,1.38])B(4.1,.29,.12,CELL.STONE,{y:.245,z});for(const x of [-2.02,2.02])B(.12,.29,2.88,CELL.STONE,{x,y:.245});
    for(const z of [-1.39,1.39])B(4.06,.92,.032,CELL.GLASS,{y:.84,z});for(const x of [-2.025,2.025])P([[-1.38,0],[1.38,0],[1.38,.90],[0,1.73],[-1.38,.90]],.035,CELL.GLASS,{x,y:.39,ry:Math.PI/2});
    for(const s of [-1,1])for(let i=0;i<6;i++){if(s===1&&(i===1||i===4))continue;B(.66,.035,1.66,CELL.GLASS,{x:-1.708+i*.683,y:1.705,z:s*.69,rx:s*.54});}
    for(let i=0;i<7;i++){const x=-2.05+i*.683;for(const s of [-1,1]){rod([x,.38,s*1.4],[x,1.3,s*1.4],.025,CELL.METAL);rod([x,1.3,s*1.4],[x,2.13,0],.025,CELL.METAL);}}
    for(const z of [-.75,.75]){B(3.6,.20,.66,CELL.EARTH,{y:.20,z});for(let i=0;i<7;i++)E(.19,.23,.22,CELL.LEAF,{x:-1.5+i*.5,y:.45,z});}B(.26,1.82,.30,CELL.STONE,{x:1.83,y:1.01,z:-1.08});B(.51,.65,.04,CELL.WOOD,{y:.425,z:1.42});B(.17,.24,.027,CELL.GLOW,{x:rand()<.5?-.43:.43,y:.91,z:1.415,emissive:.5});
    return {label:"Campus Glasshouse",kind:'landmark'};
  },
  cafepavilion(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};

    B(4.5,.10,3.6,CELL.STONE,{y:.05});for(const x of [-1.91,1.91])for(const z of [-1.4,1.4])B(.08,1.68,.08,CELL.METAL,{x,y:.94,z});B(4.46,.14,3.54,CELL.ROOF,{y:1.85});B(1.72,.53,.60,CELL.STONE,{x:-.69,y:.365,z:-.92});B(1.84,.065,.69,CELL.WOOD,{x:-.69,y:.663,z:-.92});B(.60,.9,.14,CELL.WOOD,{x:1.51,y:.55,z:-1.37});
    for(const x of [-.95,.95]){C(.34,.06,CELL.WOOD,{x,y:.57,z:.57});C(.045,.41,CELL.METAL,{x,y:.335,z:.57});for(const dx of [-.48,.48]){C(.13,.06,CELL.WOOD,{x:x+dx,y:.30,z:.57});C(.038,.20,CELL.METAL,{x:x+dx,y:.20,z:.57});}}
    T([[-1.90,1.76,1.40],[0,1.58,1.40],[1.90,1.76,1.40]],.015,CELL.METAL_DARK);const lamps=[];for(let i=0;i<7;i++){const x=-1.8+i*.6,q=new THREE.SphereGeometry(.055,8,6);q.translate(x,1.58+.16*(x/1.8)**2,1.40);lamps.push(q);}pack(lamps,CELL.GLOW,{emissive:.7});if(rand()<.5)C(.08,.12,CELL.METAL,{x:-.45,y:.76,z:-.92});
    return {label:"Campus Cafe",kind:'landmark'};
  },
  studiohall(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const pane=(w,h,o={},lit=false)=>{B(w+.10,h+.10,.055,CELL.STONE_DARK,o);B(w,h,.025,lit?CELL.GLOW:CELL.GLASS,{...o,z:(o.z||0)+Math.cos(o.ry||0)*.035,x:(o.x||0)+Math.sin(o.ry||0)*.035,emissive:lit?.55:0});};

    B(4.5,.10,3.8,CELL.STONE,{y:.05});B(4.1,1.24,3.44,CELL.STONE,{y:.72});
    for(let i=0;i<3;i++){const x=-1.38+i*1.38;P([[-.69,0],[.69,0],[.69,.73]],3.59,CELL.ROOF,{x,y:1.34});B(.035,.68,3.55,CELL.GLASS,{x:x+.698,y:1.69});for(const z of [-1.80,1.80])rod([x-.69,1.34,z],[x+.69,2.07,z],.025,CELL.METAL);}
    B(1.18,.90,.04,CELL.METAL_DARK,{y:.55,z:1.75});for(let i=0;i<6;i++)B(1.13,.035,.035,CELL.METAL,{y:.2+i*.13,z:1.78});B(4.14,.045,.035,CELL.ACCENT2,{y:1.29,z:1.75});for(const x of [-1.53,1.53])pane(.44,.59,{x,y:.82,z:1.75},x<0&&rand()<.5);
    return {label:"Creative Studio Hall",kind:'landmark'};
  },
  boathouse(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    const roof=(w,d,h,o={})=>P([[-w/2,0],[w/2,0],[0,h]],d,CELL.ROOF,o);
    const boat=(length,o={})=>{const s=new THREE.Shape();s.moveTo(0,length/2);s.bezierCurveTo(.40,length*.25,.36,-length*.42,.19,-length/2);s.lineTo(-.19,-length/2);s.bezierCurveTo(-.36,-length*.42,-.40,length*.25,0,length/2);const hole=new THREE.Path();hole.moveTo(0,length/2-.13);hole.bezierCurveTo(-.25,length*.2,-.25,-length*.32,-.12,-length/2+.10);hole.lineTo(.12,-length/2+.10);hole.bezierCurveTo(.25,-length*.32,.25,length*.2,0,length/2-.13);s.holes.push(hole);const a=new THREE.ExtrudeGeometry(s,{depth:.20,bevelEnabled:false,curveSegments:10});a.rotateX(Math.PI/2);a.translate(0,.20,0);c.geom(a,CELL.WOOD,o);B(.31,.035,length*.63,CELL.WOOD,{...o,y:(o.y||0)+.045});for(const z of [-length*.21,length*.18])B(.49,.045,.11,CELL.WOOD,{...o,y:(o.y||0)+.18,z:(o.z||0)+z});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:-0.15000003});

    B(3.7,.10,3.85,CELL.STONE,{y:.05,z:-.225});B(3.34,1.21,.14,CELL.WOOD,{y:.705,z:-1.8});for(const x of [-1.6,1.6])B(.14,1.21,3.62,CELL.WOOD,{x,y:.705});roof(3.6,3.84,.87,{y:1.31});
    for(const x of [-1.61,1.61])for(let i=0;i<9;i++)B(.025,1.16,.042,CELL.STONE_DARK,{x:x+Math.sign(x)*.078,y:.70,z:-1.6+i*.4});for(const x of [-1.45,1.45])B(.12,1.25,.12,CELL.WOOD,{x,y:.725,z:1.71});B(3.1,.15,.15,CELL.WOOD,{y:1.32,z:1.71});
    // Timber launch ramp intentionally reaches -0.3 below the shoreline.
    P([[-.73,.10],[.73,-.30],[-.73,.045]],1.03,CELL.WOOD,{x:0,y:0,z:1.72,ry:-Math.PI/2});boat(1.55,{x:-.50,y:.1,z:-.30});R(.21,.055,CELL.RED,{x:1.48,y:.83,z:1.80});B(.52,.65,.045,CELL.WOOD,{x:.88,y:.425,z:1.75});if(rand()<.5)B(.30,.22,.025,CELL.GLOW,{x:.90,y:.94,z:1.78,emissive:.5});
    c.end();
    return {label:"Lake Boathouse",kind:'landmark'};
  },
  observatory(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};

    B(3.9,.10,3.9,CELL.STONE,{y:.05,label:'Terrace'});C(1.35,1.21,CELL.STONE,{y:.705,label:'Observatory drum'},28);C(1.42,.12,CELL.STONE_DARK,{y:1.35,label:'Dome track'},28);
    c.group('dome',{y:1.41});c.geom(new THREE.SphereGeometry(1.40,28,14,Math.PI/2+.13,Math.PI*2-.26,0,Math.PI/2),CELL.ROOF,{label:'Slotted dome'});for(const a of [-.13,.13]){const rib=new THREE.TorusGeometry(1.415,.03,6,32,Math.PI/2);rib.rotateY(-Math.PI/2+a);c.geom(rib,CELL.METAL);}C(.105,.70,CELL.METAL,{y:.62,z:.67,rx:.48,label:'Telescope'});c.end();
    for(const x of [-1.72,1.72]){B(.035,.035,3.40,CELL.METAL,{x,y:.55});for(let i=0;i<6;i++)C(.022,.44,CELL.METAL,{x,y:.33,z:-1.65+i*.66});}B(3.45,.035,.035,CELL.METAL,{y:.55,z:-1.72,label:'Terrace railing'});
    A(.51,.80,.10,.13,CELL.STONE_DARK,{y:.10,z:1.34});B(.50,.65,.04,CELL.WOOD,{y:.425,z:1.42,label:'Entry'});B(.12,.18,.05,CELL.GLOW,{x:rand()<.5?-.47:.47,y:.86,z:1.31,emissive:.5});
    return {label:"Campus Observatory",kind:'hero',pose(t,p){p.dome.rotation.y=t*Math.PI*2;}};
  },
  mentorshall(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const dome=(r,h,k,o={})=>{const a=new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);a.scale(1,h/r,1);c.geom(a,k,o);};

    B(4.1,.10,4.1,CELL.STONE,{y:.05});C(1.66,1.35,CELL.STONE,{y:.775},24);for(let i=0;i<12;i++){const a=i*Math.PI/6;B(.14,1.38,.14,CELL.STONE,{x:1.67*Math.sin(a),y:.79,z:1.67*Math.cos(a),ry:a});const q=new THREE.CylinderGeometry(.13,.13,.035,12);q.rotateX(Math.PI/2);c.geom(q,CELL.ACCENT2,{x:1.68*Math.sin(a+Math.PI/12),y:1.22,z:1.68*Math.cos(a+Math.PI/12),ry:a+Math.PI/12});}C(1.77,.14,CELL.STONE,{y:1.50},24);dome(1.83,.53,CELL.STONE,{y:1.57});
    B(.78,.81,.05,CELL.STONE_DARK,{y:.505,z:1.65});B(.60,.65,.05,CELL.WOOD,{y:.425,z:1.69});C(.16,.20,CELL.GLOW,{y:2.21,emissive:.7});c.geom(new THREE.ConeGeometry(.26,.17,8),CELL.ROOF,{y:2.395});if(rand()<.5)B(.31,.09,.25,CELL.STONE,{x:.45,y:.145,z:1.86});
    return {label:"Hall of Mentors",kind:'landmark'};
  },

  // ───────────────────────── Batch D: grounds furniture ─────────────────────────
  campustree(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:-0.07500001});

    C(.10,.95,CELL.WOOD,{y:.475});const a=rand()*Math.PI*2;rod([0,.58,0],[.28*Math.sin(a),1.25,.28*Math.cos(a)],.06,CELL.WOOD);E(.59,.65,.59,CELL.LEAF,{y:1.35});for(let i=0;i<3;i++){const t=i*Math.PI*2/3;E(.39,.40,.39,CELL.LEAF,{x:.35*Math.sin(t),y:1.12,z:.35*Math.cos(t)});}
    c.end();
    return {label:"Avenue Tree",kind:'landmark'};
  },
  campustreetall(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};

    C(.075,.85,CELL.WOOD,{y:.425});E(.35,1.04,.35,CELL.LEAF,{y:1.56});const a=rand()*Math.PI*2;rod([0,.50,0],[.15*Math.sin(a),1.24,.15*Math.cos(a)],.035,CELL.WOOD);
    return {label:"Poplar Tree",kind:'landmark'};
  },
  campustreeflat(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};

    C(.13,.64,CELL.WOOD,{y:.32});for(const x of [-.57,.57])rod([0,.46,0],[x,1.04,0],.08,CELL.WOOD);E(1.2,.31,.83,CELL.LEAF,{y:1.15});E(.75,.24,.60,CELL.LEAF,{y:1.36});const a=rand()*Math.PI*2;rod([0,.57,0],[.4*Math.sin(a),.98,.4*Math.cos(a)],.045,CELL.WOOD);
    return {label:"Spreading Park Tree",kind:'landmark'};
  },
  hedgestraight(c, rand) {
    const hedge=(length,o={})=>{const s=new THREE.Shape();s.moveTo(-.25,0);s.lineTo(.25,0);s.lineTo(.25,.60);s.quadraticCurveTo(.25,.70,.15,.70);s.lineTo(-.15,.70);s.quadraticCurveTo(-.25,.70,-.25,.60);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:length,bevelEnabled:false,curveSegments:6});a.translate(0,0,-length/2);a.rotateY(Math.PI/2);c.geom(a,CELL.LEAF,o);};

    hedge(1);
    return {label:"Straight Hedge",kind:'landmark'};
  },
  hedgecorner(c, rand) {
    const hedge=(length,o={})=>{const s=new THREE.Shape();s.moveTo(-.25,0);s.lineTo(.25,0);s.lineTo(.25,.60);s.quadraticCurveTo(.25,.70,.15,.70);s.lineTo(-.15,.70);s.quadraticCurveTo(-.25,.70,-.25,.60);s.closePath();const a=new THREE.ExtrudeGeometry(s,{depth:length,bevelEnabled:false,curveSegments:6});a.translate(0,0,-length/2);a.rotateY(Math.PI/2);c.geom(a,CELL.LEAF,o);};

    // Two half-unit centreline runs share a half-section elbow. Flat ends face +x and +z.
    hedge(.75,{x:0,z:-.125});hedge(.75,{x:-.125,z:0,ry:Math.PI/2});
    return {label:"Hedge Corner",kind:'landmark'};
  },
  hedgering(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:0.02184659});

    const g=new THREE.TorusGeometry(1.05,.25,10,56,Math.PI*2-.52);g.rotateZ(Math.PI/2+.26);g.rotateX(Math.PI/2);c.geom(g,CELL.LEAF,{y:.25});C(.76,.04,CELL.EARTH,{y:.02},24);for(const x of [-.32,.32])for(const z of [-.32,.32])E(.25,.20,.25,CELL.LEAF,{x,y:.20,z});
    c.end();
    return {label:"Circular Hedge",kind:'landmark'};
  },
  gardenparterre(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};

    B(3,.025,3,CELL.EARTH,{y:.0125});for(const x of [-.76,.76])for(const z of [-.76,.76]){B(1.15,.18,1.15,CELL.LEAF,{x,y:.115,z});E(.34,.14,.34,CELL.LEAF,{x,y:.26,z});}C(.18,.28,CELL.STONE,{y:.14});c.geom(new THREE.CylinderGeometry(.30,.14,.25,12),CELL.STONE,{y:.405});C(.25,.025,CELL.EARTH,{y:.535});
    return {label:"Formal Parterre",kind:'landmark'};
  },
  lamppost(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.15376524,z:-0.0});

    C(.075,.10,CELL.METAL_DARK,{y:.05});C(.027,1.24,CELL.METAL_DARK,{y:.72});T([[0,1.29,0],[.08,1.41,0],[.25,1.41,0],[.28,1.28,0]],.025,CELL.METAL_DARK);B(.17,.22,.17,CELL.GLOW,{x:.28,y:1.18,emissive:.8});c.geom(new THREE.ConeGeometry(.145,.10,4).rotateY(Math.PI/4),CELL.METAL_DARK,{x:.28,y:1.34});
    c.end();
    return {label:"Campus Lamp",kind:'landmark'};
  },
  parkbench(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);

    for(const x of [-.39,.39]){B(.055,.25,.39,CELL.METAL_DARK,{x,y:.125});B(.055,.29,.045,CELL.METAL_DARK,{x,y:.37,z:-.16});}for(let i=0;i<3;i++)B(1,.045,.095,CELL.WOOD,{y:.25,z:-.11+i*.11});for(const y of [.37,.49])B(1,.085,.045,CELL.WOOD,{y,z:-.17});
    return {label:"Park Bench",kind:'landmark'};
  },
  bikerack(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);

    for(const z of [-.25,.25])B(1.60,.04,.08,CELL.METAL_DARK,{y:.02,z});for(let i=0;i<5;i++){const g=new THREE.TorusGeometry(.24,.025,8,16,Math.PI);g.rotateY(Math.PI/2);c.geom(g,CELL.METAL,{x:-.66+i*.33,y:.24});for(const z of [-.24,.24])C(.025,.22,CELL.METAL,{x:-.66+i*.33,y:.13,z});}
    return {label:"Bicycle Rack",kind:'landmark'};
  },
  flagpole(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.29000001,z:-0.0});

    C(.09,.06,CELL.METAL,{y:.03});C(.023,2.40,CELL.METAL,{y:1.20});c.group('banner',{y:2.30});P([[0,0],[.67,-.02],[.63,-.48],[0,-.45]],.022,CELL.ACCENT);P([[0,-.56],[.43,-.62],[0,-.85]],.022,CELL.ACCENT2);c.end();
    c.end();
    return {label:"Campus Flagpole",kind:'hero',loop:4,pose(t,p){p.banner.rotation.y=.22*Math.sin(2*Math.PI*t);}};
  },
  signpost(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.005,z:-0.0});

    B(.08,1.14,.08,CELL.WOOD,{y:.57});for(let i=0;i<3;i++)P([[-.40,-.07],[.29,-.07],[.41,0],[.29,.07],[-.40,.07]],.055,CELL.WOOD,{y:1.02-i*.20,ry:(i-1)*.72});B(.71,.025,.06,CELL.ACCENT,{y:1.10});
    c.end();
    return {label:"Campus Signpost",kind:'landmark'};
  },
  soccergoal(c, rand) {
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:0.01753962});

    for(const x of [-.68,.68]){rod([x,.025,.20],[x,.53,.20],.02,CELL.METAL);rod([x,.025,-.24],[x,.53,.20],.02,CELL.METAL);rod([x,.025,-.24],[x,.025,.20],.02,CELL.METAL);}rod([-.68,.53,.20],[.68,.53,.20],.02,CELL.METAL);for(const y of [.12,.26,.40])rod([-.68,y,-.24+y*.83],[.68,y,-.24+y*.83],.01,CELL.LIGHT);
    c.end();
    return {label:"Soccer Goal",kind:'landmark'};
  },
  bleacher(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);

    for(let i=0;i<4;i++){const z=.48-i*.32;B(2.5,.14*(i+1),.30,CELL.METAL_DARK,{y:.07*(i+1),z});B(2.5,.045,.22,CELL.WOOD,{y:.14*(i+1)+.0225,z});}B(2.5,.035,.035,CELL.METAL,{y:.89,z:-.57});for(const x of [-1.20,0,1.20])C(.02,.86,CELL.METAL,{x,y:.43,z:-.57});
    return {label:"Pitch Bleachers",kind:'landmark'};
  },
  floodlight(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};

    C(.14,.12,CELL.STONE,{y:.06});C(.045,3,CELL.METAL,{y:1.5});B(.93,.44,.08,CELL.METAL,{y:2.90});const lamps=[];for(let j=0;j<2;j++)for(let i=0;i<3;i++){const x=-.32+i*.32,y=2.79+j*.24;B(.28,.21,.18,CELL.METAL_DARK,{x,y});const q=new THREE.BoxGeometry(.23,.16,.025);q.translate(x,y,.105);lamps.push(q);}pack(lamps,CELL.GLOW,{emissive:.6});
    return {label:"Pitch Floodlight",kind:'landmark'};
  },
  sailboat(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const boat=(length,o={})=>{const s=new THREE.Shape();s.moveTo(0,length/2);s.bezierCurveTo(.40,length*.25,.36,-length*.42,.19,-length/2);s.lineTo(-.19,-length/2);s.bezierCurveTo(-.36,-length*.42,-.40,length*.25,0,length/2);const hole=new THREE.Path();hole.moveTo(0,length/2-.13);hole.bezierCurveTo(-.25,length*.2,-.25,-length*.32,-.12,-length/2+.10);hole.lineTo(.12,-length/2+.10);hole.bezierCurveTo(.25,-length*.32,.25,length*.2,0,length/2-.13);s.holes.push(hole);const a=new THREE.ExtrudeGeometry(s,{depth:.20,bevelEnabled:false,curveSegments:10});a.rotateX(Math.PI/2);a.translate(0,.20,0);c.geom(a,CELL.WOOD,o);B(.31,.035,length*.63,CELL.WOOD,{...o,y:(o.y||0)+.045});for(const z of [-length*.21,length*.18])B(.49,.045,.11,CELL.WOOD,{...o,y:(o.y||0)+.18,z:(o.z||0)+z});};
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.0,z:-0.00500002});

    c.group('hull',{y:.04});boat(1.8);C(.023,1.61,CELL.METAL,{y:.90,z:.18});P([[0,0],[0,1.20],[-.73,.03]],.02,CELL.LIGHT,{y:.42,z:.18,ry:Math.PI/2});P([[0,0],[0,1.12],[.52,0]],.02,CELL.LIGHT,{y:.43,z:.23,ry:Math.PI/2});rod([0,.43,.18],[0,.43,-.6],.019,CELL.WOOD);B(.045,.045,.32,CELL.WOOD,{y:.24,z:-.66});c.end();
    c.end();
    return {label:"Lake Sailboat",kind:'hero',loop:6,pose(t,p){p.hull.rotation.z=.06*Math.sin(2*Math.PI*t);}};
  },
  rowboat(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const boat=(length,o={})=>{const s=new THREE.Shape();s.moveTo(0,length/2);s.bezierCurveTo(.40,length*.25,.36,-length*.42,.19,-length/2);s.lineTo(-.19,-length/2);s.bezierCurveTo(-.36,-length*.42,-.40,length*.25,0,length/2);const hole=new THREE.Path();hole.moveTo(0,length/2-.13);hole.bezierCurveTo(-.25,length*.2,-.25,-length*.32,-.12,-length/2+.10);hole.lineTo(.12,-length/2+.10);hole.bezierCurveTo(.25,-length*.32,.25,length*.2,0,length/2-.13);s.holes.push(hole);const a=new THREE.ExtrudeGeometry(s,{depth:.20,bevelEnabled:false,curveSegments:10});a.rotateX(Math.PI/2);a.translate(0,.20,0);c.geom(a,CELL.WOOD,o);B(.31,.035,length*.63,CELL.WOOD,{...o,y:(o.y||0)+.045});for(const z of [-length*.21,length*.18])B(.49,.045,.11,CELL.WOOD,{...o,y:(o.y||0)+.18,z:(o.z||0)+z});};

    boat(1.2);for(const x of [-.16,.16]){B(.025,.025,.91,CELL.WOOD,{x,y:.26});B(.07,.025,.23,CELL.WOOD,{x,y:.26,z:-.34});}
    return {label:"Lake Rowboat",kind:'landmark'};
  },
  pier(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:0.048,z:-0.0});

    for(const x of [-.42,.42])for(const z of [-1.28,0,1.28])C(.055,.52,CELL.WOOD,{x,y:.26,z});for(let i=0;i<15;i++)B(.97,.06,.19,CELL.WOOD,{y:.40,z:-1.4+i*.2});C(.06,.18,CELL.METAL_DARK,{x:.27,y:.52,z:1.21});C(.04,.72,CELL.WOOD,{x:-.38,y:.78,z:.95});R(.16,.041,CELL.RED,{x:-.38,y:.89,z:1.0});
    c.end();
    return {label:"Timber Pier",kind:'landmark'};
  },
  footbridge(c, rand) {
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};

    // The four-unit span is the explicit furniture-size exception in the brief.
    const pts=[[-2,0],[-1.5,.15],[-.75,.27],[0,.30],[.75,.27],[1.5,.15],[2,0],[1.8,0],[1.3,.07],[.6,.17],[-.6,.17],[-1.3,.07],[-1.8,0]];P(pts,1.20,CELL.STONE);
    for(const z of [-.55,.55]){const wall=[[-2,0],[-1.5,.15],[-.75,.27],[0,.30],[.75,.27],[1.5,.15],[2,0],[2,.28],[1.5,.43],[.75,.55],[0,.58],[-.75,.55],[-1.5,.43],[-2,.28]];P(wall,.10,CELL.STONE,{z});}
    return {label:"Stone Footbridge",kind:'landmark'};
  },
  gazebo(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};

    C(1.12,.07,CELL.STONE,{y:.035},6);const pts=[];for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3,x=Math.sin(a),z=Math.cos(a);pts.push([x,z]);C(.045,1.23,CELL.WOOD,{x,y:.685,z});}
    for(let i=0;i<6;i++){const a=pts[i],b=pts[(i+1)%6];if(a[1]>.7&&b[1]>.7)continue;rod([a[0],.61,a[1]],[b[0],.61,b[1]],.027,CELL.WOOD);rod([a[0]*.80,.28,a[1]*.80],[b[0]*.80,.28,b[1]*.80],.075,CELL.WOOD);}c.geom(new THREE.ConeGeometry(1.28,.65,6).rotateY(Math.PI/6),CELL.ROOF,{y:1.625});
    return {label:"Garden Gazebo",kind:'landmark'};
  },
  shuttlestop(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);

    for(const x of [-.91,.91])for(const z of [-.37,.37])B(.04,1.18,.04,CELL.METAL,{x,y:.59,z});B(1.84,.90,.025,CELL.GLASS,{y:.68,z:-.37});for(const x of [-.91,.91])B(.025,.90,.73,CELL.GLASS,{x,y:.68});B(2,.06,.90,CELL.METAL,{y:1.21});B(1.43,.05,.26,CELL.WOOD,{y:.30,z:-.17});for(const x of [-.51,.51])B(.05,.28,.22,CELL.METAL,{x,y:.14,z:-.17});B(.40,.22,.04,CELL.LIGHT,{y:.91,z:.40});
    return {label:"Shuttle Stop",kind:'landmark'};
  },
  badgepillar(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);

    B(.48,.10,.48,CELL.STONE,{y:.05});B(.30,.91,.30,CELL.STONE,{y:.555});B(.32,.045,.32,CELL.ACCENT,{y:.16});R(.235,.025,CELL.METAL,{y:1.34});const d=new THREE.CylinderGeometry(.18,.18,.045,16);d.rotateX(Math.PI/2);c.geom(d,CELL.ACCENT2,{y:1.34,spin:.6,emissive:.7});
    return {label:"Badge Pillar",kind:'landmark'};
  },
  castlebanner(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};

    C(.025,2.2,CELL.METAL,{y:1.1});B(1.19,.045,.045,CELL.METAL,{y:2.10});c.group('banners',{y:2.09});for(const s of [-1,1])P([[-.22,0],[.22,0],[.22,-.77],[0,-.91],[-.22,-.77]],.024,s<0?CELL.ACCENT:CELL.ACCENT2,{x:s*.32});c.end();
    return {label:"District Banners",kind:'hero',loop:5,pose(t,p){p.banners.rotation.x=.12*Math.sin(2*Math.PI*t);}};
  },
  rocketstatue(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    // Fixed offset centres the full footprint, including moving parts.
    c.group('footprint',{x:-0.02953969,z:-0.01225});

    B(.98,.22,.98,CELL.STONE,{y:.11});B(.75,.20,.75,CELL.STONE,{y:.32});for(const x of [-.27,0,.27])B(.035,.27,.025,CELL.ACCENT,{x,y:.225,z:.502});
    // Twelve-degree launch lean from vertical keeps the monument within 2.6 units.
    c.group('rocket',{y:.53,rz:-Math.PI/15});C(.20,1.62,CELL.LIGHT,{y:.89});c.geom(new THREE.ConeGeometry(.20,.40,16),CELL.LIGHT,{y:1.90});for(let i=0;i<3;i++)P([[.16,.10],[.38,0],[.33,.43],[.16,.56]],.055,CELL.RED,{ry:i*Math.PI*2/3});R(.15,.028,CELL.GLOW,{y:.085,rx:Math.PI/2,emissive:.8});C(.078,.028,CELL.GLASS,{y:1.31,z:.207,rx:Math.PI/2});c.end();
    c.end();
    return {label:"Student Launchpad",kind:'landmark'};
  },
  markettent(c, rand) {
    // a striped market tent: four poles, a hipped canvas canopy, a counter and crates
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, seg = 8) => c.geom(new THREE.CylinderGeometry(r, r, h, seg), cell, o)
    const stripe = rand() < 0.5 ? CELL.ACCENT : CELL.ACCENT2
    for (const x of [-1.1, 1.1]) for (const z of [-0.9, 0.9]) cyl(0.04, 1.5, CELL.WOOD, { x, y: 0.75, z })
    c.geom(new THREE.ConeGeometry(1.75, 0.7, 4), CELL.CLOTH, { y: 1.85, ry: Math.PI / 4 })
    for (let i = 0; i < 4; i++) {
      const g = new THREE.BoxGeometry(0.22, 0.03, 1.28)
      g.rotateX(-0.42)
      g.rotateY((i * Math.PI) / 2)
      c.geom(g, stripe, { x: Math.sin((i * Math.PI) / 2) * 0.62, y: 1.78, z: Math.cos((i * Math.PI) / 2) * 0.62 })
    }
    box(2.4, 0.04, 2.0, CELL.CLOTH, { y: 1.5 })
    box(1.6, 0.7, 0.5, CELL.WOOD, { y: 0.35, z: 0.7 })
    box(0.5, 0.4, 0.5, CELL.WOOD, { x: -0.7, y: 0.2, z: -0.4 })
    box(0.5, 0.4, 0.5, CELL.WOOD, { x: 0.6, y: 0.2, z: -0.5, ry: 0.4 })
    c.geom(new THREE.SphereGeometry(0.08, 6, 5), CELL.GLOW, { y: 1.42, emissive: 0.9 })
    return { label: 'Market tent', kind: 'landmark' }
  },
  // END PIECES
  }
}
