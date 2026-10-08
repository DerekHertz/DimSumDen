// organism-infra/142 (ADR 0016 decisions 2, 6.5, 6.6, 6.8; amendment 5): the pure half of the Claude adapter.
// Everything here is a pure function of its arguments: no spawn, no fs, no clock. The impure half (143) spawns the child and wires these in.
//   buildClaudeArgs   a fixed argv template; the only variable parts are a UUID, a role and an optional model from a fixed list
//   buildClaudeEnv    the child's environment as an allowlist, never a copy
//   createLineSplitter / parseClaudeLine   stdout bytes to lines to CellEvents; cell output is untrusted text
//   decodeControlRequest / encodeControlResponse   the can_use_tool permission channel, bare decisions only
import { StringDecoder } from "node:string_decoder";
import { REQUEST_ID_MAX, REQUEST_IDS_PER_AGENT, ROLES, UUID_RE } from "./policy.mjs";

export const MAX_LINE_BYTES = 1_000_000; // ADR 0016 6.8: a stdout line over about 1 MB is dropped
export const CLAUDE_MODELS = Object.freeze(["opus", "sonnet", "haiku"]); // the CLI's own aliases; nothing else reaches --model

const SUMMARY_MAX = 200;
const DENY_REASON_DEFAULT = "Denied by the owner.";
const DENY_REASON_MAX = 500; // APPROVAL_NOTE_MAX; the message is a short note, not a channel

// The bridge's own inline --settings value (ADR 0016 6.10, a partial measure): cells cannot write to .claude/.
const DENY_SETTINGS = JSON.stringify({ permissions: { deny: ["Write(.claude/**)", "Edit(.claude/**)"] } });

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// ---- argv ----------------------------------------------------------------------------------

/**
 * The whole argv (no binary name) for one child. Rejects anything outside { sessionId, agent, model? }.
 * No passthrough parameter exists, so no permission-broadening flag can be constructed.
 */
export function buildClaudeArgs(options) {
  if (!isPlainObject(options)) throw new TypeError("buildClaudeArgs needs { sessionId, agent, model? }");
  for (const key of Object.keys(options)) {
    if (key !== "sessionId" && key !== "agent" && key !== "model") throw new TypeError(`buildClaudeArgs: unknown option ${JSON.stringify(key)}`);
  }
  const { sessionId, agent, model } = options;
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) throw new TypeError("buildClaudeArgs: sessionId must be a UUID");
  if (typeof agent !== "string" || !ROLES.includes(agent)) throw new TypeError("buildClaudeArgs: agent must be a known role");
  if (model !== undefined && (typeof model !== "string" || !CLAUDE_MODELS.includes(model))) throw new TypeError("buildClaudeArgs: model must be one of the fixed list");
  return [
    "-p",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--verbose",
    "--permission-prompt-tool", "stdio",
    "--session-id", sessionId,
    "--agent", agent,
    ...(model === undefined ? [] : ["--model", model]),
    "--setting-sources", "project,local",
    "--strict-mcp-config",
    "--settings", DENY_SETTINGS,
  ];
}

// ---- environment ---------------------------------------------------------------------------

const ENV_EXACT = ["PATH", "HOME", "LANG", "DEN_CLAUDE_BIN"];
const ENV_LOCALE = /^LC_[A-Z]+$/;

/** The child's environment: PATH, HOME, locale and DEN_CLAUDE_BIN only. The owner's login is on disk, not in env (ADR 0001). */
export function buildClaudeEnv(parentEnv) {
  const env = {};
  if (!isPlainObject(parentEnv)) return env;
  for (const name of Object.keys(parentEnv)) {
    if (!ENV_EXACT.includes(name) && !ENV_LOCALE.test(name)) continue;
    const value = parentEnv[name];
    if (typeof value === "string") env[name] = value;
  }
  return env;
}

// ---- stdout lines --------------------------------------------------------------------------

/**
 * Chunks (string or Buffer) to complete lines. A line over maxLineBytes is dropped and the stream
 * resyncs at the next newline; the buffer never holds more than the cap while waiting for one.
 */
export function createLineSplitter({ maxLineBytes = MAX_LINE_BYTES } = {}) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let pendingBytes = 0;
  let dropping = false;

  function finishLine(segment, out) {
    const wasDropping = dropping;
    const line = pending + segment;
    const bytes = pendingBytes + Buffer.byteLength(segment);
    pending = "";
    pendingBytes = 0;
    dropping = false;
    if (wasDropping || bytes > maxLineBytes) return;
    const trimmed = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (trimmed.trim() !== "") out.push(trimmed);
  }

  return {
    push(chunk) {
      const out = [];
      const text = typeof chunk === "string" ? chunk : decoder.write(chunk);
      const parts = text.split("\n");
      for (let i = 0; i < parts.length - 1; i += 1) finishLine(parts[i], out);
      const tail = parts[parts.length - 1];
      if (dropping) return out;
      const bytes = pendingBytes + Buffer.byteLength(tail);
      if (bytes > maxLineBytes) {
        pending = "";
        pendingBytes = 0;
        dropping = true;
      } else {
        pending += tail;
        pendingBytes = bytes;
      }
      return out;
    },
  };
}

