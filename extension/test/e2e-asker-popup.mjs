/* Question cards inside an application popup, with real mouse clicks.
 *
 * The application form is in a popup that traps clicks and focus, the way many job sites' dialogs do: a
 * document-level capture listener swallows every click outside the popup. Checks that the card's buttons still
 * work there:
 *   - Next moves on even before a question is answered, Back goes back
 *   - Skip is offered on required questions too, and moves on
 *   - × hides the cards (optional questions left empty count as skipped; required ones stay open)
 *   - Done on the last card hides the cards once everything is answered
 *   - a form in a modal <dialog> (the browser's top layer) gets its cards inside the dialog, clickable
 *
 *   node extension/test/e2e-asker-popup.mjs     (needs Playwright's Chromium; set CHROMIUM_PATH to override)
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(new URL(import.meta.url).pathname);
const asker = readFileSync(path.resolve(here, '../lib/asker.js'), 'utf8');

const browser = await chromium.launch({ channel: 'chromium', executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const failures = [];
const check = (ok, what) => { console.log(`${ok ? '✓' : '✗'} ${what}`); if (!ok) failures.push(what); };

const fields = `
  <p><label>Zip Code / Postal Code (Non-U.S. based candidates, please enter "00000") <input id="zip" required></label></p>
  <p><label>LinkedIn profile <input id="li"></label></p>
  <p><label>Why this role? <textarea id="why" required></textarea></label></p>`;

await page.setContent(`<!doctype html><html><body style="font:15px sans-serif">
  <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000">
    <div id="popup" role="dialog" aria-modal="true" style="background:#fff;width:520px;margin:60px auto;padding:20px">${fields}</div>
  </div>
  <dialog id="modal">${fields.replace(/id="/g, 'id="m-')}</dialog>
  <script>
    // A focus trap: clicks and presses outside the popup are swallowed before anything else sees them.
    window.swallowed = 0;
    for (const t of ['pointerdown', 'mousedown', 'click']) {
      document.addEventListener(t, (e) => {
        if (document.getElementById('overlay').style.display === 'none') return;
        if (!document.getElementById('popup').contains(e.target)) { window.swallowed++; e.preventDefault(); e.stopImmediatePropagation(); }
      }, true);
    }
  </script></body></html>`);
await page.addScriptTag({ content: asker });

const startCards = (prefix) => page.evaluate((pre) => {
  const items = ['zip', 'li', 'why'].map((id) => {
    const node = document.getElementById(pre + id);
    return { node, kind: 'text', label: node.closest('label').firstChild.textContent.trim(), required: node.required };
  });
  window.run = self.CareerOS.Asker.start({ items, isAnswered: (i) => Boolean(i.node.value.trim()) });
  window.items = items;
}, prefix);
const card = () => page.evaluate(() => {
  const host = document.querySelector('[data-careeros-asker]');
  if (!host) return null;
  const c = host.shadowRoot.querySelector('.card');
  const acts = Array.from(c.querySelectorAll('[data-act]')).map((b) => b.getAttribute('data-act'));
  return { step: c.querySelector('.step').textContent, acts, inDialog: Boolean(host.closest('dialog')) };
});
async function click(act) {
  const box = await page.evaluate((a) => {
    const b = document.querySelector('[data-careeros-asker]').shadowRoot.querySelector(`[data-act="${a}"]`);
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, act);
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(350);
}

// 1. Popup with a focus trap.
await startCards('');
await page.waitForTimeout(300);
let c = await card();
check(c && c.step === 'Question 1 of 3', `card shows question 1 of 3 (${c && c.step})`);
check(c && ['close', 'skip', 'next'].every((a) => c.acts.includes(a)), `close, Skip and Next are offered on a required question (${c && c.acts})`);
await click('next');
c = await card();
check(c.step === 'Question 2 of 3', `Next moves on before the question is answered (${c.step})`);
check(c.acts.includes('back'), 'Back is offered');
await click('back');
c = await card();
check(c.step === 'Question 1 of 3', `Back goes back (${c.step})`);
await click('skip');
c = await card();
check(c.step === 'Question 2 of 3', `Skip on a required question moves on (${c.step})`);
check(await page.evaluate(() => window.run.skipped(window.items[0])), 'the required question is marked skipped');
const swallowedBefore = await page.evaluate(() => window.swallowed);
await click('close');
check(!(await card()), '× hides the cards');
check(await page.evaluate(() => window.swallowed) === swallowedBefore, "the popup's trap never saw the card's clicks");
check(await page.evaluate(() => window.run.skipped(window.items[1])), 'closing skips the optional question left empty');
check(await page.evaluate(() => window.run.pending().map((i) => i.node.id).join(',')) === 'why', 'the empty required question is still open after closing');

// 2. Done on the last card once everything is answered.
await page.evaluate(() => { for (const id of ['zip', 'li', 'why']) document.getElementById(id).value = 'x'; });
await startCards('');
await page.waitForTimeout(300);
await click('next'); await click('next');
c = await card();
check(c.step === 'Question 3 of 3' && c.acts.includes('next'), `last card shows Done (${c.step})`);
await click('next');
check(!(await card()), 'Done hides the cards when everything is answered');

// 3. A form in a modal <dialog> (top layer).
await page.evaluate(() => { document.getElementById('overlay').style.display = 'none'; document.getElementById('modal').showModal(); });
await startCards('m-');
await page.waitForTimeout(300);
c = await card();
check(c && c.inDialog, 'cards for a form in a modal dialog go inside the dialog');
await click('next');
c = await card();
check(c.step === 'Question 2 of 3', `the card's buttons work over a modal dialog (${c.step})`);
await click('close');
check(!(await card()), '× hides the cards over a modal dialog');

await browser.close();
if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll checks passed');
