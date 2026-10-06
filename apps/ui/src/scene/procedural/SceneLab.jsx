import {Component,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createBao} from './bao.mjs';
import {createWalkingBao} from '../../review/walking-panda.mjs';
import {createDenScene} from './den-scene.mjs';
import {compactPanda,compactEnvironment} from './compact.mjs';
import {CHARACTERS,SAMPLE_SCENES,animateActivity,createRestaurantDetails} from './restaurant.mjs';
import {loadPandaSettings} from './panda-settings.mjs';
import {PandaEditor} from './PandaEditor.jsx';
import {createTraditionalGear,DIRECTIONS,TRADITIONAL_PROPS,FIT_CONTROLS,DEFAULT_FIT} from '../../review/traditional-props.mjs';
import {createLeisure,LEISURE_ZONES} from '../../review/leisure.mjs';
import {loadReview,saveReview,normalizeReview,download,reviewHtml} from '../../review/review-data.mjs';
import {prepareReviewLayout} from '../../review/layout.mjs';
import {createReviewAgents} from '../../review/agents.mjs';
import {createReviewLandscape,REVIEW_SKIES} from '../../review/landscape.mjs';
import './scene-lab.css';
import '../../review/review.css';

class LabBoundary extends Component{
  state={error:false};static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<p role="alert">The 3D review could not load. Reload to try again.</p>:this.props.children;}
}
function disposeModel(panda){
  panda.mixer?.stopAllAction();panda.mixer?.uncacheRoot(panda.model);
  const geometry=new Set(),materials=new Set(),textures=new Set();
  panda.model.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}});
  for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();panda.skeleton.dispose();
}
function clearSampleProps(panda){
  const old=[];panda.model.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)old.push(o);});
  for(const object of old){object.removeFromParent();object.geometry.dispose();}
  if(panda.materials.scarf){panda.materials.scarf.dispose();delete panda.materials.scarf;}
}
function LabWorld({view,sample,role,direction,settings,fit,playing,annotating,notes,stage,onPin,onDetail,onZone,onAgent,onActors}){
  const {camera,gl,scene,invalidate}=useThree(),runtime=useRef(null);
  const [world,setWorld]=useState(null),inputs=useRef(null);
  inputs.current={settings,fit,playing,annotating,notes};
  const shapeKey=`${settings.bodyWidth}:${settings.headScale}:${settings.legWidth}`;
  useEffect(()=>{
    const controls=new OrbitControls(camera,gl.domElement);controls.enableDamping=true;
    const onCameraChange=()=>invalidate();controls.addEventListener('change',onCameraChange);
    controls.minDistance=3;controls.maxDistance=view==='scene'?70:14;controls.maxPolarAngle=Math.PI/2-0.03;
    camera.position.set(...(view==='scene'?[30,26,40]:view==='walking'?[5,3,7]:[6,4,8]));
    controls.target.set(0,view==='walking'?1:2.1,view==='scene'?1:0);controls.update();
    stage.current={...stage.current,camera,gl,scene,controls,restoreCamera(value){if(value){camera.position.fromArray(value.position);controls.target.fromArray(value.target);controls.update();}}};
    return ()=>{controls.removeEventListener('change',onCameraChange);controls.dispose();};
  },[view,role,direction,sample,camera,gl,scene,stage,invalidate]);
  useEffect(()=>{
    const previous={background:scene.background,fog:scene.fog};
    scene.background=new THREE.Color(view==='scene'?REVIEW_SKIES[sample.id]:'#d5dfcb');
    const root=new THREE.Group(),gears=[];
    let den,panda,mixer,details,leisure,pedestal,agents,landscape;
    if(view==='scene'){
      den=createDenScene(THREE,createBao,(T,B)=>createWalkingBao(T,B,inputs.current.settings));
      den.setLabels(false);den.setLanterns(sample.id==='lantern');
      for(const p of den.pandas)clearSampleProps(p);
      for(const p of den.pandas)compactPanda(THREE,p);
      prepareReviewLayout(den);
      compactEnvironment(THREE,den);details=createRestaurantDetails(den,sample.id);
      leisure=createLeisure(den,createBao);landscape=createReviewLandscape(den,sample.id);
      for(const resident of leisure.residents)if(!leisure.dragon.performers.includes(resident))resident.model.visible=false;
      agents=createReviewAgents(den,createBao,{direction,onChange:onActors});root.add(den.world);
      scene.fog=new THREE.Fog(REVIEW_SKIES[sample.id],70,115);
    }else{
      panda=view==='walking'?createWalkingBao(THREE,createBao,inputs.current.settings):createBao(THREE);
      if(view==='characters')gears.push(createTraditionalGear(panda,role,direction));
      root.add(panda.model);
      if(view==='characters'){
        mixer=new THREE.AnimationMixer(panda.model);
        for(const name of ['Breathe','Blink'])mixer.clipAction(panda.animations.find(a=>a.name===name)).play();
      }
      pedestal=new THREE.Mesh(new THREE.CylinderGeometry(view==='walking'?2.8:2.4,view==='walking'?2.9:2.5,0.18,64),new THREE.MeshStandardMaterial({color:'#b8c6a9',roughness:1}));
      pedestal.position.y=-0.12;pedestal.receiveShadow=true;root.add(pedestal);scene.fog=null;
    }
    setWorld(root);runtime.current={view,role,root,den,panda,mixer,details,leisure,agents,gears,media:window.matchMedia('(prefers-reduced-motion: reduce)')};
    stage.current.root=root;stage.current.leisure=leisure;stage.current.agents=agents;stage.current.followId=null;
    return ()=>{
      runtime.current=null;
      stage.current.agents=null;agents?.dispose();for(const g of gears)g.dispose();details?.dispose();leisure?.dispose();landscape?.dispose();
      if(den)den.dispose();else{mixer?.stopAllAction();mixer?.uncacheRoot(panda.model);disposeModel(panda);pedestal.geometry.dispose();pedestal.material.dispose();}
      scene.background=previous.background;scene.fog=previous.fog;
    };
  },[view,sample,role,direction,view==='walking'?shapeKey:null,scene,stage,onActors]);
  useEffect(()=>{runtime.current?.gears[0]?.applyFit(fit);},[fit,world]);
  useEffect(()=>invalidate(),[settings,fit,notes,annotating,playing,world,invalidate]);
  useFrame((_,dt)=>{
    const r=runtime.current,s=stage.current;if(!r||!s.controls)return;
    s.controls.enabled=!inputs.current.annotating;s.controls.update();
    const reduced=!inputs.current.playing,delta=reduced?0:Math.min(dt,0.05);s.time=(s.time||0)+delta;
    if(r.den){r.den.update(delta,s.time);r.details.update(s.time,reduced);r.leisure.update(s.time,reduced);r.agents.update(reduced?0:Math.min(dt,2),reduced);}
    else if(r.view==='walking'){r.panda.setGait(inputs.current.settings);r.panda.update(delta,s.time,s.time*inputs.current.settings.speed/0.95,reduced?0:1);}
    else{r.mixer.update(delta);animateActivity(r.panda,r.role,s.time,reduced);}
    const followed=r.agents?.actors.get(s.followId);
    if(followed){const target=followed.panda.model.position.clone();target.y=followed.stationary?3.2:0.9;const shift=target.sub(s.controls.target).multiplyScalar(1-Math.exp(-5*Math.min(dt,0.5)));camera.position.add(shift);s.controls.target.add(shift);s.controls.update();}
    camera.updateMatrixWorld();
    if(r.agents)for(const [id,actor]of r.agents.actors){
      const tag=s.actorTags?.get(id);if(!tag)continue;const point=actor.panda.model.position.clone();point.y+=actor.panda.model.scale.x*4.1+0.3;point.project(camera);
      tag.style.display=point.z>1||point.z<-1||Math.abs(point.x)>1.1||Math.abs(point.y)>1.1?'none':'block';tag.style.left=`${(point.x+1)*50}%`;tag.style.top=`${(1-point.y)*50}%`;
    }
    for(const note of inputs.current.notes){const pin=s.pins?.get(note.id);if(!pin)continue;const point=new THREE.Vector3(...note.point).project(camera);pin.style.display=point.z>1||point.z<-1?'none':'block';pin.style.left=`${(point.x+1)*50}%`;pin.style.top=`${(1-point.y)*50}%`;}
  });
  const click=e=>{
    if(inputs.current.annotating){e.stopPropagation();let part=e.object.name||'Model';for(let o=e.object;o;o=o.parent)if(o.userData.reviewPart){part=o.userData.reviewPart;break;}onPin({point:e.point.toArray(),part,camera:{position:camera.position.toArray(),target:stage.current.controls.target.toArray()}});return;}
    for(let o=e.object;o;o=o.parent){if(o.userData.reviewAgent){e.stopPropagation();onAgent(o.userData.reviewAgent);return;}if(o.userData.zone){e.stopPropagation();onZone(o.userData.zone);return;}if(o.userData.easterEgg){e.stopPropagation();onDetail(o.userData.easterEgg);return;}}
  };
  return <><hemisphereLight args={['#fff5db','#627858',view==='scene'&&sample.id==='lantern'?1.1:2.2]}/><directionalLight position={[-10,18,12]} intensity={view==='scene'&&sample.id==='lantern'?1.4:3} color={sample.light} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={0.05}/><directionalLight position={[10,8,-5]} intensity={1.1} color="#d6e9ff"/>{world?<primitive object={world} dispose={null} onClick={click}/>:null}</>;
}

