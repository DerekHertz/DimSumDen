import * as THREE from 'three';
import { materials,landscape,cyl,box,orb } from './garden.mjs';
import { applyGardenLayout } from './scene-layout.mjs';
import { addPerimeterBamboo } from './perimeter-bamboo.mjs';
import { loadForestUpgrades } from './forest-upgrades.mjs';
import { loadDeveloperWorkstation } from './meshy-upgrades.mjs';
import { buildRoleWorkspaces } from './role-workspaces.mjs';
import { loadRoleWardrobe } from './role-wardrobe.mjs';
import { loadManifest,loadModel,fit,disposeWorld } from './assets.mjs';
import { buildWalkWorld } from './collisions.mjs';
import { NAVIGATION_TARGETS,WALK_START } from './layout.mjs';
import propDefinitions from './role-props.mjs';

const PLACES=[['center','Shared dim sum table',0,0,5,5.5],['steamers','Steamers',-9.5,-8.7,6,5.6],['front','Front of House',9.5,-8.7,6,5.6],['tea','Tea',-12.4,.3,5,6],['pantry','Pantry',12.4,.3,5,6],['pavilion','Lotus pavilion',-20,10.2,6,7.7],['games','Mahjong',-20,-10.7,5,3.6],['training','Practice courtyard',21,10,5,6.3],['festival','Festival stage',20,-12.2,6,6.7],['dining','Gate tea table',-8.5,17,4.5,4.7],['dragon','Silk dragon courtyard',9,17,6,8]];
const SCALES={orchestrator:1.35,'stem-cub':.52};
const BAMBOO=[[-27,-5],[27,-5],[-25,-15],[25,-15],[-18,-23],[18,-23],[-9,-27],[9,-27],[0,-28],[-28,6],[28,6]];
function assertActive(signal){if(signal?.aborted)throw new DOMException('Scene load cancelled','AbortError');}
function addLiveFixtures(den,m){
 const tally=new THREE.Group();tally.name='Live kitchen tally';tally.position.set(16,0,18);tally.userData.tallyAbacus=true;den.world.add(tally);
 box(tally,[2.4,.12,.7],m.darkwood,[0,.15,0]);for(const x of [-1.05,1.05])box(tally,[.12,2.2,.12],m.wood,[x,1.15,0]);
 box(tally,[2.25,.14,.16],m.wood,[0,2.25,0]);const rows=[];
 for(let row=0;row<6;row++){
  const y=.55+row*.27,rod=cyl(tally,.018,2,m.gold,[0,y,0],8);rod.rotation.z=Math.PI/2;
  rows.push(Array.from({length:10},(_,j)=>{const bead=orb(tally,.07,m.gold.clone(),[-.77+j*.17,y,0],[.7,1,1]);return bead;}));
 }
 den.tallyAnchor={x:16,y:3.1,z:18};
 den.setTally=rods=>{for(let row=0;row<rows.length;row++)for(let j=0;j<10;j++){const rod=rods?.[row],count=Math.max(0,Math.min(10,rod?.counted||0)),on=j>=10-count;rows[row][j].material.color.set(on?'#177d80':'#d3bc86');}};
 den.setFrontier=refs=>{
  const wanted=new Set(refs.slice(0,8));
  for(const [ref,g]of den.frontier)if(!wanted.has(ref)){g.removeFromParent();den.frontier.delete(ref);}
  [...wanted].forEach((ref,index)=>{let basket=den.frontier.get(ref);if(!basket){basket=new THREE.Group();basket.userData.ticketRef=ref;basket.name=ref+' · ready basket';cyl(basket,.25,.22,m.bamboo,[0,.16,0],20);cyl(basket,.27,.04,m.darkwood,[0,.29,0],20);den.frontier.set(ref,basket);den.world.add(basket);}basket.position.set(-3.1+index%4*.72,0,12.2+Math.floor(index/4)*.7);});
 };
}
export async function createMeshyWorld(renderer,{signal,onProgress=()=>{}}={}){
 const world=new THREE.Group(),residents=new THREE.Group(),roleTools=new THREE.Group(),vegetation=new THREE.Group();world.name='Dim Sum Den · forest city';world.add(residents,roleTools,vegetation);residents.name='Permanent role residents';
 const den={world,residents,roleTools,vegetation,zones:new Map(),plan:[],hats:[],renderer,plantingLayout:{bamboo:[],grove:[]},frontier:new Map(),obstacles:[],navigationTargets:NAVIGATION_TARGETS,walkStart:WALK_START,dispose:()=>disposeWorld(world)};
 try{
  den.assets=await loadManifest(signal);assertActive(signal);
  den.propManifest=propDefinitions.map(p=>({...p,url:den.assets['props.'+p.id].url}));
  const m=materials(),terrain=landscape(m);world.add(terrain);
  for(const name of ['Handmade bamboo','Handmade bamboo leaves','Handmade shrubs','Handmade pond and bridge']){const old=terrain.getObjectByName(name);if(old)old.visible=false;}
  onProgress('Welcoming Bao and the fourteen residents…');
  const body=fit(await loadModel(den.assets.bao.url),{height:3});assertActive(signal);body.name='Bao body';
  body.traverse(o=>{if(o.isMesh){o.receiveShadow=false;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.roughness=.95;material.metalness=0;material.roughnessMap=null;}}});
  for(const prop of den.propManifest){const person=new THREE.Group();person.name=prop.label;person.userData.roleId=prop.id;person.scale.setScalar(SCALES[prop.id]||.68);person.add(body.clone(true));residents.add(person);}
  for(const [id,label,x,z,radius,width]of PLACES){
   onProgress('Opening '+label+'…');const key=id==='dining'?'gate-tea-table':id;
   const model=fit(await loadModel(den.assets['scenery.'+key].url),{width,height:id==='dining'?2.8:Infinity,depth:id==='dining'?4.7:Infinity});assertActive(signal);
   const zone=new THREE.Group();zone.name=label;zone.userData={id};zone.position.set(x,.06,z);zone.add(model);world.add(zone);den.zones.set(id,zone);den.plan.push({id,label,x,z,radius});
   if(id==='center')model.position.z=3.15;
   if(['steamers','front','tea','pantry'].includes(id))zone.rotation.y={steamers:.28,front:-.28,tea:.18,pantry:-.18}[id];
  }
  applyGardenLayout(den);
  const library=new THREE.Group();library.name='Library · shared knowledge';library.userData={id:'library'};library.position.set(0,.06,-17.6);
  library.add(fit(await loadModel(den.assets['scenery.library'].url),{width:8.5,height:5.8,depth:6}));world.add(library);den.zones.set('library',library);den.plan.push({id:'library',label:'Library',x:0,z:-17.6,radius:6});
  const approach=box(world,[1.16,.035,4.7],m.stone,[0,.024,-11.33]);approach.name='Library approach';assertActive(signal);
  onProgress('Planting the ancient grove…');await loadForestUpgrades(den);assertActive(signal);
  const bambooPrototype=fit(await loadModel(den.assets['vegetation.bamboo'].url),{height:1}),bamboo=new THREE.Group();bamboo.userData={assetId:'bamboo',baseRadius:.174};bamboo.name='Original eleven bamboo clusters';
  BAMBOO.forEach(([x,z],i)=>{const height=4.3+i%3*.35,radius=.174*height,limit=28.65-radius,r=Math.min(Math.hypot(x,z+1),limit),angle=Math.atan2(x,z+1),plant=bambooPrototype.clone(true);plant.position.set(Math.sin(angle)*r,-.035,Math.cos(angle)*r-1);plant.scale.setScalar(height);plant.rotation.y=i*.73;bamboo.add(plant);den.plantingLayout.bamboo.push({x:plant.position.x,z:plant.position.z,height,turn:plant.rotation.y});});vegetation.add(bamboo);
  addPerimeterBamboo(den);onProgress('Setting out every role’s tools…');
  await buildRoleWorkspaces(den);assertActive(signal);await loadDeveloperWorkstation(den);assertActive(signal);
  onProgress('Fitting the wardrobe…');
  const urls=Object.fromEntries(['developer-vest','developer-headphones','developer-boba','developer-tablet','qa-scarf'].map(id=>[id,den.assets['wardrobe.'+id].url]));urls['security-vest']=urls['developer-vest'];
  await loadRoleWardrobe(den,{urls});assertActive(signal);
  for(const [id,space]of den.roleWorkspaces.workspaces){space.group.userData.actorKey=id;if(space.person)space.person.userData.actorKey=id;if(space.prop)space.prop.userData.actorKey=id;}
  den.zones.get('library').userData.denInteraction={zone:'archive',intent:'open-library',id:'archive.library'};
  den.zones.get('library').name='Library · shared knowledge';
  addLiveFixtures(den,m);world.updateMatrixWorld(true);den.walkWorld=buildWalkWorld(den);renderer.shadowMap.needsUpdate=true;
  return den;
 }catch(error){den.dispose();throw error;}
}
