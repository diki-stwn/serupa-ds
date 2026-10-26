import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { Input } from '../components/Input/Input';
import { Radio } from '../components/Radio/Radio';
import { Select } from '../components/Select/Select';
import { Textarea } from '../components/Textarea/Textarea';

// Native constraints (171): a required, type="email" or pattern field that fails takes the same danger border as the
// invalid prop, but only after people edit it or try to send the form (:user-invalid), never on first paint.
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
// The border each part reads, resolved to a color: [the part holding it, its variable].
const PARTS: [string, string, string][] = [
  ['input', '.u-input', '--dk-input-bd'],
  ['textarea', '.u-textarea', '--dk-ta-bd'],
  ['select', '.u-select', '--dk-select-bd'],
  ['checkbox', '.u-checkbox .dk-checkbox__input', '--dk-checkbox-bd'],
  ['radio', '.u-radio .dk-radio__input', '--dk-radio-bd'],
];
const border = (sel: string, v: string) => getComputedStyle($(sel)).getPropertyValue(v).trim();

function Fields({ prefix, invalid }: { prefix: string; invalid?: boolean }) {
  return <>
    <Input className={prefix + '-input'} aria-label={prefix + " email"} type="email" required invalid={invalid} />
    <Textarea className={prefix + '-textarea'} aria-label={prefix + " note"} required invalid={invalid} />
    <Select className={prefix + '-select'} aria-label={prefix + " size"} required invalid={invalid} defaultValue="" options={[{ value: '', label: 'Pick one' }, 's', 'm']} />
    <Checkbox className={prefix + '-checkbox'} required invalid={invalid}>I agree</Checkbox>
    <Radio className={prefix + '-radio'} name={prefix + '-r'} value="a" required invalid={invalid}>A</Radio>
  </>;
}

describe('native constraints show as invalid after interaction (171)', () => {
  test('nothing on first paint; after a try to send, every failing field takes the invalid border; once fixed, it goes back', async () => {
    const screen = await render(<>
      <form onSubmit={(e) => e.preventDefault()}><Fields prefix="u" /></form>
      <Fields prefix="ref" invalid />
      <Input className="ok-input" aria-label="Plain" />
    </>);
    const danger = Object.fromEntries(PARTS.map(([k, , v]) => [k, border(PARTS.find((p) => p[0] === k)![1].replace('.u-', '.ref-'), v)]));
    const plain = border('.ok-input', '--dk-input-bd');
    expect(danger.input).not.toBe(plain);
    // Already invalid (empty and required) but untouched: the plain border.
    for (const [k, sel, v] of PARTS) expect(border(sel, v), k).not.toBe(danger[k]);
    ($('form') as HTMLFormElement).requestSubmit();
    for (const [k, sel, v] of PARTS) await expect.poll(() => border(sel, v), { message: k }).toBe(danger[k]);
    // A fix takes the danger off again.
    await screen.getByLabelText("u email").fill('a@b.co');
    await expect.poll(() => border('.u-input', '--dk-input-bd')).not.toBe(danger.input);
    await screen.getByLabelText("u email").fill('not an email');
    await expect.poll(() => border('.u-input', '--dk-input-bd')).toBe(danger.input);
  });

  test('editing a field and leaving it bad is enough, without sending the form', async () => {
    const screen = await render(<><Input className="e-input" aria-label="Code" pattern="[0-9]{4}" /><Input className="ref-input" aria-label="Ref" invalid /></>);
    const danger = border('.ref-input', '--dk-input-bd');
    await screen.getByLabelText('Code').fill('12a');
    await screen.getByLabelText('Ref').click();
    await expect.poll(() => border('.e-input', '--dk-input-bd')).toBe(danger);
    // Under the pointer it stays danger, rather than taking the hover border.
    await screen.getByLabelText('Code').hover();
    await expect.poll(() => border('.e-input', '--dk-input-bd')).toBe(danger);
  });
});
