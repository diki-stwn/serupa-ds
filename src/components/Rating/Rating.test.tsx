import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Rating } from './Rating';
import { idLabels } from '../../internal/labels';
import { Field } from '../Field/Field';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const radios = (id: string) => [...el(id).querySelectorAll<HTMLInputElement>('input[type=radio]')];
const stars = (id: string) => [...el(id).children] as HTMLElement[];
// How many px of each star are filled: the star's second layer is the fill, clipped to its share.
const filled = (id: string) => stars(id).map((s) => Math.round((s.children[1] as HTMLElement).getBoundingClientRect().width));
const picked = (id: string) => radios(id).filter((r) => r.checked).map((r) => r.value);

describe('Rating', () => {
  test('a role="radiogroup" of native radios, one per star, named "1 star"…"5 stars"; a click picks; the stars up to it fill; ref, className and other props reach the group', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const calls: (number | null)[] = [];
    await render(<Rating id="r" aria-label="Your rating" ref={ref} className="extra" data-x="y" onValueChange={(v) => calls.push(v)} />);
    const group = page.getByRole('radiogroup', { name: 'Your rating' }).element();
    expect([group === el('r'), ref.current === group, el('r').className, el('r').dataset.x, el('r').dataset.component]).toEqual([true, true, 'dk-rating dk-rating--size-md extra', 'y', 'rating']);
    expect(radios('r').map((r) => r.getAttribute('aria-label'))).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars']);
    expect([stars('r')[0].offsetWidth, filled('r')]).toEqual([24, [0, 0, 0, 0, 0]]);
    await userEvent.click(page.getByRole('radio', { name: '3 stars' }));
    expect([calls, picked('r'), filled('r')]).toEqual([[3], ['3'], [24, 24, 24, 0, 0]]);
  });

  test('keyboard: Tab reaches the group and the arrow keys pick, as in any radio group; sizes sm and lg are 20 and 32px', async () => {
    await render(<div><button id="before">Before</button><Rating id="k" aria-label="Keys" defaultValue={2} /><Rating id="s" aria-label="S" size="sm" /><Rating id="l" aria-label="L" size="lg" /></div>);
    el('before').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(radios('k')[1]);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');
    expect([picked('k'), filled('k')]).toEqual([['3'], [24, 24, 24, 0, 0]]);
    expect([stars('s')[0].offsetWidth, stars('l')[0].offsetWidth]).toEqual([20, 32]);
  });

  test('keyboard table: ArrowDown picks the next star and ArrowUp the one before; Space picks the focused star, and with clearable clears the picked one (FH1)', async () => {
    const calls: (number | null)[] = [];
    await render(<div><Rating id="ku" aria-label="Up down" defaultValue={2} /><Rating id="ks" aria-label="Space" clearable onValueChange={(v) => calls.push(v)} /></div>);
    radios('ku')[1].focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    const down = picked('ku');
    await userEvent.keyboard('{ArrowUp}');
    expect([down, picked('ku')]).toEqual([['4'], ['3']]);
    radios('ks')[2].focus();   // nothing picked yet
    await userEvent.keyboard(' ');
    const first = picked('ks');
    await userEvent.keyboard(' ');
    expect([first, picked('ks'), calls]).toEqual([['3'], [], [3, null]]);
  });

  test('allowHalf: two choices per star ("2.5 stars"), the start half of a star picks the half; right to left, the half fills from the right', async () => {
    await render(<div><Rating id="h" aria-label="Half" allowHalf max={4} /><div dir="rtl"><Rating id="rt" aria-label="RTL" allowHalf defaultValue={1.5} max={3} /></div></div>);
    expect(radios('h').map((r) => r.getAttribute('aria-label'))).toEqual(['0.5 stars', '1 star', '1.5 stars', '2 stars', '2.5 stars', '3 stars', '3.5 stars', '4 stars']);
    await userEvent.click(radios('h')[4]);
    expect([picked('h'), filled('h')]).toEqual([['2.5'], [24, 24, 12, 0]]);
    const s = stars('rt')[1].getBoundingClientRect(), f = (stars('rt')[1].children[1] as HTMLElement).getBoundingClientRect();
    expect([filled('rt'), Math.round(s.right - f.right), stars('rt')[0].getBoundingClientRect().left > s.left]).toEqual([[24, 12, 0], 0, true]);
  });

  test('clearable: picking the current rating again, Backspace or Delete clears it; without clearable they don\'t', async () => {
    const calls: (number | null)[] = [];
    await render(<div><Rating id="c" aria-label="Clear" clearable defaultValue={4} onValueChange={(v) => calls.push(v)} /><Rating id="n" aria-label="Keep" defaultValue={4} /></div>);
    await userEvent.click(radios('c')[3]);
    expect(picked('c')).toEqual([]);   // the stars under the pointer stay lit until it leaves
    await userEvent.click(radios('c')[1]);
    await userEvent.keyboard('{Backspace}');
    await userEvent.click(radios('c')[0]);
    await userEvent.keyboard('{Delete}');
    expect(calls).toEqual([null, 2, null, 1, null]);
    await userEvent.click(radios('n')[3]);
    await userEvent.keyboard('{Backspace}');
    expect(picked('n')).toEqual(['4']);
  });

  test('hovering a star lights up the stars up to it without picking; leaving shows the rating again', async () => {
    await render(<Rating id="v" aria-label="Hover" defaultValue={1} />);
    await userEvent.hover(radios('v')[3]);
    expect([filled('v'), picked('v')]).toEqual([[24, 24, 24, 24, 0], ['1']]);
    await userEvent.unhover(radios('v')[3]);
    await userEvent.hover(document.body);
    await expect.poll(() => filled('v')).toEqual([24, 0, 0, 0, 0]);
  });

  test('L8E71 disabled, or in a disabled <fieldset>: hovering a star lights nothing, as nothing can be picked; aria-disabled on the group', async () => {
    await render(<div><Rating id="dh" aria-label="Off" disabled defaultValue={1} /><fieldset disabled><Rating id="df" aria-label="Fieldset" defaultValue={1} /></fieldset></div>);
    await userEvent.hover(el('dh').children[3]);
    await userEvent.hover(el('df').children[3]);
    expect([filled('dh'), filled('df'), el('df').getAttribute('aria-disabled')]).toEqual([[24, 0, 0, 0, 0], [24, 0, 0, 0, 0], 'true']);
  });

  test('readOnly: one role="img" named "4.3 out of 5" (after its own aria-label), any fraction drawn, no radios', async () => {
    await render(<div><Rating id="ro" readOnly value={4.3} /><Rating id="ra" readOnly aria-label="Average" value={3.5} /></div>);
    expect([page.getByRole('img', { name: '4.3 out of 5' }).element() === el('ro'), radios('ro').length, filled('ro')]).toEqual([true, 0, [24, 24, 24, 24, 7]]);
    expect(el('ra').getAttribute('aria-label')).toBe('Average, 3.5 out of 5');
    // With base.css (svg max-width: 100%), the star in a share-wide fill is still drawn whole and clipped, not shrunk (GI1).
    expect(stars('ro').map((s) => Math.round((s.children[1].firstElementChild as Element).getBoundingClientRect().width))).toEqual([24, 24, 24, 24, 24]);
  });

  test('ten lg stars in 320px shrink alike to fit, square and drawn whole, down to the sm size; with room they stay 32px (GK2)', async () => {
    await render(<div><div style={{ width: '320px' }}><Rating id="nar" readOnly max={10} size="lg" value={7.5} /></div>
      <div style={{ width: '600px' }}><Rating id="wid" readOnly max={10} size="lg" value={7.5} /></div>
      <div style={{ width: '100px' }}><Rating id="tiny" readOnly max={10} size="lg" value={7.5} /></div></div>);
    const w = (e: Element) => Math.round(e.getBoundingClientRect().width * 10) / 10;
    const box = (id: string) => stars(id).map((s) => [w(s), Math.round(s.getBoundingClientRect().height * 10) / 10, w(s.children[1].firstElementChild as Element)]);
    const nar = box('nar');
    expect(el('nar').getBoundingClientRect().width).toBeLessThanOrEqual(320);
    expect(nar.every(([sw, sh, draw]) => sw === nar[0][0] && sh === sw && draw === sw && sw < 32 && sw >= 20)).toBe(true);
    expect(box('wid').every(([sw, sh, draw]) => sw === 32 && sh === 32 && draw === 32)).toBe(true);
    expect(box('tiny').every(([sw]) => sw === 20)).toBe(true);
  });

  test('in a 320px grid column (a form layout) the ten lg stars shrink too, rather than widen the column (GM1)', async () => {
    await render(<div style={{ display: 'grid', width: '320px' }}><div><Rating id="gr" readOnly max={10} size="lg" value={7.5} /></div></div>);
    const sw = stars('gr').map((s) => Math.round(s.getBoundingClientRect().width * 10) / 10);
    expect([el('gr').parentElement!.getBoundingClientRect().width <= 320, el('gr').getBoundingClientRect().right - el('gr').parentElement!.getBoundingClientRect().left <= 320, sw.every((x) => x === sw[0] && x < 32 && x >= 20)]).toEqual([true, true, true]);
  });

  test('in a form: name sends the rating; form reset brings the default back; disabled and required reach the radios', async () => {
    await render(<form id="f"><Rating id="fr" aria-label="Form" name="stars" defaultValue={2} required /><Rating id="d" aria-label="Off" disabled defaultValue={3} /></form>);
    const form = el('f') as HTMLFormElement;
    await userEvent.click(radios('fr')[3]);
    expect(new FormData(form).get('stars')).toBe('4');
    form.reset();
    await expect.poll(() => picked('fr')).toEqual(['2']);
    expect([radios('fr').every((r) => r.required), radios('d').every((r) => r.disabled), el('d').getAttribute('aria-disabled')]).toEqual([true, true, 'true']);
  });

  test('a value between the choices (3.3, or 3.7 with halves) checks the star it draws, so the radios, a screen reader and the form agree with the stars (L8E61)', async () => {
    await render(<div><Rating id="w" aria-label="Whole" value={3.3} /><Rating id="h" aria-label="Halves" allowHalf defaultValue={3.7} /></div>);
    expect([picked('w'), filled('w'), picked('h')]).toEqual([['3'], [24, 24, 24, 0, 0], ['3.5']]);
  });

  test('form: outside its form, its reset brings the default back too, in the stars as in the radios', async () => {
    await render(<><form id="of" /><Rating id="or" aria-label="Outside" name="stars" form="of" defaultValue={2} /></>);
    const form = el('of') as HTMLFormElement;
    const full = filled('or')[0];
    await userEvent.click(radios('or')[3]);
    await userEvent.unhover(el('or'));
    expect(new FormData(form).get('stars')).toBe('4');
    form.reset();
    await expect.poll(() => filled('or').map((w) => w === full)).toEqual([true, true, false, false, false]);
    expect(picked('or')).toEqual(['2']);
  });

  test('in a Field: the label names the group and the hint describes it; error marks it invalid', async () => {
    await render(<Field label="How was your stay?" hint="Pick again to clear." error="Pick a rating."><Rating clearable /></Field>);
    const group = page.getByRole('radiogroup', { name: 'How was your stay?' }).element();
    expect([group.getAttribute('aria-invalid'), document.getElementById(group.getAttribute('aria-describedby')!.split(' ')[0])!.textContent]).toEqual(['true', 'Pick again to clear.']);
  });

  test('invalid shows on the stars: the empty ones take the danger color, 3:1 on the page in all six themes', async () => {
    await render(<><Rating id="ok" aria-label="Fine" defaultValue={1} /><Rating id="bad" aria-label="Wrong" invalid defaultValue={1} /></>);
    const empty = (id: string) => css(stars(id)[4].children[0]).color;
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const r = contrast(empty('bad'), css(document.body).backgroundColor);
      if (empty('bad') === empty('ok') || r < 3) low.push(`${th}: ${empty('bad')} ${r.toFixed(2)}`);
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
  });

  test('the filled and empty star colors are 3:1 on the page in all six themes; Indonesian names ("2,5 bintang", "4,5 dari 5")', async () => {
    await render(<Rating id="t" aria-label="Theme" defaultValue={1} />);
    const low: string[] = [];
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const page = css(document.body).backgroundColor;
      for (const [k, layer] of [['fill', 1], ['empty', 0]] as const) {
        const r = contrast(css(stars('t')[0].children[layer]).color, page);
        if (r < 3) low.push(`${th} ${k}: ${r.toFixed(2)}`);
      }
    }
    document.documentElement.removeAttribute('data-theme');
    expect(low).toEqual([]);
    expect([idLabels.ratingStars(2.5), idLabels.ratingValue(4.5, 5), idLabels.ratingStars(1)]).toEqual(['2,5 bintang', '4,5 dari 5', '1 bintang']);
  });
  test('L8E88 in a required Field (or with aria-required): the radiogroup says it is required', async () => {
    await render(<><Field label="How was your stay?" required><Rating /></Field><Rating aria-label="Food" aria-required /></>);
    expect([page.getByRole('radiogroup', { name: 'How was your stay?' }).element().getAttribute('aria-required'), page.getByRole('radiogroup', { name: 'Food' }).element().getAttribute('aria-required')]).toEqual(['true', 'true']);
  });
});
