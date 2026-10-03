import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from './walking-bao.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { createLiveDenController } from './controller.mjs';
import { planCells, poseFor, STATION_LABELS } from './bindings.mjs';
import { cameraConfig } from './camera.mjs';
import { createDenExplorer, isDenPositionBlocked } from './explorer.mjs';
import { denEvents } from './events.mjs';

function canvasDocument() {
  return {createElement:()=>({width:0,height:0,getContext:()=>new Proxy({
    createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    measureText:t=>({width:t.length*20}),
  },{get:(target,key)=>key in target?target[key]:(()=>{})})})};
}
function withDen(run) {
  const previous=globalThis.document;globalThis.document=canvasDocument();
  let den,controller;
  try {
    den=createDenScene(THREE,createBao,createWalkingBao,{live:true});
    for(const p of den.pandas)compactPanda(THREE,p);
    compactEnvironment(THREE,den);
    controller=createLiveDenController(den,{onCreate:p=>compactPanda(THREE,p)});
    run(den,controller);
  }finally{controller?.dispose();den?.dispose();globalThis.document=previous;}
}
const cell=(ref,cellType='developer',pose='working')=>({ref,cellType,pose});

test('the assembled scene has five quadruped residents and finite, normalized skinning after compaction',()=>{
  withDen(den=>{
    assert.equal(den.roamers.length,5);
    let meshes=0;
    den.world.traverse(o=>{
      if(!o.isMesh)return;meshes++;
      for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
      if(o.isSkinnedMesh){
        const w=o.geometry.attributes.skinWeight;
        for(let i=0;i<w.count;i++)assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-5);
      }
    });
    assert.ok(meshes<400,'static geometry and plush materials should share draws');
    assert.ok(den.roamers.every(r=>r.panda.skeleton.bones.some(b=>b.name==='Knee_L')));
  });
});

test('board refreshes retain identity, transition poses, and remove resolved figures and queue baskets',()=>{
  withDen((den,controller)=>{
    const first=cell('test/01');
    controller.sync([first],['test/02'],[{counted:7,color:'qi'}]);
    const panda=controller.figures.get(first.ref).panda;
    assert.equal(den.roamers.find(r=>r.cellType==='developer').panda.model.visible,false);
    controller.update(1/60);
    controller.sync([{...first,pose:'waiting_on_user'}],['test/02'],[]);
    assert.equal(controller.figures.get(first.ref).panda,panda);
    controller.update(1/60);
    assert.ok(panda.bones.Shoulder_L.rotation.z>0.8);
    controller.sync([],[],[]);
    assert.equal(controller.figures.size,0);assert.equal(den.frontier.size,0);
    assert.equal(den.roamers.find(r=>r.cellType==='developer').panda.model.visible,true);
    assert.equal(panda.model.parent,null);
  });
});

test('twelve tickets sharing a station have distinct places; synthetic Pass residents carry no ticket',()=>{
  withDen((den,controller)=>{
    const cells=Array.from({length:12},(_,i)=>cell('test/'+String(i+1).padStart(2,'0')));
    const planned=planCells([...cells,{ref:'__pass',cellType:'orchestrator',synthetic:true}]);
    assert.equal(planned.length,12);
    assert.equal(new Set(planned.map(c=>c.placement.position.join(','))).size,12);
    controller.sync(cells,[],[]);assert.equal(controller.figures.size,12);
    for(const f of controller.figures.values())assert.equal(f.panda.model.userData.ticketRef,f.cell.ref);
    controller.sync([cell('test/01','qa')],[],[]);
    assert.equal(controller.figures.size,1);
    assert.equal(controller.figures.get('test/01').panda.model.userData.cellType,'qa');
  });
});

test('reduced motion freezes roaming and holds a pose without accumulating head tilt',()=>{
  withDen((den,controller)=>{
    controller.sync([cell('test/01','qa','blocked')],[],[]);
    controller.update(1/60,{reducedMotion:true});
    const head=controller.figures.get('test/01').panda.bones.Head.rotation.x;
    const positions=den.roamers.map(r=>r.panda.model.position.clone());
    for(let i=0;i<120;i++)controller.update(1/60,{reducedMotion:true});
    assert.ok(Math.abs(controller.figures.get('test/01').panda.bones.Head.rotation.x-head)<1e-10);
    den.roamers.forEach((r,i)=>assert.ok(r.panda.model.position.distanceTo(positions[i])<1e-10));
    assert.notDeepEqual(poseFor('working',0),poseFor('blocked',0));
  });
});

test('walking paths stay clear of furniture, and three paws stay planted throughout the gait',()=>{
  withDen(den=>{
    for(const r of den.roamers)for(let i=0;i<180;i++){
      const a=i/180*Math.PI*2;
      assert.equal(isDenPositionBlocked(r.route.x+Math.cos(a)*r.route.rx,r.route.z+Math.sin(a)*r.route.rz,den.obstacles,0.36),false);
    }
    const p=den.roamers[0].panda;
    for(let i=0;i<200;i++){
      p.pose(i/200,1);p.model.updateMatrixWorld(true);
      let grounded=0;
      for(const name of ['Wrist_L','Wrist_R','Ankle_L','Ankle_R']){
        const foot=p.bones[name].getWorldPosition(new THREE.Vector3());
        if(foot.y/p.model.scale.y<0.15)grounded++;
      }
      assert.ok(grounded>=3,'a calm four-beat walk keeps at least three paws down');
    }
  });
});

