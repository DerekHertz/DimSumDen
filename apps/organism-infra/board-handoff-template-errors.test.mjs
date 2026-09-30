// organism-infra/66: `board handoff --template` refusals.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeBoardFixture, runBoard } from "./board-fixture.mjs";

const NO_ROOT = { ORGANISM_ROOT: "" };
const board = (fx, args) => runBoard(args, { cwd: fx.worktree, env: NO_ROOT });

test("--template with no claim lock and no --cell asks for --cell", async () => {
  const fx = await makeBoardFixture();
  try {
    const r = await board(fx, ["handoff", fx.ticketRelPath, "--template"]);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /--cell/);
  } finally {
    await fx.cleanup();
  }
});

test("--template rejects an unknown cell", async () => {
  const fx = await makeBoardFixture();
  try {
    const r = await board(fx, ["handoff", fx.ticketRelPath, "--template", "--cell", "chef"]);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /invalid cell/);
  } finally {
    await fx.cleanup();
  }
});

test("--cell without --template is refused", async () => {
  const fx = await makeBoardFixture();
  try {
    const r = await board(fx, ["handoff", fx.ticketRelPath, "--from", "/tmp/x.md", "--cell", "qa"]);
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /only apply with --template/);
  } finally {
    await fx.cleanup();
  }
});
