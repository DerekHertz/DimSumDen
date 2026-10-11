// organism-infra/142 (ADR 0016 decisions 2, 6.5, 6.6, 6.8; amendment 5): the pure half of the Claude adapter.
// Everything here is a pure function of its arguments: no spawn, no fs, no clock. The impure half (143) spawns the child and wires these in.
//   buildClaudeArgs   a fixed argv template; the only variable parts are a UUID, a role and an optional model from a fixed list
//   buildClaudeEnv    the child's environment as an allowlist, never a copy
//   createLineSplitter / parseClaudeLine   stdout bytes to lines to CellEvents; cell output is untrusted text
//                     (den-v1 loop S2: also the transcript events text, tool-result and reply;
//                      S4: the model, tokens by tier, and the result line's own cost, duration and turns)
//   decodeControlRequest / encodeControlResponse   the can_use_tool permission channel, bare decisions only
//   encodeUserMessage a user message as one stdin line: the prompt, or (den-v1 loop S5) a message to a running child,
//                     whose id comes back on the child's replay of it and reads as message-applied
import { StringDecoder } from "node:string_decoder";
import { COST_MAX_USD, MODEL_RE, REQUEST_ID_MAX, REQUEST_IDS_PER_AGENT, ROLES, UUID_RE } from "./policy.mjs";

export const MAX_LINE_BYTES = 1_000_000; // ADR 0016 6.8: a stdout line over about 1 MB is dropped
export const CLAUDE_MODELS = Object.freeze(["opus", "sonnet", "haiku"]); // the CLI's own aliases; nothing else reaches --model

const SUMMARY_MAX = 200;
export const BODY_MAX = 16_000; // characters of one text block, tool result or reply handed on; the host clips for display
const DENY_REASON_DEFAULT = "Denied by the owner.";
const DENY_REASON_MAX = 500; // APPROVAL_NOTE_MAX; the message is a short note, not a channel

// The bridge's own inline --settings value (ADR 0016 6.10, a partial measure): cells cannot write to .claude/, and
// (den-v1 loop decision 2) cannot push or open a PR, which the project settings would otherwise auto-allow. A deny
// rule wins over an allow. It matches the command as the CLI reads it, so it is a guard against the plain case and
// not a boundary: the user still does every push and merge.
const DENY_RULES = ["Write(.claude/**)", "Edit(.claude/**)", "Bash(git push:*)", "Bash(gh pr create:*)"];

// The one allow the inline settings may carry (den-v1 loop, the live den run of 2026-10-10): Read on the agent's own
// ticket file. The board is in the main checkout, outside the agent's worktree, so without it the CLI asks the user
// before the agent can read its task. A rule is a pattern, so the path must be nothing but plain segments: absolute,
// ending .scratch/<feature>/issues/<name>.md, with no character a rule could read as a glob, a separator or an end.
const TICKET_FILE_RE = /^(?:\/[A-Za-z0-9._@+-]+)*\/\.scratch\/[A-Za-z0-9._-]+\/issues\/[A-Za-z0-9._-]+\.md$/;
export function isTicketFilePath(file) {
  return typeof file === "string" && TICKET_FILE_RE.test(file) && !file.split("/").some((part) => part === "." || part === "..");
}
const settingsFor = (ticketFile) =>
  JSON.stringify({ permissions: { deny: DENY_RULES, ...(ticketFile === undefined ? {} : { allow: [`Read(/${ticketFile})`] }) } });

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// ---- argv ----------------------------------------------------------------------------------

/**
 * The whole argv (no binary name) for one child. Rejects anything outside { sessionId, agent, model?, ticketFile? }.
 * No passthrough parameter exists, so no permission-broadening flag can be constructed; ticketFile adds the one
 * Read rule above and nothing else.
 */
export function buildClaudeArgs(options) {
  if (!isPlainObject(options)) throw new TypeError("buildClaudeArgs needs { sessionId, agent, model?, ticketFile? }");
  for (const key of Object.keys(options)) {
    if (key !== "sessionId" && key !== "agent" && key !== "model" && key !== "ticketFile") throw new TypeError(`buildClaudeArgs: unknown option ${JSON.stringify(key)}`);
  }
  const { sessionId, agent, model, ticketFile } = options;
  if (ticketFile !== undefined && !isTicketFilePath(ticketFile)) throw new TypeError("buildClaudeArgs: ticketFile must be a plain absolute path to a board ticket");
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) throw new TypeError("buildClaudeArgs: sessionId must be a UUID");
  if (typeof agent !== "string" || !ROLES.includes(agent)) throw new TypeError("buildClaudeArgs: agent must be a known role");
  if (model !== undefined && (typeof model !== "string" || !CLAUDE_MODELS.includes(model))) throw new TypeError("buildClaudeArgs: model must be one of the fixed list");
  return [
    "-p",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--verbose",
    "--replay-user-messages", // den-v1 loop S5: the child re-emits each stdin user message once it takes it
    "--permission-prompt-tool", "stdio",
    "--session-id", sessionId,
    "--agent", agent,
    ...(model === undefined ? [] : ["--model", model]),
    "--setting-sources", "project,local",
    "--strict-mcp-config",
    "--settings", settingsFor(ticketFile),
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

// Transcript text is kept as written (the host masks and escapes it); only its length is bounded here.
function body(type, text, extra = {}) {
  if (text.length <= BODY_MAX) return { type, ...extra, text };
  return { type, ...extra, text: text.slice(0, BODY_MAX), more: text.length - BODY_MAX };
}

// A tool_result's content is a string or a list of blocks; a block that is not text is named by its type.
function resultText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(isPlainObject)
    .map((block) => (block.type === "text" && typeof block.text === "string" ? block.text : `[${clip(String(block.type ?? "block"), 40)}]`))
    .join("\n");
}

