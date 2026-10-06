import * as THREE from 'three';
import {REVIEW_STATIONS,REVIEW_CLEARINGS,ROLE_HOMES} from './site-plan.mjs';
export {REVIEW_CLEARINGS} from './site-plan.mjs';
// Review-only clearings must be made before compactEnvironment merges the grove.
export function prepareReviewLayout(den){
  const ground=den.world.getObjectByName('Bamboo clearing');
  if(ground){ground.geometry.dispose();ground.geometry=new THREE.CylinderGeometry(24.5,25,0.4,96);ground.rotation.set(0,0,0);ground.position.y=-0.2;}
  den.stalls.forEach((stall,i)=>{
    const old=stall.position.clone(),o=den.obstacles.find(o=>o.type==='box'&&o.x===old.x&&o.z===old.z),placement=REVIEW_STATIONS[i];
    stall.position.set(placement.x,0,placement.z);stall.rotation.y=placement.yaw;
    if(o)Object.assign(o,{x:placement.x,z:placement.z,rotation:placement.yaw});
  });
  // Move the two decorative Pass pads; the old center obstacles are cleared below.
  for(const o of [...den.world.children])if(o.position.z===-6.8&&Math.abs(o.position.x)===5.1){
    const target=ROLE_HOMES[o.position.x<0?'product':'architect'];o.position.x=target[0];o.position.z=target[1];
  }
  const removed=[],unusedMaterials=new Set();
  for(const stem of [...den.world.children]){
    const bamboo=/^Bamboo \d+$/.test(stem.name),grass=stem.isMesh&&stem.geometry.type==='ConeGeometry'&&stem.position.y===0.2;
    const stone=stem.name==='Stepping stone'||stem.isMesh&&stem.geometry.type==='CylinderGeometry'&&stem.position.y===0.015;
    if(!bamboo&&!grass&&!stone)continue;
    if(!stone&&Math.hypot(stem.position.x,stem.position.z)>19.5&&!REVIEW_CLEARINGS.some(c=>Math.hypot(stem.position.x-c.x,stem.position.z-c.z)<c.radius))continue;
    if(bamboo)removed.push([stem.position.x,stem.position.z]);stem.removeFromParent();
    stem.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))unusedMaterials.add(m);});
  }
  den.obstacles.splice(0,den.obstacles.length,...den.obstacles.filter(o=>!(o.type==='circle'&&o.z===-6.8)&&!removed.some(([x,z])=>o.type==='circle'&&o.x===x&&o.z===z)));
  const used=new Set();den.world.traverse(o=>{if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))used.add(m);});
  for(const m of unusedMaterials)if(!used.has(m))m.dispose();
  for(const roamer of den.roamers)roamer.panda.model.visible=false;
  den.setRoaming(false);
  return removed;
}
