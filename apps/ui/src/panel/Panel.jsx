// Panel sections for ticket 09: usage meter, queue, selected ticket + latest handoff.
// Agent text is untrusted: everything renders as React text nodes, never as HTML.
import { useEffect, useMemo, useState } from "react";
import { gatesModel, noteCounter, submitGate } from "./gates-model.mjs";
import { queueModel, detailModel } from "./queue-model.mjs";
import { usageMeterModel } from "./usage-meter-model.mjs";
import { parseMarkdown } from "./render-markdown.mjs";

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function UsageMeter({ usage }) {
  const now = useNow();
  const m = usageMeterModel(usage, now);
  return (
    <div className={`meter meter-${m.level}`}>
      <div className="meter-head">
        <span id="meter-label" className="overline">{m.label}</span>
        <span className="meter-value">{m.valueText}</span>
      </div>
      <div className="meter-track" role="meter" aria-labelledby="meter-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.ariaValueNow} aria-valuetext={m.ariaValueText}>
        <div className="meter-fill" style={{ width: `${m.fillPercent}%` }} />
      </div>
      {m.statusText ? <p className={`small meter-status meter-status-${m.level}`}>{m.statusText}</p> : null}
      {m.secondary ? <p className="small muted">{m.secondary}</p> : null}
    </div>
  );
}

function Row({ r, selected, onSelect }) {
  return (
    <li>
      <button type="button" className={`qrow${r.blocked ? " qrow-blocked" : ""}${selected ? " qrow-selected" : ""}`} aria-current={selected ? "true" : undefined} onClick={() => onSelect(r.ref)}>
        <span className="qrow-top">
          <span className="qpill" title={r.bumpLabel ?? undefined} aria-label={r.bumpLabel ? `${r.priorityLabel}. ${r.bumpLabel}` : undefined}>{r.priorityLabel}</span>
          <span className="qrow-title">{r.title}</span>
        </span>
        <span className="code-small muted">{r.ref}</span>
        <span className="small">{[r.cellType, r.status].filter(Boolean).join(" · ")}</span>
        {r.blockedText ? <span className="small">{r.blockedText}</span> : null}
        {r.blockedReason ? <span className="small qrow-reason">{r.blockedReason}</span> : null}
      </button>
    </li>
  );
}

export function Queue({ snapshot, selected, onSelect }) {
  const q = queueModel(snapshot);
  if (q.empty) return <p className="muted">Nothing queued. The board is clear.</p>;
  return (
    <>
      <ul className="qlist">
        {q.frontier.map((r) => <Row key={r.ref} r={r} selected={r.ref === selected} onSelect={onSelect} />)}
      </ul>
      {q.inFlight.length ? (
        <>
          <p className="overline">In flight</p>
          <ul className="qlist">
            {q.inFlight.map((r) => <Row key={r.ref} r={r} selected={r.ref === selected} onSelect={onSelect} />)}
          </ul>
        </>
      ) : null}
    </>
  );
}

function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (n.type === "strong") return <strong key={i}><Inline nodes={n.children} /></strong>;
    if (n.type === "code") return <code key={i}>{n.text}</code>;
    if (n.type === "link") return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer"><Inline nodes={n.children} /></a>;
    return <span key={i}>{n.text}</span>;
  });
}

export function Markdown({ text }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return blocks.map((b, i) => {
    if (b.type === "heading") {
      const level = Math.min(6, b.level + 2);
      const Tag = `h${level}`;
      return <Tag key={i} className="md-h"><Inline nodes={b.children} /></Tag>;
    }
    if (b.type === "list") {
      const Tag = b.ordered ? "ol" : "ul";
      return <Tag key={i}>{b.items.map((it, j) => <li key={j}><Inline nodes={it} /></li>)}</Tag>;
    }
    if (b.type === "code") return <pre key={i} className="md-code"><code>{b.text}</code></pre>;
    return <p key={i}><Inline nodes={b.children} /></p>;
  });
}

function ago(mtime, now) {
  const t = Date.parse(mtime ?? "");
  if (!Number.isFinite(t)) return null;
  return `updated ${Math.max(0, Math.round((now - t) / 60_000))} min ago`;
}

export function Detail({ snapshot, selected }) {
  const now = useNow();
  const d = detailModel(snapshot, selected);
  if (d.kind === "none") return <p className="muted">{d.message}</p>;
  return (
    <div aria-live="off">
      <p className="detail-title">{d.title}</p>
      <p className="code-small muted">{d.ref}</p>
      <p className="small">{[d.status, d.holder].filter(Boolean).join(" · ")}</p>
      {d.kind === "missing-handoff" ? (
        <p className="muted">{d.message}</p>
      ) : (
        <>
          <p className="small muted">{[d.handoff.path, ago(d.handoff.mtime, now)].filter(Boolean).join(" · ")}</p>
          <div className="md"><Markdown text={d.handoff.text} /></div>
          {d.handoff.truncated ? <p className="small muted">Handoff truncated. Open {d.handoff.path} for the rest.</p> : null}
        </>
      )}
    </div>
  );
}

function GateCard({ card }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const counter = noteCounter(note.length);
  const send = async (kind) => {
    setSending(true);
    setError(null);
    const r = await submitGate({ fetch: window.fetch.bind(window), ref: card.ref, kind, note });
    setSending(false);
    if (!r.ok) {
      setError(r.message);
      if (!r.retryable) setLocked(true);
    }
  };
  const disabled = sending || locked;
  return (
    <li className="gate-card">
      <p className="overline">{card.eyebrow}</p>
      <p className="detail-title">{card.title}</p>
      <p className="code-small muted">{card.ref}</p>
      <div aria-live="polite">
        {card.pending ? (
          <p className="small gate-pending">{card.pending.text}</p>
        ) : (
          <>
            <label className="small" htmlFor={`note-${card.ref}`}>Note (optional)</label>
            <textarea id={`note-${card.ref}`} className="gate-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            {counter.show ? <p className="small muted">{counter.text}</p> : null}
            <div className="gate-buttons">
              <button type="button" className="btn btn-solid" disabled={disabled} onClick={() => send(card.approveKind)}>{sending ? "Sending..." : card.approveLabel}</button>
              <button type="button" className="btn btn-outline" disabled={disabled} onClick={() => send(card.rejectKind)}>{sending ? "Sending..." : card.rejectLabel}</button>
            </div>
            {error ? <p className="small gate-error">{error}</p> : null}
          </>
        )}
      </div>
    </li>
  );
}

export function Gates({ snapshot }) {
  const g = gatesModel(snapshot);
  return <ul className="qlist">{g.cards.map((c) => <GateCard key={c.ref} card={c} />)}</ul>;
}