export function SceneLab(){
  const [initial]=useState(loadReview);
  const [view,setView]=useState(initial?.view||'scene'),[sample,setSample]=useState(SAMPLE_SCENES.find(s=>s.id===initial?.sample)||SAMPLE_SCENES[0]);
  const [role,setRole]=useState(CHARACTERS.some(c=>c[0]===initial?.role)?initial.role:'orchestrator'),[direction,setDirection]=useState(initial?.direction||'traveler');
  const [settings,setSettings]=useState(initial?.settings||loadPandaSettings),[placements,setPlacements]=useState(initial?.placements||{});
  const [notes,setNotes]=useState(initial?.notes||[]),[playing,setPlaying]=useState(!initial?.view||initial.view==='scene'),[detail,setDetail]=useState(null);
  const [crew,setCrew]=useState({actors:[],events:[]}),[selectedAgent,setSelectedAgent]=useState(null),[following,setFollowing]=useState(false),[taskText,setTaskText]=useState('');
  const [annotating,setAnnotating]=useState(false),[draft,setDraft]=useState(null),[label,setLabel]=useState(''),[comment,setComment]=useState('');
  const [status,setStatus]=useState(''),[selectedNote,setSelectedNote]=useState(null),[zones,setZones]=useState({}),[focusedZone,setFocusedZone]=useState(null);
  const stage=useRef({pins:new Map(),actorTags:new Map(),time:0}),pendingCamera=useRef(null),importRef=useRef(null);
  const character=CHARACTERS.find(c=>c[0]===role)||CHARACTERS[0];
  const fitKey=`${role}:${direction}`,fit=placements[fitKey]||DEFAULT_FIT;
  const filteredNotes=notes.filter(n=>n.view===view&&(view==='characters'?n.role===role&&n.direction===direction:view==='scene'?n.sample===sample.id:true));
  const review=useMemo(()=>({format:'dim-sum-den-review',version:2,view,role,sample:sample.id,direction,settings,placements,notes}),[view,role,sample,direction,settings,placements,notes]);
  useEffect(()=>{saveReview(review);},[review]);
  useEffect(()=>{setZones({});setFocusedZone(null);setDetail(null);setSelectedAgent(null);setFollowing(false);},[view,sample,direction]);
  const changeView=value=>{setView(value);setAnnotating(false);setDraft(null);setDetail(null);setSelectedNote(null);};
  const pin=point=>{setDraft(point);setLabel(point.part);setComment('');setStatus('Add a label and comment in the review panel.');};
  const saveNote=()=>{if(!draft||!comment.trim())return;const note={...draft,id:globalThis.crypto?.randomUUID?.()||String(Date.now()),label:label.trim()||draft.part,text:comment.trim(),view,role,sample:sample.id,direction,settings:{...settings},fit:{...fit}};setNotes(old=>[...old,note]);setDraft(null);setAnnotating(false);setStatus('Comment saved locally. Export it to share in chat.');};
  const revisit=note=>{
    setSelectedNote(note.id);setFocusedZone(null);setView(note.view);setRole(CHARACTERS.some(c=>c[0]===note.role)?note.role:'orchestrator');setDirection(note.direction);setSample(SAMPLE_SCENES.find(s=>s.id===note.sample)||SAMPLE_SCENES[0]);setSettings(note.settings);setPlacements(old=>({...old,[`${note.role}:${note.direction}`]:note.fit}));setPlaying(false);setAnnotating(false);setDraft(null);pendingCamera.current=note.camera;
    setTimeout(()=>{stage.current.restoreCamera?.(pendingCamera.current);pendingCamera.current=null;},150);
  };
  const importReview=async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>2_000_000)throw new Error('Choose a review smaller than 2 MB.');const data=normalizeReview(JSON.parse(await file.text()));setNotes(data.notes);setPlacements(data.placements);setSettings(data.settings);setView(data.view);setRole(CHARACTERS.some(c=>c[0]===data.role)?data.role:'orchestrator');setDirection(data.direction);setSample(SAMPLE_SCENES.find(s=>s.id===data.sample)||SAMPLE_SCENES[0]);setStatus('Review imported.');}catch(error){setStatus(error.message);}event.target.value='';};
  const stopFollowing=()=>{stage.current.followId=null;setFollowing(false);};
  const focusZone=id=>{const zone=LEISURE_ZONES.find(z=>z.id===id);if(!zone)return;stopFollowing();const [x,,z]=zone.position,offset=id==='dragon'?[7,8,15]:id==='dining'?[5,6,7]:id==='festival'?[8,9,12]:[6,5,8];stage.current.restoreCamera?.({position:[x+offset[0],offset[1],z+offset[2]],target:[x+(id==='dragon'?0.5:0),1.4,z]});setFocusedZone(zone);setDetail(null);};
  const overview=()=>{stopFollowing();stage.current.restoreCamera?.({position:[30,26,40],target:[0,2.1,1]});setFocusedZone(null);setDetail(null);};
  const selectAgent=id=>{setSelectedAgent(id);setDetail(null);setFocusedZone(null);stopFollowing();const actor=stage.current.agents?.actors.get(id);if(!actor)return;const p=actor.panda.model.position;stage.current.restoreCamera?.(actor.stationary?{position:[p.x+12,10,p.z+18],target:[p.x,3.2,p.z]}:{position:[p.x+5,4.5,p.z+7],target:[p.x,0.9,p.z]});};
  const agentAction=(name,...args)=>{stage.current.agents?.[name]?.(...args);setCrew(stage.current.agents?.snapshot()||{actors:[],events:[]});setPlaying(true);};
  const followAgent=()=>{if(following){stopFollowing();return;}stage.current.followId=selectedAgent;setFollowing(true);setPlaying(true);};
  const currentAgent=crew.actors.find(a=>a.role===selectedAgent),busy=currentAgent&&(['received','working','needs-you','complete'].includes(currentAgent.state)||currentAgent.state==='walking'&&currentAgent.task);
  const activate=id=>{stage.current.leisure?.activate(id);setZones({...stage.current.leisure?.active});setPlaying(true);const zone=LEISURE_ZONES.find(z=>z.id===id);if(zone)setDetail({title:zone.name,text:zone.hint});};
  const exportScreenshot=()=>{
    const s=stage.current;if(!s.gl||!s.camera)return;s.gl.render(s.scene,s.camera);const original=s.gl.domElement;
    const width=1280,height=Math.round(original.height/original.width*width),footer=100+filteredNotes.length*70;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height+footer;const c=canvas.getContext('2d');
    c.fillStyle='#f7f3e7';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(original,0,0,width,height);c.fillStyle='#fcf8e8';c.fillRect(0,0,width,55);c.fillStyle='#334d3c';c.font='23px Georgia';c.fillText(`Dim Sum Den · ${view==='characters'?character[1]:view==='walking'?'Walking panda':sample.title} · Local review`,24,35);
    for(const [i,note]of filteredNotes.entries()){const point=new THREE.Vector3(...note.point).project(s.camera),x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(point.z>=-1&&point.z<=1){c.fillStyle='#ad583f';c.beginPath();c.arc(x,y,15,0,Math.PI*2);c.fill();c.fillStyle='white';c.font='bold 14px system-ui';c.textAlign='center';c.fillText(String(i+1),x,y+5);c.textAlign='left';}}
    c.fillStyle='#334d3c';c.font='13px system-ui';c.fillText(`Direction: ${direction} · Body ${settings.bodyWidth.toFixed(2)} · Head ${settings.headScale.toFixed(2)} · Leg ${settings.legWidth.toFixed(2)} · Stride ${settings.stride.toFixed(2)} · Paw lift ${settings.lift.toFixed(2)} · Speed ${settings.speed.toFixed(2)}`,24,height+30);c.fillText('Exact settings, camera positions and full comments are included in the companion review JSON.',24,height+54);
    for(const [i,note]of filteredNotes.entries()){c.font='bold 14px system-ui';c.fillText(`${i+1}. ${note.label}`,24,height+92+i*70);c.font='13px system-ui';const text=note.text.replace(/\s+/g,' ');let first='',rest='';for(const word of text.split(' ')){if(c.measureText(first+' '+word).width<1180&&!rest)first+=(first?' ':'')+word;else rest+=(rest?' ':'')+word;}c.fillText(first,24,height+112+i*70);if(rest)c.fillText(rest.slice(0,180),24,height+130+i*70);}
    canvas.toBlob(blob=>{if(blob)download(blob,'DimSumDen-annotated-review.png','image/png');},'image/png');setStatus('Screenshot exported. Send it with the review JSON for full comments and settings.');
  };
  const exportArtifact=()=>{if(!globalThis.__REVIEW_IS_STANDALONE__){setStatus('Run npm run review:build, open the generated HTML file, then use Save annotated artifact.');return;}download(reviewHtml(globalThis.__REVIEW_DOCUMENT__,review),'DimSumDen-annotated-review.html','text/html');setStatus('Portable artifact saved with your comments and settings.');};
  const propName=TRADITIONAL_PROPS[role]?.[DIRECTIONS.findIndex(d=>d[0]===direction)];
  return <div className="scene-lab review-lab">
    <header className="lab-header"><div className="lab-brand"><span>点心</span><div>Dim Sum Den<small>LOCAL ARTIFACT · LIVING PANDAS REVISION 5</small></div></div><div className="review-export"><button onClick={()=>{download(JSON.stringify(review,null,2),'DimSumDen-review.json','application/json');setStatus('Review JSON exported. Attach it in this chat.');}}>Export review JSON</button><button onClick={exportScreenshot}>Annotated screenshot</button><button onClick={exportArtifact}>Save annotated artifact</button><button onClick={()=>importRef.current.click()}>Import review</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importReview}/></div></header>
    <div className="lab-layout">
      <aside className="lab-sidebar"><p className="lab-eyebrow">CHOOSE · ADJUST · ANNOTATE</p><h1>Give the den<br/>a little soul.</h1><p className="lab-intro">Cooks, scholars and travelers. A restaurant where the pandas can work, play and rest.</p>
        <div className="lab-tabs" role="tablist" aria-label="Review views">{[['scene','Restaurant'],['characters','Characters'],['walking','Panda studio']].map(([id,title])=><button role="tab" aria-selected={view===id} key={id} onClick={()=>changeView(id)}>{title}</button>)}</div>
        {view!=='walking'?<label className="review-select">Visual direction<select aria-label="Visual direction" value={direction} onChange={e=>setDirection(e.target.value)}>{DIRECTIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>:null}
        {view==='characters'?<><div className="character-list">{CHARACTERS.map(([id,name,station,,,planned])=><button key={id} aria-pressed={role===id} className={role===id?'selected':''} onClick={()=>{setRole(id);setDraft(null);}}><strong>{name}</strong><small>{station}{planned?' · concept':''}</small></button>)}</div><details className="review-fit" open><summary>Fit the prop · {propName}</summary><p>Adjust the grip relative to the paw. These are review overrides.</p>{FIT_CONTROLS.map(([key,name,min,max,step])=><label className="panda-slider" key={key}><span>{name}<output>{fit[key].toFixed(key==='tilt'?0:2)}</output></span><input type="range" aria-label={name} min={min} max={max} step={step} value={fit[key]} onChange={e=>setPlacements({...placements,[fitKey]:{...fit,[key]:Number(e.target.value)}})}/></label>)}<button onClick={()=>setPlacements({...placements,[fitKey]:{...DEFAULT_FIT}})}>Reset prop fit</button></details></>:null}
        {view==='walking'?<><PandaEditor settings={settings} onApply={setSettings}/><button className="review-primary" onClick={()=>setPlaying(true)}>Preview the walk</button><p className="lab-editor-note">Shape changes appear immediately and keep your camera angle. This editor is isolated from the production den.</p></>:null}
        {view==='scene'?<section className="review-crew"><h3>The pandas</h3><p>Simulated preview · click a panda to meet it.</p><button className="review-primary" onClick={()=>agentAction('gather')}>Gather for dim sum</button><details open><summary>Who’s doing what · {crew.actors.length} roles</summary><div className="review-roster">{crew.actors.map(a=><button key={a.role} aria-pressed={selectedAgent===a.role} aria-label={`Meet ${a.name}`} onClick={()=>selectAgent(a.role)}><strong>{a.name}{a.concept?' · concept':''}</strong><small>{a.activity}</small></button>)}</div></details></section>:null}
        {view==='scene'?<><div className="lab-samples">{SAMPLE_SCENES.map((s,i)=><button key={s.id} className={s.id===sample.id?'selected':''} aria-pressed={s.id===sample.id} onClick={()=>{setSample(s);setZones({});}}><span className={`sample-dot ${s.id}`}>{i+1}</span><span><strong>{s.title}</strong><small>{s.description}</small></span></button>)}</div><section className="review-zones"><h3>After service</h3><p>Activate a place to start its activity. View brings it closer for review.</p><button className="review-overview" onClick={overview}>View whole restaurant</button>{LEISURE_ZONES.map(z=><div className="review-zone-card" key={z.id}><button aria-pressed={!!zones[z.id]} onClick={()=>activate(z.id)}><strong>{z.name}</strong><small>{zones[z.id]?'Active · click to stop':z.activity}</small></button><button className="review-zone-focus" aria-label={`View ${z.name}`} onClick={()=>focusZone(z.id)}>View</button></div>)}</section></>:null}
      </aside>
      <main className={`lab-stage${annotating?' is-annotating':''}`} aria-label="Interactive review scene"><div className="lab-stage-title"><span className="lab-eyebrow">{view==='scene'?'A BIGGER BAMBOO RESTAURANT':view==='characters'?'TRADITIONAL PROP STUDY':'LIVE SHAPE & GAIT STUDY'}</span><h2>{view==='scene'?(focusedZone?.name||sample.title):view==='characters'?character[1]:'The wandering panda'}</h2><p>{view==='characters'?propName:view==='walking'?'Drag a slider. Watch the model change.':(focusedZone?.hint||'Tea · games · training · festival · dim sum · dragon dance')}</p></div>
        <LabBoundary><Canvas shadows frameloop={playing?'always':'demand'} dpr={[1,1.5]} camera={{fov:42,near:0.1,far:160}} gl={{antialias:true}}><LabWorld view={view} sample={sample} role={role} direction={direction} settings={settings} fit={fit} playing={playing} annotating={annotating} notes={filteredNotes} stage={stage} onPin={pin} onDetail={setDetail} onZone={activate} onAgent={selectAgent} onActors={setCrew}/></Canvas></LabBoundary>
        {view==='scene'&&!annotating?<div className="review-agent-tags">{crew.actors.map(a=><button key={a.role} ref={element=>{if(element)stage.current.actorTags.set(a.role,element);else stage.current.actorTags.delete(a.role);}} aria-label={`Select ${a.name} in the scene`} className={selectedAgent===a.role?'selected':''} data-state={a.state} onClick={()=>selectAgent(a.role)}><strong>{a.state==='needs-you'?'? ':a.state==='complete'?'✓ ':a.state==='received'?'✉ ':''}{a.name}</strong>{selectedAgent===a.role||['working','needs-you','complete'].includes(a.state)?<small>{a.activity}</small>:null}{selectedAgent===a.role&&a.bubble?<span>{a.bubble}</span>:null}</button>)}</div>:null}
        <div className="review-pins">{filteredNotes.map((note,i)=><button key={note.id} ref={element=>{if(element)stage.current.pins.set(note.id,element);else stage.current.pins.delete(note.id);}} aria-label={`Comment ${i+1}: ${note.label}`} onClick={()=>revisit(note)}>{i+1}</button>)}</div>
        {draft?<div className="review-pin-prompt">Selected: {draft.part}. Write your comment on the right.</div>:null}
        {detail?<aside className="restaurant-note"><button aria-label="Close detail" onClick={()=>setDetail(null)}>×</button><span>IN THE GARDEN</span><h2>{detail.title}</h2><p>{detail.text}</p></aside>:null}
        <div className="lab-scene-footer"><span>{annotating?'Click the model to pin a comment':'Drag to orbit · scroll to zoom'}</span><button aria-pressed={!playing} onClick={()=>setPlaying(!playing)}>{playing?'Pause activity':'Play activity'}</button></div>
      </main>
      <aside className="review-comments">
        {view==='scene'?<section className="review-agent-panel"><p className="lab-eyebrow">SIMULATED INTERACTION PREVIEW</p>{currentAgent?<><div className="review-agent-heading"><h2>{currentAgent.name}</h2><button aria-label="Close panda card" onClick={()=>{setSelectedAgent(null);stopFollowing();}}>×</button></div><p>{currentAgent.station}{currentAgent.concept?' · concept role':''} · <strong>{currentAgent.activity}</strong></p><p className="review-speech" aria-live="polite">{currentAgent.bubble||'Enjoying a little time in the restaurant.'}</p><div className="review-agent-actions"><button onClick={()=>agentAction('wave',selectedAgent)}>Wave</button><button onClick={()=>agentAction('talk',selectedAgent)}>Talk</button><button aria-pressed={following} onClick={followAgent}>{following?'Stop following':'Follow panda'}</button><button disabled={!!busy||currentAgent.stationary} onClick={()=>{agentAction('comeHere',selectedAgent,[0,10]);stage.current.restoreCamera?.({position:[5,4.5,17],target:[0,0.9,10]});stopFollowing();}}>Come say hello</button></div><form onSubmit={e=>{e.preventDefault();agentAction('sendTask',selectedAgent,taskText);setTaskText('');}}><label>Try a task<textarea aria-label="Preview task" rows={3} maxLength={600} value={taskText} onChange={e=>setTaskText(e.target.value)} placeholder="Prepare a new dim sum special…"/></label><button className="review-primary" disabled={!!busy||!taskText.trim()}>Send preview task</button></form>{currentAgent.task?<p className="review-task">Your request: {currentAgent.task}</p>:null}{currentAgent.state==='needs-you'?<button className="review-primary" onClick={()=>agentAction('answer',selectedAgent)}>Yes, prepare a first draft</button>:null}{currentAgent.reply?<p className="review-result">{currentAgent.reply}</p>:null}<button className="review-return" disabled={!!busy&&currentAgent.state!=='complete'} onClick={()=>agentAction('resume',selectedAgent)}>{currentAgent.stationary?'Keep hosting':'Return to leisure'}</button></>:<><h2>Meet a panda.</h2><p>Click its body, name tag or role in the list. Wave, follow it, or try a task and watch it head to work.</p></>}<p className="review-simulation">Preview responses are scripted. No live agents run.</p><details className="review-feed" open><summary>Restaurant activity</summary><ol>{crew.events.map(e=><li key={e.id}><strong>{e.name}</strong> {e.text}</li>)}</ol></details></section>:null}
        <p className="lab-eyebrow">YOUR REVIEW · {notes.length} COMMENTS</p><h2>Make it yours.</h2><p>Pin a label to a prop, pose or place. Export the artifact or send the JSON and screenshot in chat.</p><button className="review-primary" aria-pressed={annotating} onClick={()=>{setAnnotating(!annotating);setPlaying(false);stopFollowing();setDraft(null);}}>{annotating?'Cancel pin':'Pin a comment'}</button>
        {draft?<form onSubmit={e=>{e.preventDefault();saveNote();}}><label>Label<input value={label} maxLength={100} onChange={e=>setLabel(e.target.value)}/></label><label>Comment<textarea value={comment} required maxLength={4000} rows={5} onChange={e=>setComment(e.target.value)} placeholder="Move the staff closer to the paw…"/></label><button className="review-primary" type="submit">Save comment</button></form>:null}
        <p className="review-status" role="status">{status}</p><div className="review-note-list">{notes.map((note,i)=><article key={note.id} className={selectedNote===note.id?'selected':''}><button className="review-note-title" onClick={()=>revisit(note)}>{i+1}. {note.label}</button><small>{note.view} · {note.role} · {note.direction}</small><p>{note.text}</p><button className="review-delete" aria-label={`Delete comment ${i+1}`} onClick={()=>setNotes(old=>old.filter(n=>n.id!==note.id))}>Delete</button></article>)}</div>
        {!notes.length?<div className="review-empty">Start with the prop grip, hat silhouette, or walking proportions. Your notes stay on this device until you export them.</div>:null}
      </aside>
    </div>
  </div>;
}
