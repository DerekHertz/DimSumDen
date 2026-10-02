#!/usr/bin/env node
// Prints the current main session's context size as JSON:
// {"session","context_tokens","percent"}. Reads the newest top-level transcript in
// $HOME/.claude/projects/<cwd with non-alphanumerics -> "-">/ (subagent transcripts
// live in subdirectories and are ignored). No transcript: context_tokens null, exit 0.
import { readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadContextTokens } from "./context-state.mjs";

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

// CLAUDE_CODE_SESSION_ID names this session's transcript; look for it under every
// project dir, since the cwd may be a worktree or subdirectory with a different slug.
function sessionTranscript(projects, id) {
  let dirs = [];
  try {
    dirs = readdirSync(projects, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const file = path.join(projects, d.name, `${id}.jsonl`);
    try {
      return { file, session: id, mtime: statSync(file).mtimeMs };
    } catch {
      // not in this project dir
    }
  }
  return null;
}

const home = process.env.HOME || os.homedir();
const projects = path.join(home, ".claude", "projects");
const id = process.env.CLAUDE_CODE_SESSION_ID;
const dir = path.join(projects, process.cwd().replace(/[^A-Za-z0-9]/g, "-"));
// organism-infra/109: the status line records the real number for this session; it wins over
// the transcript. Sessions it hasn't seen fall back to transcripts as before.
const seen = id ? loadContextTokens(home, id) : null;
const t = seen !== null ? null : (id && sessionTranscript(projects, id)) || newestTranscript(dir);
const tokens = seen !== null ? seen : t ? lastUsageTokens(t.file) : null;
const session = seen !== null ? id : t ? t.session : null;
const percent = tokens === null ? null : Math.min(100, Math.round((tokens / WINDOW) * 10000) / 100);
console.log(JSON.stringify({ session, context_tokens: tokens, percent }));
