import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Merge only rigid hat/prop internals; their bone sockets and editable roots stay intact.
export function compactReviewGear(gear){
  const mergedGeometry=[];
  for(const root of [gear.hat,gear.prop]){
    root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
    root.traverse(o=>{
      if(!o.isMesh||o.isSkinnedMesh||Array.isArray(o.material))return;
      const key=o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
    });
    for(const list of groups.values()){
      if(list.length<2)continue;
      const copies=list.map(o=>o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));
      const geometry=mergeGeometries(copies,false);for(const g of copies)g.dispose();if(!geometry)continue;
      const merged=new THREE.Mesh(geometry,list[0].material);merged.name=root.name;merged.castShadow=merged.receiveShadow=true;root.add(merged);mergedGeometry.push(geometry);
      for(const o of list)o.removeFromParent();
    }
  }
  const dispose=gear.dispose;gear.dispose=()=>{for(const g of mergedGeometry)g.dispose();dispose();};return gear;
}
