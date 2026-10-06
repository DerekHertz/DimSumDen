import * as THREE from 'three';

export const DIRECTIONS=[['teahouse','Teahouse cooks'],['scholar','Scholars & temples'],['traveler','Martial arts travelers']];
export const TRADITIONAL_PROPS={
  orchestrator:['Bamboo ladle','Ceremonial jade seal','Traveler’s staff'],
  product:['Bamboo recipe scroll','Bound bamboo slips','Folding travel map'],
  architect:['Measuring sticks','Ink brush & bamboo slips','Training staff'],
  developer:['Rolling pin','Carving brush','Practice staff'],
  scout:['Ingredient basket','Bronze hand mirror','Gourd canteen'],
  debugger:['Chopsticks','Incense wand','Bamboo flute'],
  qa:['Clay teacup','Covered tea bowl','Gourd canteen'],
  security:['Jade pantry seal','Temple seal','Travel lantern'],
  designer:['Lotus serving plate','Calligraphy fan','Folding fan'],
  herald:['Specials scroll','Calligraphy scroll','Travel scroll'],
  'release-manager':['Festival drum','Temple bell','Travel drum'],
  'knowledge-keeper':['Bamboo slips','Bamboo slips','Recipe scroll'],
  'docs-writer':['Ink brush','Calligraphy brush','Travel journal'],
  'stem-cub':['Lotus cushion','Lotus cushion','Leaf pillow'],
};
export const DEFAULT_FIT=Object.freeze({x:0,y:0,z:0,tilt:0,scale:1});
export const FIT_CONTROLS=[['x','Side offset',-0.8,0.8,0.02],['y','Height offset',-0.8,0.8,0.02],['z','Depth offset',-0.8,0.8,0.02],['tilt','Tilt',-90,90,1],['scale','Prop scale',0.55,1.6,0.01]];
export function normalizeFit(value={}){return Object.fromEntries(FIT_CONTROLS.map(([k,,lo,hi])=>[k,Number.isFinite(value[k])?Math.max(lo,Math.min(hi,value[k])):DEFAULT_FIT[k]]));}

