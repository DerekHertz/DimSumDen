import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { initialTranscriptState, transcriptKey, transcriptToggle, closeTranscript } from "./transcript-panel.mjs";
import { transcriptView } from "./transcript-view.mjs";

const STATES = { working: "Working", "needs-you": "Needs your answer", waiting_on_user: "Needs your answer", blocked: "Blocked", done: "Done", failed: "Failed", terminated: "Terminated" };
const BOTTOM_SLACK = 24;

const timeOf = (at) => {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Panel state lives in App so the nearby card's R button and the R key share one rule (transcript-panel.mjs).
// The panel is pinned to its agent: identity is kept from the card it opened from.
export function useTranscript({ card, exploring, onOpen, blocked }) {
  const [panel, setPanel] = useState(initialTranscriptState);
  const [identity, setIdentity] = useState(null);
  const latest = useRef({});
  latest.current = { panel, card, exploring, onOpen, blocked };

  const commit = useCallback((next) => {
    const { panel: previous, card: current } = latest.current;
    if (next === previous) return;
    if (next.agentId && !previous.agentId) {
      setIdentity({ name: current?.name || current?.role || next.agentId, role: current?.role ?? "", state: current?.state ?? "" });
      latest.current.onOpen?.();
    }
    if (!next.agentId && previous.agentId) {
      queueMicrotask(() => {
        const free = document.querySelector(".den-cursor-free .proximity-card button[data-key=R]");
        (free ?? document.querySelector('main[aria-label="Den scene"]'))?.focus({ preventScroll: true });
      });
    }
    latest.current.panel = next;
    setPanel(next);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (latest.current.blocked?.current) return; // den-v1/06: the permission review owns the keys while it is open
      if (e.key !== "Escape" && e.target?.closest?.("input,select,textarea,[contenteditable]")) return;
      const { panel: current, card: nearby, exploring: walking } = latest.current;
      const { state, handled } = transcriptKey(current, { key: e.key, card: nearby, mode: walking ? "walk" : "diorama" });
      if (!handled) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) commit(state);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [commit]);

  // Leaving the den closes the transcript (walk mode only); a different nearby card clears an old notice.
  useEffect(() => { if (!exploring && latest.current.panel.agentId) commit(closeTranscript(latest.current.panel)); }, [exploring, commit]);
  useEffect(() => { if (latest.current.panel.notice) commit({ ...latest.current.panel, notice: null }); }, [card?.id, commit]);

  return {
    panel,
    identity,
    toggle: useCallback((nearby) => commit(transcriptToggle(latest.current.panel, nearby)), [commit]),
    close: useCallback(() => commit(closeTranscript(latest.current.panel)), [commit]),
  };
}

function ToolRow({ row, onToggle }) {
  const id = `transcript-tool-${row.n}`;
  return <li className={`transcript-row transcript-tool transcript-status-${row.status}`}>
    <button type="button" className="transcript-tool-head" aria-expanded={row.expanded} aria-controls={id} onClick={() => onToggle(row.n)} title={row.toggleLabel}>
      <span className="transcript-chevron" aria-hidden="true" />
      <code className="transcript-tool-name">{row.name}</code>
      <span className="transcript-tool-summary">{row.summary}</span>
      <span className="transcript-tool-status">{row.status}</span>
    </button>
    {row.expanded ? <div id={id} className="transcript-tool-body">
      {row.inputText ? <pre className="transcript-well" aria-label="Input">{row.inputText}</pre> : null}
      {row.result ? <>
        <pre className="transcript-well" aria-label="Result">{row.result.text}</pre>
        {row.result.truncatedBytes ? <p className="transcript-truncated">Truncated, {row.result.truncatedBytes} more bytes</p> : null}
      </> : null}
    </div> : null}
  </li>;
}

function Row({ row, onToggle, onAnswer }) {
  switch (row.kind) {
    case "message":
      return <li className={`transcript-row transcript-message${row.speaker === "You" ? " transcript-you" : ""}`}>
        <p className="transcript-speaker">{row.speaker} <time>{timeOf(row.at)}</time>{row.note ? <span className="transcript-note"> · {row.note}</span> : null}</p>
        <p className="transcript-text">{row.text}</p>
      </li>;
    case "tool":
      return <ToolRow row={row} onToggle={onToggle} />;
    case "permission":
      // Live den run, 2026-10-10: the request the agent is held on says what is asked and can be answered from here.
      // Both buttons open the permission review, which shows the full input and sends the answer.
      if (row.answerable) return <li className="transcript-row transcript-permission transcript-asking">
        <p className="transcript-waiting"><span className="transcript-glyph" aria-hidden="true" />{row.label}</p>
        <p className="transcript-asked"><code>{row.detail}</code></p>
        <div className="transcript-answer">
          <button type="button" className="approval-deny" data-answer="deny" title="Opens the permission request" onClick={() => onAnswer?.()}>Deny</button>
          <button type="button" className="approval-allow" data-answer="allow" title="Opens the permission request" onClick={() => onAnswer?.()}>Allow</button>
        </div>
      </li>;
      return <li className="transcript-row transcript-permission"><code>{row.name}</code> {row.waiting ? <span className="transcript-waiting"><span className="transcript-glyph" aria-hidden="true" />{row.label}</span> : <span className="transcript-answered">{row.label}</span>}</li>;
    case "ended":
      return <li className={`transcript-row transcript-ended transcript-ended-${row.state}`}>{row.label}</li>;
    default:
      return <li className="transcript-row transcript-unreadable">{row.label}{row.type ? ` (${row.type})` : ""}</li>;
  }
}

export function TranscriptPanel({ tx, transcripts, agents, approvals, onAnswer, connection }) {
  const { panel, identity } = tx;
  const agentId = panel.agentId;
  const buffer = agentId ? transcripts?.[agentId] : undefined;
  const [expanded, setExpanded] = useState([]);
  const [atBottom, setAtBottom] = useState(true);
  const [seenThrough, setSeenThrough] = useState(0);
  const log = useRef(null);
  const bottomRef = useRef(true);
  const lastN = useRef(0);
  const pending = agentId ? approvals?.find((a) => a?.agentId === agentId && (a.status ?? a.state ?? "pending") === "pending") ?? null : null;
  const view = transcriptView(buffer, { expanded, atBottom, seenThrough, connection, pending });
  lastN.current = view.rows.at(-1)?.n ?? 0;

  useEffect(() => { setExpanded([]); setAtBottom(true); setSeenThrough(0); bottomRef.current = true; }, [agentId]);
  useEffect(() => { if (agentId) document.querySelector(".transcript-close")?.focus({ preventScroll: true }); }, [agentId]);

  // New events keep arriving; only a reader already at the bottom follows them (appending never moves focus).
  useLayoutEffect(() => {
    const el = log.current;
    if (el && bottomRef.current) el.scrollTop = el.scrollHeight;
  }, [lastN.current, agentId, expanded]);

  const onScroll = () => {
    const el = log.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK;
    if (bottom !== bottomRef.current) {
      bottomRef.current = bottom;
      setAtBottom(bottom);
      if (!bottom) setSeenThrough(lastN.current);
    }
  };
  const jump = () => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
    bottomRef.current = true;
    setAtBottom(true);
    el?.focus({ preventScroll: true });
  };
  const toggleRow = (n) => setExpanded((open) => open.includes(n) ? open.filter((x) => x !== n) : [...open, n]);

  const notice = panel.notice ? <p className="transcript-notice visually-hidden" role="status" aria-live="polite">{panel.notice}</p> : null;
  if (!agentId) return notice;
  const agent = agents?.find((a) => a.id === agentId);
  const state = agent?.state ?? identity?.state ?? "";
  const name = identity?.name ?? agentId;
  return <>
    {notice}
    <aside className="transcript-panel" role="complementary" aria-label={`Transcript for ${name}`}>
      <header className="transcript-head">
        <div>
          <p className="transcript-overline">Transcript</p>
          <h2>{name}</h2>
          <p className="transcript-meta"><code>{agentId}</code>{identity?.role ? ` · ${identity.role}` : ""}</p>
          <p className="transcript-state"><span className={`transcript-glyph transcript-glyph-${state}`} aria-hidden="true" />{STATES[state] ?? state}</p>
        </div>
        <button type="button" className="transcript-close" aria-label="Close transcript" onClick={tx.close}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>
        </button>
      </header>
      {view.banner ? <p className="transcript-banner" role="status">{view.banner}</p> : null}
      <div className="transcript-log" role="log" aria-live="off" aria-label="Transcript entries" tabIndex={0} ref={log} onScroll={onScroll}>
        {view.empty ? <p className="transcript-empty">{view.emptyText}</p> : <>
          {view.droppedNotice ? <p className="transcript-dropped">{view.droppedText}</p> : null}
          <ul className="transcript-list">{view.rows.map((row) => <Row key={row.n} row={row} onToggle={toggleRow} onAnswer={() => onAnswer?.(agentId)} />)}</ul>
        </>}
      </div>
      <div className="transcript-jump" aria-live="polite">
        {view.jumpLabel ? <button type="button" className="transcript-jump-button" onClick={jump}>{view.jumpLabel}</button> : null}
      </div>
    </aside>
  </>;
}
