// den-mvp outcome 3 (spec sections 4 and 8, ADR 0024): the delivery runner. Starting a delivery on a ticket is the
// user's approval of the ordinary path for it: a developer, an independent qa verify, the scripted risk check, security
// when that check or the changed paths ask for it, then a pull request and a merge once the required checks are green.
// The plan (plan.mjs) says what is next; this module does it, records it, and stops at the first thing that is the
// user's. It starts agents only through the host's internal entry, so usage, enforcement, room and the wall apply to
// every step as to any run. It holds no timer and polls nothing: it moves when a run ends, when a git-host call
// returns, or on the user's click.
//
//   createDelivery({ host, board, git, log, readTicket, onChange }) -> {
//     ready, start({ ref }), resume(id, { verdict? }), stop(id), close(id), onEnd(run), snapshot()
//   }
//   host: { start(input), stop(agentId) }    board: delivery/board.mjs    git: delivery/git-host.mjs    log: delivery/jobs.mjs
//   readTicket(ref) -> { title, type, frontier } | null, from the board as the bridge reads it
// The route answers are { ok: true, status, delivery } or { ok: false, status, error }.
import { randomBytes } from "node:crypto";
import { hasSecret } from "../../../scripts/exposure.mjs";
import { REF_RE } from "../cells/policy.mjs";
import { JOB_ID_RE } from "./jobs.mjs";
import { DELIVERABLE_TYPES, VISUAL_TYPES, isCiPath, isUserMergePath, nextStep } from "./plan.mjs";
import { readVerdict } from "./prompts.mjs";

const KEPT = 30; // ended deliveries kept in the snapshot
const PLAN_STEPS_MAX = 12; // bridge operations in a row before the runner stops and says the plan did not move
const refuse = (status, error) => ({ ok: false, status, error });
// An error's text as the den may show it: one line, no credential a remote URL carried, nothing that looks like a secret.
const errorText = (err) => {
  const text = String(err?.stderr || err?.message || err).replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]+/g, " ").replace(/\/\/[^@\s/]+@/g, "//").trim().slice(0, 300);
  return hasSecret(text) ? "[masked: possible secret]" : text;
};

