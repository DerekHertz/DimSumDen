import * as THREE from 'three';
export const REVIEW_SKIES={morning:'#dce7d9',lantern:'#22373e',garden:'#cfdfd6'};

// A finite garden with a scenic mountain backdrop. All planting stays outside the service paths.
export function createReviewLandscape(den,sample='morning'){
  const root=new THREE.Group();root.name='Mountain garden';root.userData.reviewPart='Mountain garden';den.world.add(root);
  const geometries=new Set(),materials=new Set();let seed=913;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const mat=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1});materials.add(m);return m;};
  const bamboo=mat('#456b47'),node=mat('#8c9b63'),leaf=mat('#527750'),rock=mat('#909e83'),cream=mat('#e8dab0');
  const mountains=[mat(sample==='lantern'?'#304f56':'#8aaba0'),mat(sample==='lantern'?'#29474a':'#719486'),mat(sample==='lantern'?'#26413c':'#537c69')];
  const instances=(name,geometry,material,poses)=>{
    geometries.add(geometry);const mesh=new THREE.InstancedMesh(geometry,material,poses.length);mesh.name=name;mesh.userData.reviewPart=name;mesh.castShadow=mesh.receiveShadow=true;
    const helper=new THREE.Object3D();poses.forEach(({position,scale,rotation=0},i)=>{helper.position.set(...position);helper.scale.set(...scale);helper.rotation.set(0,rotation,0);helper.updateMatrix();mesh.setMatrixAt(i,helper.matrix);});mesh.computeBoundingSphere();root.add(mesh);return mesh;
  };
  const stems=[],nodes=[],leaves=[],rocks=[],blossoms=[];
  for(let i=0;i<70;i++){
    const angle=i/70*Math.PI*2;
    for(let j=0;j<3;j++){
      const r=21.8+random()*1.8,x=Math.sin(angle)*r+(random()-0.5)*0.7,z=Math.cos(angle)*r-1+(random()-0.5)*0.7;
      if(z>14&&Math.abs(x)<18)continue;
      const h=3.6+random()*3.8;stems.push({position:[x,h/2,z],scale:[0.07+random()*0.06,h,0.09]});
      for(let k=1;k<5;k++)nodes.push({position:[x,k*h/5,z],scale:[0.14,0.045,0.14]});
      for(let k=0;k<3;k++)leaves.push({position:[x+(random()-0.5)*1.6,h*(0.65+k*0.1),z+(random()-0.5)*1.6],scale:[0.9,0.2,0.5],rotation:random()*Math.PI});
    }
    const r=20.5+random()*1.6,x=Math.sin(angle)*r,z=Math.cos(angle)*r-1;
    if(z<15||Math.abs(x)>17)rocks.push({position:[x,0.25,z],scale:[0.4+random()*0.7,0.3+random()*0.35,0.5+random()*0.8],rotation:angle});
  }
  instances('Dense boundary bamboo',new THREE.CylinderGeometry(1,1,1,6),bamboo,stems);
  instances('Bamboo joints',new THREE.CylinderGeometry(1,1,1,6),node,nodes);
  instances('Bamboo canopy',new THREE.SphereGeometry(1,6,4),leaf,leaves);
  instances('Garden rocks',new THREE.DodecahedronGeometry(1),rock,rocks);
  const shrubs=[];
  for(const [x,z]of [[-13,17],[13,18],[-18,0],[-17,-12],[17,-14]])for(let i=0;i<12;i++){
    const px=x+(random()-0.5)*3,pz=z+(random()-0.5)*1.5,y=0.25+random()*0.25;
    shrubs.push({position:[px,y,pz],scale:[0.6,y,0.45]});
    blossoms.push({position:[px,y*2,pz],scale:[0.06,0.045,0.06]});
  }
  instances('Jasmine planting beds',new THREE.SphereGeometry(1,8,6),leaf,shrubs);
  instances('Jasmine flowers',new THREE.SphereGeometry(1,6,4),cream,blossoms);
  const peaks=[];
  for(let layer=0;layer<3;layer++){
    const poses=[];
    for(let i=0;i<12;i++){
      const x=-39+i*7+random()*2,z=-31-layer*7,h=7+random()*10+(layer===2?5:0);
      poses.push({position:[x,h*0.4-1,z],scale:[4+random()*2,h,3.5+random()*2],rotation:random()*Math.PI});
    }
    const ridge=instances(`Mountain ridge ${layer+1}`,new THREE.DodecahedronGeometry(1,0),mountains[layer],poses);ridge.castShadow=false;peaks.push(ridge);
  }
  return {root,peaks,stemCount:stems.length,dispose(){root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
