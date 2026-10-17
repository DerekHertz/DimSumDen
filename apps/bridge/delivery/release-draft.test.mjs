// den-mvp/45: Bao drafts a release; the user's Approve tags and publishes at exactly the drafted commit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bumpOf, nextVersion, createReleaseDrafts } from "./release-draft.mjs";

const pr = (number, title, body = "") => ({ number, title, body });
const SHA = "a".repeat(40);
const MOVED = "b".repeat(40);

test("the bump follows the PR titles: breaking is major, a feature minor, anything else a patch", () => {
  assert.equal(bumpOf([pr(1, "fix: a bug"), pr(2, "docs: words")]), "patch");
  assert.equal(bumpOf([pr(1, "fix: a bug"), pr(2, "feat: a thing")]), "minor");
  assert.equal(bumpOf([pr(1, "feat(ui): a thing"), pr(2, "refactor!: drop the old route")]), "major");
  assert.equal(bumpOf([pr(1, "fix: x", "BREAKING CHANGE: gone")]), "major");
  assert.equal(bumpOf([pr(1, "Add a feature")]), "patch");
  assert.equal(nextVersion("v1.2.3", "major"), "v2.0.0");
  assert.equal(nextVersion("v1.2.3", "minor"), "v1.3.0");
  assert.equal(nextVersion("v1.2.3", "patch"), "v1.2.4");
  assert.equal(nextVersion(null, "minor"), "v0.1.0");
});

function fakeGit() {
  const calls = [];
  return {
    calls,
    main: SHA,
    mainSha: async function () { return this.main; },
    lastTag: async () => "v0.4.1",
    mergedSince: async ({ tag, sha }) => { calls.push(["since", tag, sha]); return [pr(7, "feat: a thing"), pr(8, "fix: a bug")]; },
    publishRelease: async (r) => { calls.push(["publish", r]); },
  };
}

test("a draft names the version, the commit and the PRs; nothing is published by proposing", async () => {
  const git = fakeGit();
  const drafts = createReleaseDrafts({ git });
  const d = await drafts.propose();
  assert.equal(d.version, "v0.5.0");
  assert.equal(d.sha, SHA);
  assert.deepEqual(d.prs.map((p) => p.number), [7, 8]);
  assert.match(d.notes, /#7/);
  assert.deepEqual(drafts.current(), d);
  assert.equal(git.calls.some((c) => c[0] === "publish"), false);
});

test("Approve publishes at exactly the drafted commit, even when main has moved; Decline drops the draft", async () => {
  const git = fakeGit();
  const drafts = createReleaseDrafts({ git });
  const d = await drafts.propose();
  git.main = MOVED;
  assert.deepEqual(await drafts.approve("wrong"), { ok: false, status: 409, error: "that is not the current draft" });
  const res = await drafts.approve(d.id);
  assert.equal(res.ok, true);
  const publish = git.calls.find((c) => c[0] === "publish")[1];
  assert.equal(publish.sha, SHA);
  assert.equal(publish.version, "v0.5.0");
  assert.equal(drafts.current(), null);
  const d2 = await drafts.propose();
  assert.equal(d2.sha, MOVED);
  assert.equal((await drafts.decline(d2.id)).ok, true);
  assert.equal(drafts.current(), null);
  assert.equal(git.calls.filter((c) => c[0] === "publish").length, 1);
});

test("no merged PRs since the last tag gives no draft", async () => {
  const git = { ...fakeGit(), mergedSince: async () => [] };
  await assert.rejects(createReleaseDrafts({ git }).propose(), /nothing merged/);
});
