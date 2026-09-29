// Minimal, safe handoff markdown parser. Output is a node tree; the .jsx maps it to React elements.
// Raw HTML stays text. Only http(s) links become link nodes.
const SAFE_HREF = /^https?:\/\/[^\s]+$/i;
const LIST_ITEM = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/;

export function parseInline(s) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push({ type: "text", text: buf });
      buf = "";
    }
  };
  let i = 0;
  while (i < s.length) {
    if (s[i] === "`") {
      const j = s.indexOf("`", i + 1);
      if (j > i) {
        flush();
        out.push({ type: "code", text: s.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
    } else if (s.startsWith("**", i)) {
      const j = s.indexOf("**", i + 2);
      if (j > i + 2) {
        flush();
        out.push({ type: "strong", children: parseInline(s.slice(i + 2, j)) });
        i = j + 2;
        continue;
      }
    } else if (s[i] === "[") {
      const m = /^\[([^\]]*)\]\(([^)\s]*(?:\([^)]*\)[^)\s]*)*)\)/.exec(s.slice(i));
      if (m) {
        flush();
        const children = parseInline(m[1]);
        if (SAFE_HREF.test(m[2])) out.push({ type: "link", href: m[2], children });
        else out.push(...children);
        i += m[0].length;
        continue;
      }
    }
    buf += s[i++];
  }
  flush();
  return out;
}

export function parseMarkdown(text) {
  const lines = String(text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = /^```\s*(\S*)\s*$/.exec(line);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang: fence[1], text: body.join("\n") });
      continue;
    }
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, children: parseInline(h[2]) });
      i++;
      continue;
    }
    const li = LIST_ITEM.exec(line);
    if (li) {
      const ordered = Boolean(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]);
        if (!m || Boolean(m[2]) !== ordered) break;
        items.push(parseInline(m[3]));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !LIST_ITEM.test(lines[i])) {
      para.push(lines[i++].trim());
    }
    blocks.push({ type: "paragraph", children: parseInline(para.join(" ")) });
  }
  return blocks;
}
