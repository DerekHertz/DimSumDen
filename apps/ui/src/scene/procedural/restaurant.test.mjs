import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from './walking-bao.mjs';
import { PANDA_CONTROLS, pandaSettings } from './panda-settings.mjs';
import { CHARACTERS, dressCharacter, animateActivity, createRestaurantDetails } from './restaurant.mjs';
import { withDen } from './den-test-helpers.mjs';

test('walking panda edits retain finite skinning and grounded paws across extreme supported settings',()=>{
  for(const bound of [2,3]){
    const settings=pandaSettings(Object.fromEntries(PANDA_CONTROLS.map(c=>[c[0],c[bound]])));
    const p=createWalkingBao(THREE,createBao,settings);
    for(let i=0;i<=64;i++){
      p.pose(i/64);p.model.updateMatrixWorld(true);
      for(const bone of p.skeleton.bones)assert.ok(bone.matrixWorld.elements.every(Number.isFinite));
      for(const name of ['Wrist_L','Wrist_R','Ankle_L','Ankle_R'])assert.ok(p.bones[name].getWorldPosition(new THREE.Vector3()).y>0.05,'paw clears the ground');
    }
    assert.equal(p.stride,settings.stride);p.dispose();
  }
  assert.equal(pandaSettings({stride:Infinity}).stride,0.52);
  assert.equal(pandaSettings({stride:99}).stride,0.8);
});

test('every defined character has a dressed Three.js model and finite activity pose',()=>{
  assert.equal(new Set(CHARACTERS.map(c=>c[0])).size,14);
  for(const [role]of CHARACTERS){
    const p=createBao(THREE,{detail:'low'});
    dressCharacter(p,role);const count=p.bones.Head.children.length;
    dressCharacter(p,role);assert.equal(p.bones.Head.children.length,count);
    for(const t of [0,0.1,2,10]){animateActivity(p,role,t);p.model.updateMatrixWorld(true);for(const b of p.skeleton.bones)assert.ok(b.matrixWorld.elements.every(Number.isFinite));}
    p.dispose();
  }
});

test('restaurant discoveries have distinct identities and clean up independently of the den',()=>{
  withDen(den=>{
    const details=createRestaurantDetails(den,'lantern');
    assert.deepEqual(details.secrets.map(s=>s.userData.easterEgg.id),['cart','tea','bun','menu']);
    details.update(12);details.update(12,true);
    const root=den.world.getObjectByName('Restaurant details');assert.ok(root);
    details.dispose();assert.equal(root.parent,null);assert.ok(den.hero.model.parent);
  });
});
