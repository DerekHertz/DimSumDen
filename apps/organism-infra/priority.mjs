// Ticket priority: parse the header line and order the frontier (ADR 0011
// decision 3, docs/agents/issue-tracker.md). Pure functions, no I/O.
//
// Rules:
// - `**Priority:** P0`..`P3` on its own line. Missing or malformed is P2.
// - A ticket bumps one level per 3 orchestrator handoffs strictly newer than
//   its readySince. Bumps stack (6 handoffs = 2 levels) and clamp at P0; a P0
//   is never bumped. `bumps` reports the levels actually applied.
// - Order: effective priority, then readySince (oldest first), then ticket
//   number (numeric), then ref as a final stable tiebreak.
//
// Caller contract: handoffTimestamps hold ISO timestamps, one per
// `.scratch/_handoffs/*-orchestrator-*.md` file; filtering to orchestrator
// files is the caller's job (the snapshot builder, dimsumden-ui-v0/04).
// Handoff file names carry only a day (`2026-09-29-orchestrator-8.md`), so the
// caller must convert a name to a timestamp itself. Recommended rule: use the
// file's mtime, or the end of that day (T23:59:59.999Z) when only the name is
// known; a same-day handoff then counts as after a ticket ready earlier that day.

const LEVELS = ["P0", "P1", "P2", "P3"];
const PER_BUMP = 3;

export function parsePriority(ticketMarkdown) {
  const m = /^\*\*Priority:\*\*[ \t]*(P[0-3])[ \t]*$/m.exec(String(ticketMarkdown ?? ""));
  return m ? m[1] : "P2";
}

function ticketNumber(ref) {
  const slug = String(ref).split("/").pop();
  const m = /^(\d+)/.exec(slug);
  return m ? Number(m[1]) : Infinity;
}

export function orderFrontier(candidates, handoffTimestamps) {
  const handoffs = handoffTimestamps.map((t) => Date.parse(t));
  const rows = candidates.map((c) => {
    const ready = Date.parse(c.readySince);
    const level = LEVELS.indexOf(c.priority);
    const waited = handoffs.filter((h) => h > ready).length;
    const bumps = Math.min(Math.floor(waited / PER_BUMP), level);
    return {
      ref: c.ref,
      priority: c.priority,
      effectivePriority: LEVELS[level - bumps],
      bumps,
      bumped: bumps > 0,
      _level: level - bumps,
      _ready: ready,
    };
  });
  rows.sort(
    (a, b) =>
      a._level - b._level ||
      a._ready - b._ready ||
      ticketNumber(a.ref) - ticketNumber(b.ref) ||
      (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0),
  );
  return rows.map(({ _level, _ready, ...out }) => out);
}
