// Pure placement and state mapping for the code-built den.
export const STATIONS = {
  steamers: { index: 0, x: -5.2, z: 0.6, yaw: 0.18, label: 'Steamers' },
  'front-of-house': { index: 1, x: 5.2, z: 0.6, yaw: -0.18, label: 'Front of House' },
  tea: { index: 2, x: -7.15, z: 5.3, yaw: 0.12, label: 'Tea' },
  pantry: { index: 3, x: 7.15, z: 5.3, yaw: -0.12, label: 'Pantry' },
};
export const ROLE_STATION = {
  orchestrator:'pass', product:'pass', architect:'pass',
  developer:'steamers', scout:'steamers', qa:'tea', security:'pantry', designer:'front-of-house',
};
export const TALLY_ANCHOR = { x: 2.62, y: 2.0, z: 6.05 };
export const DEN_TARGET = [0, 2.0, 0];
export const STATION_LABELS = [
  {id:'pass',text:'The Pass',x:0,y:9.25,z:-1.25},
  ...Object.entries(STATIONS).map(([id,s])=>({id,text:s.label,x:s.x,y:3.55,z:s.z})),
  {id:'library',text:'Library · coming online',x:-5.1,y:0.3,z:-6.8},
  {id:'drum',text:'Drum · coming online',x:5.1,y:0.3,z:-6.8},
];

export function planCells(cells) {
  const live=cells.filter(c=>!c.synthetic), counts={}, slots={};
  for(const c of live){const s=ROLE_STATION[c.cellType]||'cubs';counts[s]=(counts[s]||0)+1;}
  let overflow=0;
  return live.map(c=>{
    const role=c.cellType,station=ROLE_STATION[role]||'cubs';
    const key=station==='pass'?role:station,slot=slots[key]||0;slots[key]=slot+1;
    let placement;
    if(station==='pass' && ((role==='orchestrator'&&slot<3)||(role!=='orchestrator'&&slot===0))){
      placement=role==='orchestrator'
        ? {parent:'crown',position:[slot===0?0:slot===1?-0.68:0.68,0.06,0],scale:0.18}
        : {parent:role==='product'?'left-shoulder':'right-shoulder',position:[role==='product'?0.5:-0.5,0.23,0.28],scale:0.145};
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
