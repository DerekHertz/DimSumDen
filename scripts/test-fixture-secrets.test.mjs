// organism-infra/96: the dispatch-context root scan (hasSecret) must not trip on
// test sources, so fake keys in these fixtures are assembled at runtime.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasSecret } from "./exposure.mjs";

const FILES = [
  "jev-advisory-cli.test.mjs",
  "jev-advisory.test.mjs",
  "jev-hardening.test.mjs",
  "jev-wake-prelude.test.mjs",
  "risk-check.test.mjs",
  "usage-provider.test.mjs",
];

for (const f of FILES) {
  test(`${f} does not trip hasSecret (no literal fake key in source)`, () => {
    const body = readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
    assert.equal(hasSecret(body), false);
  });
}
