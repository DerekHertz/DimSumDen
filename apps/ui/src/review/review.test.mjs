import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBao} from '../scene/procedural/bao.mjs';
import {CHARACTERS} from '../scene/procedural/restaurant.mjs';
import {createTraditionalGear,DIRECTIONS,TRADITIONAL_PROPS,bellySurface} from './traditional-props.mjs';
import {normalizeReview,reviewHtml} from './review-data.mjs';

test('all fourteen characters have three traditional directions, paw-relative grips and editable fit',()=>{
  for(const [role]of CHARACTERS)for(const [direction]of DIRECTIONS){
    const p=createBao(THREE,{detail:'low'}),gear=createTraditionalGear(p,role,direction);
    assert.equal(gear.prop.parent,role==='stem-cub'?p.bones.Root:p.bones.Wrist_R);
    const base=gear.prop.position.clone();gear.applyFit({x:0.4,y:-0.2,z:0.3,tilt:35,scale:1.2});
    assert.ok(gear.prop.position.distanceTo(base.clone().add(new THREE.Vector3(0.4,-0.2,0.3)))<1e-9);
    assert.equal(gear.prop.scale.x,1.2);assert.ok(!/tablet|headphone|goggle|headlamp/i.test(gear.name));
    p.model.updateMatrixWorld(true);assert.ok(gear.prop.matrixWorld.elements.every(Number.isFinite));gear.dispose();p.dispose();
  }
});

test('review round-trip preserves notes, settings, camera and fits without HTML injection',()=>{
  const value={format:'dim-sum-den-review',version:2,settings:{bodyWidth:1.5},placements:{'qa:scholar':{x:0.3}},notes:[{id:'n1',label:'Cup',text:'Move closer </script><script>alert(1)</script>',point:[1,2,3],camera:{position:[5,3,7],target:[0,1,0]},fit:{z:0.2},settings:{headScale:1.35}}]};
  const result=normalizeReview(JSON.parse(JSON.stringify(value)));
  assert.equal(result.notes[0].text,value.notes[0].text);assert.equal(result.settings.bodyWidth,1.5);assert.equal(result.placements['qa:scholar'].x,0.3);assert.deepEqual(result.notes[0].camera.target,[0,1,0]);
  const html=reviewHtml('<html><head></head><body></body></html>',result);
  assert.ok(!html.includes('</script><script>alert'));assert.ok(html.includes('\\u003c/script>'));
  const bundleSource='<html><head><script type="module">const tag=`<head><script id="review-seed" type="application/json">`; console.log(tag);</script></head><body></body></html>';
  const exported=reviewHtml(bundleSource,result);assert.ok(exported.includes('console.log(tag)'));
  const exportedAgain=reviewHtml(exported,result);assert.equal((exportedAgain.match(/<script id="review-seed" type="application\/json">/g)||[]).length,2,'one real seed and one literal in the intact bundle');
  assert.throws(()=>normalizeReview({format:'wrong',version:2}));
});

test('traveler identities are unique, sash follows the belly and shoulder seams overlap the arm roots',()=>{
  assert.equal(new Set(Object.values(TRADITIONAL_PROPS).map(names=>names[2])).size,14);
  const p=createBao(THREE),gear=createTraditionalGear(p,'orchestrator','traveler');
  p.model.updateMatrixWorld(true);
  const tail=p.model.getObjectByName('Conforming sash tail'),positions=tail.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(tail.matrixWorld);
    assert.ok(point.z>bellySurface(point.x,point.y)+0.05,'cloth clears the belly');
  }
  const seams=[];p.model.traverse(o=>{if(o.name==='Shoulder seam')seams.push(o);});assert.equal(seams.length,2);
  for(const seam of seams){const position=seam.getWorldPosition(new THREE.Vector3());const shoulder=p.bones[position.x>0?'Shoulder_L':'Shoulder_R'].getWorldPosition(new THREE.Vector3());assert.ok(position.distanceTo(shoulder)<0.25);}
  gear.dispose();p.dispose();
});

test('Bao’s medallion clears the headband and the Drummer has a folded cloth cap',()=>{
  for(const [direction]of DIRECTIONS){
    const panda=createBao(THREE,{detail:'low'}),gear=createTraditionalGear(panda,'orchestrator',direction);panda.model.updateMatrixWorld(true);
    const band=new THREE.Box3().setFromObject(gear.hat.getObjectByName('Cloth headband'));
    const medallion=new THREE.Box3().setFromObject(gear.hat.getObjectByName('Jade medallion'));
    assert.ok(medallion.min.z>band.max.z,'headband cannot cover the jade medallion');gear.dispose();panda.dispose();
  }
  const panda=createBao(THREE,{detail:'low'}),gear=createTraditionalGear(panda,'release-manager','teahouse');assert.ok(gear.hat.getObjectByName('Folded festival cap'));gear.dispose();panda.dispose();
});
