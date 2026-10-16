import * as T from 'three';
import {createModelLoader} from './assets.mjs';
import {materials, box, cyl, bake} from './garden.mjs';
import {previewTextures} from './assets.mjs';

// Personal furniture stays in the existing station grounds; these are not new buildings.
const PLACES = [
  {id:'orchestrator',station:'center',at:[0,0,-3.65],person:[0,.07,-1.45],kind:'planning',width:2.1,depth:.95,height:1.48,accent:'jade'},
  {id:'product',station:'center',at:[-3.6,0,-4.45],person:[-3.6,.07,-6.1],kind:'menu',width:1.45,depth:.82,height:1.12,turn:Math.PI,accent:'red'},
  {id:'architect',station:'center',at:[3.6,0,-4.45],person:[3.6,.07,-6.1],kind:'drafting',width:1.55,depth:.84,height:1.12,turn:Math.PI,accent:'blue'},
  {id:'developer',station:'steamers',at:[-.75,0,-.20],person:[.85,.015,-.20],kind:'computer',width:1.7,depth:.88,height:1.12,turn:Math.PI/2,accent:'blue'},
  {id:'scout',station:'steamers',at:[2.62,0,.20],person:[3.75,.07,.20],kind:'survey',width:1.18,depth:.78,height:1.08,turn:Math.PI/2,accent:'bamboo'},
  {id:'debugger',station:'steamers',at:[-2.62,0,.20],person:[-3.75,.07,.20],kind:'repair',width:1.18,depth:.78,height:1.08,turn:-Math.PI/2,accent:'red'},
  {id:'designer',station:'front',at:[-2.55,0,.30],person:[-3.70,.07,.30],kind:'art',width:1.22,depth:.82,height:1.08,turn:-Math.PI/2,accent:'pink'},
  {id:'herald',station:'front',at:[2.55,0,.30],person:[3.70,.07,.30],kind:'announcement',width:1.22,depth:.82,height:1.08,turn:Math.PI/2,accent:'gold'},
  {id:'qa',station:'tea',at:[-1.65,0,2.10],person:[-1.65,.07,3.42],kind:'tasting',width:1.3,depth:.8,height:1.08,accent:'jade'},
  {id:'security',station:'pantry',at:[1.65,0,2.10],person:[1.65,.07,3.42],kind:'inspection',width:1.3,depth:.8,height:1.08,accent:'red'},
  {id:'release',station:'festival',at:[2.85,.10,.75],person:[4.05,.07,.75],kind:'release',width:1.2,depth:.8,height:1.08,turn:Math.PI/2,accent:'gold'},
  {id:'keeper',station:'library',at:[-3.3,0,3.7],person:[-3.3,.07,5.0],kind:'archive',width:1.38,depth:.82,height:1.05,accent:'jade',reuse:false},
  {id:'writer',station:'library',at:[3.3,0,3.7],person:[3.3,.07,5.0],kind:'writing',width:1.38,depth:.82,height:1.05,accent:'ivory',reuse:false},
  {id:'cub',station:'dining',at:[2.95,0,0],person:[2.95,.07,1.0],kind:'learning',width:1.08,depth:.8,height:.48,accent:'jade'},
];
const rounded = value => Math.round(value * 1000) / 1000;
const coords = point => point.toArray().map(rounded);

function placard(group, m, label, width, height, depth) {
  box(group,[Math.min(width-.08,1.17),.20,.035],m.darkwood,[0,height-.18,depth/2+.025]);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=112;
  const c=canvas.getContext('2d');c.fillStyle='#eee3c9';c.font='500 60px Georgia, serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(label,384,58,730);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sign=new T.Mesh(new T.PlaneGeometry(Math.min(width-.14,1.11),.162),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
  sign.position.set(0,height-.18,depth/2+.045);sign.name=label+' · desk placard';group.add(sign);
}

