import * as THREE from 'three';

export const DIRECTIONS=[['teahouse','Teahouse cooks'],['scholar','Scholars & temples'],['traveler','Martial arts travelers']];
export const TRADITIONAL_PROPS={
  orchestrator:['Bamboo steamer with bao','Ceremonial jade seal','Jade-tipped command staff'],
  product:['Open recipe menu','Bound planning slips','Unfurled route map'],
  architect:['Carpenter’s square','Timber-frame drawing','Lu Ban carpenter’s square'],
  developer:['Dumpling board & rolling pin','Woodworker’s mallet','Joiner’s mallet'],
  scout:['Woven ingredient basket','Bronze hand mirror','Double-lobed gourd canteen'],
  debugger:['Long chopsticks','Incense censer','Bamboo flute'],
  qa:['Clay tasting teapot','Covered tea bowl','Travel gaiwan & saucer'],
  security:['Lion pantry seal','Temple guardian shield','Guardian’s ribbed lantern'],
  designer:['Lotus serving plate','Round silk fan','Painted folding fan'],
  herald:['Specials banner','Announcement bell','Swallowtail herald banner'],
  'release-manager':['Festival barrel drum','Temple bell','Festival barrel drum'],
  'knowledge-keeper':['Recipe archive chest','Bamboo archive chest','Bamboo archive chest'],
  'docs-writer':['Brush & ink palette','Calligraphy brush & palette','Travel brush & ink palette'],
  'stem-cub':['Lotus cushion','Lotus cushion','Bamboo-leaf pillow'],
};
export const DEFAULT_FIT=Object.freeze({x:0,y:0,z:0,tilt:0,scale:1});
export const FIT_CONTROLS=[['x','Side offset',-0.8,0.8,0.02],['y','Height offset',-0.8,0.8,0.02],['z','Depth offset',-0.8,0.8,0.02],['tilt','Tilt',-90,90,1],['scale','Prop scale',0.55,1.6,0.01]];
export function normalizeFit(value={}){return Object.fromEntries(FIT_CONTROLS.map(([k,,lo,hi])=>[k,Number.isFinite(value[k])?Math.max(lo,Math.min(hi,value[k])):DEFAULT_FIT[k]]));}

// Match the seated panda's pear-shaped body. Cloth stays outside its surface.
export function bellySurface(x,y,width=1){
  const v=(y-1.47)/1.26,rx=1.5*width*(1-0.18*v);
  return 0.16+1.24*Math.sqrt(width)*Math.sqrt(Math.max(0,1-v*v-(x/rx)**2));
}

