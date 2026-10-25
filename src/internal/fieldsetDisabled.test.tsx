import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { css } from '../../tools/test/vitest/helpers';
import { ColorPicker } from '../components/ColorPicker/ColorPicker';
import { InlineEdit } from '../components/InlineEdit/InlineEdit';
import { Select } from '../components/Select/Select';
import { Textarea } from '../components/Textarea/Textarea';

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const look = (e: HTMLElement) => { const s = css(e); return [s.opacity, s.backgroundColor, s.cursor].join(' '); };

// A <fieldset disabled> disables the native fields inside; the fields' boxes take the same look as the disabled prop (BB1).
describe('in a <fieldset disabled>', () => {
  test('Textarea, Select and ColorPicker look as they do with disabled; hover leaves the border; InlineEdit has no pointer or pencil', async () => {
    const swatches = ['#ff0000', '#00ff00'];
    await render(<>
      <div id="prop">
        <Textarea aria-label="Note" disabled /><Select aria-label="Plan" options={['Free', 'Pro']} disabled /><ColorPicker aria-label="Color" swatches={swatches} disabled />
      </div>
      <fieldset id="fs" disabled><legend>Billing</legend>
        <Textarea aria-label="Note" /><Select aria-label="Plan" options={['Free', 'Pro']} /><ColorPicker aria-label="Color" swatches={swatches} />
        <InlineEdit label="Name" defaultValue="Apollo" />
      </fieldset>
    </>);
    for (const cls of ['.dk-textarea', '.dk-select', '.dk-color-picker']) {
      expect([cls, look(q('#fs ' + cls))]).toEqual([cls, look(q('#prop ' + cls))]);
    }
    for (const cls of ['.dk-textarea__field', '.dk-select__field']) expect(css(q('#fs ' + cls)).cursor).toBe('not-allowed');
    const ta = q('#fs .dk-textarea'), before = css(ta).getPropertyValue('--dk-ta-bd');
    await userEvent.hover(ta, { force: true });
    expect(css(ta).getPropertyValue('--dk-ta-bd')).toBe(before);
    const view = q('#fs .dk-inline-edit__view') as HTMLButtonElement;
    await userEvent.hover(view, { force: true });
    expect([view.matches(':disabled'), css(view).cursor, css(view).backgroundColor, css(view.querySelector('.dk-inline-edit__icon')).display]).toEqual([true, 'auto', 'rgba(0, 0, 0, 0)', 'none']);
  });
});
