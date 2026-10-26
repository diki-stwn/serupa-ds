import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Switch } from '../components/Switch/Switch';
import { keepMotion } from '../../tools/test/vitest/helpers';
import { withoutColorTransitions } from './withoutColorTransitions';

const transitions = (el: Element) => el.getAnimations({ subtree: true }).filter((a): a is CSSTransition => a instanceof CSSTransition && a.playState === 'running').map((a) => a.transitionProperty).sort();

describe('withoutColorTransitions', () => {
  keepMotion();

  test('a section switched to another theme inside it changes its colors at once (no color transition runs), while motion started in the same tick runs on', async () => {
    const sec = document.body.appendChild(document.createElement('section'));
    sec.setAttribute('data-theme', 'blue-light');
    sec.innerHTML = '<p style="transition: background-color 150ms, color 150ms; background: var(--surface-muted); color: var(--text)">Row</p>'.repeat(5)
      + '<i style="display: block; transition: translate 200ms, opacity 200ms, background-color 200ms; background: var(--surface-muted)"></i>'
      + '<b style="display: block; background: var(--surface-muted)"></b>';
    const mover = sec.querySelector('i')!;
    void getComputedStyle(mover).translate;   // the light colors and the start position are in place
    withoutColorTransitions(() => { sec.setAttribute('data-theme', 'blue-dark'); mover.style.translate = '16px'; mover.style.opacity = '0'; }, sec);
    expect(transitions(sec)).toEqual(['opacity', 'translate']);
    const dark = getComputedStyle(sec.querySelector('b')!).backgroundColor;   // no transition: the dark color itself
    expect([getComputedStyle(sec.firstElementChild!).backgroundColor, getComputedStyle(mover).backgroundColor]).toEqual([dark, dark]);
    sec.remove();
  });

  test('with no element it works on the page root', () => {
    const p = document.body.appendChild(document.createElement('p'));
    p.style.cssText = 'transition: color 150ms; color: rgb(0, 0, 0)';
    void getComputedStyle(p).color;
    withoutColorTransitions(() => { p.style.color = 'rgb(255, 255, 255)'; });
    expect([transitions(document.documentElement), getComputedStyle(p).color]).toEqual([[], 'rgb(255, 255, 255)']);
    p.remove();
  });

  test('a dark-mode Switch turned on as the theme changes slides its thumb; its colors arrive at once', async () => {
    await render(<section data-theme="blue-light"><Switch>Dark mode</Switch></section>);
    const input = document.querySelector<HTMLInputElement>('[role="switch"]')!, sec = input.closest('section')!;
    withoutColorTransitions(() => { sec.setAttribute('data-theme', 'blue-dark'); input.click(); }, sec);
    expect([input.checked, transitions(sec)]).toEqual([true, ['translate']]);
  });
});
