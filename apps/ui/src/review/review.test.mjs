import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBao} from '../scene/procedural/bao.mjs';
import {createWalkingBao} from './walking-panda.mjs';
import {CHARACTERS} from '../scene/procedural/restaurant.mjs';
import {createTraditionalGear,DIRECTIONS,TRADITIONAL_PROPS,bellySurface} from './traditional-props.mjs';
import {normalizeReview,reviewHtml} from './review-data.mjs';
import {createLeisure,LEISURE_ZONES} from './leisure.mjs';
import {withDen} from '../scene/procedural/den-test-helpers.mjs';

test('body, head and leg sliders alter real mesh extents; gait changes alter planted-paw motion',()=>{
  const narrow=createWalkingBao(THREE,createBao,{bodyWidth:0.65,headScale:0.7,legWidth:0.7});
  const wide=createWalkingBao(THREE,createBao,{bodyWidth:1.5,headScale:1.35,legWidth:1.5});
  const size=(p,name)=>{const g=p.model.getObjectByName(name).geometry;g.computeBoundingBox();return g.boundingBox.getSize(new THREE.Vector3());};
  assert.ok(size(wide,'WalkingBody').x>size(narrow,'WalkingBody').x*2);
  assert.ok(size(wide,'HeadShape').x>size(narrow,'HeadShape').x*1.8);
  assert.ok(size(wide,'Limb_Shoulder_L').x>size(narrow,'Limb_Shoulder_L').x*1.4);
  narrow.setGait({stride:0.35,lift:0.06});narrow.pose(0.9);narrow.model.updateMatrixWorld(true);
  const first=narrow.bones.Wrist_L.getWorldPosition(new THREE.Vector3());
  narrow.setGait({stride:0.8,lift:0.2});narrow.pose(0.9);narrow.model.updateMatrixWorld(true);
  assert.ok(narrow.bones.Wrist_L.getWorldPosition(new THREE.Vector3()).distanceTo(first)>0.08);
  narrow.dispose();wide.dispose();
});

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

test('leisure activation changes visible props and animated pandas, and detaches on disposal',()=>{
  withDen(den=>{
    const leisure=createLeisure(den,createBao);assert.equal(leisure.residents.length,17);
    for(const {id}of LEISURE_ZONES){leisure.activate(id);assert.equal(leisure.active[id],true);}
    leisure.update(1);const arm=leisure.residents[4].bones.Shoulder_R.rotation.x;leisure.update(2);assert.notEqual(leisure.residents[4].bones.Shoulder_R.rotation.x,arm);
    leisure.activate('training');assert.equal(leisure.active.training,false);leisure.dispose();assert.equal(leisure.root.parent,null);
  });
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

test('roaming panda has shoulder/hip pivots, no neck segment or elbow/knee bulges, and planted paws',()=>{
  const p=createWalkingBao(THREE,createBao,{bodyWidth:1.24,headScale:1.35,legWidth:1.5});
  assert.equal(p.model.getObjectByName('Neck'),undefined);
  assert.equal(p.model.getObjectByName('ShoulderBand'),undefined);
  const marking=p.model.getObjectByName('ShoulderMarking');assert.ok(marking);
  marking.geometry.computeBoundingBox();assert.ok(marking.geometry.boundingBox.max.z<1,'shoulder fur ends behind the neck');
  assert.ok(!p.skeleton.bones.some(b=>/Elbow|Knee/.test(b.name)));
  assert.ok(!p.model.children.some(o=>/Joint_|Lower_/.test(o.name)));
  for(let i=0;i<64;i++){
    p.pose(i/64);p.model.updateMatrixWorld(true);
    for(const name of ['Wrist_L','Wrist_R','Ankle_L','Ankle_R']){
      const y=p.bones[name].getWorldPosition(new THREE.Vector3()).y;
      assert.ok(y>=0.139&&y<=0.241,'paws retain ground clearance without bending halfway down the limb');
    }
  }
  p.dispose();
});

test('dining and dragon activities start, pause and stop; carrying poles stay attached in world space',()=>{
  withDen(den=>{
    const leisure=createLeisure(den,createBao),{dining,dragon}=leisure;
    assert.equal(dining.diners.length,4);assert.equal(dining.baskets.length,4);assert.equal(dragon.carriers.length,4);assert.equal(dragon.performers.length,5);
    const initial=dragon.segments[0].position.clone();leisure.update(3);assert.ok(dragon.segments[0].position.equals(initial));assert.equal(dining.lazySusan.rotation.y,0);
    leisure.activate('dining');leisure.activate('dragon');leisure.update(1);
    const first=dragon.segments[0].position.clone(),wrist=dining.diners[0].bones.Wrist_R.rotation.z;
    leisure.update(2);assert.ok(dragon.segments[0].position.distanceTo(first)>0.1);assert.notEqual(dining.diners[0].bones.Wrist_R.rotation.z,wrist);assert.ok(dining.lazySusan.rotation.y>0);
    const paused=dragon.segments[0].position.clone(),rotation=dining.lazySusan.rotation.y;leisure.update(9,true);assert.ok(dragon.segments[0].position.equals(paused));assert.equal(dining.lazySusan.rotation.y,rotation);
    dragon.root.rotation.y=0.4;dragon.root.scale.setScalar(1.2);leisure.update(3);den.world.updateMatrixWorld(true);
    for(const {panda,pole}of dragon.carriers){
      const bottom=pole.localToWorld(new THREE.Vector3(0,-0.5,0)),hand=panda.bones.Wrist_L.getWorldPosition(new THREE.Vector3());
      assert.ok(bottom.distanceTo(hand)<1e-6,'pole follows the panda hand after courtyard translation/rotation');
    }
    for(let i=0;i<40;i++){leisure.update(i/10);den.world.updateMatrixWorld(true);for(const pole of dragon.poles)assert.ok(pole.matrixWorld.elements.every(Number.isFinite));}
    leisure.activate('dining');leisure.activate('dragon');assert.equal(dining.lazySusan.rotation.y,0);assert.ok(dragon.segments[0].position.equals(initial));
    leisure.dispose();assert.equal(dining.root.parent,null);assert.equal(dragon.root.parent,null);
  });
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
