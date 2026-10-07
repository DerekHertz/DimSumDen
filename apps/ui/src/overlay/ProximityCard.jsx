const LABELS = { T: 'Message', F: 'Transcript', A: 'Allow', D: 'Deny' };
const NEXT = { T: 'Messaging coming next', F: 'Transcript coming next', A: 'Permission decisions coming next', D: 'Permission decisions coming next' };
const STATES = { resident: 'Resident · no agent running', working: 'Working', 'needs-you': 'Needs your answer', blocked: 'Blocked' };

// Read-only in den-v1/04: capability flags describe what the runtime supports, but no action runs yet.
export function ProximityCard({ card }) {
  if (!card) return null;
  return <section className="proximity-card" role="region" aria-label="Nearby panda">
    <header>
      <p className="proximity-station">{card.station} · {card.role}</p>
      <h2>{card.name || card.role}</h2>
      <p className="proximity-state">{STATES[card.state] || card.state}</p>
    </header>
    {card.ref ? <p className="proximity-ticket">{card.ref}</p> : null}
    {card.tool ? <p className="proximity-tool"><strong>{card.tool.name}</strong>{card.tool.summary ? ` · ${card.tool.summary}` : ''}</p> : null}
    {card.approval ? <p className="proximity-pending">Permission request waiting</p> : null}
    <div className="proximity-actions">
      {Object.entries(LABELS).map(([key, label]) => <div key={key}>
        <button type="button" disabled aria-describedby={`proximity-reason-${key}`}><kbd>{key}</kbd> {label}</button>
        <span id={`proximity-reason-${key}`}>{card.actions[key].reason || NEXT[key]}</span>
      </div>)}
    </div>
  </section>;
}
