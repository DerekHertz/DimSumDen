// den-mvp outcome 4: the library card. It lists what the den's agents can be given beyond their own tools: connections
// (servers that supply tools, from the den's catalog) and skills (instructions). It is read-only: the catalog and the
// role files are changed by the user in the repository, not from here. Loaded when opened, and again when the bridge
// says something in it changed.
import { useEffect, useState } from "react";
import { Card } from "./Card.jsx";
import { libraryModel } from "./library-model.mjs";

const MARK = { ok: "●", bad: "▲", wait: "○" }; // a shape per tone, so colour is never the only cue

export function LibraryCard({ client, rev, now, open, onToggle, busy, demo = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!open || demo) return undefined;
    let current = true;
    client.getLibrary().then(
      (body) => { if (current) { setData(body); setError(null); } },
      (err) => { if (current) setError(err?.reason ?? "Could not load the library."); },
    );
    return () => { current = false; };
  }, [open, demo, client, rev]);
  const m = libraryModel(data, now);
  return (
    <Card id="library" overlay="library" label="Library" edge="line" open={open} onToggle={onToggle} title="Library" aside={<span className="card-summary">{m.summary}</span>} busy={busy}>
      {demo ? <p className="muted">Demo mode: the library is not loaded.</p> : null}
      {error ? <p className="small gate-error" role="alert">{error}</p> : null}
      {!demo && !m.loaded && !error ? <p className="muted">Loading…</p> : null}
      {m.loaded ? (
        <>
          <p className="ov">Connections</p>
          <p className="small muted">A connection gives an agent tools from another program or service. Only the roles listed get it.</p>
          {m.connections.length === 0 ? <p className="muted">The catalog lists no connection.</p> : (
            <ul className="queue-rows library-rows">
              {m.connections.map((c) => (
                <li key={c.name} className="queue-row library-row" data-connection={c.name}>
                  <div className="queue-line">
                    <span className="queue-title">{c.title}</span>
                    <span className={`library-status library-${c.status.tone}`}><span aria-hidden="true">{MARK[c.status.tone]}</span> {c.status.label}</span>
                  </div>
                  <span className="code-small muted">{c.name}</span>
                  <p className="small">{c.purpose}</p>
                  {c.status.detail ? <p className="small muted">{c.status.detail}</p> : null}
                  <p className="small muted">{c.where}. {c.credential}.</p>
                  <p className="ov">Roles</p>
                  <ul className="library-list">
                    {c.roles.map((r) => (
                      <li key={r.role} className="small">
                        <span className="library-name">{r.role}</span>{r.usable ? " can use it" : <> cannot use it yet. <span className="muted">{r.reason}</span></>}
                      </li>
                    ))}
                  </ul>
                  <p className="ov">Tools</p>
                  <ul className="library-list">
                    {c.tools.map((t) => <li key={t.name} className="small"><span className="code-small">{t.name}</span> <span className="muted">{t.note}</span></li>)}
                  </ul>
                  <p className="small muted">Any other tool it offers is refused.{c.uses ? ` ${c.uses}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="ov">Skills</p>
          <p className="small muted">A skill is a written procedure an agent can load. It adds no tools.</p>
          {m.skills.length === 0 ? <p className="muted">No skills found.</p> : (
            <ul className="queue-rows queue-rows-scroll library-rows">
              {m.skills.map((s) => (
                <li key={s.name} className="queue-row library-row" data-skill={s.name}>
                  <span className="code-small">{s.name}</span>
                  {s.description ? <p className="small">{s.description}</p> : null}
                  <p className="small muted">{s.roles.length > 0 ? `Roles: ${s.roles.join(", ")}` : "No role loads skills."}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </Card>
  );
}
