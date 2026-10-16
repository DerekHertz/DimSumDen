import { LIVE_ROLES } from '../../review/live-actors.mjs';
export const canonicalRole = id => ({release:'release-manager',keeper:'knowledge-keeper',writer:'docs-writer',cub:'stem-cub'}[id] || id);
export const RESIDENT_HEIGHT = 2.04;
export const PLAYER_EYE_HEIGHT = 1.82;
export const WALK_START = Object.freeze({x:0,z:26.4,yaw:0,pitch:.04,eyeHeight:PLAYER_EYE_HEIGHT});
export const NAVIGATION_TARGETS = Object.freeze({pass:[0,2,0],center:[0,2,0],steamers:[-9.5,1,-8.7],'front-of-house':[9.5,1,-8.7],front:[9.5,1,-8.7],tea:[-12.4,1,.3],pantry:[12.4,1,.3],library:[0,1,-17.6],gate:[0,1,24],training:[21,1,10],festival:[20,1,-12.2],dining:[-8.5,1,17],pavilion:[-20,1,10.2],games:[-20,1,-10.7]});
export function actorBindings(live=[],previous=new Map()) {
  const next=new Map();
  for(const role of LIVE_ROLES){
    const rows=live.filter(a=>a.role===role),old=previous.get(role);
    const primary=rows.find(a=>a.ref===old?.ref)||rows[0];
    if(!primary)continue;
    next.set(role,primary);
    for(const row of rows)if(row!==primary)next.set(`${role}#${row.ref}`,row);
  }
  return next;
}
export function meshMotion(time,index=0,reduced=false){
  if(reduced)return {lift:0,roll:0,turn:0};
  const phase=time*.85+index*.63;
  return {lift:.007*(1+Math.sin(phase)),roll:.008*Math.sin(phase*.7),turn:.024*Math.sin(phase*.35)};
}

export const MESHY_STATION_LABELS = Object.freeze([
 {id:'pass',text:'The Pass',x:0,y:4.8,z:0},
 {id:'steamers',text:'Steamers',x:-9.5,y:5.6,z:-8.7},
 {id:'front-of-house',text:'Front of House',x:9.5,y:5.6,z:-8.7},
 {id:'tea',text:'Tea',x:-12.4,y:5.6,z:.3},
 {id:'pantry',text:'Pantry',x:12.4,y:5.6,z:.3},
 {id:'library',text:'Library',x:0,y:6.1,z:-17.6},
]);
