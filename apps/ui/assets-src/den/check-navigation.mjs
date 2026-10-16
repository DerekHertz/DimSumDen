// Offline verification against the shipped geometry, without images or WebGL.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fit } from '../../src/scene/meshy/assets.mjs';
import { createSurfaceNavigation } from '../../src/scene/meshy/navigation.mjs';
import { openSideDoor,addPavilionBridge } from '../../src/scene/meshy/entrances.mjs';

export async function geometry(id) {
 const raw=gunzipSync(await readFile(new URL(`../../public/den/models/scenery/${id}.glb.gz`,import.meta.url)));
 const length=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+length));
 delete doc.images;delete doc.textures;delete doc.materials;delete doc.extensionsRequired;
 for(const mesh of doc.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const binary=raw.subarray(20+length),header=Buffer.from(raw.subarray(0,20));header.writeUInt32LE(20+json.length+binary.length,8);header.writeUInt32LE(json.length,12);
 const file=Buffer.concat([header,json,binary]);
 return (await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.length),'')).scene;
}
export const SITES=[
 {id:'library',width:8.5,height:5.8,depth:6,x:0,z:-17.6,turn:0},
 {id:'steamers',width:5.6,x:-9.5,z:-8.7,turn:.28,target:[.7,0,-.7],minimumGround:0},
 {id:'pavilion',width:7.7,x:-20,z:10.2,turn:0,target:[0,0,-.55]},
 {id:'festival',width:6.7,x:20,z:-12.2,turn:0},
];
export async function siteGeometry(site){
 const root=new THREE.Group();root.position.set(site.x,.06,site.z);root.rotation.y=site.turn;
 root.add(fit(await geometry(site.id),site));root.updateMatrixWorld(true);if(site.id==='steamers')openSideDoor(root);if(site.id==='pavilion')addPavilionBridge(root);root.userData.navigationTarget=site.target;root.userData.minimumGround=site.minimumGround??.1;return root;
}
export function routeToInterior(root,navigation,{step=.12,includePath=false}={}){
 const bounds=new THREE.Box3().setFromObject(root),target=root.localToWorld(new THREE.Vector3(...(root.userData.navigationTarget||[0,0,0])));
 const seed=root.localToWorld(new THREE.Vector3(0,0,(bounds.max.z-bounds.min.z)/2+1));
 const queue=[{x:seed.x,z:seed.z,y:0}],seen=new Set();let best=Infinity,highest=0;
 for(let cursor=0;cursor<queue.length&&cursor<45000;cursor++){
  const p=queue[cursor],d=Math.hypot(p.x-target.x,p.z-target.z);best=Math.min(best,d);highest=Math.max(highest,p.y);
  if(d<.35&&p.y>=root.userData.minimumGround){
   const result={ok:true,ground:p.y,steps:cursor,best,highest};
   if(includePath){const path=[];for(let at=cursor;at!=null;at=queue[at].previous)path.push(queue[at]);result.path=path.reverse();}
   return result;
  }
  for(const [dx,dz]of [[step,0],[-step,0],[0,step],[0,-step]]){
   const x=p.x+dx,z=p.z+dz;if(x<bounds.min.x-1||x>bounds.max.x+1||z<bounds.min.z-1||z>bounds.max.z+1)continue;
   const y=navigation.groundAt(x,z,p.y);if(y===null)continue;
   const key=`${Math.round(x/step)},${Math.round(z/step)},${Math.round(y*100)}`;if(seen.has(key))continue;seen.add(key);queue.push({x,z,y,previous:cursor});
  }
 }
 return {ok:false,best,highest,visited:seen.size};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 for(const site of SITES){const root=await siteGeometry(site),nav=createSurfaceNavigation([root]);console.log(site.id,JSON.stringify(routeToInterior(root,nav)));}
}
