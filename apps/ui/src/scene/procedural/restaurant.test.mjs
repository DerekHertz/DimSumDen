import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { CHARACTERS, dressCharacter, animateActivity } from './restaurant.mjs';

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

