// Finds the Claude Code OAuth token for scripts/usage-claude.mjs (ticket organism-infra/134).
// One function tries each source in order and reports which one answered:
//   1. ~/.claude/.credentials.json            (WSL, Linux, anywhere the file exists)
//   2. the macOS Keychain, on darwin only      (`security find-generic-password`)
// Native Windows is not supported: with no credentials file it fails like Linux does.
// The token is returned to the caller and never printed, logged, or put on a command line.
// A failure's `reasons` hold only fixed text and errno names, never output of the Keychain.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export const KEYCHAIN_SERVICE = "Claude Code-credentials";
const FILE_LABEL = "~/.claude/.credentials.json";
const DEFAULT_KEYCHAIN_TIMEOUT_MS = 5000;

function tokenFrom(text) {
  const token = JSON.parse(text)?.claudeAiOauth?.accessToken;
  return typeof token === "string" && token ? token : null;
}

function fromFile() {
  let text;
  try {
    text = readFileSync(join(homedir(), ".claude", ".credentials.json"), "utf8");
  } catch (e) {
    return { reason: e.code === "ENOENT" ? "not found" : `unreadable (${e.code ?? e.name})` };
  }
  try {
    const token = tokenFrom(text);
    return token ? { token } : { reason: "no OAuth access token in it" };
  } catch {
    return { reason: "not valid JSON" };
  }
}

function fromKeychain(env) {
  const bin = env.USAGE_SECURITY_BIN || "security";
  const parsed = Number(env.USAGE_SECURITY_TIMEOUT_MS);
  const timeout = parsed > 0 ? parsed : DEFAULT_KEYCHAIN_TIMEOUT_MS;
  // argv carries the service name only; the payload comes back on stdout.
  const r = spawnSync(bin, ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"], {
    encoding: "utf8",
    timeout,
    killSignal: "SIGKILL",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (r.error) {
    if (r.error.code === "ETIMEDOUT") return { reason: `timed out after ${timeout}ms (prompt not answered?)` };
    return { reason: `could not run security (${r.error.code ?? r.error.name})` };
  }
  if (r.status !== 0) return { reason: `item not found or access denied (security exit ${r.status})` };
  try {
    const token = tokenFrom(r.stdout);
    return token ? { token } : { reason: "payload had no OAuth access token" };
  } catch {
    return { reason: "payload was not JSON" };
  }
}

// Returns { token, source } or { token: null, platform, reasons: [{source, reason}] }.
export function findToken(env = process.env) {
  const platform = env.USAGE_PLATFORM || process.platform;
  const reasons = [];
  const sources = [["credentials file", FILE_LABEL, fromFile]];
  if (platform === "darwin") sources.push(["keychain", `keychain item "${KEYCHAIN_SERVICE}"`, () => fromKeychain(env)]);
  for (const [source, label, read] of sources) {
    const r = read();
    if (r.token) return { token: r.token, source };
    reasons.push({ source, label, reason: r.reason });
  }
  return { token: null, platform, reasons };
}

export function describeFailure({ platform, reasons }) {
  const tried = reasons.map((r) => `${r.label}: ${r.reason}`).join("; ");
  return `could not read Claude Code credentials on ${platform} (tried ${tried})`;
}