export function createTraditionalGear(panda,role,direction='traveler'){
  const objects=[],geometries=[],materials=[];
  const m=(color,extra={})=>{const mat=new THREE.MeshStandardMaterial({color,roughness:0.85,...extra});materials.push(mat);return mat;};
  const cream=m('#f5dfac'),wood=m('#976538'),dark=m('#263a38'),jade=m('#497f71'),red=m('#b64136'),gold=m('#cca35d');
  const colors={orchestrator:'#926336',product:'#467e7c',architect:'#7c6343',developer:'#b75638',scout:'#6d8151',debugger:'#6c6288',qa:'#4c8b84',security:'#385468',designer:'#b36a80',herald:'#bd493a','release-manager':'#b84b37','knowledge-keeper':'#526451','docs-writer':'#557bab','stem-cub':'#d6a34c'};
  const cloth=m(colors[role]||'#80634f');
  const group=(name,parent,pos=[0,0,0])=>{const g=new THREE.Group();g.name=name;g.userData.reviewPart=name;g.position.set(...pos);parent.add(g);objects.push(g);return g;};
  const add=(parent,g,mat,pos=[0,0,0])=>{geometries.push(g);const o=new THREE.Mesh(g,mat);o.position.set(...pos);o.castShadow=true;parent.add(o);return o;};
  const box=(p,s,v,mat)=>add(p,new THREE.BoxGeometry(...s),mat,v);
  const cyl=(p,r,h,v,mat)=>add(p,new THREE.CylinderGeometry(r,r,h,24),mat,v);
  const orb=(p,s,v,mat)=>{const o=add(p,new THREE.SphereGeometry(1,24,16),mat,v);o.scale.set(...s);return o;};
  const ring=(p,r,t,v,mat,rx=0)=>{const o=add(p,new THREE.TorusGeometry(r,t,8,40),mat,v);o.rotation.x=rx;return o;};
  const line=(p,points,r,mat)=>add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),24,r,8,false),mat);
  const tassel=(p,v,mat=red)=>{const g=group('Silk tassel',p,v);cyl(g,0.06,0.25,[0,-0.13,0],mat);orb(g,[0.065,0.055,0.065],[0,0,0],gold);return g;};
  const emblem=(p,v)=>{const g=group('Jade medallion',p,v);const disk=cyl(g,0.17,0.04,[0,0,0],jade);disk.rotation.x=Math.PI/2;ring(g,0.17,0.018,[0,0,0.025],gold);box(g,[0.04,0.2,0.018],[0,0,0.04],gold);return g;};
  const hat=group('Headwear',panda.bones.Head,[0,1.6,-0.02]);
  const cap=(scale=[0.92,0.35,0.69])=>orb(hat,scale,[0,-0.18,-0.08],cloth);
  const wrap=()=>{const band=add(hat,new THREE.CylinderGeometry(1.16,1.16,0.18,40,1,true),cloth,[0,-0.5,0.04]);band.name='Cloth headband';band.scale.z=0.8;band.material.side=THREE.DoubleSide;};
  const douli=()=>{
    const brim=add(hat,new THREE.ConeGeometry(1.58,0.58,48,1,true),wood,[0,-0.06,0]);brim.material.side=THREE.DoubleSide;
    ring(hat,1.58,0.028,[0,-0.35,0],gold,Math.PI/2);
    for(let i=0;i<20;i++){const a=i/20*Math.PI*2;line(hat,[[0,0.23,0],[Math.sin(a)*0.79,-0.06,Math.cos(a)*0.79],[Math.sin(a)*1.58,-0.35,Math.cos(a)*1.58]],0.012,gold);}
    tassel(hat,[1.25,-0.37,0.15],cloth);
  };
  // Silhouette belongs to the role, with material/details adapting to each direction.
  if(role==='stem-cub'){
    cap([0.99,0.37,0.76]);
    for(const s of [-1,1]){orb(hat,[0.26,0.27,0.2],[s*0.65,0.12,0.23],cloth);orb(hat,[0.13,0.14,0.035],[s*0.65,0.15,0.42],cream);}
    // Rounded folk tiger bonnet: embroidered eyebrows, muzzle and forehead stripes.
    for(const s of [-1,1]){box(hat,[0.19,0.04,0.03],[s*0.24,-0.16,0.65],dark).rotation.z=s*-0.25;orb(hat,[0.12,0.08,0.04],[s*0.14,-0.31,0.7],cream);}
    orb(hat,[0.07,0.06,0.04],[0,-0.26,0.75],dark);
    for(const y of [0,0.09])box(hat,[0.25,0.035,0.03],[0,y,0.63],dark);
    box(hat,[0.035,0.19,0.03],[0,0.02,0.64],dark);
  }else if(role==='scout')douli();
  else if(role==='security'){
    cap([0.96,0.47,0.73]);box(hat,[0.22,0.51,0.48],[0,0.18,0],gold);emblem(hat,[0,-0.36,0.75]);
    for(const s of [-1,1])box(hat,[0.23,0.6,0.16],[s*1.02,-0.6,0.1],cloth).rotation.z=s*0.18;
  }else if(role==='orchestrator'){
    wrap();orb(hat,[0.3,0.29,0.29],[0,0.1,-0.12],dark);cyl(hat,0.34,0.12,[0,-0.04,-0.12],gold);emblem(hat,[0,-0.47,1.04]);
    for(const x of [-0.1,0.1])box(hat,[0.1,0.67,0.045],[x,-0.6,-0.88],cloth).rotation.x=-0.2;
  }else if(role==='architect'){
    cap([0.9,0.25,0.69]);box(hat,[1.48,0.12,0.25],[0,0.03,-0.16],wood);
    for(let i=0;i<7;i++)box(hat,[0.022,0.055,0.014],[-0.6+i*0.2,0.05,-0.025],cream);
  }else if(role==='developer'){
    wrap();orb(hat,[0.23,0.19,0.16],[-0.95,-0.42,-0.23],cloth);
    for(const s of [-1,1])box(hat,[0.24,0.75,0.045],[-1.02+s*0.12,-0.8,-0.36],cloth).rotation.z=s*0.3;
  }else if(role==='designer'){
    cap([0.84,0.17,0.66]);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const petal=orb(hat,[0.13,0.3,0.055],[0.7+Math.sin(a)*0.17,-0.16+Math.cos(a)*0.17,0.57],cloth);petal.rotation.z=-a;}
    orb(hat,[0.09,0.09,0.06],[0.7,-0.16,0.63],gold);tassel(hat,[0.85,-0.4,0.48]);
  }else if(role==='qa'){
    cap([0.93,0.27,0.7]);ring(hat,0.91,0.05,[0,-0.36,-0.05],jade,Math.PI/2).scale.z=0.8;
    orb(hat,[0.15,0.14,0.12],[0,0.12,-0.03],jade);emblem(hat,[0,-0.39,0.88]);
  }else if(role==='knowledge-keeper'){
    box(hat,[1.52,0.39,1.06],[0,-0.12,-0.05],cloth);for(const s of [-1,1])box(hat,[0.62,0.1,0.26],[s*1.02,-0.17,-0.05],dark);cyl(hat,0.09,0.22,[0,0.2,-0.05],jade);
  }else if(role==='herald'){
    cap([0.86,0.33,0.65]);const crest=box(hat,[0.38,0.6,0.12],[0,0.23,0],cloth);crest.rotation.z=-0.16;emblem(hat,[0,-0.38,0.83]);tassel(hat,[0.82,-0.36,0.05]);
  }else if(role==='release-manager'){
    const festivalCap=cap([0.94,0.28,0.73]);festivalCap.name='Folded festival cap';
    line(hat,[[-0.75,-0.2,0.4],[0,0.03,0.5],[0.75,-0.2,0.4]],0.025,gold);
    orb(hat,[0.16,0.12,0.12],[-0.85,-0.25,0.3],red);
    for(const s of [-1,1])box(hat,[0.11,0.43,0.035],[-0.86+s*0.05,-0.46,0.26],red).rotation.z=s*0.25;
    emblem(hat,[0,-0.3,0.7]);
  }else if(role==='docs-writer'){
    wrap();box(hat,[0.16,0.78,0.025],[-0.9,-0.8,-0.6],cloth).rotation.z=-0.3;line(hat,[[0.8,-0.55,0.55],[0.99,-0.12,0.32],[1.03,0.18,0.1]],0.045,wood);orb(hat,[0.05,0.12,0.04],[1.04,0.27,0.02],dark);
  }else if(role==='debugger'){
    cap([0.9,0.22,0.66]);for(const s of [-1,1])line(hat,[[s*0.72,-0.25,0.54],[s*1.07,0.06,0.1],[s*1.18,0.15,-0.08]],0.035,jade);
  }else{
    cap([0.92,0.27,0.7]);box(hat,[0.74,0.16,0.26],[0,0.03,-0.04],cream).rotation.z=-0.12;emblem(hat,[0,-0.38,0.86]);
  }
  if(direction==='teahouse'&&role==='orchestrator'){
    // Gathered cloth rather than a flat pancake disc.
    orb(hat,[0.74,0.38,0.59],[0,0.03,-0.08],cream);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;orb(hat,[0.24,0.28,0.24],[Math.sin(a)*0.48,0.02,-0.08+Math.cos(a)*0.35],cream);}
  }
  if(direction==='scholar'&&!['stem-cub','scout','security'].includes(role))cyl(hat,0.055,0.14,[0,0.35,-0.08],jade);

  const width=panda.model.userData.bellyWidth||1;
  const scarf=group('Travel sash',panda.bones.Torso);
  const y=1.83,v=(y-1.47)/1.26,rx=1.5*width*(1-0.18*v)*Math.sqrt(1-v*v)+0.065,rz=1.24*Math.sqrt(width)*Math.sqrt(1-v*v)+0.065;
  const points=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return new THREE.Vector3(Math.sin(a)*rx,y-1.4,0.16+Math.cos(a)*rz);});
  add(scarf,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),64,0.075,8,true),cloth);
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=20;i++){const py=1.83-i/20*0.65;for(const px of [0.27,0.49]){positions.push(px,py-1.4,bellySurface(px,py,width)+0.075);uv.push(px,i/20);}if(i<20){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));tail.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tail.setIndex(indices);tail.computeVertexNormals();
  const silk=m(colors[role],{side:THREE.DoubleSide});const sashTail=add(scarf,tail,silk);sashTail.name='Conforming sash tail';
  emblem(scarf,[0.38,0.43,bellySurface(0.38,1.83,width)+0.13]);
  // Plush shoulder caps overlap the body and the open-ended arm tubes in this review only.
  for(const s of [-1,1]){const seam=group('Shoulder seam',panda.bones.Torso,[s*(0.96+(width-1)*0.9),0.93,0.06]);orb(seam,[0.47,0.43,0.47],[0,0,0],panda.materials.charcoal);if(role==='security'){const plate=orb(seam,[0.5,0.2,0.49],[0,0.24,0],cloth);ring(seam,0.35,0.028,[0,0.3,0],gold,Math.PI/2);plate.name='Guardian shoulder plate';}}

  const index=DIRECTIONS.findIndex(d=>d[0]===direction),name=TRADITIONAL_PROPS[role]?.[index]||'Bamboo scroll';
  const base={position:[0,0.02,0.34],rotation:[0,0,0]};
  if(['orchestrator','developer','architect','herald','debugger','docs-writer'].includes(role))base.position=[0,-0.06,0.28];
  const prop=group(name,role==='stem-cub'?panda.bones.Root:panda.bones.Wrist_R,role==='stem-cub'?[0,0.23,1.9]:base.position);
  const scroll=(p,w=0.85,h=0.78)=>{
    box(p,[w,h,0.035],[0,h*0.3,0],cream);for(const x of [-w/2,w/2])cyl(p,0.06,h+0.12,[x,h*0.3,0],wood);
    for(let i=0;i<5;i++)box(p,[w*0.65,0.018,0.01],[0,-h*0.06+i*h*0.14,0.027],dark);
  };
  const drum=(p)=>{
    const body=add(p,new THREE.CylinderGeometry(0.62,0.62,0.5,40),red,[0,0.26,0]);body.rotation.x=Math.PI/2;
    for(const s of [-1,1]){const skin=cyl(p,0.62,0.035,[0,0.26,s*0.265],cream);skin.rotation.x=Math.PI/2;ring(p,0.62,0.03,[0,0.26,s*0.29],gold);}
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2;orb(p,[0.027,0.027,0.027],[Math.sin(a)*0.58,0.26+Math.cos(a)*0.58,0.3],gold);}
    line(p,[[-0.6,0.2,0],[-0.73,0.66,0],[0,0.96,0],[0.73,0.66,0],[0.6,0.2,0]],0.035,cloth);
  };
  const gaiwan=(p)=>{
    const pts=[[0,0],[0.21,0],[0.38,0.34],[0.34,0.37],[0.28,0.09],[0,0.09]];
    add(p,new THREE.LatheGeometry(pts.map(a=>new THREE.Vector2(...a)),32),cream);
    cyl(p,0.48,0.04,[0,-0.04,0],jade);const lid=orb(p,[0.39,0.07,0.39],[0,0.38,0],jade);cyl(p,0.075,0.07,[0,0.47,0],gold);lid.name='Gaiwan lid';
  };
  const brush=(p)=>{cyl(p,0.055,1.25,[0,0.25,0],wood);cyl(p,0.06,0.1,[0,0.83,0],gold);const tip=add(p,new THREE.ConeGeometry(0.09,0.33,24),dark,[0,1.05,0]);tip.rotation.z=Math.PI;};
  if(/staff/.test(name)){
    cyl(prop,0.09,2.65,[0,0.2,0],wood);for(const py of [-0.9,-0.75,1,1.12])ring(prop,0.096,0.014,[0,py,0],gold,Math.PI/2);orb(prop,[0.14,0.21,0.14],[0,1.62,0],jade);tassel(prop,[0.1,1.33,0]);base.rotation[2]=-0.16;
  }else if(/steamer/.test(name)){
    cyl(prop,0.56,0.24,[0,0.12,0],wood);cyl(prop,0.5,0.025,[0,0.25,0],cream);ring(prop,0.55,0.025,[0,0.25,0],gold,Math.PI/2);
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;box(prop,[0.025,0.19,0.025],[Math.sin(a)*0.55,0.12,Math.cos(a)*0.55],gold);}
    for(const x of [-0.24,0.24])orb(prop,[0.19,0.15,0.18],[x,0.38,0],cream);orb(prop,[0.19,0.15,0.18],[0,0.38,0.25],cream);
  }else if(/square/.test(name)){
    box(prop,[0.14,1.23,0.13],[0,0.38,0],wood);box(prop,[0.95,0.14,0.13],[0.4,-0.16,0],wood);
    for(let i=0;i<8;i++)box(prop,[0.024,0.09,0.014],[0.04+i*0.1,-0.12,0.073],cream);
    for(let i=0;i<9;i++)box(prop,[0.08,0.024,0.014],[0,0.04+i*0.1,0.073],cream);
    line(prop,[[0,0.74,0.03],[0.73,-0.16,0.03]],0.02,red);
  }else if(/mallet|rolling pin/.test(name)){
    cyl(prop,0.07,1.25,[0,0.22,0],wood);const head=cyl(prop,0.22,0.66,[0,0.81,0],wood);head.rotation.z=Math.PI/2;
    for(const x of [-0.28,0.28]){const band=ring(prop,0.22,0.018,[x,0.81,0],gold);band.rotation.y=Math.PI/2;}
    if(/board/.test(name))box(prop,[0.7,0.12,0.6],[0,-0.45,0],wood);
  }else if(/gourd/.test(name)){
    // A continuous, recognizable pinched double-lobe profile, with stopper and carrying cord.
    const profile=[[0,-0.52],[0.18,-0.5],[0.32,-0.34],[0.35,-0.12],[0.28,0.05],[0.16,0.16],[0.22,0.29],[0.24,0.43],[0.17,0.57],[0.075,0.63],[0.07,0.72],[0,0.72]];
    add(prop,new THREE.LatheGeometry(profile.map(a=>new THREE.Vector2(...a)),40),gold);cyl(prop,0.087,0.1,[0,0.74,0],wood);ring(prop,0.16,0.025,[0,0.16,0],red,Math.PI/2);line(prop,[[0.15,0.15,0],[-0.3,0.6,-0.02],[0.08,0.81,0]],0.024,cloth);tassel(prop,[0.19,0.12,0.13]);
  }else if(/lantern/.test(name)){
    ring(prop,0.19,0.025,[0,0.14,0],dark);
    const paper=m('#efaa62',{emissive:'#d46720',emissiveIntensity:0.35});orb(prop,[0.43,0.51,0.43],[0,-0.65,0],paper);
    for(const py of [-0.16,-1.14])cyl(prop,0.32,0.085,[0,py,0],dark);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;line(prop,[[Math.sin(a)*0.31,-0.16,Math.cos(a)*0.31],[Math.sin(a)*0.44,-0.65,Math.cos(a)*0.44],[Math.sin(a)*0.31,-1.14,Math.cos(a)*0.31]],0.018,gold);}
    tassel(prop,[0,-1.19,0]);
  }else if(/fan/.test(name)){
    if(/Round/.test(name)){
      const face=cyl(prop,0.6,0.035,[0,0.57,0],cream);face.rotation.x=Math.PI/2;ring(prop,0.6,0.025,[0,0.57,0],wood);cyl(prop,0.04,0.5,[0,-0.2,0],wood);
    }else{
      const r=1.02,a0=-1.12,a1=1.12,verts=[0,0,0.025],ids=[];
      for(let i=0;i<=32;i++){const a=a0+(a1-a0)*i/32;verts.push(Math.sin(a)*r,Math.cos(a)*r,0.025);if(i<32)ids.push(0,i+1,i+2);}
      const sheet=new THREE.BufferGeometry();sheet.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));sheet.setIndex(ids);sheet.computeVertexNormals();add(prop,sheet,m('#f4deae',{side:THREE.DoubleSide}));
      for(let i=0;i<13;i++){const a=a0+(a1-a0)*i/12;line(prop,[[0,0,0.05],[Math.sin(a)*r,Math.cos(a)*r,0.05]],0.018,wood);}
      ring(prop,0.065,0.018,[0,0,0.07],gold);
    }
    line(prop,[[-0.4,0.48,0.07],[0,0.65,0.07],[0.3,0.5,0.07]],0.021,jade);orb(prop,[0.09,0.09,0.01],[0.3,0.79,0.07],red);tassel(prop,[0,-0.08,0]);
  }else if(/banner/.test(name)){
    cyl(prop,0.065,1.95,[0,0.32,0],wood);box(prop,[1.18,0.065,0.065],[0.52,1.17,0],wood);
    const g=new THREE.Shape();g.moveTo(0.08,1.12);g.lineTo(1.07,1.12);g.lineTo(1.07,0.14);g.lineTo(0.56,0.41);g.lineTo(0.08,0.14);g.closePath();add(prop,new THREE.ShapeGeometry(g),m('#b84436',{side:THREE.DoubleSide}));
    for(const py of [0.88,0.64]){box(prop,[0.45,0.045,0.025],[0.56,py,0.02],cream);box(prop,[0.05,0.18,0.025],[0.56,py,0.025],cream);}tassel(prop,[1.06,0.14,0]);
  }else if(/drum/.test(name))drum(prop);
  else if(/brush|palette/.test(name)){
    brush(prop);const palette=group('Ink palette',prop,[0.43,-0.02,0.05]);orb(palette,[0.38,0.08,0.29],[0,0,0],wood);
    for(const [i,mat]of [dark,jade,red,cream].entries())orb(palette,[0.08,0.018,0.075],[Math.cos(i*1.7)*0.2,0.085,Math.sin(i*1.7)*0.13],mat);
  }else if(/archive chest/.test(name)){
    box(prop,[0.92,0.59,0.5],[0,0.18,0],wood);box(prop,[0.96,0.075,0.54],[0,0.5,0],jade);box(prop,[0.1,0.16,0.035],[0,0.36,0.28],gold);
    for(const x of [-0.33,0.33])box(prop,[0.035,0.54,0.035],[x,0.22,0.27],gold);
    for(let i=0;i<3;i++){cyl(prop,0.09,0.57,[-0.26+i*0.26,0.79,0],cream);ring(prop,0.095,0.014,[-0.26+i*0.26,0.75,0],red,Math.PI/2);}
  }else if(/map|drawing|menu|slips/.test(name)){
    scroll(prop,1.02,0.86);
    if(/map|drawing/.test(name)){line(prop,[[-0.35,0.05,0.035],[-0.18,0.25,0.035],[0.04,0.14,0.035],[0.3,0.51,0.035]],0.025,jade);for(const x of [-0.22,0.22])box(prop,[0.15,0.1,0.016],[x,0.43,0.04],red);}
  }else if(/gaiwan|tea bowl/.test(name))gaiwan(prop);
  else if(/teapot/.test(name)){
    orb(prop,[0.4,0.3,0.34],[0,0.22,0],red);cyl(prop,0.19,0.05,[0,0.53,0],wood);orb(prop,[0.06,0.06,0.06],[0,0.6,0],gold);line(prop,[[0.31,0.17,0],[0.53,0.3,0],[0.63,0.46,0]],0.07,red);ring(prop,0.22,0.045,[-0.38,0.23,0],red);
  }else if(/plate/.test(name)){
    cyl(prop,0.54,0.055,[0,0,0],jade);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;orb(prop,[0.14,0.1,0.14],[Math.sin(a)*0.25,0.12,Math.cos(a)*0.25],cream);}
  }else if(/basket/.test(name)){
    cyl(prop,0.45,0.45,[0,0.19,0],wood);for(const py of [0,0.1,0.2,0.3,0.41])ring(prop,0.455,0.018,[0,py,0],gold,Math.PI/2);line(prop,[[-0.44,0.38,0],[-0.34,0.76,0],[0,0.87,0],[0.34,0.76,0],[0.44,0.38,0]],0.04,wood);for(const x of [-0.17,0.17])orb(prop,[0.15,0.1,0.13],[x,0.46,0.1],jade);
  }else if(/seal|shield/.test(name)){
    if(/shield/.test(name)){const face=cyl(prop,0.56,0.09,[0,0.2,0],jade);face.rotation.x=Math.PI/2;ring(prop,0.56,0.04,[0,0.2,0.065],gold);emblem(prop,[0,0.2,0.09]);}
    else{box(prop,[0.5,0.16,0.5],[0,0,0],jade);orb(prop,[0.21,0.18,0.17],[0,0.24,0],jade);for(const x of [-0.12,0.12])orb(prop,[0.06,0.08,0.06],[x,0.37,0],gold);box(prop,[0.44,0.02,0.44],[0,-0.09,0],red);}
  }else if(/bell|censer/.test(name)){
    add(prop,new THREE.CylinderGeometry(0.23,0.4,0.55,32,1,true),gold,[0,0.15,0]);ring(prop,0.4,0.03,[0,-0.13,0],gold,Math.PI/2);ring(prop,0.12,0.028,[0,0.58,0],dark);
  }else if(/mirror/.test(name)){
    const disk=cyl(prop,0.4,0.045,[0,0.51,0],gold);disk.rotation.x=Math.PI/2;cyl(prop,0.055,0.7,[0,0,0],wood);ring(prop,0.4,0.025,[0,0.51,0.03],jade);
  }else if(/flute|chopsticks/.test(name)){
    cyl(prop,0.055,1.25,[0,0.3,0],wood);if(/chopsticks/.test(name))cyl(prop,0.045,1.25,[0.16,0.3,0],wood);else for(let i=0;i<6;i++)orb(prop,[0.025,0.025,0.012],[0,0.03+i*0.14,0.055],dark);tassel(prop,[0,-0.28,0]);
  }else if(/cushion|pillow/.test(name)){
    orb(prop,[0.76,0.18,0.57],[0,0,0],jade);for(const x of [-0.34,0,0.34])line(prop,[[x-0.1,0.15,-0.25],[x,0.2,0],[x+0.1,0.15,0.25]],0.025,gold);
  }
  prop.userData.role=role;hat.userData.role=role;
  const applyFit=value=>{const fit=normalizeFit(value);prop.position.set(...base.position);if(role==='stem-cub')prop.position.set(0,0.23,1.9);prop.position.add(new THREE.Vector3(fit.x,fit.y,fit.z));prop.rotation.set(...base.rotation);prop.rotation.z+=fit.tilt*Math.PI/180;prop.scale.setScalar(fit.scale);};
  applyFit(DEFAULT_FIT);
  return {prop,hat,name,applyFit,dispose(){for(const o of objects)o.removeFromParent();for(const g of geometries)g.dispose();for(const material of materials)material.dispose();}};
}
