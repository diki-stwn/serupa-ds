// Loaded before every component test: the tokens, page defaults and component styles, as a project loads them.
import '../../../tokens.css';
import '../../../src/styles/base.css';
import '../../../src/styles/index.css';
import { afterEach, beforeEach, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { announcerIdle } from '../../../src/internal/announce';
import { resetWarnings } from '../../../src/internal/warn';

afterEach(() => { document.documentElement.setAttribute('data-theme', 'blue-light'); });
document.documentElement.setAttribute('data-theme', 'blue-light');
// No transitions or animations: a test reads the end state, which Firefox and WebKit can otherwise still be
// easing towards. Tests about motion turn it back on with keepMotion() or withMotion() (helpers.ts).
const still = document.createElement('style');
still.id = 'serupa-still';
still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
document.head.appendChild(still);
// The pointer rests at the top-left corner between tests; padding keeps it off the component under test.
// Nothing moves it back on its own (the test files share one page too), and left where a test clicked, it
// hovers whatever the next test renders there, which then reads its hover look: so it goes back after each.
document.body.style.padding = '16px';
afterEach(() => userEvent.hover(document.documentElement, { position: { x: 0, y: 0 }, force: true }));
// The two live regions are shared by the whole page (internal/announce.ts): what one test queued would otherwise be
// said during the next one, which then reads it as its own. Let it finish, then empty them.
afterEach(async () => {
  await vi.waitFor(() => { if (!announcerIdle()) throw new Error('the announcer is still speaking'); }, { timeout: 3000 });
  for (const el of document.querySelectorAll('[data-dk-announcer], [data-dk-announcer-assertive]')) el.textContent = '';
});
// The tests run in a frame, and Firefox gives a frame keyboard focus only once something clicks into it: until then
// el.focus() leaves focus on the body and keys go nowhere. So a click in the empty corner first, when it's needed.
// Each test starts with no warning given yet (warnOnce remembers them for the page's lifetime).
beforeEach(resetWarnings);
// A key press before each test, so a script's focus() is :focus-visible as on a page nobody has clicked yet: after a
// test that clicked, Chromium would otherwise draw no focus ring and a test that reads one would depend on the order.
beforeEach(() => userEvent.keyboard('{Shift}'));
beforeEach(async () => {
  if (document.hasFocus()) return;
  window.focus();
  await userEvent.click(document.documentElement, { position: { x: 0, y: 0 }, force: true });
});
