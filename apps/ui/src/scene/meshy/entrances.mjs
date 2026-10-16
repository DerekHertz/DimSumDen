import * as THREE from 'three';

// The user approved a side entrance in the generated Steamers shell. Cut only
// its side panel, keeping the front counter, UVs, materials and original GLB.
export function openSideDoor(root) {
 const door=new THREE.Box3(new THREE.Vector3(.25,.12,-1.3),new THREE.Vector3(3.1,2.45,-.12));
 root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert();let removed=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.index)return;
  const original=mesh.geometry,attributes=Object.entries(original.attributes),positions=original.attributes.position;
  const transform=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
  const arrays=attributes.map(([,a])=>Array.from(a.array)),indices=[];
  const vertex=index=>({index,p:new THREE.Vector3().fromBufferAttribute(positions,index).applyMatrix4(transform),values:attributes.map(([,a])=>Array.from({length:a.itemSize},(_,k)=>a.array[index*a.itemSize+k]))});
  const interpolate=(a,b,t)=>({index:null,p:a.p.clone().lerp(b.p,t),values:a.values.map((row,i)=>row.map((v,k)=>v+(b.values[i][k]-v)*t))});
  const clip=(polygon,axis,bound,greater)=>{
   const result=[];
   for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],ia=greater?a.p[axis]>=bound:a.p[axis]<=bound,ib=greater?b.p[axis]>=bound:b.p[axis]<=bound;
    if(ia)result.push(a);
    if(ia!==ib)result.push(interpolate(a,b,(bound-a.p[axis])/(b.p[axis]-a.p[axis])));
   }
   return result;
  };
  const append=v=>{
   if(v.index!=null)return v.index;
   v.index=arrays[0].length/attributes[0][1].itemSize;
   for(let i=0;i<arrays.length;i++)arrays[i].push(...v.values[i]);
   return v.index;
  };
  const triangles=polygon=>{
   for(let i=1;i<polygon.length-1;i++)if(new THREE.Vector3().subVectors(polygon[i].p,polygon[0].p).cross(new THREE.Vector3().subVectors(polygon[i+1].p,polygon[0].p)).lengthSq()>1e-16)indices.push(append(polygon[0]),append(polygon[i]),append(polygon[i+1]));
  };
  const planes=[['x',door.min.x,true],['x',door.max.x,false],['y',door.min.y,true],['y',door.max.y,false],['z',door.min.z,true],['z',door.max.z,false]];
  for(let i=0;i<original.index.count;i+=3){
   const triangle=[0,1,2].map(j=>vertex(original.index.getX(i+j)));
   if(!new THREE.Box3().setFromPoints(triangle.map(v=>v.p)).intersectsBox(door)){indices.push(...triangle.map(v=>v.index));continue;}
   let inside=triangle;
   for(const [axis,bound,greater]of planes){triangles(clip(inside,axis,bound,!greater));inside=clip(inside,axis,bound,greater);if(!inside.length)break;}
   if(inside.length)removed++;
  }
  const geometry=new THREE.BufferGeometry();
  attributes.forEach(([name,a],i)=>geometry.setAttribute(name,new THREE.BufferAttribute(new a.array.constructor(arrays[i]),a.itemSize,a.normalized)));
  geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();mesh.geometry=geometry;original.dispose();
 });
 const stone=new THREE.MeshStandardMaterial({color:'#ada991',roughness:1});
 const landing=new THREE.Mesh(new THREE.BoxGeometry(2.85,.16,1.18),stone);landing.name='Steamers · side entry landing';landing.position.set(1.675,.08,-.71);landing.castShadow=landing.receiveShadow=true;root.add(landing);
 const step=new THREE.Mesh(new THREE.BoxGeometry(.45,.08,1.18),stone);step.name='Steamers · side entry step';step.position.set(3.325,.04,-.71);step.castShadow=step.receiveShadow=true;root.add(step);
 root.userData.sideDoor={removed,min:door.min.toArray(),max:door.max.toArray()};
 return root.userData.sideDoor;
}

export function addPavilionBridge(root) {
 const bridge=new THREE.Group();bridge.name='Pavilion · bamboo arrival bridge';root.add(bridge);
 const wood=new THREE.MeshStandardMaterial({color:'#987044',roughness:.95});
 const bamboo=new THREE.MeshStandardMaterial({color:'#b8955b',roughness:.9});
 const box=(size,at,material=wood)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...at);mesh.castShadow=mesh.receiveShadow=true;bridge.add(mesh);return mesh;};
 box([1.25,.10,3.95],[0,.77,2.75]);
 for(let i=0;i<16;i++)box([1.25,.025,.23],[0,.8325,.9+i*.247],bamboo);
 for(let i=0;i<4;i++)box([1.25,(i+1)*.18,.36],[0,(i+1)*.09,5.96-i*.36]);
 for(const x of [-.66,.66]){
  box([.065,.075,3.65],[x,1.25,2.75],bamboo);
  for(const z of [1.0,2.75,4.5])box([.075,.58,.075],[x,.99,z],bamboo);
 }
 bridge.userData.walkableBridge=true;return bridge;
}
