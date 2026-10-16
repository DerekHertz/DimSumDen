import * as THREE from 'three';
import {createSurfaceNavigation} from './navigation.mjs';
export function buildWalkWorld(den){
 const obstacles=[];
 for(const group of den.vegetation.children){
  const radius=group.userData.baseRadius;if(!radius)continue;
  for(const plant of group.children){const p=plant.getWorldPosition(new THREE.Vector3());obstacles.push({type:'circle',x:p.x,z:p.z,radius:radius*plant.scale.y});}
 }
 for(const plant of den.world.userData.bambooBorder?.placements||[])obstacles.push({type:'circle',x:plant.x,z:plant.z,radius:plant.rootRadius});
 den.obstacles=obstacles;
 const navigation=createSurfaceNavigation([...den.zones.values(),...den.roleWorkspaces.workspaces.values()].map(value=>value.group||value));
 return {obstacles,navigation,floorRadius:29,floorCenter:{x:0,z:-1}};
}