// ---- stream decode -------------------------------------------------------------------------

function clip(text, max) {
  const flat = text.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max) : flat;
}

// What the UI shows for a tool call: the command or the target path, shortened. Never the full input.
function summarise(input) {
  if (!isPlainObject(input)) return "";
  for (const key of ["command", "file_path", "path", "pattern", "url", "description"]) {
    if (typeof input[key] === "string" && input[key].trim() !== "") return clip(input[key], SUMMARY_MAX);
  }
  return "";
}

const count = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);

function usageEvent(usage) {
  if (!isPlainObject(usage)) return null;
  if (!Number.isInteger(usage.output_tokens) || usage.output_tokens < 0) return null;
  // Input is the context the model read: plain input plus cache creation and cache reads.
  const input = count(usage.input_tokens) + count(usage.cache_creation_input_tokens) + count(usage.cache_read_input_tokens);
  return { type: "usage", input, output: usage.output_tokens };
}

function contentBlocks(message) {
  return isPlainObject(message) && Array.isArray(message.content) ? message.content.filter(isPlainObject) : [];
}

/** One stdout line to zero or more CellEvents. Never throws. control_request lines belong to decodeControlRequest. */
export function parseClaudeLine(line) {
  try {
    if (typeof line !== "string") return [];
    if (line.length * 3 > MAX_LINE_BYTES && Buffer.byteLength(line) > MAX_LINE_BYTES) return [];
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) return [];
    const obj = JSON.parse(trimmed);
    if (!isPlainObject(obj)) return [];
    if (obj.type === "assistant") {
      const events = [];
      for (const block of contentBlocks(obj.message)) {
        if (block.type !== "tool_use") continue;
        if (typeof block.name !== "string" || block.name === "") continue;
        events.push({ type: "tool-start", name: block.name, summary: summarise(block.input) });
      }
      const usage = usageEvent(obj.message?.usage);
      if (usage) events.push(usage);
      return events;
    }
    if (obj.type === "user") {
      return contentBlocks(obj.message)
        .filter((block) => block.type === "tool_result" && typeof block.tool_use_id === "string")
        .map(() => ({ type: "tool-end" }));
    }
    if (obj.type === "result") {
      return [{ type: "done", ok: obj.subtype === "success" && obj.is_error !== true }];
    }
    return [];
  } catch {
    return [];
  }
}

// ---- permission channel --------------------------------------------------------------------

const validRequestId = (id) => typeof id === "string" && id.length > 0 && id.length <= REQUEST_ID_MAX;

/**
 * A control_request line, decoded. Only can_use_tool with a named tool and a plain-object input is an approval;
 * permission_suggestions is never read. Anything else with a usable id is answered deny, a repeat of an id is
 * answered deny, and a request with no usable id is dropped (nothing to answer). `seen` is the caller's per-child set.
 */
export function decodeControlRequest(obj, seen) {
  if (!isPlainObject(obj) || obj.type !== "control_request") return { kind: "drop" };
  const requestId = obj.request_id;
  if (!validRequestId(requestId)) return { kind: "drop" };
  const deny = { kind: "deny", requestId };
  if (seen.has(requestId)) return deny;
  if (seen.size >= REQUEST_IDS_PER_AGENT) return deny;
  seen.add(requestId);
  const request = obj.request;
  if (!isPlainObject(request) || request.subtype !== "can_use_tool") return deny;
  if (typeof request.tool_name !== "string" || request.tool_name === "") return deny;
  if (!isPlainObject(request.input)) return deny;
  return { kind: "approval", requestId, tool: request.tool_name, input: request.input };
}

// U+2028 and U+2029 are legal inside JSON strings but split lines in some readers; escape them so the line stays one line.
const oneLine = (value) => `${JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")}\n`;

/**
 * The stdin line that answers a control_request: a bare decision, never updatedPermissions or a rule.
 * Only an explicit `allow: true` allows (and then echoes the original input); everything else is deny.
 */
export function encodeControlResponse({ requestId, allow, reason, input } = {}) {
  if (!validRequestId(requestId)) throw new TypeError("encodeControlResponse: requestId must be a string of 1 to 128 characters");
  let body;
  if (allow === true) {
    if (!isPlainObject(input)) throw new TypeError("encodeControlResponse: an allow needs the request's plain-object input");
    body = { behavior: "allow", updatedInput: input };
  } else {
    const message = typeof reason === "string" && reason !== "" ? reason.slice(0, DENY_REASON_MAX) : DENY_REASON_DEFAULT;
    body = { behavior: "deny", message };
  }
  return oneLine({ type: "control_response", response: { subtype: "success", request_id: requestId, response: body } });
}
