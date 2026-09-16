/**
 * Pieces borrowed from the JARVIS Brain (apps/graph-explorer planet-pieces-lib.js), the
 * School of Brain campus: the same Composer API, so they drop straight in. They use the
 * brain palette (ACCENT = gold, ACCENT2 = violet) and are placed with that palette so a
 * dinosaur skeleton does not come out neon purple. Regenerate with scratchpad extract_brain.py.
 */
export default function BRAIN_PIECES(THREE, CELL) {
  return {
  dinoskeleton(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const P=(pts,r,k,o={})=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));c.geom(new THREE.TubeGeometry(curve,48,r,6,false),CELL[k],o);return curve;};
    P([[-1.3,.7,0],[-.6,1.1,0],[.2,1.5,0],[.6,2,0]],.08,'LIGHT');B(.65,.3,.35,'LIGHT',.8,2.1);for(let i=0;i<5;i++)T(.22+i*.035,.035,'LIGHT',-.45+i*.18,1.25+i*.08,0,{ry:Math.PI/2},Math.PI);for(const s of [-1,1]){L([0,1.3,s*.2],[-.35,.7,s*.35],.1,'LIGHT');L([-.35,.7,s*.35],[0,.15,s*.4],.07,'LIGHT');B(.5,.12,.18,'LIGHT',.15,.1,s*.4);L([.4,1.7,s*.2],[.65,1.35,s*.3],.045,'LIGHT');}
    return {label:"Dinosaur skeleton",kind:"landmark"};
  },
  fossildig(c, rand) {
    const B = (w,h,d,k,x=0,y=0,z=0,label) => c.geom(new THREE.BoxGeometry(w,h,d),k,{x,y,z,label});
    const C = (r,h,k,x=0,y=0,z=0,rx=0,label) => c.geom(new THREE.CylinderGeometry(r,r,h,16),k,{x,y,z,rx,label});
    const S = (r,k,x=0,y=0,z=0,label) => c.geom(new THREE.SphereGeometry(r,12,8),k,{x,y,z,label});
    const rod = (a,b,r,k,label) => {
      const u=new THREE.Vector3(...a), v=new THREE.Vector3(...b), d=v.clone().sub(u);
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
      const geo=new THREE.CylinderGeometry(r,r,d.length(),8);
      geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
      const p=u.add(v).multiplyScalar(.5); c.geom(geo,k,{x:p.x,y:p.y,z:p.z,label});
    };
    const tile = (w=5.7,d=3.7) => B(w,.16,d,CELL.STONE,0,.08,0);

    tile(3.1,3.1);B(2.7,.12,2.7,CELL.EARTH,0,.22,0);for(const x of [-1.28,1.28])for(const z of [-1.28,1.28])B(.07,.34,.07,CELL.WOOD,x,.45,z);
    for(const a of [-1.22,-.42,.42,1.22]){rod([-1.22,.53,a],[1.22,.53,a],.012,CELL.CLOTH);rod([a,.53,-1.22],[a,.53,1.22],.012,CELL.CLOTH);}
    rod([0,.33,-.91],[0,.33,.68],.06,CELL.LIGHT);for(let i=0;i<5;i++){const r=.39-i*.035;const rib=new THREE.TorusGeometry(r,.04,6,14,Math.PI);c.geom(rib,CELL.LIGHT,{y:.32,z:-.61+i*.28});}S(.15,CELL.LIGHT,0,.38,.86);
    C(.16,.24,CELL.METAL,1.02,.4,.82);B(.075,.07,.41,CELL.WOOD,-.95,.335,.76);B(.18,.08,.15,CELL.CLOTH,-.95,.34,1.02);
    return { label: 'Fossil excavation', kind: 'landmark' };
  },
  fossilslab(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    for(const x of [-.71,.71])B(.12,.77,.36,CELL.METAL,{x,y:.385,z:-.14});B(2.1,.18,1.41,CELL.STONE,{y:.93,rx:.59});
    c.group('slab',{y:.96,rx:.59});
    rod([-.66,.12,0],[.55,.12,0],.045,CELL.LIGHT);for(let i=0;i<7;i++){const x=-.61+i*.15;for(const side of [-1,1])T([[x,.12,0],[x+.09,.12,side*.13],[x+.06,.12,side*(.22-Math.abs(x)*.08)]],.022,CELL.LIGHT);}R(.16,.035,CELL.LIGHT,{x:.68,y:.12,rx:Math.PI/2});T([[-.65,.12,0],[-.84,.12,-.08],[-.94,.12,-.22]],.027,CELL.LIGHT);c.end();
    B(.10,.055,.64,CELL.WOOD,{x:1.08,y:.04,z:.55,ry:.25});B(.24,.07,.14,CELL.CLOTH,{x:1.16,y:.07,z:.86,ry:.25});B(.09,.055,.55,CELL.WOOD,{x:-1.04,y:.04,z:.61});B(.32,.11,.13,CELL.METAL,{x:-1.04,y:.10,z:.92});
    return {label:'Fossil on a museum stand',kind:'landmark'};
  },
  treeoflife(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    C(.73,.16,CELL.STONE,{y:.08,label:'Root of the tree'});rod([0,.16,0],[0,.91,0],.13,CELL.WOOD,{label:'Common ancestor'});
    const branches=[[-1.28,1.8,0],[.2,1.92,-.55],[1.25,1.85,.18]];
    branches.forEach((b,i)=>{rod([0,.87,0],b,.09,CELL.WOOD,{label:['First major fork','Second major fork','Third major fork'][i]});for(let j=0;j<3;j++){const e=[b[0]+(j-1)*.56,b[1]+.85+(j===1?.22:0),b[2]+(j%2)*.30];rod(b,e,.052,CELL.WOOD);for(let k=0;k<2;k++){const f=[e[0]+(k-.5)*.31,e[1]+.37,e[2]+(k-.5)*.14];rod(e,f,.026,CELL.WOOD);E(.095,.095,.095,CELL.ACCENT,{x:f[0],y:f[1],z:f[2]});}}});
    rod([0,1.04,0],[-.49,1.39,.38],.075,CELL.WOOD,{label:'Extinct branch'});
    return {label:'Evolutionary tree',kind:'hero',pose(t,p){}};
  },
  vandegraaff(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};
    B(2.05,.28,1.6,CELL.METAL_DARK,{x:-.5,y:.14,label:'Motor base'});
    for(const x of [-.94,-.06])C(.065,1.82,CELL.METAL,{x,y:1.17,z:-.27});
    const sleeve=new THREE.CylinderGeometry(.47,.47,1.83,16,1,true,Math.PI/2,Math.PI);c.geom(sleeve,CELL.GLASS,{x:-.5,y:1.20,label:'Cutaway insulating column'});
    for(const x of [-.70,-.30])B(.08,1.55,.17,CELL.CLOTH,{x,y:1.24,label:x<-.5?'Moving belt':undefined});
    for(const y of [.48,1.98])C(.23,.22,CELL.METAL_DARK,{x:-.5,y,z:0,rx:Math.PI/2});
    const paddles=[];for(let i=0;i<6;i++){const q=new THREE.BoxGeometry(.36,.035,.05);q.rotateZ(i*Math.PI/3);paddles.push(q);}pack(paddles,CELL.ACCENT,{x:-.5,y:.48,z:.15,spin:3,spinAxis:'z',label:'Belt drive'});
    E(.95,.61,.85,CELL.METAL,{x:-.5,y:2.45,label:'Charge dome'});C(.59,.09,CELL.METAL,{x:-.5,y:2.11});
    C(.38,.13,CELL.METAL_DARK,{x:1.56,y:.065});rod([1.56,.13,0],[1.56,1.85,0],.065,CELL.METAL,{label:'Grounded arm'});E(.28,.28,.28,CELL.METAL,{x:1.56,y:2.06,label:'Discharge sphere'});
    c.group('sparks',{x:.27,y:2.27});
    for(let i=0;i<3;i++){const pts=[[0,0],[.27,.10-i*.08],[.41,-.05],[.66,.04],[1.05,-.19]],pieces=[];for(let j=0;j<4;j++){const a=pts[j],b=pts[j+1],g=new THREE.BoxGeometry(Math.hypot(b[0]-a[0],b[1]-a[1]),.035,.035);g.rotateZ(Math.atan2(b[1]-a[1],b[0]-a[0]));g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,i*.12-.12);pieces.push(g);}pack(pieces,CELL.GLOW,{emissive:.85});}c.end();
    return {label:'Van de Graaff generator',kind:'hero',loop:3,pose(t,p){p.sparks.scale.setScalar(.001+.999*Math.sin(Math.PI*t)**8);}};
  },
  chemistryset(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const ball=(r,cell,o={})=>c.geom(new THREE.SphereGeometry(r,12,8),cell,o)
    const cone=(r,h,cell,o={},n=12)=>c.geom(new THREE.ConeGeometry(r,h,n),cell,o)
    const lathe=(pts,cell,o={},n=16,start=0,span=Math.PI*2)=>c.geom(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),n,start,span),cell,o)

  box(2.55,.11,1.14,CELL.WOOD,{y:.83})
    for(const x of [-1.07,1.07])for(const z of [-.42,.42])box(.09,.77,.09,CELL.METAL,{x,y:.385,z})
    lathe([[0,0],[.25,0],[.26,.08],[.07,.43],[.07,.65],[.035,.65],[.035,.43],[.20,.08],[0,.05]],CELL.GLASS,{x:-.88,y:.89})
    cyl(.24,.075,CELL.METAL,{x:-.12,y:.93})
    cyl(.045,.65,CELL.METAL,{x:.12,y:1.255})
    ball(.22,CELL.GLASS,{x:-.12,y:1.49})
    cyl(.065,.30,CELL.GLASS,{x:-.12,y:1.76})
    cyl(.10,.14,CELL.METAL_DARK,{x:-.12,y:1.035})
    cone(.085,.21,CELL.GLOW,{x:-.12,y:1.21,emissive:.7})
    for(const y of [.98,1.28])box(.92,.07,.33,CELL.WOOD,{x:.70,y,z:.07})
    for(let i=0;i<5;i++)cyl(.055,.51,i%2?CELL.ACCENT2:CELL.ACCENT,{x:.34+i*.18,y:1.22,z:.07},10)
    return {label:'Chemistry bench',kind:'landmark'}
  },
  microscope(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    B(1.7,.2,1.5,'METAL_DARK',0,.1);L([-.6,.2,-.2],[-.6,1.9,-.2],.16,'METAL');B(1.2,.12,.8,'METAL',0,1);L([-.6,1.9,-.2],[.25,2.1,.2],.18,'LIGHT');G('turret',.25,1.7,.2);C(.25,.12,'METAL');for(let i=0;i<3;i++){const a=i*2*Math.PI/3;L([0,-.04,0],[.23*Math.cos(a),-.35,.23*Math.sin(a)],.065,'METAL_DARK');}E();L([.25,2.1,.2],[.25,2.65,.5],.12,'METAL_DARK');
    return {label:"Microscope",kind:"landmark",pose(t,parts){parts.turret.rotation.y=t*Math.PI*2},loop:12};
  },
  atom(c, rand) {
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    G('atom',0,1.4);S(.3,.3,.3,'GLOW',0,0,0,{emissive:.8});for(let i=0;i<3;i++){G('orbit'+i,0,0,0,{rx:i*Math.PI/3,ry:i*.6});T(1.15,.025,'METAL');S(.12,.12,.12,'ACCENT',1.15);E();}E();
    return {label:"Atom",kind:"landmark",pose(t,parts){parts.atom.rotation.y=t*Math.PI*2},loop:12};
  },
  telescope(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const beam=(a,b,w,cell,label)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2]
      box(w,Math.hypot(dx,dy,dz),w,cell,{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,rx:Math.atan2(dz,dy),rz:-Math.atan2(dx,Math.hypot(dy,dz)),label})
    }

  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam([Math.cos(a)*.68,.05,Math.sin(a)*.68],[0,1.22,0],.065,CELL.METAL)}
    cyl(.12,.26,CELL.METAL_DARK,{y:1.31,rz:.65})
    c.group('opticaltube',{y:1.63,rx:-.48})
    cyl(.13,1.18,CELL.LIGHT,{rx:Math.PI/2})
    cyl(.17,.23,CELL.METAL_DARK,{z:.56,rx:Math.PI/2})
    cyl(.14,.025,CELL.GLASS,{z:.69,rx:Math.PI/2})
    cyl(.065,.19,CELL.METAL_DARK,{z:-.65,rx:Math.PI/2})
    c.end()
    beam([0,1.36,0],[.38,1.11,0],.065,CELL.METAL)
    cyl(.15,.18,CELL.METAL_DARK,{x:.38,y:1.11,rz:Math.PI/2})
    return {label:'Refractor telescope',kind:'landmark'}
  },
  petridishstack(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    for(const x of [-1.88,1.88])for(const z of [-.71,.71])B(.13,.88,.13,CELL.METAL,{x,y:.44,z});B(4.32,.14,1.94,CELL.STONE,{y:.95,label:'Laboratory bench'});
    const places=[[-1.24,.19],[-.04,-.29],[1.20,.23]];
    places.forEach(([x,z],i)=>{C(.59,.045,CELL.GLASS,{x,y:1.045,z,label:i===0?'Culture dish':undefined});R(.58,.032,CELL.GLASS,{x,y:1.09,z,rx:Math.PI/2});C(.46,.017,CELL.CLOTH,{x,y:1.075,z});R(.59,.022,CELL.GLASS,{x:x-.10,y:1.16,z:z-.08,rx:Math.PI/2,label:i===0?'Offset lid':undefined});});
    c.group('colonies',{y:1.08});places.forEach(([x,z],i)=>{for(let j=0;j<7;j++){const a=j*2.4,r=i===2?.35:.12+rand()*.27;E(.065,.045,.059,[CELL.ACCENT,CELL.RED,CELL.LIGHT][i],{x:x+Math.cos(a)*r,y:.025,z:z+Math.sin(a)*r,label:j===0?['Bacterial colonies','Second culture','Peripheral colonies'][i]:undefined});}});c.end();
    C(.095,.023,CELL.LIGHT,{x:1.2,y:1.098,z:.23,label:'Antibiotic disc'});R(.25,.012,CELL.GLASS,{x:1.2,y:1.10,z:.23,rx:Math.PI/2,label:'Inhibition zone'});
    rod([-1.95,1.065,-.63],[-1.29,1.065,-.70],.015,CELL.METAL);R(.07,.012,CELL.METAL,{x:-1.22,y:1.065,z:-.70,rx:Math.PI/2,label:'Inoculating loop'});C(.12,.12,CELL.METAL,{x:1.94,y:1.08,z:-.57});c.geom(new THREE.ConeGeometry(.065,.24,8),CELL.GLOW,{x:1.94,y:1.25,z:-.57,emissive:.6,label:'Sterilizing flame'});
    return {label:'Petri-dish cultures',kind:'hero',pose(t,p){p.colonies.scale.y=.08+.92*t;}};
  },
  moleculewater(c, rand) {
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    S(.38,.38,.38,'RED',0,1.7,0,{label:'Oxygen'});
  for(const s of [-1,1]){G('bond'+s,0,1.7,0,{rz:s*104.5*Math.PI/360});L([0,0,0],[0,1.3,0],.07,'METAL',{label:s>0?'O-H bond':undefined});S(.22,.22,.22,'LIGHT',0,1.3,0,{label:s>0?'Hydrogen 1':'Hydrogen 2'});E();}
  for(const s of [-1,1])S(.27,.45,.18,'GLASS',s*.45,1.12,-.32,{rz:-s*.6,label:s>0?'Lone pair 1':'Lone pair 2'});
    return {label:"Water molecule",kind:"hero",pose(t,parts){const a=(104.5+5*Math.sin(t*Math.PI*2))*Math.PI/360;parts['bond-1'].rotation.z=-a;parts.bond1.rotation.z=a}};
  },
  globe(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    C(.7,.15,'METAL',0,.075);C(.07,.65,'METAL',0,.4);T(1.05,.045,'METAL',0,1.6,0,{rz:.4});G('world',0,1.6,0,{rz:.401});S(.92,.92,.92,'GLASS');for(const [x,y,z,a,b] of [[-.3,.4,.76,.35,.38],[.35,-.3,.8,.22,.4],[-.4,-.25,-.76,.4,.23]])S(a,b,.04,'ACCENT',x,y,z);E();
    return {label:"Globe",kind:"landmark",pose(t,parts){parts.world.rotation.y=t*Math.PI*2},loop:16};
  },
  volcano(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const ball=(r,cell,o={})=>c.geom(new THREE.SphereGeometry(r,12,8),cell,o)
    const tube=(pts,r,cell,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(16,pts.length*3),r,6,false),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }

  // Solid back-half cone with an exposed planar geological section at z=0.
    c.geom(new THREE.CylinderGeometry(.24,1.42,1.82,20,1,false,Math.PI/2,Math.PI),CELL.EARTH,{y:.91})
    plate([[-1.42,0],[1.42,0],[.24,1.82],[-.24,1.82]],.035,CELL.EARTH,{z:-.035})
    for(const y of [.35,.69,1.03]){
      const w=1.42-(1.18*y/1.82)
      plate([[-w,y],[w,y],[w-.065,y+.075],[-w+.065,y+.075]],.02,CELL.STONE,{z:.004})
    }
    const chamber=new THREE.SphereGeometry(1,12,8);chamber.scale(.40,.23,.08);c.geom(chamber,CELL.GLOW,{y:.44,z:.035,emissive:.65})
    box(.13,1.31,.06,CELL.GLOW,{y:1.07,z:.04,emissive:.6})
    tube([[.12,1.83,-.12],[.45,1.49,-.36],[.70,1.07,-.56]],.075,CELL.RED)
    for(const [x,y,r]of [[-.10,2.07,.25],[.12,2.47,.32]])ball(r,CELL.LIGHT,{x,y,z:-.14})
    return {label:'Volcano section',kind:'landmark'}
  },
  stratacutaway(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    B(4.96,.30,1.79,CELL.STONE_DARK,{y:.15});
    const cells=[CELL.EARTH,CELL.STONE,CELL.STONE_DARK,CELL.LIGHT];
    for(let side=0;side<2;side++)for(let i=0;i<8;i++){
      const x0=side?0.12:-2.42,x1=side?2.42:-.12,shift=side?-.24:0,y=.30+i*.34+shift,pts=[[x0,y],[x0+.55,y+.10],[x1-.54,y+.04],[x1,y+.12],[x1,y+.43],[x1-.54,y+.35],[x0+.55,y+.41],[x0,y+.31]];P(pts,1.71,cells[i%4],{label:i===0?(side?'Downthrown block':'Uplifted block'):i===4&&!side?'Folded sediment':undefined});
    }
    P([[-.13,.05],[.07,.05],[.31,3.04],[.1,3.04]],1.76,CELL.METAL_DARK,{x:1.06,label:'Volcanic dike'});
    rod([0,.15,.91],[0,2.98,.91],.032,CELL.RED,{label:'Fault trace'});R(.15,.027,CELL.LIGHT,{x:-1.27,y:1.85,z:.88,label:'Fossil horizon'});T([[-1.42,1.85,.9],[-1.26,1.97,.9],[-1.17,1.85,.9],[-1.28,1.78,.9]],.02,CELL.LIGHT);
    return {label:'Folded strata and fault',kind:'hero',pose(t,p){}};
  },
  compass(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    C(1,.2,'METAL',0,.1);C(.85,.04,'LIGHT',0,.22);T(.9,.08,'ACCENT',0,.25,0,{rx:Math.PI/2});G('needle',0,.32);for(const s of [-1,1]){const g=new THREE.ConeGeometry(.13,.8,4);g.rotateZ(-s*Math.PI/2);c.geom(g,CELL[s<0?'LIGHT':'RED'],{x:s*.4});}E();T(.2,.04,'METAL',1.18,.12,0,{rx:Math.PI/2});
    return {label:"Compass",kind:"landmark",pose(t,parts){parts.needle.rotation.y=t*Math.PI*2},loop:10};
  },
  geode(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    for(const side of [-1,1]){
      const g=new THREE.LatheGeometry([[0,0],[.24,.04],[.51,.15],[.62,.37],[.60,.46],[.48,.46],[.42,.33],[.20,.23],[0,.23]].map(([x,y])=>new THREE.Vector2(x,y)),14);c.geom(g,CELL.STONE,{x:side*.73});
      C(.38,.035,CELL.STONE_DARK,{x:side*.73,y:.285});R(.53,.071,CELL.STONE,{x:side*.73,y:.475,rx:Math.PI/2});
      for(let i=0;i<11;i++){const a=i*2.4,r=.15+(i%3)*.11,h=.16+rand()*.16;c.geom(new THREE.ConeGeometry(.075,h,5),i%4?CELL.GLASS:CELL.ACCENT,{x:side*.73+Math.cos(a)*r,y:.31+h/2,z:Math.sin(a)*r});}
    }
    return {label:'Split crystal geode',kind:'landmark'};
  },
  heart(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const P=(pts,r,k,o={})=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));c.geom(new THREE.TubeGeometry(curve,48,r,6,false),CELL[k],o);return curve;};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    // Patient right is viewer left. Chambers are open rings at z=0, not solid blobs.
  const chamber=(x,y,w,h,thick,k,label)=>{const shape=new THREE.Shape();shape.absellipse(0,0,w,h,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absellipse(0,0,w-thick,h-thick,0,Math.PI*2,true,0);shape.holes.push(hole);c.geom(new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false,curveSegments:16}),CELL[k],{x,y,z:-.45,label});};
  chamber(-.55,2.3,.5,.4,.12,'ACCENT2','Right atrium');chamber(.55,2.3,.5,.4,.12,'RED','Left atrium');
  G('ventricles',0,1.35);chamber(-.48,0,.5,.75,.12,'ACCENT2','Right ventricle');chamber(.48,0,.55,.85,.22,'RED','Left ventricle');B(.15,1.45,.4,'STONE',0,0,-.2,{label:'Septum'});E();
  for(const [n,x,y] of [['tricuspid',-.55,1.95],['mitral',.55,1.95],['pulmonary',-.2,2.5],['aortic',.2,2.6]]){G(n,x,y,0);B(.35,.035,.2,'LIGHT',.15,0,-.1,{label:n[0].toUpperCase()+n.slice(1)+' valve'});E();}
  P([[.2,2.55,-.2],[.25,3.15,-.2],[.75,3.3,-.2],[1.15,2.9,-.2],[1.2,1.8,-.2]],.13,'RED',{label:'Aorta'});
  P([[-.2,2.45,-.1],[-.1,2.9,-.1],[-.65,3,-.1],[-1.1,2.85,-.1]],.11,'ACCENT2',{label:'Pulmonary trunk'});
  P([[-1.05,3,-.15],[-1,2.3,-.15],[-1.1,1.5,-.15]],.12,'ACCENT2',{label:'Venae cavae'});
    return {label:"Heart",kind:"hero",pose(t,parts){const beat=(1-Math.cos(t*Math.PI*2))*.5;parts.ventricles.scale.set(1-.1*beat,1-.08*beat,1);parts.tricuspid.rotation.z=.5*(1-beat);parts.mitral.rotation.z=-.5*(1-beat);parts.pulmonary.rotation.z=.5*beat;parts.aortic.rotation.z=-.5*beat;},loop:1};
  },
  skull(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const P=(pts,r,k,o={})=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));c.geom(new THREE.TubeGeometry(curve,48,r,6,false),CELL[k],o);return curve;};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    S(.85,.9,.7,'LIGHT',0,2.3,-.15,{label:'Cranium'});B(1.25,.55,.5,'LIGHT',0,1.65,.2,{label:'Maxilla'});
  for(const x of [-.4,.4]){S(.29,.31,.07,'BLACK',x,2.12,.51,{label:x>0?'Orbit':undefined});T(.3,.06,'LIGHT',x,2.12,.5);}
  S(.13,.21,.035,'BLACK',0,1.85,.5,{label:'Nasal aperture'});for(let i=0;i<8;i++)B(.09,.16,.1,'LIGHT',-.38+i*.11,1.43,.48);
  G('jaw',0,1.8,-.15);for(const x of [-.62,.62])L([x,0,0],[x,-.65,.45],.09,'LIGHT');P([[-.62,-.65,.45],[-.4,-.82,.65],[.4,-.82,.65],[.62,-.65,.45]],.11,'LIGHT',{label:'Mandible'});for(let i=0;i<8;i++)B(.09,.15,.1,'LIGHT',-.38+i*.11,-.69,.66,{label:i===0?'Lower teeth':undefined});E();
    return {label:"Skull",kind:"hero",pose(t,parts){parts.jaw.rotation.x=.5*t}};
  },
  skeletonarm(c, rand) {
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    // Hinge remains at the distal humerus; pronation is a nested axial rotation.
  const scap=new THREE.ConeGeometry(.4,.75,3);scap.scale(1,1,.2);c.geom(scap,CELL.LIGHT,{x:-.3,y:3.25,label:'Scapula'});
  S(.2,.2,.2,'LIGHT',0,3.2,0,{label:'Shoulder head'});L([0,3.15,0],[0,2.05,0],.11,'LIGHT',{label:'Humerus'});S(.18,.18,.16,'LIGHT',0,2.05);
  G('elbow',0,2.05);G('forearm');for(const s of [-1,1]){L([s*.1,-.05,0],[s*.13,-.95,0],.065,'LIGHT',{label:s>0?'Radius':'Ulna'});S(.1,.08,.09,'LIGHT',s*.12,-.95);}
  for(let i=0;i<8;i++)S(.055,.06,.06,'LIGHT',-.16+(i%4)*.1,-1.1-Math.floor(i/4)*.11,0,{label:i===0?'Carpal bones':undefined});
  for(let i=0;i<5;i++){const x=-.2+i*.1;L([x,-1.23,0],[x*1.25,-1.47,0],.025,'LIGHT',{label:i===0?'Metacarpals':undefined});for(let j=0;j<3;j++)L([x*1.25,-1.49-j*.1,0],[x*1.25,-1.57-j*.1,0],.022,'LIGHT',{label:i===4&&j===0?'Phalanges':undefined});}E();E();
    return {label:"Arm and hand bones",kind:"hero",pose(t,parts){parts.elbow.rotation.z=t*2*Math.PI/3;parts.forearm.rotation.y=t*Math.PI*.65}};
  },
  spine(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    // Twenty-four small hinges share 20 degrees; discs and cord segments follow each joint.
  S(.3,.28,.16,'LIGHT',0,.35,0,{label:'Sacrum'});S(.08,.16,.06,'LIGHT',0,.18,.05,{label:'Coccyx'});
  const zz=y=>.13*Math.sin((y-.5)*3.1);let previous=[0,.5,zz(.5)];G('v0',...previous);
  for(let i=0;i<24;i++){const y=.5+i*.125,z=zz(y),r=i<5?.2:(i<17?.16:.13);if(i){G('v'+i,0,.125,z-previous[2]);}C(r,.075,'LIGHT',0,0,0,{label:i===0?'Lumbar vertebrae':i===5?'Thoracic vertebrae':i===17?'Cervical vertebrae':undefined});C(r*.9,.035,'GLASS',0,.057,0,{label:i===10?'Intervertebral disc':undefined});B(.38,.04,.065,'LIGHT',0,0,-.07);B(.055,.045,.22,'LIGHT',0,0,-.15);C(.025,.125,'ACCENT2',0,.04,-.09,{label:i===18?'Spinal cord':undefined});previous=[0,y,z];}for(let i=0;i<24;i++)E();
    return {label:"Spine",kind:"hero",pose(t,parts){for(let i=0;i<24;i++)parts['v'+i].rotation.x=t*(20*Math.PI/180)/24}};
  },
  lungs(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    C(.14,.65,'LIGHT',0,3.2,0,{label:'Trachea'});for(let i=0;i<5;i++)T(.145,.025,'STONE',0,2.95+i*.12,0,{rx:Math.PI/2});
  G('lungs',0,1.8);for(const s of [-1,1]){const count=s<0?3:2;for(let i=0;i<count;i++)S(.58,.48,.25,'ACCENT2',s*.75,.6-i*.55,-.35,{label:i===0?(s<0?'Right upper lobe':'Left upper lobe'):(s<0&&i===1?'Right middle lobe':(s<0?'Right lower lobe':'Left lower lobe'))});
  const branch=(a,dir,level)=>{const b=[a[0]+dir*.25,a[1]-.32,a[2]];L(a,b,.055/(1+level*.3),'LIGHT',{label:level===0&&s>0?'Main bronchus':undefined});if(level<2)for(const d of [-1,1])branch(b,dir+d*.55,level+1);};branch([0,1,0],s,0);}E();
  G('diaphragm',0,.55);S(1.45,.32,.7,'CLOTH',0,0,0,{label:'Diaphragm'});E();
    return {label:"Lungs",kind:"hero",pose(t,parts){const b=(1-Math.cos(t*Math.PI*2))*.5;parts.lungs.scale.setScalar(1+.08*b);parts.diaphragm.scale.y=1-.45*b;parts.diaphragm.position.y=.55-.12*b},loop:4};
  },
  brainlobes(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    C(.65,.22,'STONE',0,.11);C(.15,.6,'LIGHT',0,.5);S(.4,.35,.45,'WOOD',0,.7,-.35);for(const [x,y,z,k] of [[-.42,1.4,.3,'ACCENT'],[.42,1.4,.3,'ACCENT2'],[-.42,1.35,-.4,'STONE'],[.42,1.35,-.4,'LIGHT']])S(.65,.55,.65,k,x,y,z);
    return {label:"Brain lobes",kind:"landmark"};
  },
  eye(c, rand) {
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const P=(pts,r,k,o={})=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));c.geom(new THREE.TubeGeometry(curve,48,r,6,false),CELL[k],o);return curve;};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    // Sagittal section open toward +z; optical axis runs along X.
  const half=(r,k,label)=>{const g=new THREE.SphereGeometry(r,24,16,Math.PI,Math.PI);c.geom(g,CELL[k],{y:1.8,label});};half(1.2,'LIGHT','Sclera');half(1.12,'RED','Retina');half(1.04,'GLASS','Vitreous');
  P([[-1.05,1.8,-.25],[-1.5,1.7,-.3],[-1.9,1.65,-.3]],.13,'ACCENT2',{label:'Optic nerve'});
  S(.22,.66,.32,'GLASS',1.08,1.8,-.1,{label:'Cornea'});
  G('iris',.82,1.8);T(.38,.1,'ACCENT',0,0,0,{ry:Math.PI/2,label:'Iris / pupil opening'});E();
  G('lens',.57,1.8);S(.16,.49,.22,'LIGHT',0,0,-.05,{label:'Lens'});E();
  for(let i=0;i<6;i++){const a=Math.PI+i*Math.PI/5;P([[-.6,1.8+.9*Math.cos(a),.85*Math.sin(a)],[-.1,1.8+1.2*Math.cos(a),1.1*Math.sin(a)],[.6,1.8+.9*Math.cos(a),.85*Math.sin(a)]],.045,'CLOTH',{label:i===0?'Extraocular muscles':undefined});}
    return {label:"Eye",kind:"hero",pose(t,parts){parts.iris.scale.set(1,1-.22*t,1-.22*t);parts.lens.scale.x=1+.6*t}};
  },
  mayapyramid(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    for(let i=0;i<6;i++)B(2.7-i*.36,.25,2.7-i*.36,'STONE',0,.125+i*.25);B(.65,.55,.6,'STONE',0,1.78);B(.2,.35,.03,'BLACK',0,1.65,.32);for(let i=0;i<10;i++)B(.5,.14,.13,'STONE_DARK',0,.07+i*.14,1.3-i*.1);
    return {label:"Maya pyramid",kind:"landmark"};
  },
  stelae(c, rand) {
    const B = (w,h,d,k,x=0,y=0,z=0,label) => c.geom(new THREE.BoxGeometry(w,h,d),k,{x,y,z,label});
    const tile = (w=5.7,d=3.7) => B(w,.16,d,CELL.STONE,0,.08,0);

    tile(3.1,2.7);B(2.89,.2,1.92,CELL.STONE,0,.26,-.08);for(let i=0;i<3;i++){const x=-.92+i*.92,h=[1.55,2.1,1.78][i];B(.65,h,.49,CELL.STONE,x,.36+h/2,-.16);for(let j=0;j<5;j++){const y=.55+j*(h-.34)/5;B(.46,.13,.06,CELL.STONE_DARK,x,y,.12);B(.11,.12,.065,CELL.STONE,x+(j%2?.11:-.11),y,.18);}B(.71,.16,.57,CELL.STONE,x,.44+h,-.16);}
    return { label: 'Maya stelae', kind: 'landmark' };
  },
  concentriccastle(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)

  box(2.86,.11,2.67,CELL.GLASS,{y:.055})
    box(2.48,.16,2.27,CELL.EARTH,{y:.19})
    for(const x of [-1.08,1.08])box(.16,.59,1.98,CELL.STONE,{x,y:.565})
    box(2.29,.59,.16,CELL.STONE,{y:.565,z:-.94})
    for(const x of [-.78,.78])box(.63,.59,.16,CELL.STONE,{x,y:.565,z:.94})
    for(const x of [-.68,.68])box(.14,.86,1.31,CELL.STONE,{x,y:.70,z:-.12})
    box(1.49,.86,.14,CELL.STONE,{y:.70,z:-.73})
    box(.62,1.21,.63,CELL.STONE,{y:.875,z:-.25})
    for(const x of [-1.06,1.06])for(const z of [-.93,.93]){
      cyl(.20,.91,CELL.STONE,{x,y:.725,z},10)
      for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.13,.16,.13,CELL.STONE,{x:x+.135*Math.sin(a),y:1.26,z:z+.135*Math.cos(a)})}
    }
    for(const x of [-.19,.19])box(.18,.79,.31,CELL.STONE,{x,y:.665,z:1.00})
    box(.65,.19,.35,CELL.STONE,{y:1.09,z:1.00})
    box(.34,.045,.53,CELL.WOOD,{y:.285,z:1.15})
    for(const x of [-.87,-.44,0,.44,.87])box(.21,.15,.19,CELL.STONE,{x,y:.935,z:-.94})
    return {label:'Concentric castle',kind:'landmark'}
  },
  motteandbailey(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }
    const roof=(w,h,d,cell,o={})=>plate([[-w/2,0],[w/2,0],[0,h]],d,cell,{...o,z:(o.z||0)-d/2})

  cyl(1.49,.10,CELL.EARTH,{y:.05},20)
    c.geom(new THREE.TorusGeometry(1.34,.07,6,24),CELL.STONE_DARK,{y:.10,rx:Math.PI/2})
    c.geom(new THREE.CylinderGeometry(.47,.74,.63,12),CELL.EARTH,{x:-.48,y:.415,z:-.29})
    box(.66,.74,.60,CELL.WOOD,{x:-.48,y:1.10,z:-.29})
    roof(.78,.33,.74,CELL.WOOD,{x:-.48,y:1.47,z:-.29})
    for(let i=0;i<23;i++){
      const a=i*Math.PI*2/24;if(i===6)continue
      cyl(.057,.38,CELL.WOOD,{x:1.19*Math.sin(a),y:.29,z:1.19*Math.cos(a)},6)
    }
    for(const [x,z]of [[.62,-.22],[.38,.64]]){
      box(.48,.33,.42,CELL.WOOD,{x,y:.265,z});roof(.57,.24,.51,CELL.CLOTH,{x,y:.43,z})
    }
    return {label:'Motte-and-bailey castle',kind:'landmark'}
  },
  japanesecastle(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }

  box(2.43,.07,2.12,CELL.GLASS,{y:.035})
    c.geom(new THREE.CylinderGeometry(.90,1.16,.43,4),CELL.STONE,{y:.285,ry:Math.PI/4})
    for(let i=0;i<5;i++){
      const w=1.34-i*.18,d=1.05-i*.13,y=.50+i*.38
      box(w,.30,d,CELL.LIGHT,{y:y+.15})
      // Upturned eaves are a shallow polygonal roof section, not flat cones.
      plate([[-w*.61,.11],[-w*.48,.04],[0,.26],[w*.48,.04],[w*.61,.11],[w*.52,-.04],[0,.12],[-w*.52,-.04]],d*1.24,CELL.ACCENT,{y:y+.32,z:-d*.62})
      box(w*.58,.12,.025,CELL.STONE_DARK,{y:y+.16,z:d/2+.016})
    }
    return {label:'Japanese castle tenshu',kind:'landmark'}
  },
  crusadercastle(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }
    const arch=(w,h,d,cell,o={})=>{
      const p=[[-w/2,0],[-w/2,h-w/2]]
      for(let i=0;i<=12;i++){const a=Math.PI-i*Math.PI/12;p.push([w/2*Math.cos(a),h-w/2+w/2*Math.sin(a)])}
      p.push([w/2,0]);plate(p,d,cell,o)
    }

  c.geom(new THREE.CylinderGeometry(1.13,1.48,.43,8),CELL.EARTH,{y:.215})
    c.geom(new THREE.CylinderGeometry(1.01,1.21,.37,8),CELL.STONE,{y:.615})
    for(const x of [-.99,.99])box(.18,.57,1.70,CELL.STONE,{x,y:.845})
    for(const z of [-.79,.79])box(2.12,.57,.17,CELL.STONE,{y:.845,z})
    box(1.18,.84,.96,CELL.STONE,{y:1.22,z:-.13})
    for(const x of [-.61,.61])for(const z of [-.58,.40]){
      cyl(.22,1.04,CELL.STONE,{x,y:1.23,z},10)
      cyl(.24,.10,CELL.STONE_DARK,{x,y:1.80,z},10)
    }
    for(const x of [-.92,0,.92])cyl(.22,.74,CELL.STONE,{x,y:.995,z:.81},10)
    arch(.29,.40,.027,CELL.STONE_DARK,{x:.25,y:.59,z:.907})
    for(let i=0;i<7;i++)box(.16,.14,.18,CELL.STONE,{x:-.87+i*.29,y:1.20,z:-.79})
    return {label:'Krak des Chevaliers',kind:'landmark'}
  },
  trebuchet(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    // Compact 5:1 arm. Nested counterweight counter-rotates to remain plumb.
  for(const z of [-.5,.5])B(3.8,.16,.18,'WOOD',0,.08,z,{label:z>0?'Skid':undefined});
  for(const x of [-1.4,0,1.4])B(.15,.15,1.25,'WOOD',x,.15);
  for(const z of [-.5,.5])for(const s of [-1,1])L([s*.85,.2,z],[0,1.9,z],.095,'WOOD',{label:s>0&&z>0?'A-frame':undefined});
  C(.085,1.4,'METAL',0,1.9,0,{rx:Math.PI/2,label:'Axle'});
  G('arm',0,1.9,0,{rz:.65}); B(2.4,.13,.15,'WOOD',-.8,0,0,{label:'Throwing arm'});
  G('weight',.4,0,0,{rz:-.65});L([0,0,0],[0,-.45,0],.035,'METAL');B(.45,.45,.6,'WOOD',0,-.6,0,{label:'Counterweight'});E();
  // Short sling stays above ground throughout the authored slider range.
  L([-2,0,0],[-2,-.28,0],.022,'CLOTH',{label:'Sling'});S(.12,.12,.12,'STONE',-2,-.34,0,{label:'Stone'});E();
  C(.15,.9,'WOOD',1.5,.4,0,{rx:Math.PI/2,label:'Windlass'});B(.08,.55,.08,'METAL',-1.4,.45,.5,{label:'Trigger'});
    return {label:"Counterweight trebuchet",kind:"hero",pose(t,parts){const a=.65-1.6*t;parts.arm.rotation.z=a;parts.weight.rotation.z=-a}};
  },
  pizzaoven(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    B(2.4,.55,1.8,'STONE',0,.275);S(1,.8,.8,'STONE',0,.81,-.1);S(.45,.45,.03,'BLACK',0,.75,.66);S(.32,.3,.04,'GLOW',0,.7,.7,{emissive:.8});C(.18,.7,'STONE_DARK',0,1.7,-.25);L([.95,.1,.8],[.7,1.6,.65],.035,'WOOD');B(.4,.4,.04,'METAL',.73,1.4,.7,{rz:.2});
    return {label:"Pizza oven",kind:"landmark"};
  },
  mealbench(c, rand) {
    const B = (w,h,d,k,x=0,y=0,z=0,label) => c.geom(new THREE.BoxGeometry(w,h,d),k,{x,y,z,label});
    const C = (r,h,k,x=0,y=0,z=0,rx=0,label) => c.geom(new THREE.CylinderGeometry(r,r,h,16),k,{x,y,z,rx,label});
    const tile = (w=5.7,d=3.7) => B(w,.16,d,CELL.STONE,0,.08,0);

    tile(3.1,2.8);for(const x of [-1.03,1.03])B(.2,.94,.81,CELL.WOOD,x,.63,0);B(2.71,.15,1.72,CELL.WOOD,0,1.175,0);C(.5,.075,CELL.LIGHT,-.58,1.2875,.27);B(.035,.04,.85,CELL.STONE_DARK,-.58,1.345,.27);B(.44,.04,.035,CELL.STONE_DARK,-.34,1.345,.27);B(.57,.19,.5,CELL.METAL,.8,1.345,.36);C(.23,.065,CELL.LIGHT,.8,1.4725,.36);for(const x of [-.77,0,.77]){C(.18,.4,CELL.GLASS,x,1.45,-.48);C(.2,.07,CELL.METAL,x,1.685,-.48);B(.21,.16,.055,CELL.LIGHT,x,1.46,-.27);}
    return { label: 'Nutrition bench', kind: 'landmark' };
  },
  bakery(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    B(4.90,.13,3.20,CELL.STONE,{y:.065,label:'Bakery floor'});B(1.96,.73,1.56,CELL.STONE,{x:-1.12,y:.495,z:-.23,label:'Oven hearth'});
    c.geom(new THREE.SphereGeometry(1.03,16,8,0,Math.PI*2,0,Math.PI/2),CELL.EARTH,{x:-1.12,y:.86,z:-.23,label:'Brick dome'});
    A(.78,.87,.16,.20,CELL.STONE,{x:-1.12,y:.85,z:.66,label:'Oven arch'});B(.76,.52,.04,CELL.BLACK,{x:-1.12,y:1.13,z:.785});
    c.group('fire',{x:-1.12,y:1.12,z:.815});E(.32,.24,.015,CELL.GLOW,{emissive:.85,label:'Oven glow'});c.end();
    B(.35,.83,.36,CELL.EARTH,{x:-1.22,y:2.08,z:-.65});
    for(const x of [.59,1.81])for(const z of [-1.05,-.48])B(.06,2.33,.06,CELL.METAL,{x,y:1.30,z});
    for(let j=0;j<4;j++){B(1.33,.06,.70,CELL.WOOD,{x:1.2,y:.48+j*.51,z:-.76,label:j===0?'Proofing rack':undefined});for(let k=0;k<3;k++)E(.15,.10,.24,CELL.EARTH,{x:.78+k*.41,y:.61+j*.51,z:-.76});}
    for(const x of [.34,1.9])B(.12,.8,.12,CELL.WOOD,{x,y:.53,z:.89});B(1.98,.11,.82,CELL.WOOD,{x:1.12,y:.98,z:.89,label:'Bread counter'});
    for(let i=0;i<3;i++)E(.11,.10,.31,CELL.EARTH,{x:.50+i*.32,y:1.13,z:.88,ry:.15});E(.27,.18,.27,CELL.EARTH,{x:1.68,y:1.2,z:.86});
    E(.31,.44,.26,CELL.CLOTH,{x:-2.02,y:.57,z:1.02,label:'Flour sack'});rod([-1.6,.24,1.40],[-.4,1.90,.98],.037,CELL.WOOD,{label:'Baking peel'});B(.38,.43,.065,CELL.WOOD,{x:-.42,y:1.85,z:.98,rz:-.57});
    return {label:'Bread oven and bakery',kind:'hero',loop:3,pose(t,p){p.fire.scale.setScalar(.78+.22*Math.sin(Math.PI*t)**2);}};
  },
  millstone(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const pack=(geos,k,o={})=>{const p=[],n=[];for(const a of geos){const g=a.index?a.toNonIndexed():a;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));c.geom(g,k,o);};
    C(.78,.28,CELL.STONE,{y:.14});
    const geos=[new THREE.CylinderGeometry(.76,.76,.22,24)];for(let i=0;i<8;i++){const g=new THREE.BoxGeometry(.40,.015,.025);g.translate(.43,.117,0);g.rotateY(i*Math.PI/4);geos.push(g);}const handle=new THREE.CylinderGeometry(.045,.045,.40,8);handle.translate(.61,.29,0);geos.push(handle);pack(geos,CELL.STONE,{y:.40,spin:.38});
    for(const x of [-.91,.91])B(.08,1.18,.08,CELL.WOOD,{x,y:.59,z:-.21});B(1.9,.08,.14,CELL.WOOD,{y:1.16,z:-.21});
    c.geom(new THREE.CylinderGeometry(.39,.12,.49,4,1,true),CELL.WOOD,{y:1.12});C(.29,.04,CELL.EARTH,{y:1.34},8);
    for(let i=0;i<5;i++)E(.12,.015,.085,CELL.LIGHT,{x:-.63+i*.28,y:.018,z:.93+rand()*.15});
    return {label:'Flour millstones',kind:'landmark'};
  },
  picnictable(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    B(2.46,.12,.94,CELL.WOOD,{y:.86});for(const z of [-.87,.87])B(2.46,.11,.36,CELL.WOOD,{y:.49,z});
    for(const x of [-.84,.84])for(const s of [-1,1])rod([x,.04,s*.80],[x,.79,s*.27],.06,CELL.WOOD);
    B(1.10,.015,.96,CELL.CLOTH,{y:.928});for(const x of [-.36,0,.36])B(.11,.012,.96,CELL.LIGHT,{x,y:.941});for(const z of [-.29,.06,.38])B(1.10,.015,.095,CELL.LIGHT,{y:.951,z});
    for(const x of [-.83,.83])C(.23,.035,CELL.LIGHT,{x,y:.95});B(.26,.08,.25,CELL.LIGHT,{x:.15,y:.99,z:.22});C(.075,.30,CELL.RED,{x:-.24,y:1.11,z:-.19});C(.045,.07,CELL.LIGHT,{x:-.24,y:1.29,z:-.19});
    return {label:'Barbecue picnic table',kind:'landmark'};
  },
  spicerack(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    for(const x of [-1,1])B(.1,1.7,.4,'WOOD',x,.85);for(const y of [.15,.85,1.6])B(2.1,.1,.55,'WOOD',0,y);for(let i=0;i<8;i++){const x=-.75+(i%4)*.5,y=.42+Math.floor(i/4)*.72;C(.15,.38,['ACCENT','ACCENT2','RED','LIGHT'][i%4],x,y);C(.16,.04,'METAL',x,y+.21);}C(.3,.25,'STONE',.3,.15,.7,{},.2);L([.3,.2,.7],[.7,.65,.7],.08,'STONE');
    return {label:"Spice rack",kind:"landmark"};
  },
  chefknife(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    B(2.7,.14,1.6,'WOOD',0,.07);B(1.4,.4,.055,'METAL',-.2,.37,0,{rz:-.1});B(.7,.18,.12,'METAL_DARK',.85,.5,0);for(let i=0;i<3;i++)C(.22,.1,'ACCENT',-.6+i*.5,.22,.55);
    return {label:"Chef's knife",kind:"landmark"};
  },
  saturnv(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 16) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Rocket alone: 2.86 tall / 0.26 diameter = 11. Pad and travel fit below 4.
    // S-IC and S-II share the maximum diameter; S-IVB is narrower.
    box(1.35, 0.12, 1.15, CELL.STONE, { y: 0.06, label: 'Launch pad' })
    box(0.48, 0.015, 0.92, CELL.BLACK, { y: 0.1275 })
    for (const x of [-0.32, 0.32]) box(0.16, 0.10, 0.42, CELL.METAL_DARK, { x, y: 0.17 })
    c.group('rocket', { y: 0.14 })
    // Closed double-wall bell profiles remain visible with single-sided materials.
    const bell = new THREE.LatheGeometry([
      new THREE.Vector2(0.037, 0), new THREE.Vector2(0.025, 0.045),
      new THREE.Vector2(0.014, 0.11), new THREE.Vector2(0.009, 0.11),
      new THREE.Vector2(0.020, 0.045), new THREE.Vector2(0.030, 0),
      new THREE.Vector2(0.037, 0)
    ], 10)
    for (const [x, z] of [[0, 0], [-0.059, -0.059], [0.059, -0.059], [-0.059, 0.059], [0.059, 0.059]]) {
      c.geom(bell.clone(), CELL.METAL_DARK, { x, z, label: x === 0 ? 'Five F-1 engines' : undefined })
    }
    cyl(0.13, 0.99, CELL.LIGHT, { y: 0.605, label: 'S-IC first stage' })
    cyl(0.133, 0.10, CELL.LIGHT, { y: 1.15, label: 'S-IC / S-II interstage' })
    cyl(0.13, 0.63, CELL.LIGHT, { y: 1.515, label: 'S-II second stage' })
    c.geom(new THREE.CylinderGeometry(0.085, 0.13, 0.12, 16), CELL.LIGHT, { y: 1.89, label: 'S-II / S-IVB interstage' })
    cyl(0.085, 0.33, CELL.LIGHT, { y: 2.115, label: 'S-IVB third stage' })
    cyl(0.087, 0.035, CELL.BLACK, { y: 2.2975 })
    c.geom(new THREE.CylinderGeometry(0.047, 0.085, 0.135, 16), CELL.LIGHT, { y: 2.3825 })
    cyl(0.047, 0.12, CELL.METAL, { y: 2.51, label: 'Apollo service module' })
    c.geom(new THREE.ConeGeometry(0.047, 0.10, 12), CELL.LIGHT, { y: 2.62, label: 'Command module' })
    cyl(0.013, 0.14, CELL.LIGHT, { y: 2.74, label: 'Launch escape tower' })
    c.geom(new THREE.ConeGeometry(0.016, 0.05, 8), CELL.LIGHT, { y: 2.835 })
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2
      for (const [y, h] of [[0.29, 0.30], [1.10, 0.20], [1.73, 0.13]]) {
        box(0.075, h, 0.018, CELL.BLACK, { x: Math.sin(a) * 0.124, y, z: Math.cos(a) * 0.124, ry: a })
      }
      const fin = new THREE.Shape()
      fin.moveTo(0.11, 0.13); fin.lineTo(0.20, 0.13); fin.lineTo(0.13, 0.33); fin.closePath()
      c.geom(new THREE.ExtrudeGeometry(fin, { depth: 0.015, bevelEnabled: false }), CELL.LIGHT, { ry: a, z: -0.0075 })
    }
    c.end()
    c.group('exhaust', { y: 0.14 })
    const plume = new THREE.CylinderGeometry(0.08, 0.23, 1, 12)
    plume.translate(0, 0.5, 0)
    c.geom(plume, CELL.GLOW, { emissive: 0.85 })
    c.end()
    return {
      label: 'Saturn V', kind: 'hero',
      pose(t, parts) {
        t = Math.max(0, Math.min(1, t))
        parts.rocket.position.y = 0.14 + 0.85 * t
        // Plume grows upward from pad to bells; never protrudes below ground.
        parts.exhaust.scale.y = 0.85 * t
        parts.exhaust.visible = t > 0
      }
    }
  },
  iss(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Classic eight-wing configuration; each wing has two blankets and a mast.
    // Reference: https://www.nasa.gov/image-article/solar-arrays-international-space-station-2/
    for (const y of [1.69, 1.91]) for (const z of [-0.12, 0.12]) {
      box(5.36, 0.055, 0.055, CELL.METAL, { y, z, label: y === 1.91 && z > 0 ? 'Integrated truss' : undefined })
    }
    for (let i = -5; i <= 5; i++) {
      box(0.055, 0.26, 0.29, CELL.METAL, { x: i * 0.50, y: 1.80 })
      if (i < 5) box(0.53, 0.04, 0.04, CELL.METAL, { x: i * 0.50 + 0.25, y: 1.80, z: 0.14, rz: i % 2 ? -0.42 : 0.42 })
    }
    // Two shared coaxial pivots preserve the two-group animation budget.
    for (const side of [-1, 1]) {
      c.group(side < 0 ? 'solarL' : 'solarR', { y: 1.80 })
      for (const x of [side * 1.43, side * 2.32]) for (const end of [-1, 1]) {
        if (end < 0) box(0.045, 0.07, 3.40, CELL.METAL_DARK, { x })
        for (const offset of [-0.18, 0.18]) {
          box(0.30, 0.035, 1.40, CELL.GLASS, { x: x + offset, z: end * 0.99,
            label: Math.abs(x) === 2.32 && offset < 0 && end > 0 ? (side < 0 ? 'Port solar wings' : 'Starboard solar wings') : undefined })
        }
        for (const z of [end * 0.31, end * 1.67]) box(0.73, 0.055, 0.045, CELL.METAL, { x, z })
      }
      c.end()
    }
    cyl(0.19, 1.07, CELL.LIGHT, { y: 1.57, z: 0.18, rx: Math.PI / 2, label: 'Destiny laboratory' })
    cyl(0.22, 0.32, CELL.LIGHT, { y: 1.57, z: 0.88, rx: Math.PI / 2, label: 'Harmony node' })
    cyl(0.16, 0.65, CELL.LIGHT, { x: -0.50, y: 1.57, z: 0.85, rz: Math.PI / 2, label: 'Kibo laboratory' })
    cyl(0.14, 0.58, CELL.LIGHT, { x: 0.47, y: 1.57, z: 0.85, rz: Math.PI / 2, label: 'Columbus laboratory' })
    cyl(0.18, 0.83, CELL.METAL, { y: 1.57, z: -0.77, rx: Math.PI / 2, label: 'Russian segment' })
    c.geom(new THREE.CylinderGeometry(0.085, 0.17, 0.30, 10), CELL.LIGHT, { y: 1.57, z: 1.19, rx: Math.PI / 2, label: 'Docking adapter' })
    for (const x of [-0.81, 0.81]) {
      box(0.44, 0.06, 1.01, CELL.LIGHT, { x, y: 1.63, z: -0.76, rz: x < 0 ? -0.3 : 0.3, label: x < 0 ? 'Thermal radiators' : undefined })
    }
    return {
      label: 'International Space Station', kind: 'hero',
      pose(t, parts) {
        const a = (Math.max(0, Math.min(1, t)) - 0.5) * 1.1
        parts.solarL.rotation.x = a
        parts.solarR.rotation.x = a
      }
    }
  },
  jwst(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const beam = (a, b, w, cell, label) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
      // With XYZ Euler, rotate an upright beam about Z then X.
      box(w, Math.hypot(dx, dy, dz), w, cell, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2,
        rx: Math.atan2(dz, dy), rz: -Math.atan2(dx, Math.hypot(dy, dz)), label })
    }
    box(0.77, 0.27, 0.94, CELL.METAL_DARK, { y: 0.175, z: -0.1, label: 'Spacecraft bus' })
    // Five separate clipped-kite membranes, never a solid stack of diamonds.
    for (let i = 0; i < 5; i++) {
      const k = 1 - i * 0.035, s = new THREE.Shape()
      s.moveTo(0, -2.28 * k); s.lineTo(1.57 * k, -0.47 * k)
      s.lineTo(1.48 * k, 0.64 * k); s.lineTo(0, 2.28 * k)
      s.lineTo(-1.48 * k, 0.64 * k); s.lineTo(-1.57 * k, -0.47 * k); s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, CELL.LIGHT, { y: 0.36 + i * 0.09, label: i === 0 ? 'Five-layer sunshield' : undefined })
    }
    box(0.17, 1.0, 0.17, CELL.METAL_DARK, { y: 1.24, z: -0.18, label: 'Deployable tower' })
    box(1.22, 1.57, 0.10, CELL.METAL_DARK, { y: 2.18, z: -0.10, label: 'Mirror backplane' })
    // Hex-grid radius 2 minus center: exactly 18. The outer columns have 3 each.
    const radius = 0.29, spacing = 0.30, centerY = 2.18
    const hex = () => {
      const g = new THREE.CylinderGeometry(radius, radius, 0.075, 6)
      g.rotateY(Math.PI / 6); g.rotateX(Math.PI / 2)
      return g
    }
    for (const q of [-1, 0, 1]) for (let r = -2; r <= 2; r++) {
      if (Math.abs(q + r) > 2 || (q === 0 && r === 0)) continue
      c.geom(hex(), CELL.ACCENT, { x: 1.5 * spacing * q, y: centerY + Math.sqrt(3) * spacing * (r + q / 2),
        label: q === 0 && r === 1 ? 'Primary mirror segments' : undefined })
    }
    for (const side of [-1, 1]) {
      const hinge = side * 0.705
      c.group(side < 0 ? 'mirrorL' : 'mirrorR', { x: hinge, y: centerY, z: -0.045 })
      box(0.40, 1.46, 0.07, CELL.METAL_DARK, { x: side * 0.195, z: -0.045 })
      for (const row of [-1, 0, 1]) {
        c.geom(hex(), CELL.ACCENT, { x: side * 0.90 - hinge, y: row * Math.sqrt(3) * spacing, z: 0.045,
          label: row === 0 ? (side < 0 ? 'Port mirror wing' : 'Starboard mirror wing') : undefined })
      }
      c.end()
    }
    // Tripod attaches to the stationary backplane, leaving both wings free.
    for (const a of [[-0.57, 2.85, -0.03], [0.57, 2.85, -0.03], [0, 1.22, -0.03]]) {
      beam(a, [0, 2.18, 1.05], 0.04, CELL.METAL_DARK)
    }
    c.geom(new THREE.CylinderGeometry(0.13, 0.13, 0.075, 12), CELL.METAL, { y: 2.18, z: 1.05, rx: Math.PI / 2, label: 'Secondary mirror' })
    box(0.43, 0.31, 0.47, CELL.METAL_DARK, { y: 1.85, z: -0.37, label: 'Science instruments' })
    return {
      label: 'James Webb Space Telescope', kind: 'hero',
      pose(t, parts) {
        const a = (1 - Math.max(0, Math.min(1, t))) * Math.PI / 2
        parts.mirrorL.rotation.y = -a
        parts.mirrorR.rotation.y = a
      }
    }
  },
  hubble(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 16) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Optical axis +z: aperture and open door face the viewer.
    cyl(0.32, 1.47, CELL.METAL, { y: 1.04, z: 0.14, rx: Math.PI / 2 })
    cyl(0.43, 0.53, CELL.METAL, { y: 1.04, z: -0.86, rx: Math.PI / 2 })
    cyl(0.445, 0.06, CELL.METAL_DARK, { y: 1.04, z: -0.63, rx: Math.PI / 2 })
    cyl(0.327, 0.055, CELL.LIGHT, { y: 1.04, z: 0.89, rx: Math.PI / 2 })
    cyl(0.278, 0.02, CELL.BLACK, { y: 1.04, z: 0.925, rx: Math.PI / 2 })
    c.group('apertureDoor', { y: 1.36, z: 0.89, rx: -0.55 })
    cyl(0.31, 0.045, CELL.METAL, { y: 0.31, rx: Math.PI / 2 })
    c.end()
    box(2.74, 0.07, 0.07, CELL.METAL, { y: 1.04, z: -0.39 })
    for (const side of [-1, 1]) {
      c.group(side < 0 ? 'panelL' : 'panelR', { x: side * 0.99, y: 1.04, z: -0.39, rx: 0.18 })
      box(0.91, 0.06, 1.16, CELL.METAL_DARK)
      box(0.83, 0.025, 1.08, CELL.GLASS, { y: 0.0425 })
      for (const z of [-0.18, 0.18]) box(0.83, 0.035, 0.04, CELL.METAL, { y: 0.0725, z })
      c.end()
    }
    return { label: 'Hubble Space Telescope', kind: 'landmark' }
  },
  launchpad(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    box(3.08, 0.17, 2.76, CELL.STONE, { y: 0.085 })
    // Black trench is exposed between two raised launch-deck shoulders.
    box(0.56, 0.025, 2.31, CELL.BLACK, { x: -0.06, y: 0.1825, z: 0.15 })
    for (const x of [-0.47, 0.35]) box(0.25, 0.22, 1.48, CELL.STONE_DARK, { x, y: 0.28, z: -0.05 })
    const tx = -0.99, tz = -0.57
    for (const x of [tx - 0.23, tx + 0.23]) for (const z of [tz - 0.23, tz + 0.23]) {
      box(0.085, 2.42, 0.085, CELL.METAL, { x, y: 1.38, z })
    }
    for (const y of [0.40, 1.09, 1.78, 2.47]) box(0.58, 0.07, 0.58, CELL.METAL, { x: tx, y, z: tz })
    for (const y of [0.745, 1.435, 2.125]) {
      box(0.065, 0.81, 0.065, CELL.METAL, { x: tx, y, z: tz + 0.23, rz: -0.59 })
      box(0.065, 0.81, 0.065, CELL.METAL, { x: tx, y, z: tz - 0.23, rz: 0.59 })
    }
    for (const y of [0.96, 1.65, 2.34]) {
      box(0.91, 0.09, 0.15, CELL.METAL, { x: -0.34, y, z: tz })
      box(0.13, 0.16, 0.24, CELL.ACCENT, { x: 0.09, y: y - 0.035, z: tz })
    }
    cyl(0.04, 0.27, CELL.METAL, { x: tx, y: 2.725, z: tz })
    cyl(0.065, 0.09, CELL.RED, { x: tx, y: 2.905, z: tz })
    for (const x of [0.83, 1.27]) for (const z of [-0.89, -0.45]) box(0.07, 1.10, 0.07, CELL.METAL, { x, y: 0.72, z })
    cyl(0.39, 0.56, CELL.LIGHT, { x: 1.05, y: 1.51, z: -0.67 })
    c.geom(new THREE.ConeGeometry(0.40, 0.20, 12), CELL.METAL, { x: 1.05, y: 1.89, z: -0.67 })
    box(0.10, 1.14, 0.10, CELL.METAL, { x: 1.05, y: 0.74, z: -0.67 })
    return { label: 'Launch complex', kind: 'landmark' }
  },
  marsrover(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    B(1.7,.35,1.2,'LIGHT',0,.85);for(const x of [-.8,0,.8])for(const z of [-.75,.75]){C(.3,.2,'BLACK',x,.35,z,{rx:Math.PI/2});L([x,.4,z],[x,.75,z*.6],.06,'METAL');}C(.05,.8,'METAL',.45,1.4);B(.5,.25,.3,'METAL_DARK',.45,1.85);L([-.7,.9,.5],[-1.1,1.2,.6],.08,'METAL');L([-1.1,1.2,.6],[-1.2,.6,1],.06,'METAL');C(.2,.6,'ACCENT',-.6,1.3,-.3);
    return {label:"Mars rover",kind:"landmark"};
  },
  moonbase(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    C(1.4,.12,'EARTH',0,.06);for(const [x,z,r] of [[-.65,-.4,.55],[.55,-.5,.4]])c.geom(new THREE.SphereGeometry(r,12,8,0,Math.PI*2,0,Math.PI/2),CELL.LIGHT,{x,y:.15,z});B(.55,.15,.2,'METAL',0,.2,-.5);C(.45,.08,'METAL_DARK',.65,.17,.6);B(.25,.3,.25,'ACCENT',.65,.36,.6);for(const x of [-.95,-.45])B(.4,.04,.65,'ACCENT2',x,.3,.65,{rx:.3});
    return {label:"Moon base",kind:"landmark"};
  },
  satellite(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    G('sat',0,1.3);B(.65,.8,.6,'METAL');for(const s of [-1,1]){B(.85,.06,1.1,'ACCENT2',s*.95);L([s*.3,0,0],[s*.6,0,0],.04,'METAL');for(let i=0;i<3;i++)B(.02,.02,1.1,'METAL',s*.95-.25+i*.25,.04);}S(.4,.14,.4,'LIGHT',0,.6);L([0,.55,0],[0,.9,0],.025,'METAL');E();
    return {label:"Satellite",kind:"landmark",pose(t,parts){parts.sat.rotation.y=t*Math.PI*2},loop:16};
  },
  // END BRAIN PIECES
  }
}
