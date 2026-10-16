import * as T from 'three';
import {createModelLoader} from './assets.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {previewTextures} from './assets.mjs';

const APPROVED_GROVES=[{"position": [-26.142, -0.035, 2.459], "rotationY": 0.2, "actualHeight": 4.578}, {"position": [-14.6, -0.035, -21], "rotationY": 1.6, "actualHeight": 5.559}, {"position": [0, -0.035, -24], "rotationY": 2.8, "actualHeight": 5.678}, {"position": [25, -0.035, -2.3], "rotationY": 0.9, "actualHeight": 5.327}, {"position": [-12.336, -0.035, 22.645], "rotationY": 2.7, "actualHeight": 3.975}, {"position": [14, -0.035, 21], "rotationY": 3.4, "actualHeight": 5.166}];
const FILES={grove:'/forest-models/ancient-grove.glb',gate:'/forest-models/forest-gate.glb'};
const TARGET_HEIGHTS=[7.2,7.6,8,7.2,5.2,5.5];
const GARDEN_RADIUS=28.65,ROOT_MARGIN=.30,BUILDING_MARGIN=.65,PATH_MARGIN=.40;
const round=n=>Number.isFinite(n)?Math.round(n*1000)/1000:null;
const xyz=v=>v.toArray().map(round);
const pointBoxDistance=(x,z,b)=>Math.hypot(Math.max(b.min.x-x,x-b.max.x,0),Math.max(b.min.z-z,z-b.max.z,0));
const dimensions=b=>({min:xyz(b.min),max:xyz(b.max),size:xyz(b.getSize(new T.Vector3()))});

// Match the bamboo adapter: roots are actual vertices in the bottom 12%, not crown bounds.
function describe(object){
 object.updateWorldMatrix(true,true);
 const inverse=object.matrixWorld.clone().invert(),bounds=new T.Box3(),primitives=[];
 let triangles=0;
 object.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  mesh.geometry.computeBoundingBox();
  const matrix=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
  bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
  primitives.push({mesh,matrix});triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;
 });
 if(bounds.isEmpty())throw Error('Forest asset has no measurable mesh geometry.');
 const size=bounds.getSize(new T.Vector3()),cutoff=bounds.min.y+size.y*.12,point=new T.Vector3(),rootBounds=new T.Box3();
 let radius=0,rootVertices=0;
 for(const {mesh,matrix}of primitives){
  const positions=mesh.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(matrix);
   if(point.y<=cutoff){radius=Math.max(radius,Math.hypot(point.x,point.z));rootBounds.expandByPoint(point);rootVertices++;}
  }
 }
 return {bounds,size,rootBounds,radius,rootVertices,triangles};
}

function prepare(object){
 previewTextures(object,1024);
 object.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.castShadow=mesh.receiveShadow=true;
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   if(!material)continue;
   material.roughness=Math.max(material.roughness||0,.84);material.roughnessMap=null;
   material.metalness=Math.min(material.metalness||0,.06);material.metalnessMap=null;
   if('clearcoat'in material)material.clearcoat=0;
   material.envMapIntensity=.45;material.needsUpdate=true;
  }
 });
}

