// den-v1 loop, live den run 3 (2026-10-10): from the overview, with no walking, a held permission request can be found
// and opened three ways (the Needs you card, a clicked panda's card, the transcript's waiting row) and by E or Q.
// Every way opens the permission review; nothing is sent until the user answers there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { buildLaunchOptions } from '../../../ci-cd/launch-options.mjs';
import { lightenScene } from '../../../ci-cd/light-scene.mjs';

const AGENT = 'c-af592f417c598394', APPROVAL = 'a-8313dee2f728c5f1', TARGET = '/home/u/den/package.json';
const snapshot = () => ({
  schema: 1, seq: 1, frontier: [], usage: null, requests: [], sessions: [],
  tickets: [{ ref: 'den/02-scout', feature: 'den', title: '02: Den task for scout', type: 'task', status: 'ready-for-agent', ready: true, priority: 'P2', effectivePriority: 'P2', blockedBy: [], holder: null, gate: null }],
  agents: [{ id: AGENT, ref: 'den/02-scout', role: 'scout', mode: 'direct', runtime: 'claude', state: 'waiting_on_user', startedAt: new Date(Date.now() - 60000).toISOString(), lastEventAt: new Date().toISOString(),
    tool: { name: 'Read', summary: TARGET }, tokens: null, capabilities: { stop: true, approve: true, send: true, handover: false } }],
  approvals: [{ id: APPROVAL, agentId: AGENT, tool: 'Read', summary: TARGET, inputLength: 37, truncated: false, ts: new Date().toISOString(), expiresAt: new Date(Date.now() + 8 * 60000 + 30000).toISOString(), state: 'pending' }],
  transcripts: { [AGENT]: { dropped: 0, entries: [
    { id: 1, at: new Date().toISOString(), kind: 'tool', name: 'Read', summary: TARGET, status: 'running' },
    { id: 2, at: new Date().toISOString(), kind: 'permission', name: 'Read', status: 'pending' },
    { id: 3, at: new Date().toISOString(), kind: 'tool', name: 'Bash', summary: 'rg -n claim docs', status: 'done', result: 'ok' },
  ] } },
});

// Where the scout panda is on screen: its model carries userData.actorKey (review/agents.mjs).
const scoutOnScreen = async () => {
  const url = performance.getEntriesByType('resource').map(e => e.name).find(n => n.includes('@react-three_fiber'));
  const { _roots } = await import(url);
  const canvas = document.querySelector('canvas');
  const state = _roots.get(canvas).store.getState();
  let found = null;
  state.scene.traverse(o => { if (o.userData?.actorKey === 'scout') found = o; });
  if (!found) return null;
  const p = found.getWorldPosition(found.position.clone()); p.y += 0.6;
  p.project(state.camera);
  const r = canvas.getBoundingClientRect();
  return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
};

test('overview: a held permission request is shown and opens from Needs you, a clicked panda, the transcript and E', { timeout: 90000 }, async () => {
  let server, browser;
  try {
    server = await createServer({ configFile: 'apps/ui/vite.config.mjs', server: { port: 0, host: '127.0.0.1' }, logLevel: 'silent' });
    await server.listen();
    browser = await chromium.launch(buildLaunchOptions());
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    await lightenScene(context);
    const page = await context.newPage();
    const errors = [], writes = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.method() === 'POST') writes.push(r.url()); });
    const state = snapshot();
    await page.route('**/events', r => r.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(state)}\n\n` }));
    await page.route('**/state', r => r.fulfill({ json: state }));
    await page.route('**/metrics', r => r.fulfill({ json: { throughput: { windows: [] }, tokensByCell: {}, incidentsByTool: {} } }));
    await page.route('**/session', r => r.fulfill({ status: 404, json: {} }));
    await page.goto(server.resolvedUrls.local[0]);
    await page.waitForFunction(() => document.querySelector('.den-entry button')?.getAttribute('aria-disabled') !== 'true');

    // 1. The Needs you card opens by itself and says who asks, for what, and how long is left.
    const needs = page.locator('[data-overlay=needs-you]');
    await needs.locator('[data-answer=allow]').waitFor();
    const needsText = await needs.innerText();
    for (const part of ['Scout · den/02-scout', 'wants to Read', TARGET, 'expires in 8 min', 'Deny', 'Allow']) assert.ok(needsText.includes(part), `Needs you shows "${part}": ${needsText}`);
    const review = page.locator('.approval-panel');
    await needs.locator('[data-answer=allow]').click();
    await review.waitFor();
    assert.equal(await review.locator('h2').innerText(), 'Run Read');
    assert.match(await review.locator('.approval-meta').innerText(), /Scout · scout · den\/02-scout/);
    await page.keyboard.press('Escape');
    await review.waitFor({ state: 'hidden' });

    // 2. E with nothing picked opens the same request.
    await page.locator('main[aria-label="Den scene"]').focus();
    await page.keyboard.press('KeyE');
    await review.waitFor();
    await page.keyboard.press('Escape');
    await review.waitFor({ state: 'hidden' });

    // 3. A click on the scout panda shows the card walk mode shows, with every action on.
    await page.waitForFunction(scoutOnScreen);
    const at = await page.evaluate(scoutOnScreen);
    await page.mouse.click(at.x, at.y);
    const card = page.getByRole('region', { name: 'Selected panda' });
    await card.waitFor();
    assert.match(await card.innerText(), /The Scout[\s\S]*Needs your answer[\s\S]*den\/02-scout[\s\S]*Waiting on you · Read/);
    assert.deepEqual(await card.locator('button[data-key]:not(:disabled)').evaluateAll(b => b.map(x => x.dataset.key)), ['Q', 'E', 'R', 'T']);

    // 4. R opens the transcript; the waiting row names the target and has Deny and Allow, which open the review.
    await page.keyboard.press('KeyR');
    const asking = page.locator('.transcript-panel .transcript-asking');
    await asking.waitFor();
    assert.match(await asking.innerText(), new RegExp(`Waiting on you\\s+Read ${TARGET}\\s+Deny\\s+Allow`));
    assert.match(await page.locator('.transcript-panel .transcript-state').innerText(), /Needs your answer/);
    await asking.locator('[data-answer=deny]').click();
    await review.waitFor();
    await page.keyboard.press('Escape');
    await review.waitFor({ state: 'hidden' });

    // 5. Close hides the card, and a resident panda's card would offer Start task (model test: den-request.test.mjs).
    await card.getByRole('button', { name: 'Close panda card' }).click();
    await card.waitFor({ state: 'hidden' });

    // This page has no session (the mock /session is 404), so the review loads nothing; the load is approval-review.test.mjs's.
    assert.deepEqual(writes, [], 'opening a request sends no answer');
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server?.close();
  }
});
