import * as React from 'react';
import { beforeAll, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, color, contrast } from '../../../tools/test/vitest/helpers';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { ToggleButton } from './ToggleButton';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const pressed = (id: string) => el(id).getAttribute('aria-pressed');

// Measured at rest, as the script did: no transitions or animations.
beforeAll(() => {
  const still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.appendChild(still);
});

function Formatting({ boldRef }: { boldRef?: React.Ref<HTMLButtonElement> }) {
  return <ButtonGroup id="gfmt" aria-label="Text formatting">
    <ToggleButton id="tbold" icon="format_bold" aria-label="Bold" ref={boldRef} className="extra" />
    <ToggleButton id="titalic" icon="format_italic" aria-label="Italic" defaultPressed />
    <ToggleButton id="tghost" icon="format_underlined" aria-label="Underline" variant="ghost" defaultPressed />
  </ButtonGroup>;
}

describe('ToggleButton', () => {
  test('a button with aria-pressed="false", outline by default, icon-only with aria-label; ref and className reach it', async () => {
    const ref = React.createRef<HTMLButtonElement>();
    await render(<Formatting boldRef={ref} />);
    const e = el('tbold') as HTMLButtonElement;
    expect([e.tagName, e.type, pressed('tbold'), e.getAttribute('aria-label'), e.dataset.component, (e.querySelector<HTMLElement>('.dk-icon'))?.dataset.icon]).toEqual(['BUTTON', 'button', 'false', 'Bold', 'button', 'format_bold']);
    expect(e.className).toMatch(/dk-btn--outline/);
    expect(e.className).toMatch(/dk-toggle-button extra/);
    expect(ref.current).toBe(e);
  });

  test('pressing it turns it on: aria-pressed="true", primary-subtle with primary text and border; hover keeps the pressed colors; Space turns it off again', async () => {
    await render(<Formatting />);
    await userEvent.click(el('tbold'));
    const s = getComputedStyle(el('tbold')), on = [s.backgroundColor, s.color, s.borderTopColor];
    expect(pressed('tbold')).toBe('true');
    expect(on).toEqual([color('var(--primary-subtle)'), color('var(--primary)'), color('var(--primary)')]);
    await userEvent.hover(el('tbold'));
    expect(getComputedStyle(el('tbold')).backgroundColor).toBe(on[0]);
    el('tbold').focus();
    await userEvent.keyboard(' ');
    expect(pressed('tbold')).toBe('false');
  });

  test('defaultPressed starts on; variant="ghost"; an unknown variant falls back to outline', async () => {
    await render(<>
      <Formatting />
      {/* @ts-expect-error: not a ToggleButton variant */}
      <ToggleButton id="tbad" variant="primary">Bad</ToggleButton>
    </>);
    expect([pressed('tghost'), /dk-btn--ghost/.test(el('tghost').className), pressed('titalic')]).toEqual(['true', true, 'true']);
    expect(el('tbad').className).toMatch(/dk-btn--outline/);
  });

  test('controlled: onPressedChange gets the new state, the parent sets it', async () => {
    const calls: boolean[] = [];
    function Controlled() {
      const [on, setOn] = React.useState(true);
      return <ToggleButton id="tctl" pressed={on} onPressedChange={(v) => { calls.push(v); setOn(v); }}>Grid</ToggleButton>;
    }
    await render(<Controlled />);
    await userEvent.click(el('tctl'));
    expect([pressed('tctl'), calls]).toEqual(['false', [false]]);
  });

  test('onClick with preventDefault stops the toggle; disabled doesn\'t toggle', async () => {
    await render(<>
      <ToggleButton id="tprev" onClick={(e) => e.preventDefault()}>Prevented</ToggleButton>
      <ToggleButton id="tdis" disabled>Disabled</ToggleButton>
    </>);
    await userEvent.click(el('tprev'));
    await userEvent.click(el('tdis'), { force: true });
    expect([pressed('tprev'), pressed('tdis')]).toEqual(['false', 'false']);
  });

  test('token: --toggle-button-bg-pressed', async () => {
    await render(<ToggleButton id="ttok" defaultPressed style={{ '--toggle-button-bg-pressed': 'rgb(1, 2, 3)' } as React.CSSProperties}>Tok</ToggleButton>);
    expect(getComputedStyle(el('ttok')).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('contrast: pressed text 4.5:1 on its background, the pressed border 3:1 on surface, in all six themes', async () => {
    await render(<Formatting />);
    const low: string[] = [];
    let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const s = getComputedStyle(el('titalic'));
      for (const [name, fg, bg, min] of [['pressed text', s.color, s.backgroundColor, 4.5], ['pressed border on surface', s.borderTopColor, 'var(--surface)', 3]] as const) {
        const r = contrast(fg, bg); n++;
        if (r < min) low.push(`${th} ${name}: ${r.toFixed(2)}`);
      }
    }
    expect([low, n]).toEqual([[], 12]);
  });
});
