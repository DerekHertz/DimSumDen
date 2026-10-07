import * as THREE from 'three';
import {createTraditionalGear} from './traditional-props.mjs';
import {compactPanda} from '../scene/procedural/compact.mjs';
import {createDiningTable} from './dining-table.mjs';
import {createDragonDance} from './dragon-dance.mjs';
import {ZONE_POSITIONS,isReviewPlantingClear} from './site-plan.mjs';

export const LEISURE_ZONES=[
  {id:'tea',name:'Lotus tea pavilion',hint:'Pour tea and watch the lotus pond.',activity:'Tea break',position:ZONE_POSITIONS.tea},
  {id:'games',name:'Bamboo game table',hint:'Shuffle the mahjong tiles for a new hand.',activity:'Mahjong with friends',position:ZONE_POSITIONS.games},
  {id:'training',name:'Traveler’s courtyard',hint:'Ring the training gong and start practice.',activity:'Staff practice',position:ZONE_POSITIONS.training},
  {id:'festival',name:'Festival stage',hint:'Start the drum circle and spin the ribbons.',activity:'A little festival',position:ZONE_POSITIONS.festival},
  {id:'dining',name:'Dim sum dining table',hint:'Share bao, siu mai, har gow and custard buns. Turn the lazy Susan while the pandas reach with their chopsticks.',activity:'Dim sum with friends',position:ZONE_POSITIONS.dining},
  {id:'dragon',name:'Dragon dance courtyard',hint:'A panda troupe carries the festival dragon on poles, chasing a pearl with a rippling silk body.',activity:'Start the dragon dance',position:ZONE_POSITIONS.dragon},
];
export function createLeisure(den,createBao){
  const root=new THREE.Group();root.name='Bamboo leisure gardens';den.world.add(root);
  const geometry=new Set(),materials=new Set(),residents=[],gears=[],animated={};
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:0.9,...extra});materials.add(m);return m;};
  const wood=mat('#87623f'),jade=mat('#47715d'),leaf=mat('#507549'),gold=mat('#c5a574'),cream=mat('#e6d9b7'),red=mat('#a75b4a'),water=mat('#608e89',{roughness:0.28,metalness:0.18}),stone=mat('#b8b9a1');
  const add=(p,g,m,v=[0,0,0])=>{geometry.add(g);const o=new THREE.Mesh(g,m);o.position.set(...v);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const cyl=(p,r,h,v,m)=>add(p,new THREE.CylinderGeometry(r,r,h,20),m,v);
  const box=(p,s,v,m)=>add(p,new THREE.BoxGeometry(...s),m,v);
  const ring=(p,r,t,v,m)=>{const o=add(p,new THREE.TorusGeometry(r,t,8,48),m,v);o.rotation.x=Math.PI/2;return o;};
  const allZones=new Map();
  const zone=(info,radius)=>{const g=new THREE.Group();g.position.set(...info.position);g.name=info.name;g.userData.zone=info.id;root.add(g);allZones.set(info.id,g);cyl(g,radius,0.06,[0,0.03,0],stone);ring(g,radius,0.04,[0,0.08,0],gold);return g;};
  const panda=(parent,x,z,role,style,yaw=0)=>{const p=createBao(THREE,{detail:'low'});p.model.position.set(x,0.1,z);p.model.scale.setScalar(0.34);parent.add(p.model);p.model.rotation.y=yaw;compactPanda(THREE,p);const gear=createTraditionalGear(p,role,style);gears.push(gear);residents.push(p);return p;};
  const tea=zone(LEISURE_ZONES[0],2.7);
  for(const x of [-1.7,1.7])for(const z of [-1.5,1.5])cyl(tea,0.085,3.4,[x,1.7,z],wood);
  const roof=add(tea,new THREE.ConeGeometry(3.0,0.85,4),jade,[0,3.55,0]);roof.rotation.y=Math.PI/4;
  const table=cyl(tea,0.7,0.1,[0,0.65,0],wood);cyl(tea,0.1,0.65,[0,0.33,0],wood);
  const pot=add(tea,new THREE.SphereGeometry(0.18,20,12),red,[0,0.84,0]);pot.scale.y=0.8;
  for(const x of [-0.35,0.35])cyl(tea,0.07,0.07,[x,0.73,0],cream);
  const teaPanda=panda(tea,-1,0.3,'qa','scholar',0.7);panda(tea,1,0.3,'product','teahouse',-0.7);
  const pond=new THREE.Group();pond.position.set(-2,0,3.9);tea.add(pond);
  cyl(pond,1.8,0.08,[0,0.02,0],stone);const pool=cyl(pond,1.65,0.015,[0,0.068,0],water);pool.castShadow=false;
  for(let i=0;i<5;i++){const a=i*2.4,x=Math.sin(a)*1.2,z=Math.cos(a)*1.2;cyl(pond,0.23,0.02,[x,0.1,z],jade);const flower=add(pond,new THREE.SphereGeometry(0.09,12,8),cream,[x,0.15,z]);flower.scale.y=0.55;}
  const koi=box(pond,[0.18,0.035,0.06],[0,0.085,0],red);animated.tea={panda:teaPanda,koi,pot};
  const games=zone(LEISURE_ZONES[1],2.4);
  box(games,[1.75,0.1,1.75],[0,0.58,0],wood);box(games,[1.6,0.03,1.6],[0,0.65,0],jade);
  for(const x of [-0.65,0.65])for(const z of [-0.65,0.65])cyl(games,0.05,0.55,[x,0.28,z],wood);
  const tiles=[];
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const tile=box(games,[0.1,0.09,0.15],[Math.sin(a)*0.58,0.71,Math.cos(a)*0.58],cream);tile.rotation.y=-a;box(tile,[0.035,0.005,0.05],[0,0.049,0],red);tiles.push(tile);}
  const gamePanda=panda(games,-1.25,0.8,'designer','scholar',0.8);panda(games,1.25,0.8,'herald','traveler',-0.8);animated.games={tiles,panda:gamePanda};
  const training=zone(LEISURE_ZONES[2],2.8);
  for(const x of [-1.45,1.45])cyl(training,0.09,2.5,[x,1.25,-0.8],wood);
  box(training,[3.1,0.14,0.15],[0,2.5,-0.8],wood);
  const gong=cyl(training,0.62,0.06,[0,1.66,-0.8],gold);gong.rotation.x=Math.PI/2;
  const dummy=new THREE.Group();dummy.position.set(1.3,0,0.9);training.add(dummy);cyl(dummy,0.12,1.6,[0,0.8,0],wood);
  for(const y of [0.8,1.1])box(dummy,[0.9,0.08,0.08],[0,y,0.12],wood);
  const trainee=panda(training,-1,0.5,'developer','traveler',0.8);panda(training,1.8,1.5,'scout','traveler',-0.7);animated.training={gong,panda:trainee};
  const festival=zone(LEISURE_ZONES[3],4.8);
  const stage=cyl(festival,3.15,0.22,[0,0.16,0],wood);stage.name='Expanded festival stage';stage.userData.reviewPart=stage.name;
  ring(festival,3.1,0.045,[0,0.29,0],gold);
  for(const z of [3.25,3.55])box(festival,[2.4,0.1,0.35],[0,z===3.25?0.12:0.06,z],wood);
  for(const x of [-2.8,2.8]){
    cyl(festival,0.07,4.1,[x,2.05,-1.9],wood);
    box(festival,[0.58,2.1,0.04],[x,2.75,-1.9],red);
    for(const y of [2.1,2.7,3.3])box(festival,[0.28,0.05,0.025],[x,y,-1.86],gold);
  }
  box(festival,[6.1,0.1,0.13],[0,4.08,-1.9],gold);
  for(let i=0;i<7;i++){
    const x=-2.4+i*0.8,y=3.7-0.4*Math.sin(i/6*Math.PI);
    cyl(festival,0.015,4.05-y,[x,(4.05+y)/2,-1.9],wood);
    const lantern=add(festival,new THREE.SphereGeometry(0.23,12,8),red,[x,y,-1.9]);lantern.scale.y=1.3;
    cyl(festival,0.035,0.18,[x,y-0.4,-1.9],gold);
  }
  for(const x of [-2.3,2.3]){cyl(festival,0.37,0.65,[x,0.61,-0.9],red);cyl(festival,0.39,0.035,[x,0.95,-0.9],cream);}
  const drum=cyl(festival,0.55,0.75,[0,0.55,0],red);cyl(festival,0.56,0.03,[0,0.94,0],cream);
  for(const y of [0.24,0.89])ring(festival,0.55,0.03,[0,y,0],gold);
  const ribbons=[];
  for(const x of [-3.4,3.4]){cyl(festival,0.035,3,[x,1.5,-0.6],wood);const ribbon=box(festival,[0.17,1.2,0.025],[x,2.1,-0.6],red);ribbons.push(ribbon);}
  const drummer=panda(festival,-0.9,0.4,'release-manager','teahouse',0.6);panda(festival,1,0.4,'docs-writer','traveler',-0.6);animated.festival={drum,ribbons,panda:drummer};
  const diningZone=zone(LEISURE_ZONES[4],3.2),dining=createDiningTable(createBao);diningZone.add(dining.root);
  for(const x of [-2.5,2.5]){
    cyl(diningZone,0.045,3.0,[x,1.5,-1.8],wood);
    const lantern=add(diningZone,new THREE.SphereGeometry(0.22,16,10),red,[x,2.6,-1.8]);lantern.scale.y=1.25;
    ring(diningZone,0.18,0.02,[x,2.75,-1.8],gold);
  }
  const dragonZone=zone(LEISURE_ZONES[5],5.3),dragon=createDragonDance(createBao);dragonZone.add(dragon.root);
  for(const x of [-4.4,4.4]){
    cyl(dragonZone,0.055,3.2,[x,1.6,-2.4],wood);box(dragonZone,[0.4,1.3,0.035],[x,2.3,-2.4],red);
    for(const y of [2.1,2.4,2.7])box(dragonZone,[0.17,0.025,0.014],[x,y,-2.37],gold);
  }
  // Broader bamboo boundary and an ornamental entrance arch.
  for(let i=0;i<42;i++){
    const angle=i/42*Math.PI*2,x=Math.sin(angle)*22,z=Math.cos(angle)*22-1;
    if(z>14&&Math.abs(x)<18||!isReviewPlantingClear(x,z,0.25))continue;
    const h=4.5+(i%5)*0.8;cyl(root,0.12,h,[x,h/2,z],jade);
    for(let j=1;j<5;j++){cyl(root,0.14,0.04,[x,j*h/5,z],gold);if(j>2){const foliage=add(root,new THREE.SphereGeometry(1,8,6),leaf,[x+(j%2?0.5:-0.5),j*h/5,z]);foliage.scale.set(0.85,0.16,0.4);foliage.rotation.z=j%2?0.3:-0.3;}}
  }
  for(const x of [-3,3])cyl(root,0.15,3.8,[x,1.9,19],wood);
  box(root,[7.2,0.18,0.4],[0,3.4,19],red);const archRoof=add(root,new THREE.ConeGeometry(4.5,0.7,4),jade,[0,3.9,19]);archRoof.scale.z=0.3;archRoof.rotation.y=Math.PI/4;
  for(const s of [-1,1])for(let i=0;i<5;i++)cyl(root,0.3,0.03,[s*(2+i*1.4),0.025,17.3-i*0.95],stone);
  const active=Object.fromEntries(LEISURE_ZONES.map(z=>[z.id,false]));let turns=0;
  function activate(id){if(!(id in active))return;active[id]=!active[id];if(id==='dining'&&!active[id])dining.update(0,false);if(id==='dragon'&&!active[id])dragon.update(0,false);if(id==='games'){turns++;for(let i=0;i<animated.games.tiles.length;i++){const tile=animated.games.tiles[i],a=i/16*Math.PI*2+turns*0.3;tile.position.set(Math.sin(a)*0.45,0.71,Math.cos(a)*0.45);tile.rotation.y+=0.7;}}}
  function update(time,reduced=false){
    if(reduced)return;
    for(const p of residents){p.bones.Head.rotation.y=0.04*Math.sin(time*0.7);}
    if(active.tea){animated.tea.panda.bones.Elbow_R.rotation.z=-0.2-0.12*Math.sin(time);animated.tea.koi.position.set(Math.sin(time*0.5),0.085,Math.cos(time*0.5));animated.tea.koi.rotation.y=time*0.5;}
    if(active.training){animated.training.gong.rotation.y=0.12*Math.sin(time*4);animated.training.panda.bones.Shoulder_R.rotation.x=0.2*Math.sin(time*2);}
    if(active.games)animated.games.panda.bones.Wrist_R.rotation.y=0.17*Math.sin(time*2);
    if(active.festival){animated.festival.panda.bones.Shoulder_R.rotation.x=0.25*Math.sin(time*4);for(const [i,r]of animated.festival.ribbons.entries())r.rotation.z=0.2*Math.sin(time*2+i);}
    if(active.dining)dining.update(time);
    if(active.dragon)dragon.update(time);
  }
  return {root,residents:[...residents,...dining.diners,...dragon.performers],zones:allZones,dining,dragon,active,activate,update,dispose(){root.removeFromParent();dining.dispose();dragon.dispose();for(const gear of gears)gear.dispose();for(const p of residents){p.model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});p.dispose();}for(const g of geometry)g.dispose();for(const m of materials)m.dispose();}};
}