function furniture(place, m) {
  const group=new T.Group(), shell=new T.Group(), {width:w,depth:d,height:h}=place;
  group.name=place.id+' · personal workspace';
  if(!place.reuse){
    box(shell,[w,.09,d],m.wood,[0,h-.045,0]);
    box(shell,[w-.09,.045,d-.08],m[place.accent],[0,h+.022,0]);
    for(const x of [-w/2+.13,w/2-.13])for(const z of [-d/2+.12,d/2-.12])box(shell,[.095,h-.11,.095],m.darkwood,[x,(h-.11)/2,z]);
    box(shell,[w-.20,.085,.075],m.bamboo,[0,h*.31,-d/2+.12]);
  }else box(shell,[w-.08,.045,d-.06],m[place.accent],[0,h+.022,0]);
  if(place.kind==='planning'){
    box(shell,[w-.20,.035,d-.16],m.ivory,[0,h+.06,0]);
    for(let i=0;i<3;i++)box(shell,[.27,.018,.17],m[['jade','red','blue'][i]],[-.58+i*.58,h+.085,-.18]);
  }
  if(place.kind==='drafting'){
    const drawing=box(shell,[.75,.022,.54],m.ivory,[-.32,h+.06,-.02]);drawing.rotation.y=.12;
    for(let i=0;i<3;i++)box(shell,[.47-i*.09,.008,.012],m.blue,[-.37,h+.077,-.18+i*.12]);
  }
  if(place.kind==='menu'){
    box(shell,[.46,.025,.54],m.ivory,[-.35,h+.065,-.02]);
    for(let i=0;i<3;i++)cyl(shell,.065,.045,m[['red','jade','gold'][i]],[-.45+i*.12,h+.10,-.15],12);
  }
  if(place.kind==='survey'){
    box(shell,[.48,.023,.42],m.ivory,[-.27,h+.06,0]);
    for(let i=0;i<3;i++){const marker=cyl(shell,.025,.10,m.gold,[-.37+i*.10,h+.12,-.1+i*.08],8);marker.rotation.z=.2;}
  }
  if(place.kind==='repair'){
    box(shell,[w-.12,.035,d-.12],m.slate,[0,h+.06,0]);
    box(shell,[.1,.39,.1],m.darkwood,[-w/2+.12,h+.24,-d/2+.13]);
    box(shell,[.48,.07,.14],m.bamboo,[-w/2+.30,h+.45,-d/2+.13]);
  }
  if(place.kind==='art'){
    const board=box(shell,[.46,.025,.47],m.ivory,[-.28,h+.07,.02]);board.rotation.y=-.18;
    for(let i=0;i<3;i++)cyl(shell,.038,.022,m[['red','jade','blue'][i]],[-.42+i*.12,h+.10,-.08],12);
  }
  if(place.kind==='announcement'||place.kind==='release'){
    box(shell,[.36,.035,.42],m.ivory,[-.31,h+.07,-.03]);
    box(shell,[w-.18,.10,.18],m.darkwood,[0,h*.68,-d/2+.09]);
  }
  if(place.kind==='tasting'){
    for(const x of [-.42,-.12])cyl(shell,.095,.04,m.ivory,[x,h+.075,.10],20);
    cyl(shell,.09,.14,m.jade,[-.3,h+.17,-.20],16);
  }
  if(place.kind==='inspection'){
    box(shell,[.36,.025,.43],m.ivory,[-.33,h+.07,.02]);
    box(shell,[.19,.07,.25],m.red,[-.35,h+.12,-.05]);
  }
  if(place.kind==='writing'){
    box(shell,[.43,.022,.42],m.ivory,[-.31,h+.06,0]);
    cyl(shell,.055,.06,m.slate,[-.49,h+.10,-.16],16);
  }
  if(place.kind==='archive'){
    for(let i=0;i<3;i++)box(shell,[.19,.035,.40],m[['ivory','bamboo','jade'][i]],[-.40+i*.21,h+.06,-.08]);
  }
  if(place.kind==='learning'){
    box(shell,[.18,.025,.53],m.ivory,[-.40,h+.065,0]);
    for(let i=0;i<3;i++)box(shell,[.075,.075,.075],m[['red','gold','blue'][i]],[-.40,h+.12,-.17+i*.17]);
  }
  const merged=bake(shell);merged.name=place.kind+' · compact furniture';group.add(merged);
  placard(group,m,place.label,w,h,d);
  return group;
}

