// den-mvp/39: an agent's message renders as markdown in the transcript. Contract (agent-markdown.mjs): headings, bold,
// lists, tables, inline code and fenced blocks render as elements; raw HTML reads as its text; only http(s) and mailto
// links are links, opening in a new tab with noopener; an image is its alt text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentMarkdown } from "./agent-markdown.mjs";

const render = (text) => renderToStaticMarkup(h(AgentMarkdown, { text }));

const RUNDOWN = [
  "## Morning rundown", "", "**P1** is down to two tickets:", "", "- **34** Den runs the checks", "- **39** Transcript renders markdown", "",
  "### CI overnight", "", "| PR | Job | Result |", "|---|---|---|", "| #284 | `test-browser` | green |", "", "Re-run with:", "", "```", "gh run rerun 1182 --failed", "```",
].join("\n");

test("Bao's morning rundown reads as formatted text: headings, bold, a list and a fenced block", () => {
  const html = render(RUNDOWN);
  assert.match(html, /<h2>Morning rundown<\/h2>/);
  assert.match(html, /<strong>P1<\/strong> is down to two tickets:/);
  assert.match(html, /<ul>\s*<li><strong>34<\/strong> Den runs the checks<\/li>/);
  assert.match(html, /<pre><code>gh run rerun 1182 --failed\n<\/code><\/pre>/);
  assert.match(html, /^<div class="transcript-text thread-bubble agent-md">/);
});

test("a table renders as a table, inside a box that scrolls on its own", () => {
  const html = render(RUNDOWN);
  assert.match(html, /<div class="agent-md-table"><table><thead><tr><th>PR<\/th><th>Job<\/th><th>Result<\/th><\/tr><\/thead><tbody><tr><td>#284<\/td><td><code>test-browser<\/code><\/td><td>green<\/td><\/tr><\/tbody><\/table><\/div>/);
});

test("<script> and <img onerror> in a message render as text, inline or as a block", () => {
  const html = render("<script>alert(1)</script>\n\nsay <img src=x onerror=alert(1)> and <b>bold</b>");
  assert.doesNotMatch(html, /<script|<img|<b>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("only http(s) and mailto links are links, in a new tab with noopener; an image is its alt text", () => {
  const html = render("[docs](https://example.com/a) [mail](mailto:a@example.com) [bad](javascript:alert(1)) [rel](/state) ![a chart](https://evil.example/p.png)");
  assert.match(html, /<a href="https:\/\/example.com\/a" target="_blank" rel="noopener noreferrer">docs<\/a>/);
  assert.match(html, /<a href="mailto:a@example.com" target="_blank" rel="noopener noreferrer">mail<\/a>/);
  assert.match(html, /<span>bad<\/span>/);
  assert.match(html, /<span>rel<\/span>/);
  assert.doesNotMatch(html, /javascript:|evil\.example|<img/);
  assert.match(html, /\[image: a chart\]/);
});

test("plain text with no markdown is one paragraph, and an empty message renders nothing harmful", () => {
  assert.equal(render("All tests pass."), '<div class="transcript-text thread-bubble agent-md"><p>All tests pass.</p></div>');
  assert.equal(render(undefined), '<div class="transcript-text thread-bubble agent-md"></div>');
});
