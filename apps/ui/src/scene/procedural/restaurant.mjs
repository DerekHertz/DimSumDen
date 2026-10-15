import * as THREE from 'three';
import { ROLES, headgearSpec, propSpec, scarfSpec } from './headgear.mjs';
import { buildGear } from './gear-object.mjs';

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