function computer(group,m,place){
  const g=new T.Group();g.name='Developer · modern workstation';g.userData.slot='developer-workstation';
  const {height:h}=place;
  box(g,[.39,.035,.28],m.slate,[-.22,h+.075,-.12]);
  box(g,[.075,.24,.07],m.slate,[-.22,h+.19,-.22]);
  box(g,[.92,.58,.065],m.slate,[-.22,h+.55,-.24]);
  const screen=new T.Mesh(new T.PlaneGeometry(.83,.48),new T.MeshStandardMaterial({color:'#2c4d58',emissive:'#4d99a4',emissiveIntensity:.28,roughness:.35}));
  screen.position.set(-.22,h+.55,-.204);g.add(screen);
  for(let i=0;i<5;i++)box(g,[.17+(i%3)*.11,.009,.004],m[['jade','ivory','blue'][i%3]],[-.38,h+.70-i*.066,-.198]);
  box(g,[.67,.035,.23],m.slate,[-.22,h+.08,.19]);
  for(let row=0;row<3;row++)for(let key=0;key<9;key++)box(g,[.043,.008,.035],m.ivory,[-.47+key*.063,h+.101,.12+row*.058]);
  const mouse=cyl(g,.065,.035,m.slate,[.31,h+.08,.20],16);mouse.scale.z=1.35;
  group.add(g);return g;
}

