// den-v1/06: the UI's client for permission requests. The injected `fetch` has the shape of the session's fetch, which
// attaches the credential and ends the session on a 401; this module never builds or reads the credential itself.
// Failures reject with { status, reason }: `reason` is the bridge's `error` string (plain text) when it sent one.
const MESSAGE_MAX_BYTES = 2048;
const FALLBACK =(status) => (status === 0 ? "Could not reach the bridge." : `The bridge refused the request (${status}).`);

function failure(status, reason) {
  return Object.assign(new Error(reason), { status, reason });
}

export function createBridgeClient({ fetch }) {
  const route = (id) => `/approvals/${encodeURIComponent(id)}`;

  async function call(url, init) {
    let res;
    try {
      res = await fetch(url, init);
    } catch {
      throw failure(0, FALLBACK(0));
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      // an empty or non-JSON body: the status still decides
    }
    if (!res?.ok) {
      const sent = typeof body?.error === "string" && body.error.trim() ? body.error : null;
      throw failure(Number.isInteger(res?.status) ? res.status : 0, sent ?? FALLBACK(res?.status ?? 0));
    }
    return body;
  }

  return {
    async getApproval(id) {
      const body = await call(route(id), { method: "GET" });
      if (body == null) throw failure(200, "The bridge sent an unreadable answer.");
      return body;
    },
    async decide(id, { decision, note } = {}) {
      if (decision !== "allow" && decision !== "deny") throw failure(0, "Decision must be allow or deny.");
      const payload = { decision };
      if (note !== undefined && note !== null && note !== "") payload.note = note;
      const body = await call(route(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return body ?? { ok: true };
    },
    // den-v1/07: one message to one agent. The text is trimmed and checked here too, so a caller that skipped the
    // composer's own guard still cannot send an empty or oversized body.
    async sendMessage(agentId, { text } = {}) {
      const trimmed = typeof text === "string" ? text.trim() : "";
      if (!trimmed) throw failure(0, "Write a message first.");
      if (new TextEncoder().encode(trimmed).length > MESSAGE_MAX_BYTES) throw failure(0, `Messages are limited to ${MESSAGE_MAX_BYTES} bytes.`);
      const body = await call(`/agents/${encodeURIComponent(agentId)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      return body ?? { ok: true };
    },
    // organism-infra/230: stop one agent. No body and no retry: pressing Stop again is the retry. A 409 (already
    // ended) and a 404 reject { status, reason } with the bridge's text, like every other call here.
    async stopAgent(agentId) {
      await call(`/agents/${encodeURIComponent(agentId)}/stop`, { method: "POST", headers: { "Content-Type": "application/json" } });
      return { ok: true };
    },
    // den-mvp outcome 2: one message into a role's conversation. The bridge sends it to the run named (or the role's
    // live run), or starts a follow-up run that continues an ended run's session: the answer says which
    // ({ runId, messageId, resumed, agent? }).
    async converse(role, { text, runId } = {}) {
      if (typeof role !== "string" || !role) throw failure(0, "Pick a panda first.");
      const trimmed = typeof text === "string" ? text.trim() : "";
      if (!trimmed) throw failure(0, "Write a message first.");
      if (new TextEncoder().encode(trimmed).length > MESSAGE_MAX_BYTES) throw failure(0, `Messages are limited to ${MESSAGE_MAX_BYTES} bytes.`);
      const body = await call(`/conversations/${encodeURIComponent(role)}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, ...(typeof runId === "string" && runId ? { runId } : {}) }),
      });
      if (body == null) throw failure(200, "The bridge sent an unreadable answer.");
      return body;
    },
    // A page of a role's durable conversation, oldest first: { entries, more, before }. `before` asks for the page above.
    async getConversation(role, { before, limit } = {}) {
      const query = new URLSearchParams();
      if (Number.isInteger(before) && before >= 0) query.set("before", String(before));
      if (Number.isInteger(limit) && limit > 0) query.set("limit", String(limit));
      const body = await call(`/conversations/${encodeURIComponent(role)}${query.size ? `?${query}` : ""}`, { method: "GET" });
      if (!body || !Array.isArray(body.entries)) throw failure(200, "The bridge sent an unreadable answer.");
      return body;
    },
    // den-v1 loop S1: start a task for one role. The bridge writes the ticket and answers { agent, ticket }.
    async startTask(role, { text } = {}) {
      if (typeof role !== "string" || !role) throw failure(0, "Pick a panda first.");
      const trimmed = typeof text === "string" ? text.trim() : "";
      if (!trimmed) throw failure(0, "Write a task first.");
      if (new TextEncoder().encode(trimmed).length > MESSAGE_MAX_BYTES) throw failure(0, `Tasks are limited to ${MESSAGE_MAX_BYTES} bytes.`);
      const body = await call("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, text: trimmed }),
      });
      if (body == null) throw failure(200, "The bridge sent an unreadable answer.");
      return body;
    },
    // organism-infra/228: run one frontier ticket as one role. One request per call: a refusal (409, 429, 503) rejects
    // { status, reason } with the bridge's text and is never retried here; pressing Run again is the retry.
    async dispatch(ref, { role } = {}) {
      const body = await call("/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, role }),
      });
      if (body == null) throw failure(200, "The bridge sent an unreadable answer.");
      return body;
    },
  };
}
