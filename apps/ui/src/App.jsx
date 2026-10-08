import { Component, Suspense, useCallback, useMemo, useState } from "react";
import { Canvas, events as defaultEvents } from "@react-three/fiber";
import { CameraRig } from "./scene/procedural/CameraRig.jsx";
import { RestaurantDen } from "./scene/procedural/RestaurantDen.jsx";
import { PandaCard } from "./scene/procedural/PandaCard.jsx";
import { ProximityCard } from "./overlay/ProximityCard.jsx";
import { TranscriptPanel, useTranscript } from "./overlay/TranscriptPanel.jsx";
import { createDenCameraStore } from "./scene/procedural/camera.mjs";
import { STATION_LABELS, TALLY_ANCHOR } from "./scene/procedural/bindings.mjs";
import { denEvents } from "./scene/procedural/events.mjs";
import "./scene/procedural/den.css";
import { ChipLayer } from "./scene/ChipLayer.jsx";
import { MAX_PLUSH, sceneFromState, withPassCell } from "./scene/scene-from-state.mjs";
import { useLiveState } from "./live.js";
import { demoRequested, useDemoSnapshot, useHandoffs } from "./handoff-state.js";
import { useMetrics } from "./metrics-state.js";
import { dashboardModel } from "./panel/dashboard-model.mjs";
import { tallyRods } from "./scene/tally-face.mjs";
import { TallyCard } from "./scene/TallyCard.jsx";
import { useNow } from "./panel/Panel.jsx";
import { panelPlaceholder } from "./state/connection.mjs";
import { createCameraStore } from "./scene/camera-store.mjs";
import { LogoPill, Cards } from "./overlay/Cards.jsx";
import { useSession } from "./session/useSession.js";
import { ZoomSwitcher, IntentBar, Timeline } from "./overlay/Bottom.jsx";

class SceneBoundary extends Component {
  state={error:null};
  static getDerivedStateFromError(error){return {error};}
  render(){return this.state.error?<p className="den-error" role="alert">The 3D den could not load. Your board controls are still available. Reload to try again.</p>:this.props.children;}
}

function activeCount(snapshot) {
  const active = new Set(["claimed", "in-review", "blocked", "ready-for-human"]);
  const refs = new Set(snapshot.tickets.filter((t) => active.has(t.status)).map((t) => t.ref));
  for (const r of snapshot.frontier ?? []) refs.add(r);
  return refs.size;
}

