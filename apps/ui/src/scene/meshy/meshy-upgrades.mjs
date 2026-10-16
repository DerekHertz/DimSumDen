import * as T from 'three';
import {createModelLoader} from './assets.mjs';
import {previewTextures} from './assets.mjs';
const loader=createModelLoader();
function fit(object,{width,height=Infinity,depth=Infinity}){
 previewTextures(object,1024);object.updateMatrixWorld(true);const b=new T.Box3().setFromObject(object),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());const scale=Math.min(width/size.x,height/size.y,depth/size.z);object.position.sub(center);object.position.y+=size.y/2;const group=new T.Group();group.add(object);group.scale.setScalar(scale);group.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.metalness=Math.min(m.metalness||0,.15);m.roughness=Math.max(m.roughness||.8,.7);}}});return group;
}
function count(g){let n=0;g.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return n;}
export async function loadDeveloperWorkstation(den){
 const anchors=den.roleWorkspaces?.anchors;if(!anchors?.developerDesk)return {loaded:false,reason:'Workspace unavailable'};
 try{const gltf=await loader.loadAsync(den.assets['scenery.developer-workstation'].url),model=fit(gltf.scene,{width:1.42,height:.98,depth:.72});model.name='Developer · Meshy modern workstation';model.userData={asset:'developer-workstation',source:'Meshy'};model.position.set(-.15,0,-.02);anchors.developerDesk.add(model);if(anchors.developerWorkstation)anchors.developerWorkstation.visible=false;const report={loaded:true,triangles:count(model)};den.developerWorkstation=report;den.renderer.shadowMap.needsUpdate=true;return report;}catch(error){console.error('Developer workstation',error);return {loaded:false,reason:error.message};}
}
