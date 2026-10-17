// Model-sized footprints, not a live den layout. +Z is south / the front of an unrotated model.
export const PLACES = [
  {id:'bao',name:'Bao',roles:'Orchestrator · the heart of the den',kind:'bao',w:5.8,d:5.8,labels:['BAO'],note:'A clear welcome and conversation spot at the heart of the garden. The Pass holds Product and Architect; Bao remains the orchestrator.',review:null},
  {id:'pass',name:'The Pass',roles:'Product + Architect',kind:'planned',w:12.8,d:9.0,labels:['The Pass'],note:'Shared planning pavilion with two personal workstations. Its footprint reserves space; its workstation design still needs a standalone study.'},
  {id:'steamers',name:'Steamers',roles:'Developer + Scout',kind:'work',w:13.0,d:8.9,labels:['Steamers'],note:'The reviewed shared pavilion. Keep a generous front landing and a clear central aisle to both personal workstations.',review:'pavilion-review.html'},
  {id:'pantry',name:'Tea & Pantry',roles:'QA + Security',kind:'planned',w:12.8,d:9.0,labels:['Tea & Pantry'],note:'A work pavilion for QA and Security, separate from the leisure tea garden. Personal workstation design is still to come.'},
  {id:'front',name:'Front of House',roles:'Designer + Herald',kind:'planned',w:12.8,d:9.0,labels:['Front of','House'],note:'A shared creative pavilion with individual workstations. Its footprint is reserved; the detailed model is still to come.'},
  {id:'library',name:'The library',roles:'Recipes · skills · connections',kind:'work',w:10.1,d:8.1,labels:['The library'],note:'The approved walk-in library. Keep the doorway and central browsing aisle easy to approach from the work loop.',review:'library-review-v2.html'},
  {id:'festival',name:'Festival stage',roles:'Dragon crew + the little band',kind:'lively',w:13.3,d:10.5,labels:['Festival','stage'],note:'The lively garden edge: red-and-gold panda-carried dragon, musical pandas, and room in front for an audience.',review:'festival-review.html'},
  {id:'mahjong',name:'Mahjong',roles:'A table for four',kind:'leisure',w:9.8,d:9.8,labels:['Mahjong'],note:'A social stop off the main loop. Four pandas, a detailed tile table, tea, and open sides. One of the three approved style references.',review:'leisure-review.html#model=mahjong&view=overview'},
  {id:'tea',name:'Tea garden',roles:'Leaf shade · koi pond · bridge',kind:'quiet',w:10.0,d:7.8,labels:['Tea garden'],note:'A quiet pause near the arrival path and the sleepy grove. Leaf parasol, curved bridge, koi, and tea service. A primary style reference.',review:'leisure-review.html#model=tea&view=overview'},
  {id:'sleepy',name:'Sleepy nook',roles:'Hammock · quilt · a little peace',kind:'quiet',w:8.4,d:7.0,labels:['Sleepy nook'],note:'A sheltered destination at the quiet edge, well away from the festival. Leaf hood, hammock, soft quilt, and small bedtime details. A primary style reference.',review:'leisure-review.html#model=sleepy&view=overview'},
];
const garden={bao:[0,-.6,0],pass:[0,-17.4,0],steamers:[-20.2,-11.9,0],pantry:[20.2,-11.9,0],front:[21,5,90],library:[-21,6,270],festival:[-26,20,180],mahjong:[-10,20.5,180],tea:[10.5,20.5,180],sleepy:[33,11.5,90]};
const courtyard={bao:[0,-.5,0],pass:[-8,-18,0],steamers:[9,-18,0],pantry:[-22,-4,270],front:[22,-4,90],library:[-22,9,270],festival:[-28,22,180],mahjong:[-10,21,180],tea:[10,21,180],sleepy:[32,16,90]};
const lanes={bao:[0,0,0],pass:[0,-20,0],steamers:[-20,-20,0],pantry:[20,-20,0],front:[22,0,90],library:[-22,0,270],festival:[-24,21,180],mahjong:[-6,21,180],tea:[11,21,180],sleepy:[33,18,90]};
export const PRESETS={
  garden:{name:'Garden loop',description:'Work around Bao, social corners near arrival, and a quiet grove on the far side.',positions:garden},
  courtyard:{name:'Courtyard',description:'A shared north court, side pavilions, and a broad leisure garden to the south.',positions:courtyard},
  lanes:{name:'Village lanes',description:'A pair of garden lanes connects clearly separated work and leisure rows.',positions:lanes},
};
export function createPlaces(preset='garden'){return PLACES.map(place=>({...place,x:PRESETS[preset].positions[place.id][0],z:PRESETS[preset].positions[place.id][1],rotation:PRESETS[preset].positions[place.id][2]}));}
export function bounds(place,padding=0){const swapped=place.rotation%180!==0,w=(swapped?place.d:place.w)/2+padding,d=(swapped?place.w:place.d)/2+padding;return{x0:place.x-w,x1:place.x+w,z0:place.z-d,z1:place.z+d};}
export function localPoint(place,x,z){const a=place.rotation*Math.PI/180;return{x:place.x+Math.cos(a)*x-Math.sin(a)*z,z:place.z+Math.sin(a)*x+Math.cos(a)*z};}
export function door(place,offset=0){return localPoint(place,0,place.d/2+offset);}
const line=(a,b,steps=30)=>Array.from({length:steps+1},(_,i)=>({x:a[0]+(b[0]-a[0])*i/steps,z:a[1]+(b[1]-a[1])*i/steps}));
export function roads(preset){
  const circle=Array.from({length:97},(_,i)=>({x:6.5*Math.cos(i/96*Math.PI*2),z:6.5*Math.sin(i/96*Math.PI*2)}));
  const result=[circle,line([0,33],[0,6.5]),line([0,6.5],[0,4.2])];
  if(preset==='lanes')result.push(line([-32,-10],[32,-10]),line([-32,11],[32,11]),line([-10,-10],[-10,11]),line([10,-10],[10,11]),line([0,-6.5],[0,-10]),line([-6.5,0],[-10,0]),line([6.5,0],[10,0]));
  else{
    const rx=preset==='courtyard'?15.6:15.8,rz=preset==='courtyard'?10.3:11.2;
    result.push(Array.from({length:161},(_,i)=>({x:rx*Math.cos(i/160*Math.PI*2),z:rz*Math.sin(i/160*Math.PI*2)})),line([0,-6.5],[0,-rz]),line([6.5,0],[rx,0]),line([-6.5,0],[-rx,0]));
  }
  return result;
}
export function issuesFor(places,paths){
  const issues=[];
  for(let i=0;i<places.length;i++){
    const a=bounds(places[i]);
    if(a.x0< -39||a.x1>39||a.z0< -33||a.z1>32)issues.push({ids:[places[i].id],text:`${places[i].name} reaches beyond the garden edge.`});
    for(let j=i+1;j<places.length;j++){const b=bounds(places[j]);if(a.x0<b.x1&&a.x1>b.x0&&a.z0<b.z1&&a.z1>b.z0)issues.push({ids:[places[i].id,places[j].id],text:`${places[i].name} overlaps ${places[j].name}.`});}
    if(places[i].id!=='bao'&&paths.some(path=>path.some(p=>p.x>a.x0-.3&&p.x<a.x1+.3&&p.z>a.z0-.3&&p.z<a.z1+.3)))issues.push({ids:[places[i].id],text:`${places[i].name} sits across the main walk. Try moving it outward.`});
  }
  return issues;
}
// Grid routing is a planning aid for the outdoor connector paths. Interiors remain for walk-mode design.
export function routeToWalk(place,places,paths){
  const blockedBoxes=places.map(p=>bounds(p,1.35));
  const blocked=(x,z)=>x< -40||x>40||z< -33||z>33||blockedBoxes.some(b=>x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1);
  const from=door(place,2.2),start={x:Math.round(from.x),z:Math.round(from.z)};
  const samples=paths.flat().map(p=>({x:Math.round(p.x),z:Math.round(p.z)})).filter(p=>!blocked(p.x,p.z));
  if(blocked(start.x,start.z)||!samples.length)return null;
  const goal=samples.reduce((a,p)=>(p.x-start.x)**2+(p.z-start.z)**2<(a.x-start.x)**2+(a.z-start.z)**2?p:a);
  const key=(x,z)=>`${x},${z}`,startKey=key(start.x,start.z),goalKey=key(goal.x,goal.z);
  const open=[{...start,key:startKey,g:0,f:0}],scores=new Map([[startKey,0]]),parents=new Map(),closed=new Set();
  const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(open.length){
    let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
    const cur=open.splice(best,1)[0];if(closed.has(cur.key))continue;closed.add(cur.key);
    if(cur.key===goalKey){const path=[{x:cur.x,z:cur.z}];let cursor=cur.key;while(parents.has(cursor)){const p=parents.get(cursor);path.push({x:p.x,z:p.z});cursor=p.key;}path.reverse();return[door(place),from,...path];}
    for(const[dx,dz]of directions){const x=cur.x+dx,z=cur.z+dz,k=key(x,z);if(blocked(x,z)||closed.has(k)||(dx&&dz&&(blocked(cur.x+dx,cur.z)||blocked(cur.x,cur.z+dz))))continue;const g=cur.g+Math.hypot(dx,dz);if(g>=(scores.get(k)??Infinity))continue;scores.set(k,g);parents.set(k,cur);open.push({x,z,key:k,g,f:g+Math.hypot(x-goal.x,z-goal.z)});}
  }
  return null;
}
