/**
 * Pure first-person walk core (den-v1/03): walk(state, input, dt, world) -> state.
 * No three, DOM or React in here; createDenExplorer in explorer.mjs is the thin adapter that feeds it keys, mouse
 * and the den's obstacles each frame.
 *
 *   state  {x, z, y, yaw, pitch, walkTime}   y is the eye height including the walking bob
 *   input  {forward, strafe, sprint, look:{dx,dy}, reducedMotion}   forward/strafe are -1, 0 or 1; look is mouse px
 *   world  {obstacles, avoid}   obstacles are den.obstacles (circle, ellipse, rotated box); avoid is [{x,z,r}] for
 *                               things that move (roaming pandas)
 */
export const WALK = Object.freeze({
  eyeHeight: 1.65, speed: 2.1, sprintSpeed: 3.5, radius: 0.26, stepLength: 0.08,
  bounds: Object.freeze({minX: -11.65, maxX: 11.65, minZ: -10.4, maxZ: 9.35}),
  pitchMin: -1.20, pitchMax: 1.30, lookRate: 0.0025, bob: 0.012, bobRate: 9,
  start: Object.freeze({x: 0, z: 8.95, yaw: 0, pitch: 0.14}),
});

export function isDenPositionBlocked(x,z,obstacles,radius=WALK.radius) {
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

export function startWalk() {
  return {...WALK.start, y: WALK.eyeHeight, walkTime: 0};
}

export function isWalkBlocked(x,z,world) {
  const b=WALK.bounds;
  if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)return true;
  if(isDenPositionBlocked(x,z,world.obstacles||[]))return true;
  for(const a of world.avoid||[])if(Math.hypot(x-a.x,z-a.z)<a.r)return true;
  return false;
}

export function walk(state,input,dt,world) {
  const look=input.look||{dx:0,dy:0};
  const yaw=state.yaw-look.dx*WALK.lookRate;
  const pitch=Math.max(WALK.pitchMin,Math.min(WALK.pitchMax,state.pitch-look.dy*WALK.lookRate));
  const forward=input.forward||0,strafe=input.strafe||0;
  const length=Math.hypot(forward,strafe);
  let {x,z,walkTime}=state;
  if(length){
    const speed=input.sprint?WALK.sprintSpeed:WALK.speed;
    const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/length*speed*dt;
    const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/length*speed*dt;
    // Sub-steps no longer than a stride keep a long frame from jumping a prop; each axis slides on its own.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/WALK.stepLength));
    for(let i=0;i<steps;i++){
      if(!isWalkBlocked(x+dx/steps,z,world))x+=dx/steps;
      if(!isWalkBlocked(x,z+dz/steps,world))z+=dz/steps;
    }
    walkTime+=dt;
  }
  const bob=length&&!input.reducedMotion?WALK.bob*Math.sin(walkTime*WALK.bobRate):0;
  return {x,z,y:WALK.eyeHeight+bob,yaw,pitch,walkTime};
}
