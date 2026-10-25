import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { SerupaProvider } from '../../internal/provider';
import { NumberInput } from './NumberInput';

const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const steps = (id: string) => [...field(id).parentElement!.querySelectorAll<HTMLButtonElement>('.dk-number-input__step')];
const minus = (id: string) => steps(id)[0];
const plus = (id: string) => steps(id)[1];
// Replaces the field's text, as a person selecting it all and typing would, then (optionally) leaves it.
const fill = async (id: string, text: string) => { await userEvent.fill(field(id), text); };
const blur = async (id: string) => { field(id).blur(); await expect.poll(() => document.activeElement !== field(id)).toBe(true); };
const Col = ({ children }: { children: React.ReactNode }) => <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>;

function Qty({ r }: { r?: React.Ref<HTMLInputElement> }) {
  return <Col><label htmlFor="qty">Quantity</label><NumberInput id="qty" ref={r} className="extra" defaultValue={5} min={0} max={100} /></Col>;
}

function Controlled({ calls, set }: { calls: Array<number | null>; set?: (f: (v: number | null) => void) => void }) {
  const [v, setV] = React.useState<number | null>(2);
  React.useEffect(() => { if (set) set(setV); }, [set]);
  return <NumberInput id="nctl" aria-label="Guests" value={v} min={1} max={4} onValueChange={(n) => { calls.push(n); setV(n); }} />;
}

