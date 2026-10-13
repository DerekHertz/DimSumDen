// The floating cards over the scene (den-scene-v1/07, digest 2026-10-01-iso-den.md section 4): the logo pill top-left,
// and on the right a Needs you card and a Stations & queue card, each collapsible from its header.
// Agent text (ticket titles) is untrusted: everything renders as React text nodes, never as HTML.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { noteCounter, submitGate } from "../panel/gates-model.mjs";
import { DemoBadge } from "../demo/DemoControls.jsx";
import { createBridgeClient } from "../state/bridge-client.mjs";
import { STATION_HUE, badgeModel, needsYouModel, stationsModel, stepRequest } from "./overlay-model.mjs";
import { ROLE_OPTIONS, capacityFromSnapshot, defaultRole, dispatchPrompt, runState, slotRows } from "./run-model.mjs";

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

export function LogoPill({ connection, demo = false }) {
  const badge = badgeModel(connection);
  return (
    <header className="logo-pill" data-overlay="logo">
      <span className="logo-face" aria-hidden="true"><PandaFace /></span>
      <h1>Dim Sum Den</h1>
      {demo ? <DemoBadge /> : <span className={`live-badge live-${badge.tone}`} aria-live={badge.ariaLive ?? undefined}>
        <span className="live-dot" aria-hidden="true" />
        <span>{badge.label}</span>
        {badge.hint ? <span className="visually-hidden">{`. ${badge.hint}`}</span> : null}
      </span>}
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

// den-v1 loop: a permission request the bridge holds. Both buttons open the permission review, which shows the full
// tool input and sends the answer (ADR 0016 decision 6); nothing is sent from this card. E and Q are bound in App.
function PermissionDecision({ request, onAnswer }) {
  // No onAnswer: Demo mode, where nothing can be answered.
  const hint = onAnswer ? "Opens the permission request" : "Demo mode: actions are off";
  return (
    <div aria-live="polite">
      {request.expires ? <p className="small muted needs-expires">{request.expires}</p> : null}
      <div className="decision-buttons">
        <button type="button" className="btn btn-outline" data-answer="deny" aria-keyshortcuts="q" title={hint} disabled={!onAnswer} onClick={() => onAnswer?.(request.card)}>
          Deny<kbd aria-hidden="true">Q</kbd>
        </button>
        <button type="button" className="btn btn-solid" data-answer="allow" aria-keyshortcuts="e" title={hint} disabled={!onAnswer} onClick={() => onAnswer?.(request.card)}>
          Allow<kbd aria-hidden="true">E</kbd>
        </button>
      </div>
    </div>
  );
}

// organism-infra/228: Run starts an agent for a frontier ticket. The state that must outlive a row (a start in flight,
// the last refusal, the usage note) lives here, once, so the Stations row and the Needs you dispatch card agree.
const RUN_NOTICE = "Started. Usage reading unavailable.";
const refusalText = (e) => `Couldn't run: ${e?.status ? `${e.status} ` : ""}${e?.reason ?? "the bridge refused the request."}`;
const without = (obj, keep) => Object.fromEntries(Object.entries(obj).filter(([k, v]) => keep(k, v)));

export function useRunner(client) {
  const pending = useRef(new Set());
  const [inflight, setInflight] = useState(() => new Set());
  const [results, setResults] = useState({}); // ref -> { error } | { notice }
  const clear = useCallback((ref) => setResults((r) => (ref in r ? without(r, (k) => k !== ref) : r)), []);
  const start = useCallback(async (ref, role) => {
    if (pending.current.has(ref)) return; // one start per ref at a time; a second press while one is out is not a second request
    pending.current.add(ref);
    setInflight(new Set(pending.current));
    setResults((r) => without(r, (k, v) => k !== ref && !v.notice)); // the next press clears this ref's error and old notes
    try {
      const body = await client.dispatch(ref, { role });
      if (body?.usageUnknown === true) setResults((r) => ({ ...r, [ref]: { notice: RUN_NOTICE } }));
    } catch (e) {
      setResults((r) => ({ ...r, [ref]: { error: refusalText(e) } }));
    } finally {
      pending.current.delete(ref);
      setInflight(new Set(pending.current));
    }
  }, [client]);
  return useMemo(() => ({ inflight, results, start, clear }), [inflight, results, start, clear]);
}

const idPart = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "-");

/** Role select, Run, and the lines under them for one ticket: the disabled reason, a refusal, the usage note. */
function RunControl({ scope, ticket, capacity, steer, run }) {
  const [role, setRole] = useState(() => defaultRole(ticket));
  const ref = ticket.ref;
  const inflight = run.inflight.has(ref);
  const state = runState({ capacity, ticket, inflight, steer, role });
  const settled = runState({ capacity, ticket, inflight: false, steer, role });
  // The refusal clears when this row's state changes (an agent started or ended, the session ended), not only on the next press.
  const signature = `${settled.enabled}|${settled.reason}`;
  const seen = useRef(signature);
  useEffect(() => {
    if (seen.current === signature) return;
    seen.current = signature;
    run.clear(ref);
  }, [signature, ref, run]);

  const id = `${scope}-${idPart(ref)}`;
  const result = run.results[ref] ?? {};
  const showReason = state.reason && !inflight;
  return (
    <div className="run">
      <div className="run-controls">
        <label className="small muted run-label" htmlFor={`${id}-role`}>Role</label>
        <select id={`${id}-role`} className="run-select" value={role} disabled={!state.enabled} onChange={(e) => setRole(e.target.value)}>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          type="button"
          className="btn btn-solid run-btn"
          aria-label={`Run ${ref}`}
          aria-busy={inflight || undefined}
          aria-describedby={showReason ? `${id}-reason` : undefined}
          title={steer.demo ? "Demo mode: actions are off" : undefined}
          disabled={!state.enabled}
          onClick={() => run.start(ref, role)}
        >
          {inflight ? "Starting…" : "Run"}
        </button>
      </div>
      {showReason ? <p id={`${id}-reason`} className="small muted run-reason">{state.reason}</p> : null}
      {result.error ? <p className="small gate-error" role="alert">{result.error}</p> : null}
      {result.notice ? <p className="small muted">{result.notice}</p> : null}
    </div>
  );
}

/** The slot strip: one row per ref holding a slot, a live agent told from a lock by glyph, word and border, never hue alone. */
function SlotStrip({ snapshot, capacity }) {
  const rows = slotRows(capacity, snapshot?.agents);
  return (
    <section className="slots" aria-label="Slots">
      <div className="slots-head">
        <span className="ov">Slots</span>
        <span className="small">
          {!snapshot ? "Slots unavailable, bridge offline" : !capacity ? "Capacity unknown" : `${capacity.load} of ${capacity.max} running`}
        </span>
      </div>
      {rows.length > 0 ? (
        <ul className="slot-rows">
          {rows.map((r) => (
            <li key={r.ref} className="slot-row">
              <span className="visually-hidden">{r.label}</span>
              <span className={`slot-pip slot-pip-${r.kind}`} aria-hidden="true">{r.kind === "live" ? "▶" : "◌"}</span>
              <span className="code-small slot-ref" aria-hidden="true">{r.ref}</span>
              <span className={`slot-tag slot-tag-${r.kind}`} aria-hidden="true">{r.tag}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {rows.some((r) => r.kind === "lock") ? <p className="small muted slots-note">A lock with no agent costs a slot until it is reclaimed on the board.</p> : null}
    </section>
  );
}

export function NeedsYouCard({ snapshot, now, open, onToggle, busy, placeholder, session, onAnswer, capacity = null, steer = { state: "ready" }, run = null }) {
  const { count, requests } = needsYouModel(snapshot, now);
  const [shown, setShown] = useState(null);
  const current = requests.find((r) => r.key === shown) ?? requests[0] ?? null;
  const decision = useRef(null);
  // 228: a dispatch gate also gets Run, and at room 0 its prompt (note, Approve, Deny) is replaced by one line.
  const isDispatch = current?.kind === "gate" && current.gate === "dispatch";
  const prompt = isDispatch ? dispatchPrompt(capacity) : { show: true, line: null };
  const dispatchTicket = isDispatch ? (snapshot?.tickets ?? []).find((t) => t.ref === current.ref) ?? { ref: current.ref } : null;

  // Card-scoped keys: only while focus is inside this card and not in a text field. The Tally dialog and the
  // scene are outside it, so a, d, m, j and k never reach them from here or here from them.
  const onKeyDown = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isTextField(e.target) || !current) return;
    if (!prompt.show && (e.key === "a" || e.key === "d" || e.key === "m")) return; // no prompt on screen, so these keys do nothing
    if (e.key === "a") decision.current?.approve();
    else if (e.key === "d") decision.current?.deny();
    else if (e.key === "m") decision.current?.focusNote();
    else if (e.key === "j") setShown(stepRequest(requests, current.key, 1));
    else if (e.key === "k") setShown(stepRequest(requests, current.key, -1));
    else return;
    e.preventDefault();
  };

  const others = current ? requests.filter((r) => r.key !== current.key) : [];
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
            {current.preview.length > 0 ? <pre className="code-well"><code>{current.preview.join("\n")}</code></pre> : null}
            {isDispatch && run ? <RunControl key={`run-${current.key}`} scope="dispatch" ticket={dispatchTicket} capacity={capacity} steer={steer} run={run} /> : null}
            {current.kind === "permission"
              ? <PermissionDecision key={current.key} request={current} onAnswer={onAnswer} />
              : prompt.show
                ? <Decision key={current.key} ref={decision} request={current} session={session} />
                : <p className="small muted dispatch-line">{prompt.line}</p>}
            {others.length > 0 ? (
              <ul className="request-rows">
                {others.map((r) => (
                  <li key={r.key}>
                    <button type="button" className="request-row" onClick={() => setShown(r.key)}>
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

export function StationsCard({ snapshot, open, onToggle, busy, placeholder, onZoomStation, capacity = null, steer = { state: "ready" }, run = null }) {
  const m = stationsModel(snapshot);
  const listed = new Set(m.next.map((r) => r.ref));
  const notes = run ? Object.entries(run.results).filter(([ref, v]) => v.notice && !listed.has(ref)) : []; // the row left the list: say it here instead
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
      <SlotStrip snapshot={snapshot} capacity={capacity} />
      {notes.map(([ref, v]) => <p key={ref} className="small muted"><span className="code-small">{ref}</span> {v.notice}</p>)}
      <p className="ov">Next on the susan</p>
      {m.next.length === 0 ? (
        <p className="muted">The susan is empty.</p>
      ) : (
        <ul className="queue-rows queue-rows-scroll">
          {m.next.map((r) => (
            <li key={r.ref} className="queue-row">
              <div className="queue-line">
                <span className="pchip" title={r.priority}>{r.priority}</span>
                <span className="queue-title">{r.title}</span>
              </div>
              <span className="code-small muted queue-ref">{r.ref}</span>
              {run ? <RunControl scope="stations" ticket={{ ref: r.ref, type: r.type }} capacity={capacity} steer={steer} run={run} /> : null}
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
export function Cards({ snapshot, now, connection, placeholder, camera, steering, onAnswer, demo = false }) {
  const [needsOpen, setNeedsOpen] = useState(null); // null: follow the data
  const [stationsOpen, setStationsOpen] = useState(false);
  const waiting = needsYouModel(snapshot, now).count;
  const needs = needsOpen ?? (!isPhone() && waiting > 0);
  const busy = connection.phase !== "live";
  // 228: capacity is recomputed from the snapshot's agents and locks each render (the hub sends no capacity change frame).
  const client = useMemo(() => createBridgeClient({ fetch: steering.session.fetch }), [steering.session]);
  const run = useRunner(client);
  const capacity = capacityFromSnapshot(snapshot);
  const steer = { state: steering.state, demo };

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
      <NeedsYouCard snapshot={snapshot} now={now} open={needs} onToggle={toggleNeeds} busy={busy} placeholder={placeholder} session={steering.session} onAnswer={onAnswer} capacity={capacity} steer={steer} run={run} />
      <StationsCard snapshot={snapshot} open={stationsOpen} onToggle={toggleStations} busy={busy} placeholder={placeholder} onZoomStation={(id) => camera.goToStation(id)} capacity={capacity} steer={steer} run={run} />
    </div>
  );
}
