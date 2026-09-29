import { Canvas } from "@react-three/fiber";
import { useLiveState } from "./live.js";
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

export function App() {
  const { snapshot, connection } = useLiveState();
  const placeholder = panelPlaceholder(connection);
  return (
    <div className="shell">
      <main aria-label="Den scene" className="scene">
        <Canvas aria-hidden="true" camera={{ position: [0, 1.2, 4], fov: 40 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} />
          {/* Ticket 08 replaces this placeholder with Bao and the SceneCell plushes. */}
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.6, 32, 16]} />
            <meshStandardMaterial color="#f2f0ea" />
          </mesh>
        </Canvas>
      </main>
      <aside aria-label="Control panel" className="panel">
        <header className="panel-header">
          <h1>Dim Sum Den</h1>
          <ConnectionPill connection={connection} />
        </header>
        {placeholder ? (
          <p className="muted">{placeholder}</p>
        ) : (
          SECTIONS.map(([id, heading]) => (
            <section key={id} aria-labelledby={`h-${id}`} className="slot" data-slot={id}>
              <h2 id={`h-${id}`}>{heading}</h2>
              {id === "queue" && snapshot ? <p className="muted small">{snapshot.tickets.length} tickets</p> : null}
            </section>
          ))
        )}
      </aside>
    </div>
  );
}
