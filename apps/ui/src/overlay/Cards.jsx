// The floating cards over the scene (den-scene-v1/07, digest 2026-10-01-iso-den.md section 4): the logo pill top-left,
// and on the right a Needs you card and a Stations & queue card, each collapsible from its header.
// Agent text (ticket titles) is untrusted: everything renders as React text nodes, never as HTML.
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { noteCounter, submitGate } from "../panel/gates-model.mjs";
import { STATION_HUE, badgeModel, needsYouModel, stationsModel, stepRequest } from "./overlay-model.mjs";

const isPhone = () => typeof matchMedia === "function" && matchMedia("(max-width: 599px)").matches;
const isTextField = (el) => el instanceof Element && (el.closest("input, textarea, select, [contenteditable]") !== null);

function Chevron() {
  return (
    <svg className="card-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PandaFace() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" className="portrait-face">
      <circle cx="9" cy="10" r="5.5" fill="var(--panda-ink)" />
      <circle cx="31" cy="10" r="5.5" fill="var(--panda-ink)" />
      <circle cx="20" cy="22" r="13" fill="var(--panda-fur)" />
      <ellipse cx="14.5" cy="20" rx="3.4" ry="4.4" fill="var(--panda-ink)" transform="rotate(18 14.5 20)" />
      <ellipse cx="25.5" cy="20" rx="3.4" ry="4.4" fill="var(--panda-ink)" transform="rotate(-18 25.5 20)" />
      <ellipse cx="20" cy="26" rx="2.2" ry="1.5" fill="var(--panda-ink)" />
    </svg>
  );
}

export function LogoPill({ connection }) {
  const badge = badgeModel(connection);
  return (
    <header className="logo-pill" data-overlay="logo">
      <span className="logo-face" aria-hidden="true"><PandaFace /></span>
      <h1>Dim Sum Den</h1>
      <span className={`live-badge live-${badge.tone}`} aria-live={badge.ariaLive ?? undefined}>
        <span className="live-dot" aria-hidden="true" />
        <span>{badge.label}</span>
        {badge.hint ? <span className="visually-hidden">{`. ${badge.hint}`}</span> : null}
      </span>
    </header>
  );
}

/** A card: a header button (aria-expanded) that opens and closes a body. The body stays in the DOM, hidden, so aria-controls resolves. */
function Card({ id, overlay, label, edge, open, onToggle, title, aside, busy, children }) {
  return (
    <section className={`card card-${edge}`} data-overlay={overlay} aria-label={label} aria-busy={busy || undefined}>
      <h2 className="card-head">
        <button type="button" className="card-toggle" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
          <span className="card-title">{title}</span>{" "}
          {aside}
          <Chevron />
        </button>
      </h2>
      <div id={`${id}-body`} className="card-body" hidden={!open}>{children}</div>
    </section>
  );
}

const Decision = forwardRef(function Decision({ request, session }, ref) {
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const [sending, setSending] = useState(null);
  const inflight = useRef(new Set());
  const noteField = useRef(null);
  const counter = noteCounter(note.length);

  const send = useCallback(async (kind) => {
    if (inflight.current.has(kind)) return;
    inflight.current.add(kind);
    setSending(kind);
    setError(null);
    const r = await submitGate({ fetch: session.fetch, ref: request.ref, kind, note });
    inflight.current.delete(kind);
    setSending(null);
    if (!r.ok) {
      setError(r.message);
      if (!r.retryable) setLocked(true);
    }
  }, [request.ref, note, session]);

  const canAct = !locked && !request.pending;
  useImperativeHandle(ref, () => ({
    approve: () => { if (canAct) send(request.approveKind); },
    deny: () => { if (canAct) send(request.rejectKind); },
    focusNote: () => noteField.current?.focus(),
  }), [canAct, send, request.approveKind, request.rejectKind]);
  // Deny with message: Ctrl or Cmd + Enter in the Note denies with that note. Plain Enter adds a line.
  const onNoteKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && canAct) {
      e.preventDefault();
      send(request.rejectKind);
    }
  };

  if (request.pending) {
    return <p className="small gate-pending" aria-live="polite">{request.pending.text}</p>;
  }
  return (
    <div aria-live="polite">
      <label className="note-label" htmlFor="needs-note">Note<kbd aria-hidden="true">m</kbd></label>
      <textarea id="needs-note" ref={noteField} className="note-field" rows={2} maxLength={500} placeholder="Optional" aria-describedby="needs-note-help" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={onNoteKeyDown} />
      <p id="needs-note-help" className="small muted note-help">Ctrl Enter denies with this note</p>
      {counter.show ? <p className="small muted">{counter.text}</p> : null}
      <div className="decision-buttons">
        <button type="button" className="btn btn-solid" aria-keyshortcuts="a" disabled={locked} onClick={() => send(request.approveKind)}>
          {sending === request.approveKind ? "Sending…" : "Approve"}<kbd aria-hidden="true">a</kbd>
        </button>
        <button type="button" className="btn btn-outline" aria-keyshortcuts="d" disabled={locked} onClick={() => send(request.rejectKind)}>
          {sending === request.rejectKind ? "Sending…" : "Deny"}<kbd aria-hidden="true">d</kbd>
        </button>
      </div>
      {error ? <p className="small gate-error">{error}</p> : null}
    </div>
  );
});

