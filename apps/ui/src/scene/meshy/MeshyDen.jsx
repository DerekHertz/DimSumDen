import {useEffect,useRef,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {createMeshyWorld} from './world.mjs';
import {createMeshyActors} from './actors.mjs';
import {liveActorsFromSnapshot} from '../../review/live-actors.mjs';
import {agentFor,cardFor,pickedCard} from '../../overlay/proximity-card.mjs';

// Native R3F scene. App remains the sole owner of live state, actions and panels.
export function MeshyDen({snapshot,cells,frontier,tally,selected,onSelect,onOpenTally,stage,onReady,onNearby,picked=null,onPick,zoneView=null,onZoneClick=null,onLoadState,bindings=null}){
 const [den,setDen]=useState(null),[dark,setDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches);
 const live=useRef(null),inputs=useRef({});inputs.current={snapshot,cells,frontier,tally,selected,onSelect,onOpenTally,onNearby,picked,onPick,zoneView,onZoneClick,onLoadState,bindings};
 const {scene,gl}=useThree();
 useEffect(()=>{const theme=matchMedia('(prefers-color-scheme: dark)'),change=()=>setDark(theme.matches);theme.addEventListener('change',change);return()=>theme.removeEventListener('change',change);},[]);
 useEffect(()=>{
  const abort=new AbortController();let mounted=true,world=null;
  inputs.current.onLoadState?.({status:'loading',message:'Opening the forest garden…'});
  createMeshyWorld(gl,{signal:abort.signal,onProgress:message=>inputs.current.onLoadState?.({status:'loading',message})}).then(d=>{
   world=d;if(!mounted){d.dispose();return;}
   const agents=createMeshyActors(d),media=matchMedia('(prefers-reduced-motion: reduce)');
   live.current={den:d,agents,media,anchored:new Set(),proximity:0};setDen(d);stage.tallyAnchor=d.tallyAnchor;onReady(d);
   inputs.current.onLoadState?.({status:'ready',message:'The forest garden is ready.'});
  }).catch(error=>{if(mounted&&error.name!=='AbortError'){console.error('Den scene',error);inputs.current.onLoadState?.({status:'error',message:'The garden models could not load. Reload to retry.'});}});
  return()=>{mounted=false;abort.abort();onReady(null);live.current?.agents.dispose();live.current=null;world?.dispose();stage.anchors.clear();};
 },[gl,stage,onReady]);
 useEffect(()=>{const previous={background:scene.background,fog:scene.fog};const color=dark?'#263e3e':'#dce6d4';scene.background=new THREE.Color(color);scene.fog=new THREE.Fog(color,72,145);return()=>{scene.background=previous.background;scene.fog=previous.fog;};},[scene,dark]);
 useEffect(()=>{if(!den)return;den.setFrontier(frontier||[]);den.setTally(tally?.rods);},[den,frontier,tally]);
 useEffect(()=>{
  const agents=live.current?.agents;if(!agents)return;
  const bind=()=>agents.applyLive(liveActorsFromSnapshot(snapshot,{now:Date.now()}),inputs.current.bindings);bind();const timer=setInterval(bind,1000);return()=>clearInterval(timer);
 },[den,snapshot,bindings]);
 useEffect(()=>{live.current?.agents.setSelected(selected??null);},[den,selected]);
 useFrame((_,delta)=>{
  const l=live.current;if(!l)return;const dt=Math.min(delta,.1);l.agents.update(dt,l.media.matches);l.den.world.updateMatrixWorld(true);
  const figures=l.agents.liveFigures();for(const ref of l.anchored)if(!figures.has(ref)){stage.anchors.delete(ref);l.anchored.delete(ref);}
  for(const [ref,{model}]of figures){stage.anchors.set(ref,model.localToWorld(new THREE.Vector3(0,3.4,0)));l.anchored.add(ref);}
  for(const [ref,basket]of l.den.frontier)stage.anchors.set(ref,basket.localToWorld(new THREE.Vector3(0,.6,0)));
  l.proximity+=dt;if(l.proximity<.1)return;l.proximity=0;
  let card=null;const walking=!!stage.explorer?.active,pick=walking?null:inputs.current.picked;
  if(walking||pick!=null){
   const snap=inputs.current.snapshot,boundRefs=new Set([...l.agents.actors.values()].map(a=>a.live?.ref).filter(Boolean));
   const pandas=[...l.agents.actors].map(([id,a])=>{
    const position=a.panda.model.getWorldPosition(new THREE.Vector3()),agent=agentFor({role:a.role,ref:a.live?.ref},snap?.agents,boundRefs);
    const cell=a.live?(snap?.cells||[]).filter(row=>row.ref===a.live.ref&&(!row.cellType||row.cellType===a.role)).reduce((last,row)=>!last||Date.parse(row.lastEventAt)>Date.parse(last.lastEventAt)?row:last,null):null;
    return {id,name:a.name,role:a.role,station:a.station,position:{x:position.x,z:position.z},ref:a.live?.ref,state:a.live?.state,tool:cell?.tool??null,agent};
   });
   const camera=walking?stage.explorer.camera:null;
   card=camera?cardFor(pandas,snap?.approvals||[],{x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y}):pickedCard(pandas,snap?.approvals||[],pick);
  }
  l.agents.hold(card?.id??null);if(card)delete card.distance;inputs.current.onNearby?.(card);
 });
 const hit=e=>{
  for(let object=e.object;object;object=object.parent){
   const actor=object.userData.actorKey||object.userData.workspaceRole;
   if(actor&&!stage.explorer?.active&&inputs.current.onPick){e.stopPropagation();inputs.current.onPick(actor);return;}
   const local=object.userData.denInteraction;
   if(local){e.stopPropagation();inputs.current.onZoneClick?.(local.id);return;}
   const ref=object.userData.ticketRef;if(ref){e.stopPropagation();inputs.current.onSelect?.(ref);return;}
   if(object.userData.tallyAbacus){e.stopPropagation();stage.tallyHit=true;inputs.current.onOpenTally?.();return;}
  }
 };
 return <>
  <hemisphereLight args={['#fff1d8','#637b60',dark?.8:1.15]}/>
  <directionalLight position={[-18,35,12]} intensity={dark?1.15:2.1} color={dark?'#ffc886':'#ffebc3'} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={100} shadow-normalBias={.06}/>
  <directionalLight position={[12,10,-8]} intensity={.65} color="#d6e9ff"/>
  {den?<primitive object={den.world} dispose={null} onClick={hit}/>:null}
 </>;
}
