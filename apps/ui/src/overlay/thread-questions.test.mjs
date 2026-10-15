// den-mvp/37: an agent's question in the thread: its row, the form's picks, and what is sent.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { threadEntries, threadView, emptyPicks, pickOption, setOther, questionAnswers } from "./thread-model.mjs";

const RUN = "c-00000000000000aa";
const T0 = Date.parse("2026-10-15T14:43:00.000Z");
const QS = [
  { question: "Which ticket first?", header: "Next ticket", options: [{ label: "den-mvp/02", description: "Top of the queue" }, { label: "agent-os/05", description: null }], multiSelect: false },
  { question: "Which checks?", header: "Checks", options: [{ label: "unit" }, { label: "browser" }], multiSelect: true },
];
const view = (entries, approvals) => threadView(
  threadEntries({ buffer: { entries: entries.map((e, i) => ({ id: i + 1, ...e })), dropped: 0 }, agentId: RUN }),
  { now: T0, agents: [{ id: RUN, state: "working" }], approvals },
);

describe("the question row", () => {
  test("a pending question shows its questions, not Allow/Deny", () => {
    const approval = { id: "a-1", agentId: RUN, tool: "AskUserQuestion", state: "pending", expiresAt: new Date(T0 + 4 * 3600e3).toISOString(), questions: QS };
    const [row] = view([{ kind: "permission", name: "AskUserQuestion", status: "pending", approvalId: "a-1", at: new Date(T0).toISOString() }], [approval]).rows;
    assert.equal(row.kind, "question");
    assert.deepEqual(row.questions, QS);
    assert.equal(row.answerable, true);
    assert.match(row.head, /^Asking you · waiting on you/);
  });

  test("an answered question shows the answer; a dismissed one says so", () => {
    const [picked] = view([{ kind: "permission", name: "AskUserQuestion", status: "allowed", note: "den-mvp/02", approvalId: "a-1" }], []).rows;
    assert.deepEqual([picked.asked, picked.text], ["Asked you · answered", "den-mvp/02"]);
    const [dismissed] = view([{ kind: "permission", name: "AskUserQuestion", status: "denied", approvalId: "a-1" }], []).rows;
    assert.equal(dismissed.text, "Dismissed.");
  });
});

describe("the form's picks", () => {
  test("nothing is sent until every question has an answer", () => {
    let p = emptyPicks(QS);
    assert.equal(questionAnswers(QS, p), null);
    p = pickOption(QS, p, 0, "den-mvp/02");
    assert.equal(questionAnswers(QS, p), null);
    p = pickOption(QS, p, 1, "unit");
    p = pickOption(QS, p, 1, "browser");
    assert.deepEqual(questionAnswers(QS, p), ["den-mvp/02", ["unit", "browser"]]);
  });

  test("a single-select pick replaces the last; a multiSelect toggles", () => {
    let p = pickOption(QS, emptyPicks(QS), 0, "den-mvp/02");
    p = pickOption(QS, p, 0, "agent-os/05");
    assert.deepEqual(p[0].labels, ["agent-os/05"]);
    p = pickOption(QS, pickOption(QS, p, 1, "unit"), 1, "unit");
    assert.deepEqual(p[1].labels, []);
  });

  test("Other sends the user's words, and an empty Other holds the send back", () => {
    let p = pickOption(QS, emptyPicks(QS), 0, null);
    p = pickOption(QS, p, 1, "unit");
    assert.equal(questionAnswers(QS, p), null, "Other chosen but empty");
    p = setOther(p, 0, "  transcript formatting first  ");
    assert.deepEqual(questionAnswers(QS, p), ["transcript formatting first", ["unit"]]);
    p = pickOption(QS, p, 0, "den-mvp/02");
    assert.equal(p[0].other, null, "a single-select option clears Other");
  });
});
