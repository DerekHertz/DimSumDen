// den-mvp outcome 3 (spec section 4): the prompt of one delivery step. A fixed template over fields the bridge made
// itself (role, mode, ref, the ticket's path, a commit id); no client string and no agent text reaches it. A step's
// agent writes nothing on the board and publishes nothing: the bridge claims the ticket, writes the handoff from the
// run's last message, releases, pushes and opens the pull request. A reviewer's verdict is one line of that message.
export const VERDICT_RE = /^[ \t>*_`-]*VERDICT:[ \t]*(pass|bounce)\b[ \t*_`.]*$/gim;

/** The last verdict line of a report, or null. */
export function readVerdict(report) {
  if (typeof report !== "string") return null;
  const found = [...report.matchAll(VERDICT_RE)].at(-1);
  return found ? found[1].toLowerCase() : null;
}

// The den's friction log (.scratch/den-mvp/friction.md, F2 and F4): what a walled run cannot do, said before it tries.
export const WORK_TIPS =
  "Run every check in the foreground under `timeout` (a command may take up to 10 minutes), never in the background: you have no tool to wait for a background run, and `sleep` before a command is blocked. " +
  "Put a throwaway script under .den/ in this worktree (git ignores it), not in $TMPDIR: Node finds the repository's packages only from inside the worktree. " +
  "Stage files by name (`git add <paths>`), never `git add -A` or `git add .`: the sandbox leaves placeholder files such as .bash_profile that git cannot add. ";

const SHARED =
  "The den's bridge runs this delivery: it has claimed the ticket for you, and it will write your handoff to the board and release the ticket when you end. " +
  "Run no board command, and do not push, open a pull request or merge: the bridge does each of those from the commit it records. " +
  WORK_TIPS;

/** { role, mode?, ref, ticketFile, since, fix? } -> the step's prompt. `since` is the commit the delivery started from. */
export function deliveryPrompt({ role, mode, ref, ticketFile, since, fix = false }) {
  const head = `You are the ${role} cell${mode ? ` in ${mode} mode` : ""} for ticket ${ref}. Read .claude/agents/${role}.md for how to work, with these changes. ${SHARED}The ticket is the file ${ticketFile}. `;
  if (role === "developer") {
    return (
      head +
      (fix ? "A review of the last commit asked for changes: read .den/findings.md first, and fix what it names. " : "") +
      "Work test-first in this worktree, run the checks that cover your change (the full suite runs on the pull request), and commit your work here: the bridge publishes the branch from your last commit, and a run that commits nothing delivers nothing. " +
      "End with a short report of what you changed and which checks you ran and what they showed: that last message is your handoff."
    );
  }
  const scope = role === "security" ? "for security: what it lets an agent, a request or untrusted text do that it could not do before" : "against the ticket's acceptance criteria, independently of the developer's own report";
  return (
    head +
    `Review the commit checked out here ${scope}. The change is \`git diff ${since}..HEAD\`. Run the checks that cover the change yourself; the full suite runs on the pull request, so do not run it here. ` +
    "Change no file and commit nothing: a review that moves the commit is not counted. " +
    "End with your findings, each one concrete enough to fix, and then, on a line of its own, `VERDICT: pass` or `VERDICT: bounce`. That last message is your handoff."
  );
}