export function App() {
  const live = useLiveState();
  const steering = useSession();
  const [demo] = useState(demoRequested);
  const demoSnapshot = useDemoSnapshot(demo);
  const { connection, metricsRevision } = live;
  const snapshot = demoSnapshot ?? live.snapshot;
  const placeholder = demo ? null : panelPlaceholder(connection);
  const [selected, setSelected] = useState(null);
  const stage = useMemo(() => ({ anchors: new Map(), camera: null, size: null, explorer: null, tallyAnchor: TALLY_ANCHOR }), []);
  const camera = useMemo(() => createDenCameraStore(createCameraStore(),()=>stage.explorer?.exit()), [stage]);
  const [den,setDen]=useState(null);
  const [exploring,setExploring]=useState(false);
  const [cursorFree, setCursorFree] = useState(false);
  const [nearby, setNearby] = useState(null);
  const onNearby = useCallback(card => setNearby(previous => JSON.stringify(previous) === JSON.stringify(card) ? previous : card), []);
  const releaseCursor = useCallback(() => stage.explorer?.freeCursor?.(), [stage]);
  const transcript = useTranscript({ card: nearby, exploring, onOpen: releaseCursor });
  const [exploreHint,setExploreHint]=useState('WASD / arrows to walk · drag to look · Esc to leave');
  const onDenReady=useCallback(value=>setDen(value),[]);
  const sceneEvents=useMemo(()=>state=>denEvents(defaultEvents(state),stage),[stage]);
  const selectTicket=useCallback(ref=>{stage.explorer?.exit();setSelected(ref);},[stage]);
  const closeTicket=useCallback(()=>{setSelected(null);document.querySelector('main[aria-label="Den scene"]')?.focus({preventScroll:true});},[]);
  const onExploreChange=useCallback(active=>{setExploring(active);setNearby(null);if(active){setSelected(null);setTallyOpen(false);}},[]);
  const frontier=snapshot?.frontier ?? [];
  const cells = useMemo(() => (snapshot ? sceneFromState(snapshot) : []), [snapshot]);
  // Bao's crown always holds the Pass: an idle stand-in when no orchestrator work is active.
  const sceneCells = useMemo(() => withPassCell(cells), [cells]);
  const sceneChips=useMemo(()=>[...cells,...frontier.map(ref=>({ref,cellType:'queued',pose:'idle'}))],[cells,frontier]);
  const handoffs = useHandoffs(snapshot);
  const { metrics, failed: metricsFailed, retry: retryMetrics } = useMetrics(metricsRevision);
  const dashboard = useMemo(() => dashboardModel(metrics, { error: metricsFailed }), [metrics, metricsFailed]);
  const now = useNow();
  const tally = useMemo(() => tallyRods(snapshot?.usage ?? null, dashboard, now), [snapshot?.usage, dashboard, now]);
  // Tally expands into an in-place card over the scene (nothing scrolls). Esc, Close and the pill return
  // focus to the pill; an outside pointerdown closes without moving focus.
  const [tallyOpen, setTallyOpen] = useState(false);
  const openTally = useCallback(() => {stage.explorer?.exit();setTallyOpen(true);}, [stage]);
  const closeTally = useCallback((restoreFocus = false) => {
    setTallyOpen(false);
    if (restoreFocus) document.querySelector(".chip-tally")?.focus({ preventScroll: true });
  }, []);
  const toggleTally = useCallback(() => {
    if (tallyOpen) closeTally(true);
    else openTally();
  }, [tallyOpen, openTally, closeTally]);
  const hearts = useMemo(() => new Set(handoffs.map((h) => h.ref)), [handoffs]);
  const overflow = snapshot ? Math.max(0, activeCount(snapshot) - MAX_PLUSH) : 0;
  return (
    <div className={`shell procedural-den${exploring ? " den-visiting" : ""}${cursorFree ? " den-cursor-free" : ""}`}>
      <main aria-label="Den scene" aria-keyshortcuts="ArrowLeft ArrowRight + -" tabIndex={0} className="scene">
        <SceneBoundary>
          <Canvas aria-hidden="true" orthographic shadows dpr={[1,1.5]}
            camera={{ manual: true, zoom: 1, near: 0.1, far: 160 }}
            gl={{antialias:true}} events={sceneEvents} onPointerMissed={() => setSelected(null)}>
            <CameraRig store={camera} stage={stage} den={den} onModeChange={onExploreChange} onHint={setExploreHint} onCursorChange={setCursorFree} />
            <Suspense fallback={null}>
              <RestaurantDen snapshot={snapshot} cells={sceneCells} frontier={frontier} tally={tally} onOpenTally={openTally}
                selected={selected} onSelect={selectTicket} stage={stage} onReady={onDenReady} onNearby={onNearby} />
            </Suspense>
          </Canvas>
        </SceneBoundary>
        <ChipLayer cells={sceneChips} labelsOverride={STATION_LABELS} hearts={hearts} onToggleTally={toggleTally} tallyOpen={tallyOpen} tally={tally} tickets={snapshot?.tickets} selected={selected} onSelect={selectTicket} stage={stage} />
        {tallyOpen ? <TallyCard tally={tally} metrics={metrics} failed={metricsFailed} onRetry={retryMetrics} onClose={closeTally} stage={stage} /> : null}
        {selected?<PandaCard snapshot={snapshot} selected={selected} onClose={closeTicket} />:null}
        {exploring ? <ProximityCard card={nearby} onTranscript={transcript.toggle} transcriptOpen={!!transcript.panel.agentId} /> : null}
        <TranscriptPanel tx={transcript} transcripts={live.transcripts} agents={snapshot?.agents} connection={connection} />
        <div className="den-crosshair" aria-hidden="true" hidden={!exploring || cursorFree}>+</div>
        {snapshot && cells.length === 0 ? <p className="scene-caption scene-empty">The den is quiet. No active tickets.</p> : null}
        {overflow > 0 ? <p className="scene-caption scene-more">+{overflow} more in queue</p> : null}
      </main>
      <LogoPill connection={connection} />
      <Cards snapshot={snapshot} now={now} connection={connection} placeholder={placeholder} camera={camera} steering={steering} />
      <div className="den-entry">
        <button type="button" className="btn btn-solid" aria-pressed={exploring} aria-disabled={!den || undefined}
          onClick={()=>{if(stage.explorer?.active)stage.explorer.exit();else stage.explorer?.enter();}}>
          {exploring?'Leave the den':'Enter the den'}
        </button>
        {exploring && cursorFree ? <button type="button" className="btn btn-outline" onClick={()=>{
          document.querySelector('main[aria-label="Den scene"]')?.focus({preventScroll:true});
          stage.explorer?.capture();
        }}>Look around</button> : null}
        <p className="den-walk-hint" hidden={!exploring}>{exploreHint}</p>
      </div>
      <nav className="den-walk-pad" aria-label="Walk around the den" hidden={!exploring}>
        <button type="button" data-den-walk="KeyW" aria-label="Walk forward">↑</button>
        <button type="button" data-den-walk="KeyA" aria-label="Walk left">←</button>
        <button type="button" data-den-walk="KeyS" aria-label="Walk backward">↓</button>
        <button type="button" data-den-walk="KeyD" aria-label="Walk right">→</button>
      </nav>
      <ZoomSwitcher camera={camera} />
      <IntentBar />
      <Timeline snapshot={snapshot} now={now} />
    </div>
  );
}
