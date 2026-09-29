#!/usr/bin/env node
// Prints the current main session's context size as JSON:
// {"session","context_tokens","percent"}. Reads the newest top-level transcript in
// $HOME/.claude/projects/<cwd with non-alphanumerics -> "-">/ (subagent transcripts
// live in subdirectories and are ignored). No transcript: context_tokens null, exit 0.
import { readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const WINDOW = Number(process.env.CONTEXT_WINDOW_TOKENS) || 1_000_000;

function newestTranscript(dir) {
  let best = null;
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".jsonl")) continue;
    const file = path.join(dir, e.name);
    const mtime = statSync(file).mtimeMs;
    if (!best || mtime > best.mtime) best = { file, mtime, session: e.name.slice(0, -".jsonl".length) };
  }
  return best;
}

function lastUsageTokens(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    let rec;
    try {
      rec = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    const u = rec?.type === "assistant" ? rec.message?.usage : null;
    if (u) {
      return (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
    }
  }
  return null;
}

const home = process.env.HOME || os.homedir();
const dir = path.join(home, ".claude", "projects", process.cwd().replace(/[^A-Za-z0-9]/g, "-"));
const t = newestTranscript(dir);
const tokens = t ? lastUsageTokens(t.file) : null;
const percent = tokens === null ? null : Math.min(100, Math.round((tokens / WINDOW) * 10000) / 100);
console.log(JSON.stringify({ session: t ? t.session : null, context_tokens: tokens, percent }));
