import * as THREE from 'three';
// Review-only clearings must be made before compactEnvironment merges the grove.
export const REVIEW_CLEARINGS=[
  {x:-10,z:-7,radius:4.3},
  {x:10,z:-7,radius:6.5},
];
export function prepareReviewLayout(den){
  const ground=den.world.getObjectByName('Bamboo clearing');
  if(ground){ground.geometry.dispose();ground.geometry=new THREE.CylinderGeometry(24.5,25,0.4,96);ground.rotation.set(0,0,0);ground.position.y=-0.2;}
  const removed=[];
  for(const stem of [...den.world.children]){
    const bamboo=/^Bamboo \d+$/.test(stem.name),grass=stem.isMesh&&stem.geometry.type==='ConeGeometry'&&stem.position.y===0.2;
    if(!bamboo&&!grass)continue;
    if(!REVIEW_CLEARINGS.some(c=>Math.hypot(stem.position.x-c.x,stem.position.z-c.z)<c.radius))continue;
    if(bamboo)removed.push([stem.position.x,stem.position.z]);stem.removeFromParent();
    stem.traverse(o=>o.geometry?.dispose());
  }
  den.obstacles.splice(0,den.obstacles.length,...den.obstacles.filter(o=>!removed.some(([x,z])=>o.type==='circle'&&o.x===x&&o.z===z)));
  for(const roamer of den.roamers)roamer.panda.model.visible=false;
  den.setRoaming(false);
  return removed;
}