test('the default desktop and phone cameras contain every station label and the Tally',()=>{
  for(const [width,height] of [[1440,900],[375,667]]){
    const config=cameraConfig({width,height}),camera=new THREE.OrthographicCamera(config.left,config.right,config.top,config.bottom,config.near,config.far);
    camera.position.set(...config.position);camera.lookAt(...config.target);camera.updateMatrixWorld(true);
    for(const l of STATION_LABELS){
      const p=new THREE.Vector3(l.x,l.y,l.z).project(camera);
      assert.ok(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,l.id+' should fit');
    }
    const tally=new THREE.Vector3(2.62,2,6.05).project(camera);
    assert.ok(Math.abs(tally.x)<=1&&Math.abs(tally.y)<=1);
  }
});

function eventTarget(){
  const listeners=new Map();
  return {listeners,
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    emit(type,event={}){for(const fn of listeners.get(type)||[])fn(event);},
    count(){return [...listeners.values()].reduce((n,s)=>n+s.size,0);},
  };
}
test('first-person fallback accepts scene keys, ignores fields and buttons, and cleans up its listeners',()=>{
  const doc=eventTarget(),win=eventTarget(),canvas=eventTarget(),previousDoc=globalThis.document,previousWin=globalThis.window;
  doc.pointerLockElement=null;win.matchMedia=()=>({matches:false});
  canvas.requestPointerLock=()=>{throw Error('unavailable in test');};
  canvas.setPointerCapture=()=>{};
  globalThis.document=doc;globalThis.window=win;
  let explorer;
  try {
    const navigation={enabled:true},modes=[];
    explorer=createDenExplorer(THREE,{canvas,orbitControls:navigation,den:{obstacles:[],roamers:[]},onModeChange:v=>modes.push(v)});
    explorer.enter();assert.equal(navigation.enabled,false);
    const start=explorer.camera.position.z;
    doc.emit('keydown',{code:'KeyW',target:{closest:()=>({})},preventDefault(){}});
    explorer.update(0.1);assert.equal(explorer.camera.position.z,start);
    doc.emit('keydown',{code:'KeyW',target:{closest:()=>null},preventDefault(){}});
    explorer.update(0.1);assert.ok(explorer.camera.position.z<start);
    doc.emit('focusin');const paused=explorer.camera.position.z;
    explorer.update(0.1);assert.equal(explorer.camera.position.z,paused);
    doc.emit('keydown',{code:'Escape',target:{closest:()=>null},preventDefault(){}});
    assert.deepEqual(modes,[true,false]);assert.equal(navigation.enabled,true);
    explorer.dispose();explorer=null;
    assert.equal(doc.count()+win.count()+canvas.count(),0);
  }finally{explorer?.dispose();globalThis.document=previousDoc;globalThis.window=previousWin;}
});
test('pointer-lock picking uses the crosshair and normal picking delegates to the existing event manager',()=>{
  const canvas={},previous=globalThis.document;globalThis.document={pointerLockElement:canvas};
  try{
    let delegated=0,center=null,picked=false;
    const stage={explorer:{active:true}},manager=denEvents({compute(){delegated++;}},stage);
    const state={gl:{domElement:canvas},camera:{},pointer:{set(x,y){center=[x,y];}},raycaster:{setFromCamera(){picked=true;}}};
    manager.compute({},state);assert.deepEqual(center,[0,0]);assert.equal(picked,true);assert.equal(delegated,0);
    stage.explorer.active=false;manager.compute({},state);assert.equal(delegated,1);
  }finally{globalThis.document=previous;}
});

test('no panda perches on Bao: Pass roles stand on the Library and Drum pads, and Bao is the orchestrator',()=>{
  withDen((den,controller)=>{
    const onBao=p=>{for(let o=p.model.parent;o;o=o.parent)if(o===den.hero.model)return true;return false;};
    assert.deepEqual(den.pandas.slice(1).filter(onBao).map(p=>p.model.name),[]);
    assert.equal(den.crew.has('orchestrator'),false);
    const planned=planCells([cell('t/01','product'),cell('t/02','architect'),cell('t/03','orchestrator')]);
    for(const c of planned)assert.ok(!['crown','left-shoulder','right-shoulder'].includes(c.placement.parent),c.cellType);
    const at=role=>planned.find(c=>c.cellType===role).placement;
    assert.ok(Math.abs(at('product').position[0]-(-5.1))<1.1&&Math.abs(at('product').position[2]-(-6.8))<1.1,'product on the Library pad');
    assert.ok(Math.abs(at('architect').position[0]-5.1)<1.1&&Math.abs(at('architect').position[2]-(-6.8))<1.1,'architect on the Drum pad');
    controller.sync([cell('t/03','orchestrator')],[],[]);
    assert.equal(controller.figures.size,0,'live orchestrator work shows on Bao, not as another panda');
    controller.sync([cell('t/01','product')],[],[]);
    assert.equal(onBao(controller.figures.get('t/01').panda),false);
    assert.equal(den.crew.get('product').model.visible,false,'the resident is taken over');
  });
});
