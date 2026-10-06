import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBao} from '../scene/procedural/bao.mjs';
import {createDenScene} from '../scene/procedural/den-scene.mjs';
import {canvasDocument} from '../scene/procedural/den-test-helpers.mjs';
import {isDenPositionBlocked} from '../scene/procedural/walk.mjs';
import {prepareReviewLayout,REVIEW_CLEARINGS} from './layout.mjs';
import {createReviewAgents,findReviewPath} from './agents.mjs';
import {createTraditionalGear} from './traditional-props.mjs';
import {compactReviewGear} from './compact-gear.mjs';
import {createReviewLandscape} from './landscape.mjs';
import {createConstructionPads} from './construction-pads.mjs';
import {CONSTRUCTION_PADS,REVIEW_STATIONS,ZONE_POSITIONS} from './site-plan.mjs';
import {createLeisure} from './leisure.mjs';

function withAgents(run){
  const previous=globalThis.document;globalThis.document=canvasDocument();
  let den,agents;
  try{den=createDenScene(THREE,createBao);prepareReviewLayout(den);agents=createReviewAgents(den,createBao);run(agents,den);}
  finally{agents?.dispose();den?.dispose();globalThis.document=previous;}
}

test('bamboo leaves both reviewed zones clear before environment compaction',()=>{
  withAgents((agents,den)=>{
    const stems=den.world.children.filter(o=>/^Bamboo \d+$/.test(o.name));
    for(const stem of stems)for(const c of REVIEW_CLEARINGS)assert.ok(Math.hypot(stem.position.x-c.x,stem.position.z-c.z)>=c.radius);
    assert.equal(agents.actors.size,14);assert.equal(new Set([...agents.actors.values()].map(a=>a.panda)).size,14);
    assert.equal(new Set([...agents.actors.values()].map(a=>a.home.join(','))).size,14);
    assert.equal(agents.actors.get('developer').panda,den.crew.get('developer'),'resident keeps its identity');
  });
});

test('routes go around furniture and refuse unreachable destinations',()=>{
  const obstacles=[{type:'box',x:0,z:0,halfX:2,halfZ:2}];
  const route=findReviewPath([-5,0],[5,0],obstacles);
  assert.ok(route.length>2);
  for(let i=1;i<route.length;i++)for(let j=0;j<=20;j++){
    const x=route[i-1][0]+(route[i][0]-route[i-1][0])*j/20,z=route[i-1][1]+(route[i][1]-route[i-1][1])*j/20;
    assert.ok(!isDenPositionBlocked(x,z,obstacles,0.65));
  }
  assert.equal(findReviewPath([-5,0],[0,0],obstacles),null);
});

test('a single role walks to work, waits for a human answer, completes and returns to leisure; pause freezes all state',()=>{
  withAgents((agents)=>{
    const actor=agents.actors.get('developer'),panda=actor.panda,initial=panda.model.position.clone();
    agents.update(2);assert.ok(panda.model.position.distanceTo(initial)>0.1);
    agents.sendTask('developer','Make dumplings');assert.equal(actor.state,'received');
    const received=actor.panda.model.position.clone(),clock=actor.age;agents.update(30,true);
    assert.equal(actor.age,clock);assert.ok(actor.panda.model.position.equals(received));
    for(let i=0;i<1500&&actor.state!=='needs-you';i++)agents.update(0.1);
    assert.equal(actor.state,'needs-you');assert.equal(actor.panda,panda);
    assert.ok(agents.snapshot().events.some(e=>e.text.includes('inspecting')));
    agents.answer('developer');for(let i=0;i<50;i++)agents.update(0.1);
    assert.equal(actor.state,'complete');assert.ok(actor.reply.includes('Make dumplings'));
    agents.resume('developer');assert.equal(actor.state,'walking');
    assert.equal(agents.sendTask('developer','   '),false);
  });
});