// Every prop is built around a grip at (0,0,0), rather than around its visual centre.
// Anchors below are measured in the procedural panda's own bone frames, not GLB socket frames.
export function createTraditionalGear(panda,role,direction='traveler'){
  const objects=[],geometries=[],materials=[];
  const m=(color,extra={})=>{const mat=new THREE.MeshStandardMaterial({color,roughness:0.86,...extra});materials.push(mat);return mat;};
  const cream=m('#f3dfb5'),wood=m('#96714a'),dark=m('#343c34'),jade=m('#527f6b'),red=m('#a65243'),gold=m('#c09c57'),cloth=m(direction==='traveler'?'#8c6651':direction==='scholar'?'#516b69':'#a86b46');
  const group=(name,parent,pos)=>{const g=new THREE.Group();g.name=name;g.userData.reviewPart=name;g.position.set(...pos);parent.add(g);objects.push(g);return g;};
  const add=(parent,g,mat,pos=[0,0,0])=>{geometries.push(g);const o=new THREE.Mesh(g,mat);o.position.set(...pos);o.castShadow=true;parent.add(o);return o;};
  const box=(p,s,v,mat)=>add(p,new THREE.BoxGeometry(...s),mat,v);
  const cyl=(p,r,h,v,mat)=>add(p,new THREE.CylinderGeometry(r,r,h,24),mat,v);
  const orb=(p,s,v,mat)=>{const o=add(p,new THREE.SphereGeometry(1,24,16),mat,v);o.scale.set(...s);return o;};
  const ring=(p,r,t,v,mat,rx=0)=>{const o=add(p,new THREE.TorusGeometry(r,t,8,32),mat,v);o.rotation.x=rx;return o;};
  const hat=group('Headwear',panda.bones.Head,[0,1.6,-0.02]);
  if(role==='stem-cub'){
    const cap=add(hat,new THREE.ConeGeometry(0.52,0.7,24),cloth,[0,0.1,0]);cap.rotation.z=-0.25;
  }else if(direction==='traveler'){
    if(['scout','qa','security','knowledge-keeper'].includes(role)){
      const brim=add(hat,new THREE.ConeGeometry(1.13,0.36,40,1,true),wood,[0,-0.1,0]);brim.material.side=THREE.DoubleSide;
      for(let i=0;i<16;i++){
        const a=i/16*Math.PI*2;
        const curve=new THREE.LineCurve3(new THREE.Vector3(0,0.09,0),new THREE.Vector3(Math.sin(a)*1.13,-0.29,Math.cos(a)*1.13));
        add(hat,new THREE.TubeGeometry(curve,1,0.01,4,false),gold);
      }
    }else{
      const band=add(hat,new THREE.CylinderGeometry(1.1,1.1,0.14,40,1,true),cloth,[0,-0.5,0.04]);band.scale.z=0.8;band.material.side=THREE.DoubleSide;
      box(hat,[0.11,0.65,0.035],[-0.86,-0.69,-0.61],cloth).rotation.z=-0.3;
      box(hat,[0.11,0.53,0.035],[-0.71,-0.7,-0.66],cloth).rotation.z=0.1;
    }
  }else if(direction==='scholar'){
    orb(hat,[0.7,0.26,0.53],[0,-0.15,-0.05],dark);
    if(['product','architect','knowledge-keeper','herald'].includes(role))for(const s of [-1,1])box(hat,[0.6,0.08,0.22],[s*0.91,-0.1,-0.13],dark).rotation.z=s*0.15;
    cyl(hat,0.04,0.1,[0,0.13,-0.05],jade);
  }else{
    orb(hat,[0.69,0.17,0.5],[0,-0.24,0],cloth);
    ring(hat,0.68,0.045,[0,-0.24,0],cream,Math.PI/2);
    box(hat,[0.14,0.52,0.035],[0.66,-0.4,-0.35],cloth).rotation.z=-0.3;
  }
  const scarf=group('Travel sash',panda.bones.Torso,[0,0.99,0.04]);
  ring(scarf,0.86,0.1,[0,0,0.12],cloth,Math.PI/2);
  box(scarf,[0.19,0.52,0.05],[0.35,-0.18,1.15],cloth).rotation.z=-0.15;
  const index=DIRECTIONS.findIndex(d=>d[0]===direction),name=TRADITIONAL_PROPS[role]?.[index]||'Bamboo scroll';
  const palm=panda.bones.Wrist_R;
  // The mesh palm lies at wrist-local (0,-0.08,0.02), with the thumb on its inner edge.
  // Handles cross that palm; broad dishes are laid on top of it.
  const base={position:[0,-0.06,0.08],rotation:[0,0,0]};
  if(/cup|bowl|plate|seal|basket|journal|map|slips|scroll|drum|bell|pillow|cushion/i.test(name))base.position=[0,0.16,0.24];
  const prop=group(name,role==='stem-cub'?panda.bones.Root:palm,role==='stem-cub'?[0,0.23,1.9]:base.position);
  if(/staff|pin|sticks|wand|flute|brush|ladle/i.test(name)){
    const length=/staff/.test(name)?2.5:/pin/.test(name)?1.05:0.9;
    const radius=/staff|pin/.test(name)?0.065:0.034;
    cyl(prop,radius,length,[0,0.16,0],wood);
    if(/staff/.test(name)){for(const y of [-0.6,-0.52,0.55,0.63])ring(prop,radius+0.003,0.01,[0,y,0],gold,Math.PI/2);base.rotation[2]=-0.13;}
    if(/ladle/.test(name)){orb(prop,[0.17,0.085,0.19],[0,0.62,0],dark);}
    if(/brush/.test(name)){const tip=add(prop,new THREE.ConeGeometry(0.07,0.24,16),dark,[0,0.73,0]);tip.rotation.z=Math.PI;}
    if(/sticks/.test(name))cyl(prop,0.026,0.9,[0.13,0.16,0],wood).rotation.z=0.09;
    if(/flute/.test(name))for(let i=0;i<5;i++)orb(prop,[0.013,0.013,0.008],[0,0.1+i*0.09,0.035],dark);
  }else if(/gourd/.test(name)){
    orb(prop,[0.18,0.23,0.18],[0,-0.17,0],gold);orb(prop,[0.12,0.15,0.12],[0,0.1,0],gold);cyl(prop,0.035,0.11,[0,0.27,0],wood);
    ring(prop,0.115,0.017,[0,0.1,0],cloth,Math.PI/2);
  }else if(/seal/.test(name)){
    box(prop,[0.3,0.1,0.3],[0,0,0],jade);orb(prop,[0.1,0.12,0.08],[0,0.12,0],jade);box(prop,[0.23,0.014,0.23],[0,-0.055,0],red);
  }else if(/fan/.test(name)){
    const fan=new THREE.Group();prop.add(fan);fan.position.y=0.03;
    for(let i=0;i<11;i++){
      const a=-1.1+i*0.22,tip=[Math.sin(a)*0.6,Math.cos(a)*0.6,0];
      const curve=new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(...tip));add(fan,new THREE.TubeGeometry(curve,1,0.012,5,false),wood);
    }
    const sheet=add(fan,new THREE.CircleGeometry(0.55,30,0.45,2.25),cream,[0,0,0.015]);sheet.rotation.z=0;sheet.material.side=THREE.DoubleSide;
  }else if(/drum|bell/.test(name)){
    cyl(prop,0.34,0.34,[0,0.15,0],red);cyl(prop,0.34,0.035,[0,0.335,0],cream);
    ring(prop,0.34,0.017,[0,0.33,0],gold,Math.PI/2);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;orb(prop,[0.015,0.015,0.015],[Math.sin(a)*0.34,0.29,Math.cos(a)*0.34],gold);}
  }else if(/cup|bowl|plate|basket/.test(name)){
    const radius=/plate|basket/.test(name)?0.33:0.18;
    const pts=/plate/.test(name)?[[0,0],[0.22,0],[0.33,0.06],[0.31,0.09],[0.2,0.04],[0,0.04]]:[[0,0],[radius*0.7,0],[radius,0.2],[radius*0.86,0.22],[radius*0.75,0.045],[0,0.045]];
    add(prop,new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),32),/basket/.test(name)?wood:/cup/.test(name)?red:jade);
    if(/bowl/.test(name)){cyl(prop,0.2,0.035,[0,0.23,0],cream);orb(prop,[0.04,0.04,0.04],[0,0.265,0],jade);}
    if(/plate/.test(name))for(let i=0;i<3;i++){const a=i*Math.PI*2/3;orb(prop,[0.09,0.06,0.09],[Math.sin(a)*0.14,0.13,Math.cos(a)*0.14],cream);}
  }else if(/lantern/.test(name)){
    orb(prop,[0.19,0.27,0.19],[0,-0.2,0],red);cyl(prop,0.16,0.035,[0,0.09,0],gold);ring(prop,0.12,0.015,[0,0.2,0],dark);
  }else if(/cushion|pillow/.test(name))orb(prop,[0.65,0.16,0.5],[0,0,0],jade);
  else{
    for(let i=0;i<7;i++)box(prop,[0.055,0.55,0.035],[(i-3)*0.062,0.16,0],/slips/.test(name)?wood:cream);
    for(const x of [-0.27,0.27])cyl(prop,0.04,0.62,[x,0.16,0],wood);
    for(const y of [-0.02,0.34])box(prop,[0.43,0.025,0.02],[0,y,0.025],cloth);
    for(let i=0;i<4;i++)box(prop,[0.19,0.014,0.008],[0,0.05+i*0.07,0.03],dark);
  }
  prop.rotation.set(...base.rotation);
  const applyFit=value=>{const fit=normalizeFit(value);prop.position.set(...base.position);if(role==='stem-cub')prop.position.set(0,0.23,1.9);prop.position.add(new THREE.Vector3(fit.x,fit.y,fit.z));prop.rotation.set(...base.rotation);prop.rotation.z+=fit.tilt*Math.PI/180;prop.scale.setScalar(fit.scale);};
  applyFit(DEFAULT_FIT);
  return {prop,hat,name,applyFit,dispose(){for(const o of objects)o.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