export function createDelivery({ host, board, git, log, readTicket, onChange = () => {} }) {
  const jobs = new Map(); // id -> job; insertion order is snapshot order
  let mergeChain = Promise.resolve(); // merges go one at a time
  let closing = false; // the bridge is shutting down: nothing new is started

  const view = (j) => {
    const now = (e) => (j.candidate && e?.sha === j.candidate.sha ? e : null); // evidence counts for the candidate only
    const risk = now(j.evidence.risk);
    return {
      id: j.id, ref: j.ref, title: j.title, state: j.state, step: j.step, pause: j.pause, base: j.base, branch: j.branch,
      candidate: j.candidate ? { sha: j.candidate.sha } : null, bounces: j.bounces, live: j.live ? { runId: j.live.runId, role: j.live.role, mode: j.live.mode } : null,
      evidence: {
        qa: now(j.evidence.qa)?.verdict ?? null, security: now(j.evidence.security)?.verdict ?? null,
        risk: risk ? { clean: risk.clean, hits: risk.hits, security: risk.security, userMerge: risk.userMerge } : null,
        ci: now(j.evidence.ci)?.state ?? null,
      },
      pr: j.pr, runs: j.runs.map((r) => ({ ...r })), uncertain: j.uncertain ?? null, startedAt: j.startedAt, updatedAt: j.updatedAt,
    };
  };
  const live = (j) => j.state === "running" || j.state === "paused";
  async function save(job) {
    job.updatedAt = new Date().toISOString();
    onChange({ type: "delivery", delivery: view(job) });
    await log.save(job).catch((err) => console.error(`bridge: could not write the delivery log: ${err?.message ?? err}`));
  }
  function trim() {
    for (const [id, j] of jobs) {
      if (jobs.size <= KEPT) return;
      if (!live(j)) jobs.delete(id);
    }
  }
  // One thing at a time per job: an end, a resume and the plan never interleave.
  const enqueue = (job, fn) => {
    const run = (job.chain ?? Promise.resolve()).then(fn).catch((err) => {
      console.error(`bridge: delivery ${job.id} failed: ${err?.stack ?? err}`);
      return pause(job, "environment", `the bridge hit an error: ${errorText(err)}`, "Resume to try again.");
    });
    job.chain = run.catch(() => {});
    return run;
  };
  async function pause(job, kind, reason, next) {
    if (job.state !== "running") return;
    job.state = "paused";
    job.pause = { kind, reason, next };
    job.gen += 1;
    await save(job);
  }
  // A side effect: its intent is written first, its outcome after. A failure rejects, and the job is not advanced.
  async function op(job, name, detail, fn) {
    await log.op(job.id, name, "intent", detail);
    try {
      const result = await fn();
      await log.op(job.id, name, "done", detail).catch(() => {});
      return result;
    } catch (err) {
      await log.op(job.id, name, "failed", detail).catch(() => {});
      throw err;
    }
  }

  // After a restart nothing runs by itself: every job that was under way waits for the user's Resume.
  const ready = (async () => {
    for (const job of await log.replay()) {
      job.gen = 0;
      if (job.live) job.lost = job.live; // its run ended with the bridge; the claim it held is dropped on Resume
      job.live = null;
      if (job.state === "running" || (job.state === "paused" && job.pause.kind === "no-room")) {
        job.state = "paused";
        job.pause = { kind: "bridge-restart", reason: `the bridge restarted${job.uncertain ? ` during a ${job.uncertain}` : ""}`, next: "Resume: the bridge looks at what happened before it does anything again." };
      }
      jobs.set(job.id, job);
    }
    trim();
  })().catch((err) => console.error(`bridge: delivery replay failed: ${err?.stack ?? err}`));

  async function start(input) {
    const ref = input?.ref;
    if (typeof ref !== "string" || !REF_RE.test(ref)) return refuse(400, "ref must look like <feature>/<NN>-<slug>");
    await ready;
    if (closing) return refuse(503, "the bridge is shutting down");
    const ticket = await readTicket(ref);
    if (!ticket) return refuse(404, "no such ticket");
    if (!DELIVERABLE_TYPES.includes(ticket.type)) return refuse(409, `a ${ticket.type || "ticket of this type"} is not delivered as software; start its role directly`);
    if (!ticket.frontier) return refuse(409, "the ticket is not in the frontier");
    let base;
    try {
      base = await git.mainSha();
    } catch (err) {
      return refuse(502, `could not read the main branch: ${errorText(err)}`);
    }
    // No await from here to the registration, so two clicks start one delivery.
    if ([...jobs.values()].some((j) => j.ref === ref && live(j))) return refuse(409, "this ticket already has a delivery; resume or close it");
    const job = {
      id: `d-${randomBytes(8).toString("hex")}`, ref, title: ticket.title ?? "", type: ticket.type, visual: VISUAL_TYPES.includes(ticket.type), state: "running", pause: null, step: null,
      base, branch: null, candidate: null, evidence: { qa: null, security: null, risk: null, pr: null, ci: null, verdict: null }, bounces: 0, findings: null,
      live: null, claimed: false, runs: [], pr: null, startedAt: new Date().toISOString(), updatedAt: null, gen: 0,
    };
    jobs.set(job.id, job);
    trim();
    await save(job);
    enqueue(job, () => advance(job));
    return { ok: true, status: 201, delivery: view(job) };
  }

  async function advance(job) {
    for (let moves = 0; job.state === "running" && !job.live && !closing; moves += 1) {
      if (moves >= PLAN_STEPS_MAX) return pause(job, "environment", "the plan did not move", "Resume to try again.");
      const next = nextStep(job);
      if (next.kind === "pause") return pause(job, next.pause, next.reason, next.next);
      if (next.kind === "run") return startRun(job, next);
      job.step = next.kind;
      await save(job);
      const gen = job.gen;
      try {
        if (next.kind === "check") await check(job, gen);
        else if (next.kind === "publish") await publish(job, gen);
        else if (next.kind === "ci") await watchChecks(job, gen);
        else if (next.kind === "merge") await (mergeChain = mergeChain.catch(() => {}).then(() => merge(job, gen)));
        else if (next.kind === "resolve") return await resolveTicket(job, gen);
      } catch (err) {
        console.error(`bridge: delivery ${job.id} could not ${next.kind}: ${err?.message ?? err}`);
        if (job.gen === gen) await pause(job, next.kind === "check" ? "environment" : "publish-failed", `could not ${next.kind === "ci" ? "read the checks" : next.kind}: ${errorText(err)}`, "Resume to try again: the bridge looks at what is there first.");
        return;
      }
    }
  }

  async function startRun(job, next) {
    const { role, mode } = next;
    const started = await host.start({ ref: job.ref, role, ...(mode ? { mode } : {}), delivery: { at: next.at, since: next.since, ...(next.fix ? { findings: job.findings ?? "(the review left no findings text)" } : {}) } });
    if (!started.ok) {
      const kind = started.status === 429 ? (/usage/.test(started.error) ? "usage" : "no-room") : started.status === 409 ? "busy" : "environment";
      return pause(job, kind, started.error, kind === "no-room" ? "It starts by itself when a run ends, or on Resume." : "Resume once that has changed.");
    }
    job.live = { runId: started.agent.id, role, mode: mode ?? null };
    job.step = role;
    job.claimed = false;
    await save(job);
    // Stopped while the agent was starting: the run is ended, and its end finds the job waiting.
    if (job.state !== "running") return void (await host.stop(job.live.runId));
    try {
      await op(job, "claim", { runId: job.live.runId }, () => board.claim(job.ref, { role, mode }));
      job.claimed = true;
      await save(job);
    } catch (err) {
      // The board would not give the ticket to this step: the run is ended, and its end (below) finds the job paused.
      await pause(job, "board", `the board refused the claim: ${errorText(err)}`, "Free the ticket on the board, then Resume.");
      await host.stop(job.live.runId);
    }
  }

  // The claim a step held, given up without a handoff. A developer's claim changed the status, so it is put back.
  async function drop(job, role, reason) {
    if (!job.claimed) return;
    job.claimed = false;
    const status = role === "developer" ? (job.candidate ? "in-review" : "ready-for-agent") : undefined;
    await op(job, "release", {}, () => board.drop(job.ref, { status, reason })).catch((err) => console.error(`bridge: could not release ${job.ref}: ${err?.message ?? err}`));
  }

  /** The host's end hook: the run's state, and the commits and last message the bridge itself recorded. */
  function onEnd(run) {
    const job = [...jobs.values()].find((j) => j.live?.runId === run?.agentId);
    const done = job ? enqueue(job, () => ended(job, run)) : Promise.resolve();
    // A run ended, so a worker slot may be free: a delivery that waited for room tries again.
    return done.then(() => Promise.all([...jobs.values()].filter((j) => j.state === "paused" && j.pause.kind === "no-room").map((j) => resume(j.id))));
  }
  async function ended(job, run) {
    const { runId, role, mode } = job.live;
    job.live = null;
    job.runs.push({ runId, role, mode, state: run.state, sha: run.sha ?? null });
    const short = (run.sha ?? "").slice(0, 12);
    const giveUp = async (kind, reason, next) => {
      await drop(job, role, `den delivery: ${reason}`);
      await pause(job, kind, reason, next);
      await save(job);
    };
    if (job.state !== "running") return giveUp("stopped", "stopped", ""); // already paused (a stop, a refused claim): only the claim is dropped
    if (run.state !== "done") return giveUp(run.state === "terminated" ? "stopped" : "step-failed", `the ${role} run ${run.state === "terminated" ? "was stopped" : "failed"}${run.reason ? ` (${String(run.reason).slice(0, 80)})` : ""}`, "Resume to run the step again.");
    if (!run.sha || !run.startSha) return giveUp("environment", `the bridge could not record the ${role} run's commit`, "Resume to run the step again.");

    if (role === "developer") {
      if (run.sha === run.startSha) return giveUp("no-commit", "the developer committed nothing", "Read its report in the thread, then Resume to run it again or close the delivery.");
      job.candidate = { sha: run.sha, runId };
      job.branch ??= run.branch; // the first developer run names the branch; a fix round moves it forward
      job.findings = null;
    } else {
      const verdict = readVerdict(run.report);
      if (run.sha !== run.startSha) return giveUp("changed-commit", `the ${role} run changed the commit it was reviewing, so its verdict is not counted`, "Resume to review again.");
      if (!verdict) return giveUp("no-verdict", `the ${role} run ended without a verdict line`, "Read its report in the thread, then Resume to review again.");
      job.evidence[role === "qa" ? "qa" : "security"] = { sha: run.startSha, runId, verdict };
      if (verdict === "bounce") {
        job.bounces += 1;
        job.findings = run.report;
      }
    }
    await save(job);
    try {
      const reviewed = role === "developer" ? null : job.evidence[role === "qa" ? "qa" : "security"].verdict;
      await op(job, "release", { runId }, () => board.handoff(job.ref, { role, mode, runId, sha: run.sha, branch: run.branch, verdict: reviewed, report: run.report }));
      job.claimed = false;
    } catch (err) {
      await drop(job, role, "den delivery: the handoff could not be written");
      return pause(job, "board", `the board refused the ${role} handoff (${short}): ${errorText(err)}`, "Resume to go on from the recorded commit.");
    }
    await advance(job);
  }

  // The scripted checks of the candidate, run by the bridge from its own checkout.
  async function check(job, gen) {
    const range = { base: job.base, sha: job.candidate.sha };
    if (!(await git.descends(range))) {
      if (job.gen === gen) await pause(job, "changed-commit", "the commit is not built on the commit the delivery started from", "Close the delivery and start it again.");
      return;
    }
    const [files, secret, risk] = [await git.changed(range), await git.addsSecret(range), await git.risk(range)];
    if (job.gen !== gen) return;
    const userMerge = files.some(isUserMergePath);
    job.evidence.risk = { sha: range.sha, clean: risk.clean === true, hits: risk.hits.length, secret: secret === true, security: risk.clean !== true || userMerge, userMerge, ciChange: files.some(isCiPath), files: files.length };
    await save(job);
  }

  const prBody = (job) =>
    [
      `Delivered from the den for ticket \`${job.ref}\`.`, "",
      `- Commit: \`${job.candidate.sha}\``,
      `- qa verify: ${job.evidence.qa.verdict} (run ${job.evidence.qa.runId})`,
      `- Risk check: ${job.evidence.risk.clean ? "clean" : `${job.evidence.risk.hits} hit(s)`}${job.evidence.risk.userMerge ? "; touches a guardrail, bridge or check path: the user reviews and merges" : ""}`,
      ...(job.evidence.security?.sha === job.candidate.sha ? [`- Security review: ${job.evidence.security.verdict} (run ${job.evidence.security.runId})`] : []),
      "", "The handoffs are on the board. The bridge opened this pull request; no agent holds git-host credentials.",
    ].join("\n");

  // The candidate on the remote branch and its pull request. What is already there is found first, so a repeat adds nothing.
  async function publish(job, gen) {
    const { sha } = job.candidate;
    let pr = await git.findPr({ branch: job.branch });
    if (pr?.state !== "MERGED" && pr?.sha !== sha) {
      // CI configuration runs on the git host the moment it is pushed: the bridge never pushes a change to it.
      if (job.evidence.risk.ciChange) return pause(job, "ci-change", "the change edits CI configuration, which would run as soon as it is pushed; the bridge did not push it", `Look at the commit on the local branch ${job.branch}. Push it and open the pull request yourself if it is right, then Resume.`);
      await op(job, "push", { sha }, () => git.push({ branch: job.branch, sha }));
      if (!pr || pr.state !== "OPEN") {
        await op(job, "pr", { sha }, () => git.openPr({ branch: job.branch, title: hasSecret(job.title) ? job.ref : `${job.ref}: ${job.title}`, body: prBody(job) }));
      }
      pr = await git.findPr({ branch: job.branch });
      if (!pr) throw new Error("the pull request was not found after it was opened");
    }
    if (job.gen !== gen) return;
    job.pr = { number: pr.number, url: pr.url };
    if (pr.state === "CLOSED") return pause(job, "pr-closed", `pull request #${pr.number} was closed without a merge`, "Reopen it, or close the delivery.");
    if (pr.state === "OPEN" && pr.sha !== sha) return pause(job, "changed-commit", `pull request #${pr.number} is not at the commit the den checked`, "Close the delivery, or put the branch back and Resume.");
    job.evidence.pr = { sha, number: pr.number, state: pr.state, mergeable: "UNKNOWN" };
    await save(job);
  }

  const ciOf = (checks) => (checks.length === 0 ? "none" : checks.some((c) => c.done && !c.ok) ? "red" : checks.every((c) => c.done && c.ok) ? "green" : "pending");
  // What the git host says of the pull request now. -> the state, or null when the job was paused for it.
  async function observe(job, gen) {
    const st = await git.prState({ number: job.pr.number });
    if (job.gen !== gen) return null;
    const { sha } = job.candidate;
    if (st.state === "CLOSED") return void (await pause(job, "pr-closed", `pull request #${st.number} was closed without a merge`, "Reopen it, or close the delivery."));
    if (st.state === "OPEN" && st.sha !== sha) return void (await pause(job, "changed-commit", `pull request #${st.number} is not at the commit the den checked`, "Close the delivery, or put the branch back and Resume."));
    job.evidence.pr = { sha, number: st.number, state: st.state, mergeable: st.mergeable };
    job.evidence.ci = { sha, state: ciOf(st.checks), failed: st.checks.filter((c) => c.done && !c.ok).map((c) => c.name).slice(0, 10) };
    await save(job);
    return st;
  }
  async function watchChecks(job, gen) {
    await git.waitChecks({ number: job.pr.number });
    if (job.gen === gen) await observe(job, gen);
  }

  // The merge is decided on what the git host says at this moment, not on what was recorded a while ago.
  async function merge(job, gen) {
    if (job.gen !== gen) return;
    const st = await observe(job, gen);
    if (!st || st.state === "MERGED") return;
    if (nextStep(job).kind !== "merge") return; // a check turned red, a conflict appeared: the plan says which
    const { sha } = job.candidate;
    await op(job, "merge", { sha, pr: job.pr.number }, () => git.merge({ number: job.pr.number, sha }));
    const after = await git.prState({ number: job.pr.number });
    if (after.state !== "MERGED") throw new Error("the git host did not confirm the merge");
    job.evidence.pr = { ...job.evidence.pr, state: "MERGED" };
    await save(job);
  }

  async function resolveTicket(job, gen) {
    await op(job, "resolve", { pr: job.pr.number }, () => board.resolve(job.ref, job.pr.number)).catch(async (err) => {
      // The merge is done and confirmed; only the ticket is still open. That is said as it is.
      if (job.gen === gen) await pause(job, "board", `merged as #${job.pr.number}, but the ticket could not be resolved: ${errorText(err)}`, "Resume to resolve the ticket.");
    });
    if (job.state !== "running") return;
    job.state = "merged";
    job.step = null;
    await save(job);
  }

  const find = (id) => (typeof id === "string" && JOB_ID_RE.test(id) ? jobs.get(id) : undefined);

  /** The user's Resume. What the git host said is forgotten and asked again; nothing else is run twice. */
  async function resume(id, body = {}) {
    const job = find(id);
    if (!job) return refuse(404, "no such delivery");
    if (job.state !== "paused") return refuse(409, job.state === "running" ? "the delivery is running" : "the delivery has ended");
    if (body?.verdict !== undefined) {
      if (job.pause.kind !== "visual-verdict" || body.verdict !== "approve" || !job.candidate) return refuse(409, "this delivery is not waiting for a visual verdict");
      job.evidence.verdict = { sha: job.candidate.sha, ok: true };
    }
    if (job.pause.kind === "failed-twice") job.bounces = 0; // the user's click is one more round
    const lost = job.lost;
    job.lost = null;
    job.uncertain = null;
    job.evidence.pr = job.evidence.ci = null;
    job.state = "running";
    job.pause = null;
    job.gen += 1;
    await save(job);
    enqueue(job, async () => {
      // The claim of a run that ended with the bridge is still on the board: it is given up before the step runs again.
      if (lost && job.claimed) await drop(job, lost.role, "den delivery: the run ended with the bridge");
      await advance(job);
    });
    return { ok: true, status: 202, delivery: view(job) };
  }

  /** The user's Stop: the job waits, and its running step is stopped. */
  async function stop(id) {
    const job = find(id);
    if (!job) return refuse(404, "no such delivery");
    if (job.state !== "running") return refuse(409, job.state === "paused" ? "the delivery is already waiting" : "the delivery has ended");
    await pause(job, "stopped", "stopped by you", "Resume to go on from the last recorded commit, or close the delivery.");
    if (job.live) await host.stop(job.live.runId);
    return { ok: true, status: 202, delivery: view(job) };
  }

  /** Ends a waiting delivery for good. The ticket, its branch and any pull request stay as they are. */
  async function close(id) {
    const job = find(id);
    if (!job) return refuse(404, "no such delivery");
    if (job.state !== "paused") return refuse(409, job.state === "running" ? "stop the delivery first" : "the delivery has ended");
    const lost = job.lost;
    job.lost = null;
    job.state = "closed";
    job.pause = null;
    job.step = null;
    job.gen += 1;
    await save(job);
    enqueue(job, async () => {
      if (lost && job.claimed) await drop(job, lost.role, "den delivery: closed");
    });
    return { ok: true, status: 200, delivery: view(job) };
  }

  /** The bridge is closing: no step starts, and what is under way is given a moment to record itself. */
  async function shutdown(waitMs = 2000) {
    closing = true;
    let timer;
    const settled = (async () => {
      for (let before = null; ; ) {
        const chains = [...jobs.values()].map((j) => j.chain);
        if (before && chains.every((c, i) => c === before[i])) return;
        await Promise.all((before = chains));
      }
    })();
    await Promise.race([settled, new Promise((r) => (timer = setTimeout(r, waitMs)))]);
    clearTimeout(timer);
  }

  return { ready, start, resume, stop, close, onEnd, shutdown, snapshot: () => [...jobs.values()].map(view) };
}
