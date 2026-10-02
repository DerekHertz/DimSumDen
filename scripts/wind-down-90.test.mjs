// organism-infra/91: the 5-hour wind-down line moved from 80% to 90% (user, 2026-10-01).
// AC3 is a "no remaining reference" criterion, so it is checked by reading the non-test scripts/ sources.
// AC1 and AC2 (the 89.9% / 90% boundary through codeDecides, runPrelude and the CLI) live in jev-wake-prelude.test.mjs
// and jev-wake-prelude-cli.test.mjs, tagged [91].
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

function sources(dir = SCRIPTS) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...sources(p));
    else if (e.name.endsWith(".mjs") && !e.name.endsWith(".test.mjs")) out.push(p);
  }
  return out;
}

const EIGHTY = /\b(80\s*%|0\.8)(?![\d.])/;
const FIVE_HOUR_WORDS = /usage|wind-?down|5-hour|five-?hour|suppress/i;

test("[91] AC3: the wake prelude has no 80% / 0.8 left (its wind-down line is 90%)", () => {
  const text = readFileSync(path.join(SCRIPTS, "jev-wake-prelude.mjs"), "utf8");
  const hits = text.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => EIGHTY.test(l));
  assert.deepEqual(hits, [], `80% still named in jev-wake-prelude.mjs: ${JSON.stringify(hits)}`);
});

test("[91] AC3: the prelude's wind-down constant reads 0.9", () => {
  const text = readFileSync(path.join(SCRIPTS, "jev-wake-prelude.mjs"), "utf8");
  assert.match(text, /USAGE_WIND_DOWN\s*=\s*0\.9\b/);
});

test("[91] AC3: no non-test script names 80% beside usage, wind-down or a 5-hour reading, except a weekly check", () => {
  const hits = [];
  for (const file of sources()) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (EIGHTY.test(line) && FIVE_HOUR_WORDS.test(line) && !/week/i.test(line)) hits.push(`${path.relative(SCRIPTS, file)}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, []);
});
