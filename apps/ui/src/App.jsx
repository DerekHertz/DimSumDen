import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraRig } from "./scene/CameraRig.jsx";
import { Den } from "./scene/Den.jsx";
import { ChipLayer } from "./scene/ChipLayer.jsx";
import { MAX_PLUSH, sceneFromState } from "./scene/scene-from-state.mjs";
import { useLiveState } from "./live.js";
import { UsageMeter, Queue, Detail, Gates } from "./panel/Panel.jsx";
import { Dashboard } from "./panel/Dashboard.jsx";
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
  ["dashboard", "Pipeline"],
];

function activeCount(snapshot) {
  const active = new Set(["claimed", "in-review", "blocked", "ready-for-human"]);
  const refs = new Set(snapshot.tickets.filter((t) => active.has(t.status)).map((t) => t.ref));
  for (const r of snapshot.frontier ?? []) refs.add(r);
  return refs.size;
}

export function App() {
  const { snapshot, connection, metricsRevision } = useLiveState();
  const placeholder = panelPlaceholder(connection);
  const [selected, setSelected] = useState(null);
  const stage = useMemo(() => ({ anchors: new Map(), camera: null, size: null }), []);
  const cells = useMemo(() => (snapshot ? sceneFromState(snapshot) : []), [snapshot]);
  const overflow = snapshot ? Math.max(0, activeCount(snapshot) - MAX_PLUSH) : 0;
  return (
    <div className="shell">
      <main aria-label="Den scene" aria-keyshortcuts="ArrowLeft ArrowRight + -" tabIndex={0} className="scene">
        <Canvas aria-hidden="true" camera={{ position: [0, 4.2, 11.5], fov: 38, rotation: [-0.2, 0, 0] }} onPointerMissed={() => setSelected(null)}>
          <CameraRig />
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} />
          <Suspense fallback={null}>
            <Den cells={cells} frontier={snapshot?.frontier ?? []} selected={selected} onSelect={setSelected} stage={stage} />
          </Suspense>
        </Canvas>
        <ChipLayer cells={cells} tickets={snapshot?.tickets} selected={selected} onSelect={setSelected} stage={stage} />
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
              {id === "dashboard" ? <Dashboard metricsRevision={metricsRevision} /> : null}
            </section>
          ))
        )}
      </aside>
    </div>
  );
}
