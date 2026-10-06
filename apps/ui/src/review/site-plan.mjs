// Shared review geography: visible structures, clearance and panda destinations agree.
export const REVIEW_STATIONS=[
  {x:-8.8,z:-7.5,yaw:0.28},
  {x:8.8,z:-7.5,yaw:-0.28},
  {x:-12.5,z:2.5,yaw:0.18},
  {x:12.5,z:2.5,yaw:-0.18},
];
export const LANTERN_POSTS=[[-9,0,-5],[9,0,-5]];
export const CONSTRUCTION_PADS=[
  {id:'west',name:'West construction pad',position:[-7.5,0,-14.5],radius:2.4,number:'01'},
  {id:'north',name:'North construction pad',position:[0,0,-17.5],radius:2.4,number:'02'},
  {id:'east',name:'East construction pad',position:[7.5,0,-14.5],radius:2.4,number:'03'},
];
export const ZONE_POSITIONS={tea:[-17,0,6.5],games:[-16,0,-8],training:[17,0,6.5],festival:[15,0,-10],dining:[-8.5,0,13],dragon:[8,0,14]};
export const ROLE_HOMES={orchestrator:[0,-1.25],product:[-4,-8.5],architect:[4,-8.5],developer:[-10,-4.5],scout:[-7.5,-4.5],debugger:[-12.5,-6.5],qa:[-12.5,5.5],security:[12.5,5.5],designer:[7.5,-4.5],herald:[10,-4.5],'release-manager':[14,-5.5],'knowledge-keeper':[-3,-12],'docs-writer':[12.5,-6.5],'stem-cub':[0,8]};
const offsets={tea:[[1,1.8],[-1,1.8],[1,-1.8],[-1,-1.8]],games:[[0,2.5],[-2,1],[2,1],[0,-2.5]],training:[[-1,1.8],[1.5,1.8],[-1.5,-0.3],[1.5,-1.5]],festival:[[-2,3.8],[0,3.8],[2,3.8],[-3.8,1]],dining:[[0,2.5],[-2.5,0],[0,-2.5],[2.5,0]]};
const names={tea:'Tea break',games:'Playing mahjong',training:'Staff practice',festival:'Enjoying the festival',dining:'Sharing dim sum'};
export const REVIEW_PLACES=Object.fromEntries(Object.entries(offsets).map(([id,spots])=>{
  const [x,,z]=ZONE_POSITIONS[id];return [id,{name:names[id],center:[x,z],spots:spots.map(([dx,dz])=>[x+dx,z+dz])}];
}));
export const REVIEW_CLEARINGS=[
  ...Object.entries(ZONE_POSITIONS).map(([id,[x,,z]])=>({x,z,radius:{tea:3.4,games:3.8,training:3.8,festival:5.9,dining:3.8,dragon:5.9}[id]})),
  {x:-19,z:10.4,radius:2.5},
  ...CONSTRUCTION_PADS.map(p=>({x:p.position[0],z:p.position[2],radius:3.2})),
];
export const isReviewPlantingClear=(x,z,margin=0)=>REVIEW_CLEARINGS.every(c=>Math.hypot(x-c.x,z-c.z)>=c.radius+margin);
export const REVIEW_OBSTACLES=[
  ...LANTERN_POSTS.map(([x,,z])=>({type:'circle',x,z,radius:0.32})),
  {type:'circle',x:ZONE_POSITIONS.dining[0],z:ZONE_POSITIONS.dining[2],radius:1.5},
  {type:'box',x:ZONE_POSITIONS.games[0],z:ZONE_POSITIONS.games[2],halfX:0.95,halfZ:0.95},
  {type:'circle',x:ZONE_POSITIONS.festival[0],z:ZONE_POSITIONS.festival[2],radius:3.25},
  {type:'circle',x:ZONE_POSITIONS.tea[0],z:ZONE_POSITIONS.tea[2],radius:0.75},
  {type:'circle',x:-19,z:10.4,radius:1.8},
  {type:'box',x:ZONE_POSITIONS.dragon[0],z:ZONE_POSITIONS.dragon[2],halfX:5,halfZ:1.2},
  {type:'circle',x:ZONE_POSITIONS.training[0]+1.3,z:ZONE_POSITIONS.training[2]+0.9,radius:0.35},
  ...CONSTRUCTION_PADS.map(p=>({type:'circle',x:p.position[0],z:p.position[2],radius:p.radius+0.12})),
];
