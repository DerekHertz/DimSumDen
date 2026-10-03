/** Ground-level exploration with mouse capture or drag-to-look fallback. */
export function isDenPositionBlocked(x,z,obstacles,radius=0.26) {
  for(const o of obstacles){
    const dx=x-o.x,dz=z-o.z;
    if(o.type==='circle'&&dx*dx+dz*dz<(o.radius+radius)**2)return true;
    if(o.type==='ellipse'&&(dx/(o.rx+radius))**2+(dz/(o.rz+radius))**2<1)return true;
    if(o.type==='box'){
      const c=Math.cos(o.rotation||0),s=Math.sin(o.rotation||0);
      const lx=c*dx-s*dz,lz=s*dx+c*dz;
      if(Math.abs(lx)<o.halfX+radius&&Math.abs(lz)<o.halfZ+radius)return true;
    }
  }
  return false;
}
export function createDenExplorer(THREE,{canvas,orbitControls,den,onModeChange=()=>{},onHint=()=>{}}) {
  const camera=new THREE.PerspectiveCamera(66,1,0.045,160);
  const keys=new Set(),listeners=[];
  let active=false,yaw=0,pitch=0.14,drag=null,wasLocked=false,walkTime=0;
  const eyeHeight=1.65;
  function listen(target,event,callback,options){
    target.addEventListener(event,callback,options);
    listeners.push(()=>target.removeEventListener(event,callback,options));
  }
  function orient(){camera.rotation.set(pitch,yaw,0,'YXZ');}
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
    active=true;keys.clear();yaw=0;pitch=0.14;walkTime=0;
    camera.position.set(0,eyeHeight,8.95);orient();orbitControls.enabled=false;
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
  function look(dx,dy){
    yaw-=dx*0.0025;pitch=THREE.MathUtils.clamp(pitch-dy*0.0025,-1.20,1.30);orient();
  }
  listen(document,'mousemove',e=>{if(active&&document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
  listen(canvas,'pointerdown',e=>{
    if(!active||document.pointerLockElement===canvas||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
  });
  listen(canvas,'pointermove',e=>{
    if(!active||!drag||drag.id!==e.pointerId)return;
    look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
  });
  const endDrag=e=>{if(drag?.id===e.pointerId)drag=null;};
  listen(canvas,'pointerup',endDrag);listen(canvas,'pointercancel',endDrag);listen(canvas,'lostpointercapture',endDrag);
  listen(canvas,'dblclick',()=>{if(active)capture();});
  function blocked(x,z){
    if(x<-11.65||x>11.65||z<-10.4||z>9.35)return true;
    if(isDenPositionBlocked(x,z,den.obstacles,0.26))return true;
    for(const r of den.roamers){
      const p=r.panda.model.position;
      if(!r.panda.model.visible)continue;
      if(Math.hypot(x-p.x,z-p.z)<0.72)return true;
    }
    return false;
  }
  function update(delta){
    if(!active)return;
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const strafe=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const length=Math.hypot(forward,strafe);
    if(length){
      const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?3.5:2.1;
      const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/length*speed*delta;
      const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/length*speed*delta;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/0.08));
      for(let i=0;i<steps;i++){
        if(!blocked(camera.position.x+dx/steps,camera.position.z))camera.position.x+=dx/steps;
        if(!blocked(camera.position.x,camera.position.z+dz/steps))camera.position.z+=dz/steps;
      }
      walkTime+=delta;
    }
    camera.position.y=eyeHeight+(length&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches?0.012*Math.sin(walkTime*9):0);
    orient();
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
