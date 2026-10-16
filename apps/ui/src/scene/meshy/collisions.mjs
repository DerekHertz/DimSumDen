import * as THREE from 'three';
import {createSurfaceNavigation} from './navigation.mjs';
import {PLAYER_EYE_HEIGHT} from './layout.mjs';
export function protectPond(navigation,pavilion){
 const point=new THREE.Vector3(),groundAt=navigation.groundAt;
 return {...navigation,groundAt(x,z,previous=0,radius=.26){
  const ground=groundAt(x,z,previous,radius);if(ground===null)return null;
  point.set(x,0,z);pavilion.worldToLocal(point);
  // The generated pond is part of one textured mesh. Its surface is water,
  // while the higher bridge deck and surrounding rocks remain walkable.
  const water=pavilion.children[0]?.userData.structure
   ? {x:3.8,z:1.62,center:4.03,minimum:.1}
   : {x:3.25,z:2.5,center:2,minimum:.70};
  if(ground<water.minimum&&(point.x/water.x)**2+((point.z-water.center)/water.z)**2<1)return null;
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
 return {obstacles,navigation,eyeHeight:PLAYER_EYE_HEIGHT,floorRadius:29,floorCenter:{x:0,z:-1}};
}
