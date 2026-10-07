import * as THREE from 'three';
import { ROLES, headgearSpec, propSpec, scarfSpec } from './headgear.mjs';
import { buildGear } from './gear-object.mjs';
import { LANTERN_POSTS } from '../../review/site-plan.mjs';

export const CHARACTERS = [
  ['orchestrator','Bao','The Pass','Checks every dish before service.','Ladling soup'],
  ['product','The Planner','The Pass','Round spectacles and an open menu.','Reading the menu'],
  ['architect','The Architect','The Pass','Pencil behind the ear and order slips.','Planning service'],
  ['developer','The Maker','Steamers','Headphones and a test tablet.','Folding dumplings'],
  ['scout','The Scout','Steamers','Goggles and a magnifying glass.','Inspecting ingredients'],
  ['debugger','The Debugger','Steamers','Headlamp and chopsticks lifting a stray hair.','Checking the filling'],
  ['qa','The Taster','Tea','Straw douli and a teacup.','Tasting tea'],
  ['security','The Guardian','Pantry','Pantry cap and a seal stamp.','Stamping orders'],
  ['designer','The Stylist','Front of House','Beret and a garnished plate.','Plating dim sum'],
  ['herald','The Herald','Front of House','A draft scroll; a first visual proposal for this role.','Writing the specials'],
  ['release-manager','The Drummer','The Pass','Festival headband and drum.','Calling service',true],
  ['knowledge-keeper','The Librarian','Library','Scholar’s futou and bamboo slips.','Sorting recipes',true],
  ['docs-writer','The Painter','Front of House','Bandana, ink brush and paper.','Painting the menu',true],
  ['stem-cub','The Cub','Cubs','Nightcap and a cozy hamper.','Napping',true],
];
export const SAMPLE_SCENES = [
  {id:'morning',title:'Morning service',description:'Fresh baskets, busy paws, a sunny bamboo clearing.',background:'#aabd8d',light:'#fff3d5'},
  {id:'lantern',title:'Lantern supper',description:'Amber lanterns and the last round of jasmine tea.',background:'#243c40',light:'#ffc886'},
  {id:'garden',title:'Tea garden',description:'A quieter service under jade leaves and paper lanterns.',background:'#799d8b',light:'#e6ffe5'},
];

// Adapt the existing role specs from the GLB sockets to the procedural plush rig.
export function dressCharacter(panda,role) {
  if(panda.model.userData.dressed)return;
  panda.model.userData.dressed=true;
  const walking=panda.model.userData.pose==='quadruped';
  const gear=buildGear(headgearSpec(role,{lod:'hero'}));
  const faceGear=['product','architect','scout','debugger'].includes(role);
  gear.position.set(0,walking?0.87:1.25,walking?(faceGear?0.86:0.5):(faceGear?0.7:0.05));gear.scale.setScalar(walking?0.82:1.45);
  panda.bones.Head.add(gear);
  if(!walking){
    if(!panda.materials.scarf){
      const scarf=buildGear(scarfSpec(role,{lod:'hero'}));
      scarf.position.set(0,-0.55,0.12);scarf.scale.setScalar(1.6);panda.bones.Torso.add(scarf);
    }
    const prop=buildGear(propSpec(role,{lod:'hero'}));
    prop.scale.setScalar(1.5);prop.position.set(0,-0.08,0.38);panda.bones.Wrist_R.add(prop);
  }
  if(!ROLES.includes(role)){
    const cream=new THREE.MeshStandardMaterial({color:'#f5e8cc',roughness:1});
    const ink=new THREE.MeshStandardMaterial({color:'#483638',roughness:1});
    const red=new THREE.MeshStandardMaterial({color:'#bd6553',roughness:1});
    const add=(parent,g,mat,p)=>{const m=new THREE.Mesh(g,mat);m.position.set(...p);parent.add(m);return m;};
    if(['herald','docs-writer','knowledge-keeper'].includes(role)){
      add(panda.bones.Wrist_R,new THREE.BoxGeometry(0.48,0.62,0.06),cream,[0,0,0.42]);
      add(panda.bones.Wrist_L,new THREE.CylinderGeometry(0.035,0.05,0.75,8),ink,[0,0,0.36]);
    }
    if(role==='release-manager'){
      const drum=add(panda.bones.Wrist_R,new THREE.CylinderGeometry(0.42,0.42,0.3,24),red,[0,-0.1,0.55]);drum.rotation.x=Math.PI/2;
      const face=add(drum,new THREE.CylinderGeometry(0.4,0.4,0.035,24),cream,[0,0.16,0]);face.name='Festival drum';
    }
    if(role==='stem-cub')add(panda.bones.Head,new THREE.ConeGeometry(0.55,0.75,20),red,[0,1.25,0]);
    else {
      const band=add(panda.bones.Head,new THREE.TorusGeometry(0.88,0.07,6,32),red,[0,0.77,0]);band.rotation.x=Math.PI/2;
      if(role==='knowledge-keeper')add(panda.bones.Head,new THREE.BoxGeometry(1.5,0.35,0.45),ink,[0,1,0]);
    }
  }
}

