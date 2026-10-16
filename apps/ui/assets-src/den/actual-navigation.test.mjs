import test from 'node:test';
import assert from 'node:assert/strict';
import { SITES,siteGeometry,routeToInterior } from './check-navigation.mjs';
import { createSurfaceNavigation } from '../../src/scene/meshy/navigation.mjs';
import { walk,WALK } from '../../src/scene/procedural/walk.mjs';
import { protectPond } from '../../src/scene/meshy/collisions.mjs';

for(const site of SITES)test(`walk into and back out of the shipped ${site.id} interior`,async()=>{
 const root=await siteGeometry(site),rawNavigation=createSurfaceNavigation([root]);
 const navigation=site.id==='pavilion'?protectPond(rawNavigation,root):rawNavigation;
 const route=routeToInterior(root,navigation,{includePath:true});
 assert.equal(route.ok,true,JSON.stringify(route));
 const world={floorRadius:29,floorCenter:{x:0,z:-1},obstacles:[],navigation};
 let state={...route.path[0],groundY:0,y:WALK.eyeHeight,pitch:0,yaw:0,walkTime:0};
 for(const target of [...route.path.slice(1),...route.path.slice(0,-1).reverse()]){
  const dx=target.x-state.x,dz=target.z-state.z,distance=Math.hypot(dx,dz);
  state=walk({...state,yaw:Math.atan2(-dx,-dz)},{forward:1,reducedMotion:true},distance/WALK.speed,world);
  assert.ok(Math.hypot(state.x-target.x,state.z-target.z)<.025,`blocked at ${JSON.stringify({state,target})}`);
 }
 assert.ok(Math.abs(state.groundY)<.05,'back at garden-floor height');
});
