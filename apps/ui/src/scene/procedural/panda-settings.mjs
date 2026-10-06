export const PANDA_CONTROLS = [
  ['bodyWidth','Body fullness',0.85,1.15,0.01],
  ['headScale','Head size',0.86,1.12,0.01],
  ['legWidth','Leg fullness',0.9,1.35,0.01],
  ['stride','Stride length',0.35,0.8,0.01],
  ['lift','Paw lift',0.06,0.2,0.01],
  ['speed','Walking speed',0.5,1.4,0.05],
];
export const DEFAULT_PANDA_SETTINGS = Object.freeze({bodyWidth:1.04,headScale:0.94,legWidth:1.2,stride:0.52,lift:0.1,speed:0.85});
export function pandaSettings(value={}) {
  return Object.fromEntries(PANDA_CONTROLS.map(([key,,min,max])=>[key,Number.isFinite(value?.[key])?Math.max(min,Math.min(max,value[key])):DEFAULT_PANDA_SETTINGS[key]]));
}
export function loadPandaSettings() {
  try{return pandaSettings(JSON.parse(localStorage.getItem('dimsum-pandas')||'{}'));}catch{return {...DEFAULT_PANDA_SETTINGS};}
}
export function savePandaSettings(settings) {
  try{localStorage.setItem('dimsum-pandas',JSON.stringify(pandaSettings(settings)));return true;}catch{return false;}
}
