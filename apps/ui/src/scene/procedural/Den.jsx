import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from './walking-bao.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { createLiveDenController } from './controller.mjs';

export function Den({cells,frontier,tally,selected,onSelect,onOpenTally,stage,onReady}) {
  const [den,setDen]=useState(null),live=useRef(null);
  const inputs=useRef({});inputs.current={cells,frontier,tally,selected,onSelect,onOpenTally};
  const {scene}=useThree();
  useEffect(()=>{
    const d=createDenScene(THREE,createBao,createWalkingBao,{live:true});
    for(const panda of d.pandas)compactPanda(THREE,panda);
    compactEnvironment(THREE,d);d.setLabels(false);
    const controller=createLiveDenController(d,{
      onCreate:p=>compactPanda(THREE,p),
      onRemove:ref=>stage.anchors.delete(ref),
    });
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const theme=window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme=()=>{
      const color=theme.matches?'#243a2b':'#86a56c';
      scene.background=new THREE.Color(color);scene.fog=new THREE.Fog(color,39,82);
      d.setLanterns(theme.matches);
    };
    const previous={background:scene.background,fog:scene.fog};
    applyTheme();theme.addEventListener('change',applyTheme);
    live.current={den:d,controller,media};setDen(d);onReady(d);
    return ()=>{
      onReady(null);live.current=null;controller.dispose();d.dispose();
      theme.removeEventListener('change',applyTheme);scene.background=previous.background;scene.fog=previous.fog;
      stage.anchors.clear();
    };
  },[scene,stage,onReady]);
  useEffect(()=>{
    const c=live.current?.controller;
    if(c)c.sync(cells,frontier,tally?.rods);
  },[den,cells,frontier,tally]);
  useFrame((_,delta)=>{
    const l=live.current;if(!l)return;
    l.controller.update(Math.min(delta,0.1),{
      reducedMotion:l.media.matches,selected:inputs.current.selected,
      player:stage.explorer?.active?stage.explorer.camera.position:null,
    });
    l.den.world.updateMatrixWorld(true);
    for(const [ref,{panda,cell}] of l.controller.figures){
      const point=panda.model.localToWorld(new THREE.Vector3(0,4.45,0));
      stage.anchors.set(ref,point);
    }
    for(const [ref,basket] of l.den.frontier)stage.anchors.set(ref,basket.localToWorld(new THREE.Vector3(0,0.6,0)));
  });
  const hit=e=>{
    let object=e.object;
    while(object){
      const ref=object.userData.ticketRef;
      if(ref){e.stopPropagation();inputs.current.onSelect(ref);return;}
      if(object.name==='Tally abacus'){e.stopPropagation();stage.tallyHit=true;inputs.current.onOpenTally();return;}
      object=object.parent;
    }
  };
  return <>
    <hemisphereLight args={['#fff7df','#61714b',2.3]} />
    <directionalLight color="#fff0d0" intensity={3} position={[-10,18,9]} castShadow
      shadow-mapSize={[1024,1024]} shadow-camera-left={-16} shadow-camera-right={16}
      shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-near={0.5}
      shadow-camera-far={55} shadow-normalBias={0.04} shadow-bias={-0.00008} />
    <directionalLight color="#dfebff" intensity={0.85} position={[9,9,4]} />
    {den?<primitive object={den.world} dispose={null} onClick={hit} />:null}
  </>;
}
