import * as THREE from 'three';
import {CHARACTERS} from '../procedural/restaurant.mjs';
import {actorBindings,meshMotion} from './layout.mjs';
import {isWalkBlocked} from '../procedural/walk.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createMeshyActors(den){
 const actors=new Map(),definitions=new Map(CHARACTERS.map(c=>[c[0],c]));let bindings=new Map(),selected=null,time=0,held=null;
 for(const source of den.propManifest){
  const model=den.roleWorkspaces.workspaces.get(source.id)?.person;if(!model)continue;
  const [role,name,station,,,concept]=definitions.get(source.id),home=model.position.clone();
  actors.set(role,{role,name,station,concept:!!concept,stationary:role==='orchestrator',panda:{model},home,baseYaw:model.rotation.y,index:actors.size,state:'idle',activity:role==='orchestrator'?'Hosting the Den':'At the workspace',live:null});
 }
 function clearPoint(base,index){
  const others=[...actors.values()].map(a=>a.home);
  for(let ring=1;ring<=7;ring++)for(let step=0;step<18;step++){
   const angle=index*.91+step*Math.PI/9,r=1.25+ring*.55,p={x:base.x+Math.sin(angle)*r,z:base.z+Math.cos(angle)*r};
   const ground=den.walkWorld.navigation ? den.walkWorld.navigation.groundAt(p.x,p.z,0,.45) : 0;
   if(ground===null||isWalkBlocked(p.x,p.z,{...den.walkWorld,groundY:ground})||others.some(a=>distance(a,p)<1.4))continue;
   return new THREE.Vector3(p.x,ground+.07,p.z);
  }
  return base.clone();
 }
 function addVisitor(key,row){
  const base=actors.get(row.role),model=base.panda.model.clone(true),home=clearPoint(base.home,actors.size);
  model.name=base.name+' · visitor';model.userData={roleId:row.role,actorKey:key};
  model.position.copy(home);den.residents.add(model);
  const actor={...base,name:base.name+' (visitor)',panda:{model},home,index:actors.size,live:row,visitor:true,baseYaw:base.baseYaw};
  // A clear short arrival has gentle travel without inventing a skeletal walk cycle.
  for(const side of [1,-1]){
   const start=home.clone().add(new THREE.Vector3(side*.9,0,.6));
   if([0,.25,.5,.75,1].every(t=>{const p=start.clone().lerp(home,t);return !isWalkBlocked(p.x,p.z,{...den.walkWorld,groundY:home.y-.07});})) {model.position.copy(start);actor.arriving=true;break;}
  }
  actors.set(key,actor);return actor;
 }
 function applyLive(rows=[],sharedBindings=null){
  bindings=sharedBindings ? new Map(sharedBindings) : actorBindings(rows,bindings);
  for(const [key,a]of actors)if(a.visitor&&!bindings.has(key)){a.panda.model.removeFromParent();actors.delete(key);}
  for(const [key,row]of bindings){const a=actors.get(key)||addVisitor(key,row);a.live=row;}
  for(const [key,a]of actors){
   a.live=bindings.get(key)||null;a.state=a.live?.state||'idle';a.activity=a.live?.activity||(a.role==='orchestrator'?'Hosting the Den':'At the workspace');
   a.panda.model.userData.ticketRef=a.live?.ref;delete a.panda.model.userData.selected;
  }
  setSelected(selected);
 }
 function setSelected(ref=null){selected=ref;for(const a of actors.values())a.panda.model.userData.selected=!!a.live&&a.live.ref===ref;}
 function liveFigures(){const out=new Map();for(const a of actors.values())if(a.live)out.set(a.live.ref,{model:a.panda.model,panda:a.panda});return out;}
 function hold(key=null){held=key;}
 function update(dt,reduced=false){
  if(!reduced)time+=dt;
  for(const [key,a]of actors){const p=a.panda.model,motion=meshMotion(time,a.index,reduced);
   if(a.arriving&&!reduced&&key!==held){const dx=a.home.x-p.position.x,dz=a.home.z-p.position.z,length=Math.hypot(dx,dz),step=Math.min(dt*.85,length);if(length>.015){p.position.x+=dx/length*step;p.position.z+=dz/length*step;p.rotation.y=Math.atan2(dx,dz);}else{a.arriving=false;p.rotation.y=a.baseYaw;}}
   if(!a.arriving)p.rotation.y=a.baseYaw+(key===held?0:motion.turn);
   p.position.y=a.home.y+motion.lift;p.rotation.z=motion.roll;
  }
 }
 den.walkAvoid=()=>[...actors.values()].map(a=>({x:a.panda.model.position.x,z:a.panda.model.position.z,r:.65}));
 return {actors,applyLive,setSelected,hold,liveFigures,update,dispose(){for(const a of actors.values())if(a.visitor)a.panda.model.removeFromParent();actors.clear();}};
}
