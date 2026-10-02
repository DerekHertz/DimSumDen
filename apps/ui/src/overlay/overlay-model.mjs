// View-models for the floating cards and the bottom overlays (den-scene-v1/07). Pure: no React, no DOM, time is
// passed in. Copy comes from docs/design/2026-10-01-iso-den.md section 4. Agent text (ticket titles) is untrusted:
// the components render it as React text nodes only.
import { gatesModel } from "../panel/gates-model.mjs";
import { queueModel } from "../panel/queue-model.mjs";
import { cellTypeOf, sceneFromState } from "../scene/scene-from-state.mjs";
import { stationOf } from "../scene/banquet-layout.mjs";

export const STATION_NAME = {
  pass: "Pass", steamers: "Steamers", tea: "Tea", pantry: "Pantry", "front-of-house": "Front of House",
  cubs: "Cubs", library: "Library", drum: "Drum",
};
/** Open stations, in the order the card lists them. */
export const OPEN_STATIONS = ["pass", "steamers", "tea", "pantry", "front-of-house"];
/** Stations not built yet, drawn as dashed pills. Cubs shows how many are asleep instead of "coming online". */
export const DORMANT_STATIONS = ["cubs", "library", "drum"];
/** The one-character mark of each station (tokens.json: Pass 传, Steamers 蒸, Tea 茶, Pantry 仓, Front of House 堂, Cubs 崽, Library 书, Drum 鼓). */
export const STATION_GLYPH = {
  pass: "传", steamers: "蒸", tea: "茶", pantry: "仓", "front-of-house": "堂", cubs: "崽", library: "书", drum: "鼓",
};
/** The station colour tokens (CSS custom properties) of each open station. */
export const STATION_HUE = {
  pass: "--station-pass", steamers: "--station-steamers", tea: "--station-tea", pantry: "--station-pantry", "front-of-house": "--station-front",
};

const PASS_TYPES = new Set(["orchestrator", "product", "architect"]);

/** A cell type's station id: the three Pass types share "pass"; anything unknown is a cub. */
export function stationIdOf(cellType) {
  const s = stationOf(cellType);
  return PASS_TYPES.has(s) ? "pass" : s;
}

export const shortRef = (ref) => ref.slice(ref.indexOf("/") + 1);

/** "2 min", "3 h", "2 d"; "now" under a minute; null when the time is unknown. */
export function relativeAge(since, nowMs) {
  const t = Date.parse(since ?? "");
  if (!Number.isFinite(t)) return null;
  const minutes = Math.max(0, Math.floor((nowMs - t) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} h`;
  return `${Math.floor(minutes / (60 * 24))} d`;
}

/** Every waiting request, in board order: a ticket whose gate is merge or dispatch (gates-model.mjs). */
export function needsYouModel(snapshot, nowMs) {
  const byRef = new Map((snapshot?.tickets ?? []).map((t) => [t.ref, t]));
  const requests = gatesModel(snapshot).cards.map((card) => {
    const t = byRef.get(card.ref);
    const gate = card.approveKind.replace(/-approve$/, "");
    const role = cellTypeOf(t);
    const station = stationIdOf(role);
    const short = shortRef(card.ref);
    return {
      ref: card.ref,
      short,
      gate,
      role,
      station,
      eyebrow: `${STATION_NAME[station]} · ${role} · ${short}`,
      title: `${short} wants ${gate} approval`,
      rowText: `${short} · ${gate}`,
      preview: [`${card.approveKind} ${card.ref}`, card.title],
      age: relativeAge(t?.holder?.since, nowMs),
      approveKind: card.approveKind,
      rejectKind: card.rejectKind,
      pending: card.pending,
    };
  });
  return { count: requests.length, requests };
}

/** The next (+1) or previous (-1) request after `ref`, wrapping; the first when `ref` is not in the list. */
export function stepRequest(requests, ref, dir) {
  if (requests.length === 0) return null;
  const i = requests.findIndex((r) => r.ref === ref);
  if (i < 0) return requests[0].ref;
  return requests[(i + dir + requests.length) % requests.length].ref;
}

/** Pills for the open stations and the dormant ones, the "N open · M ready" summary, and the first three queue rows. */
export function stationsModel(snapshot) {
  const cells = snapshot ? sceneFromState(snapshot) : [];
  const count = {};
  const waiting = {};
  for (const c of cells) {
    const id = stationIdOf(c.cellType);
    count[id] = (count[id] ?? 0) + 1;
    if (c.pose === "waiting_on_user") waiting[id] = true;
  }
  const open = OPEN_STATIONS.map((id) => ({ id, name: STATION_NAME[id], glyph: STATION_GLYPH[id], count: count[id] ?? 0, waiting: Boolean(waiting[id]) }));
  const dormant = DORMANT_STATIONS.map((id) => ({
    id,
    name: STATION_NAME[id],
    glyph: STATION_GLYPH[id],
    text: id === "cubs" ? `${count.cubs ?? 0} asleep` : "coming online",
  }));
  const queue = snapshot ? queueModel(snapshot).frontier : [];
  return {
    open,
    dormant,
    summary: `${open.length} open · ${queue.length} ready`,
    next: queue.slice(0, 3).map((r) => ({ ref: r.ref, priority: r.priorityLabel, title: r.title })),
  };
}

/** The Live badge in the logo pill: Live, Offline once the bridge has been gone a while, else Reconnecting. */
export function badgeModel(conn) {
  if (conn.phase === "live") return { label: "Live", tone: "live", ariaLive: null, hint: null };
  if (conn.phase === "offline") return { label: "Offline", tone: "muted", ariaLive: null, hint: "Bridge offline: run npm run ui" };
  return { label: "Reconnecting…", tone: "muted", ariaLive: "polite", hint: null };
}

/** "9:05" (24 hour, hour not padded). */
export function clockText(nowMs) {
  const d = new Date(nowMs);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const TIMELINE_WINDOW_MS = 60 * 60_000;

/**
 * Event dots on the timeline track, from what the board holds: a ticket someone took in the last hour (a Pass
 * dot, or a lantern dot when it waits on the user, or an alarm dot when blocked). `at` is 0 (an hour ago) to 1 (now).
 */
export function timelineMarkers(snapshot, nowMs) {
  const out = [];
  for (const t of snapshot?.tickets ?? []) {
    const since = Date.parse(t.holder?.since ?? "");
    if (!Number.isFinite(since)) continue;
    const age = nowMs - since;
    if (age < 0 || age > TIMELINE_WINDOW_MS) continue;
    const tone = t.gate ? "lantern" : t.status === "blocked" ? "alarm" : "pass";
    out.push({ ref: t.ref, tone, at: 1 - age / TIMELINE_WINDOW_MS });
  }
  return out;
}

export const AUTONOMY_MODES = ["supervised", "gated", "autopilot"];
