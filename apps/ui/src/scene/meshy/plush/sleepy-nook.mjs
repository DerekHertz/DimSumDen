import * as T from 'three';
import { gardenKit } from './garden-kit.mjs';
export function createSleepyNook(){
  const k=gardenKit('The sleepy leaf nook'),{root,group,mesh,box,cyl,orb,ring,beam,tube,sign,lantern,bamboo,flowers,bao}=k;
  root.userData.assetId='sleepy-nook-study';
  const ground=group('Quiet mossy island and stepping stones');
  const base=cyl(ground,1,.20,[0,.015,0],'honey');base.scale.set(4.2,1,3.5);
  const grass=cyl(ground,1,.08,[0,.155,0],'grass');grass.scale.set(4.15,1,3.45);
  for(const[x,z,r]of[[0,2.95,.31],[.1,2.33,.32],[-.45,1.95,.25],[2.8,1.25,.28]]){const s=cyl(ground,r,.08,[x,.23,z],'stone');s.scale.z=.75;s.rotation.y=x;}
  const frame=group('Bamboo hammock frame and four suspension ropes');
  for(const x of[-2.15,2.15]){
    tube(frame,[[x,.20,0],[x*.98,2.10,0],[x*.75,3.0,-.4],[0,3.67,-.75]],.075,'jadeDeep',36);
    for(const y of[.6,1.1,1.6,2.1])cyl(frame,.09,.03,[x,y,0],'honey');
    for(const z of[-1.53,1.53])tube(frame,[[x,2.35,0],[Math.sign(x)*1.35,1.72,z*.8],[Math.sign(x)*1.07,1.30,z]],.019,'paleWood');
  }
  const hammock=group('Woven hammock, spreader bars, and pillow');
  const points=[],indices=[],nx=22,nz=32;
  const bedAt=(x,z)=>.70+.43*(Math.abs(z)/1.55)**2+.22*(Math.abs(x)/1.08)**2;
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
    const x=(i/nx-.5)*2.16,z=(j/nz-.5)*3.1;points.push(x,bedAt(x,z),z);
    if(i<nx&&j<nz){const p=i*(nz+1)+j;indices.push(p,p+nz+1,p+1,p+1,p+nz+1,p+nz+2);}
  }
  const bed=new T.BufferGeometry();bed.setAttribute('position',new T.Float32BufferAttribute(points,3));bed.setIndex(indices);bed.computeVertexNormals();const cloth=k.materials.cream.clone();cloth.side=T.DoubleSide;mesh(hammock,bed,cloth);
  for(const x of[-1.08,1.08])tube(hammock,Array.from({length:33},(_,j)=>{const z=(j/32-.5)*3.1;return[x,bedAt(x,z)+.015,z];}),.027,'honey',32);
  for(const z of[-1.55,1.55])beam(hammock,[-1.12,1.34,z],[1.12,1.34,z],.044,'paleWood');
  for(let i=0;i<13;i++){const x=-1.0+i/12*2;tube(hammock,Array.from({length:17},(_,j)=>{const z=(j/16-.5)*3.08;return[x,bedAt(x,z)+.007,z];}),.005,'honey',20);}
  box(hammock,[1.16,.30,.67],[0,1.11,-.72],'pink',.11);
  for(const x of[-.47,.47])tube(hammock,[[x,1.22,-1.0],[x,1.26,-.72],[x,1.22,-.44]],.008,'cream');
  const shade=group('Overlapping giant bamboo-leaf hood');
  const leaves=[{end:[-2.7,1.8,1.02],w:.96,color:'jade'},{end:[2.7,1.8,1.02],w:.96,color:'jade'},{end:[-2.25,1.15,-2.35],w:1.05,color:'jadeDeep'},{end:[2.25,1.15,-2.35],w:1.05,color:'jadeDeep'},{end:[0,1.25,-2.9],w:1.1,color:'jade'}];
  for(const spec of leaves){
    const positions=[],faces=[],n=24,m=12;
    const leafAt=(t,u)=>{const start=new T.Vector3(0,3.68,-.75),end=new T.Vector3(...spec.end),centre=start.lerp(end,t);centre.y+=.34*Math.sin(t*Math.PI);const cross=new T.Vector3(end.z+.75,0,-end.x).normalize().multiplyScalar(Math.sin(t*Math.PI)*spec.w*u);return[centre.x+cross.x,centre.y-.11*u*u*Math.sin(t*Math.PI),centre.z+cross.z];};
    for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){positions.push(...leafAt(i/n,j/m*2-1));if(i<n&&j<m){const v=i*(m+1)+j;faces.push(v,v+m+1,v+1,v+1,v+m+1,v+m+2);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(faces);g.computeVertexNormals();const mat=k.materials[spec.color].clone();mat.side=T.DoubleSide;mesh(shade,g,mat);
    tube(shade,Array.from({length:25},(_,i)=>{const p=leafAt(i/24,0);p[1]+=.02;return p;}),.023,'jadeLight',28);
    for(const t of[.25,.42,.59,.76])for(const side of[-1,1])tube(shade,[leafAt(t,0),leafAt(t+.06,side*.5),leafAt(t+.13,side*.88)],.009,'jadeLight',12);
  }
  // A crescent and small wooden stars make a quiet mobile, with no electric glow.
  const mobile=group('Moon and star mobile',frame,[-1.62,3.05,-.35]);
  const moonShape=new T.Shape();moonShape.moveTo(.16,.23);moonShape.bezierCurveTo(-.15,.35,-.35,.1,-.20,-.15);moonShape.bezierCurveTo(-.10,-.35,.22,-.30,.28,-.13);moonShape.bezierCurveTo(-.05,-.20,-.12,.12,.16,.23);
  beam(mobile,[0,0,0],[0,-.42,0],.008,'paleWood');mesh(mobile,new T.ExtrudeGeometry(moonShape,{depth:.035,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2}),'gold',[0,-.72,0]);
  function starGeometry(r){const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?r*.45:r;i?s.lineTo(Math.sin(a)*rr,Math.cos(a)*rr):s.moveTo(Math.sin(a)*rr,Math.cos(a)*rr);}s.closePath();return new T.ShapeGeometry(s);}
  for(const[x,y]of[[-.4,-.4],[.4,-.25]]){beam(mobile,[x,0,0],[x,y-.25,0],.007,'paleWood');mesh(mobile,starGeometry(.13),'lilac',[x,y-.38,0]);}
  const bedside=group('Bedside shelf, reading lamp, and slippers');
  const side=group('Rounded bedside stump',bedside,[-1.92,.20,1.18]);cyl(side,.38,.62,[0,.31,0],'timber');cyl(side,.42,.08,[0,.66,0],'paleWood');
  box(side,[.44,.055,.36],[.03,.735,.07],'jadeDeep',.02);box(side,[.40,.035,.33],[.03,.78,.07],'cream',.01);
  for(let i=0;i<4;i++)box(side,[.25,.004,.015],[.03,.80,-.03+i*.055],'honey',.001);
  const lamp=group('Tiny paper reading lantern',side,[-.12,.72,-.16]);cyl(lamp,.12,.04,[0,.02,0],'honey');beam(lamp,[0,.04,0],[0,.40,0],.018,'timber');orb(lamp,.18,[0,.39,0],'cream',[1,1.15,1]);for(const y of[.21,.58])cyl(lamp,.075,.025,[0,y,0],'honey');
  for(const x of[1.52,1.83]){const g=group('A slipper left by the hammock',bedside,[x,.25,1.92]);orb(g,.15,[0,0,0],'lilac',[.75,.32,1.5]);orb(g,.12,[0,.06,-.06],'cream',[.9,.42,1]);}
  const quilt=group('Draped lilac quilt with moon-and-star stitching');
  const qx=18,qz=12,qPositions=[],qIndices=[];
  for(let i=0;i<=qx;i++)for(let j=0;j<=qz;j++){const x=-.86+i/qx*1.72,z=-.12+j/qz*.9;qPositions.push(x,1.60+.22*Math.cos(x/.86*Math.PI/2)-.22*j/qz,z);if(i<qx&&j<qz){const v=i*(qz+1)+j;qIndices.push(v,v+qz+1,v+1,v+1,v+qz+1,v+qz+2);}}
  const quiltGeometry=new T.BufferGeometry();quiltGeometry.setAttribute('position',new T.Float32BufferAttribute(qPositions,3));quiltGeometry.setIndex(qIndices);quiltGeometry.computeVertexNormals();const quiltMaterial=k.materials.lilac.clone();quiltMaterial.side=T.DoubleSide;mesh(quilt,quiltGeometry,quiltMaterial);
  const stitches=group('Quilt seams and felt stars',quilt);
  function drapeQuilt(heightAt){
    const position=quiltGeometry.attributes.position;
    for(let i=0;i<position.count;i++)position.setY(i,heightAt(position.getX(i),position.getZ(i))+.025);
    position.needsUpdate=true;quiltGeometry.computeVertexNormals();quiltGeometry.computeBoundingSphere();
    for(const x of[-.83,-.28,.28,.83])tube(stitches,Array.from({length:25},(_,i)=>{const z=-.10+i/24*.86;return[x,heightAt(x,z)+.037,z];}),.007,'cream',28);
    for(const z of[-.10,.20,.48,.76])tube(stitches,Array.from({length:33},(_,i)=>{const x=-.83+i/32*1.66;return[x,heightAt(x,z)+.037,z];}),.007,'cream',32);
    for(const[x,z,r]of[[-.05,.37,.10],[.40,.36,.07],[-.45,.65,.07]]){const s=mesh(stitches,starGeometry(r),'gold',[x,heightAt(x,z)+.044,z]);s.rotation.x=-Math.PI/2;}
  }
  sign(frame,'DO NOT HURRY',[0,3.04,-1.9],2.3);
  for(const x of[-.70,.70])beam(frame,[x,3.45,-.62],[x,3.24,-1.9],.012,'paleWood');
  bamboo(root,[-2.9,.20,-1.85],.95,false);bamboo(root,[2.9,.20,-1.65],.82,false);flowers(root,[-2.7,.20,1.50],'pink',.9);
  const secret=bao(root,[2.45,.33,1.62],.8);cyl(secret,.09,.045,[0,.13,0],'lilac');orb(secret,.07,[-.03,.18,0],'lilac',[1,1.3,.9]);orb(secret,.022,[-.08,.23,0],'cream');
  k.finish([...root.children].filter(g=>g!==quilt));
  return{root,shade,quilt,quiltGeometry,drapeQuilt,dispose:k.dispose,setShadeVisible(v){shade.visible=v;},
    residents:[{id:'dreamer',position:[0,1.28,.90],yaw:0,color:'#9bafc7',pose:'reclining',headwear:'stem-cub'}],
    views:{overview:{position:[8.2,7.6,11.1],target:[0,1.8,0],shade:true},detail:{position:[2.8,6.5,1.8],target:[0,1.35,0],shade:false},approach:{position:[-3.6,2.4,5.4],target:[0,1.35,0],shade:true}}};
}
