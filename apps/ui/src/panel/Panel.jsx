// Panel helpers: the shared clock hook and the selected-ticket handoff view (not mounted since den-scene-v1/07 removed the sidebar).
// Agent text is untrusted: everything renders as React text nodes, never as HTML.
import { useEffect, useMemo, useState } from "react";
import { detailModel } from "./queue-model.mjs";
import { parseMarkdown } from "./render-markdown.mjs";

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (n.type === "strong") return <strong key={i}><Inline nodes={n.children} /></strong>;
    if (n.type === "code") return <code key={i}>{n.text}</code>;
    if (n.type === "link") return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer"><Inline nodes={n.children} /></a>;
    return <span key={i}>{n.text}</span>;
  });
}

export function Markdown({ text }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return blocks.map((b, i) => {
    if (b.type === "heading") {
      const level = Math.min(6, b.level + 2);
      const Tag = `h${level}`;
      return <Tag key={i} className="md-h"><Inline nodes={b.children} /></Tag>;
    }
    if (b.type === "list") {
      const Tag = b.ordered ? "ol" : "ul";
      return <Tag key={i}>{b.items.map((it, j) => <li key={j}><Inline nodes={it} /></li>)}</Tag>;
    }
    if (b.type === "code") return <pre key={i} className="md-code"><code>{b.text}</code></pre>;
    return <p key={i}><Inline nodes={b.children} /></p>;
  });
}

function ago(mtime, now) {
  const t = Date.parse(mtime ?? "");
  if (!Number.isFinite(t)) return null;
  return `updated ${Math.max(0, Math.round((now - t) / 60_000))} min ago`;
}

export function Detail({ snapshot, selected }) {
  const now = useNow();
  const d = detailModel(snapshot, selected);
  if (d.kind === "none") return <p className="muted">{d.message}</p>;
  return (
    <div aria-live="off">
      <p className="detail-title">{d.title}</p>
      <p className="code-small muted">{d.ref}</p>
      <p className="small">{[d.status, d.holder].filter(Boolean).join(" · ")}</p>
      {d.kind === "missing-handoff" ? (
        <p className="muted">{d.message}</p>
      ) : (
        <>
          <p className="small muted">{[d.handoff.path, ago(d.handoff.mtime, now)].filter(Boolean).join(" · ")}</p>
          <div className="md"><Markdown text={d.handoff.text} /></div>
          {d.handoff.truncated ? <p className="small muted">Handoff truncated. Open {d.handoff.path} for the rest.</p> : null}
        </>
      )}
    </div>
  );
}
