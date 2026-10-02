// organism-infra/109: the status line sees the real context size for a session; scripts/context.mjs
// reads it back so both report the same number. One tiny file per session under
// $HOME/.claude/statusline-context/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dirFor = (home) => path.join(home, ".claude", "statusline-context");
const safe = (session) => (typeof session === "string" && /^[A-Za-z0-9._-]+$/.test(session) && !session.startsWith(".") ? session : null);

export function saveContextTokens(home, session, tokens) {
  const id = safe(session);
  if (!id || !Number.isFinite(tokens)) return;
  try {
    mkdirSync(dirFor(home), { recursive: true });
    writeFileSync(path.join(dirFor(home), `${id}.json`), JSON.stringify({ tokens, ts: new Date().toISOString() }));
  } catch {
    // best effort: the status line must never fail on this
  }
}

export function loadContextTokens(home, session) {
  const id = safe(session);
  if (!id) return null;
  try {
    const v = JSON.parse(readFileSync(path.join(dirFor(home), `${id}.json`), "utf8"));
    return Number.isFinite(v?.tokens) ? v.tokens : null;
  } catch {
    return null;
  }
}
