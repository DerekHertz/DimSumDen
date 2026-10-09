// Test-only helper for organism-infra/211 (billed-token spend). Not a test file (no *.test.mjs
// suffix), so `npm test` skips it. Builds fixture Claude session transcripts (JSONL) in the
// shape the real ones have: one assistant record per content block, so one API message
// (one `message.id`) can appear on several lines carrying the same `usage`.
import { mkdtempSync, writeFileSync, appendFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const FOUR = ["input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"];

// A tmp dir to hold transcripts (kept apart from the board root).
export function transcriptDir() {
  return realpathSync(mkdtempSync(path.join(tmpdir(), "spend-tx-")));
}

// assistant("msg_1", [in, cacheCreate, cacheRead, out]) -> one assistant JSONL record (an object).
// `block` varies the content block so several lines of one message differ except for usage.
export function assistant(id, [i, cc, cr, o], block = "text") {
  const content = block === "tool_use" ? [{ type: "tool_use", id: `toolu_${id}`, name: "Bash", input: { command: "true" } }] : [{ type: "text", text: "hi" }];
  return {
    type: "assistant",
    isSidechain: false,
    message: {
      model: "claude-sonnet-5-5",
      id,
      type: "message",
      role: "assistant",
      content,
      usage: { input_tokens: i, cache_creation_input_tokens: cc, cache_read_input_tokens: cr, output_tokens: o, service_tier: "standard" },
    },
  };
}

export const userLine = (text = "go") => ({ type: "user", message: { role: "user", content: text } });

// writeTranscript(dir, "sess-1", records) writes <dir>/sess-1.jsonl; a string record is written as-is
// (to plant garbage). Returns the path.
export function writeTranscript(dir, session, records) {
  const file = path.join(dir, `${session}.jsonl`);
  writeFileSync(file, records.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n") + "\n");
  return file;
}

export function appendTranscript(file, records) {
  appendFileSync(file, records.map((r) => (typeof r === "string" ? r : JSON.stringify(r))).join("\n") + "\n");
}
