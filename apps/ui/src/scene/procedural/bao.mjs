/**
 * Bao, a procedural, skinned panda for Dim Sum Den.
 * No model files or Blender required. Pass your app's Three.js instance.
 * +Y is up; +Z is forward. Default seated height is about 4.1 scene units.
 */
export function createBao(THREE, options = {}) {
  const headSize = Math.min(1.16, Math.max(0.86, options.headSize ?? 1.08));
  const bellyWidth = Math.min(1.16, Math.max(0.88, options.bellyWidth ?? 1));
  const detail = options.detail === 'low' ? 16 : 48;
  const bodyDepth = 1.24 * Math.sqrt(bellyWidth);
  const model = new THREE.Group();
  model.name = 'Bao_Plush_V1';
  model.userData = { character: 'Bao', version: 1, forward: '+Z', pose: 'seated', headSize, bellyWidth };
  const bones = {}, boneList = [], indices = {}, anchors = {};
  const V = (a) => new THREE.Vector3(...a);
  const headOrigin = V([0, 3.02, 0]);
  const headLift = V([0, 0.24, 0]);
  const hp = (a) => V(a).sub(headOrigin).multiplyScalar(headSize).add(headOrigin).add(headLift);
  function bone(name, parent, world) {
    const b = new THREE.Bone();
    b.name = name;
    const worldPosition = V(world);
    b.position.copy(worldPosition).sub(parent ? anchors[parent] : V([0, 0, 0]));
    (parent ? bones[parent] : model).add(b);
    indices[name] = boneList.length;
    boneList.push(b); bones[name] = b; anchors[name] = worldPosition;
    return b;
  }
  bone('Root', null, [0, 0, 0]);
  bone('Torso', 'Root', [0, 1.40, 0]);
  bone('Head', 'Torso', hp([0, 2.52, 0]).toArray());
  bone('Jaw', 'Head', hp([0, 2.69, 0.64]).toArray());
  for (const [side, sign] of [['L', 1], ['R', -1]]) {
    const x = sign * (1.03 + (bellyWidth - 1) * 0.90);
    bone('Shoulder_' + side, 'Torso', [x, 2.50, 0.10]);
    bone('Elbow_' + side, 'Shoulder_' + side, [x + sign * 0.30, 2.18, 0.70]);
    bone('Wrist_' + side, 'Elbow_' + side, [x + sign * 0.17, 1.96, 1.08]);
    bone('Hip_' + side, 'Root', [sign * 1.00, 0.84, 0.16]);
    bone('Ankle_' + side, 'Hip_' + side, [sign * 1.16, 0.45, 0.90]);
    bone('Ear_' + side, 'Head', hp([sign * 0.92, 3.70, -0.02]).toArray());
  }
  bone('Tail', 'Torso', [0, 0.88, -1.06]);
  model.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(boneList);
  skeleton.calculateInverses();

  // An actual baked normal texture, rather than a render-only shader:
  // the plush surface can travel with a GLB export.
  function plushNormal() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    const pixels = context.createImageData(256, 256);
    let seed = 713;
    const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < pixels.data.length; i += 4) {
      const x = (rand() - 0.5) * 0.45;
      const y = (rand() - 0.5) * 0.45;
      pixels.data[i] = Math.round(127.5 * (x + 1));
      pixels.data[i + 1] = Math.round(127.5 * (y + 1));
      pixels.data[i + 2] = Math.round(127.5 * (Math.sqrt(1 - x*x - y*y) + 1));
      pixels.data[i + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    return texture;
  }
  const normal = plushNormal();
  const plush = (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.92, metalness: 0,
    sheen: 0.65, sheenRoughness: 0.9, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.18),
    normalMap: normal, normalScale: new THREE.Vector2(0.32, 0.32),
  });
  const materials = {
    cream: plush('#eee7d9'),
    charcoal: plush('#252426'),
    pad: new THREE.MeshStandardMaterial({ color: '#75615b', roughness: 0.91 }),
    muzzle: plush('#f2eadc'),
    nose: new THREE.MeshPhysicalMaterial({ color: '#242125', roughness: 0.33, clearcoat: 0.22 }),
    white: new THREE.MeshStandardMaterial({ color: '#eee9dd', roughness: 0.4 }),
    pupil: new THREE.MeshPhysicalMaterial({ color: '#100f10', roughness: 0.18, clearcoat: 0.4 }),
    glint: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    mouth: new THREE.MeshStandardMaterial({ color: '#44322b', roughness: 0.85 }),
  };
  const meshes = [];
  function add(name, geometry, material, skin = 'Torso', isHead = false, morph = null) {
    if (isHead) {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const p = hp([pos.getX(i), pos.getY(i), pos.getZ(i)]);
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      if (morph) morph.multiplyScalar(headSize);
    }
    if (morph) {
      const pos = geometry.attributes.position;
      const delta = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        delta[i*3] = morph.x; delta[i*3+1] = morph.y; delta[i*3+2] = morph.z;
      }
      geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(delta, 3)];
      geometry.morphTargetsRelative = true;
    }
    geometry.computeVertexNormals();
    const pos = geometry.attributes.position;
    const skinIndices = [], skinWeights = [];
    for (let i = 0; i < pos.count; i++) {
      const weights = typeof skin === 'function'
        ? skin(V([pos.getX(i), pos.getY(i), pos.getZ(i)]))
        : [[skin, 1]];
      for (let j = 0; j < 4; j++) {
        skinIndices.push(weights[j] ? indices[weights[j][0]] : 0);
        skinWeights.push(weights[j] ? weights[j][1] : 0);
      }
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    // Animation moves beyond the rest-pose bounds.
    mesh.frustumCulled = false;
    model.add(mesh);
    mesh.bind(skeleton, new THREE.Matrix4());
    if (morph) { mesh.morphTargetDictionary = { blink: 0 }; mesh.morphTargetInfluences[0] = 0; }
    meshes.push(mesh);
    return mesh;
  }
  function ellipsoid(center, scale, rotation = 0, segments = detail) {
    const g = new THREE.SphereGeometry(1, segments, Math.max(8, segments / 2));
    g.scale(...scale);
    g.rotateZ(rotation);
    g.translate(...center);
    return g;
  }
  function headSurface(u, v, lift = 0) {
    const cheek = 1 + 0.11 * Math.max(0, -v);
    return [u * 1.24 * cheek, 3.02 + v * 0.90, Math.sqrt(Math.max(0.001, 1-u*u-v*v)) * 0.79 + lift];
  }
  function bodySurface(u, v, lift = 0) {
    // Bottom-heavy, volumetric belly: its silhouette must also read from the side.
    const pear = 1 - 0.18 * v;
    return [u * 1.50 * bellyWidth * pear, 1.47 + v * 1.26, 0.16 + Math.sqrt(Math.max(0.001, 1-u*u-v*v)) * bodyDepth + lift];
  }
  function sculpt(surface) {
    const g = new THREE.SphereGeometry(1, detail, detail / 2);
    const p = g.attributes.position;
    for (let i=0; i<p.count; i++) {
      const u = p.getX(i), v = p.getY(i), z = p.getZ(i);
      const a = surface(u, v);
      p.setXYZ(i, a[0], a[1], surface === headSurface ? z * 0.79 : 0.16 + z * bodyDepth);
    }
    return g;
  }
  // A conforming surface patch: no detached black "eye balls" or white belly ball.
  function patch(surface, center, radius, tilt = 0, irregularity = 0, lift = 0.012) {
    const rings = options.detail === 'low' ? 8 : 18, sectors = options.detail === 'low' ? 24 : 64;
    const positions = [], uv = [], triangles = [];
    for (let r = 0; r <= rings; r++) {
      for (let s = 0; s <= sectors; s++) {
        const a = s / sectors * Math.PI * 2;
        const wave = 1 + irregularity * Math.sin(a * 3 + 0.4);
        const x = Math.cos(a) * radius[0] * r/rings * wave;
        const y = Math.sin(a) * radius[1] * r/rings * wave;
        const u = center[0] + x * Math.cos(tilt) - y * Math.sin(tilt);
        const v = center[1] + x * Math.sin(tilt) + y * Math.cos(tilt);
        positions.push(...surface(u, v, lift));
        uv.push(0.5 + x/(2*radius[0]), 0.5 + y/(2*radius[1]));
        if (r < rings && s < sectors) {
          const i = r*(sectors+1) + s;
          triangles.push(i, i+sectors+1, i+1, i+1, i+sectors+1, i+sectors+2);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(triangles);
    return g;
  }
  add('Body', sculpt(bodySurface), materials.charcoal);
  add('Belly', patch(bodySurface, [0,-0.12], [0.91,0.84], 0, 0.009, 0.018), materials.cream);
  add('HeadShape', sculpt(headSurface), materials.cream, 'Head', true);
  add('Muzzle', ellipsoid([0,2.64,0.765], [0.30,0.185,0.14]), materials.muzzle, 'Jaw', true);
  const nose = ellipsoid([0,2.775,0.895], [0.135,0.083,0.077]);
  const np = nose.attributes.position;
  for (let i=0; i<np.count; i++) {
    np.setX(i, np.getX(i) * (0.84 + (np.getY(i)-2.692)/0.166*0.28));
  }
  add('Nose', nose, materials.nose, 'Head', true);
  function stroke(name, points, radius, material, boneName, isHead = false) {
    const curve = new THREE.CatmullRomCurve3(points.map(V));
    return add(name, new THREE.TubeGeometry(curve, 24, radius, 8, false), material, boneName, isHead);
  }
  stroke('Philtrum', [[0,2.725,0.931],[0,2.655,0.931],[0,2.622,0.923]], 0.009, materials.mouth, 'Jaw', true);
  for (const [side, s] of [['L',1], ['R',-1]]) {
    const armX = s * (1.03 + (bellyWidth - 1) * 0.90);
    const armWeights = (p) => {
      if (p.y >= 2.18) {
        const t = THREE.MathUtils.smoothstep(p.y, 2.18, 2.50);
        return [['Shoulder_'+side,t],['Elbow_'+side,1-t]];
      }
      const t = THREE.MathUtils.smoothstep(p.y, 1.96, 2.18);
      return [['Elbow_'+side,t],['Wrist_'+side,1-t]];
    };
    // One curved shoulder-to-wrist surface, with the palm overlapping its end.
    const armCurve = new THREE.CatmullRomCurve3([
      V([armX,2.50,0.10]), V([armX+s*0.24,2.37,0.32]),
      V([armX+s*0.30,2.18,0.70]), V([armX+s*0.17,1.96,1.08]),
    ]);
    const armGeometry = new THREE.TubeGeometry(armCurve,36,0.37,24,false);
    const armPositions = armGeometry.attributes.position;
    for(let i=0;i<armPositions.count;i++) {
      const t = Math.floor(i/25)/36;
      const center = armCurve.getPointAt(t);
      const radius = 0.36 + 0.055*Math.sin(Math.PI*t) - 0.09*t;
      const point = V([armPositions.getX(i),armPositions.getY(i),armPositions.getZ(i)]);
      point.sub(center).multiplyScalar(radius/0.37).add(center);
      armPositions.setXYZ(i,point.x,point.y,point.z);
    }
    add('Arm_'+side, armGeometry, materials.charcoal, armWeights);
    // Broad, shallow mittens instead of a rounded cap on a long forearm.
    const palm = [armX+s*0.17,1.88,1.10];
    add('Hand_'+side, ellipsoid(palm, [0.39,0.25,0.27]), materials.charcoal, 'Wrist_'+side);
    add('Thumb_'+side, ellipsoid([palm[0]-s*0.29,1.95,1.17], [0.14,0.135,0.13], s*0.22), materials.charcoal, 'Wrist_'+side);
    for (let f=0; f<3; f++) {
      const fx = palm[0] + (f-1)*0.115;
      const marks = [1.72,1.75,1.78].map(y => {
        const u = (fx-palm[0])/0.39, v = (y-palm[1])/0.25;
        return [fx,y,palm[2]+0.27*Math.sqrt(Math.max(0,1-u*u-v*v))+0.004];
      });
      stroke('FingerCrease_'+side+f, marks, 0.005, materials.nose, 'Wrist_'+side);
    }
    add('Haunch_'+side, ellipsoid([s*1.09,0.65,0.18], [0.54,0.59,0.70], -s*0.15), materials.charcoal, 'Hip_'+side);
    add('Foot_'+side, ellipsoid([s*1.16,0.45,0.90], [0.51,0.45,0.55]), materials.charcoal, 'Ankle_'+side);
    add('Sole_'+side, ellipsoid([s*1.16,0.345,1.428], [0.24,0.22,0.045]), materials.pad, 'Ankle_'+side);
    for (let t=0; t<4; t++) {
      const a = (t-1.5)*0.59;
      add('ToePad_'+side+t, ellipsoid([s*1.16+Math.sin(a)*0.32,0.45+Math.cos(a)*0.265,1.342], [0.078,0.097,0.052], -a), materials.pad, 'Ankle_'+side, false, null);
    }
    add('Ear_'+side, ellipsoid([s*0.94,3.72,-0.02], [0.325,0.34,0.23], -s*0.20), materials.charcoal, 'Ear_'+side, true);
    add('InnerEar_'+side, ellipsoid([s*0.94,3.735,0.177], [0.196,0.21,0.036], -s*0.20), materials.nose, 'Ear_'+side, true);
    add('EyePatch_'+side, patch(headSurface, [s*0.432,-0.025], [0.225,0.345], s*0.36, 0.025, 0.014), materials.charcoal, 'Head', true);
    const eyeX = s*0.518, eyeY = 2.95, eyeZ = 0.749;
    add('EyeWhite_'+side, ellipsoid([eyeX,eyeY,eyeZ], [0.164,0.069,0.035], -s*0.08), materials.white, 'Head', true);
    add('Pupil_'+side, ellipsoid([eyeX-s*0.012,eyeY+0.005,eyeZ+0.033], [0.071,0.062,0.012]), materials.pupil, 'Head', true);
    add('EyeGlint_'+side, ellipsoid([eyeX-s*0.032,eyeY+0.027,eyeZ+0.047], [0.021,0.010,0.007], 0, 16), materials.glint, 'Head', true);
    add('Lid_'+side, ellipsoid([eyeX,eyeY+0.081,eyeZ+0.019], [0.181,0.096,0.040], -s*0.08), materials.charcoal, 'Head', true, V([0,-0.099,0.008]));
    stroke('Smile_'+side, [[0,2.622,0.923],[s*0.08,2.590,0.918],[s*0.155,2.605,0.879],[s*0.183,2.632,0.861]], 0.010, materials.mouth, 'Jaw', true);
  }
  add('TailShape', ellipsoid([0,0.89,-1.10],[0.27,0.26,0.25]), materials.cream, 'Tail');

  // Tapered locks add a little plush silhouette without shader-only fur.
  function tuft(name, points, radius, skin, isHead) {
    const curve = new THREE.CatmullRomCurve3(points.map(V));
    const steps = 12, sides = 8, frames = curve.computeFrenetFrames(steps, false);
    const p = [], uv = [], ix = [];
    for(let i=0; i<=steps; i++) {
      const center = curve.getPointAt(i/steps);
      const width = radius * Math.pow(1-i/steps, 0.75) + 0.0008;
      for(let j=0; j<=sides; j++) {
        const angle = j/sides*Math.PI*2;
        const point = center.clone().addScaledVector(frames.normals[i], Math.cos(angle)*width).addScaledVector(frames.binormals[i], Math.sin(angle)*width);
        p.push(...point.toArray()); uv.push(j/sides,i/steps);
        if(i<steps && j<sides) {
          const k = i*(sides+1)+j;
          ix.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(ix);
    add(name,g,materials.cream,skin,isHead);
  }
  for(let i=0; i<3; i++) {
    const x = (i-1)*0.12;
    tuft('CrownTuft_'+i, [[x,3.85,0.01],[x-0.04,3.97+i*0.018,0.01],[x-0.10,4.06-Math.abs(i-1)*0.05,-0.035]], 0.075, 'Head', true);
    for(const s of [-1,1]) {
      const y = 2.76-i*0.12;
      tuft('CheekTuft_'+s+'_'+i, [[s*1.12,y,0.20],[s*1.23,y-0.015,0.20],[s*(1.32-i*0.025),y+0.05,0.14]], 0.066, 'Head', true);
    }
  }
  for(let i=0; i<3; i++) {
    const x = (i-1)*0.11;
    tuft('ChestTuft_'+i, [[x,2.37,0.98],[x,2.40,1.01],[x+(i-1)*0.025,2.44,1.045]], 0.05, 'Torso', false);
  }

  function quaternionTrack(name, times, angles) {
    return new THREE.QuaternionKeyframeTrack(name+'.quaternion', times, angles.flatMap(a =>
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...a)).toArray()));
  }
  const t = [0,1,2,3,4];
  const idle = new THREE.AnimationClip('Breathe',4,[
    new THREE.VectorKeyframeTrack('Torso.scale', t, [1,1,1, 1.007,1.012,1.013, 1.014,1.023,1.022, 1.007,1.012,1.013, 1,1,1]),
    quaternionTrack('Head',t,[[0,0,0],[0.012,0.01,-0.008],[0.02,0,0],[0.012,-0.01,0.008],[0,0,0]]),
  ]);
  const bt = [0,1.75,1.84,1.93,2.06,4];
  const blink = new THREE.AnimationClip('Blink',4,['L','R'].map(side =>
    new THREE.NumberKeyframeTrack('Lid_'+side+'.morphTargetInfluences[0]',bt,[0,0,1,1,0,0])));
  const wt = [0,0.45,0.9,1.2,1.5,1.8,2.1,2.55,3];
  const wave = new THREE.AnimationClip('Wave',3,[
    quaternionTrack('Shoulder_L',wt,[[0,0,0],[0,0,0.48],[0,0,0.95],[0,0,0.95],[0,0,0.95],[0,0,0.95],[0,0,0.95],[0,0,0.48],[0,0,0]]),
    quaternionTrack('Elbow_L',wt,[[0,0,0],[-0.1,0,0.28],[-0.18,0,0.65],[-0.18,0,0.80],[-0.18,0,0.55],[-0.18,0,0.80],[-0.18,0,0.55],[-0.1,0,0.28],[0,0,0]]),
    quaternionTrack('Wrist_L',wt,[[0,0,0],[0,0,0],[0,0,-0.16],[0,0,0.24],[0,0,-0.16],[0,0,0.24],[0,0,-0.16],[0,0,0],[0,0,0]]),
  ]);
  const nod = new THREE.AnimationClip('Nod',3,[
    quaternionTrack('Head',[0,0.5,1,1.5,2,2.5,3],[[0,0,0],[0.06,0,0],[0.18,0,0],[0,0,0],[0.13,0,0],[0.03,0,0],[0,0,0]]),
  ]);
  const animations = [idle,blink,wave,nod];
  model.animations = animations;
  function resetPose() {
    for(const b of boneList) { b.quaternion.identity(); b.scale.set(1,1,1); }
    for(const m of meshes) if(m.morphTargetInfluences) m.morphTargetInfluences.fill(0);
    model.updateMatrixWorld(true); skeleton.update();
  }
  function setSleepiness(amount) {
    const a = THREE.MathUtils.clamp(amount,0,0.75);
    for(const side of ['L','R']) model.getObjectByName('Lid_'+side).morphTargetInfluences[0] = a;
  }
  function dispose() {
    for(const mesh of meshes) mesh.geometry.dispose();
    for(const material of Object.values(materials)) material.dispose();
    normal?.dispose(); skeleton.dispose();
  }
  return { model, skeleton, bones, animations, materials, resetPose, setSleepiness, dispose };
}
