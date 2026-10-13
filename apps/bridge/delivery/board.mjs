// den-mvp outcome 3 (spec sections 1 and 4): the board operations of a delivery job, made by the bridge. An agent of a
// delivery step writes nothing on the board; the bridge claims the ticket for the step's role, writes the handoff from
// what it recorded of the run, releases the ticket, and resolves it after the merge is confirmed. Every call names one
// ticket, the job's own, and goes through the board service, so the board's rules (who may release at which status,
// that a release needs a handoff) hold for the bridge too.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { claim, publishHandoff, release, resolve } from "../../organism-infra/board-service.mjs";

const REPORT_MAX = 60000; // characters of a run's report kept in a handoff (the board caps a handoff at 256 KiB)

export function createDeliveryBoard(root) {
  return {
    /** Claims the ticket for a step's role. Rejects when another cell holds it. */
    claim: (ref, { role, mode }) => claim(root, ref, role, mode ? { mode } : {}),
    /**
     * Writes the step's handoff and releases the ticket at in-review. The State block is the bridge's own record of the
     * run; the agent's last message follows it as a quoted report, and is data to read.
     */
    async handoff(ref, { role, mode, runId, sha, branch, verdict, report }) {
      const [feature, ticket] = ref.split("/");
      const nn = /^(\d{2,})-/.exec(ticket)[1];
      const state = {
        ticket: ref, cell: role, ...(mode ? { mode } : {}),
        current_step: verdict ? `${role} ${verdict === "pass" ? "passed" : "bounced"} commit ${sha.slice(0, 12)}` : `${role} committed ${sha.slice(0, 12)}`,
        artifacts: [...(branch ? [`branch ${branch}`] : []), `commit ${sha}`], decisions: [], failures: [],
        pending: verdict === "bounce" ? [{ item: "fix the findings below", owner: "developer" }] : [],
      };
      const body =
        `# ${role} handoff for ${feature}/${ticket}\n\nWritten by the den's bridge for run ${runId}. The State block is the bridge's record; the report is the agent's last message.\n\n` +
        `## State\n\n\`\`\`json\n${JSON.stringify(state, null, 2)}\n\`\`\`\n\n## Report\n\n${String(report ?? "(the run left no report)").slice(0, REPORT_MAX).replace(/```/g, "'''")}\n`;
      // The board refuses a draft that lies inside a worktree, so the draft is written in a directory of its own.
      const dir = await mkdtemp(path.join(tmpdir(), "den-handoff-"));
      try {
        const name = `${nn}-${role}${mode ? `-${mode}` : ""}-${runId.slice(2, 10)}.md`;
        const draft = path.join(dir, name);
        await writeFile(draft, body, { mode: 0o600 });
        await publishHandoff(root, ref, draft, { name });
      } finally {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      }
      await release(root, ref, "in-review", verdict ? `${role} ${verdict} at ${sha.slice(0, 12)} (den delivery)` : `committed ${sha.slice(0, 12)} (den delivery)`);
    },
    /** Gives up a step's claim without a handoff: the run failed, was stopped, or left nothing to hand on. */
    drop: (ref, { status, reason }) => release(root, ref, status, reason, status === undefined ? { force: true, keepStatus: true } : { force: true }),
    /** After a confirmed merge. */
    resolve: (ref, pr) => resolve(root, [ref], { pr: String(pr), note: "merged by the den's delivery" }),
  };
}
