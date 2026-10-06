/**
 * Four-legged Bao: horizontal body, four seamless limbs pivoting at shoulder/hip.
 * Reuses the seated model's face/materials, but has its own quadruped skeleton.
 */
import { pandaSettings } from '../scene/procedural/panda-settings.mjs';
export function createWalkingBao(THREE,createBao,options={}) {
  const settings=pandaSettings(options);
  const donor=createBao(THREE,{detail:'low'});
  const model=new THREE.Group();model.name='Bao_Roaming';
  model.userData={character:'Bao',pose:'quadruped'};
  const materials=donor.materials,bones={},anchors={},indices={},list=[],meshes=[];
  const V=a=>new THREE.Vector3(...a),Q=()=>new THREE.Quaternion();
  const faceScale=0.66*settings.headScale,facePoint=p=>p.clone().sub(V([0,3.26,0])).multiplyScalar(faceScale).add(V([0,1.65,1.65]));
  function bone(name,parent,p){
    const b=new THREE.Bone();b.name=name;anchors[name]=V(p);
    b.position.copy(anchors[name]).sub(parent?anchors[parent]:V([0,0,0]));
    (parent?bones[parent]:model).add(b);indices[name]=list.length;list.push(b);bones[name]=b;return b;
  }
  bone('Root',null,[0,0,0]);bone('Spine','Root',[0,1.25,-0.15]);
  bone('Head','Spine',[0,1.30,1.20]);
  donor.model.updateMatrixWorld(true);
  bone('Jaw','Head',facePoint(donor.bones.Jaw.getWorldPosition(new THREE.Vector3())).toArray());
  for(const [side,s] of [['L',1],['R',-1]]){
    bone('Ear_'+side,'Head',facePoint(donor.bones['Ear_'+side].getWorldPosition(new THREE.Vector3())).toArray());
    bone('Shoulder_'+side,'Spine',[s*0.75,1.16,0.72]);
    bone('Wrist_'+side,'Shoulder_'+side,[s*0.75,0.14,0.72]);
    bone('Hip_'+side,'Spine',[s*0.78,1.18,-1.03]);
    bone('Ankle_'+side,'Hip_'+side,[s*0.78,0.14,-1.03]);
  }
  bone('Tail','Spine',[0,1.28,-1.52]);model.updateMatrixWorld(true);
  const skeleton=new THREE.Skeleton(list);skeleton.calculateInverses();
  const rest=list.map(b=>({b,p:b.position.clone()}));
  function attach(name,g,mat,joint){
    const p=g.attributes.position,ix=[],w=[];
    for(let i=0;i<p.count;i++){ix.push(indices[joint],0,0,0);w.push(1,0,0,0);}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ix,4));
    g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(w,4));
    const m=new THREE.SkinnedMesh(g,mat);m.name=name;m.frustumCulled=false;
    m.castShadow=!/Glint|Pupil|Crease/.test(name);m.receiveShadow=true;
    model.add(m);m.bind(skeleton,new THREE.Matrix4());meshes.push(m);return m;
  }
  function ellipsoid(name,center,scale,mat,joint,rotation=null){
    const g=new THREE.SphereGeometry(1,16,10);g.scale(...scale);
    if(rotation)g.applyQuaternion(rotation);
    g.translate(...center);return attach(name,g,mat,joint);
  }
  ellipsoid('WalkingBody',[0,1.25,-0.10],[0.94*settings.bodyWidth,0.90,1.43],materials.cream,'Spine');
  // A fur marking on the body's surface, stopping behind the head; no neck piece.
  const shoulderPositions=[],shoulderUV=[],shoulderIndices=[],sectors=48,rows=8;
  for(let row=0;row<=rows;row++){
    const z=0.3+row/rows*0.58,rho=Math.sqrt(1-((z+0.1)/1.43)**2);
    for(let i=0;i<=sectors;i++){
      const angle=i/sectors*Math.PI*2;
      shoulderPositions.push(Math.cos(angle)*(0.94*settings.bodyWidth*rho+0.008),1.25+Math.sin(angle)*(0.9*rho+0.008),z);
      shoulderUV.push(i/sectors,row/rows);
      if(row<rows&&i<sectors){const a=row*(sectors+1)+i;shoulderIndices.push(a,a+1,a+sectors+1,a+1,a+sectors+2,a+sectors+1);}
    }
  }
  const marking=new THREE.BufferGeometry();marking.setAttribute('position',new THREE.Float32BufferAttribute(shoulderPositions,3));marking.setAttribute('uv',new THREE.Float32BufferAttribute(shoulderUV,2));marking.setIndex(shoulderIndices);marking.computeVertexNormals();
  attach('ShoulderMarking',marking,materials.charcoal,'Spine');
  ellipsoid('WalkingTail',[0,1.28,-1.58],[0.20,0.18,0.19],materials.cream,'Tail');
  const headPattern=/^(HeadShape|Muzzle|Nose|Philtrum|Smile_|EyePatch_|EyeWhite_|Pupil_|EyeGlint_|Lid_|Ear_|InnerEar_|CrownTuft_|CheekTuft_)/;
  for(const original of donor.model.children){
    if(!original.isSkinnedMesh||!headPattern.test(original.name))continue;
    const g=original.geometry.clone(),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const point=facePoint(V([p.getX(i),p.getY(i),p.getZ(i)]));p.setXYZ(i,point.x,point.y,point.z);
    }
    for(const attribute of g.morphAttributes.position||[]){
      for(let i=0;i<attribute.count;i++)attribute.setXYZ(i,attribute.getX(i)*faceScale,attribute.getY(i)*faceScale,attribute.getZ(i)*faceScale);
    }
    let joint='Head';
    if(/^(Muzzle|Philtrum|Smile_)/.test(original.name))joint='Jaw';
    if(/^(Ear_|InnerEar_)/.test(original.name))joint='Ear_'+original.name.slice(-1);
    attach(original.name,g,original.material,joint);
  }
  const limbs=[];
  function segment(name,a,b,radius,joint){
    const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(0.5);
    return ellipsoid(name,mid.toArray(),[radius,delta.length()/2+0.09,radius],materials.charcoal,joint,Q().setFromUnitVectors(V([0,1,0]),delta.normalize()));
  }
  for(const [side,s]of [['L',1],['R',-1]])for(const front of [true,false]){
    const upper=(front?'Shoulder_':'Hip_')+side,foot=(front?'Wrist_':'Ankle_')+side;
    const a=anchors[upper],c=anchors[foot];
    segment('Limb_'+upper,a,c,(front?0.27:0.3)*settings.legWidth,upper);
    ellipsoid('Paw_'+foot,[c.x,0.13,c.z+0.08],[0.27,0.13,0.34],materials.charcoal,foot);
    for(let i=0;i<3;i++)ellipsoid('Toe_'+foot+i,[c.x+(i-1)*0.12,0.115,c.z+0.28],[0.087,0.10,0.12],materials.charcoal,foot);
    limbs.push({upper,foot,base:c.clone(),anchor:a.clone(),rest:c.clone().sub(a),
      phase:front?(side==='L'?0:0.5):(side==='L'?0.75:0.25)});
  }
  // Donor geometry/skeleton are no longer needed; its materials are retained.
  donor.model.traverse(m=>{if(m.isMesh)m.geometry.dispose();});donor.skeleton.dispose();
  let stride=settings.stride;const duty=0.78;
  function setGait(value){const next=pandaSettings(value);stride=next.stride;settings.lift=next.lift;}
  function resetPose(){
    for(const {b,p}of rest){b.position.copy(p);b.quaternion.identity();b.scale.set(1,1,1);}
    for(const m of meshes)if(m.morphTargetInfluences)m.morphTargetInfluences.fill(0);
    model.updateMatrixWorld(true);
  }
  function pose(phase,strength=1){
    const cycle=((phase%1)+1)%1;
    const roll=Math.sin(cycle*Math.PI*2)*0.018*strength;
    bones.Spine.position.y=1.25+Math.sin(cycle*Math.PI*4)*0.022*strength;
    bones.Spine.quaternion.setFromEuler(new THREE.Euler(0,0,roll));
    bones.Head.quaternion.setFromEuler(new THREE.Euler(0.045+Math.sin(cycle*Math.PI*2)*0.02*strength,Math.sin(cycle*Math.PI*2)*0.012*strength,0));
    const spineQ=bones.Spine.quaternion,spineInverse=spineQ.clone().invert();
    for(const limb of limbs){
      const p=(cycle+limb.phase)%1;
      let offset,lift=0,pitch=0;
      if(p<duty){offset=stride*(0.5-p/duty);}
      else{
        const t=(p-duty)/(1-duty),ease=t*t*(3-2*t);
        offset=stride*(-0.5+ease);lift=settings.lift*Math.sin(Math.PI*t);pitch=-0.14*Math.sin(Math.PI*t);
      }
      const foot=limb.base.clone();foot.z+=offset*strength;foot.y+=lift*strength;
      const localFoot=foot.clone().sub(bones.Spine.position).applyQuaternion(spineInverse);
      const localAnchor=limb.anchor.clone().sub(V([0,1.25,-0.15]));
      const delta=localFoot.sub(localAnchor),stretch=delta.length()/limb.rest.length();
      const rotation=Q().setFromUnitVectors(limb.rest.clone().normalize(),delta.normalize());
      bones[limb.upper].quaternion.copy(rotation);
      // A small plush stretch keeps the paw planted, without an elbow/knee bend.
      bones[limb.upper].scale.set(1,stretch,1);
      const pawQ=Q().setFromEuler(new THREE.Euler(pitch*strength,0,0));
      bones[limb.foot].quaternion.copy(rotation.clone().invert()).multiply(spineInverse).multiply(pawQ);
      bones[limb.foot].scale.set(1,1/stretch,1);

    }
  }
  // Bake the same procedural gait into a portable in-place animation clip.
  const samples=64,duration=0.95,times=[],trackValues=new Map();
  const moving=['Spine','Head',...limbs.flatMap(l=>[l.upper,l.foot])];
  for(const name of moving)trackValues.set(name,[]);
  const scaleValues=new Map(limbs.flatMap(l=>[l.upper,l.foot]).map(name=>[name,[]]));
  const spinePositions=[];
  for(let i=0;i<=samples;i++){
    const t=i/samples;times.push(t*duration);pose(t,1);
    for(const name of moving)trackValues.get(name).push(...bones[name].quaternion.toArray());
    spinePositions.push(...bones.Spine.position.toArray());
    for(const [name,values]of scaleValues)values.push(...bones[name].scale.toArray());
  }
  const tracks=[new THREE.VectorKeyframeTrack('Spine.position',times,spinePositions)];
  for(const [name,values]of trackValues)tracks.push(new THREE.QuaternionKeyframeTrack(name+'.quaternion',times,values));
  for(const [name,values]of scaleValues)tracks.push(new THREE.VectorKeyframeTrack(name+'.scale',times,values));
  const walk=new THREE.AnimationClip('Walk',duration,tracks);
  const blink=new THREE.AnimationClip('Blink',4,['L','R'].map(side=>
    new THREE.NumberKeyframeTrack('Lid_'+side+'.morphTargetInfluences[0]',[0,1.75,1.84,1.93,2.06,4],[0,0,1,1,0,0])));
  const idle=new THREE.AnimationClip('Idle',4,[
    new THREE.QuaternionKeyframeTrack('Head.quaternion',[0,1,2,3,4],
      [0.045,0.05,0.045,-0.05,0.045].flatMap(y=>Q().setFromEuler(new THREE.Euler(0.045,y,0)).toArray())),
  ]);
  const animations=[walk,blink,idle];model.animations=animations;resetPose();
  const mixer=new THREE.AnimationMixer(model);mixer.clipAction(blink).play();
  function update(delta,time,phase,strength=1){
    mixer.update(delta);pose(phase,strength);
    if(strength<0.05)bones.Head.quaternion.setFromEuler(new THREE.Euler(0.06,0.12*Math.sin(time*0.4),0));
  }
  function dispose(){
    mixer.stopAllAction();mixer.uncacheRoot(model);
    for(const m of meshes)m.geometry.dispose();
    const textures=new Set();
    for(const mat of Object.values(materials)){for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);mat.dispose();}
    for(const t of textures)t.dispose();skeleton.dispose();
  }
  return {model,bones,skeleton,materials,animations,mixer,resetPose,pose,update,dispose,setGait,get stride(){return stride;},duty};
}