test('greetings preserve a running task and gathering sends the existing roles to distinct dining seats',()=>{
  withAgents(agents=>{
    const actor=agents.actors.get('qa');agents.sendTask('qa','Taste the tea');agents.wave('qa');
    assert.equal(actor.state,'received');assert.ok(actor.wave>0);
    agents.gather();const seats=[];
    for(const role of ['product','architect','designer']){
      const a=agents.actors.get(role);assert.equal(a.destination,'dining');assert.equal(a.state,'walking');seats.push(a.target.join(','));
    }
    assert.equal(new Set(seats).size,seats.length);assert.equal(actor.state,'received','busy role keeps its task');
    assert.equal(agents.snapshot().simulated,true);
  });
});

test('every role can circulate and reach its station without crossing a static obstacle',()=>{
  withAgents(agents=>{
    for(let i=0;i<600;i++){
      agents.update(0.1);
      for(const a of agents.actors.values())if(!a.stationary){
        assert.ok(!isDenPositionBlocked(a.panda.model.position.x,a.panda.model.position.z,agents.obstacles,0.65),`${a.role} crossed furniture at ${a.panda.model.position.toArray()}; next ${a.path[0]}`);
        assert.ok(Math.hypot(a.panda.model.position.x,a.panda.model.position.z)<=23.5,'panda stays inside the garden');
      }
      const actors=[...agents.actors.values()];for(let a=0;a<actors.length;a++)for(let b=a+1;b<actors.length;b++){
        const p=actors[a].panda.model.position,q=actors[b].panda.model.position;
        assert.ok(Math.hypot(p.x-q.x,p.z-q.z)>1.2,`${actors[a].role} overlapped ${actors[b].role}`);
      }
    }
    for(const role of agents.actors.keys())assert.equal(agents.sendTask(role,'Check today’s special'),true);
    for(let i=0;i<1000;i++)agents.update(0.1);
    for(const a of agents.actors.values())assert.equal(a.state,'needs-you',`${a.role} did not reach its station: ${JSON.stringify([...agents.actors.values()].map(a=>({role:a.role,state:a.state,p:[a.panda.model.position.x,a.panda.model.position.z],home:a.home,next:a.path[0]})))}`);
    assert.ok(!agents.snapshot().events.some(e=>e.text.includes('could not find')));
  });
});

test('the horseshoe uses both sides and the rear, with consistent station and future plot clearance',()=>{
  withAgents((agents,den)=>{
    den.stalls.forEach((stall,i)=>{
      const p=REVIEW_STATIONS[i];assert.deepEqual(stall.position.toArray(),[p.x,0,p.z]);
      assert.equal(stall.rotation.y,p.yaw);
      assert.ok(den.obstacles.some(o=>o.type==='box'&&o.x===p.x&&o.z===p.z&&o.rotation===p.yaw));
    });
    const leisure=createLeisure(den,createBao),construction=createConstructionPads(den);
    try{
      for(const [id,position]of Object.entries(ZONE_POSITIONS)){
        const zone=leisure.root.children.find(o=>o.userData.zone===id);assert.deepEqual(zone.position.toArray(),position);
      }
      assert.ok(ZONE_POSITIONS.games[0]<-15&&ZONE_POSITIONS.festival[0]>14);
      assert.equal(construction.pads.size,3);
      for(const pad of CONSTRUCTION_PADS){
        const model=construction.pads.get(pad.id);assert.deepEqual(model.position.toArray(),pad.position);
        assert.ok(pad.position[2]<-14&&Math.hypot(pad.position[0],pad.position[2])+pad.radius<24.5);
        assert.match(model.userData.easterEgg.text,/No station has been assigned/);
        assert.ok(isDenPositionBlocked(pad.position[0],pad.position[2],agents.obstacles,0.65));
        for(const other of CONSTRUCTION_PADS)if(other!==pad)assert.ok(Math.hypot(pad.position[0]-other.position[0],pad.position[2]-other.position[2])>pad.radius+other.radius+2.5);
      }
      const route=findReviewPath([-4,-12],[4,-12],agents.obstacles);assert.ok(route,'rear route stays open below future plots');
      const center=CONSTRUCTION_PADS[1].position;assert.equal(findReviewPath([-4,-12],[center[0],center[2]],agents.obstacles),null,'future plots are not walking destinations');
    }finally{construction.dispose();leisure.dispose();}
    assert.equal(construction.root.parent,null);assert.equal(leisure.root.parent,null);
  });
});

