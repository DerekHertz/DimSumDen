import * as THREE from 'three';
import {createSurfaceNavigation} from './navigation.mjs';
export function protectPond(navigation,pavilion){
 const point=new THREE.Vector3(),groundAt=navigation.groundAt;
 return {...navigation,groundAt(x,z,previous=0,radius=.26){
  const ground=groundAt(x,z,previous,radius);if(ground===null)return null;
  point.set(x,0,z);pavilion.worldToLocal(point);
  // The generated pond is part of one textured mesh. Its surface is water,
  // while the higher bridge deck and surrounding rocks remain walkable.
  if(ground<.70&&(point.x/3.25)**2+((point.z-2)/2.5)**2<1)return null;
  return ground;
 }};
}
export function buildWalkWorld(den){
 const obstacles=[];
 for(const group of den.vegetation.children){
  const radius=group.userData.baseRadius;if(!radius)continue;
  for(const plant of group.children){const p=plant.getWorldPosition(new THREE.Vector3());obstacles.push({type:'circle',x:p.x,z:p.z,radius:radius*plant.scale.y});}
 }
 for(const plant of den.world.userData.bambooBorder?.placements||[])obstacles.push({type:'circle',x:plant.x,z:plant.z,radius:plant.rootRadius});
 den.obstacles=obstacles;
 const navigation=protectPond(createSurfaceNavigation([...den.zones.values(),...den.roleWorkspaces.workspaces.values()].map(value=>value.group||value)),den.zones.get('pavilion'));
 return {obstacles,navigation,floorRadius:29,floorCenter:{x:0,z:-1}};
}
