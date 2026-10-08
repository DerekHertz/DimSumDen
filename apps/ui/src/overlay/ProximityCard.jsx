import { pendingLine } from './proximity-card.mjs';

const LABELS = { T: 'Message', F: 'Transcript', A: 'Allow', D: 'Deny' };
const NEXT = { T: 'Opens the message box', F: 'Opens the live transcript', A: 'Opens the permission request', D: 'Opens the permission request' };
const STATES = { resident: 'Resident · no agent running', working: 'Working', 'needs-you': 'Needs your answer', blocked: 'Blocked' };

// den-v1/05: F opens the transcript when an agent is running. den-v1/06: A and D open the permission review when an
// approval is pending (and not in demo mode). den-v1/07: T opens the message composer and the card shows the latest message's status line.
const DEMO_REASON = 'Demo mode: actions are off';
export function ProximityCard({ card, onTranscript, onAnswer, onMessage, status = null, transcriptOpen = false, demo = false }) {
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
        const enabled = key === 'F' ? card.actions.F.enabled : key === 'T' ? card.actions.T.enabled && !demo : card.actions[key].enabled && !demo;
        const onClick = key === 'F' ? () => onTranscript?.(card) : key === 'T' ? () => onMessage?.(card) : () => onAnswer?.(card);
        const reason = (answer || key === 'T') && demo ? DEMO_REASON : card.actions[key].reason || NEXT[key];
        return <div key={key}>
          <button type="button" data-key={key} disabled={!enabled} aria-pressed={key === 'F' ? transcriptOpen : undefined} onClick={onClick} aria-describedby={`proximity-reason-${key}`}><kbd>{key}</kbd> {label}</button>
          <span id={`proximity-reason-${key}`}>{reason}</span>
        </div>;
      })}
    </div>
    {status ? <p className="proximity-message" data-kind={status.kind}><span className="proximity-message-dot" aria-hidden="true" /><strong>{status.label}</strong> <span className="proximity-message-preview">{status.preview}</span></p> : null}
  </section>;
}
