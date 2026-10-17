import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMeshyActors} from './actors.mjs';
import {createBalancedPandaRig} from './panda-rig.mjs';
import definitions from './role-props.mjs';
function fixture(){
 const body=new T.Mesh(new T.BoxGeometry(2,3,1),new T.MeshStandardMaterial());body.position.y=1.5;
 const den={residents:new T.Group(),pandaRigs:new Map(),propManifest:definitions,roleWorkspaces:{workspaces:new Map()},walkWorld:{floorRadius:70,obstacles:[],navigation:{groundAt:()=>.26}}};
 den.createPanda=role=>{const rig=createBalancedPandaRig(body);rig.model.scale.setScalar(.68);rig.model.userData={roleId:role,actorKey:role};den.pandaRigs.set(rig.model,{rig});return{model:rig.model,rig};};
 den.destroyPanda=model=>{den.pandaRigs.get(model)?.rig.dispose();den.pandaRigs.delete(model);};
 for(const[i,d]of definitions.entries()){const panda=den.createPanda(d.id);panda.model.position.set((i%7-3)*3,.26,-8-Math.floor(i/7)*4);den.residents.add(panda.model);den.roleWorkspaces.workspaces.set(d.id,{person:panda.model});}
 const actors=createMeshyActors(den);return{den,actors,dispose(){actors.dispose();for(const model of [...den.pandaRigs.keys()])den.destroyPanda(model);body.geometry.dispose();body.material.dispose();}};
}
test('visitors retain live identities and own skeletons, and release them when their work ends',()=>{
 const f=fixture();try{
  const {actors,den}=f;actors.applyLive([{role:'developer',ref:'work/1'},{role:'developer',ref:'work/2'}]);
  const resident=actors.actors.get('developer'),visitor=actors.actors.get('developer#work/2');
  assert.notEqual(visitor.panda.rig.skeleton,resident.panda.rig.skeleton);assert.equal(visitor.live.ref,'work/2');
  const before=visitor.panda.model.position.clone();actors.update(.1);assert.ok(visitor.panda.model.position.distanceTo(before)>0);assert.notEqual(visitor.panda.rig.bones.Hip_L.quaternion.w,1,'walking deforms the legs');
  actors.applyLive([]);assert.equal(den.pandaRigs.size,14);assert.equal(visitor.panda.model.parent,null);
 }finally{f.dispose();}
});
test('busy residents keep working while independent meeting guests walk, sit and return home',()=>{
 const f=fixture();try{
  const {actors,den}=f;actors.applyLive([{role:'developer',ref:'work/1'}]);
  const resident=actors.actors.get('developer'),home=resident.panda.model.position.clone();
  actors.applyMeeting({id:'meeting/1',ref:'work/meeting',state:'running',seats:[{role:'developer'}]});
  const guest=actors.actors.get('meeting:developer');assert.ok(guest.path.length);assert.notEqual(guest.panda.rig.skeleton,resident.panda.rig.skeleton);
  actors.update(.1);assert.ok(guest.panda.model.position.distanceTo(home)>0);assert.deepEqual(resident.panda.model.position,home);
  actors.update(.1,true);assert.equal(guest.path,null);assert.equal(actors.seatOf('meeting:developer').role,'developer');
  const still=guest.panda.rig.bones.Chest.scale.clone();actors.update(1,true);assert.deepEqual(guest.panda.rig.bones.Chest.scale,still);
  actors.applyMeeting(null);actors.update(.1);assert.equal(guest.leaving,true);
  actors.applyMeeting({id:'meeting/2',ref:'work/next',state:'running',seats:[{role:'developer'}]});
  assert.equal(actors.actors.get('meeting:developer'),guest,'a returning guest joins the next meeting without leaking a copy');assert.equal(den.pandaRigs.size,15);
  actors.applyMeeting(null);actors.update(.1,true);assert.equal(actors.actors.has('meeting:developer'),false);assert.equal(den.pandaRigs.size,14);
 }finally{f.dispose();}
});