export function NeedsYouCard({ snapshot, now, open, onToggle, busy, placeholder, session }) {
  const { count, requests } = needsYouModel(snapshot, now);
  const [shown, setShown] = useState(null);
  const current = requests.find((r) => r.ref === shown) ?? requests[0] ?? null;
  const decision = useRef(null);

  // Card-scoped keys: only while focus is inside this card and not in a text field. The Tally dialog and the
  // scene are outside it, so a, d, m, j and k never reach them from here or here from them.
  const onKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isTextField(e.target) || !current) return;
    if (e.key === "a") decision.current?.approve();
    else if (e.key === "d") decision.current?.deny();
    else if (e.key === "m") decision.current?.focusNote();
    else if (e.key === "j") setShown(stepRequest(requests, current.ref, 1));
    else if (e.key === "k") setShown(stepRequest(requests, current.ref, -1));
    else return;
    e.preventDefault();
  };

  const others = current ? requests.filter((r) => r.ref !== current.ref) : [];
  return (
    <div onKeyDown={onKeyDown} className="card-wrap">
      <Card
        id="needs-you"
        overlay="needs-you"
        label={count > 0 ? `Needs you, ${count} waiting` : "Needs you"}
        edge={count > 0 ? "lantern" : "line"}
        open={open}
        onToggle={onToggle}
        title="Needs you"
        aside={count > 0 ? <span className="count-pill">{count}</span> : null}
        busy={busy}
      >
        {placeholder ? <p className="muted">{placeholder}</p> : null}
        {!placeholder && !current ? <p className="muted">Nothing is waiting on you.</p> : null}
        {current ? (
          <>
            <div className="needs-head" aria-live="polite">
              <span className="portrait" style={{ "--zone": `var(${STATION_HUE[current.station]}-zone)` }} aria-hidden="true"><PandaFace /></span>
              <div className="needs-text">
                <p className="eyebrow">{current.eyebrow}</p>
                <p className="needs-title">{current.title}</p>
              </div>
            </div>
            <pre className="code-well"><code>{current.preview.join("\n")}</code></pre>
            <Decision key={current.ref} ref={decision} request={current} session={session} />
            {others.length > 0 ? (
              <ul className="request-rows">
                {others.map((r) => (
                  <li key={r.ref}>
                    <button type="button" className="request-row" onClick={() => setShown(r.ref)}>
                      <span className="request-row-text">{r.rowText}</span>
                      {r.age ? <span className="request-row-age">{r.age}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </Card>
    </div>
  );
}

export function StationsCard({ snapshot, open, onToggle, busy, placeholder, onZoomStation }) {
  const m = stationsModel(snapshot);
  return (
    <Card
      id="stations"
      overlay="stations"
      label="Stations & queue"
      edge="line"
      open={open}
      onToggle={onToggle}
      title="Stations & queue"
      aside={<span className="card-summary">{m.summary}</span>}
      busy={busy}
    >
      {placeholder ? <p className="muted">{placeholder}</p> : null}
      <div className="pills">
        {m.open.map((s) => (
          <button key={s.id} type="button" className="pill-station" data-station-pill={s.id} style={{ "--hue": `var(${STATION_HUE[s.id]})` }} onClick={() => onZoomStation(s.id)}>
            <span className="station-dot" aria-hidden="true">{s.glyph}</span>
            <span className="station-name">{s.name}</span>
            <span className="station-count">{s.count}</span>
            {s.waiting ? <span className="station-waiting">· waiting</span> : null}
          </button>
        ))}
        {m.dormant.map((s) => (
          <span key={s.id} className="pill-station pill-dormant" data-station-pill={s.id}>
            <span className="station-glyph" aria-hidden="true">{s.glyph}</span>
            <span className="station-name">{s.name}</span>
            <span className="station-count">{s.text}</span>
          </span>
        ))}
      </div>
      <p className="ov">Next on the susan</p>
      {m.next.length === 0 ? (
        <p className="muted">The susan is empty.</p>
      ) : (
        <ul className="queue-rows">
          {m.next.map((r) => (
            <li key={r.ref} className="queue-row">
              <span className="pchip" title={r.priority}>{r.priority}</span>
              <span className="queue-title">{r.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * The right-hand column. Needs you opens by itself while something waits, until the user toggles it; Stations & queue
 * starts closed. Under 600 px both start closed and opening one closes the other.
 */
export function Cards({ snapshot, now, connection, placeholder, camera, steering }) {
  const [needsOpen, setNeedsOpen] = useState(null); // null: follow the data
  const [stationsOpen, setStationsOpen] = useState(false);
  const waiting = needsYouModel(snapshot, now).count;
  const needs = needsOpen ?? (!isPhone() && waiting > 0);
  const busy = connection.phase !== "live";

  const toggleNeeds = () => {
    setNeedsOpen(!needs);
    if (!needs && isPhone()) setStationsOpen(false);
  };
  const toggleStations = () => {
    setStationsOpen(!stationsOpen);
    if (!stationsOpen && isPhone()) setNeedsOpen(false);
  };
  return (
    <div className="cards">
      {steering.message ? <p className="small muted session-none" data-session="none" role="status">{steering.message}</p> : null}
      <NeedsYouCard snapshot={snapshot} now={now} open={needs} onToggle={toggleNeeds} busy={busy} placeholder={placeholder} session={steering.session} />
      <StationsCard snapshot={snapshot} open={stationsOpen} onToggle={toggleStations} busy={busy} placeholder={placeholder} onZoomStation={(id) => camera.goToStation(id)} />
    </div>
  );
}
