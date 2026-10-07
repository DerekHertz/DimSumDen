// den-scene-v1/09: turns a headgear.mjs part list into a three.js group, one mesh per part, named by the part.
// Meshes share the geometry and materials of the group they were built into; clone the group per panda.
import * as THREE from "three";
import { materialProps } from "./headgear.mjs";

function geometryOf({ kind, params: p }) {
  switch (kind) {
    case "lathe": return new THREE.LatheGeometry(p.points.map(([r, y]) => new THREE.Vector2(r, y)), p.segments);
    case "torus": return new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments, p.arc);
    case "cylinder": return new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments, 1, p.openEnded);
    case "box": return new THREE.BoxGeometry(p.width, p.height, p.depth);
    case "sphere": return new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
    default: throw new Error(`unknown part kind ${kind}`);
  }
}

export function buildGear(parts) {
  const group = new THREE.Group();
  for (const part of parts) {
    const { opacity, ...props } = materialProps(part.material);
    const material = new THREE.MeshStandardMaterial({
      ...props,
      color: part.color,
      side: THREE.DoubleSide, // open-ended bands and lathes are seen from inside too
      ...(opacity < 1 ? { transparent: true, opacity } : {}),
    });
    const mesh = new THREE.Mesh(geometryOf(part), material);
    mesh.name = part.name;
    mesh.position.set(...part.position);
    if (part.rotation) mesh.rotation.set(...part.rotation);
    if (part.scale) mesh.scale.set(...part.scale);
    mesh.userData.gearMaterial = part.material;
    group.add(mesh);
  }
  return group;
}
