// den-mvp/45: a release is proposed by Bao and approved by the user. The draft is held here (one at a time); only the user's
// Approve (POST /release/approve) reaches git.publishRelease, which tags and publishes at the commit the draft named. No agent
// tool does either.
import { randomUUID } from "node:crypto";

const TYPE_RE = /^(\w+)(?:\([^)]*\))?(!)?:/;

/** "major" for a breaking change (`type!:` or a BREAKING CHANGE note), "minor" for a `feat`, else "patch". */
export function bumpOf(prs) {
  let bump = "patch";
  for (const p of prs) {
    const m = TYPE_RE.exec(String(p.title ?? "").trim());
    if (m?.[2] || /^BREAKING[ -]CHANGE:/m.test(String(p.body ?? ""))) return "major";
    if (m?.[1] === "feat") bump = "minor";
  }
  return bump;
}

export function nextVersion(last, bump) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(last ?? "");
  const [a, b, c] = m ? m.slice(1).map(Number) : [0, 0, 0];
  return bump === "major" ? `v${a + 1}.0.0` : bump === "minor" ? `v${a}.${b + 1}.0` : `v${a}.${b}.${c + 1}`;
}

const line = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim().slice(0, 200);

export function createReleaseDrafts({ git, onChange = () => {} }) {
  let draft = null;
  const set = (d) => { draft = d; onChange(draft); };
  return {
    current: () => draft,
    async propose() {
      const sha = await git.mainSha();
      const last = await git.lastTag();
      const prs = (await git.mergedSince({ tag: last, sha })).map((p) => ({ number: p.number, title: line(p.title), body: String(p.body ?? "") }));
      if (prs.length === 0) throw new Error(`nothing merged since ${last ?? "the start"}, so there is nothing to release`);
      const bump = bumpOf(prs);
      const version = nextVersion(last, bump);
      const notes = `## ${version}\n\n${prs.map((p) => `- ${p.title} (#${p.number})`).join("\n")}\n`;
      const d = { id: randomUUID(), version, bump, sha, previous: last ?? null, prs: prs.map(({ number, title }) => ({ number, title })), notes };
      set(d);
      return d;
    },
    async approve(id) {
      if (!draft || draft.id !== id) return { ok: false, status: 409, error: "that is not the current draft" };
      const d = draft;
      try {
        await git.publishRelease({ version: d.version, sha: d.sha, notes: d.notes });
      } catch (err) {
        return { ok: false, status: 502, error: `could not publish ${d.version}: ${String(err?.message ?? err).slice(0, 200)}` };
      }
      set(null);
      return { ok: true, status: 200, release: { version: d.version, sha: d.sha } };
    },
    async decline(id) {
      if (!draft || draft.id !== id) return { ok: false, status: 409, error: "that is not the current draft" };
      set(null);
      return { ok: true, status: 200 };
    },
  };
}
