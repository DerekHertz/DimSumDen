Jevgrep: 12 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
- "apps/ui/src/scene/roam.mjs" — implementation, fixture, helper; locations only
- "apps/ui/src/App.jsx" — caller, helper; locations only
- "apps/ui/src/scene/roam.test.mjs" — test, fixture, helper; source below
- "apps/ui/src/scene/CameraRig.jsx" — helper; locations only
- "apps/ui/src/scene/horseshoe-layout.test.mjs" — test, fixture, helper; locations only
- "apps/ui/src/scene/camera-rig.mjs" — helper; locations only
- "apps/ui/src/scene/handoff-motion.test.mjs" — test; locations only
- "apps/ui/src/scene/iso-projection.mjs" — helper; locations only
- "apps/ui/src/scene/banquet-layout.mjs" — helper; source below
- "apps/ui/src/scene/camera-rig.test.mjs" — test; locations only
- "apps/ui/src/scene/tally-stele.test.mjs" — test; locations only
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md" — helper; locations only
End file list. Declaration locations follow source.

Source block "apps/ui/src/scene/roam.test.mjs" lines 28-36:
```
  }
});

const covered = (obstacles, x, z) => obstacles.some((o) => o.kind === "circle"
  ? Math.hypot(x - o.x, z - o.z) < o.r
  : x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1);
test("clearance footprints follow the horseshoe props, including the moved Cubs and Tally", () => {
  const obstacles = roamObstacles();
  for (const [x,z] of [[0,0], [1.5,0], [0,-2.4], [-3.0,-1.4], [3.0,-1.4], [-4.9,2], [4.9,2], [-1.8,3], [1.8,3]]) {
```

Source block "apps/ui/src/scene/banquet-layout.mjs" lines 44-50:
```
});

export const TABLE = { x: 0, z: 0, radius: 1.3, height: 0.7 };
export const CUB_BASKET = { x: -1.8, z: 3.0 };
export const CUB_BASKET_RADIUS = 0.55;

const STALL_SPACING = 0.75;
```

Declaration locations:
- "apps/ui/src/scene/roam.mjs"
  WALK_SPEED@7-7
  PAD@8-8
  rect@9-9
  roamObstacles@12-28
  walk@30-42
- "apps/ui/src/App.jsx"
  App@27-86
- "apps/ui/src/scene/roam.test.mjs"
  source@7-7
  source@9-21
  source@23-29
  covered@31-33
  source@34-40
  source@41-44
- "apps/ui/src/scene/CameraRig.jsx"
  CameraRig@11-114
- "apps/ui/src/scene/horseshoe-layout.test.mjs"
  source@9-9
  source@17-22
  source@23-28
  source@30-39
  box@49-49
  polygonsOverlap@52-57
  overlaps@59-59
  source@61-89
  rearAngle@95-98
  source@133-145
  source@147-154
- "apps/ui/src/scene/camera-rig.mjs"
- "apps/ui/src/scene/handoff-motion.test.mjs"
  source@10-35
  source@37-45
  source@47-55
- "apps/ui/src/scene/iso-projection.mjs"
  SIN_P@13-13
  COS_P@14-14
  TARGET@16-16
  targetOf@36-36
  screenToWorld@49-54
  cameraConfig@60-78
- "apps/ui/src/scene/banquet-layout.mjs"
  BAO@8-8
  seatAtRest@19-19
  TALLY_POSITION@30-30
  TALLY@31-37
  TABLE@46-46
  CUB_BASKET@47-47
  CUB_BASKET_RADIUS@48-48
  STALL_SPACING@50-50
  STALL_BASE_SLOTS@51-51
  BACK_PLATFORM@55-55
  PASS_SEATS@72-72
  STALLS@74-80
  STATION@82-85
  STALL_CENTERS@88-90
  stallYaw@93-96
  stallWidth@116-118
  stallCenterX@121-125
  PLATFORM_HALF_DEPTH@178-178
  PLATFORM_MARGIN@179-179
  clearOfKiosk@182-192
  clearOfBox@194-198
  clearance@201-206
- "apps/ui/src/scene/camera-rig.test.mjs"
  source@43-51
- "apps/ui/src/scene/tally-stele.test.mjs"
  source@9-9
  source@10-10
  read@16-16
  project@20-20
  rectOf@21-24
  boxPoints@25-25
  overlap@26-26
  abacusRect@28-28
  frameBottom@30-30
  frameTop@31-31
  source@93-100
  source@129-148
  source@150-158
  source@160-166
  source@168-173
- "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md"
  source@31-80

End context.