const whole = (n) => Number.isSafeInteger(n) && n >= 0;
const count = (n) => (whole(n) ? n : 0);

// A usage block as the four billed tiers, or null when it has no usable output count.
function tiersOf(usage) {
  if (!isPlainObject(usage) || !whole(usage.output_tokens)) return null;
  return {
    input: count(usage.input_tokens), cacheWrite: count(usage.cache_creation_input_tokens),
    cacheRead: count(usage.cache_read_input_tokens), output: usage.output_tokens,
  };
}

// One message's usage. The CLI writes a message as several lines that repeat the same id and usage, so the id goes
// along and the host counts each message once. Per-message output is a partial count; the result line has the totals.
function usageEvent(message) {
  const tiers = tiersOf(message?.usage);
  if (!tiers) return null;
  // Input is the context the model read: plain input plus cache creation and cache reads.
  const input = tiers.input + tiers.cacheWrite + tiers.cacheRead;
  return { type: "usage", input, output: tiers.output, message: typeof message.id === "string" ? clip(message.id, SUMMARY_MAX) : "", tiers };
}

// The result line's own totals (den-v1 loop S4), each kept only if it is a plain number in range.
function totalsOf(obj) {
  const tiers = tiersOf(obj.usage);
  return {
    ...(typeof obj.total_cost_usd === "number" && obj.total_cost_usd >= 0 && obj.total_cost_usd <= COST_MAX_USD ? { costUsd: obj.total_cost_usd } : {}),
    ...(whole(obj.duration_ms) ? { durationMs: obj.duration_ms } : {}),
    ...(whole(obj.num_turns) ? { turns: obj.num_turns } : {}),
    ...(tiers ? { tiers } : {}),
  };
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
        if (block.type === "text") {
          if (typeof block.text === "string" && block.text.trim() !== "") events.push(body("text", block.text));
          continue;
        }
        if (block.type !== "tool_use") continue;
        if (typeof block.name !== "string" || block.name === "") continue;
        const id = typeof block.id === "string" ? clip(block.id, SUMMARY_MAX) : "";
        events.push({ type: "tool-start", id, name: block.name, summary: summarise(block.input) });
      }
      const usage = usageEvent(obj.message);
      if (usage) events.push(usage);
      return events;
    }
    if (obj.type === "user") {
      // The child's replay of a stdin user message (den-v1 loop S5): it took the message. Never read as a tool result.
      if (obj.isReplay === true) return typeof obj.uuid === "string" && UUID_RE.test(obj.uuid) ? [{ type: "message-applied", id: obj.uuid }] : [];
      return contentBlocks(obj.message)
        .filter((block) => block.type === "tool_result" && typeof block.tool_use_id === "string")
        .flatMap((block) => {
          const id = clip(block.tool_use_id, SUMMARY_MAX);
          return [body("tool-result", resultText(block.content), { id, ok: block.is_error !== true }), { type: "tool-end", id }];
        });
    }
    if (obj.type === "system" && obj.subtype === "init") {
      return typeof obj.model === "string" && MODEL_RE.test(obj.model) ? [{ type: "model", model: obj.model }] : [];
    }
    if (obj.type === "result") {
      const done = { type: "done", ok: obj.subtype === "success" && obj.is_error !== true, ...totalsOf(obj) };
      return typeof obj.result === "string" && obj.result.trim() !== "" ? [body("reply", obj.result), done] : [done];
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

/**
 * A user message as one stdin line: the first prompt (no id), or a message to a running child (den-v1 loop S5).
 * The id rides as the line's uuid, and the child's replay of the line carries it back.
 */
export function encodeUserMessage({ text, id } = {}) {
  if (typeof text !== "string") throw new TypeError("encodeUserMessage: text must be a string");
  if (id !== undefined && (typeof id !== "string" || !UUID_RE.test(id))) throw new TypeError("encodeUserMessage: id must be a UUID");
  return oneLine({ type: "user", message: { role: "user", content: text }, ...(id === undefined ? {} : { uuid: id }) });
}
