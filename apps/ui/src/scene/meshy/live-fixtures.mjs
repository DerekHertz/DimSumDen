import * as THREE from 'three';
import {cyl,box,orb} from './garden.mjs';
export function addLiveFixtures(den,m){
 const tally=new THREE.Group();tally.name='Live kitchen tally';tally.position.set(4,.26,13);tally.userData.tallyAbacus=true;den.world.add(tally);
 box(tally,[2.4,.12,.7],m.darkwood,[0,.15,0]);for(const x of [-1.05,1.05])box(tally,[.12,2.2,.12],m.wood,[x,1.15,0]);
 box(tally,[2.25,.14,.16],m.wood,[0,2.25,0]);const rows=[];
 for(let row=0;row<6;row++){
  const y=.55+row*.27,rod=cyl(tally,.018,2,m.gold,[0,y,0],8);rod.rotation.z=Math.PI/2;
  rows.push(Array.from({length:10},(_,j)=>{const bead=orb(tally,.07,m.gold.clone(),[-.77+j*.17,y,0],[.7,1,1]);return bead;}));
 }
 den.tallyAnchor={x:4,y:3.36,z:13};
 den.setTally=rods=>{for(let row=0;row<rows.length;row++)for(let j=0;j<10;j++){const rod=rods?.[row],count=Math.max(0,Math.min(10,rod?.counted||0)),on=j>=10-count;rows[row][j].material.color.set(on?'#177d80':'#d3bc86');}};
 den.setFrontier=refs=>{
  const wanted=new Set(refs.slice(0,8));
  for(const [ref,g]of den.frontier)if(!wanted.has(ref)){g.removeFromParent();den.frontier.delete(ref);}
  [...wanted].forEach((ref,index)=>{let basket=den.frontier.get(ref);if(!basket){basket=new THREE.Group();basket.userData.ticketRef=ref;basket.name=ref+' · ready basket';cyl(basket,.25,.22,m.bamboo,[0,.16,0],20);cyl(basket,.27,.04,m.darkwood,[0,.29,0],20);den.frontier.set(ref,basket);den.world.add(basket);}basket.position.set(-3.4+index%4*.72,.26,11.9+Math.floor(index/4)*.7);});
 };
}