export async function buildRoleWorkspaces(den){
  if(den.roleWorkspaces)return den.roleWorkspaces;
  const manifest={props:den.propManifest};
  const m=materials(),loader=createModelLoader(),group=new T.Group(),workspaces=new Map(),records=[],anchors={};
  m.wood.color.set('#bc9262');m.darkwood.color.set('#806144');m.bamboo.color.set('#d5b779');
  group.name='Personal workspaces · fourteen residents';den.world.add(group);
  const result={group,workspaces,records,anchors,propsLoadedCount:0,propsLoaded:0,errors:[]};den.roleWorkspaces=result;
  for(const source of manifest.props){
    const setup=PLACES.find(p=>p.id===source.externalId);if(!setup)continue;
    const place={...setup,id:source.id,label:source.label},station=den.zones.get(place.station);
    if(!station)throw Error('Workspace station unavailable: '+place.station);
    if(source.id==='developer'){
      const floor=station.userData.floorY??0;
      place.at=[place.at[0],floor,place.at[2]];place.person=[place.person[0],floor+place.person[1],place.person[2]];
    }
    station.updateMatrixWorld(true);
    const position=station.localToWorld(new T.Vector3(...place.at));
    const pod=furniture(place,m);pod.position.copy(position);pod.rotation.y=station.rotation.y+(place.turn||0);pod.userData={roleId:source.id,stationId:place.station,label:source.label};group.add(pod);
    const desktop=new T.Object3D();desktop.name=source.label+' · desktop anchor';desktop.position.set(0,place.height+.05,0);pod.add(desktop);
    const person=den.residents.children.find(o=>o.name===source.label);
    if(person){person.position.copy(station.localToWorld(new T.Vector3(...place.person)));person.rotation.y=Math.atan2(pod.position.x-person.position.x,pod.position.z-person.position.z);}
    let propAt=[Math.min(place.width*.24,place.width/2-.37),place.height+(place.kind==='planning'?.078:.045),0];
    if(source.id==='developer'){
      computer(pod,m,place);
      // The whole jig & mallet pair has a side shelf, leaving the keyboard and drinks clear.
      box(pod,[.84,.075,.78],m.wood,[-.95,place.height-.02,-.02]);
      for(const z of [-.28,.24])box(pod,[.095,place.height-.1,.095],m.darkwood,[-1.18,(place.height-.1)/2,z]);
      propAt=[-.95,place.height+.0175,-.02];
      anchors.developerDesk=desktop;anchors.developerWorkstation=pod.children.find(o=>o.userData.slot==='developer-workstation');
      const accessories=new T.Object3D();accessories.name='Developer · boba and tablet anchor';accessories.position.set(.60,place.height+.05,.03);pod.add(accessories);anchors.developerAccessories=accessories;
    }
    const propAnchor=new T.Object3D();propAnchor.name=source.title+' · grounded support';propAnchor.position.set(...propAt);propAnchor.userData={supportWidth:source.id==='developer'?.84:place.width,supportDepth:source.id==='developer'?.78:place.depth,offsetX:source.id==='developer'?0:propAt[0]};pod.add(propAnchor);
    pod.updateMatrixWorld(true);
    const record={id:source.id,label:source.label,title:source.title,station:place.station,kind:place.kind,x:rounded(position.x),z:rounded(position.z),radius:source.id==='orchestrator'?3.3:2.5,person:person?coords(person.position):null,desktop:coords(desktop.getWorldPosition(new T.Vector3())),prop:coords(propAnchor.getWorldPosition(new T.Vector3())),surfaceHeight:place.height,width:place.width,depth:place.depth,file:source.file,loaded:false};
    workspaces.set(source.id,{...record,group:pod,person,desktop,propAnchor});records.push(record);
  }
  // Sequential decode avoids fourteen large source texture sets peaking in memory together.
  for(const source of manifest.props){
    const space=workspaces.get(source.id),record=records.find(r=>r.id===source.id);if(!space)continue;
    try{
      let model=den.roleTools.children.find(o=>o.userData.roleId===source.id||o.name===source.title);
      if(model)model.removeFromParent();
      else{const gltf=await loader.loadAsync(source.url);model=gltf.scene;previewTextures(model,512);}
      model.updateMatrixWorld(true);
      const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3()),support=space.propAnchor.userData;
      const scale=Math.min(.70/Math.max(size.x,size.y,size.z),(support.supportWidth-2*Math.abs(support.offsetX)-.03)/size.x,(support.supportDepth-.03)/size.z);
      const normalized=new T.Group();normalized.name=source.title;normalized.userData={roleId:source.id,source:'Original Meshy role prop',file:source.file,wholeSet:true};
      model.position.sub(center);model.position.y+=size.y/2;normalized.add(model);normalized.scale.setScalar(scale);
      const supportPosition=space.propAnchor.getWorldPosition(new T.Vector3());normalized.position.copy(supportPosition);normalized.rotation.y=space.group.rotation.y;den.roleTools.add(normalized);
      normalized.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
      normalized.updateMatrixWorld(true);const placed=new T.Box3().setFromObject(normalized);
      record.loaded=true;record.propBounds={min:coords(placed.min),max:coords(placed.max)};record.groundingError=rounded(placed.min.y-supportPosition.y);record.longestSide=rounded(Math.max(...placed.getSize(new T.Vector3()).toArray()));
      space.prop=normalized;space.loaded=true;result.propsLoadedCount++;result.propsLoaded=result.propsLoadedCount;
      den.renderer.shadowMap.needsUpdate=true;
    }catch(error){record.error=error.message;result.errors.push({id:source.id,message:error.message});console.error('Role workspace prop',source.id,error);}
  }
  den.roleTools.visible=true;den.world.updateMatrixWorld(true);den.world.userData.roleWorkspaces=records;
  
  den.renderer.shadowMap.needsUpdate=true;
  return result;
}
