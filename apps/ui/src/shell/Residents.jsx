import { deskResidents } from './desk-model.mjs';

const STATES = { resident: 'At home', working: 'Working', 'needs-you': 'Needs you', blocked: 'Blocked' };

export function Residents({ snapshot, now, bindings, onPick }) {
  return <section className="forest-residents" aria-label="Residents and visitors">
    <p className="forest-muted">Fourteen familiar faces. Visiting agents gather beside their role’s workspace.</p>
    <ul>{deskResidents(snapshot, { now, bindings }).map(row => <li key={row.id}>
      <button type="button" onClick={() => onPick(row.id)}>
        <span className={`forest-dot state-${row.state}`} aria-hidden="true" />
        <span><strong>{row.name}{row.visitor ? ' · visitor' : ''}</strong><small>{row.role} · {row.station}{row.ref ? ` · ${row.ref}` : ''}</small></span>
        <span className="forest-resident-state">{STATES[row.state]}</span>
      </button>
    </li>)}</ul>
  </section>;
}
