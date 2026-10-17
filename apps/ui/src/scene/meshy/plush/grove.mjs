// A landscape vignette to review the grove's visual language, not a final site plan.
import * as T from 'three';
import { gardenKit } from './garden-kit.mjs';

export function createGrove({island=true}={}){
 const k=gardenKit('The little rice-terrace grove'),{root,group,mesh,box,cyl,orb,ring,beam,tube,sign,lantern,bamboo,flowers,teaSet,bao}=k;
 root.userData={reviewOnly:false,assetId:'grove-terrace-study',style:'Approved plush bamboo garden',source:'User-provided terraced rice-paddy photograph'};
 k.materials.grass.color.set('#adc98a');k.materials.jadeLight.color.set('#9abd86');
 const materials={water:new T.MeshStandardMaterial({color:'#73adb9',roughness:.29,metalness:.05}),ripple:new T.MeshStandardMaterial({color:'#e6f4de',roughness:.45}),rice:new T.MeshStandardMaterial({color:'#497b4f',roughness:.9,side:T.DoubleSide}),riceGold:new T.MeshStandardMaterial({color:'#c7ad51',roughness:.9,side:T.DoubleSide}),rock:new T.MeshStandardMaterial({color:'#a8b6a7',roughness:.98}),far:new T.MeshStandardMaterial({color:'#a7c0b0',roughness:.98})};
 const land=group('Soft earth, rounded grass edges, and winding walks');
 const mountains=group('Soft folded mountains and mossy foothills');
 const grove=group('Bamboo groves and planted garden margins');
 const fields=group('Five flooded rice terraces with rounded green banks');
 const waterGroup=group('Pale jade-blue water and hand-drawn ripples');
 const shoots=group('Rows of tender rice shoots and a few golden patches');
 const paths=group('Meandering garden path, terrace steps, and timber bridge');
 const details=group('A few small discoveries along the way');
 const contours=[];
 function outline(cx,cz,rx,rz,phase=0){return Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2,r=1+.055*Math.sin(3*a+phase)+.035*Math.sin(5*a+.5);return new T.Vector2(cx+Math.cos(a)*rx*r,cz+Math.sin(a)*rz*r);});}
 function shapeFrom(points){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p.x,-p.y):s.moveTo(p.x,-p.y));s.closePath();return s;}
 // Include both bevel caps in the requested height, keeping water above the bank fill.
 function slab(parent,points,base,top,color,bevel=.08){const b=Math.min(bevel,(top-base)*.4),geometry=new T.ExtrudeGeometry(shapeFrom(points),{depth:top-base-2*b,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:b,bevelThickness:b,curveSegments:6});geometry.rotateX(-Math.PI/2);return mesh(parent,geometry,color,[0,base+b,0]);}
 function surface(parent,points,y,color){const geometry=new T.ShapeGeometry(shapeFrom(points),6);geometry.rotateX(-Math.PI/2);return mesh(parent,geometry,color,[0,y,0]);}
 function inside(x,z,polygon){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.y>z)!==(b.y>z))&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
 if(island){const base=outline(0,0,15.4,10.9,.2);slab(land,base,-.40,.12,'honey',.18);slab(land,outline(0,0,15.35,10.85,.2),.09,.26,'grass',.10);}

 // Sculpted smooth silhouettes, with small irregular folds rather than faceted cones.
 function hill(at,rx,rz,height,color,seed){
  const radial=18,angular=72,vertices=[],indices=[];
  for(let i=0;i<=radial;i++)for(let j=0;j<=angular;j++){
   const t=i/radial,a=j/angular*Math.PI*2,r=1+.055*Math.sin(a*3+seed)+.045*Math.cos(a*5-seed),lift=(1-t*t)**1.4;
   vertices.push(at[0]+Math.cos(a)*rx*t*r+.34*lift*Math.sin(seed),at[1]+height*lift*(1+.06*Math.sin(a*4+seed)*Math.sin(t*Math.PI)),at[2]+Math.sin(a)*rz*t*r);
   if(i<radial&&j<angular){const v=i*(angular+1)+j;indices.push(v,v+1,v+angular+1,v+1,v+angular+2,v+angular+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(mountains,g,color);
 }
 hill([-6,.24,-7.1],5.5,3.6,7.0,materials.far,1.0);hill([.4,.24,-8.3],4.6,2.8,8.0,materials.far,2.4);hill([5.9,.24,-8.4],4.0,2.6,5.7,'jadeLight',3.1);
 hill([-9.4,.24,-5.8],3.5,3.6,4.3,'jade',2.1);hill([-2.8,.24,-6.8],3.3,2.5,4.4,'jadeLight',1.3);
 // Rounded stone outcrops carry pale strata and soft moss caps.
 function rock(p,at,scale=1,seed=0){const g=group('A smooth river rock with a moss cap',p,at);g.rotation.y=seed;g.scale.setScalar(scale);
  const stone=orb(g,.60,[0,.24,0],materials.rock,[1.25,.7,.85]);stone.rotation.z=.09*Math.sin(seed);
  orb(g,.48,[-.09,.48,-.02],'jadeLight',[1.1,.15,.74]);
  for(let i=0;i<2;i++)tube(g,[[-.50,.19+i*.09,.24],[-.17,.18+i*.10,.46],[.28,.19+i*.10,.38],[.57,.22+i*.10,.12]],.012,'stone',16);
  return g;
 }
 for(const[x,z,s,seed]of[[-12,-1,1.5,.3],[-10,4,1.0,1.9],[-12,5.1,.7,2.8],[-5.3,-4.4,1.8,.5],[-3.9,-4.1,.8,2.3],[11.9,-4.5,1.0,2.2],[12.7,3.6,.9,3.8],[1.5,8.5,.8,1.2]])rock(grove,[x,.28,z],s,seed);

 const levels=[
  {cx:5.0,cz:.6,rx:7.7,rz:5.6,y:.62},
  {cx:5.1,cz:-.15,rx:6.66,rz:4.67,y:1.23},
  {cx:5.35,cz:-.95,rx:5.61,rz:3.72,y:1.84},
  {cx:5.68,cz:-1.65,rx:4.51,rz:2.82,y:2.45},
  {cx:6.08,cz:-2.25,rx:3.25,rz:1.87,y:3.06},
 ];
 for(const [index,s]of levels.entries()){
  const bank=outline(s.cx,s.cz,s.rx,s.rz,.7),water=outline(s.cx,s.cz,s.rx-.24,s.rz-.24,.7);contours.push({bank,water,...s});
  slab(fields,bank,.25,s.y-.11,'honey',.075);
  slab(fields,bank,s.y-.11,s.y,'jadeLight',.075);
  surface(waterGroup,water,s.y+.025,materials.water);
  tube(fields,[...bank,bank[0]].map(p=>[p.x,s.y+.05,p.y]),.075,index%2?'jade':'grass',120);
 }
 function rice(x,y,z,golden=false,seed=0){
  const vertices=[],indices=[];
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+seed,h=.27+.09*Math.sin(i*1.7+seed),dx=Math.cos(a),dz=Math.sin(a),start=vertices.length/3;
   for(let j=0;j<5;j++){const t=j/4,w=.021*(1-t)+.003,lean=.13*t*t;vertices.push(x+dx*lean-dz*w,y+h*t,z+dz*lean+dx*w,x+dx*lean+dz*w,y+h*t,z+dz*lean-dx*w);if(j<4){const v=start+j*2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(shoots,g,golden?materials.riceGold:materials.rice);
 }
 let riceCount=0;
 contours.forEach((s,index)=>{
  const inner=contours[index+1];
  // These banks divide the curving flooded shelf into several small plots.
  for(const a of[.33,1.12,1.98,2.76]){
   const outer=new T.Vector3(s.cx+Math.cos(a)*(s.rx-.12),s.y+.04,s.cz+Math.sin(a)*(s.rz-.12));
   const end=inner?new T.Vector3(inner.cx+Math.cos(a)*(inner.rx+.06),s.y+.04,inner.cz+Math.sin(a)*(inner.rz+.06)):new T.Vector3(s.cx,s.y+.04,s.cz);
   const middle=outer.clone().lerp(end,.5);middle.x+=.08*Math.sin(a*2);tube(fields,[outer.toArray(),middle.toArray(),end.toArray()],.085,'jadeLight',18);
  }
  const crop=outline(s.cx,s.cz,s.rx-.47,s.rz-.47,.7);
  for(let x=s.cx-s.rx;x<s.cx+s.rx;x+=.52)for(let z=s.cz-s.rz;z<s.cz+s.rz;z+=.53){
   if(!inside(x,z,crop)||(inner&&inside(x,z,outline(inner.cx,inner.cz,inner.rx+.19,inner.rz+.19,.7))))continue;
   // Leave the western part of each shelf open so the water and steps read clearly.
   if(x<s.cx-s.rx*.55||Math.sin(x*1.7+z*.9)>.89)continue;
   rice(x,s.y+.028,z,index===3&&x>s.cx+.3,x*2+z);riceCount++;
  }
  for(let i=0;i<5;i++){
   const a=.35+i*.55,x=s.cx+Math.cos(a)*(s.rx-.40),z=s.cz+Math.sin(a)*(s.rz-.40),r=.16+(i%2)*.08;
   tube(waterGroup,Array.from({length:14},(_,j)=>{const t=.2+j/13*2.4;return[x+Math.cos(t)*r,s.y+.042,z+Math.sin(t)*r*.45];}),.009,materials.ripple,16);
  }
 });
 root.userData.riceClumps=riceCount;
 // Small bamboo sluices connect shelf heights. Each drops into the flooded shelf below.
 for(let i=0;i<contours.length-1;i++){
  const low=contours[i],high=contours[i+1],a=.56,edge=[high.cx+Math.cos(a)*high.rx,high.y+.05,high.cz+Math.sin(a)*high.rz];
  const outlet=[edge[0]+.16,edge[1],edge[2]+.22];beam(details,[edge[0]-.23,edge[1]-.03,edge[2]-.29],outlet,.08,'jadeDeep');
  tube(waterGroup,[outlet,[outlet[0]+.10,high.y-.25,outlet[2]+.10],[outlet[0]+.11,low.y+.04,outlet[2]+.12]],.036,materials.ripple,16);
  const ripple=ring(waterGroup,.19,.012,[outlet[0]+.11,low.y+.05,outlet[2]+.12],materials.ripple);ripple.rotation.x=Math.PI/2;ripple.scale.y=.68;
 }

 // A shallow, gently wandering stream around the lower garden margin.
 const streamPoints=[[-2.9,.29,-4.8],[-3.5,.29,-2.5],[-3.1,.29,.2],[-3.5,.29,2.3],[-2.0,.29,4.3],[.6,.29,5.7],[2.2,.29,7.3],[1.8,.29,9.0]],streamCurve=new T.CatmullRomCurve3(streamPoints.map(p=>new T.Vector3(...p)));
 const streamV=[],streamI=[],streamEdges=[[],[]];
 for(let i=0;i<=80;i++){const t=i/80,p=streamCurve.getPoint(t),dir=streamCurve.getTangent(t),width=.46+.09*Math.sin(t*9);for(const side of[-1,1]){const pt=[p.x+dir.z*width*side,.305,p.z-dir.x*width*side];streamV.push(...pt);streamEdges[side<0?0:1].push(pt);}if(i<80){const v=i*2;streamI.push(v,v+2,v+1,v+1,v+2,v+3);}}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(streamV,3));sg.setIndex(streamI);sg.computeVertexNormals();mesh(waterGroup,sg,materials.water);
 for(const edge of streamEdges)tube(land,edge,.12,'jadeLight',80);
 const pathCurve=new T.CatmullRomCurve3([[-11,.34,7.2],[-8,.34,6],[-6,.34,3.2],[-5.7,.34,1.5],[-4.3,.34,1.0],[-1.7,.34,1.3],[.2,.34,3.1],[1,.34,5.4]].map(p=>new T.Vector3(...p)));
 for(let i=0;i<39;i++){const t=i/38,p=pathCurve.getPoint(t),tan=pathCurve.getTangent(t);if(p.x>-4.35&&p.x<-2.10)continue;const stone=cyl(paths,.34+.045*Math.sin(i*3),.075,[p.x,.34,p.z],'stone');stone.scale.z=.76;stone.rotation.y=Math.atan2(tan.x,tan.z)+i*.12;}
 const bridge=group('Bowed timber footbridge across the little stream',paths,[-3.07,.32,1.20]);bridge.rotation.y=.06;
 const bridgeY=t=>.10+.28*Math.sin(t*Math.PI);
 for(let i=0;i<17;i++){const t=(i+.5)/17,slat=box(bridge,[.145,.07,1.22],[-1.38+t*2.76,bridgeY(t),0],'paleWood',.02);slat.rotation.z=Math.atan(.28*Math.PI/2.76*Math.cos(t*Math.PI));}
 for(const z of[-.65,.65]){tube(bridge,Array.from({length:25},(_,i)=>{const t=i/24;return[-1.38+t*2.76,bridgeY(t)+.74,z];}),.045,'honey',28);for(let i=0;i<=4;i++){const t=i/4,x=-1.38+t*2.76;beam(bridge,[x,bridgeY(t),z],[x,bridgeY(t)+.76,z],.045,'timber');orb(bridge,.067,[x,bridgeY(t)+.79,z],'gold');}}
 // Broad stones ascend along the western edge of the rice hill.
 for(let i=0;i<18;i++){const t=i/17,x=-1.68+t*3.75,z=3.65-t*5.15,y=.40+t*2.68;const stone=box(paths,[.85,y-.27,.49],[x,.27+(y-.27)/2,z],'stone',.045);stone.rotation.y=-.49;}

 // Keep a clear foreground walk and the main terrace silhouette open.
 const bambooSites=[[-11,-3.4,1.7],[-10.2,-2.5,2.0],[-11.8,-1.6,1.6],[-9.1,-.6,2.1],[-8.6,-2.5,1.75],[-10.5,1.6,1.9],[-8.0,2.2,1.6],[-7.3,-.1,1.8],[-11.7,3.1,1.5],[-5.4,-3.7,1.5],[-3.8,-5.4,1.65],[11.4,-5.8,1.5],[12.6,-3.3,1.35],[13.1,-1.8,1.25]];
 for(const[x,z,s]of bambooSites){
  bamboo(grove,[x,.29,z],s,false);
  for(let i=0;i<7;i++){
   const a=i*2.4+x,y=.29+(1.10+i*.11)*s,cx=x+Math.cos(a)*.30*s,cz=z+Math.sin(a)*.30*s;
   for(let j=0;j<3;j++){const angle=a+(j-1)*.58,leaf=orb(grove,.16,[cx+Math.cos(angle)*.17*s,y-.04*j,cz+Math.sin(angle)*.17*s],i%3?'jade':'jadeLight',[.34*s,.12*s,1.5*s]);leaf.rotation.set(.13,angle+Math.PI/2,(j-1)*.15);}
  }
  for(const dx of[-.27,.27])orb(grove,.23,[x+dx,.29,z+.2],'jadeLight',[1,.35,1]);
 }
 for(const[x,z,s]of[[-12.5,4.4,1.0],[-8.8,5.7,.85],[-5.3,5.8,1.1],[-6.3,7.4,.9],[10.5,5.4,1.0],[11.6,4.7,.8],[5.3,7.4,1.0]]){
  orb(grove,.57,[x,.32,z],'jadeLight',[1.3,.55,1]);flowers(grove,[x,.38,z],x<0?'pink':'cream',s);
 }
 const rest=group('A quiet bench at the bamboo edge',details,[-6.8,.29,4.5]);rest.rotation.y=.28;
 for(const x of[-.70,.70])for(const z of[-.20,.20])beam(rest,[x,0,z],[x,.53,z],.055,'timber');box(rest,[1.92,.13,.65],[0,.55,0],'honey',.07);box(rest,[1.92,.43,.10],[0,.93,-.27],'paleWood',.065);for(const x of[-.72,.72])beam(rest,[x,.51,-.27],[x,1.12,-.27],.045,'timber');
 const cloth=box(rest,[.63,.025,.58],[.43,.63,.01],'coral',.015);teaSet(rest,[.45,.66,.03],.48);
 // A leaf-shaped sign and warm paper lantern mark the garden entrance.
 beam(details,[-9.5,.3,6.7],[-9.5,2.16,6.7],.055,'timber');beam(details,[-9.5,2.08,6.7],[-8.98,2.08,6.7],.045,'timber');lantern(details,[-9.06,2.04,6.7],.70);sign(details,'THE SLOW WAY HOME',[-9.5,1.33,6.76],2.3);
 // Two familiar small discoveries, plus a duck who takes irrigation very seriously.
 const duck=group('Easter egg — the very small irrigation inspector',details,[4.35,.70,5.32]);
 orb(duck,.16,[0,.08,0],'cream',[1.2,.8,1]);orb(duck,.10,[.09,.23,.06],'cream');orb(duck,.048,[.15,.20,.13],'gold',[1,.5,1.2]);orb(duck,.013,[.14,.25,.125],'ink');
 const ripple=ring(waterGroup,.29,.011,[4.35,.672,5.32],materials.ripple);ripple.rotation.x=Math.PI/2;ripple.scale.y=.6;
 const frog=group('Easter egg — a frog on a mossy stream stone',details,[-2.4,.34,4.1]);rock(frog,[0,0,0],.5,1);orb(frog,.12,[0,.30,0],'jadeDeep',[1.2,.8,1]);for(const x of[-.06,.06]){orb(frog,.04,[x,.39,.04],'jade');orb(frog,.013,[x,.405,.075],'ink');}
 bao(details,[-6.65,.98,4.76],.9);
 k.finish();
 return{root,mountains,grove,fields,waterGroup,shoots,paths,details,dispose:k.dispose,
  residents:[{id:'rice-garden-wanderer',position:[3.6,.28,6.9],yaw:-.43,color:'#94ae89',scale:.68},{id:'bamboo-wanderer',position:[-6.02,.38,2.55],yaw:.68,color:'#c58e86',scale:.68}],
  views:{overview:{position:[27,20.7,30.5],target:[0,1.7,-.3]},terraces:{position:[19,14,19],target:[5.5,1.5,-.1]},bamboo:{position:[-18,10,17],target:[-7.7,1.9,.9]},mountains:{position:[18,13,25],target:[-2.7,3.0,-5.0]}},
 };
}