test('Bao stays big and central through greetings, tasks, gatherings and returning to hosting',()=>{
  withAgents(agents=>{
    const bao=agents.actors.get('orchestrator'),position=bao.panda.model.position.clone();assert.equal(bao.panda.model.scale.x,1.75);
    assert.deepEqual(position.toArray(),[0,0,-1.25]);assert.equal(agents.comeHere('orchestrator',[0,10]),false);
    agents.gather();agents.wave('orchestrator');agents.talk('orchestrator');assert.equal(agents.sendTask('orchestrator','Plan tonight’s service'),true);
    for(let i=0;i<70;i++)agents.update(0.1);assert.equal(bao.state,'needs-you');agents.answer('orchestrator');
    for(let i=0;i<30;i++)agents.update(0.1);assert.equal(bao.state,'complete');agents.resume('orchestrator');
    for(let i=0;i<300;i++)agents.update(0.1);assert.ok(bao.panda.model.position.equals(position));assert.equal(bao.panda.model.scale.x,1.75);assert.equal(bao.activity,'Hosting the den');
  });
});

test('merging rigid gear preserves its world bounds, bone sockets and editable grip',()=>{
  const p=createBao(THREE,{detail:'low'}),gear=createTraditionalGear(p,'scout','traveler');
  p.model.position.set(5,0,7);p.model.rotation.y=0.8;p.model.scale.setScalar(0.43);p.model.updateMatrixWorld(true);
  const bounds=[gear.hat,gear.prop].map(o=>new THREE.Box3().setFromObject(o));
  const count=o=>{let n=0;o.traverse(x=>{if(x.isMesh)n++;});return n;},before=count(p.model);
  compactReviewGear(gear);p.model.updateMatrixWorld(true);assert.ok(count(p.model)<before);
  for(const [i,o]of [gear.hat,gear.prop].entries()){
    const after=new THREE.Box3().setFromObject(o);assert.ok(after.min.distanceTo(bounds[i].min)<1e-5);assert.ok(after.max.distanceTo(bounds[i].max)<1e-5);
  }
  const first=gear.prop.getWorldPosition(new THREE.Vector3());gear.applyFit({x:0.4});p.model.updateMatrixWorld(true);
  assert.ok(gear.prop.getWorldPosition(new THREE.Vector3()).distanceTo(first)>0.16);assert.equal(gear.prop.parent,p.bones.Wrist_R);
  gear.dispose();p.dispose();
});

test('the garden is finite, with mountain layers and dense bamboo outside the reviewed clearings',()=>{
  withAgents((agents,den)=>{
    const ground=den.world.getObjectByName('Bamboo clearing');assert.equal(ground.geometry.type,'CylinderGeometry');assert.equal(ground.geometry.parameters.radiusTop,24.5);
    const landscape=createReviewLandscape(den);assert.equal(landscape.peaks.length,3);assert.ok(landscape.stemCount>100);
    const stems=landscape.root.getObjectByName('Dense boundary bamboo'),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
    for(let i=0;i<stems.count;i++){
      stems.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
      for(const c of REVIEW_CLEARINGS)assert.ok(Math.hypot(point.x-c.x,point.z-c.z)>c.radius);
      assert.ok(!(point.z>14&&Math.abs(point.x)<18),'entrance view remains open');
    }
    landscape.dispose();assert.equal(landscape.root.parent,null);
  });
});