function addFoliage(tree,bounds){
 const points=[],upperPoints=[],inverse=tree.matrixWorld.clone().invert(),p=new T.Vector3();
 tree.traverse(mesh=>{if(!mesh.isMesh)return;const a=mesh.geometry.attributes.position,m=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m);if(p.y>=.72){upperPoints.push(p.clone());if(p.y<=.95)points.push(p.clone());}}});
 if(!points.length)points.push(...upperPoints);
 const anchors=[];
 for(let sector=0;sector<8;sector++){
  const angle=sector*Math.PI/4,candidates=points.filter(p=>Math.abs(Math.atan2(Math.sin(Math.atan2(p.x,p.z)-angle),Math.cos(Math.atan2(p.x,p.z)-angle)))<Math.PI/8);
  candidates.sort((a,b)=>Math.hypot(b.x,b.z)-Math.hypot(a.x,a.z));
  const point=candidates[0];if(point&&anchors.every(a=>a.distanceTo(point)>.06))anchors.push(point.clone());
 }
 for(const point of [...points].sort((a,b)=>b.y-a.y))if(anchors.length<10&&anchors.every(a=>a.distanceTo(point)>.10))anchors.push(point.clone());
 const leafPieces=[],flowerPieces=[],palette=['#315f48','#4e8060','#689273'].map(c=>new T.Color(c));
 const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
 const base=new T.IcosahedronGeometry(1,1),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 anchors.forEach((anchor,i)=>{
  const angle=Math.atan2(anchor.x,anchor.z),tangent=new T.Vector3(Math.cos(angle),0,-Math.sin(angle));
  for(let lobe=0;lobe<3;lobe++){
   const g=base.clone(),a=g.attributes.position,colors=[],sx=(.105+noise(i+3)*.025)*(lobe===0?1:.74),sy=.033+noise(i+7)*.009,sz=.075+noise(i+11)*.025;
   const center=anchor.clone().addScaledVector(tangent,(lobe-1)*.07),extent=Math.max(sx,sz)*1.1;
   center.x=clamp(center.x,bounds.min.x+extent,bounds.max.x-extent);center.z=clamp(center.z,bounds.min.z+extent,bounds.max.z-extent);center.y=clamp(center.y+(lobe===1?.009:-.009),.70+sy,.99-sy);
   for(let j=0;j<a.count;j++){p.fromBufferAttribute(a,j);const variation=1+(noise(Math.round((p.x+p.y*3+p.z*7)*1000))-.5)*.14;p.multiplyScalar(variation);a.setXYZ(j,p.x,p.y,p.z);const color=palette[(i+lobe)%palette.length].clone().multiplyScalar(.84+noise(j+i*31)*.20+Math.max(0,p.y)*.14);colors.push(color.r,color.g,color.b);}
   g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.applyMatrix4(new T.Matrix4().compose(center,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(sx,sy,sz)));leafPieces.push(g);
  }
  if(i%2===0){
   const center=anchor.clone();center.y=Math.min(.97,center.y+.045);
   for(let petal=0;petal<5;petal++){
    const g=new T.TetrahedronGeometry(.010,0),angle=petal*Math.PI*2/5;g.translate(center.x+Math.sin(angle)*.018,center.y,center.z+Math.cos(angle)*.018);
    const color=new T.Color(i%4?'#e7d7cb':'#d5a8b0'),colors=[];for(let j=0;j<g.attributes.position.count;j++)colors.push(color.r,color.g,color.b);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));flowerPieces.push(g);
   }
  }
 });
 const foliage=new T.Group();foliage.name='Shared upper canopy foliage';
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 for(const pieces of [leafPieces,flowerPieces])if(pieces.length){const geometry=mergeGeometries(pieces,false),mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;foliage.add(mesh);pieces.forEach(g=>g.dispose());}
 base.dispose();tree.add(foliage);const measured=describe(foliage);
 if(measured.triangles>3000)throw Error('Local foliage exceeds the 3000-triangle prototype budget.');
 return {triangles:measured.triangles,leafClumps:leafPieces.length,flowerAccents:Math.ceil(anchors.length/2),geometryShared:true,material:'Mottled emerald and jade vertex colors; a few ivory/pink petals.',bounds:dimensions(measured.bounds)};
}

