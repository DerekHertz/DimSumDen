import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createBao } from './bao.mjs';
import { createWalkingBao } from '../../review/walking-panda.mjs';
import { createDenScene } from './den-scene.mjs';
import { compactPanda, compactEnvironment } from './compact.mjs';
import { createLiveDenController } from './controller.mjs';
import { createRestaurantDetails } from './restaurant.mjs';
import { loadPandaSettings } from './panda-settings.mjs';
import { loadReview } from '../../review/review-data.mjs';
import { prepareReviewLayout } from '../../review/layout.mjs';
import { createLeisure } from '../../review/leisure.mjs';
import { createReviewAgents } from '../../review/agents.mjs';
import { liveActorsFromSnapshot } from '../../review/live-actors.mjs';
import { createReviewLandscape, REVIEW_SKIES } from '../../review/landscape.mjs';
import { createConstructionPads } from '../../review/construction-pads.mjs';

// The den: PR #162's restaurant scene (site plan, stations, leisure gardens, build pads, simulated pandas)
// mounted inside the app's canvas. The wrapping App owns the camera, the overlays and the board state.
// Live ticket pandas, the frontier baskets and the tally still ride on the same den through the controller;
// the review pandas own the resident roles (so the controller leaves residents alone).

// Sample pandas from the old lab carry props; the review scene wants them bare.
function clearSampleProps(panda) {
  const old = [];
  panda.model.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) old.push(o); });
  for (const object of old) { object.removeFromParent(); object.geometry.dispose(); }
  if (panda.materials.scarf) { panda.materials.scarf.dispose(); delete panda.materials.scarf; }
}

// Whatever the user chose while reviewing the den (visual direction, panda shape) is the den's look.
function savedLook() {
  const review = loadReview();
  return { direction: review?.direction || 'traveler', settings: review?.settings || loadPandaSettings() };
}

export function RestaurantDen({ snapshot, cells, frontier, tally, selected, onSelect, onOpenTally, stage, onReady }) {
  const [den, setDen] = useState(null);
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [look] = useState(savedLook);
  const live = useRef(null);
  const inputs = useRef({}); inputs.current = { cells, frontier, tally, selected, onSelect, onOpenTally };
  const { scene } = useThree();
  const sampleId = dark ? 'lantern' : 'morning';

  useEffect(() => {
    const theme = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDark(theme.matches);
    theme.addEventListener('change', onChange);
    return () => theme.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const d = createDenScene(THREE, createBao, (T, B) => createWalkingBao(T, B, look.settings));
    d.setLabels(false); d.setLanterns(sampleId === 'lantern');
    for (const p of d.pandas) clearSampleProps(p);
    for (const p of d.pandas) compactPanda(THREE, p);
    prepareReviewLayout(d);
    compactEnvironment(THREE, d);
    const details = createRestaurantDetails(d, sampleId);
    const leisure = createLeisure(d, createBao);
    const landscape = createReviewLandscape(d, sampleId);
    const construction = createConstructionPads(d);
    for (const resident of leisure.residents) if (!leisure.dragon.performers.includes(resident)) resident.model.visible = false;
    const agents = createReviewAgents(d, createBao, { direction: look.direction });
    const controller = createLiveDenController(d, {
      manageResidents: false,
      onCreate: (p) => compactPanda(THREE, p),
      onRemove: (ref) => stage.anchors.delete(ref),
    });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const previous = { background: scene.background, fog: scene.fog };
    scene.background = new THREE.Color(REVIEW_SKIES[sampleId]);
    scene.fog = new THREE.Fog(REVIEW_SKIES[sampleId], 70, 115);
    live.current = { den: d, controller, media, details, leisure, agents, time: 0 };
    setDen(d); onReady(d);
    return () => {
      onReady(null); live.current = null;
      controller.dispose(); agents.dispose(); details.dispose(); leisure.dispose(); landscape.dispose(); construction.dispose(); d.dispose();
      scene.background = previous.background; scene.fog = previous.fog;
      stage.anchors.clear();
    };
  }, [scene, stage, onReady, sampleId, look]);

  useEffect(() => {
    const c = live.current?.controller;
    if (c) c.sync(cells, frontier, tally?.rods);
  }, [den, cells, frontier, tally]);

  // Real agents drive the role pandas (den-layout/03). The adapter is re-run each second so a tool-call
  // bubble fades after its TTL without waiting for a new snapshot.
  useEffect(() => {
    const agents = live.current?.agents;
    if (!agents) return undefined;
    const bind = () => agents.applyLive(liveActorsFromSnapshot(snapshot, { now: Date.now() }));
    bind();
    const timer = setInterval(bind, 1000);
    return () => clearInterval(timer);
  }, [den, snapshot]);

  useFrame((_, delta) => {
    const l = live.current; if (!l) return;
    const reduced = l.media.matches, dt = Math.min(delta, 0.1);
    l.controller.update(dt, {
      reducedMotion: reduced, roaming: false, selected: inputs.current.selected,
      player: stage.explorer?.active ? stage.explorer.camera.position : null,
    });
    if (!reduced) l.time += dt;
    l.details.update(l.time, reduced); l.leisure.update(l.time, reduced); l.agents.update(reduced ? 0 : dt, reduced);
    l.den.world.updateMatrixWorld(true);
    for (const [ref, { panda }] of l.controller.figures) {
      stage.anchors.set(ref, panda.model.localToWorld(new THREE.Vector3(0, 4.45, 0)));
    }
    for (const [ref, basket] of l.den.frontier) stage.anchors.set(ref, basket.localToWorld(new THREE.Vector3(0, 0.6, 0)));
  });

  const hit = (e) => {
    let object = e.object;
    while (object) {
      const ref = object.userData.ticketRef;
      if (ref) { e.stopPropagation(); inputs.current.onSelect(ref); return; }
      if (object.name === 'Tally abacus') { e.stopPropagation(); stage.tallyHit = true; inputs.current.onOpenTally(); return; }
      object = object.parent;
    }
  };
  const lantern = sampleId === 'lantern';
  return <>
    <hemisphereLight args={['#fff5db', '#627858', lantern ? 1.1 : 2.2]} />
    <directionalLight position={[-10, 18, 12]} intensity={lantern ? 1.4 : 3} color={lantern ? '#ffc886' : '#fff3d5'} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-25} shadow-camera-right={25}
      shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={0.05} />
    <directionalLight position={[10, 8, -5]} intensity={1.1} color="#d6e9ff" />
    {den ? <primitive object={den.world} dispose={null} onClick={hit} /> : null}
  </>;
}
