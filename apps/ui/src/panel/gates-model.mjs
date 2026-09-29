// Gate cards and Gate request submission (dimsumden-ui-v0/10). Pure: no React, no DOM.
const NOTE_MAX = 500;
const NOTE_SHOW_FROM = 450;

export function gatesModel(snapshot) {
  const cards = [];
  for (const t of snapshot?.tickets ?? []) {
    if (t.gate !== "merge" && t.gate !== "dispatch") continue;
    const verdict = t.request ? (String(t.request.kind).endsWith("-reject") ? "reject" : "approve") : null;
    cards.push({
      ref: t.ref,
      title: t.title,
      eyebrow: t.gate === "merge" ? "MERGE" : "DISPATCH",
      approveLabel: `Approve ${t.gate}`,
      rejectLabel: "Reject",
      approveKind: `${t.gate}-approve`,
      rejectKind: `${t.gate}-reject`,
      pending: verdict
        ? { verdict, text: verdict === "approve" ? "Approval sent, waiting for the orchestrator" : "Rejection sent, waiting for the orchestrator" }
        : null,
    });
  }
  return { visible: cards.length > 0, count: cards.length, cards };
}

export function noteCounter(length) {
  return { show: length >= NOTE_SHOW_FROM, text: `${length}/${NOTE_MAX}` };
}

export async function submitGate({ fetch, ref, kind, note }) {
  const payload = { kind, ref };
  const trimmed = typeof note === "string" ? note.trim() : "";
  if (trimmed) payload.note = trimmed;
  try {
    const res = await fetch("/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    if (res.status === 409) return { ok: false, status: 409, message: "Couldn't send: already pending (409)", retryable: false };
    return { ok: false, status: res.status, message: `Couldn't send: request failed (${res.status})`, retryable: true };
  } catch (e) {
    return { ok: false, status: 0, message: `Couldn't send: ${e?.message ?? "network error"}`, retryable: true };
  }
}
