import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createMessageComposer } from "./message-composer.mjs";

// den-v1/07: the message composer. The controller (message-composer.mjs) owns every rule; this file renders its state
// and forwards keys, clicks and each new snapshot. The user's text and the bridge's refusal reason are inserted as
// plain text. The agent's event stream feeds `composer.observe(event)` (the live wiring is den-v1/11).
// den-v1 loop S1: on a resident panda the same box starts a task; the controller supplies the copy for either use.
const HINTS = ["Enter send", "Shift+Enter new line", "Esc cancel"];

export function useMessageComposer({ client, card, exploring, cursorFree, demo, snapshot, transcripts, onOpen, blocked }) {
  const latest = useRef({});
  latest.current = { card, exploring, cursorFree, demo, onOpen, blocked };
  const composer = useMemo(() => createMessageComposer({ client, hooks: { onOpen: () => latest.current.onOpen?.() } }), [client]);
  const state = useSyncExternalStore(composer.subscribe, composer.getState);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const { card: nearby, exploring: walking, cursorFree: free, demo: off, blocked: other } = latest.current;
      if (other?.current) return; // the permission review owns the keys while it is open
      const inBox = !!e.target?.closest?.("input,select,textarea,[contenteditable]");
      const mode = walking ? (free ? "free" : "walk") : "diorama";
      const { handled } = composer.key(
        { key: e.key, shiftKey: e.shiftKey, isComposing: e.isComposing || e.keyCode === 229, repeat: e.repeat, inBox },
        { card: nearby, mode, demo: off },
      );
      if (!handled) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [composer]);

  useEffect(() => { composer.sync({ agents: snapshot?.agents ?? [], transcripts }); }, [composer, snapshot, transcripts]);
  useEffect(() => {
    if (state.status?.kind !== "sent") return undefined;
    const timer = setInterval(() => composer.tick(), 1000);
    return () => clearInterval(timer);
  }, [composer, state.status?.kind]);
  useEffect(() => { if (!exploring) composer.close(); }, [composer, exploring]);

  const openFrom = useCallback((nearby) => {
    const { cursorFree: free, demo: off } = latest.current;
    composer.open(nearby, { mode: free ? "free" : "walk", demo: off });
  }, [composer]);
  return { composer, state, openFrom };
}

export function MessageComposer({ composer, state }) {
  const boxRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!state.open || !state.focus) return;
    (state.focus === "box" ? boxRef : closeRef).current?.focus({ preventScroll: true });
  }, [state.focusSeq]);
  useEffect(() => {
    if (state.open || !state.focusReturn) return;
    const target = state.focusReturn === "card-button" ? document.querySelector(".proximity-card button[data-key=T]:not(:disabled)") : null;
    (target ?? document.querySelector('main[aria-label="Den scene"]'))?.focus({ preventScroll: true });
  }, [state.focusSeq, state.open, state.focusReturn]);

  const live = <p className="message-live visually-hidden" role="status" aria-live="polite">{state.announcement}</p>;
  if (!state.open) return live;
  const sending = state.phase === "sending";
  const final = state.phase === "final";
  return <>
    {live}
    <div className={`message-composer${state.overLimit ? " is-over" : ""}`} role="group" aria-label={state.ariaLabel}>
      <label className="message-overline" id="message-composer-label" htmlFor="message-composer-box">{state.overline}</label>
      <textarea id="message-composer-box" ref={boxRef} className="message-box" rows={3} value={state.text} readOnly={state.readOnly}
        placeholder={state.placeholder} aria-labelledby="message-composer-label" aria-describedby="message-composer-count"
        aria-invalid={state.overLimit || undefined} spellCheck
        onChange={(e) => composer.setText(e.target.value)} />
      {state.banner ? <p className="message-banner" role="alert">{state.banner}</p> : null}
      <p className="message-hint">
        {HINTS.map((hint) => {
          const [chip, ...words] = hint.split(" ");
          return <span key={chip}><kbd>{chip}</kbd> {words.join(" ")}</span>;
        })}
      </p>
      <p className="message-count" id="message-composer-count">
        <span>{sending ? <><span className="message-spinner" aria-hidden="true" />{state.busyLabel}</> : state.note}</span>
        <span className="message-bytes">{state.counter}</span>
      </p>
      <div className="message-buttons">
        <button type="button" className="message-cancel" ref={closeRef} onClick={composer.close}>Cancel</button>
        <button type="button" className="message-send" disabled={!state.sendEnabled} onClick={composer.send}>{sending ? state.busyLabel : state.sendLabel}</button>
      </div>
      {final ? <span className="visually-hidden">Press Esc to close.</span> : null}
    </div>
  </>;
}
