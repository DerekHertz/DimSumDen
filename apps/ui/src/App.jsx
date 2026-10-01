import { Suspense, useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./scene/CameraRig.jsx";
import { Den } from "./scene/Den.jsx";
import { ChipLayer } from "./scene/ChipLayer.jsx";
import { MAX_PLUSH, sceneFromState, withPassCell } from "./scene/scene-from-state.mjs";
import { useLiveState } from "./live.js";
import { demoRequested, useDemoSnapshot, useHandoffs } from "./handoff-state.js";
import { useMetrics } from "./metrics-state.js";
import { dashboardModel } from "./panel/dashboard-model.mjs";
import { tallyRods } from "./scene/tally-face.mjs";
import { TallyCard } from "./scene/TallyCard.jsx";
import { trackedTickets } from "./scene/handoffs.mjs";
import { UsageMeter, Queue, Detail, Gates, useNow } from "./panel/Panel.jsx";
import { gatesModel } from "./panel/gates-model.mjs";
import { pillModel, panelPlaceholder } from "./state/connection.mjs";

function ConnectionPill({ connection }) {
  const pill = pillModel(connection);
  return (
    <span className={`pill pill-${pill.tone}`} aria-live={pill.ariaLive ?? undefined}>
      <span className="pill-dot" aria-hidden="true" />
      {pill.label}
    </span>
  );
}

// Section slots for tickets 09 to 11. Headings only in the shell.
const SECTIONS = [
  ["usage", "Plan usage (5 h)"],
  ["gates", "Needs you"],
  ["queue", "Queue"],
  ["detail", "Selected ticket"],
];

function activeCount(snapshot) {
  const active = new Set(["claimed", "in-review", "blocked", "ready-for-human"]);
  const refs = new Set(snapshot.tickets.filter((t) => active.has(t.status)).map((t) => t.ref));
  for (const r of snapshot.frontier ?? []) refs.add(r);
  return refs.size;
}

export function App() {
  const live = useLiveState();
  const [demo] = useState(demoRequested);
  const demoSnapshot = useDemoSnapshot(demo);
  const { connection, metricsRevision } = live;
  const snapshot = demoSnapshot ?? live.snapshot;
  const placeholder = demo ? null : panelPlaceholder(connection);
  const [selected, setSelected] = useState(null);
  const stage = useMemo(() => ({ anchors: new Map(), camera: null, size: null }), []);
  const cells = useMemo(() => (snapshot ? sceneFromState(snapshot) : []), [snapshot]);
  // Bao's crown always holds the Pass: an idle stand-in when no orchestrator work is active.
  const sceneCells = useMemo(() => withPassCell(cells), [cells]);
  const handoffs = useHandoffs(snapshot);
  const { metrics, failed: metricsFailed, retry: retryMetrics } = useMetrics(metricsRevision);
  const dashboard = useMemo(() => dashboardModel(metrics, { error: metricsFailed }), [metrics, metricsFailed]);
  const now = useNow();
  const tally = useMemo(() => tallyRods(snapshot?.usage ?? null, dashboard, now), [snapshot?.usage, dashboard, now]);
  // Tally expands into an in-place card over the scene (nothing scrolls). Esc, Close and the pill return
  // focus to the pill; an outside pointerdown closes without moving focus.
  const [tallyOpen, setTallyOpen] = useState(false);
  const openTally = useCallback(() => setTallyOpen(true), []);
  const closeTally = useCallback((restoreFocus = false) => {
    setTallyOpen(false);
    if (restoreFocus) document.querySelector(".chip-tally")?.focus({ preventScroll: true });
  }, []);
  const toggleTally = useCallback(() => {
    if (tallyOpen) closeTally(true);
    else openTally();
  }, [tallyOpen, openTally, closeTally]);
  const hearts = useMemo(() => new Set(handoffs.map((h) => h.ref)), [handoffs]);
  const baskets = useMemo(
    () => [...trackedTickets(snapshot)].map(([ref, t]) => ({ ref, station: t.station })),
    [snapshot],
  );
  const overflow = snapshot ? Math.max(0, activeCount(snapshot) - MAX_PLUSH) : 0;
  return (
    <div className="shell">
      <main aria-label="Den scene" aria-keyshortcuts="ArrowLeft ArrowRight + -" tabIndex={0} className="scene">
        <Canvas aria-hidden="true" orthographic camera={{ manual: true, zoom: 1, near: 0.1, far: 120 }} onPointerMissed={() => setSelected(null)}>
          <CameraRig />
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} />
          <Suspense fallback={null}>
            <Den cells={sceneCells} baskets={baskets} handoffs={handoffs} tally={tally} onOpenTally={openTally} selected={selected} onSelect={setSelected} stage={stage} />
          </Suspense>
        </Canvas>
        <ChipLayer cells={cells} hearts={hearts} onToggleTally={toggleTally} tallyOpen={tallyOpen} tally={tally} tickets={snapshot?.tickets} selected={selected} onSelect={setSelected} stage={stage} />
        {tallyOpen ? <TallyCard tally={tally} metrics={metrics} failed={metricsFailed} onRetry={retryMetrics} onClose={closeTally} stage={stage} /> : null}
        {snapshot && cells.length === 0 ? <p className="scene-caption scene-empty">The den is quiet. No active tickets.</p> : null}
        {overflow > 0 ? <p className="scene-caption scene-more">+{overflow} more in queue</p> : null}
      </main>
      <aside aria-label="Control panel" className="panel">
        <header className="panel-header">
          <h1>Dim Sum Den</h1>
          <ConnectionPill connection={connection} />
        </header>
        {placeholder ? (
          <p className="muted">{placeholder}</p>
        ) : (
          SECTIONS.filter(([id]) => id !== "gates" || gatesModel(snapshot).visible).map(([id, heading]) => (
            <section key={id} aria-labelledby={`h-${id}`} className="slot" data-slot={id}>
              <h2 id={`h-${id}`}>{heading}{id === "gates" ? <span className="gate-count">{gatesModel(snapshot).count}</span> : null}</h2>
              {id === "usage" && snapshot ? <UsageMeter usage={snapshot.usage} /> : null}
              {id === "gates" ? <Gates snapshot={snapshot} /> : null}
              {id === "queue" && snapshot ? <Queue snapshot={snapshot} selected={selected} onSelect={setSelected} /> : null}
              {id === "detail" && snapshot ? <Detail snapshot={snapshot} selected={selected} /> : null}
            </section>
          ))
        )}
      </aside>
    </div>
  );
}
