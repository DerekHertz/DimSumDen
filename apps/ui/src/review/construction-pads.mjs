import * as THREE from 'three';
import {CONSTRUCTION_PADS} from './site-plan.mjs';

// Review scenery only: reserved plots are deliberately not working stations.
export function createConstructionPads(den){
  const root=new THREE.Group();root.name='Future restaurant plots';den.world.add(root);
  const geometry=new Set(),materials=new Set(),textures=new Set(),pads=new Map();
  const mat=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:1});materials.add(m);return m;};
  const sand=mat('#d6c9a7'),stone=mat('#dcd9c2'),jade=mat('#6b8c77'),wood=mat('#93724d'),gold=mat('#c3a269');
  const mesh=(parent,g,m,position)=>{geometry.add(g);const o=new THREE.Mesh(g,m);o.position.set(...position);o.receiveShadow=true;parent.add(o);return o;};
  const box=(p,size,at,m)=>mesh(p,new THREE.BoxGeometry(...size),m,at);
  const cylinder=(p,r,h,at,m)=>mesh(p,new THREE.CylinderGeometry(r,r,h,32),m,at);
  const paths=[
    [[-11,7],[-8,3],[-7,-2],[-5,-6],[0,-11],[5,-6],[7,-2],[8,3],[11,7]],
    [[-5,-6],[-5.2,-10],[-7.5,-11.7]],
    [[0,-11],[0,-13],[0,-14.8]],
    [[5,-6],[5.2,-10],[7.5,-11.7]],
    [[-11,7],[-12.8,8],[-14,7.5]],
    [[11,7],[12.8,8],[14,7.5]],
    [[-7,-2],[-11,-2.5],[-14,-5]],
    [[7,-2],[10,-2.5],[12,-5]],
    [[0,18],[0,12],[-3.5,10],[-5.5,10]],
    [[0,12],[3.5,10],[5.5,10]],
  ];
  for(const points of paths){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0.012,z)),false,'centripetal');
    const positions=[],indices=[],steps=48,width=points===paths[0]?2.2:1.8;
    for(let i=0;i<=steps;i++){
      const p=curve.getPoint(i/steps),t=curve.getTangent(i/steps),normal=new THREE.Vector3(-t.z,0,t.x).multiplyScalar(width/2);
      positions.push(p.x+normal.x,p.y,p.z+normal.z,p.x-normal.x,p.y,p.z-normal.z);
      if(i<steps){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const path=mesh(root,g,sand,[0,0,0]);path.name='Wide garden walkway';
  }
  for(const info of CONSTRUCTION_PADS){
    const pad=new THREE.Group();pad.name=info.name;pad.position.set(...info.position);root.add(pad);pads.set(info.id,pad);
    pad.userData.reviewPart=info.name;
    pad.userData.easterEgg={id:`future-${info.id}`,title:info.name,text:`Plot ${info.number} is reserved for a future station. No station has been assigned yet. Bamboo markers and stacked timber show the planned footprint.`};
    cylinder(pad,info.radius,0.08,[0,0.04,0],stone);
    const rim=mesh(pad,new THREE.TorusGeometry(info.radius,0.055,6,64),gold,[0,0.1,0]);rim.rotation.x=Math.PI/2;
    // A jade planning grid and an inset square make the unused footprint visible from above.
    for(const v of [-1.2,-0.6,0,0.6,1.2]){
      box(pad,[3.1,0.015,0.025],[0,0.088,v],jade);
      box(pad,[0.025,0.015,3.1],[v,0.088,0],jade);
    }
    for(const s of [-1,1]){
      box(pad,[3.4,0.02,0.07],[0,0.1,s*1.7],jade);
      box(pad,[0.07,0.02,3.4],[s*1.7,0.1,0],jade);
    }
    for(const x of [-1.7,1.7])for(const z of [-1.7,1.7]){
      cylinder(pad,0.06,0.65,[x,0.4,z],jade);
      cylinder(pad,0.075,0.035,[x,0.62,z],gold);
    }
    for(let i=0;i<3;i++)box(pad,[1.25,0.12,0.16],[-0.6,0.18+i*0.12,1.8],wood);
    cylinder(pad,0.06,1.1,[0,0.55,-1.8],wood);
    box(pad,[1.8,0.7,0.12],[0,1.05,-1.8],wood);
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#eee5cc';ctx.fillRect(0,0,384,128);ctx.fillStyle='#416354';ctx.textAlign='center';ctx.font='bold 28px sans-serif';ctx.fillText('FUTURE STATION',192,48);ctx.font='34px serif';ctx.fillText(info.number,192,99);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    const labelMat=new THREE.MeshBasicMaterial({map:texture});materials.add(labelMat);
    mesh(pad,new THREE.PlaneGeometry(1.66,0.55),labelMat,[0,1.05,-1.732]);
  }
  return {root,pads,dispose(){root.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
