// den-mvp/39: an agent's message in the transcript, rendered as markdown (react-markdown + remark-gfm, the user's choice
// over a renderer of our own). Agent output is untrusted: raw HTML in it is shown as its text and never parsed, a link
// opens in a new tab with noopener and only for http(s) and mailto, and an image is shown as its alt text, so a message
// cannot make the page fetch anything. Plain .mjs (createElement, no JSX) so node:test renders it without a build.
import { createElement as h } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SAFE_LINK = /^(https?:|mailto:)/i;
const REMARK = [remarkGfm];

// Raw HTML becomes a text node holding its source, so `<script>` reads as those characters.
function htmlAsText() {
  const walk = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => (child.type === "html" ? { type: "text", value: child.value } : (walk(child), child)));
  };
  return walk;
}

const COMPONENTS = {
  a: ({ href, children }) => (SAFE_LINK.test(href ?? "") ? h("a", { href, target: "_blank", rel: "noopener noreferrer" }, children) : h("span", null, children)),
  img: ({ alt }) => h("span", { className: "agent-md-img" }, alt ? `[image: ${alt}]` : "[image]"),
  // A wide table scrolls inside the bubble, so the panel never widens.
  table: ({ children }) => h("div", { className: "agent-md-table" }, h("table", null, children)),
};

/** The markdown of one agent message as React elements, inside the bubble. */
export function AgentMarkdown({ text }) {
  return h("div", { className: "transcript-text thread-bubble agent-md" }, h(Markdown, { remarkPlugins: [...REMARK, htmlAsText], components: COMPONENTS }, String(text ?? "")));
}
