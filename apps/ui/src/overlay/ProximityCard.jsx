const LABELS = { T: 'Message', F: 'Transcript', A: 'Allow', D: 'Deny' };
const NEXT = { T: 'Messaging coming next', F: 'Opens the live transcript', A: 'Permission decisions coming next', D: 'Permission decisions coming next' };
const STATES = { resident: 'Resident · no agent running', working: 'Working', 'needs-you': 'Needs your answer', blocked: 'Blocked' };

// den-v1/05: F opens the transcript when an agent is running. T, A and D stay read-only until their tickets land.
export function ProximityCard({ card, onTranscript, transcriptOpen = false }) {
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
        <button type="button" data-key={key} disabled={key !== 'F' || !card.actions.F.enabled} aria-pressed={key === 'F' ? transcriptOpen : undefined} onClick={key === 'F' ? () => onTranscript?.(card) : undefined} aria-describedby={`proximity-reason-${key}`}><kbd>{key}</kbd> {label}</button>
        <span id={`proximity-reason-${key}`}>{card.actions[key].reason || NEXT[key]}</span>
      </div>)}
    </div>
  </section>;
}
