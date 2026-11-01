import * as React from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { contrast, THEMES } from '../../tools/test/vitest/helpers';

// The focus ring on a strong fill (74): inside .bg-primary, .bg-danger and .bg-surface-inverse it takes the fill's
// own text color, so it stands out from the fill (3:1, WCAG 1.4.11) in every theme. On the page it stays the brand's.
const root = document.documentElement;
afterEach(() => root.setAttribute('data-theme', 'blue-light'));

describe('the focus ring adapts to a strong fill (74)', () => {
  for (const theme of THEMES) {
    test(`${theme}: a link on the brand, danger and inverse fills shows a ring 3:1 against the fill; a button's own ring, on the page, keeps the brand's`, async () => {
      root.setAttribute('data-theme', theme);
      await render(<div>
        <div className="bg-primary" id="f-primary"><a href="#a" id="l-primary">On brand</a></div>
        <div className="bg-danger" id="f-danger"><a href="#b" id="l-danger">On danger</a></div>
        <div className="bg-surface-inverse" id="f-inverse"><a href="#c" id="l-inverse">On inverse</a></div>
        <Button id="b-page" className="bg-primary">On page</Button>
      </div>);
      const ring = (id: string) => getComputedStyle(document.getElementById(id)!).outlineColor;
      const fill = (id: string) => getComputedStyle(document.getElementById(id)!).backgroundColor;
      const ratios: Record<string, number> = {};
      for (const f of ['primary', 'danger', 'inverse']) {
        document.getElementById(`l-${f}`)!.focus();
        await userEvent.keyboard('{Shift>}{/Shift}');
        expect(document.getElementById(`l-${f}`)!.matches(':focus-visible'), f).toBe(true);
        ratios[f] = Math.round(contrast(ring(`l-${f}`), fill(`f-${f}`)) * 10) / 10;
      }
      expect(Object.values(ratios).every((r) => r >= 3), JSON.stringify(ratios)).toBe(true);
      const probe = document.body.appendChild(document.createElement('span'));
      probe.style.color = 'var(--focus-ring)';
      const brand = getComputedStyle(probe).color;
      probe.remove();
      document.getElementById('b-page')!.focus();
      expect(ring('b-page')).toBe(brand);
    });
  }

  for (const theme of THEMES) {
    test(`${theme}: a button on a Card or a light bg- box inside a strong fill gets the page's ring back, 3:1 against the card (GR80)`, async () => {
      root.setAttribute('data-theme', theme);
      await render(<div>
        <div className="bg-primary"><Card id="card"><Button variant="outline" id="b-card">Edit</Button></Card></div>
        <div className="bg-surface-inverse"><div className="bg-surface" id="box"><a href="#d" id="l-box">On a light box</a></div></div>
      </div>);
      const ratios: Record<string, number> = {};
      for (const [id, on] of [['b-card', 'card'], ['l-box', 'box']]) {
        document.getElementById(id)!.focus();
        await userEvent.keyboard('{Shift>}{/Shift}');
        expect(document.getElementById(id)!.matches(':focus-visible'), id).toBe(true);
        ratios[id] = Math.round(contrast(getComputedStyle(document.getElementById(id)!).outlineColor, getComputedStyle(document.getElementById(on)!).backgroundColor) * 10) / 10;
      }
      expect(Object.values(ratios).every((r) => r >= 3), JSON.stringify(ratios)).toBe(true);
    });
  }
});
