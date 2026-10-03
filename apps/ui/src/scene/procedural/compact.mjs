import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function compactPanda(THREE,panda) {
  const groups=new Map();
  panda.model.traverse(m=>{
    if(!m.isSkinnedMesh||m.skeleton!==panda.skeleton||Object.keys(m.geometry.morphAttributes).length)return;
    const key=m.material.uuid+'|'+m.castShadow;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
  });
  for(const meshes of groups.values()){
    if(meshes.length<2)continue;
    const geometry=mergeGeometries(meshes.map(m=>m.geometry),false);
    if(!geometry)continue;
    const first=meshes[0],merged=new THREE.SkinnedMesh(geometry,first.material);
    merged.name='Plush';merged.castShadow=first.castShadow;merged.receiveShadow=true;merged.frustumCulled=false;
    merged.bind(panda.skeleton,first.bindMatrix);
    panda.model.add(merged);
    for(const m of meshes){m.removeFromParent();m.geometry.dispose();}
  }
}

export function compactEnvironment(THREE,den) {
  den.world.updateMatrixWorld(true);
  const pandas=new Set(den.pandas.map(p=>p.model)),groups=new Map();
  den.world.traverse(m=>{
    if(!m.isMesh||m.isSkinnedMesh||Array.isArray(m.material)||Object.keys(m.geometry.morphAttributes).length)return;
    for(let p=m;p;p=p.parent)if(pandas.has(p)||p.name==='Tally abacus'||p.userData.ticketRef)return;
    const key=m.material.uuid+'|'+m.castShadow+'|'+m.receiveShadow;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
  });
  for(const meshes of groups.values()){
    if(meshes.length<2)continue;
    // Split by buffer layout: leaf planes and cylinders need not have the same attributes.
    const layouts=new Map();
    for(const m of meshes){
      const key=Object.keys(m.geometry.attributes).sort().join('|')+'|'+Boolean(m.geometry.index);
      if(!layouts.has(key))layouts.set(key,[]);layouts.get(key).push(m);
    }
    for(const list of layouts.values()){
      if(list.length<2)continue;
      const copies=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));
      const geometry=mergeGeometries(copies,false);
      for(const g of copies)g.dispose();
      if(!geometry)continue;
      const first=list[0],merged=new THREE.Mesh(geometry,first.material);
      merged.name='Grove';merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;
      den.world.add(merged);
      for(const m of list){m.removeFromParent();m.geometry.dispose();}
    }
  }
}
