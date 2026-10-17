import * as T from 'three';
import { gardenKit, COLORS } from './garden-kit.mjs';
export function createMahjong() {
  const k=gardenKit('The mahjong pavilion'),{root,group,mesh,box,cyl,orb,ring,beam,tube,sign,lantern,bamboo,teaSet,bao}=k;
  root.userData.assetId='mahjong-pavilion-study';
  const deck=group('Plank deck, rounded foundation, and entrance steps');
  box(deck,[8.9,.25,7.8],[0,.03,0],'timber',.14);box(deck,[8.78,.10,7.68],[0,.20,0],'honey');
  for(let i=0;i<22;i++)box(deck,[.388,.08,7.45],[-4.2+i*.4,.325,0],i%4?'honey':'paleWood',.012);
  for(const[z,y,w]of[[4.05,.19,3],[4.46,.045,3.5]])box(deck,[w,.17,.68],[0,y,z],'paleWood');
  const frame=group('Open octagonal pavilion frame');
  for(const x of[-3.35,3.35])for(const z of[-2.6,2.6]){
    cyl(frame,.19,.13,[x,.43,z],'jadeDeep');cyl(frame,.11,3.43,[x,2.20,z],'timber');
    box(frame,[.38,.13,.38],[x,3.83,z],'paleWood');
    tube(frame,[[x-Math.sign(x)*.58,3.83,z],[x-Math.sign(x)*.3,3.65,z],[x,3.45,z]],.05,'honey');
  }
  for(const z of[-2.6,2.6])box(frame,[6.94,.17,.19],[0,3.82,z],'timber');
  for(const x of[-3.35,3.35])box(frame,[.19,.17,5.4],[x,3.82,0],'timber');
  for(const x of[-3.35,3.35]){
    beam(frame,[x,1.0,-2.6],[x,1.0,1.0],.05,'honey');for(const z of[-2.5,-1.3,-.1,.9])beam(frame,[x,.38,z],[x,1,z],.035,'jadeDeep');
  }
  beam(frame,[-3.35,1,-2.6],[3.35,1,-2.6],.05,'honey');
  sign(frame,'ONE MORE ROUND',[0,3.49,2.74],2.7);
  lantern(frame,[-2.6,3.8,2.7],.76);lantern(frame,[2.6,3.8,2.7],.76);
  const shade=group('Lift-off eight-sided jade roof');
  const maxR=a=>4.9*Math.cos(Math.PI/8)/Math.cos(((a+Math.PI/8)%(Math.PI/4)+Math.PI/4)%(Math.PI/4)-Math.PI/8);
  const roofY=t=>3.55+1.35*(1-t)**.65+.35*t**9;
  const at=(a,t)=>[Math.cos(a)*maxR(a)*t,roofY(t),Math.sin(a)*maxR(a)*t];
  const positions=[],indices=[],radial=24,angular=64;
  for(let i=0;i<=radial;i++)for(let j=0;j<=angular;j++){
    positions.push(...at(j/angular*Math.PI*2,i/radial));if(i<radial&&j<angular){const a=i*(angular+1)+j;indices.push(a,a+angular+1,a+1,a+1,a+angular+1,a+angular+2);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const material=k.materials.jade.clone();material.side=T.DoubleSide;mesh(shade,geometry,material);
  const seamMaterial=k.materials.jadeDeep.clone();seamMaterial.color.lerp(k.materials.jade.color,.65);
  for(let j=0;j<32;j++)tube(shade,Array.from({length:22},(_,i)=>{const p=at(j/32*Math.PI*2,.14+i/21*.86);p[1]+=.02;return p;}),.012,seamMaterial,24);
  for(let i=1;i<=9;i++)tube(shade,Array.from({length:65},(_,j)=>{const p=at(j/64*Math.PI*2,i/9);p[1]+=.02;return p;}),i===9?.075:.013,i===9?'jadeDeep':seamMaterial,64);
  for(let j=0;j<8;j++)tube(shade,Array.from({length:22},(_,i)=>{const p=at(j/8*Math.PI*2,.06+i/21*.94);p[1]-=.085;return p;}),.060,'paleWood',24);
  cyl(shade,.20,.13,[0,4.97,0],'jadeDeep',.14);orb(shade,.14,[0,5.10,0],'gold',[1,.75,1]);

  const furnishings=group('Mahjong table and four personal cushions');
  for(const yaw of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const seat=group('Rounded player stool',furnishings,[Math.sin(yaw)*2.18,.365,Math.cos(yaw)*2.18]);
    cyl(seat,.44,.12,[0,.20,0],'timber');box(seat,[.77,.15,.69],[0,.32,0],yaw<Math.PI?'jadeLight':'coral',.1);
    for(const x of[-.28,.28])for(const z of[-.23,.23])beam(seat,[x,0,z],[x*.8,.18,z*.8],.04,'timber');
    const seam=ring(seat,.28,.008,[0,.397,0],'cream');seam.rotation.x=Math.PI/2;seam.scale.y=.85;
  }
  const table=group('Detailed green felt table',furnishings,[0,.365,0]);
  box(table,[2.85,.16,2.85],[0,.91,0],'paleWood',.08);box(table,[2.59,.025,2.59],[0,1.005,0],'jadeDeep',.012);
  for(const x of[-1.12,1.12])for(const z of[-1.12,1.12])cyl(table,.065,.84,[x,.45,z],'timber');
  for(const x of[-1.25,1.25])box(table,[.026,.008,2.5],[x,1.023,0],'gold',.002);
  for(const z of[-1.25,1.25])box(table,[2.5,.008,.026],[0,1.023,z],'gold',.002);
  // A single atlas keeps the illustrated dot/bamboo tiles sharp without one material per tile.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
  c.fillStyle=COLORS.cream;c.fillRect(0,0,512,512);
  for(let kind=0;kind<8;kind++){
    const ox=kind%4*128,oy=Math.floor(kind/4)*256;c.strokeStyle=COLORS.gold;c.lineWidth=2;c.strokeRect(ox+10,oy+10,108,236);
    if(kind<4){for(let n=0;n<kind+2;n++){const x=ox+40+(n%2)*48,y=oy+66+Math.floor(n/2)*52;c.strokeStyle=n%2?COLORS.coral:COLORS.jadeDeep;c.lineWidth=6;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.stroke();}}
    else for(let n=0;n<kind-1;n++){const x=ox+37+n%2*48,y=oy+49+Math.floor(n/2)*58;c.strokeStyle=COLORS.jadeDeep;c.lineWidth=7;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+32);c.stroke();c.fillStyle=COLORS.gold;c.fillRect(x-6,y+12,12,4);}
  }
  const atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;const tileFace=new T.MeshStandardMaterial({map:atlas,roughness:.85});
  function tile(p,at,kind=0,flat=false){const g=group('Illustrated ivory and jade tile',p,at);if(flat)g.rotation.x=-Math.PI/2;box(g,[.15,.21,.10],[0,0,0],'jade');box(g,[.144,.204,.025],[0,0,.057],'cream',.015);const face=new T.PlaneGeometry(.123,.176),uv=face.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(kind%4+uv.getX(i))/4,(1-Math.floor(kind/4)+uv.getY(i))/2);mesh(g,face,tileFace,[0,0,.072]);return g;}
  // 80 wall tiles + 52 hand tiles + 12 discards = 144 physical tiles in the study.
  for(let side=0;side<4;side++){
    const hand=group('Player hand and two-level wall',table);hand.rotation.y=side*Math.PI/2;
    for(let i=0;i<13;i++)tile(hand,[-.99+i*.165,1.125,1.12],(i+side*2)%8);
    for(let i=0;i<10;i++)for(let layer=0;layer<2;layer++){box(hand,[.128,.065,.19],[-.64+i*.142,1.06+layer*.07,.72],'cream',.01);box(hand,[.12,.012,.182],[-.64+i*.142,1.10+layer*.07,.72],'jade',.003);}
  }
  for(let i=0;i<12;i++){const t=tile(table,[-.32+i%4*.22,1.105,-.3+Math.floor(i/4)*.25],i%8,true);t.rotation.z=(i%3-1)*.06;}
  const dice=group('Two tiny dice and counting sticks',table,[.73,1.065,-.35]);
  for(const x of[-.06,.06]){box(dice,[.09,.09,.09],[x,0,0],'cream',.013);for(const z of[-.019,.019])orb(dice,.008,[x,.047,z],'coral');}
  for(let i=0;i<4;i++)box(table,[.23,.018,.028],[-.70,1.04,-.32+i*.05],i%2?'coral':'cream',.003);
  const tea=group('Tea and snack side shelf',furnishings,[-3.25,.365,-1.15]);
  box(tea,[.87,.11,1.22],[0,.71,0],'paleWood');for(const x of[-.30,.30])for(const z of[-.45,.45])cyl(tea,.04,.66,[x,.35,z],'timber');teaSet(tea,[0,.78,0],.7);
  cyl(tea,.19,.025,[0,.78,.44],'cream');for(const x of[-.08,.06])orb(tea,.07,[x,.83,.44],'gold',[1,.55,1]);
  bamboo(root,[-3.6,.365,2.66],.8);bamboo(root,[3.6,.365,-2.6],.9);bao(root,[2.86,.50,2.95],.8);
  k.finish();
  return{root,shade,table,dispose:k.dispose,setShadeVisible(v){shade.visible=v;},
    residents:[{id:'east',position:[0,.375,-2.18],yaw:0,color:'#729b8a',pose:'seated'},{id:'south',position:[-2.18,.375,0],yaw:Math.PI/2,color:'#9f88b2',pose:'seated'},{id:'west',position:[0,.375,2.18],yaw:Math.PI,color:'#c88770',pose:'seated'},{id:'north',position:[2.18,.375,0],yaw:-Math.PI/2,color:'#7295b1',pose:'seated'}],
    views:{overview:{position:[11,7.8,14],target:[0,2.15,.1],shade:true},detail:{position:[2.5,7.5,3.5],target:[0,1.1,0],shade:false},approach:{position:[0,2.0,6.8],target:[0,1.7,-.2],shade:true}}};
}
