import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import { SITES,siteGeometry,routeToInterior } from './check-navigation.mjs';
import { createSurfaceNavigation } from '../../src/scene/meshy/navigation.mjs';
import { walk,WALK } from '../../src/scene/procedural/walk.mjs';
import { protectPond } from '../../src/scene/meshy/collisions.mjs';

for(const site of SITES)test(`walk into and back out of the shipped ${site.id} interior`,async()=>{
 const root=await siteGeometry(site),rawNavigation=createSurfaceNavigation([root]);
 const navigation=site.id==='pavilion'?protectPond(rawNavigation,root):rawNavigation;
 const route=routeToInterior(root,navigation,{includePath:true});
 assert.equal(route.ok,true,JSON.stringify(route));
 const world={floorRadius:29,floorCenter:{x:0,z:-1},obstacles:[],navigation,eyeHeight:1.82};
 let state={...route.path[0],groundY:0,y:world.eyeHeight,pitch:0,yaw:0,walkTime:0};
 if(site.id==='steamers'){
  const counter=root.localToWorld(new Vector3(0,.36,1.4));
  assert.equal(navigation.groundAt(counter.x,counter.z,.36),null,'the kiosk service counter stays solid in the placed walking world');
 }
 if(site.id==='pavilion'){
  const bridge=root.children[0].userData.structure.bridge;
  assert.ok(route.path.some(p=>{
   const local=root.worldToLocal(new Vector3(p.x,p.y,p.z));
   return local.x>=bridge.min[0]&&local.x<=bridge.max[0]&&local.z>=bridge.min[2]&&local.z<=bridge.max[2]&&Math.abs(local.y-bridge.top)<.03;
  }),'the approach must cross the bamboo bridge');
  const water=root.localToWorld(new Vector3(1.6,0,4.03));
  assert.equal(navigation.groundAt(water.x,water.z,0),null,'pond water must not become a walkable floor');
 }
 for(const target of [...route.path.slice(1),...route.path.slice(0,-1).reverse()]){
  const dx=target.x-state.x,dz=target.z-state.z,distance=Math.hypot(dx,dz);
  state=walk({...state,yaw:Math.atan2(-dx,-dz)},{forward:1,reducedMotion:true},distance/WALK.speed,world);
  assert.ok(Math.hypot(state.x-target.x,state.z-target.z)<.025,`blocked at ${JSON.stringify({state,target})}`);
  assert.ok(Math.abs(state.y-state.groundY-world.eyeHeight)<.03,'adult eye height stays anchored to every tread');
 }
 assert.ok(Math.abs(state.groundY)<.05,'back at garden-floor height');
 assert.ok(Math.abs(state.y-world.eyeHeight)<.05,'eye height returns to adult eye level');
});
