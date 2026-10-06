import { Component, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBao } from './bao.mjs';
import { createWalkingBao } from './walking-bao.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { CHARACTERS, SAMPLE_SCENES, dressCharacter, animateActivity, createRestaurantDetails } from './restaurant.mjs';
import { loadPandaSettings } from './panda-settings.mjs';
import { PandaEditor } from './PandaEditor.jsx';
import './scene-lab.css';

class LabBoundary extends Component {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<p role="alert">The scene could not load. Reload to try again.</p>:this.props.children;}
}
function LabWorld({view,sample,role,settings,playing,onSecret}) {
  const {camera,gl,scene}=useThree(),runtime=useRef(null);
  const [world,setWorld]=useState(null);
  const playback=useRef(playing);playback.current=playing;
  useEffect(()=>{
    const control=new OrbitControls(camera,gl.domElement);control.enableDamping=true;
    control.minDistance=3;control.maxDistance=view==='scene'?50:14;control.maxPolarAngle=Math.PI/2-0.03;
    const previous={background:scene.background,fog:scene.fog};
    scene.background=new THREE.Color(view==='scene'?sample.background:'#d5dfcb');
    let den,panda,details,mixer,root;
    if(view==='scene'){
      camera.position.set(19,15,24);control.target.set(0,2,0);
      den=createDenScene(THREE,createBao,createWalkingBao,{pandaSettings:settings});
      den.setLabels(false);den.setLanterns(sample.id==='lantern');
      dressCharacter(den.hero,'orchestrator');
      for(const [r,p]of den.crew)dressCharacter(p,r);
      for(const r of den.roamers)dressCharacter(r.panda,'scout');
      for(const p of den.pandas)compactPanda(THREE,p);
      compactEnvironment(THREE,den);details=createRestaurantDetails(den,sample.id);root=den.world;
      scene.fog=new THREE.Fog(sample.background,48,95);
    }else{
      camera.position.set(view==='walking'?5:6,view==='walking'?3:4,view==='walking'?7:8);
      control.target.set(0,view==='walking'?1:2.1,0);
      root=new THREE.Group();
      panda=view==='walking'?createWalkingBao(THREE,createBao,settings):createBao(THREE);
      if(view!=='walking')dressCharacter(panda,role);
      root.add(panda.model);
      if(view!=='walking'){
        mixer=new THREE.AnimationMixer(panda.model);
        for(const name of ['Breathe','Blink'])mixer.clipAction(panda.animations.find(a=>a.name===name)).play();
      }
      const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(view==='walking'?2.8:2.4,view==='walking'?2.9:2.5,0.18,64),new THREE.MeshStandardMaterial({color:'#b8c6a9',roughness:1}));
      pedestal.position.y=-0.12;pedestal.receiveShadow=true;root.add(pedestal);
      scene.fog=null;
    }
    control.update();setWorld(root);
    runtime.current={den,panda,details,mixer,control,time:0,media:window.matchMedia('(prefers-reduced-motion: reduce)')};
    return ()=>{
      runtime.current=null;control.dispose();details?.dispose();
      if(den)den.dispose();else{
        mixer?.stopAllAction();mixer?.uncacheRoot(panda.model);
        const geometry=new Set(),materials=new Set(),textures=new Set();
        root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}});
        for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();panda.skeleton.dispose();
        panda.mixer?.stopAllAction();panda.mixer?.uncacheRoot(panda.model);
      }
      scene.background=previous.background;scene.fog=previous.fog;
    };
  },[view,sample,role,settings,camera,gl,scene]);
  useFrame((_,dt)=>{
    const r=runtime.current;if(!r)return;r.control.update();
    const reduced=r.media.matches||!playback.current,delta=reduced?0:Math.min(dt,0.05);
    r.time+=delta;
    if(r.den){
      r.den.setRoaming(!reduced);r.den.update(delta,r.time);r.details.update(r.time,reduced);
      for(const [role,p]of r.den.crew)animateActivity(p,role,r.time,reduced);
    }else if(view==='walking')r.panda.update(delta,r.time,r.time*settings.speed/0.95,reduced?0:1);
    else{r.mixer.update(delta);animateActivity(r.panda,role,r.time,reduced);}
  });
  const click=e=>{for(let o=e.object;o;o=o.parent)if(o.userData.easterEgg){e.stopPropagation();onSecret(o.userData.easterEgg);return;}};
  return <>
    <hemisphereLight args={['#fff5db','#627858',view==='scene'&&sample.id==='lantern'?1.1:2.2]}/>
    <directionalLight position={[-10,18,12]} intensity={view==='scene'&&sample.id==='lantern'?1.4:3} color={sample.light} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={0.05}/>
    <directionalLight position={[10,8,-5]} intensity={1.1} color="#d6e9ff"/>
    {world?<primitive object={world} dispose={null} onClick={click}/>:null}
  </>;
}

