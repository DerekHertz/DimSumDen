import * as THREE from 'three';
import {compactPanda} from '../scene/procedural/compact.mjs';

// Festival puppet carried on poles, rather than a free-flying creature.
export function createDragonDance(createBao){
  const root=new THREE.Group();root.name='Dragon dance troupe';root.userData.reviewPart=root.name;
  const geometries=new Set(),materials=new Set(),segments=[],performers=[],carriers=[],poles=[];
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:0.75,...extra});materials.add(m);return m;};
  const red=mat('#ba3f31'),gold=mat('#e1b15b'),jade=mat('#426e62'),cream=mat('#fff0d2'),dark=mat('#303331');
  const mesh=(p,g,m,v=[0,0,0],name='')=>{geometries.add(g);const o=new THREE.Mesh(g,m);o.position.set(...v);o.name=name;o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const orb=(p,s,v,m)=>{const o=mesh(p,new THREE.SphereGeometry(1,20,12),m,v);o.scale.set(...s);return o;};
  const cyl=(p,r,h,v,m)=>mesh(p,new THREE.CylinderGeometry(r,r,h,16),m,v);
  const curve=(p,points,r,m)=>mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),16,r,6,false),m);
  const group=(name,parent=root)=>{const g=new THREE.Group();g.name=name;g.userData.reviewPart=name;parent.add(g);return g;};
  for(let i=0;i<19;i++){
    const segment=group(i===0?'Dragon head support':i===18?'Dragon tail':'Dragon silk body');segments.push(segment);
    if(i>0){
      const taper=i>15?1-(i-15)*0.17:1;
      orb(segment,[0.36*taper,0.34*taper,0.51],[0,0,0],red);
      orb(segment,[0.29*taper,0.15*taper,0.49],[0,-0.23*taper,0.025],gold);
      const hoop=mesh(segment,new THREE.TorusGeometry(0.33*taper,0.027,6,24),gold,[0,0,-0.12]);hoop.scale.y=0.98;
      const fin=mesh(segment,new THREE.ConeGeometry(0.17*taper,0.32*taper,4),gold,[0,0.42*taper,-0.03]);fin.rotation.y=Math.PI/4;
      for(const s of [-1,1])curve(segment,[[s*0.29*taper,0,0.22],[s*0.36*taper,-0.2,0.08],[s*0.3*taper,-0.35,-0.03]],0.016,gold);
    }
  }
  const head=group('Dragon face',segments[0]);head.scale.setScalar(1.25);
  orb(head,[0.47,0.36,0.54],[0,0,0],red);orb(head,[0.38,0.24,0.39],[0,-0.02,0.45],gold);
  const jaw=group('Dragon jaw',head);jaw.position.set(0,-0.25,0.16);orb(jaw,[0.34,0.1,0.45],[0,0,0.25],red);orb(jaw,[0.23,0.035,0.3],[0,0.11,0.3],dark);
  for(const s of [-1,1]){
    orb(head,[0.17,0.16,0.14],[s*0.4,0.13,0.29],cream);orb(head,[0.078,0.085,0.055],[s*0.43,0.14,0.405],dark);orb(head,[0.025,0.025,0.012],[s*0.45,0.17,0.451],cream);
    curve(head,[[s*0.31,0.33,-0.12],[s*0.41,0.68,-0.3],[s*0.62,0.91,-0.48]],0.065,gold);
    curve(head,[[s*0.4,0.66,-0.28],[s*0.64,0.72,-0.12]],0.045,gold);
    curve(head,[[s*0.25,0.06,0.73],[s*0.64,0.15,0.97],[s*0.92,0.43,0.78]],0.024,cream);
    orb(head,[0.065,0.035,0.045],[s*0.17,0.14,0.73],dark);
    for(let j=0;j<3;j++){const mane=mesh(head,new THREE.ConeGeometry(0.15,0.47,4),jade,[s*0.41,-0.03+j*0.2,-0.17]);mane.rotation.z=s*-0.7;mane.rotation.x=-0.45;}
    for(const z of [0.4,0.62]){const tooth=mesh(head,new THREE.ConeGeometry(0.045,0.12,8),cream,[s*0.22,-0.14,z]);tooth.rotation.z=Math.PI;}
  }
  curve(jaw,[[0,-0.06,0.54],[0,-0.41,0.7],[0,-0.67,0.62]],0.07,gold);
  const tail=group('Silk tail ribbons',segments[18]);
  for(const s of [-1,0,1])curve(tail,[[s*0.08,0,-0.17],[s*0.14,-0.12,-0.63],[s*0.24,0.12,-1.02]],0.035,s?gold:red);
  function performer(){
    const p=createBao(THREE,{detail:'low'});p.model.scale.setScalar(0.34);root.add(p.model);compactPanda(THREE,p);performers.push(p);
    const wrap=cyl(p.bones.Head,1.13,0.16,[0,1.08,0.02],red);wrap.scale.z=0.79;
    const medallion=cyl(p.bones.Head,0.13,0.035,[0,1.1,0.95],gold);medallion.rotation.x=Math.PI/2;
    for(const b of ['Shoulder_L','Shoulder_R'])p.bones[b].rotation.x=-0.32;
    return p;
  }
  for(const index of [1,6,11,16]){const panda=performer(),pole=cyl(root,0.033,1,[0,0,0],jade);pole.name='Dragon carrying pole';carriers.push({panda,index,pole});poles.push(pole);}
  const leader=performer();leader.model.rotation.y=Math.PI/2;
  const pearl=group('Chasing the pearl');const ball=orb(pearl,[0.23,0.23,0.23],[0,0,0],gold);ball.material=gold;
  for(const rx of [0,Math.PI/2]){const ring=mesh(pearl,new THREE.TorusGeometry(0.29,0.023,6,24),red);ring.rotation.x=rx;}
  const pearlPole=cyl(root,0.035,1,[0,0,0],jade);poles.push(pearlPole);
  const point=(i,time)=>new THREE.Vector3(3.5-i*0.4,2.35+Math.sin(time*2-i*0.52)*0.32,Math.sin(time*1.1-i*0.37)*0.66);
  function update(time,active=true){
    const t=active?time:0;
    for(let i=0;i<segments.length;i++){
      const p=point(i,t),tangent=point(i-0.1,t).sub(point(i+0.1,t)).normalize();
      segments[i].position.copy(p);segments[i].quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tangent);
    }
    jaw.rotation.x=active?0.14+0.07*Math.sin(t*3):0.08;tail.rotation.z=active?0.2*Math.sin(t*2):0;
    for(const {panda,index,pole}of carriers){
      const p=point(index,t);panda.model.position.set(p.x+0.25,0.12,p.z-0.41);panda.model.rotation.y=0;
      panda.bones.Head.rotation.x=active?-0.1+0.045*Math.sin(t*2-index):0;
      panda.bones.Hip_L.rotation.x=active?0.11*Math.sin(t*2-index):0;panda.bones.Hip_R.rotation.x=active?-0.11*Math.sin(t*2-index):0;
      panda.model.updateMatrixWorld(true);
      const hand=root.worldToLocal(panda.bones.Wrist_L.getWorldPosition(new THREE.Vector3())),top=p.clone();top.y-=0.25;
      // Both endpoints are measured from the animated panda and the dragon.
      const delta=top.clone().sub(hand);pole.position.copy(hand).add(top).multiplyScalar(0.5);pole.scale.y=delta.length();pole.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    }
    const front=point(0,t);leader.model.position.set(4.8,0.12,front.z+0.25);
    pearl.position.set(4.6+(active?0.13*Math.sin(t*1.5):0),2.45+(active?0.35*Math.sin(t*2):0),front.z+0.22);pearl.rotation.y=active?t:0;
    leader.model.updateMatrixWorld(true);const hand=root.worldToLocal(leader.bones.Wrist_L.getWorldPosition(new THREE.Vector3())),delta=pearl.position.clone().sub(hand);
    pearlPole.position.copy(hand).add(pearl.position).multiplyScalar(0.5);pearlPole.scale.y=delta.length();pearlPole.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  }
  update(0,false);
  return {root,segments,head,jaw,tail,pearl,performers,carriers,poles,update,dispose(){
    root.removeFromParent();for(const p of performers){p.model.traverse(o=>{if(o.isMesh)o.geometry.dispose();});p.dispose();}
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  }};
}
