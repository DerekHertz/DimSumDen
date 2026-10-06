import * as THREE from 'three';
import {createTraditionalGear} from './traditional-props.mjs';
import {compactPanda} from '../scene/procedural/compact.mjs';

export function createDiningTable(createBao){
  const root=new THREE.Group();root.name='Dim sum dining table';root.userData.reviewPart=root.name;
  const geometries=new Set(),materials=new Set(),diners=[],gears=[],steam=[];
  const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:0.85,...extra});materials.add(m);return m;};
  const wood=material('#8b5839'),bamboo=material('#c39451'),rim=material('#e3be7d'),jade=material('#467565'),cream=material('#fff0d3'),shrimp=material('#e6ad83'),ink=material('#8c4338');
  const mist=material('#fff9e3',{transparent:true,opacity:0.18,depthWrite:false});
  const mesh=(p,g,m,v=[0,0,0],name='')=>{geometries.add(g);const o=new THREE.Mesh(g,m);o.position.set(...v);o.name=name;o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const cyl=(p,r,h,v,m,name)=>mesh(p,new THREE.CylinderGeometry(r,r,h,32),m,v,name);
  const orb=(p,s,v,m,name)=>{const o=mesh(p,new THREE.SphereGeometry(1,16,10),m,v,name);o.scale.set(...s);return o;};
  const ring=(p,r,t,v,m)=>{const o=mesh(p,new THREE.TorusGeometry(r,t,8,40),m,v);o.rotation.x=Math.PI/2;return o;};
  const box=(p,s,v,m)=>mesh(p,new THREE.BoxGeometry(...s),m,v);
  cyl(root,1.48,0.14,[0,1.08,0],wood,'Round dining tabletop');ring(root,1.44,0.025,[0,1.16,0],rim);
  cyl(root,0.24,0.94,[0,0.54,0],wood);cyl(root,0.8,0.1,[0,0.13,0],wood);
  const lazySusan=new THREE.Group();lazySusan.name='Lazy Susan';lazySusan.userData.reviewPart=lazySusan.name;lazySusan.position.y=1.18;root.add(lazySusan);
  cyl(lazySusan,0.98,0.065,[0,0,0],jade);ring(lazySusan,0.96,0.018,[0,0.04,0],rim);
  const foods=['Xiao long bao','Siu mai','Har gow','Custard buns'];
  const baskets=[];
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2,basket=new THREE.Group();basket.name=foods[i];basket.userData.reviewPart=foods[i];basket.position.set(Math.sin(a)*0.57,0.05,Math.cos(a)*0.57);lazySusan.add(basket);baskets.push(basket);
    cyl(basket,0.33,0.13,[0,0.065,0],bamboo);cyl(basket,0.29,0.016,[0,0.137,0],cream);ring(basket,0.33,0.02,[0,0.14,0],rim);
    for(let j=0;j<12;j++){const angle=j/12*Math.PI*2;box(basket,[0.025,0.1,0.025],[Math.sin(angle)*0.325,0.07,Math.cos(angle)*0.325],rim);}
    for(let j=0;j<3;j++){
      const angle=j/3*Math.PI*2,x=Math.sin(angle)*0.15,z=Math.cos(angle)*0.15;
      const filling=orb(basket,i===1?[0.095,0.12,0.095]:i===2?[0.13,0.075,0.09]:[0.115,0.09,0.115],[x,0.23,z],i===1?shrimp:i===3?rim:cream);
      if(i===1){ring(basket,0.1,0.025,[x,0.18,z],rim);orb(basket,[0.025,0.015,0.025],[x,0.35,z],ink);}
      if(i===0){for(let k=0;k<5;k++){const angle=k/5*Math.PI*2;const pleat=box(basket,[0.012,0.045,0.012],[x+Math.sin(angle)*0.035,0.31,z+Math.cos(angle)*0.035],rim);pleat.rotation.z=Math.sin(angle)*0.5;}}
      filling.name=foods[i];
    }
    const wisps=new THREE.Group();wisps.name='Basket steam';wisps.position.y=0.32;basket.add(wisps);
    for(let j=0;j<2;j++){
      const curve=new THREE.CatmullRomCurve3([[j*0.1,0,0],[0.06+j*0.1,0.16,0],[-0.06+j*0.1,0.35,0],[j*0.1,0.56,0]].map(v=>new THREE.Vector3(...v)));
      const puff=mesh(wisps,new THREE.TubeGeometry(curve,12,0.016,4,false),mist);puff.castShadow=puff.receiveShadow=false;
    }
    steam.push(wisps);
  }
  const pot=new THREE.Group();pot.name='Sharing teapot';pot.userData.reviewPart=pot.name;pot.position.set(0,0.06,0);lazySusan.add(pot);
  orb(pot,[0.2,0.16,0.18],[0,0.15,0],ink);cyl(pot,0.1,0.025,[0,0.32,0],rim);orb(pot,[0.035,0.03,0.035],[0,0.35,0],jade);
  const spout=cyl(pot,0.035,0.22,[0.21,0.21,0],ink);spout.rotation.z=-0.8;const handle=ring(pot,0.1,0.025,[-0.2,0.18,0],ink);handle.rotation.x=0;
  const chopsticks=[];
  for(const [i,role]of ['qa','product','scout','designer'].entries()){
    const a=i*Math.PI/2,p=createBao(THREE,{detail:'low'});p.model.position.set(Math.sin(a)*2.22,0.12,Math.cos(a)*2.22);p.model.rotation.y=a+Math.PI;p.model.scale.setScalar(0.4);root.add(p.model);compactPanda(THREE,p);
    const gear=createTraditionalGear(p,role,'teahouse');gear.prop.visible=false;gears.push(gear);diners.push(p);
    cyl(root,0.55,0.09,[p.model.position.x,0.1,p.model.position.z],jade);
    const cup=cyl(root,0.105,0.12,[Math.sin(a)*1.2,1.2,Math.cos(a)*1.2],cream);cup.name='Tea cup';cyl(cup,0.084,0.008,[0,0.065,0],ink);
    const sticks=new THREE.Group();sticks.name='Dining chopsticks';sticks.userData.reviewPart=sticks.name;sticks.position.set(0,-0.05,0.28);sticks.rotation.x=0.75;p.bones.Wrist_R.add(sticks);chopsticks.push(sticks);
    for(const x of [-0.07,0.07])cyl(sticks,0.027,0.95,[x,0.23,0],wood);
  }
  function update(time,active=true){
    const t=active?time:0;lazySusan.rotation.y=active?t*0.2:0;
    for(const [i,p]of diners.entries()){
      p.bones.Elbow_R.rotation.x=active?0.16+0.2*Math.sin(t*1.5+i*1.6):0;
      p.bones.Wrist_R.rotation.z=active?0.12*Math.sin(t*1.5+i*1.6):0;
      p.bones.Head.rotation.x=active?0.04+0.045*Math.sin(t*0.9+i):0;
    }
    for(const [i,w]of steam.entries()){w.position.y=0.32+(active?0.04*Math.sin(t*1.4+i):0);w.rotation.y=active?0.2*Math.sin(t+i):0;}
  }
  update(0,false);
  return {root,diners,lazySusan,baskets,chopsticks,update,dispose(){
    root.removeFromParent();for(const g of gears)g.dispose();
    for(const p of diners){p.model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});p.dispose();}
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  }};
}