export function SceneLab() {
  const [view,setView]=useState('scene'),[sample,setSample]=useState(SAMPLE_SCENES[0]);
  const [role,setRole]=useState('orchestrator'),[settings,setSettings]=useState(loadPandaSettings);
  const [playing,setPlaying]=useState(true),[secret,setSecret]=useState(null),[found,setFound]=useState([]);
  const character=CHARACTERS.find(c=>c[0]===role);
  const discover=s=>{setSecret(s);setFound(old=>old.includes(s.id)?old:[...old,s.id]);};
  return <div className="scene-lab">
    <header className="lab-header"><a className="lab-brand" href="?lab=1"><span>点心</span><div>Dim Sum Den<small>THE SCENE LAB</small></div></a><a className="lab-back" href="./">Return to live den ↗</a></header>
    <div className="lab-layout">
      <aside className="lab-sidebar">
        <p className="lab-eyebrow">A LITTLE MORE LIFE</p><h1>A den with<br/>a full house.</h1><p className="lab-intro">Warm baskets. Busy paws. A place for every panda at the table.</p>
        <div className="lab-tabs" role="tablist" aria-label="Scene lab views">{[['scene','The den'],['characters','Characters'],['walking','Panda studio']].map(([id,title])=><button type="button" role="tab" aria-selected={view===id} aria-controls="lab-panel" key={id} onClick={()=>{setView(id);setSecret(null);}}>{title}</button>)}</div>
        <section id="lab-panel" role="tabpanel" aria-label={view==='scene'?'Scene samples':view==='characters'?'Character models':'Walking panda editor'}>
          {view==='scene'?<><p className="lab-eyebrow">THREE SCENE SAMPLES</p><div className="lab-samples">{SAMPLE_SCENES.map((s,i)=><button type="button" key={s.id} className={s.id===sample.id?'selected':''} aria-pressed={s.id===sample.id} onClick={()=>setSample(s)}><span className={`sample-dot ${s.id}`}>{String(i+1).padStart(2,'0')}</span><span><strong>{s.title}</strong><small>{s.description}</small></span></button>)}</div><div className="lab-house-note"><span>ON THE HOUSE</span><h3>A few little secrets</h3><p>Look for the trolley, the tea table, the lucky bao and the specials board. Click them to discover a little restaurant lore.</p><small>{found.length} / 4 discovered this visit</small><details><summary>Show me where to look</summary><div className="secret-shortcuts">{[['cart','One more basket','The trolley waits beside Steamers.'],['tea','Thank you, two taps','The tea table is near the front-left of the clearing.'],['bun','The hidden lucky bao','Find a smiling bao beside the Pantry.'],['menu','Chef’s secret menu','The specials board stands behind Front of House.']].map(([id,title,text])=><button type="button" key={id} onClick={()=>discover({id,title,text})}>{title}</button>)}</div></details></div></>:null}
          {view==='characters'?<><p className="lab-eyebrow">THE WHOLE CREW · {CHARACTERS.length} MODELS</p><div className="character-list">{CHARACTERS.map(([id,name,station,,,planned])=><button type="button" key={id} aria-pressed={role===id} className={role===id?'selected':''} onClick={()=>setRole(id)}><strong>{name}</strong><small>{station}{planned?' · concept':''}</small></button>)}</div></>:null}
          {view==='walking'?<><p className="lab-eyebrow">FOUR PAWS, A SOFTER STEP</p><h3>Walking panda studio</h3><PandaEditor settings={settings} onApply={setSettings}/><p className="lab-editor-note">The same settings are used in the live den on this device. Apply, then return to see them walking around.</p></>:null}
        </section>
      </aside>
      <main className="lab-stage" aria-label="Interactive Three.js preview">
        <div className="lab-stage-title"><span className="lab-eyebrow">{view==='scene'?'SCENE STUDY':view==='characters'?'CHARACTER STUDY':'MOVEMENT STUDY'}</span><h2>{view==='scene'?sample.title:view==='characters'?character[1]:'The wandering panda'}</h2><p>{view==='characters'?character[3]:view==='walking'?'Fuller limbs, planted paws and a gentler four-beat walk.':'A sample scene · independent of your live board'}</p></div>
        <LabBoundary><Canvas shadows dpr={[1,1.5]} camera={{fov:42,near:0.1,far:150}} gl={{antialias:true}}><LabWorld view={view} sample={sample} role={role} settings={settings} playing={playing} onSecret={discover}/></Canvas></LabBoundary>
        <div className="lab-scene-footer"><span>Drag to orbit · scroll to zoom</span><button type="button" aria-pressed={!playing} onClick={()=>setPlaying(!playing)}>{playing?'Pause activity':'Resume activity'}</button></div>
        {view==='characters'?<div className="lab-character-caption"><span>{character[2]} · {role}</span><strong>{character[4]}</strong>{character[5]?<small>Planned character · visual concept</small>:null}</div>:null}
        {view==='scene'?<div className="lab-service-caption"><span className="service-dot"/> {playing?'Service in motion':'Service paused'}<small>Tea tasting · order stamping · menu planning</small></div>:null}
        {secret?<aside className="restaurant-note" aria-label="Restaurant discovery"><button type="button" aria-label="Close discovery" onClick={()=>setSecret(null)}>×</button><span>HOUSE SECRET · {found.length}/4</span><h2>{secret.title}</h2><p>{secret.text}</p></aside>:null}
      </main>
    </div>
  </div>;
}