function grovePrototype(source){
 prepare(source);
 const original=describe(source),rootCenter=original.rootBounds.getCenter(new T.Vector3());
 if(!(original.size.y>.001))throw Error('Ancient grove has no usable vertical extent.');
 // Recenter on the root bed so a lopsided crown does not move the trunk off its planting site.
 source.position.x-=rootCenter.x;source.position.z-=rootCenter.z;source.position.y-=original.bounds.min.y;
 const sourceFit=new T.Group();sourceFit.scale.setScalar(1/original.size.y);sourceFit.add(source);
 const tree=new T.Group();tree.add(sourceFit);
 const raw=new T.Group();raw.add(tree);
 const roots=describe(raw);if(roots.radius<=.0001)throw Error('Ancient grove has no usable root footprint.');
 const foliage=addFoliage(tree,roots.bounds);
 const stone=new T.MeshStandardMaterial({color:'#7c806c',roughness:1,metalness:0});
 const moss=new T.MeshStandardMaterial({color:'#526b4d',roughness:1,metalness:0});
 let tierTriangles=0;
 const addTier=(radius,height,y,material,name)=>{
  const tier=new T.Mesh(new T.CylinderGeometry(radius,radius,height,20),material);
  tierTriangles+=(tier.geometry.index?.count||tier.geometry.attributes.position.count)/3;
  tier.position.y=y;tier.name=name;tier.castShadow=tier.receiveShadow=true;raw.add(tier);
 };
 // Both tiers stay inside the measured root circle and share geometry across all six clones.
 addTier(roots.radius*.98,.020,.010,stone,'Low stone retaining tier');
 addTier(roots.radius*.82,.014,.027,stone,'Upper stone retaining tier');
 addTier(roots.radius*.80,.004,.036,moss,'Moss on the terrace bed');
 tree.position.y=.038;
 const height=describe(raw).size.y,inner=new T.Group();inner.scale.setScalar(1/height);inner.add(raw);
 const prototype=new T.Group();prototype.name='Ancient grove · shared tree and terrace prototype';prototype.add(inner);
 const measured=describe(prototype);
 return {prototype,measured,original,treeRootRadius:roots.radius,tierTriangles,foliage};
}

function removeCentralGroundArtifact(group){
 const regions=[
  {id:'lowCentralArtifact',box:new T.Box3(new T.Vector3(-1.4,-.01,22.1),new T.Vector3(1.4,1.4,25.9)),trianglesRemoved:0},
  {id:'floatingInnerFrame',box:new T.Box3(new T.Vector3(-1.6,.12,23.25),new T.Vector3(-.95,1.95,24.3)),trianglesRemoved:0},
 ];
 const changes=[];let originalTriangles=0,removedTriangles=0;
 group.updateMatrixWorld(true);
 group.traverse(mesh=>{
  const geometry=mesh.geometry,positions=geometry?.attributes.position;if(!mesh.isMesh||!positions)return;
  const indices=geometry.index,kept=[],groups=[];let removed=0;
  for(const part of geometry.groups.length?geometry.groups:[{start:0,count:indices?.count||positions.count,materialIndex:0}]){
   const start=kept.length;
   for(let i=part.start;i<part.start+part.count;i+=3){
    const ids=[0,1,2].map(j=>indices?indices.getX(i+j):i+j),points=ids.map(id=>new T.Vector3().fromBufferAttribute(positions,id).applyMatrix4(mesh.matrixWorld));originalTriangles++;
    const artifact=regions.find(region=>points.every(point=>region.box.containsPoint(point)));
    if(artifact){artifact.trianglesRemoved++;removed++;continue;}
    kept.push(...ids);
   }
   if(kept.length>start)groups.push({start,count:kept.length-start,materialIndex:part.materialIndex});
  }
  if(removed){changes.push({mesh,geometry,kept,groups});removedTriangles+=removed;}
 });
 if(removedTriangles>originalTriangles*.04)throw Error('Central cleanup would remove more than 4% of gate triangles; original gate retained.');
 for(const {mesh,geometry,kept,groups}of changes){
  const copy=geometry.clone();copy.setIndex(kept);copy.clearGroups();if(geometry.groups.length)for(const part of groups)copy.addGroup(part.start,part.count,part.materialIndex);mesh.geometry=copy;
 }
 return {trianglesRemoved:removedTriangles,sourceTriangles:originalTriangles,maximumRemovalFraction:.04,sourceFilesChanged:false,regions:regions.map(region=>({id:region.id,trianglesRemoved:region.trianglesRemoved,...dimensions(region.box)})),method:'Only whole triangles contained inside the low central artifact box or the small floating inner-frame box are removed from cloned runtime geometry. Real gate posts and lintel remain.'};
}

