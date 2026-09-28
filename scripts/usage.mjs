#!/usr/bin/env node
// Prints plan usage (5-hour and weekly) for usage-watch in sessions where the
// desktop app's get_usage tool is missing (WSL). Ticket organism-infra/33.
// Reads the Claude Code OAuth token and sends it only to api.anthropic.com.
// Never prints the token. The endpoint is undocumented; on any failure it
// exits 1 so usage-watch falls back to asking the user.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function fail(msg) {
  console.error(`usage: ${msg}`);
  process.exit(1);
}

let token;
try {
  const creds = JSON.parse(readFileSync(join(homedir(), ".claude", ".credentials.json"), "utf8"));
  token = creds.claudeAiOauth?.accessToken;
} catch {
  fail("could not read Claude Code credentials");
}
if (!token) fail("no OAuth access token found");

let res;
try {
  res = await fetch("https://api.anthropic.com/api/oauth/usage", {
    headers: { Authorization: `Bearer ${token}`, "anthropic-beta": "oauth-2025-04-20" },
    signal: AbortSignal.timeout(10_000),
  });
} catch (e) {
  fail(`request failed (${e.name})`);
}
if (!res.ok) fail(`HTTP ${res.status}`);

let body;
try {
  body = await res.json();
} catch {
  fail("response was not JSON");
}

const windows = { five_hour: "5-hour", seven_day: "weekly" };
const out = {};
for (const [key, label] of Object.entries(windows)) {
  const w = body?.[key];
  if (w && typeof w.utilization === "number") {
    out[label] = { percent: Math.round(w.utilization), resets_at: w.resets_at ?? null };
  }
}
if (!Object.keys(out).length) fail("response had no usage windows");

console.log(JSON.stringify(out));
