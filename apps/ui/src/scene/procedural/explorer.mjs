/** Ground-level exploration with mouse capture or drag-to-look fallback: the THREE and DOM adapter over the pure walk core. */
import { walk, startWalk, isDenPositionBlocked, isWalkBlocked } from './walk.mjs';
export { isDenPositionBlocked };
export function createDenExplorer(THREE,{canvas,orbitControls,den,onModeChange=()=>{},onHint=()=>{}}) {
  const camera=new THREE.PerspectiveCamera(66,1,0.045,160);
  const keys=new Set(),listeners=[];
  let active=false,state=startWalk(),look={dx:0,dy:0},drag=null,wasLocked=false;
  function listen(target,event,callback,options){
    target.addEventListener(event,callback,options);
    listeners.push(()=>target.removeEventListener(event,callback,options));
  }
  function place(){camera.position.set(state.x,state.y,state.z);camera.rotation.set(state.pitch,state.yaw,0,'YXZ');}
  function fallback(){if(active)onHint('WASD / arrows to walk · drag to look · Shift to go faster · Esc to leave');}
  function capture(){
    if(!active||!canvas.requestPointerLock){fallback();return;}
    try{
      const pending=canvas.requestPointerLock();
      if(pending?.catch)pending.catch(fallback);
    }catch{fallback();}
  }
  function enter(){
    if(active)return;
    active=true;keys.clear();look={dx:0,dy:0};state=startWalk();
    place();orbitControls.enabled=false;
    onModeChange(true);fallback();capture();
  }
  function exit(){
    if(!active)return;
    active=false;keys.clear();drag=null;orbitControls.enabled=true;onModeChange(false);
    if(document.pointerLockElement===canvas)document.exitPointerLock();
    wasLocked=false;
  }
  listen(document,'pointerlockchange',()=>{
    const locked=document.pointerLockElement===canvas;
    if(active&&locked)onHint('WASD / arrows to walk · mouse to look · Shift to go faster · Esc to leave');
    if(wasLocked&&!locked&&active)exit();
    wasLocked=locked;
  });
  listen(document,'pointerlockerror',fallback);
  listen(document,'keydown',e=>{
    if(!active)return;
    if(e.code==='Escape'){e.preventDefault();exit();return;}
    if(e.target.closest?.('input,select,textarea,button,a,[contenteditable],[role="dialog"]'))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){
      e.preventDefault();keys.add(e.code);
    }
  });
  listen(document,'keyup',e=>keys.delete(e.code));
  listen(document,'focusin',()=>{keys.clear();drag=null;});
  listen(window,'blur',()=>{keys.clear();drag=null;});
  listen(document,'visibilitychange',()=>{if(document.hidden){keys.clear();drag=null;}});
  function turn(dx,dy){look.dx+=dx;look.dy+=dy;}
  listen(document,'mousemove',e=>{if(active&&document.pointerLockElement===canvas)turn(e.movementX,e.movementY);});
  listen(canvas,'pointerdown',e=>{
    if(!active||document.pointerLockElement===canvas||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
  });
  listen(canvas,'pointermove',e=>{
    if(!active||!drag||drag.id!==e.pointerId)return;
    turn(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
  });
  const endDrag=e=>{if(drag?.id===e.pointerId)drag=null;};
  listen(canvas,'pointerup',endDrag);listen(canvas,'pointercancel',endDrag);listen(canvas,'lostpointercapture',endDrag);
  listen(canvas,'dblclick',()=>{if(active)capture();});
  // The roaming pandas move, so they are handed to the walker afresh each frame.
  function world(){
    const avoid=[];
    for(const r of den.roamers){
      if(!r.panda.model.visible)continue;
      const p=r.panda.model.position;
      avoid.push({x:p.x,z:p.z,r:0.72});
    }
    return {obstacles:den.obstacles,avoid};
  }
  const blocked=(x,z)=>isWalkBlocked(x,z,world());
  function update(delta){
    if(!active)return;
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const strafe=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const input={forward,strafe,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight'),look,
      reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches};
    state=walk(state,input,delta,world());
    look={dx:0,dy:0};
    place();
  }
  function bindButton(element,key){
    listen(element,'pointerdown',e=>{
      if(!active)return;e.preventDefault();e.stopPropagation();element.setPointerCapture(e.pointerId);keys.add(key);
    });
    const release=e=>{keys.delete(key);e.stopPropagation();};
    listen(element,'pointerup',release);listen(element,'pointercancel',release);listen(element,'lostpointercapture',release);
  }
  function resize(aspect){camera.aspect=aspect;camera.updateProjectionMatrix();}
  function dispose(){exit();for(const remove of listeners)remove();}
  return {camera,enter,exit,capture,update,resize,bindButton,dispose,blocked,get active(){return active;}};
}
