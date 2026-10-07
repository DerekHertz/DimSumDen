// Pure placement and state mapping for the code-built den.
export const STATIONS = {
  steamers: { index: 0, x: -8.8, z: -7.5, yaw: 0.28, label: 'Steamers' },
  'front-of-house': { index: 1, x: 8.8, z: -7.5, yaw: -0.28, label: 'Front of House' },
  tea: { index: 2, x: -12.5, z: 2.5, yaw: 0.18, label: 'Tea' },
  pantry: { index: 3, x: 12.5, z: 2.5, yaw: -0.18, label: 'Pantry' },
};
export const ROLE_STATION = {
  orchestrator:'pass', product:'pass', architect:'pass',
  developer:'steamers', scout:'steamers', qa:'tea', security:'pantry', designer:'front-of-house',
};
// The Pass roles stand on their own pads on the ground; Bao is the orchestrator, so nothing perches on him.
export const PADS = {
  product: { x: -4, z: -8.5, label: 'Library' },
  architect: { x: 4, z: -8.5, label: 'Drum' },
};
export const TALLY_ANCHOR = { x: 2.62, y: 2.0, z: 6.05 };
export const DEN_TARGET = [0, 2.0, 0];
export const STATION_LABELS = [
  {id:'pass',text:'The Pass',x:0,y:9.25,z:-1.25},
  ...Object.entries(STATIONS).map(([id,s])=>({id,text:s.label,x:s.x,y:3.55,z:s.z})),
  {id:'library',text:'Library',x:PADS.product.x,y:0.3,z:PADS.product.z},
  {id:'drum',text:'Drum',x:PADS.architect.x,y:0.3,z:PADS.architect.z},
];

export function planCells(cells) {
  // Live orchestrator work shows on Bao himself, not as another panda.
  const live=cells.filter(c=>!c.synthetic&&c.cellType!=='orchestrator'), counts={}, slots={};
  for(const c of live){const s=ROLE_STATION[c.cellType]||'cubs';counts[s]=(counts[s]||0)+1;}
  let overflow=0;
  return live.map(c=>{
    const role=c.cellType,station=ROLE_STATION[role]||'cubs';
    const key=station==='pass'?role:station,slot=slots[key]||0;slots[key]=slot+1;
    let placement;
    if(PADS[role]) {
      // Slot 0 takes over the resident's spot; later ones split off to alternating sides.
      const side=slot===0?0:(slot%2?1:-1)*Math.ceil(slot/2);
      placement={parent:'world',position:[PADS[role].x+side*0.7,0.03,PADS[role].z],scale:0.25};
    } else if(STATIONS[station]) {
      const n=counts[station],cols=Math.min(4,n),row=Math.floor(slot/cols),col=slot%cols;
      placement={parent:'stall:'+STATIONS[station].index,position:[(col-(cols-1)/2)*0.77,0.595,0.48-row*0.45],scale:n>4?0.17:0.23};
    } else {
      const i=overflow++;
      placement={parent:'world',position:[4.0+(i%4)*0.7,0,7.2+Math.floor(i/4)*0.8],scale:0.20};
    }
    return { ...c, station, placement };
  });
}

export function poseFor(state,time=0,reduced=false) {
  const t=reduced?0:time;
  const rest={head:0,root:0,arm:0,elbow:0,wrist:0,sleepiness:0.15};
  if(state==='working')return {...rest,head:0.015*Math.sin(t*2),arm:0.05+0.025*Math.sin(t*4),wrist:0.08*Math.sin(t*4)};
  if(state==='waiting_on_user')return {...rest,arm:0.84,elbow:0.60,wrist:0.10*Math.sin(t*3),sleepiness:0};
  if(state==='blocked')return {...rest,head:0.08,arm:0.27,elbow:0.34,sleepiness:0.32};
  if(state==='done')return {...rest,head:-0.05,root:-0.04,sleepiness:0.23};
  if(state==='failed')return {...rest,head:0.17,root:0.04,sleepiness:0.40};
  if(state==='throttled')return {...rest,head:0.13,sleepiness:0.68};
  return rest;
}
