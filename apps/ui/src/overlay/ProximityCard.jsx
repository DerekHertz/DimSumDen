import { pendingLine } from './proximity-card.mjs';

const LABELS = { T: 'Message', F: 'Transcript', A: 'Allow', D: 'Deny' };
const NEXT = { T: 'Messaging coming next', F: 'Opens the live transcript', A: 'Opens the permission request', D: 'Opens the permission request' };
const STATES = { resident: 'Resident · no agent running', working: 'Working', 'needs-you': 'Needs your answer', blocked: 'Blocked' };

// den-v1/05: F opens the transcript when an agent is running. den-v1/06: A and D open the permission review when an
// approval is pending (and not in demo mode). T stays read-only until its ticket lands.
const DEMO_REASON = 'Demo mode: actions are off';
export function ProximityCard({ card, onTranscript, onAnswer, transcriptOpen = false, demo = false }) {
  if (!card) return null;
  return <section className="proximity-card" role="region" aria-label="Nearby panda">
    <header>
      <p className="proximity-station">{card.station} · {card.role}</p>
      <h2>{card.name || card.role}</h2>
      <p className="proximity-state">{STATES[card.state] || card.state}</p>
    </header>
    {card.ref ? <p className="proximity-ticket">{card.ref}</p> : null}
    {card.tool ? <p className="proximity-tool"><strong>{card.tool.name}</strong>{card.tool.summary ? ` · ${card.tool.summary}` : ''}</p> : null}
    {card.approval ? <p className="proximity-pending"><span className="proximity-lantern" aria-hidden="true" />{pendingLine(card)}</p> : null}
    <div className="proximity-actions">
      {Object.entries(LABELS).map(([key, label]) => {
        const answer = key === 'A' || key === 'D';
        const enabled = key === 'F' ? card.actions.F.enabled : answer ? card.actions[key].enabled && !demo : false;
        const onClick = key === 'F' ? () => onTranscript?.(card) : answer ? () => onAnswer?.(card) : undefined;
        const reason = answer && demo ? DEMO_REASON : card.actions[key].reason || NEXT[key];
        return <div key={key}>
          <button type="button" data-key={key} disabled={!enabled} aria-pressed={key === 'F' ? transcriptOpen : undefined} onClick={onClick} aria-describedby={`proximity-reason-${key}`}><kbd>{key}</kbd> {label}</button>
          <span id={`proximity-reason-${key}`}>{reason}</span>
        </div>;
      })}
    </div>
  </section>;
}