describe('NumberInput', () => {
  test('Input\'s box (32px) around a spinbutton with valuenow 5, min 0, max 100, numeric keyboard; − and + buttons out of the Tab order; ref to the input, className to the box', async () => {
    const r = React.createRef<HTMLInputElement>();
    await render(<Qty r={r} />);
    const i = field('qty'), box = i.parentElement!;
    expect([i.type, i.getAttribute('role'), i.getAttribute('aria-valuenow'), i.getAttribute('aria-valuemin'), i.getAttribute('aria-valuemax'), i.inputMode, r.current === i])
      .toEqual(['text', 'spinbutton', '5', '0', '100', 'numeric', true]);
    expect(box.className).toMatch(/dk-input dk-number-input dk-input--size-md/);
    expect(box.className).toMatch(/extra/);
    expect([box.dataset.component, box.getBoundingClientRect().height, i.labels![0].textContent, i.value]).toEqual(['number-input', 32, 'Quantity', '5']);
    expect(steps('qty').map((b) => `${b.getAttribute('aria-label')}:${b.tabIndex}:${b.querySelector<HTMLElement>('.dk-icon')?.dataset.icon}`)).toEqual(['Decrease:-1:remove', 'Increase:-1:add']);
  });

  test('a form gets the number, not the shown text: "1500000" for "Rp 1.500.000", cents with minorUnits; the visible field has no name; form= works outside the form; disabled sends nothing', async () => {
    await render(<>
      <form id="nf">
        <SerupaProvider locale="id-ID"><NumberInput id="nidr" name="amount" currency="IDR" defaultValue={1500000} /></SerupaProvider>
        <NumberInput name="price" currency="USD" minorUnits defaultValue={1999} locale="en-US" />
        <NumberInput name="off" defaultValue={3} disabled />
      </form>
      <NumberInput name="outside" form="nf" defaultValue={2.5} locale="en-US" />
    </>);
    const data = new FormData(document.getElementById('nf') as HTMLFormElement);
    expect([...data.entries()]).toEqual([['amount', '1500000'], ['price', '1999'], ['outside', '2.5']]);
    expect([(document.getElementById('nidr') as HTMLInputElement).value.replace(/\s/g, ' '), document.getElementById('nidr')!.hasAttribute('name')]).toEqual(['Rp 1.500.000', false]);
  });

  test('form reset: the default comes back, in the field and in what the form sends; a controlled field shows its value again', async () => {
    await render(<form id="nr">
      <NumberInput id="nru" name="u" defaultValue={5} locale="en-US" />
      <NumberInput id="nrc" value={7} onValueChange={() => {}} locale="en-US" />
    </form>);
    await userEvent.click(field('nru'));
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await userEvent.fill(field('nrc'), '40');
    expect([field('nru').value, new FormData(document.getElementById('nr') as HTMLFormElement).get('u')]).toEqual(['7', '7']);
    (document.getElementById('nr') as HTMLFormElement).reset();
    await expect.poll(() => field('nru').value).toBe('5');
    expect([new FormData(document.getElementById('nr') as HTMLFormElement).get('u'), field('nrc').value]).toEqual(['5', '7']);
  });

  test('keys: ArrowUp/Down ±1, PageUp +10, Shift+ArrowDown −10, End and Home go to max and min, and it stays within them; at min − is disabled and + isn\'t', async () => {
    await render(<Qty />);
    field('qty').focus();
    const seen: string[] = [];
    for (const k of ['{ArrowUp}', '{ArrowDown}{ArrowDown}', '{PageUp}', '{Shift>}{ArrowDown}{/Shift}', '{End}', '{ArrowUp}', '{Home}', '{ArrowDown}']) {
      await userEvent.keyboard(k);
      seen.push(field('qty').value);
    }
    expect(seen).toEqual(['6', '4', '14', '4', '100', '100', '0', '0']);
    expect([minus('qty').disabled, plus('qty').disabled]).toEqual([true, false]);
  });

  test('on blur: 250 is clamped to 100, " 7 " becomes 7, junk goes back to the last number, and empty stays empty', async () => {
    await render(<Qty />);
    const seen: string[] = [];
    for (const text of ['250', ' 7 ', 'abc', '']) {
      await fill('qty', text);
      await blur('qty');
      seen.push(field('qty').value);
    }
    expect(seen).toEqual(['100', '7', '7', '']);
  });

  test('+ on an empty field starts from min + step (0 → 1), and moves focus into the field', async () => {
    await render(<Qty />);
    await fill('qty', '');
    await blur('qty');
    await userEvent.click(plus('qty'));
    expect([field('qty').value, document.activeElement === field('qty')]).toEqual(['1', true]);
  });

  test('controlled: + calls onValueChange (3, 4) and stops at max, where + is disabled', async () => {
    const calls: Array<number | null> = [];
    await render(<Controlled calls={calls} />);
    await userEvent.click(plus('nctl'));
    await userEvent.click(plus('nctl'));
    await userEvent.click(plus('nctl'), { force: true });
    expect([calls.join(), field('nctl').value, plus('nctl').disabled]).toEqual(['3,4', '4', true]);
  });

  test('controlled: a new value from outside shows in the field', async () => {
    let setV: (v: number | null) => void = () => {};
    await render(<Controlled calls={[]} set={(f) => { setV = f; }} />);
    setV(1);
    await expect.poll(() => field('nctl').value).toBe('1');
  });

  test('controlled: typing a number in range calls onValueChange at once; one out of range waits for blur, which clamps it', async () => {
    const calls: Array<number | null> = [];
    await render(<Controlled calls={calls} />);
    await fill('nctl', '3');
    const typed = calls.join();
    await fill('nctl', '9');
    const over = calls.join();
    await blur('nctl');
    expect([typed, over, calls.join(), field('nctl').value]).toEqual(['3', '3', '3,4', '4']);
  });

  test('step 0.25: ArrowUp 1.5 → 1.75, and 2.333 rounds to 2 decimals (2.33); decimal keyboard', async () => {
    await render(<NumberInput id="dec" aria-label="Price" defaultValue={1.5} step={0.25} />);
    field('dec').focus();
    await userEvent.keyboard('{ArrowUp}');
    const up = field('dec').value;
    await fill('dec', '2.333');
    await blur('dec');
    expect([up, field('dec').value, field('dec').inputMode]).toEqual(['1.75', '2.33', 'decimal']);
  });

  test('locale: 1.500 is 1500 in id-ID and 1,500 is 1500 in en-US; "9,5" shows as 9,5 in de-DE and 9.5 in en-US after blur; 1 000 is read in fr-FR', async () => {
    const calls: string[] = [];
    await render(<Col>{(['id-ID', 'en-US', 'de-DE', 'fr-FR'] as const).map((l) => <NumberInput key={l} id={l} aria-label={l} locale={l} step={0.1} onValueChange={(n) => calls.push(l + ' ' + n)} />)}</Col>);
    await fill('id-ID', '1.500'); await blur('id-ID');
    await fill('en-US', '1,500'); await blur('en-US');
    expect([field('id-ID').value, field('en-US').value, field('id-ID').getAttribute('aria-valuenow')]).toEqual(['1500', '1500', '1500']);
    await fill('de-DE', '9.5'); await blur('de-DE');
    await fill('en-US', '9,5'); await blur('en-US');
    await fill('fr-FR', '1 000,5'); await blur('fr-FR');
    expect([field('de-DE').value, field('en-US').value, field('fr-FR').value]).toEqual(['9,5', '9.5', '1000,5']);
    expect(calls.at(-1)).toBe('fr-FR 1000.5');
  });

  test('locale: the nearest SerupaProvider sets it, and the prop wins', async () => {
    await render(<SerupaProvider locale="id-ID"><Col><NumberInput id="a" aria-label="A" defaultValue={1500.25} step={0.01} /><NumberInput id="b" aria-label="B" locale="en-US" defaultValue={1500.25} step={0.01} /></Col></SerupaProvider>);
    expect([field('a').value, field('b').value]).toEqual(['1500,25', '1500.25']);
  });

  test('formatOptions: IDR currency shows "Rp 1.500" with an aria-valuetext, reads "2.000" back, and ArrowUp steps from it; percent shows 15% for 0.15', async () => {
    const calls: Array<number | null> = [];
    await render(<Col>
      <NumberInput id="price" aria-label="Price" locale="id-ID" step={500} defaultValue={1500} formatOptions={{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="rate" aria-label="Rate" locale="en-US" step={0.01} defaultValue={0.15} formatOptions={{ style: 'percent' }} onValueChange={(n) => calls.push(n)} />
    </Col>);
    const rp = (t: string) => t.replace(/\s/g, ' ');
    expect(rp(field('price').value)).toBe('Rp 1.500');
    expect(rp(field('price').getAttribute('aria-valuetext')!)).toBe('Rp 1.500');
    await fill('price', '2.000'); await blur('price');
    expect(rp(field('price').value)).toBe('Rp 2.000');
    await userEvent.click(field('price')); await userEvent.keyboard('{ArrowUp}');
    expect(rp(field('price').value)).toBe('Rp 2.500');
    expect(field('rate').value).toBe('15%');
    await fill('rate', '20'); await blur('rate');
    expect([field('rate').value, calls.at(-1)]).toEqual(['20%', 0.2]);
  });

  test('currency: the symbol where the locale puts it, and the currency\'s decimals kept with a step of 1 (12.5 is $12.50, not 13); formatOptions still wins', async () => {
    const calls: Array<number | null> = [];
    const nf = (l: string, o: Intl.NumberFormatOptions, v: number) => new Intl.NumberFormat(l, { numberingSystem: 'latn', ...o }).format(v);
    await render(<Col>
      <NumberInput id="usd" aria-label="Price" locale="en-US" currency="USD" defaultValue={19.99} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="eur" aria-label="Preis" locale="de-DE" currency="EUR" defaultValue={19.99} />
      <NumberInput id="code" aria-label="Price" locale="en-US" currency="USD" formatOptions={{ currencyDisplay: 'code' }} defaultValue={5} />
    </Col>);
    expect([field('usd').value, field('usd').getAttribute('aria-valuetext'), field('eur').value, field('code').value])
      .toEqual(['$19.99', '$19.99', nf('de-DE', { style: 'currency', currency: 'EUR' }, 19.99), nf('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code' }, 5)]);
    await fill('usd', '12.5'); await blur('usd');
    expect([field('usd').value, calls.at(-1)]).toEqual(['$12.50', 12.5]);
    await fill('usd', '24.999'); await blur('usd');
    expect([field('usd').value, calls.at(-1)]).toEqual(['$25.00', 25]);
    await userEvent.click(field('usd')); await userEvent.keyboard('{ArrowUp}');
    expect([field('usd').value, calls.at(-1)]).toEqual(['$26.00', 26]);
  });

  test('minorUnits: value, min, max, step and onValueChange are whole cents (1999 is $19.99); JPY has none, KWD has three', async () => {
    const calls: Array<number | null> = [];
    const nf = (c: string, v: number) => new Intl.NumberFormat('en-US', { numberingSystem: 'latn', style: 'currency', currency: c }).format(v);
    await render(<Col>
      <NumberInput id="c1" aria-label="Price" locale="en-US" currency="USD" minorUnits defaultValue={1999} min={100} max={5000} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="c2" aria-label="Tip" locale="en-US" currency="USD" minorUnits defaultValue={250} step={5} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="c3" aria-label="Yen" locale="en-US" currency="JPY" minorUnits defaultValue={1999} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="c4" aria-label="Dinar" locale="en-US" currency="KWD" minorUnits defaultValue={1500} />
    </Col>);
    expect([field('c1').value, field('c1').getAttribute('aria-valuenow'), field('c1').getAttribute('aria-valuemin'), field('c1').getAttribute('aria-valuemax'), field('c2').value, field('c3').value, field('c4').value])
      .toEqual(['$19.99', '19.99', '1', '50', '$2.50', nf('JPY', 1999), nf('KWD', 1.5)]);
    await userEvent.click(field('c1')); await userEvent.keyboard('{ArrowUp}');
    expect([field('c1').value, calls.at(-1)]).toEqual(['$20.99', 2099]);
    await userEvent.keyboard('{Home}');
    expect(calls.at(-1)).toBe(100);
    await fill('c1', '33.335'); await blur('c1');
    expect([field('c1').value, calls.at(-1)]).toEqual(['$33.34', 3334]);
    await userEvent.click(field('c2')); await userEvent.keyboard('{ArrowUp}');
    expect([field('c2').value, calls.at(-1)]).toEqual(['$2.55', 255]);
    await userEvent.click(field('c3')); await userEvent.keyboard('{ArrowUp}');
    expect(calls.at(-1)).toBe(2000);
  });

  function Cents() {
    const [v, setV] = React.useState<number | null>(1050);
    return <><NumberInput id="cc" aria-label="Amount" locale="en-US" currency="USD" minorUnits value={v} onValueChange={setV} /><output id="cc-out">{String(v)}</output></>;
  }
  test('minorUnits, controlled: typing a sum in dollars stores whole cents, and emptying it stores null', async () => {
    await render(<Cents />);
    expect(field('cc').value).toBe('$10.50');
    await fill('cc', '0.1'); await blur('cc');
    expect([field('cc').value, document.getElementById('cc-out')!.textContent]).toEqual(['$0.10', '10']);
    await fill('cc', ''); await blur('cc');
    expect([field('cc').value, document.getElementById('cc-out')!.textContent]).toEqual(['', 'null']);
  });

  test('min with decimals the step doesn\'t have (min 0.5, step 1): ArrowUp from 2.5 is 3.5, and from Home (0.5) is 1.5', async () => {
    await render(<NumberInput id="half" aria-label="Half" min={0.5} max={5.5} step={1} defaultValue={2.5} />);
    await userEvent.click(field('half'));
    await userEvent.keyboard('{ArrowUp}');
    expect(field('half').value).toBe('3.5');
    await userEvent.keyboard('{Home}{ArrowUp}');
    expect(field('half').value).toBe('1.5');
  });

  test('steppers={false}: no buttons', async () => {
    await render(<NumberInput id="bare" aria-label="Bare" steppers={false} />);
    expect(field('bare').parentElement!.querySelector('.dk-number-input__steppers')).toBe(null);
  });

  test('disabled: both buttons disabled, the value doesn\'t change', async () => {
    await render(<NumberInput id="dis" aria-label="Dis" disabled defaultValue={3} />);
    await userEvent.click(plus('dis'), { force: true });
    expect([field('dis').value, steps('dis').every((b) => b.disabled)]).toEqual(['3', true]);
  });

  test('lg: 44px with 20px icons', async () => {
    await render(<NumberInput id="lg" aria-label="Lg" size="lg" defaultValue={1} />);
    const box = field('lg').parentElement!;
    expect([Math.round(box.getBoundingClientRect().height), css(box.querySelector('.dk-number-input__step .dk-icon')).fontSize]).toEqual([44, '20px']);
  });

  test('contrast: the − and + keep 3:1 and the number 4.5:1 on the field in all six themes', async () => {
    await render(<NumberInput id="lg" aria-label="Lg" size="lg" defaultValue={1} />);
    const box = field('lg').parentElement!, low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      // The colors transition into the new theme: read them once that's done.
      await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
      for (const [sel, need] of [['.dk-number-input__step', 3], ['.dk-input__field', 4.5]] as const) {
        const r = contrast(css(box.querySelector(sel)).color, css(box).backgroundColor);
        if (r < need) low.push(`${th} ${sel} ${r.toFixed(2)}`);
      }
    }
    expect(low).toEqual([]);
  });

  test('a button is shaded on hover', async () => {
    await render(<NumberInput id="lg" aria-label="Lg" size="lg" defaultValue={1} />);
    await userEvent.hover(plus('lg'));
    await expect.poll(() => css(plus('lg')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('--number-input-stepper overrides one field', async () => {
    await render(<NumberInput id="tok" aria-label="Tok" style={{ '--number-input-stepper': 'rgb(1, 2, 3)' } as React.CSSProperties} />);
    expect(css(minus('tok')).color).toBe('rgb(1, 2, 3)');
  });
});
