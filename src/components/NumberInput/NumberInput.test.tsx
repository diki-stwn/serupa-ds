import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { announcerIdle } from '../../internal/announce';
import { SerupaProvider } from '../../internal/provider';
import { NumberInput } from './NumberInput';

// The button at a point just outside each edge of b (hit testing rounds to whole pixels, so 0.75px before the start
// and 0.25px after the end both land 1px out): the 24px box behind it (WCAG 2.5.8) takes presses there.
const reach = (b: HTMLElement) => {
  const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return [[r.left - 0.75, cy], [r.right + 0.25, cy], [cx, r.top - 0.75], [cx, r.bottom + 0.25]].map(([x, y]) => document.elementFromPoint(x, y)?.closest('button') === b);
};

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
  test('switching to another window or tab mid-typing keeps the typed text and says nothing (L8E26)', async () => {
    const calls: string[] = [];
    await render(<NumberInput id="nwb" aria-label="Amount" onInvalidInput={(t, r) => calls.push(t + ':' + r)} />);
    await userEvent.click(field('nwb'));
    await userEvent.keyboard('-');
    // The window losing focus: the field gets blur (focusout) and stays document.activeElement.
    field('nwb').dispatchEvent(new FocusEvent('focusout', { bubbles: true })); field('nwb').dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 30));
    expect([field('nwb').value, calls]).toEqual(['-', []]);
  });

  test('Input\'s box (32px) around a spinbutton with valuenow 5, min 0, max 100, numeric keyboard; − and + buttons out of the Tab order; ref to the input, className to the box', async () => {
    const r = React.createRef<HTMLInputElement>();
    await render(<Qty r={r} />);
    const i = field('qty'), box = i.parentElement!;
    expect([i.type, i.getAttribute('role'), i.getAttribute('aria-valuenow'), i.getAttribute('aria-valuemin'), i.getAttribute('aria-valuemax'), i.inputMode, r.current === i])
      .toEqual(['text', 'spinbutton', '5', '0', '100', 'numeric', true]);
    expect(box.className).toMatch(/dk-input dk-number-input dk-input--size-md/);
    expect(box.className).toMatch(/extra/);
    expect([box.dataset.component, box.getBoundingClientRect().height, i.labels![0].textContent, i.value]).toEqual(['number-input', 32, 'Quantity', '5']);
    expect(steps('qty').map((b) => `${b.getAttribute('aria-label')}:${b.tabIndex}:${b.querySelector<HTMLElement>('[data-icon]')?.dataset.icon}`)).toEqual(['Decrease:-1:remove', 'Increase:-1:add']);
  });

  test('a press on the box (the icon, the side padding) focuses the field with the caret at the end; a press on + still steps (GE1)', async () => {
    await render(<Col><NumberInput id="nb" size="lg" leftIcon="search" aria-label="Qty" defaultValue={12} locale="en-US" /><button id="nb-away">away</button></Col>);
    const b = field('nb').parentElement!, y = b.getBoundingClientRect().height / 2;
    for (const x of [2, 20]) {
      (document.getElementById('nb-away') as HTMLElement).focus();
      await userEvent.click(b, { position: { x, y } });
      expect([x, document.activeElement === field('nb'), field('nb').selectionStart]).toEqual([x, true, 2]);
    }
    await userEvent.click(plus('nb'));
    expect(field('nb').value).toBe('13');
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

  test('a default with more decimals than shown is taken as shown: the form sends 20 for US$20,00 and 1250000001 for Rp 1.250.000.001, and leaving the field without an edit changes nothing (GR47)', async () => {
    const calls: Array<number | null> = [];
    await render(<SerupaProvider locale="id-ID"><form id="gr47">
      <NumberInput id="usd" name="usd" currency="USD" defaultValue={19.995} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="idr" name="amt" currency="IDR" defaultValue={1250000000.5} onValueChange={(n) => calls.push(n)} />
      <NumberInput id="ctl" name="ctl" currency="USD" value={4.999} onValueChange={(n) => calls.push(n)} />
    </form></SerupaProvider>);
    const sent = () => [...new FormData(document.getElementById('gr47') as HTMLFormElement).entries()];
    expect([field('usd').value, field('idr').value, field('ctl').value].map((s) => s.replace(/\s/g, ' '))).toEqual(['US$20,00', 'Rp 1.250.000.001', 'US$5,00']);
    expect(sent()).toEqual([['usd', '20'], ['amt', '1250000001'], ['ctl', '5']]);
    for (const id of ['usd', 'idr', 'ctl']) { field(id).focus(); await blur(id); }
    expect([sent(), calls]).toEqual([[['usd', '20'], ['amt', '1250000001'], ['ctl', '5']], []]);
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

  test('keyboard table: PageDown goes down largeStep steps, as PageUp goes up, within min (FH1)', async () => {
    await render(<Qty />);
    field('qty').focus();
    const seen: string[] = [];
    for (const k of ['{PageUp}{PageUp}', '{PageDown}', '{PageDown}{PageDown}']) { await userEvent.keyboard(k); seen.push(field('qty').value); }
    expect(seen).toEqual(['25', '15', '0']);
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

  test('controlled, and the parent keeps its value: + and ArrowUp ask for 6 but the field still shows 5', async () => {
    const calls: Array<number | null> = [];
    await render(<NumberInput id="nkeep" aria-label="Seats" value={5} onValueChange={(n) => calls.push(n)} />);
    await userEvent.click(plus('nkeep'));
    await expect.poll(() => field('nkeep').value).toBe('5');
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => field('nkeep').value).toBe('5');
    expect([calls.join(), field('nkeep').getAttribute('aria-valuenow')]).toEqual(['6,6', '5']);
  });

  test('controlled, and the parent keeps its value: what was typed stays while typing, and blur puts the value back', async () => {
    const calls: Array<number | null> = [];
    await render(<NumberInput id="nkept" aria-label="Seats" value={5} onValueChange={(n) => calls.push(n)} />);
    await fill('nkept', '8');
    const typed = field('nkept').value;
    await blur('nkept');
    await expect.poll(() => field('nkept').value).toBe('5');
    expect([typed, calls[0]]).toEqual(['8', 8]);
  });

  test('step 0.25: ArrowUp 1.5 → 1.75, and 2.333 rounds to 2 decimals (2.33); decimal keyboard', async () => {
    await render(<SerupaProvider locale="en-US"><NumberInput id="dec" aria-label="Price" defaultValue={1.5} step={0.25} /></SerupaProvider>);
    field('dec').focus();
    await userEvent.keyboard('{ArrowUp}');
    const up = field('dec').value;
    await fill('dec', '2.333');
    await blur('dec');
    expect([up, field('dec').value, field('dec').inputMode]).toEqual(['1.75', '2.33', 'decimal']);
  });

  test('from a typed value off the grid, the first step lands on the grid point that way: 0.1 ↑ is 0.25, 0.1 ↓ is 0, 0.6 PageUp is 3; on the grid it steps as before (CC1)', async () => {
    await render(<SerupaProvider locale="en-US"><NumberInput id="snap" aria-label="Amount" step={0.25} largeStep={10} /></SerupaProvider>);
    const seen: string[] = [];
    for (const [typed, key] of [['0.1', '{ArrowUp}'], ['0.1', '{ArrowDown}'], ['0.6', '{PageUp}'], ['0.5', '{ArrowUp}'], ['-0.1', '{ArrowUp}']]) {
      await fill('snap', typed);
      await userEvent.keyboard(key);
      seen.push(field('snap').value);
    }
    expect(seen).toEqual(['0.25', '0', '3', '0.75', '0']);
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
    await render(<SerupaProvider locale="en-US"><NumberInput id="half" aria-label="Half" min={0.5} max={5.5} step={1} defaultValue={2.5} /></SerupaProvider>);
    await userEvent.click(field('half'));
    await userEvent.keyboard('{ArrowUp}');
    expect(field('half').value).toBe('3.5');
    await userEvent.keyboard('{Home}{ArrowUp}');
    expect(field('half').value).toBe('1.5');
  });

  test('holding + repeats after 400ms, every 50ms, and stops on pointerup, on leaving the button, on Escape and at max (P7)', async () => {
    await render(<NumberInput id="hold" aria-label="Hold" defaultValue={0} min={0} max={30} />);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const down = (b: HTMLElement) => b.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }));
    const n = () => Number(field('hold').value);
    down(plus('hold'));
    await wait(300);
    expect([n(), document.activeElement === field('hold')]).toEqual([1, true]);   // one step on the press, then a pause
    await wait(400);
    window.dispatchEvent(new PointerEvent('pointerup'));
    await wait(30);
    const held = n();
    await wait(200);
    expect([held >= 4 && held <= 10, n()]).toEqual([true, held]);
    // Leaving the button and Escape stop it too.
    down(plus('hold')); await wait(600);
    plus('hold').dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));   // React's onPointerLeave
    await wait(30);
    const left = n(); await wait(200);
    expect(n()).toBe(left);
    down(minus('hold')); await wait(600);
    await userEvent.keyboard('{Escape}');
    await wait(30);
    const esc = n(); await wait(200);
    expect([esc < left, n()]).toEqual([true, esc]);
    // At max the button is disabled and the repeat ends there.
    down(plus('hold')); await expect.poll(n, { timeout: 4000 }).toBe(30);
    expect([n(), plus('hold').disabled]).toEqual([30, true]);
    window.dispatchEvent(new PointerEvent('pointerup'));
    down(minus('hold')); await wait(100);
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect(n()).toBe(29);
  }, 15_000);

  test('while held, a long touch\'s context menu is held back; a right press steps nothing and keeps focus where it was', async () => {
    await render(<Col><NumberInput id="ctx" aria-label="Ctx" defaultValue={0} /><button id="ctx-out">Out</button></Col>);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const menu = () => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); plus('ctx').dispatchEvent(e); return e.defaultPrevented; };
    expect(menu()).toBe(false);
    plus('ctx').dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }));
    await wait(50);
    expect(menu()).toBe(true);
    window.dispatchEvent(new PointerEvent('pointerup'));
    await wait(30);
    document.getElementById('ctx-out')!.focus();
    const n = field('ctx').value;
    const right = new PointerEvent('pointerdown', { button: 2, bubbles: true, cancelable: true });
    plus('ctx').dispatchEvent(right);
    await wait(30);
    expect([field('ctx').value, right.defaultPrevented, document.activeElement?.id]).toEqual([n, true, 'ctx-out']);
  });

  test('a click with no pointer press (a screen reader\'s) is one step, and a pointer click is one step too', async () => {
    await render(<Qty />);
    plus('qty').click();
    await expect.poll(() => field('qty').value).toBe('6');
    await userEvent.click(plus('qty'));
    expect(field('qty').value).toBe('7');
  });

  test('onInvalidInput: a number out of range is brought back and reported as "range" (blur and Enter); text that isn\'t a number as "unreadable", and said', async () => {
    const seen: string[] = [];
    await render(<Col><NumberInput id="inv" aria-label="Quantity" defaultValue={5} min={0} max={100} onInvalidInput={(t, why) => seen.push(t + ':' + why)} /></Col>);
    await fill('inv', ' 250 ');
    await blur('inv');
    await fill('inv', '-4');
    field('inv').focus();
    await userEvent.keyboard('{Enter}');
    await fill('inv', 'abc');
    await blur('inv');
    await fill('inv', '42');
    await blur('inv');
    field('inv').focus(); await blur('inv');   // untouched: nothing to report
    expect([seen, field('inv').value]).toEqual([['250:range', '-4:range', 'abc:unreadable'], '42']);
    await fill('inv', 'xyz');
    await blur('inv');
    await expect.poll(() => announcerIdle() && document.querySelector('[data-dk-announcer-assertive]')!.textContent).toMatch(/"xyz" wasn't accepted/);
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
  test('size sm: each stepper is 22px but takes presses over 24px (WCAG 2.5.8), past each outer edge, without moving anything', async () => {
    await render(<div style={{ width: '320px', padding: '8px' }}><NumberInput id="hb" aria-label="Seats" size="sm" defaultValue={5} /></div>);
    const [dec, inc] = [...document.querySelector<HTMLElement>('#hb')!.closest('.dk-input')!.querySelectorAll<HTMLElement>('.dk-number-input__step')];
    expect([Math.round(dec.getBoundingClientRect().height), Math.round(inc.getBoundingClientRect().width)]).toEqual([22, 22]);
    // Start, top and bottom of Decrease; end, top and bottom of Increase. The 2px between them goes to one or the other.
    const [ds, , dt, db] = reach(dec), [, ie, it, ib] = reach(inc);
    expect([ds, dt, db, ie, it, ib]).toEqual([true, true, true, true, true, true]);
    const gap = (dec.getBoundingClientRect().right + inc.getBoundingClientRect().left) / 2, mid = dec.getBoundingClientRect().top + 11;
    expect([dec, inc]).toContain(document.elementFromPoint(gap, mid)?.closest('button'));
  });
});
