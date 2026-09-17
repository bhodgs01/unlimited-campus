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
  stonearchbridge(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const outline=[[-2.82,0],[-2.82,1.65],[-1.5,2.12],[0,2.27],[1.5,2.12],[2.82,1.65],[2.82,0],[1.63,0],[1.63,.30]];
    for(let i=0;i<=24;i++){const a=i*Math.PI/24;outline.push([1.63*Math.cos(a),.30+1.63*Math.sin(a)]);}outline.push([-1.63,0]);
    P(outline,1.92,CELL.STONE_DARK,{label:'Masonry spandrel'});
    for(const z of [-1.025,1.025]){
      for(let i=0;i<15;i++){const a=i*Math.PI/15+.015,b=(i+1)*Math.PI/15-.015;P([[1.63*Math.cos(a),.3+1.63*Math.sin(a)],[1.96*Math.cos(a),.3+1.96*Math.sin(a)],[1.96*Math.cos(b),.3+1.96*Math.sin(b)],[1.63*Math.cos(b),.3+1.63*Math.sin(b)]],.18,i===7?CELL.LIGHT:CELL.STONE,{z,label:i===7?'Keystone':i===2?'Voussoirs':undefined});}
      for(const x of [-2.23,2.23])for(let j=0;j<4;j++)B(1.13,.30,.18,CELL.STONE,{x,y:.16+j*.33,z});
    }
    for(let i=0;i<14;i++){const x=-2.6+i*.4,road=2.31-.082*x*x;
      B(.397,.10,1.97,CELL.STONE,{x,y:road,rz:-.164*x,label:i===6?'Cambered roadway':undefined});
      for(const z of [-1.05,1.05]){B(.389,.42,.23,CELL.STONE,{x,y:road+.24,z,rz:-.164*x});B(.402,.10,.31,CELL.LIGHT,{x,y:road+.48,z,rz:-.164*x,label:i===4&&z>0?'Parapet coping':undefined});}
    }
    // Static terrain architecture: the pose contract intentionally leaves masonry fixed.
    return {label:'Single-arch stone bridge',kind:'hero',pose(t,p){}};
  },
  plankbridge(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,r,6,false),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    // World span: 8-unit clear gap; abutments flare outside the gap to meet turf.
    B(.48,.35,2.2,CELL.STONE,{x:-4.05,y:.105,label:'West abutment'});
    B(.48,.35,2.2,CELL.STONE,{x:4.05,y:.105,label:'East abutment'});
    for(const side of [-1,1]){
      P([[0,0],[.65,0],[.65,.43],[0,.015]],2.32,CELL.WOOD,{x:side===1?4.65:-4.65,ry:side===1?Math.PI:0,label:'Flared landing'});
      c.group(side===-1?'leftSpan':'rightSpan',{x:side*4,y:.38});
      const dir=-side;
      for(const z of [-.71,.71])B(4,.14,.16,CELL.WOOD,{x:dir*2,y:-.12,z,label:z<0?'Stringer':undefined});
      for(let i=0;i<12;i++)B(.303,.10,1.88,CELL.WOOD,{x:dir*(i+.5)/3,y:0,ry:(rand()-.5)*.012});
      for(const z of [-.98,.98]){
        for(let i=0;i<=4;i++){const x=dir*(.06+i*.96);B(.105,.79,.105,CELL.WOOD,{x,y:.38,z});C(.085,.055,CELL.METAL_DARK,{x,y:.74,z});}
        T([[dir*.06,.72,z],[dir*1,.66,z],[dir*2,.64,z],[dir*3,.66,z],[dir*4,.72,z]],.033,CELL.CLOTH,{label:z>0?'Rope handrail':undefined});
      }
      c.end();
    }
    return {label:'Timber crossing',kind:'hero',loop:4,pose(t,p){const a=Math.asin(.15/4)*Math.sin(Math.PI*t)**2;p.leftSpan.rotation.z=-a;p.rightSpan.rotation.z=a;}};
  },
  ropebridge(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,r,6,false),k,o);
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    // The suspended deck is lowest at the centre; only the span rolls about its length.
    const deck=x=>.30+.58*(Math.cosh(x/2.5)-1)/(Math.cosh(2.55/2.5)-1);
    for(const x of [-2.66,2.66])for(const z of [-.99,.99]){
      C(.22,.18,CELL.STONE,{x,y:.04,z,label:z<0?'Anchor footing':undefined});
      C(.115,2.10,CELL.WOOD,{x,y:1.05,z,label:z>0?'Anchor post':undefined});
      R(.12,.035,CELL.METAL_DARK,{x,y:1.88,z,rx:Math.PI/2});
      rod([x,.22,z],[x-Math.sign(x)*.36,1.22,z],.055,CELL.WOOD);
    }
    c.group('span',{y:.85});
    for(let i=0;i<18;i++){const x=-2.49+i*.293;B(.26,.09,1.66,CELL.WOOD,{x,y:deck(x)-.85,rz:Math.atan(.58*Math.sinh(x/2.5)/(2.5*(Math.cosh(2.55/2.5)-1)))*.6,label:i===8?'Slung planks':undefined});}
    for(const z of [-.9,.9]){
      const top=[],bottom=[];
      for(let i=0;i<=16;i++){const x=-2.55+i*5.1/16;top.push([x,deck(x)+.95-.85,z]);bottom.push([x,deck(x)-.91,z]);}
      T(top,.045,CELL.CLOTH,{label:z>0?'Hanging handrope':'Suspension rope'});T(bottom,.045,CELL.CLOTH);
      for(let i=0;i<=10;i++){const x=-2.5+i*.5;rod([x,deck(x)-.86,z],[x,deck(x)+.10,z],.025,CELL.CLOTH);}
    }
    c.end();
    for(const x of [-2.64,2.64]){B(.48,.16,1.84,CELL.WOOD,{x,y:.78,label:x>0?'Landing tread':undefined});B(.5,.63,1.68,CELL.STONE,{x,y:.315});}
    return {label:'Suspension footbridge',kind:'hero',loop:6,pose(t,p){p.span.rotation.x=Math.PI/60*Math.sin(2*Math.PI*t);}};
  },
  suspensionbridge(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    B(5.75,.06,2.14,CELL.GLASS,{y:-.025,label:'River'});
    for(const x of [-1.50,1.50]){
      for(const z of [-.68,.68]){B(.31,2.73,.30,CELL.STONE,{x,y:1.365,z,label:z>0?'Tower leg':undefined});B(.46,.17,.45,CELL.STONE_DARK,{x,y:.08,z});}
      B(.34,.19,1.64,CELL.STONE,{x,y:2.56,label:x<0?'Tower crossbeam':undefined});
    }
    for(const z of [-.69,.69]){
      const pts=[[-2.65,.47,z],[-1.50,2.71,z],[-.75,2.12,z],[0,1.95,z],[.75,2.12,z],[1.5,2.71,z],[2.65,.47,z]];T(pts,.045,CELL.METAL,{label:z>0?'Main cable':undefined});
      for(let i=0;i<7;i++){const x=-1.5+i*.5,h=1.95+.76*(Math.cosh(x/1.5)-1)/(Math.cosh(1)-1);rod([x,.81,z],[x,h,z],.022,CELL.METAL);}
    }
    for(const x of [-2.65,2.65])B(.42,.40,1.67,CELL.STONE,{x,y:.20,label:x<0?'Cable anchorage':undefined});
    c.group('deck',{y:.77});B(5.58,.14,1.32,CELL.STONE,{label:'Suspended roadway'});
    for(const z of [-.62,.62]){B(5.55,.045,.045,CELL.METAL,{y:.35,z});for(let i=0;i<15;i++)B(.028,.35,.028,CELL.METAL,{x:-2.65+i*.378,y:.18,z});}c.end();
    return {label:'Suspension bridge',kind:'hero',loop:6,pose(t,p){p.deck.position.z=.10*Math.sin(2*Math.PI*t);}};
  },
  trussbridge(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    for(const x of [-1.24,1.24])B(.37,.50,1.26,CELL.STONE,{x,y:.25});B(2.85,.12,1.15,CELL.WOOD,{y:.56});
    for(const z of [-.60,.60]){
      rod([-1.40,.66,z],[1.40,.66,z],.043,CELL.METAL);rod([-1.40,1.42,z],[1.40,1.42,z],.043,CELL.METAL);
      for(let i=0;i<7;i++)rod([-1.4+i*.4,.66+(i%2)*.76,z],[-1.4+(i+1)*.4,.66+((i+1)%2)*.76,z],.042,CELL.METAL);
      for(const x of [-1.4,1.4])rod([x,.66,z],[x,1.42,z],.043,CELL.METAL);
    }
    return {label:'Warren truss bridge',kind:'landmark'};
  },
  goldengate(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const beam=(a,b,w,cell,label)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2]
      box(w,Math.hypot(dx,dy,dz),w,cell,{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,rx:Math.atan2(dz,dy),rz:-Math.atan2(dx,Math.hypot(dy,dz)),label})
    }
    const tube=(pts,r,cell,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(16,pts.length*3),r,6,false),cell,o)

  box(3.08,.10,.53,CELL.METAL,{y:.61})
    for(const x of [-.87,.87]){
      for(const z of [-.24,.24])box(.095,1.78,.10,CELL.ACCENT,{x,y:.89,z})
      for(const y of [.94,1.33,1.71])box(.11,.075,.58,CELL.ACCENT,{x,y})
    }
    for(const z of [-.27,.27]){
      // Parabolic span sampled identically for cable and hanger endpoints.
      const points=[[-1.50,.69,z],[-.87,1.77,z]]
      for(let i=1;i<=16;i++){const x=-.87+i*1.74/16;points.push([x,.93+.84*(x/.87)**2,z])}
      points.push([1.50,.69,z]);tube(points,.027,CELL.ACCENT)
      for(const x of [-.65,-.43,-.21,0,.21,.43,.65])beam([x,.66,z],[x,.93+.84*(x/.87)**2,z],.022,CELL.ACCENT)
    }
    box(.91,.085,.69,CELL.LIGHT,{x:-1.02,y:.53,z:.06})
    box(1.01,.07,.68,CELL.LIGHT,{x:.89,y:.54,z:-.03})
    return {label:'Golden Gate Bridge',kind:'landmark'}
  },
  tallship(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const beam=(a,b,w,cell,label)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2]
      box(w,Math.hypot(dx,dy,dz),w,cell,{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,rx:Math.atan2(dz,dy),rz:-Math.atan2(dx,Math.hypot(dy,dz)),label})
    }
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }
    const hull=(l,w,h,cell,o={})=>plate([[-l/2,-w*.35],[-l*.35,-w/2],[l*.30,-w/2],[l/2,0],[l*.30,w/2],[-l*.35,w/2],[-l/2,w*.35]],h,cell,{...o,rx:-Math.PI/2})

  hull(2.76,.77,.24,CELL.WOOD,{y:.05})
    hull(2.80,.81,.065,CELL.ACCENT,{y:.29})
    hull(2.74,.75,.11,CELL.WOOD,{y:.355})
    for(const [x,h]of [[-.86,1.72],[0,2.17],[.83,1.85]]){
      cyl(.044,h,CELL.WOOD,{x,y:.46+h/2})
      for(const [y,w]of [[.98,.72],[1.55,.59]]){
        box(.036,.45,w,CELL.CLOTH,{x,y,z:0,ry:1.10})
        box(.055,.055,w+.13,CELL.WOOD,{x,y:y+.26,ry:1.10})
      }
    }
    beam([1.00,.43,0],[1.55,.79,0],.055,CELL.WOOD)
    box(.52,.21,.59,CELL.WOOD,{x:-.98,y:.56})
    return {label:'Three-masted tall ship',kind:'landmark'}
  },
  fishingboat(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const P=(pts,r,k,o={})=>{const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));c.geom(new THREE.TubeGeometry(curve,48,r,6,false),CELL[k],o);return curve;};
    S(1.4,.35,.65,'WOOD',0,.4);S(1.1,.08,.44,'STONE_DARK',0,.66);B(.3,.6,.4,'METAL_DARK',-1.15,.7);B(.45,.25,.4,'ACCENT',.3,.8);P([[.6,.65,0],[.9,1.7,0],[1.3,2.1,0],[1.4,1.9,0]],.03,'METAL');L([1.4,1.9,0],[1.4,.2,0],.009,'LIGHT');
    return {label:"Fishing boat",kind:"landmark"};
  },
  canoe(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    S(1.45,.35,.55,'WOOD',0,.38);S(1.2,.04,.36,'STONE_DARK',0,.69);for(const x of [-.5,.5])B(.14,.08,.8,'WOOD',x,.7);for(const s of [-1,1]){L([s*.2,.8,-.9],[s*.7,.8,1],.03,'WOOD');S(.13,.035,.32,'LIGHT',s*.65,.8,.85);}
    return {label:"Canoe",kind:"landmark"};
  },
  buoy(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    G('bob',0,.5);C(.45,.3,'ACCENT');C(.15,.9,'METAL',0,.55);C(.23,.2,'GLOW',0,1.05,0,{emissive:.8});c.geom(new THREE.ConeGeometry(.2,.3,8),CELL.ACCENT,{y:1.3});E();
    return {label:"Buoy",kind:"landmark",pose(t,parts){parts.bob.position.y=.5+.12*Math.sin(t*Math.PI*2)},loop:3};
  },
  dockjetty(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,r,6,false),k,o);
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    const R=(r,t,k,o={})=>c.geom(new THREE.TorusGeometry(r,t,6,24),k,o);
    for(const x of [-.73,.73])for(const z of [-2.13,-.65,.94]){C(.12,.81,CELL.WOOD,{x:x-.65,y:.285,z,label:z===.94?'Pier pile':undefined});C(.135,.055,CELL.METAL_DARK,{x:x-.65,y:.64,z});}
    for(const x of [-1.38,.08])B(.14,.22,3.74,CELL.WOOD,{x,y:.54,z:-.53,label:x<0?'Longitudinal bearer':undefined});
    for(let i=0;i<16;i++)B(1.84,.10,.211,CELL.WOOD,{x:-.65,y:.69,z:-2.23+i*.23,ry:(rand()-.5)*.01,label:i===8?'Jetty decking':undefined});
    C(.14,.57,CELL.WOOD,{x:.12,y:1.0,z:1.11,label:'Mooring bollard'});R(.15,.035,CELL.CLOTH,{x:.12,y:1.12,z:1.11,rx:Math.PI/2});
    P([[0,0],[1.08,0],[1.08,.74],[0,.025]],1.84,CELL.WOOD,{x:-.65,z:2.41,ry:Math.PI/2,label:'Shore ramp'});
    c.group('boat',{x:1.33,y:.27,z:.24});
    const plan=[[-.46,-.98],[-.57,-.35],[-.48,.72],[0,1.10],[.48,.72],[.57,-.35],[.46,-.98]];
    const s=new THREE.Shape();plan.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const floor=new THREE.ExtrudeGeometry(s,{depth:.095,bevelEnabled:false});floor.rotateX(-Math.PI/2);c.geom(floor,CELL.WOOD,{label:'Rowboat hull'});
    const rim=plan.map(([x,z])=>[x,.29,z]);rim.push(rim[0]);T(rim,.085,CELL.WOOD,{label:'Gunwale'});
    for(let i=0;i<plan.length;i++){const a=plan[i],b=plan[(i+1)%plan.length];const d=Math.hypot(b[0]-a[0],b[1]-a[1]);B(d,.26,.075,CELL.WOOD,{x:(a[0]+b[0])/2,y:.16,z:(a[1]+b[1])/2,ry:-Math.atan2(b[1]-a[1],b[0]-a[0])});}
    for(const z of [-.52,.24])B(.96,.07,.20,CELL.WOOD,{y:.29,z,label:z<0?'Thwart':undefined});
    rod([-.36,.39,-.7],[.3,.39,.67],.03,CELL.WOOD,{label:'Oar'});B(.14,.055,.35,CELL.WOOD,{x:.32,y:.39,z:.73,ry:.44});c.end();
    T([[.12,1.12,1.11],[.46,.73,1.36],[.86,.43,1.31],[1.33,.52,1.3]],.024,CELL.CLOTH,{label:'Painter line'});
    return {label:'Jetty and rowing boat',kind:'hero',loop:5,pose(t,p){p.boat.rotation.z=.065*Math.sin(2*Math.PI*t);p.boat.position.y=.27+.022*Math.sin(2*Math.PI*t);}};
  },
  longship(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    const beam = (a, b, w, cell, label) => {
      const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2]
      box(w, Math.hypot(dx, dy, dz), w, cell, { x:(a[0]+b[0])/2, y:(a[1]+b[1])/2, z:(a[2]+b[2])/2,
        rx:Math.atan2(dz, dy), rz:-Math.atan2(dx, Math.hypot(dy, dz)), label })
    }
    const tube = (points, radius, cell, o = {}) => c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), Math.max(16, points.length*3), radius, 6, false), cell, o)
    const plate = (points, depth, cell, o = {}) => {
      const s = new THREE.Shape()
      points.forEach(([x,y],i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),cell,o)
    }
    c.group('ship',{y:.16})
    // Open clinker hull: nested narrow outlines, not a solid elliptical block.
    for(let level=0;level<4;level++) {
      const l=2.13+level*.09,w=.27+level*.105,y=.28+level*.13
      const outer=new THREE.Shape(),inner=new THREE.Path()
      const points=[[-l,0],[-l*.69,-w],[l*.69,-w],[l,0],[l*.69,w],[-l*.69,w]]
      points.forEach(([x,z],i)=>i?outer.lineTo(x,z):outer.moveTo(x,z));outer.closePath()
      points.map(([x,z])=>[x*.94,z*.83]).forEach(([x,z],i)=>i?inner.lineTo(x,z):inner.moveTo(x,z));inner.closePath();outer.holes.push(inner)
      const g=new THREE.ExtrudeGeometry(outer,{depth:.14,bevelEnabled:false});g.rotateX(-Math.PI/2)
      c.geom(g,CELL.WOOD,{y,label:level===2?'Clinker planking':undefined})
    }
    box(3.50,.10,.50,CELL.WOOD,{y:.30,label:'Keel and deck'})
    for(const x of [-1.42,-.71,0,.71,1.42])box(.10,.09,1.03,CELL.WOOD,{x,y:.71,label:x===0?'Thwarts':undefined})
    for(const side of [-1,1])tube([[side*1.93,.38,0],[side*2.34,.77,0],[side*2.43,1.26,0],[side*2.26,1.45,0],[side*2.10,1.33,0]],.09,CELL.WOOD,{label:side<0?'Curled stem':undefined})
    cyl(.065,2.70,CELL.WOOD,{y:1.71,label:'Mast'})
    cyl(.05,2.76,CELL.WOOD,{y:2.86,rz:Math.PI/2,label:'Yard'})
    box(2.62,1.31,.045,CELL.CLOTH,{y:2.15,z:.08,label:'Square sail'})
    for(const x of [-1.02,-.34,.34,1.02])box(.24,1.31,.022,CELL.ACCENT,{x,y:2.15,z:.115})
    for(const side of [-1,1]) {
      for(const x of [-1.45,-.87,-.29,.29,.87,1.45]) {
        cyl(.20,.055,CELL.ACCENT,{x,y:.73,z:side*.59,rx:Math.PI/2,label:side<0&&x===-.29?'Gunwale shields':undefined})
        cyl(.045,.07,CELL.METAL_DARK,{x,y:.73,z:side*.62,rx:Math.PI/2})
      }
      for(const x of [-1.15,-.38,.38,1.15])beam([x,.63,side*.43],[x+.19,.18,side*1.16],.045,CELL.WOOD,side>0&&x===.38?'Oars':undefined)
    }
    c.end()
    return {label:'Clinker-built longship',kind:'hero',pose(t,parts){parts.ship.rotation.x=Math.sin(Math.max(0,Math.min(1,t))*Math.PI*2)*Math.PI/90}}
  },
  fountain(c, rand) {
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    C(1.2,.25,'STONE',0,.125);C(1.05,.04,'GLASS',0,.27);C(.15,1.4,'STONE',0,.9);for(const [r,y] of [[.7,.85],[.4,1.5]]){C(r,.12,'STONE',0,y);C(r*.9,.02,'GLASS',0,y+.07);}S(.12,.18,.12,'STONE',0,1.75);
    return {label:"Fountain",kind:"landmark"};
  },
  marketstall(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    for(const x of [-1.15,1.15])for(const z of [-.63,.64])B(.075,2.05,.075,CELL.WOOD,{x,y:1.025,z});
    P([[-1.34,0],[0,.22],[1.34,0],[1.34,-.055],[0,.16],[-1.34,-.055]],1.6,CELL.CLOTH,{y:2.04});
    B(2.47,.12,1.01,CELL.WOOD,{y:.91,z:.13});for(const x of [-.94,.94])B(.1,.84,.10,CELL.WOOD,{x,y:.42,z:.13});
    for(let i=0;i<3;i++){C(.24,.21,CELL.CLOTH,{x:-.76+i*.55,y:1.075,z:.2});E(.21,.15,.20,[CELL.RED,CELL.EARTH,CELL.ACCENT][i],{x:-.76+i*.55,y:1.19,z:.2});}
    for(let i=0;i<2;i++)C(.13,.67,i?CELL.ACCENT:CELL.CLOTH,{x:-.86+i*.30,y:.13,z:-.29,rx:Math.PI/2});
    rod([.92,.97,.12],[.92,1.54,.12],.025,CELL.METAL);rod([.65,1.5,.12],[1.2,1.5,.12],.024,CELL.METAL);for(const x of [.67,1.17]){rod([x,1.5,.12],[x,1.22,.12],.015,CELL.METAL);C(.14,.035,CELL.METAL,{x,y:1.20,z:.12});}
    return {label:'Silk Road spice stall',kind:'landmark'};
  },
  tent(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    B(2.8,.12,2.6,'EARTH',0,.06);for(const s of [-1,1])B(1.65,.07,2,'CLOTH',s*.65,.85,0,{rz:-s*.85});for(const z of [-1,1])for(const s of [-1,1])L([s*1.2,.12,z],[0,1.5,z],.04,'METAL');for(const s of [-1,1])L([s*.7,.8,.8],[s*1.4,.13,1.25],.018,'LIGHT');
    return {label:"Tent",kind:"landmark"};
  },
  torii(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    B(2.6,.1,1.3,'STONE',0,.05);for(const x of [-.85,.85])C(.12,2.3,'RED',x,1.2);B(2.6,.16,.28,'RED',0,2.3);B(2.25,.12,.2,'RED',0,1.85);B(.14,.45,.14,'RED',0,2.05);for(const s of [-1,1])B(.65,.16,.3,'BLACK',s*1,2.46,0,{rz:s*.1});B(1.5,.16,.3,'BLACK',0,2.42);
    return {label:"Torii",kind:"landmark"};
  },
  pagoda(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    for(let i=0;i<5;i++){const w=2.3-i*.32,y=.15+i*.5;B(w*.65,.38,w*.65,'STONE',0,y+.19);c.geom(new THREE.CylinderGeometry(w*.18,w*.55,.2,4),CELL.ACCENT,{y:y+.47,ry:Math.PI/4});for(const s of [-1,1])B(w*.6,.05,.08,'ACCENT',s*w*.23,y+.49,0,{rz:s*.1});}C(.03,.35,'METAL',0,2.75);
    return {label:"Pagoda",kind:"landmark"};
  },
  windmill(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    const beam = (a, b, w, cell, label) => {
      const dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2]
      box(w, Math.hypot(dx, dy, dz), w, cell, { x:(a[0]+b[0])/2, y:(a[1]+b[1])/2, z:(a[2]+b[2])/2,
        rx:Math.atan2(dz, dy), rz:-Math.atan2(dx, Math.hypot(dy, dz)), label })
    }
    const tube = (points, radius, cell, o = {}) => c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), Math.max(16, points.length*3), radius, 6, false), cell, o)
    const plate = (points, depth, cell, o = {}) => {
      const s = new THREE.Shape()
      points.forEach(([x,y],i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),cell,o)
    }
    box(1.30,.13,1.27,CELL.STONE,{y:.065,label:'Trestle base'})
    cyl(.15,1.06,CELL.WOOD,{y:.65,label:'Main post'})
    for(const x of [-.55,.55])beam([x,.15,0],[0,1.02,0],.11,CELL.WOOD)
    c.geom(new THREE.CylinderGeometry(.53,.73,1.24,4),CELL.WOOD,{y:1.69,ry:Math.PI/4,label:'Mill body'})
    c.geom(new THREE.ConeGeometry(.77,.54,4),CELL.ACCENT,{y:2.58,ry:Math.PI/4})
    beam([-.40,1.15,-.34],[-1.34,.12,-1.55],.085,CELL.WOOD,'Tail pole')
    for(const x of [-.20,.20])beam([x,.13,1.10],[x,1.30,.53],.045,CELL.WOOD)
    for(let i=0;i<6;i++)box(.44,.045,.06,CELL.WOOD,{y:.25+i*.17,z:1.04-i*.083,label:i===3?'Ladder':undefined})
    cyl(.13,.29,CELL.METAL_DARK,{y:2.04,z:.62,rx:Math.PI/2,label:'Windshaft'})
    // Offset every lattice member into a common rotor frame before spinning.
    for(let i=0;i<4;i++) {
      const a=i*Math.PI/2
      const part=(w,h,x,y,label)=>{const g=new THREE.BoxGeometry(w,h,.055);g.translate(x,y,0);g.rotateZ(a);c.geom(g,CELL.WOOD,{y:2.04,z:.80,spin:.65,spinAxis:'z',label})}
      part(.065,1.42,0,.73,i===0?'Lattice sails':undefined)
      for(const x of [.12,.40])part(.04,1.08,x,.91)
      for(let j=0;j<5;j++)part(.43,.04,.20,.42+j*.24)
    }
    // Continuous rotor spin is explicitly requested instead of a slider pose.
    return {label:'Medieval post mill',kind:'hero'}
  },
  runningtrack(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const shape=new THREE.Shape();shape.absarc(0,0,1.35,0,Math.PI/2,false);shape.lineTo(0,.65);shape.absarc(0,0,.65,Math.PI/2,0,true);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false,curveSegments:24});g.rotateX(-Math.PI/2);g.translate(-.7,.1,.7);c.geom(g,CELL.RED,{});for(const r of [.75,.93,1.11,1.29])T(r,.012,'LIGHT',-.7,.12,.7,{rx:-Math.PI/2},Math.PI/2);for(const x of [.2,.7])B(.04,.4,.04,'METAL',x,.3,.4);B(.6,.08,.06,'LIGHT',.45,.52,.4);B(.05,1.2,.05,'METAL',-.6,.6,-.5);
    return {label:"Running track",kind:"landmark"};
  },
  stadium(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)

  const g=new THREE.LatheGeometry([[.83,.10],[.95,.26],[1.07,.49],[1.32,.68],[1.39,.68],[1.39,.12],[.83,.10]].map(([x,y])=>new THREE.Vector2(x,y)),28)
    g.scale(1,1,.78);c.geom(g,CELL.STONE)
    const field=new THREE.CylinderGeometry(.86,.86,.04,24);field.scale(1,1,.78);c.geom(field,CELL.ACCENT,{y:.10})
    const baseball=rand()<.5
    if(baseball){
      box(.56,.02,.56,CELL.EARTH,{y:.134,z:.14,ry:Math.PI/4})
      for(const [x,z]of [[0,-.25],[-.39,.14],[.39,.14],[0,.53]])box(.05,.025,.05,CELL.LIGHT,{x,y:.156,z,ry:Math.PI/4})
    }else{
      box(1.27,.02,.59,CELL.ACCENT2,{y:.134})
      for(let i=0;i<7;i++)box(.023,.02,.56,CELL.LIGHT,{x:-.54+i*.18,y:.154})
    }
    for(const x of [-1.06,1.06])for(const z of [-.66,.66]){
      cyl(.035,.94,CELL.METAL,{x,y:1.0,z})
      box(.32,.15,.09,CELL.LIGHT,{x,y:1.50,z})
    }
    box(.70,.40,.10,CELL.ACCENT,{y:1.02,z:-.99})
    return {label:baseball?'Kansas City baseball stadium':'Kansas City football stadium',kind:'landmark'}
  },
  obelisk(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    B(1.2,.3,1.2,'STONE',0,.15);c.geom(new THREE.CylinderGeometry(.22,.38,2.1,4),CELL.STONE,{y:1.35,ry:Math.PI/4});c.geom(new THREE.ConeGeometry(.22,.4,4),CELL.ACCENT,{y:2.6,ry:Math.PI/4});for(let i=0;i<5;i++)B(.25,.035,.025,'STONE_DARK',0,.6+i*.3,.25);
    return {label:"Obelisk",kind:"landmark"};
  },
  mechanicalclock(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const T=(r,t,k,x=0,y=0,z=0,o={},arc=Math.PI*2)=>c.geom(new THREE.TorusGeometry(r,t,6,24,arc),CELL[k],{x,y,z,...o});
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    B(3.2,.18,1.8,'WOOD',0,.09);for(const x of [-1,1])B(.14,2.8,.14,'WOOD',x,1.55,-.2);B(2.3,.15,.3,'WOOD',0,2.75,-.2);
  G('crown',0,1.9,0);T(.6,.06,'METAL',0,0,0,{label:'Crown wheel'});for(let i=0;i<12;i++){const a=i*Math.PI/6;B(.1,.13,.14,'METAL',.6*Math.cos(a),.6*Math.sin(a),.1,{rz:a});}E();
  for(const [x,y,r] of [[-.5,1,.38],[.45,.75,.28]]){T(r,.05,'METAL',x,y,0,{label:x<0?'Great wheel':'Gear train'});for(let i=0;i<4;i++)L([x,y,0],[x+r*Math.cos(i*1.57),y+r*Math.sin(i*1.57),0],.025,'METAL');}
  G('verge',0,2.15,.3);C(.04,.9,'METAL',0,0,0,{label:'Verge'});B(1.7,.07,.08,'WOOD',0,.5,0,{label:'Foliot'});for(const s of [-1,1]){B(.22,.18,.22,'METAL_DARK',s*.7,.5);B(.2,.06,.12,'METAL',s*.08,s*.25,-.1,{label:s>0?'Pallet':undefined});}E();
  L([-.65,1,0],[-.65,.35,0],.015,'CLOTH',{label:'Weight rope'});B(.24,.3,.25,'METAL_DARK',-.65,.3,0,{label:'Driving weight'});C(.4,.08,'LIGHT',1.35,1.8,0,{rx:Math.PI/2,label:'Dial'});B(.04,.35,.025,'BLACK',1.35,1.95,.06);
    return {label:"Verge and foliot clock",kind:"hero",pose(t,parts){parts.verge.rotation.y=.35*Math.sin(t*Math.PI*2);parts.crown.rotation.z=t*Math.PI/6}};
  },
  lilypond(c, rand) {
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const E=(x,y,z,k,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(x,y,z);c.geom(g,k,o);};
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    E(1.61,.11,1.29,CELL.EARTH,{y:-.075,label:'Pond basin'});E(1.42,.027,1.10,CELL.GLASS,{y:.045,label:'Still water'});
    for(let i=0;i<13;i++){const a=i*Math.PI*2/13;E(.25,.13,.21,CELL.STONE,{x:1.43*Math.cos(a),y:.10,z:1.11*Math.sin(a),ry:a,label:i===0?'Rock rim':undefined});}
    for(let i=0;i<5;i++){
      const x=[-.7,.23,.77,-.25,-.30][i],z=[.17,.49,-.10,-.52,.16][i];
      if(i===4)c.group('pad',{x,y:.093,z});
      const s=new THREE.Shape();s.moveTo(0,0);s.absarc(0,0,.23,.17,Math.PI*2-.17,false);s.lineTo(0,0);const g=new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false});g.rotateX(-Math.PI/2);
      c.geom(g,CELL.ACCENT,{x:i===4?0:x,y:i===4?0:.085,z:i===4?0:z,ry:rand()*6,label:i===4?'Floating lily pad':undefined});if(i===4)c.end();
    }
    for(const x of [.85,1.08]){rod([x,.09,-.72],[x-.07,.87,-.76],.022,CELL.ACCENT,{label:x<1?'Reed stem':undefined});C(.055,.23,CELL.WOOD,{x:x-.07,y:.91,z:-.76,label:x>1?'Reed head':undefined});}
    return {label:'Lily pond',kind:'hero',loop:6,pose(t,p){const a=2*Math.PI*t;p.pad.position.y=.093+.008*Math.sin(a);p.pad.rotation.z=.028*Math.sin(a);}};
  },
  beehive(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }
    const roof=(w,h,d,cell,o={})=>plate([[-w/2,0],[w/2,0],[0,h]],d,cell,{...o,z:(o.z||0)-d/2})

  box(1.31,.13,1.03,CELL.WOOD,{y:.065})
    for(let i=0;i<4;i++){
      box(1.13,.35,.85,CELL.WOOD,{y:.34+i*.38})
      box(.30,.06,.025,CELL.METAL_DARK,{y:.35+i*.38,z:.443})
    }
    box(1.29,.12,1.00,CELL.METAL,{y:1.72})
    roof(1.30,.19,1.00,CELL.METAL,{y:1.78})
    box(.73,.045,.42,CELL.WOOD,{y:.17,z:.61})
    box(.59,.055,.025,CELL.BLACK,{y:.23,z:.441})
    // Explicit brief exception: these are abstract hovering dots, no anatomy.
    for(const [x,y,z]of [[-.31,.49,.84],[.23,.73,.87],[.62,.98,.55]])box(.09,.07,.09,CELL.ACCENT,{x,y,z})
    return {label:'Langstroth beehive',kind:'landmark'}
  },
  campusship(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    C(.95,.65,'METAL',0,1.3,0,{label:'Capsule hull'},1.25);S(.95,.45,.95,'ACCENT',0,1.63,0,{label:'Nose cap'});C(1.1,.18,'METAL_DARK',0,.92,0,{label:'Belly skirt'},1.3);
  for(const x of [-1,1])for(const z of [-1,1]){L([x*.75,1.05,z*.75],[x*1.4,.2,z*1.4],.08,'METAL');C(.27,.16,'METAL_DARK',x*1.4,.08,z*1.4,{label:x>0&&z>0?'Landing foot':undefined});}
  for(let i=0;i<5;i++){const a=.65+i*1.24;const x=1.095*Math.sin(a),z=1.095*Math.cos(a);const pane=new THREE.CylinderGeometry(.14,.14,.055,12);pane.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.sin(a),0,Math.cos(a))));c.geom(pane,CELL.GLASS,{x,y:1.4,z,label:i===0?'Portholes':undefined});}
  C(.04,.6,'METAL',-.5,2,-.25,{label:'Sensor mast'});S(.07,.07,.07,'GLOW',-.5,2.34,-.25,{emissive:.8});B(.62,.72,.04,'GLOW',0,1.15,1.08,{emissive:.35,label:'Lit hatch'});B(.5,.63,.045,'BLACK',0,1.16,1.12);
  G('ramp',0,.8,1.1,{rx:-Math.PI/2});B(.7,.09,1.5,'METAL',0,0,.75,{label:'Boarding ramp'});for(let i=0;i<6;i++)B(.65,.025,.025,'METAL_DARK',0,.06,.2+i*.2);E();
    return {label:"Campus lander",kind:"hero",pose(t,parts){parts.ramp.rotation.x=-Math.PI/2+(Math.PI/2+Math.asin(.74/1.5))*t}};
  },
  archgate(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const P=(pts,d,k,o={})=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    for(const x of [-1.60,1.60]){
      B(.79,.22,.87,CELL.STONE,{x,y:.05,label:x<0?'Ground footing':undefined});
      for(let i=0;i<5;i++)B(.60,.44,.64,CELL.STONE,{x,y:.34+i*.46,label:i===2?(x<0?'West pier':'East pier'):undefined});
      B(.81,.17,.84,CELL.STONE,{x,y:2.57,label:x<0?'Pier capital':undefined});
    }
    B(4.16,.38,.87,CELL.STONE,{y:2.82,label:'Flat lintel'});B(4.27,.09,.98,CELL.LIGHT,{y:3.045,label:'Coping'});
    rod([-.92,2.62,.21],[.92,2.62,.21],.042,CELL.METAL,{label:'Banner rail'});
    c.group('banner',{y:2.58,z:.21});P([[-.63,0],[.63,0],[.63,-.76],[0,-1.04],[-.63,-.76]],.045,CELL.ACCENT,{label:'Island banner'});c.end();
    return {label:'Island gateway',kind:'hero',loop:4,pose(t,p){p.banner.rotation.x=.13*Math.sin(2*Math.PI*t);}};
  },
  triumphalarch(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const A=(w,h,t,d,k,o={})=>{const r=w/2,cy=h-r-t,s=new THREE.Shape();s.moveTo(-r-t,0);s.lineTo(-r-t,cy);s.absarc(0,cy,r+t,Math.PI,0,true);s.lineTo(r+t,0);s.lineTo(r,0);s.lineTo(r,cy);s.absarc(0,cy,r,0,Math.PI,false);s.lineTo(-r,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12});g.translate(0,0,-d/2);c.geom(g,k,o);};
    A(.78,1.57,.22,.52,CELL.STONE);for(const x of [-1.02,1.02])A(.40,1.24,.16,.51,CELL.STONE,{x});
    B(2.86,.34,.67,CELL.STONE,{y:1.76});B(1.16,.21,.055,CELL.LIGHT,{y:1.77,z:.365});
    for(const x of [-1.34,-.57,.57,1.34]){C(.07,1.30,CELL.STONE,{x,y:.65,z:.34});B(.22,.10,.21,CELL.STONE,{x,y:1.34,z:.34});}
    B(.64,.22,.4,CELL.METAL,{y:2.14,z:-.03});for(let i=0;i<4;i++)c.geom(new THREE.ConeGeometry(.105,.30,6),CELL.METAL,{x:-.39+i*.26,y:2.19,z:.29});
    return {label:'Roman triumphal arch',kind:'landmark'};
  },
  lookouttower(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,r,6,false),k,o);
    C(.44,2.77,CELL.STONE,{y:1.385,label:'Central tower'});C(.59,.18,CELL.STONE_DARK,{y:.045,label:'Footing'});
    const rail=[];
    for(let i=0;i<24;i++){
      const a=i*Math.PI*1.65/23,h=.10+i*.104;
      const shape=new THREE.Shape();shape.moveTo(.44*Math.cos(a),.44*Math.sin(a));shape.lineTo(1.01*Math.cos(a),1.01*Math.sin(a));shape.lineTo(1.01*Math.cos(a+.20),1.01*Math.sin(a+.20));shape.lineTo(.44*Math.cos(a+.20),.44*Math.sin(a+.20));shape.closePath();
      const g=new THREE.ExtrudeGeometry(shape,{depth:.068,bevelEnabled:false});g.rotateX(-Math.PI/2);c.geom(g,CELL.WOOD,{y:h,label:i===10?'Spiral stair':undefined});
      if(i%2===0)C(.027,.50,CELL.METAL,{x:.98*Math.cos(a+.1),y:h+.31,z:-.98*Math.sin(a+.1)});
      rail.push([.98*Math.cos(a+.1),h+.58,-.98*Math.sin(a+.1)]);
    }
    T(rail,.033,CELL.METAL,{label:'Stair handrail'});
    C(1.13,.14,CELL.WOOD,{y:2.72},12);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,x=1.05*Math.cos(a),z=1.05*Math.sin(a);
      if(i!==2&&i!==3){C(.038,.51,CELL.WOOD,{x,y:3.02,z});const b=a+Math.PI/6;rod([x,3.27,z],[1.05*Math.cos(b),3.27,1.05*Math.sin(b)],.04,CELL.WOOD,{label:i===7?'Gallery railing':undefined});}
    }
    for(const x of [-.67,.67])for(const z of [-.67,.67])B(.075,.86,.075,CELL.WOOD,{x,y:3.12,z,label:x<0&&z<0?'Roof post':undefined});
    c.geom(new THREE.ConeGeometry(1.36,.56,4),CELL.ACCENT,{y:3.69,ry:Math.PI/4,label:'Shelter roof'});
    return {label:'Spiral lookout tower',kind:'hero',pose(t,p){}};
  },
  belltower(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    B(1.1,1.6,1.1,'STONE',0,.8);B(.35,.65,.03,'BLACK',0,.35,.57);for(const x of [-.45,.45])for(const z of [-.45,.45])B(.14,.8,.14,'STONE',x,2,z);C(.14,.4,'ACCENT2',0,2.05,0,{},.3);for(const s of [-1,1])B(.85,.1,1.3,'ACCENT',s*.33,2.57,0,{rz:-s*.5});
    return {label:"Bell tower",kind:"landmark"};
  },
  containership(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const plate=(pts,d,cell,o={})=>{
      const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath()
      c.geom(new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),cell,o)
    }
    const hull=(l,w,h,cell,o={})=>plate([[-l/2,-w*.35],[-l*.35,-w/2],[l*.30,-w/2],[l/2,0],[l*.30,w/2],[-l*.35,w/2],[-l/2,w*.35]],h,cell,{...o,rx:-Math.PI/2})

  hull(3.04,.78,.25,CELL.METAL_DARK,{y:.04})
    hull(3.08,.83,.055,CELL.ACCENT,{y:.29})
    box(2.58,.07,.70,CELL.METAL,{y:.38})
    for(let i=0;i<5;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)box(.34,.23,.28,[CELL.ACCENT,CELL.ACCENT2,CELL.METAL][(i+j+k)%3],{x:-.62+i*.40,y:.535+k*.25,z:(j-.5)*.32})
    box(.38,.54,.69,CELL.LIGHT,{x:-1.12,y:.68})
    box(.48,.19,.78,CELL.LIGHT,{x:-1.12,y:1.02})
    box(.33,.075,.025,CELL.GLASS,{x:-1.12,y:1.04,z:.407})
    box(.18,.31,.24,CELL.METAL_DARK,{x:-1.30,y:1.26})
    return {label:'Container ship',kind:'landmark'}
  },
  submarine(c, rand) {
    const box=(w,h,d,cell,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),cell,o)
    const cyl=(r,h,cell,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),cell,o)
    const ball=(r,cell,o={})=>c.geom(new THREE.SphereGeometry(r,12,8),cell,o)

  const g=new THREE.SphereGeometry(1,16,10);g.scale(1.47,.29,.31)
    c.geom(g,CELL.METAL_DARK,{y:.33})
    box(.45,.44,.24,CELL.METAL_DARK,{x:-.18,y:.77})
    for(const x of [-.28,-.08]){
      cyl(.035,.36,CELL.METAL,{x,y:1.13})
      box(.14,.07,.07,CELL.METAL,{x:x+.045,y:1.31})
    }
    box(.32,.05,.91,CELL.METAL_DARK,{x:.60,y:.34})
    box(.28,.51,.06,CELL.METAL_DARK,{x:-1.16,y:.48})
    box(.32,.055,.63,CELL.METAL_DARK,{x:-1.15,y:.33})
    ball(.049,CELL.RED,{x:-.18,y:1.01,z:.13})
    return {label:'Submarine',kind:'landmark'}
  },
  frigate(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 10) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.33)
      s.lineTo(-length * 0.36, -beam / 2)
      s.lineTo(length * 0.22, -beam / 2)
      s.lineTo(length / 2, 0)
      s.lineTo(length * 0.22, beam / 2)
      s.lineTo(-length * 0.36, beam / 2)
      s.lineTo(-length / 2, beam * 0.33)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(2.72, 0.83, 0.21, CELL.METAL_DARK, 0)
    hull(2.82, 0.93, 0.075, CELL.ACCENT, 0.21)
    hull(2.82, 0.93, 0.10, CELL.METAL, 0.285)
    box(0.73, 0.33, 0.57, CELL.METAL, { x: -0.36, y: 0.55 })
    box(0.46, 0.25, 0.64, CELL.METAL, { x: -0.22, y: 0.84 })
    box(0.35, 0.105, 0.035, CELL.GLOW, { x: -0.18, y: 0.86, z: 0.3375, emissive: 0.5 })
    box(0.54, 0.075, 0.70, CELL.METAL_DARK, { x: -0.22, y: 1.0025 })
    cyl(0.048, 0.67, CELL.METAL, { x: -0.43, y: 1.375 })
    box(0.39, 0.11, 0.08, CELL.ACCENT, { x: -0.43, y: 1.69 })
    box(0.24, 0.37, 0.27, CELL.METAL_DARK, { x: -0.94, y: 0.57 })
    cyl(0.27, 0.09, CELL.METAL_DARK, { x: 0.60, y: 0.43 })
    // Seed changes the assembled turret's bearing, never its attachment point.
    c.group('turret', { x: 0.60, y: 0.475, ry: (rand() - 0.5) * 0.8 })
    c.geom(new THREE.CylinderGeometry(0.18, 0.25, 0.23, 6), CELL.METAL, { y: 0.115 })
    cyl(0.06, 0.49, CELL.METAL_DARK, { x: 0.38, y: 0.13, rz: Math.PI / 2 })
    c.end()
    box(0.34, 0.035, 0.39, CELL.METAL_DARK, { x: -1.08, y: 0.4025 })
    return { label: 'Armada frigate', kind: 'landmark' }
  },
  patrolboat(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 10) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Deliberately the smallest ship: big antenna, little hull, no face.
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.28)
      s.lineTo(-length * 0.31, -beam / 2)
      s.lineTo(length * 0.22, -beam / 2)
      s.lineTo(length / 2, 0)
      s.lineTo(length * 0.22, beam / 2)
      s.lineTo(-length * 0.31, beam / 2)
      s.lineTo(-length / 2, beam * 0.28)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(1.30, 0.64, 0.18, CELL.METAL_DARK, 0)
    hull(1.42, 0.74, 0.085, CELL.ACCENT, 0.18)
    hull(1.42, 0.74, 0.09, CELL.METAL, 0.265)
    box(0.47, 0.31, 0.47, CELL.METAL, { x: -0.04, y: 0.51 })
    box(0.30, 0.12, 0.035, CELL.GLASS, { x: 0.01, y: 0.54, z: 0.2525 })
    box(0.56, 0.09, 0.56, CELL.ACCENT, { x: -0.04, y: 0.71 })
    cyl(0.055, 1.02, CELL.METAL, { x: -0.39, y: 0.88 })
    box(0.48, 0.085, 0.08, CELL.METAL, { x: -0.39, y: 1.27 })
    cyl(0.105, 0.15, CELL.GLOW, { x: -0.39, y: 1.465, emissive: 0.75 })
    cyl(0.14, 0.065, CELL.METAL_DARK, { x: -0.39, y: 1.5725 })
    box(0.24, 0.10, 0.28, CELL.METAL_DARK, { x: 0.40, y: 0.405 })
    return { label: 'Armada Pi patrol boat', kind: 'landmark' }
  },
  flagship(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 10) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Fleet convention: bow +x, bridge windows +z. No water or ground pad.
    // ACCENT and GLOW are palette roles; node health is assigned by the engine.
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.38)
      s.lineTo(-length * 0.38, -beam / 2)
      s.lineTo(length * 0.27, -beam / 2)
      s.lineTo(length / 2, -beam * 0.13)
      s.lineTo(length / 2, beam * 0.13)
      s.lineTo(length * 0.27, beam / 2)
      s.lineTo(-length * 0.38, beam / 2)
      s.lineTo(-length / 2, beam * 0.38)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(2.42, 1.0, 0.22, CELL.METAL_DARK, 0)
    hull(2.52, 1.08, 0.08, CELL.ACCENT, 0.22)
    hull(2.52, 1.08, 0.12, CELL.METAL, 0.30)
    box(0.93, 0.35, 0.66, CELL.METAL, { x: -0.22, y: 0.585 })
    box(0.72, 0.30, 0.76, CELL.METAL, { x: -0.08, y: 0.91 })
    box(0.59, 0.13, 0.035, CELL.GLOW, { x: -0.04, y: 0.94, z: 0.397, emissive: 0.65 })
    box(0.035, 0.13, 0.56, CELL.GLASS, { x: 0.297, y: 0.94 })
    box(0.86, 0.09, 0.87, CELL.METAL_DARK, { x: -0.08, y: 1.105 })
    cyl(0.065, 1.13, CELL.METAL, { x: -0.22, y: 1.715 })
    box(0.13, 0.40, 0.13, CELL.METAL_DARK, { x: -0.22, y: 1.35 })
    // Exactly one animated part: a broad radar paddle, centered on its mast.
    box(0.86, 0.23, 0.09, CELL.ACCENT, { x: -0.22, y: 2.18, spin: 0.55 })
    box(0.065, 0.45, 0.065, CELL.METAL, { x: -0.75, y: 1.36 })
    const pennant = new THREE.Shape()
    pennant.moveTo(0, 0)
    pennant.lineTo(0.38, -0.11)
    pennant.lineTo(0, -0.23)
    pennant.closePath()
    c.geom(new THREE.ExtrudeGeometry(pennant, { depth: 0.05, bevelEnabled: false }), CELL.ACCENT, { x: -0.75, y: 1.56, z: -0.025 })
    cyl(0.20, 0.08, CELL.METAL_DARK, { x: 0.77, y: 0.46 })
    cyl(0.09, 0.12, CELL.GLOW, { x: 0.77, y: 0.56, emissive: 0.5 })
    for (const z of [-0.29, 0.29]) {
      cyl(0.13, 0.18, CELL.METAL_DARK, { x: -1.20, y: 0.18, z, rz: Math.PI / 2 })
    }
    return { label: 'Armada flagship', kind: 'landmark' }
  },
  tanker(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 12) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.36)
      s.lineTo(-length * 0.36, -beam / 2)
      s.lineTo(length * 0.34, -beam / 2)
      s.lineTo(length / 2, -beam * 0.26)
      s.lineTo(length / 2, beam * 0.26)
      s.lineTo(length * 0.34, beam / 2)
      s.lineTo(-length * 0.36, beam / 2)
      s.lineTo(-length / 2, beam * 0.36)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(2.85, 1.36, 0.25, CELL.METAL_DARK, 0)
    hull(2.97, 1.46, 0.08, CELL.ACCENT, 0.25)
    hull(2.97, 1.46, 0.12, CELL.METAL, 0.33)
    // Three transverse pressure vessels, with bold hoops, not small fittings.
    for (const x of [-0.52, 0.17, 0.86]) {
      for (const z of [-0.35, 0.35]) box(0.41, 0.16, 0.14, CELL.METAL_DARK, { x, y: 0.53, z })
      cyl(0.29, 1.08, CELL.METAL, { x, y: 0.84, rx: Math.PI / 2 })
      for (const z of [-0.36, 0.36]) cyl(0.306, 0.075, CELL.METAL_DARK, { x, y: 0.84, z, rx: Math.PI / 2 })
    }
    box(2.03, 0.07, 0.18, CELL.METAL_DARK, { x: 0.17, y: 1.155 })
    box(0.44, 0.43, 0.69, CELL.METAL, { x: -1.08, y: 0.665 })
    box(0.33, 0.14, 0.04, CELL.GLASS, { x: -1.08, y: 0.755, z: 0.365 })
    box(0.50, 0.08, 0.77, CELL.METAL_DARK, { x: -1.08, y: 0.92 })
    cyl(0.045, 0.36, CELL.METAL, { x: -1.08, y: 1.14 })
    cyl(0.085, 0.12, CELL.GLOW, { x: -1.08, y: 1.38, emissive: 0.65 })
    return { label: 'Armada storage tanker', kind: 'landmark' }
  },
  corvette(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 10) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Smaller than the frigate; the class brief takes precedence over the
    // generic 2.5-unit minimum. Do not independently normalize fleet hulls.
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.34)
      s.lineTo(-length * 0.34, -beam / 2)
      s.lineTo(length * 0.20, -beam / 2)
      s.lineTo(length / 2, 0)
      s.lineTo(length * 0.20, beam / 2)
      s.lineTo(-length * 0.34, beam / 2)
      s.lineTo(-length / 2, beam * 0.34)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(2.06, 0.79, 0.18, CELL.METAL_DARK, 0)
    hull(2.16, 0.87, 0.07, CELL.ACCENT, 0.18)
    hull(2.16, 0.87, 0.10, CELL.METAL, 0.25)
    const variant = Math.floor(rand() * 3)
    c.group('cabin', { x: -0.16, y: 0.35 })
    if (variant === 0) {
      box(0.69, 0.38, 0.55, CELL.METAL, { y: 0.19 })
      box(0.77, 0.08, 0.62, CELL.METAL_DARK, { y: 0.42 })
    } else if (variant === 1) {
      c.geom(new THREE.CylinderGeometry(0.31, 0.40, 0.40, 4), CELL.METAL, { y: 0.20, ry: Math.PI / 4 })
      box(0.47, 0.08, 0.47, CELL.METAL_DARK, { y: 0.44 })
    } else {
      box(0.85, 0.22, 0.56, CELL.METAL, { y: 0.11 })
      box(0.43, 0.22, 0.48, CELL.METAL, { x: -0.15, y: 0.33 })
      box(0.50, 0.07, 0.54, CELL.METAL_DARK, { x: -0.15, y: 0.475 })
    }
    c.end()
    // Porthole is on a shared bow coaming so it fits all three cabin shapes.
    box(0.28, 0.25, 0.38, CELL.METAL, { x: 0.49, y: 0.475 })
    cyl(0.105, 0.045, CELL.METAL_DARK, { x: 0.49, y: 0.48, z: 0.2075, rx: Math.PI / 2 })
    cyl(0.072, 0.022, CELL.GLOW, { x: 0.49, y: 0.48, z: 0.239, rx: Math.PI / 2, emissive: 0.65 })
    cyl(0.044, 0.74, CELL.METAL, { x: -0.42, y: 1.04 })
    box(0.27, 0.11, 0.07, CELL.ACCENT, { x: -0.42, y: 1.405 })
    box(0.23, 0.12, 0.28, CELL.METAL_DARK, { x: -0.91, y: 0.41 })
    return { label: 'Armada corvette', kind: 'landmark' }
  },
  carrier(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.39)
      s.lineTo(-length * 0.42, -beam / 2)
      s.lineTo(length * 0.40, -beam / 2)
      s.lineTo(length / 2, -beam * 0.34)
      s.lineTo(length / 2, beam * 0.34)
      s.lineTo(length * 0.40, beam / 2)
      s.lineTo(-length * 0.42, beam / 2)
      s.lineTo(-length / 2, beam * 0.39)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    hull(2.86, 1.13, 0.24, CELL.METAL_DARK, 0)
    hull(2.96, 1.24, 0.075, CELL.ACCENT, 0.24)
    hull(3.12, 1.46, 0.13, CELL.METAL, 0.315)
    // Rear-side island leaves the working deck readable from +z.
    box(0.81, 0.40, 0.33, CELL.METAL, { x: -0.47, y: 0.645, z: -0.48 })
    box(0.64, 0.20, 0.41, CELL.METAL_DARK, { x: -0.35, y: 0.945, z: -0.48 })
    box(0.49, 0.085, 0.035, CELL.GLASS, { x: -0.29, y: 0.965, z: -0.257 })
    box(0.07, 0.41, 0.07, CELL.METAL, { x: -0.51, y: 1.25, z: -0.48 })
    box(0.38, 0.10, 0.08, CELL.ACCENT, { x: -0.51, y: 1.455, z: -0.48 })
    // Four GPU slots, two emissive geometry objects: each joins two separated boxes.
    // A class-only API cannot identify the one-GPU node; the default is four slots.
    for (const x of [-0.96, -0.34, 0.28, 0.90]) {
      box(0.45, 0.065, 0.57, CELL.METAL_DARK, { x, y: 0.4775, z: 0.15 })
    }
    for (const centers of [[-0.96, -0.34], [0.28, 0.90]]) {
      const first = new THREE.Shape()
      const second = new THREE.Shape()
      for (const [shape, x] of [[first, centers[0]], [second, centers[1]]]) {
        shape.moveTo(x - 0.15, -0.36)
        shape.lineTo(x + 0.15, -0.36)
        shape.lineTo(x + 0.15, 0.06)
        shape.lineTo(x - 0.15, 0.06)
        shape.closePath()
      }
      const g = new THREE.ExtrudeGeometry([first, second], { depth: 0.025, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, CELL.GLOW, { y: 0.510, emissive: 0.7 })
    }
    box(2.45, 0.025, 0.055, CELL.ACCENT, { y: 0.4575, z: 0.57 })
    for (const z of [-0.34, 0.34]) {
      box(0.16, 0.15, 0.26, CELL.METAL_DARK, { x: -1.45, y: 0.14, z })
    }
    return { label: 'Armada GPU carrier', kind: 'landmark' }
  },
  tender(c, rand) {
    const box = (w, h, d, cell, o = {}) => c.geom(new THREE.BoxGeometry(w, h, d), cell, o)
    const cyl = (r, h, cell, o = {}, n = 10) => c.geom(new THREE.CylinderGeometry(r, r, h, n), cell, o)
    // Standby uses metal and unlit glass; no ACCENT or GLOW until the host
    // explicitly changes its state. Gray is a role choice, not a hardcoded color.
    const hull = (length, beam, depth, cell, y) => {
      const s = new THREE.Shape()
      s.moveTo(-length / 2, -beam * 0.24)
      s.lineTo(-length * 0.31, -beam / 2)
      s.lineTo(length * 0.24, -beam / 2)
      s.lineTo(length / 2, 0)
      s.lineTo(length * 0.24, beam / 2)
      s.lineTo(-length * 0.31, beam / 2)
      s.lineTo(-length / 2, beam * 0.24)
      s.closePath()
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
      g.rotateX(-Math.PI / 2)
      c.geom(g, cell, { y })
    }
    // Smaller than the corvette, larger than the Pi patrol boat.
    hull(1.68, 0.81, 0.18, CELL.METAL_DARK, 0)
    hull(1.78, 0.90, 0.07, CELL.METAL, 0.18)
    hull(1.78, 0.90, 0.10, CELL.METAL_DARK, 0.25)
    box(0.47, 0.29, 0.55, CELL.METAL, { x: -0.43, y: 0.495 })
    box(0.33, 0.12, 0.035, CELL.GLASS, { x: -0.43, y: 0.53, z: 0.2925 })
    box(0.56, 0.075, 0.63, CELL.METAL_DARK, { x: -0.43, y: 0.6775 })
    // Closed solar leaves, like a shut laptop: a visible hinge and stacked rims.
    for (const y of [0.405, 0.50]) {
      box(0.66, 0.065, 0.63, CELL.METAL, { x: 0.23, y })
    }
    box(0.52, 0.025, 0.49, CELL.GLASS, { x: 0.23, y: 0.545 })
    cyl(0.055, 0.65, CELL.METAL_DARK, { x: -0.08, y: 0.455, rx: Math.PI / 2 })
    cyl(0.04, 0.45, CELL.METAL, { x: -0.56, y: 0.94 })
    cyl(0.075, 0.11, CELL.GLASS, { x: -0.56, y: 1.22 })
    return { label: 'Armada standby tender', kind: 'landmark' }
  },
  campusship(c, rand) {
    const B=(w,h,d,k,x=0,y=0,z=0,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),CELL[k],{x,y,z,...o});
    const C=(r,h,k,x=0,y=0,z=0,o={},r2=r)=>{const g=new THREE.CylinderGeometry(r,r2,h,12);if(o.spin){g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)));return c.geom(g,CELL[k],{x,y,z,...o,rx:0,ry:0,rz:0});}return c.geom(g,CELL[k],{x,y,z,...o});};
    const S=(a,b,d,k,x=0,y=0,z=0,o={})=>{const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,d);return c.geom(g,CELL[k],{x,y,z,...o});};
    const L=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));const m=u.add(v).multiplyScalar(.5);return c.geom(g,CELL[k],{x:m.x,y:m.y,z:m.z,...o});};
    const G=(n,x=0,y=0,z=0,o={})=>c.group(n,{x,y,z,...o}), E=()=>c.end();
    C(.95,.65,'METAL',0,1.3,0,{label:'Capsule hull'},1.25);S(.95,.45,.95,'ACCENT',0,1.63,0,{label:'Nose cap'});C(1.1,.18,'METAL_DARK',0,.92,0,{label:'Belly skirt'},1.3);
  for(const x of [-1,1])for(const z of [-1,1]){L([x*.75,1.05,z*.75],[x*1.4,.2,z*1.4],.08,'METAL');C(.27,.16,'METAL_DARK',x*1.4,.08,z*1.4,{label:x>0&&z>0?'Landing foot':undefined});}
  for(let i=0;i<5;i++){const a=.65+i*1.24;const x=1.095*Math.sin(a),z=1.095*Math.cos(a);const pane=new THREE.CylinderGeometry(.14,.14,.055,12);pane.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.sin(a),0,Math.cos(a))));c.geom(pane,CELL.GLASS,{x,y:1.4,z,label:i===0?'Portholes':undefined});}
  C(.04,.6,'METAL',-.5,2,-.25,{label:'Sensor mast'});S(.07,.07,.07,'GLOW',-.5,2.34,-.25,{emissive:.8});B(.62,.72,.04,'GLOW',0,1.15,1.08,{emissive:.35,label:'Lit hatch'});B(.5,.63,.045,'BLACK',0,1.16,1.12);
  G('ramp',0,.8,1.1,{rx:-Math.PI/2});B(.7,.09,1.5,'METAL',0,0,.75,{label:'Boarding ramp'});for(let i=0;i<6;i++)B(.65,.025,.025,'METAL_DARK',0,.06,.2+i*.2);E();
    return {label:"Campus lander",kind:"hero",pose(t,parts){parts.ramp.rotation.x=-Math.PI/2+(Math.PI/2+Math.asin(.74/1.5))*t}};
  },
  dinghy(c, rand) {
    const B=(w,h,d,k,o={})=>c.geom(new THREE.BoxGeometry(w,h,d),k,o);
    const C=(r,h,k,o={},n=12)=>c.geom(new THREE.CylinderGeometry(r,r,h,n),k,o);
    const rod=(a,b,r,k,o={})=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),d=v.clone().sub(u);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());const g=new THREE.CylinderGeometry(r,r,d.length(),8);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));const p=u.add(v).multiplyScalar(.5);c.geom(g,k,{x:p.x,y:p.y,z:p.z,...o});};
    const T=(pts,r,k,o={})=>c.geom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.min(192,Math.max(24,pts.length*2)),r,6,false),k,o);
    c.group('hull',{y:.26});
    const plan=[[-.48,-1.08],[-.62,-.36],[-.53,.66],[-.28,1.06],[0,1.27],[.28,1.06],[.53,.66],[.62,-.36],[.48,-1.08]];
    const s=new THREE.Shape();plan.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const floor=new THREE.ExtrudeGeometry(s,{depth:.06,bevelEnabled:false});floor.rotateX(-Math.PI/2);c.geom(floor,CELL.WOOD,{label:'Hull floor'});
    for(let row=0;row<3;row++){const sc=.84+row*.08;for(let i=0;i<plan.length;i++){const a=plan[i],b=plan[(i+1)%plan.length],dx=(b[0]-a[0])*sc,dz=(b[1]-a[1])*sc;B(Math.hypot(dx,dz)+.015,.115,.053,CELL.WOOD,{x:(a[0]+b[0])*.5*sc,y:.07+row*.105,z:(a[1]+b[1])*.5*sc,ry:-Math.atan2(dz,dx),label:i===0?['Lower strake','Middle strake','Gunwale strake'][row]:undefined});}}
    for(const z of [-.45,.37])B(1.02,.06,.19,CELL.WOOD,{y:.28,z,label:z<0?'Thwarts':undefined});
    for(const x of [-.25,.25]){rod([x,.36,-.79],[x,.36,.76],.023,CELL.WOOD,{label:x<0?'Shipped oars':undefined});B(.13,.042,.30,CELL.WOOD,{x,y:.36,z:.84});}c.end();
    C(.12,.54,CELL.WOOD,{x:1.17,y:.27,z:.18,label:'Mooring bollard'});T([[1.17,.45,.18],[.89,.31,.49],[.48,.49,.84],[0,.54,1.15]],.021,CELL.CLOTH,{label:'Painter line'});
    return {label:'Clinker-built dinghy',kind:'hero',loop:5,pose(t,p){p.hull.rotation.z=.065*Math.sin(2*Math.PI*t);p.hull.rotation.x=.025*Math.cos(2*Math.PI*t);}};
  },
  // END BRAIN PIECES
  }
}
