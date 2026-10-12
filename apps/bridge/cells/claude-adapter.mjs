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
import { readFileSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { COST_MAX_USD, MODEL_RE, REQUEST_ID_MAX, REQUEST_IDS_PER_AGENT, ROLES, UUID_RE, WORKTREES_DIR } from "./policy.mjs";

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
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// The wall (agent-os/01 spike, ADR 0021 decision 2): the CLI's own sandbox around the agent's shell commands. Strict:
// the CLI refuses to start if the sandbox cannot run, a blocked command cannot be retried outside it, and a host that
// is not listed is refused, not asked about. A sandboxed command then runs with no permission request. Hosts are plain
// lower-case dotted names: no wildcard, port, scheme or path. The runtime passes it for a role with a ceiling (agent-os/04).
//
// agent-os/02 (security review of agent-os/01): names only. The last label must be letters (or an xn-- label), so every IP
// literal in any dotted-number form fails, and the labels that mean a private or local network are refused by name.
const WALL_HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const HOST_TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
const PRIVATE_TLDS = new Set(["local", "localhost", "localdomain", "internal", "lan", "home", "corp", "intranet", "private", "arpa"]);
const WALL_HOSTS_MAX = 20;
const isDense = (a) => {
  if (!Array.isArray(a)) return false;
  for (let i = 0; i < a.length; i += 1) if (!Object.hasOwn(a, i)) return false; // a hole is not an entry
  return true;
};
export function isWallHost(host) {
  if (typeof host !== "string" || !WALL_HOST_RE.test(host)) return false;
  const tld = host.slice(host.lastIndexOf(".") + 1);
  return HOST_TLD_RE.test(tld) && !PRIVATE_TLDS.has(tld);
}
function isWall(wall) {
  if (!isPlainObject(wall) || Object.keys(wall).length !== 1 || !isDense(wall.hosts)) return false;
  return wall.hosts.length <= WALL_HOSTS_MAX && wall.hosts.every(isWallHost);
}

// agent-os/02: what a ceiling forbids, from governance.json (a guardrail path). Paths are relative to the worktree, plain
// segments with an optional trailing /**; commands are plain words. A deny rule wins over an allow, so no grant lifts one.
const GOVERNANCE = JSON.parse(readFileSync(new URL("./governance.json", import.meta.url), "utf8"));
const FORBID_PATH_RE = /^(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)*(?:\/\*\*)?$/;
const FORBID_RUN_RE = /^[A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)*$/;
const FORBID_MAX = 40;
const isForbidList = (list, re) => isDense(list) && list.length <= FORBID_MAX && list.every((e) => typeof e === "string" && re.test(e));
{
  const ok = isPlainObject(GOVERNANCE) && Object.keys(GOVERNANCE).length === 4 &&
    isForbidList(GOVERNANCE.ciPaths, FORBID_PATH_RE) && isForbidList(GOVERNANCE.guardrailPaths, FORBID_PATH_RE) &&
    isForbidList(GOVERNANCE.denyRun, FORBID_RUN_RE) && isDense(GOVERNANCE.ciGrantRoles) && GOVERNANCE.ciGrantRoles.every((r) => ROLES.includes(r));
  if (!ok) throw new Error("governance.json: bad governance data");
}
const isForbid = (f) => isPlainObject(f) && Object.keys(f).length === 2 && isForbidList(f.write, FORBID_PATH_RE) && isForbidList(f.run, FORBID_RUN_RE);
const baseOf = (entry) => entry.replace(/\/\*\*$/, "");

// agent-os/02 (ADR 0021 decision 3): task grants, data in a fixed shape: { kind: "host", value: <host name> } or
// { kind: "path", value: <absolute or ~/ path of plain segments> }, at most six. Nothing else is accepted, and the error
// text never echoes a value back.
const GRANTS_MAX = 6;
const GRANT_PATH_RE = /^~?(?:\/[A-Za-z0-9._@+-]+)+$/;
export function isGrantPath(p) {
  return typeof p === "string" && GRANT_PATH_RE.test(p) && !p.split("/").some((part) => part === "." || part === "..");
}
/** The validated grants as { hosts, paths }, repeats dropped. Anything outside the fixed shape is a TypeError. */
export function parseGrants(grants) {
  const hosts = [];
  const paths = [];
  if (grants === undefined) return { hosts, paths };
  if (!isDense(grants) || grants.length > GRANTS_MAX) throw new TypeError(`grants must be a list of at most ${GRANTS_MAX} grants`);
  for (const g of grants) {
    if (!isPlainObject(g) || Object.keys(g).length !== 2 || !Object.hasOwn(g, "kind") || !Object.hasOwn(g, "value")) throw new TypeError("a grant must be { kind, value }");
    if (g.kind === "host" && isWallHost(g.value)) {
      if (!hosts.includes(g.value)) hosts.push(g.value);
    } else if (g.kind === "path" && isGrantPath(g.value)) {
      if (!paths.includes(g.value)) paths.push(g.value);
    } else {
      throw new TypeError("a grant must be a host name or an absolute (or ~/) path of plain segments");
    }
  }
  return { hosts, paths };
}

// Governed paths of the main checkout that a path grant reaches (compileCeiling's denyAbs): absolute, plain segments, an
// optional trailing /**. A grant list is at most six and the governed list at most 40 a side, so the cap is generous.
const DENY_ABS_RE = /^(?:\/[A-Za-z0-9._@+-]+)+(?:\/\*\*)?$/;
const DENY_ABS_MAX = GRANTS_MAX * 2 * FORBID_MAX;

const sandboxFor = (wall, worktree, forbid, writePaths, readLimit, ticketFile, denyAbs) => {
  // Shell writes: the sandbox's own deny list, in the absolute form when the worktree is known, plus the governed paths of the
  // main checkout that a path grant reaches.
  const denyWrite = [...new Set([...(forbid?.write ?? []).map((p) => (worktree === undefined ? baseOf(p) : `${worktree}/${baseOf(p)}`)), ...(denyAbs ?? []).map(baseOf)])];
  const filesystem = { ...(denyWrite.length === 0 ? {} : { denyWrite }), ...(writePaths?.length ? { allowWrite: [...writePaths] } : {}),
    // The read limit for a shell command (live check, agent-os/02): the home directory is closed, the worktree, the ticket and granted paths re-opened.
    ...(readLimit === true ? { denyRead: ["~/"], allowRead: [...(worktree === undefined ? [] : [worktree]), ...(ticketFile === undefined ? [] : [`/${ticketFile}`.slice(1)]), ...(writePaths ?? [])] } : {}) };
  return {
    enabled: true,
    failIfUnavailable: true,
    allowUnsandboxedCommands: false,
    autoAllowBashIfSandboxed: true,
    network: { allowedDomains: [...wall.hosts], strictAllowlist: true },
    ...(Object.keys(filesystem).length === 0 ? {} : { filesystem }),
  };
};
// A file tool's rule for a path: `//abs` for an absolute one (the adapter's form), `~/x` for a home one.
const ruleForm = (p) => (p.startsWith("/") ? `/${p}` : p);
const settingsFor = ({ ticketFile, wall, worktree, forbid, writePaths, readLimit, denyAbs }) => {
  const allow = [
    ...(ticketFile === undefined ? [] : [`Read(/${ticketFile})`]),
    ...(worktree === undefined ? [] : [`Write(/${worktree}/**)`, `Edit(/${worktree}/**)`]),
    ...(writePaths ?? []).flatMap((p) => [`Write(${ruleForm(p)}/**)`, `Edit(${ruleForm(p)}/**)`]),
  ];
  const denyPaths = (forbid?.write ?? []).flatMap((p) => [p, ...(worktree === undefined ? [] : [`/${worktree}/${p}`])]);
  const deny = [
    ...DENY_RULES,
    ...denyPaths.flatMap((p) => [`Write(${p})`, `Edit(${p})`]),
    ...(denyAbs ?? []).flatMap((p) => [`Write(${ruleForm(p)})`, `Edit(${ruleForm(p)})`]),
    // An infix rule, so a command wrapped in a newline, $(...), backticks or <(...) is still caught. Words are joined by "*",
    // so `git -C dir push` and a doubled space match too.
    ...(forbid?.run ?? []).map((words) => `Bash(*${words.split(" ").join(" *")}*)`),
  ];
  return JSON.stringify({
    permissions: { deny: [...new Set(deny)], ...(allow.length === 0 ? {} : { allow }), ...(readLimit === true ? { blockReadsOutsideWorkingDirectories: true, ...(ticketFile === undefined ? {} : { additionalDirectories: [ticketFile.slice(0, ticketFile.lastIndexOf("/"))] }) } : {}) },
    ...(wall === undefined ? {} : { sandbox: sandboxFor(wall, worktree, forbid, writePaths, readLimit, ticketFile, denyAbs) }),
  });
};

// A worktree the write rules may name (agent-os/04): absolute, plain segments only, no "." or ".." and not the root, so the
// rule Write(/<worktree>/**) cannot read as a glob, a separator or a wider path.
const WORKTREE_RE = /^(?:\/[A-Za-z0-9._@+-]+)+$/;
export function isWorktreePath(dir) {
  return typeof dir === "string" && WORKTREE_RE.test(dir) && !dir.split("/").some((part) => part === "." || part === "..");
}

// ---- role ceilings (agent-os/04, ADR 0021 decisions 2 to 5) --------------------------------
// ceilings.json gives scout, developer, qa and security a ceiling: { write: "none" | "worktree", hosts: [...] }. A role with
// no key has none and starts as before. The data is checked once at load, so a bad edit stops the bridge, not a Start.
const CEILINGS = JSON.parse(readFileSync(new URL("./ceilings.json", import.meta.url), "utf8"));
for (const [role, ceiling] of Object.entries(CEILINGS)) {
  const ok = ROLES.includes(role) && isPlainObject(ceiling) && Object.keys(ceiling).length === 2 && (ceiling.write === "none" || ceiling.write === "worktree") && isWall({ hosts: ceiling.hosts });
  if (!ok) throw new Error(`ceilings.json: bad ceiling for ${JSON.stringify(role)}`);
}

/** Whether a role has a ceiling, and whether it may be given task grants (a role that cannot write takes none). */
export const ceilingOf = (role) => (Object.hasOwn(CEILINGS, role) ? { takesGrants: CEILINGS[role].write !== "none" } : null);

const covers = (grant, file) => file === grant || file.startsWith(`${grant}/`);

/** A grant as an absolute path: "~/x" becomes "<home>/x" when home is known; otherwise it is returned as it is. */
const expandHome = (grant, home) => (grant.startsWith("~/") && home !== undefined ? `${home}${grant.slice(1)}` : grant);

/**
 * Whether a path grant contains an agent's worktree: the worktree itself, or the worktrees directory of the main checkout
 * (so the main checkout, its .claude and any parent are included). Such a grant would open the main checkout and the
 * sibling worktrees, where the governance denies do not reach. A "~/" grant is checked when home is given.
 */
export function grantContainsWorktrees(grant, { root, home, worktree } = {}) {
  const p = expandHome(grant, home);
  if (!p.startsWith("/")) return false;
  return [worktree, root === undefined ? undefined : `${root}/${WORKTREES_DIR}`].some((dir) => dir !== undefined && covers(p, dir));
}

// The governed paths (absolute, in the main checkout) that one path grant reaches: the grant itself when it is inside a governed
// directory, the governed path when the grant is above it. A grant in the agent's own worktree is left to the relative denies.
function governedUnder(grant, root, worktree) {
  if (!grant.startsWith("/") || (worktree !== undefined && covers(worktree, grant))) return [];
  const out = [];
  for (const entry of [...GOVERNANCE.guardrailPaths, ...GOVERNANCE.ciPaths]) {
    const governed = `${root}/${baseOf(entry)}`;
    if (grant === governed) out.push(`${root}/${entry}`);
    else if (covers(governed, grant)) out.push(`${grant}/**`);
    else if (covers(grant, governed)) out.push(`${root}/${entry}`);
  }
  return out;
}

/**
 * The buildClaudeArgs options for a role's ceiling plus its task grants: the wall with the ceiling's hosts and the granted
 * ones, Write and Edit allow rules for the worktree when the role writes and for each granted path, and the governance
 * denies (CI and guardrail paths, and the commands). A host brings a read limit with it. Forbid beats permit: no grant lifts
 * a deny, except that a role in governance.json's ciGrantRoles (security) drops the CI-path denies a granted path covers.
 * null for a role with no ceiling. A role that writes and gets a worktree that is not a plain absolute path is a TypeError;
 * worktree undefined leaves the write rules out (the wall stays, the Write request stays). Any grant outside the fixed shape,
 * any grant for a role that cannot write, and a path grant that contains the worktree are TypeErrors.
 */
export function compileCeiling(role, { worktree, grants, root, home } = {}) {
  const { hosts: grantHosts, paths } = parseGrants(grants);
  if (root !== undefined && !isWorktreePath(root)) throw new TypeError("compileCeiling: root must be a plain absolute path");
  if (home !== undefined && !isWorktreePath(home)) throw new TypeError("compileCeiling: home must be a plain absolute path");
  const ceiling = Object.hasOwn(CEILINGS, role) ? CEILINGS[role] : undefined;
  if (ceiling === undefined) {
    if (grantHosts.length + paths.length > 0) throw new TypeError("compileCeiling: this role takes no grants");
    return null;
  }
  if (ceiling.write === "none" && grantHosts.length + paths.length > 0) throw new TypeError("compileCeiling: this role takes no grants");
  const options = {};
  if (ceiling.write === "worktree" && worktree !== undefined) {
    if (!isWorktreePath(worktree)) throw new TypeError("compileCeiling: worktree must be a plain absolute path");
    options.worktree = worktree;
  }
  // A grant above the worktree would open the main checkout and its sibling worktrees, where the governance denies do not reach.
  if (paths.some((p) => grantContainsWorktrees(p, { root, home, worktree }))) throw new TypeError("compileCeiling: a path grant may not contain the worktree");
  const lifted = (entry) =>
    options.worktree !== undefined && GOVERNANCE.ciGrantRoles.includes(role) && paths.some((p) => p.startsWith("/") && covers(p, `${options.worktree}/${baseOf(entry)}`));
  // A path grant inside the main checkout: the governed paths it reaches are denied in absolute form. The CI exception is not
  // carried over; it is for the role's own worktree only.
  const denyAbs = root === undefined ? [] : [...new Set(paths.flatMap((g) => governedUnder(expandHome(g, home), root, worktree)))];
  const hosts = [...new Set([...ceiling.hosts, ...grantHosts])];
  return {
    wall: { hosts },
    ...options,
    forbid: { write: [...GOVERNANCE.guardrailPaths, ...GOVERNANCE.ciPaths.filter((e) => !lifted(e))], run: [...GOVERNANCE.denyRun] },
    ...(denyAbs.length === 0 ? {} : { denyAbs }),
    ...(paths.length === 0 ? {} : { writePaths: paths }),
    ...(hosts.length === 0 ? {} : { readLimit: true }),
  };
}

// ---- argv ----------------------------------------------------------------------------------

/**
 * The whole argv (no binary name) for one child. Rejects anything outside { sessionId, agent, model?, ticketFile?,
 * wall?, worktree? }. No passthrough parameter exists, so no permission-broadening flag can be constructed; ticketFile adds
 * the one Read rule above, wall adds the sandbox block above, and worktree adds Write and Edit rules for that one directory.
 */
export function buildClaudeArgs(options) {
  if (!isPlainObject(options)) throw new TypeError("buildClaudeArgs needs { sessionId, agent, model?, ticketFile?, wall?, worktree? }");
  for (const key of Object.keys(options)) {
    if (!["sessionId", "agent", "model", "ticketFile", "wall", "worktree", "forbid", "writePaths", "readLimit", "denyAbs"].includes(key)) throw new TypeError(`buildClaudeArgs: unknown option ${JSON.stringify(key)}`);
  }
  const { sessionId, agent, model, ticketFile, wall, worktree, forbid, writePaths, readLimit, denyAbs } = options;
  if (wall !== undefined && !isWall(wall)) throw new TypeError("buildClaudeArgs: wall must be { hosts: [plain host names] }");
  // agent-os/02: the governance denies, task-granted write paths and the read limit all come from compileCeiling and need the wall.
  if (forbid !== undefined && !isForbid(forbid)) throw new TypeError("buildClaudeArgs: forbid must be { write: [plain paths], run: [plain words] }");
  if (writePaths !== undefined && !(isDense(writePaths) && writePaths.length <= GRANTS_MAX && writePaths.every(isGrantPath))) throw new TypeError("buildClaudeArgs: writePaths must be plain absolute or ~/ paths");
  if (readLimit !== undefined && readLimit !== true) throw new TypeError("buildClaudeArgs: readLimit must be true");
  if (denyAbs !== undefined && !(isDense(denyAbs) && denyAbs.length <= DENY_ABS_MAX && denyAbs.every((p) => typeof p === "string" && DENY_ABS_RE.test(p) && !p.split("/").some((part) => part === "." || part === "..")))) throw new TypeError("buildClaudeArgs: denyAbs must be plain absolute paths");
  if (wall === undefined && (forbid !== undefined || writePaths !== undefined || readLimit !== undefined || denyAbs !== undefined)) throw new TypeError("buildClaudeArgs: forbid, writePaths, readLimit and denyAbs need the wall");
  if (worktree !== undefined && !isWorktreePath(worktree)) throw new TypeError("buildClaudeArgs: worktree must be a plain absolute path");
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
    "--settings", settingsFor({ ticketFile, wall, worktree, forbid, writePaths, readLimit, denyAbs }),
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
