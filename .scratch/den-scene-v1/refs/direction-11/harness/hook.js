
// ---- designer direction harness (scratch, not repo code): injected at the end of Den.jsx by plugin.mjs ----
let __once = false;
let __frames = 0;
globalThis.__figPost = (id, object) => {
  const O = globalThis.__OPT;
  if (!O || id !== "bao") return;
  const g = (n) => object.getObjectByName(n);
  if (O.root) g("root").scale.set(...O.root);
  if (O.head) g("head").scale.set(...O.head);
  if (O.ear) for (const n of ["ear_L", "ear_R"]) g(n).scale.set(...O.ear);
  if (O.arm) for (const n of ["arm_L", "arm_R"]) g(n).scale.set(...O.arm);
  if (!__once) {
    __once = true;
    const face = g("face");
    if (O.faceOpacity != null && face?.material) {
      face.material.transparent = true;
      face.material.opacity = O.faceOpacity;
      face.material.depthWrite = false;
    }
    if (O.soften) {
      const mesh = g('PA_Panda');
      const col = mesh.geometry.getAttribute('color');
      const pos = mesh.geometry.getAttribute('position');
      const sIdx = mesh.geometry.getAttribute('skinIndex');
      const sW = mesh.geometry.getAttribute('skinWeight');
      const names = mesh.skeleton.bones.map((b) => b.name);
      let n = 0;
      for (let i = 0; i < col.count; i++) {
        const ws = [sW.getX(i), sW.getY(i), sW.getZ(i), sW.getW(i)];
        const is = [sIdx.getX(i), sIdx.getY(i), sIdx.getZ(i), sIdx.getW(i)];
        const bi = is[ws.indexOf(Math.max(...ws))];
        if (names[bi] !== 'head') continue;
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (z < 0.1 || y < 0.15 || y > 0.55 || Math.abs(x) > 0.5) continue;
        const r = col.getX(i), gg = col.getY(i), b = col.getZ(i);
        if ((r + gg + b) / 3 > 0.25) continue;
        const k = O.soften.k, t = O.soften.to;
        col.setXYZ(i, r + (t - r) * k, gg + (t - gg) * k, b + (t - b) * k);
        n++;
      }
      col.needsUpdate = true;
      globalThis.__softened = n;
    }
    if (O.blush) {
      const head = g("head");
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(
          new THREE.CircleGeometry(O.blush.r, 28),
          new THREE.MeshBasicMaterial({ color: O.blush.color, transparent: true, opacity: O.blush.opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
        );
        m.position.set(sx * O.blush.x, O.blush.y, O.blush.z);
        m.rotation.y = sx * O.blush.yaw;
        head.add(m);
      }
    }
  }
  __frames++;
  if (O.measure && __frames === 12) {
    object.updateMatrixWorld(true);
    const mesh = g("PA_Panda");
    mesh.skeleton.update();
    const inv = object.matrixWorld.clone().invert();
    const v = object.position.clone();
    const n = mesh.geometry.getAttribute("position").count;
    const pts = []; const bonesN = []; const sIdx = mesh.geometry.getAttribute("skinIndex"); const sW = mesh.geometry.getAttribute("skinWeight"); const names = mesh.skeleton.bones.map((b) => b.name);
    for (let i = 0; i < n; i++) {
      mesh.getVertexPosition(i, v);
      v.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
      pts.push(v.x, v.y, v.z); let bi = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = [sW.getX, sW.getY, sW.getZ, sW.getW][k].call(sW, i); if (w > bw) { bw = w; bi = [sIdx.getX, sIdx.getY, sIdx.getZ, sIdx.getW][k].call(sIdx, i); } } bonesN.push(names[bi]);
    }
    globalThis.__surf = { pts, bones: bonesN };
  }
};
