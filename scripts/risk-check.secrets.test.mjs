// organism-infra/45, criterion 2: SECRET_PATTERNS matches GitHub, sk- and Slack
// token shapes. Fixtures are built at runtime so CI gitleaks never sees a
// token-shaped literal in the diff.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SECRET_PATTERNS } from "./risk-check.mjs";

const matches = (text) => SECRET_PATTERNS.some((p) => p.re.test(text));
const body = (n) => "aB3dE5fG7h".repeat(Math.ceil(n / 10)).slice(0, n);

test("SECRET_PATTERNS matches a GitHub personal access token shape", () => {
  const tok = "gh" + "p_" + body(36);
  assert.ok(matches(`const x = ${tok};`));
});

test("SECRET_PATTERNS matches an sk- API key shape", () => {
  const tok = "s" + "k-" + body(32);
  assert.ok(matches(`key ${tok}`));
});

test("SECRET_PATTERNS matches Slack xoxb-, xoxa- and xoxp- token shapes", () => {
  for (const kind of ["b", "a", "p"]) {
    const tok = "xo" + "x" + kind + "-" + "1234567890-" + body(24);
    assert.ok(matches(`SLACK ${tok}`), `xox${kind}- token`);
  }
});

test("SECRET_PATTERNS does not flag ordinary prose or short lookalikes", () => {
  assert.equal(matches("the ghp_ prefix, sk- prefix and xoxb- prefix are documented"), false);
  assert.equal(matches("task-list and desk-lamp"), false);
});
