import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
const draco=new DRACOLoader().setDecoderPath('/den/draco/').setWorkerLimit(2);
export const createModelLoader=()=>new GLTFLoader().setDRACOLoader(draco);
// Textures are resized offline in the checked-in asset package, never through a remote endpoint.
export function previewTextures(object){return object;}
export async function loadManifest(signal){
 const response=await fetch('/den/manifest.json',{signal});
 if(!response.ok)throw Error('The Den model package could not load.');
 const manifest=await response.json();
 if(manifest.version!==1||!manifest.assets?.bao)throw Error('The Den model index is invalid.');
 for(const asset of Object.values(manifest.assets))if(!asset.url?.startsWith('/den/models/')||asset.url.includes('..'))throw Error('The Den model index contains an invalid local path.');
 return manifest.assets;
}
export function fit(object,{width=Infinity,height=Infinity,depth=Infinity}={}){
 object.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const factor=Math.min(width/size.x,height/size.y,depth/size.z);
 if(!Number.isFinite(factor)||factor<=0)throw Error('Model has invalid dimensions.');
 object.position.sub(center);object.position.y+=size.y/2;
 const root=new THREE.Group();root.add(object);root.scale.setScalar(factor);
 root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.metalness=Math.min(material.metalness||0,.12);material.roughness=Math.max(material.roughness||0,.76);material.roughnessMap=null;}});
 return root;
}
export const loadModel=async(url)=> (await createModelLoader().loadAsync(url)).scene;
export function disposeWorld(world){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 world.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();world.removeFromParent();
}