export function animateActivity(panda,role,time,reduced=false) {
  if(reduced)return;
  const t=time+CHARACTERS.findIndex(c=>c[0]===role)*0.7;
  const b=panda.bones;
  if(role==='stem-cub'){panda.setSleepiness?.(0.95);return;}
  if(role==='qa'){b.Elbow_R.rotation.z=-0.25-0.2*Math.sin(t*0.7);b.Head.rotation.x=0.04*Math.sin(t*0.7);}
  else if(role==='security'){b.Shoulder_R.rotation.x=0.16+0.1*Math.sin(t*2);}
  else if(['herald','docs-writer','knowledge-keeper','product','architect'].includes(role)){
    b.Head.rotation.x=0.10;b.Wrist_L.rotation.y=0.1*Math.sin(t*2);
  }else{b.Shoulder_R.rotation.x=0.12*Math.sin(t*1.7);b.Wrist_R.rotation.z=0.12*Math.sin(t*1.7);}
}

export function createRestaurantDetails(den,sample='morning') {
  const root=new THREE.Group();root.name='Restaurant details';den.world.add(root);
  const materials=[],geometries=[];
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:0.85,...extra});materials.push(m);return m;};
  const wood=mat('#9b633c'),cream=mat('#f6e5bd'),red=mat('#bd5346'),gold=mat('#ddab57'),jade=mat('#406f62');
  const add=(parent,g,m,p)=>{geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(...p);o.castShadow=true;parent.add(o);return o;};
  const box=(parent,size,p,m)=>add(parent,new THREE.BoxGeometry(...size),m,p);
  const cyl=(parent,r,h,p,m)=>add(parent,new THREE.CylinderGeometry(r,r,h,20),m,p);
  const secrets=[];
  const secret=(id,title,text,p)=>{const g=new THREE.Group();g.position.set(...p);g.userData.easterEgg={id,title,text};root.add(g);secrets.push(g);return g;};
  const cart=secret('cart','One more basket','The dim sum trolley never leaves empty. Today’s special: xiao long bao, with a side of green tests.',[-9.4,0,1.5]);
  box(cart,[1.3,0.12,0.8],[0,0.65,0],wood);box(cart,[1.3,0.12,0.8],[0,1.18,0],wood);
  for(const x of [-0.55,0.55])for(const z of [-0.3,0.3]){
    cyl(cart,0.045,0.95,[x,0.7,z],gold);const wheel=cyl(cart,0.14,0.08,[x,0.18,z],jade);wheel.rotation.z=Math.PI/2;
  }
  for(const x of [-0.35,0.35]){cyl(cart,0.25,0.15,[x,1.32,0],gold);cyl(cart,0.23,0.025,[x,1.4,0],cream);}
  const tea=secret('tea','Thank you, two taps','Tap two fingers on the table when someone pours your tea: a small gesture of thanks.',[-4.2,0,6.5]);
  cyl(tea,0.55,0.09,[0,0.9,0],wood);cyl(tea,0.08,0.9,[0,0.45,0],wood);
  const pot=add(tea,new THREE.SphereGeometry(0.19,20,12),jade,[0,1.14,0]);pot.scale.y=0.8;
  const spout=add(tea,new THREE.CylinderGeometry(0.04,0.07,0.23,10),jade,[0.2,1.17,0]);spout.rotation.z=-0.8;
  cyl(tea,0.085,0.09,[-0.27,1,0.08],cream);cyl(tea,0.085,0.09,[0.22,1,0.24],cream);
  const bun=secret('bun','The hidden lucky bao','A tiny smiling bao is hiding by the Pantry. Good fortune comes in steamed parcels.',[8.5,0,7.1]);
  cyl(bun,0.38,0.12,[0,0.25,0],gold);const smile=add(bun,new THREE.SphereGeometry(0.24,20,12),cream,[0,0.45,0]);smile.scale.y=0.75;
  for(const x of [-0.075,0.075])add(bun,new THREE.SphereGeometry(0.022,8,6),jade,[x,0.49,0.22]);
  const menu=secret('menu','Chef’s secret menu','Har gow · siu mai · char siu bao. The off-menu dish? “It works on my steamer.”',[9.4,0,-1.2]);
  box(menu,[0.9,1.2,0.1],[0,0.9,0],wood);box(menu,[0.76,1.02,0.03],[0,0.9,0.065],jade);
  for(let i=0;i<4;i++)box(menu,[0.5,0.025,0.01],[0,1.22-i*0.19,0.09],cream);
  // Hanging lantern canopy, kept behind Bao so the silhouette stays readable.
  const glow=mat(sample==='garden'?'#e8dfb0':'#e9a063',{emissive:'#fbae53',emissiveIntensity:sample==='lantern'?1.3:0.18});
  const canopy=new THREE.Group();canopy.name='Supported lantern canopy';root.add(canopy);
  canopy.userData.reviewPart=canopy.name;
  const cableHeight=x=>7.3-0.7*Math.sin((x+9)/18*Math.PI);
  for(const [x,,z]of LANTERN_POSTS){
    cyl(canopy,0.32,0.18,[x,0.09,z],jade);
    const post=cyl(canopy,0.14,7.3,[x,3.65,z],wood);post.name='Lantern support post';
    for(const y of [0.3,6.95])cyl(canopy,0.18,0.08,[x,y,z],red);
    cyl(canopy,0.2,0.08,[x,7.3,z],gold);
    add(canopy,new THREE.SphereGeometry(0.12,12,8),gold,[x,7.45,z]);
  }
  const cablePoints=Array.from({length:65},(_,i)=>{const x=-9+i*18/64;return new THREE.Vector3(x,cableHeight(x),-5);});
  const cable=add(canopy,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints),128,0.035,6,false),wood,[0,0,0]);
  cable.name='Sagging lantern string';
  for(let i=0;i<9;i++){
    const x=-8+i*2,y=cableHeight(x)-0.75;
    cyl(canopy,0.014,0.39,[x,y+0.555,-5],wood);
    const l=add(canopy,new THREE.SphereGeometry(0.27,16,12),glow,[x,y,-5]);l.scale.y=1.28;
    cyl(canopy,0.17,0.04,[x,y+0.34,-5],red);cyl(canopy,0.03,0.25,[x,y-0.47,-5],gold);
  }
  // Tiny plates and chopsticks on the existing lazy susan, outside the frontier baskets.
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2,x=Math.sin(a)*2,z=3.25+Math.cos(a)*2;
    cyl(root,0.18,0.035,[x,1.18,z],cream);
    for(const dx of [-0.04,0.04])box(root,[0.018,0.018,0.4],[x+dx,1.22,z],wood);
  }
  const steam=[];
  for(const stall of [den.stalls[0],den.stalls[3]]){
    const p=stall.position;
    for(let i=0;i<3;i++){
      const material=mat('#fff4d6',{transparent:true,opacity:0.14,depthWrite:false});
      const puff=add(root,new THREE.SphereGeometry(0.12,10,6),material,[p.x+0.6,1.2+i*0.25,p.z+0.5]);puff.castShadow=false;steam.push({puff,base:puff.position.y,phase:i});
    }
  }
  return {secrets,update(time,reduced=false){for(const s of steam){s.puff.position.y=s.base+(reduced?0:(time*0.22+s.phase*0.1)%0.7);s.puff.material.opacity=reduced?0.12:0.09+0.06*Math.sin(time+s.phase);}},
    dispose(){root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