function passageIntersections(group){
 const triangles=[];
 group.updateMatrixWorld(true);
 group.traverse(mesh=>{
  const positions=mesh.geometry?.attributes.position;if(!mesh.isMesh||!positions)return;
  const indices=mesh.geometry.index;
  for(let i=0;i<(indices?.count||positions.count);i+=3){
   const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(positions,indices?indices.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
   triangles.push(new T.Triangle(...points));
  }
 });
 const count=height=>{const passage=new T.Box3(new T.Vector3(-.7,.18,22.1),new T.Vector3(.7,height,25.9));return triangles.reduce((n,triangle)=>n+Number(passage.intersectsTriangle(triangle)),0);};
 const intersections=count(2.25);let low=.18,high=5.8;
 for(let i=0;i<13;i++){const middle=(low+high)/2;if(count(middle)===0)low=middle;else high=middle;}
 return {clear:intersections===0,intersectingTriangles:intersections,width:1.4,height:2.25,maximumClearHeight:round(low),groundAllowance:.18};
}

async function replaceGate(den,loader){
 const old=den.world.getObjectByName('Arrival gate');if(!old)throw Error('Existing Arrival gate is unavailable.');
 const source=(await loader.loadAsync(FILES.gate)).scene;prepare(source);
 let bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),rotated=false;
 if(!size.toArray().every(n=>Number.isFinite(n)&&n>.001))throw Error('Forest gate has invalid dimensions.');
 if(size.z>size.x*1.2){source.rotation.y+=Math.PI/2;source.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(source);size=bounds.getSize(new T.Vector3());rotated=true;}
 const originalDimensions=dimensions(bounds),center=bounds.getCenter(new T.Vector3()),scale=Math.min(11.5/size.x,5.8/size.y,3.3/size.z);
 source.position.x-=center.x;source.position.z-=center.z;source.position.y-=bounds.min.y;
 const model=new T.Group();model.scale.setScalar(scale);model.add(source);
 const group=new T.Group();group.name='Forest gate · arrival';group.position.set(0,0,24);group.userData={id:'gate',assetId:'forest-gate',source:'Meshy',file:FILES.gate};group.add(model);
 // The old gate has z20 baked into its vertices: copying its outer z4 transform would be wrong.
 den.world.add(group);den.world.updateMatrixWorld(true);
 let cleanup,passage;
 try{cleanup=removeCentralGroundArtifact(group);passage=passageIntersections(group);if(!passage.clear)throw Error('Generated gate blocks the central 1.4 × 2.25 passage after ground-artifact cleanup ('+passage.intersectingTriangles+' triangles).');}
 catch(error){group.removeFromParent();throw error;}
 old.visible=false;den.zones.set('gate',group);
 if(!den.plan.some(place=>place.id==='gate'))den.plan.push({id:'gate',label:'Forest gate · arrival',x:0,z:24,radius:4.8});
 const actual=new T.Box3().setFromObject(group),triangles=describe(group).triangles;
 const edge=Math.max(...[actual.min.x,actual.max.x].flatMap(x=>[actual.min.z,actual.max.z].map(z=>Math.hypot(x,z+1))));
 return {loaded:true,source:FILES.gate,groupName:group.name,position:[0,0,24],sourceDimensions:originalDimensions,dimensions:dimensions(actual),targetDimensions:[11.5,5.8,3.3],uniformScale:round(scale),orientationAdjusted:rotated,triangles,cleanup,passage,clearances:{gardenBoundary:round(GARDEN_RADIUS-edge),centerPromenadeWidth:1.4},previousGateVisible:old.visible,limitations:['The expanded gate envelope preserves source proportions with uniform scale.','Actual arch headroom is measured separately; the outer model height is not passage clearance.']};
}

export async function loadForestUpgrades(den){
 const loader=createModelLoader();FILES.grove=den.assets['vegetation.ancient-grove'].url;FILES.gate=den.assets['scenery.forest-gate'].url;
 const {prototype,measured}=grovePrototype((await loader.loadAsync(FILES.grove)).scene);
 const group=new T.Group();group.name='Ancient canopy groves · six shared Meshy clusters';group.userData={assetId:'grove',baseRadius:measured.radius};
 for(const site of APPROVED_GROVES){const tree=prototype.clone(true);tree.position.fromArray(site.position);tree.rotation.y=site.rotationY;tree.scale.setScalar(site.actualHeight);group.add(tree);}
 den.vegetation.add(group);den.world.updateMatrixWorld(true);
 const gate=await replaceGate(den,loader);den.forestUpgrade={complete:gate.loaded,grove:{loaded:true,instanceCount:6},gate};return den.forestUpgrade;
}
