import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { THEMES, contrast, css, forcedColors } from '../../../tools/test/vitest/helpers';
import { Field } from '../Field/Field';
import { FileUpload, formatFileSize } from './FileUpload';
import { idLabels } from '../../internal/labels';
import { SerupaProvider } from '../../internal/provider';

const file = (name: string, type: string, size: number) => new File([new Uint8Array(size).fill(1)], name, { type });
const q = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const many = '[data-testid=many]';
const rootOf = (id: string) => document.getElementById(id)!.closest('[data-component=file-upload]') as HTMLElement;
// The chosen files are the items of the named list; rejections are the alert.
const items = (root: Element) => [...root.querySelectorAll<HTMLElement>('ul[aria-label] > li')];
const list = (root: Element) => items(root).map((li) => li.querySelector('.dk-file-upload__name')!.getAttribute('title') + ' ' + li.querySelector('.dk-file-upload__size')!.textContent + ' ' + li.querySelector<HTMLElement>('.dk-file-upload__file-icon')!.dataset.icon);
const errs = (root: Element) => { const e = root.querySelector('[role=alert]'); return e ? e.getAttribute('role') + ': ' + [...e.querySelectorAll('.dk-file-upload__error')].map((x) => x.textContent.replace(/^error/, '')).join(' / ') : null; };
const names = (root: Element) => [...root.querySelectorAll('.dk-file-upload__name')].map((x) => x.getAttribute('title')).join();
const input = (root: Element) => root.querySelector('input[type=file]') as HTMLInputElement;
const choose = (root: Element) => root.querySelector('.dk-btn') as HTMLButtonElement;
// The button opens the picker by clicking the native input; count those clicks and stop the picker from opening.
const watchPicker = (root: Element) => { const w = { opened: 0 }; input(root).addEventListener('click', (e) => { w.opened++; e.preventDefault(); }); return w; };

function Many(props: { rejects?: string[]; fref?: React.Ref<HTMLDivElement> }) {
  return <div style={{ width: '420px' }}><FileUpload id="many" data-testid="many" multiple accept="image/*,.pdf" maxSize={1024 * 1024} maxFiles={3} hint="Images or PDF, up to 1 MB" name="docs" ref={props.fref} className="extra"
    onReject={(r) => { if (props.rejects) props.rejects.push(r.map((x) => x.reason).join(',')); }} /></div>;
}
function Controlled(props: { changes: string[]; setRef: { set?: (f: File[]) => void } }) {
  const [files, set] = React.useState<File[]>([]);
  props.setRef.set = set;
  return <FileUpload id="ctl" files={files} onFilesChange={(f) => { props.changes.push(f.map((x) => x.name).join('|')); set(f); }} />;
}

describe('FileUpload', () => {
  test('a drop area titled "Drag files here" with a "Choose files" button described by the hint; a hidden native input with accept, multiple, name and the given id; ref and className', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Many fref={ref} />);
    const el = q(many), btn = choose(el), inp = input(el);
    expect(ref.current).toBe(el);
    expect(el.className).toMatch(/extra/);
    expect([el.dataset.component, el.querySelector('.dk-file-upload__title')!.textContent, btn.textContent, document.getElementById(btn.getAttribute('aria-describedby')!)!.textContent]).toEqual(['file-upload', 'Drag files here', 'Choose files', 'Images or PDF, up to 1 MB']);
    expect([inp.accept, inp.multiple, inp.name, inp.id, inp.getAttribute('aria-hidden'), inp.tabIndex]).toEqual(['image/*,.pdf', true, 'docs', 'many', 'true', -1]);
  });

  test('form: a FileUpload outside its form submits with it (the native input carries the form attribute)', async () => {
    await render(<><form id="fu-f" /><FileUpload data-testid="fuf" name="docs" form="fu-f" /></>);
    const input = q<HTMLInputElement>('[data-testid=fuf] input[type=file]');
    expect([input.form?.id, new FormData(document.getElementById('fu-f') as HTMLFormElement).has('docs')]).toEqual(['fu-f', true]);
  });

  test('a drag that carries no files (text, a link) doesn\'t light the area up or allow a drop; a file drag does', async () => {
    await render(<Many />);
    const zone = q(many).querySelector('.dk-file-upload__zone') as HTMLElement;
    const text = new DataTransfer(); text.setData('text/plain', 'hello');
    const enterText = new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: text });
    zone.dispatchEvent(enterText);
    await new Promise((ok) => setTimeout(ok, 50));
    expect([zone.hasAttribute('data-dragging'), enterText.defaultPrevented]).toEqual([false, false]);
    const files = new DataTransfer(); files.items.add(file('a.png', 'image/png', 10));
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: files }));
    await expect.poll(() => zone.hasAttribute('data-dragging')).toBe(true);
  });

  test('submitted without a required file: no browser bubble on the hidden input; the choose button takes focus, is invalid and described by "Choose a file."; a file clears it', async () => {
    let submitted = 0;
    await render(<form id="req" onSubmit={(e) => { e.preventDefault(); submitted++; }}><FileUpload id="rq" name="doc" required /><button id="go">Send</button></form>);
    const root = rootOf('rq');
    await userEvent.click(document.getElementById('go')!);
    await expect.poll(() => document.activeElement).toBe(choose(root));
    expect([submitted, errs(root), choose(root).getAttribute('aria-invalid'), choose(root).getAttribute('aria-describedby')!.split(' ').map((i) => document.getElementById(i)!.textContent.replace(/^error/, '')).join(' | ')])
      .toEqual([0, 'alert: Choose a file.', 'true', 'Required | Choose a file.']);
    await userEvent.upload(input(root), [file('a.pdf', 'application/pdf', 10)]);
    await expect.poll(() => errs(root)).toBe(null);
    expect(choose(root).hasAttribute('aria-invalid')).toBe(false);
  });

  test('refusal messages in the provider\'s words: Indonesian under id-ID, the types joined with "atau"', async () => {
    await render(<SerupaProvider locale="id-ID" labels={idLabels}><FileUpload id="fid" multiple accept="image/*,.pdf" maxSize={1024} maxFiles={1} /></SerupaProvider>);
    const root = rootOf('fid');
    await userEvent.upload(input(root), [file('catatan.txt', 'text/plain', 10), file('besar.png', 'image/png', 4096), file('a.png', 'image/png', 10), file('b.png', 'image/png', 10)]);
    expect(errs(root)).toBe('alert: catatan.txt bukan gambar atau PDF. / besar.png lebih besar dari 1 KB. / b.png tidak ditambahkan: maksimal 1 file.');
  });

  test('the button opens the file picker (it clicks the native input, which allows several files)', async () => {
    await render(<Many />);
    const w = watchPicker(q(many));
    await userEvent.click(choose(q(many)));
    expect([w.opened, input(q(many)).multiple]).toEqual([1, true]);
  });

  test('chosen files are listed with a type icon, name and size; the native input holds them; accept and maxSize refuse files in a role="alert" message, a duplicate is skipped and said so (FQ1); maxFiles=3 says why the fourth isn\'t added', async () => {
    const rejects: string[] = [];
    await render(<Many rejects={rejects} />);
    const el = q(many);
    await userEvent.upload(input(el), [file('photo.png', 'image/png', 2048), file('report.pdf', 'application/pdf', 1536 * 1024 / 2)]);
    expect(list(el)).toEqual(['photo.png 2 KB image', 'report.pdf 768 KB picture_as_pdf']);
    await expect.poll(() => [...input(el).files!].map((f) => f.name).join()).toBe('photo.png,report.pdf');
    await userEvent.upload(input(el), [file('notes.txt', 'text/plain', 10), file('huge.png', 'image/png', 2 * 1024 * 1024), file('photo.png', 'image/png', 2048)]);
    expect([list(el).length, errs(el), rejects.join(';')]).toEqual([2, 'alert: notes.txt isn\'t an image or PDF. / huge.png is larger than 1 MB. / photo.png is already added.', 'type,size,duplicate']);
    await userEvent.upload(input(el), [file('a.jpg', 'image/jpeg', 100), file('b.jpg', 'image/jpeg', 100)]);
    expect([list(el).length, errs(el)]).toEqual([3, 'alert: b.jpg wasn\'t added: up to 3 files.']);
  });

  test('the remove button (named "Remove report.pdf") takes the file off the list, clears old messages and moves focus to the next file\'s remove button (FQ1)', async () => {
    await render(<Many />);
    const el = q(many);
    await userEvent.upload(input(el), [file('photo.png', 'image/png', 2048), file('report.pdf', 'application/pdf', 10), file('a.jpg', 'image/jpeg', 100), file('b.jpg', 'image/jpeg', 100)]);
    expect(errs(el)).not.toBeNull();
    await userEvent.click(items(el)[0].querySelector('button')!);
    await expect.poll(() => document.activeElement!.getAttribute('aria-label')).toBe('Remove report.pdf');
    expect([names(el), items(el)[0].querySelector('button')!.getAttribute('aria-label'), !!el.querySelector('[role=alert]')]).toEqual(['report.pdf,a.jpg', 'Remove report.pdf', false]);
  });

  test('dragging files over the area highlights it; dropping adds them and ends the highlight', async () => {
    await render(<Many />);
    const zone = q(`${many} .dk-file-upload__zone`), dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(300)], 'drop.gif', { type: 'image/gif' }));
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await expect.poll(() => zone.className).toMatch(/zone--over/);
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await expect.poll(() => zone.className).not.toMatch(/zone--over/);
    expect(names(q(many))).toBe('drop.gif');
  });

  test('forced colors: the drag-over area keeps a Highlight border, unlike the resting one', async () => {
    await render(<Many />);
    const zone = q(`${many} .dk-file-upload__zone`), dt = new DataTransfer();
    dt.items.add(new File(['x'], 'a.txt', { type: 'text/plain' }));   // only a drag of files highlights the area
    const r = await forcedColors(async (active) => {
      if (!active) return null;
      const rest = css(zone).borderTopColor;
      zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
      await expect.poll(() => zone.className).toMatch(/zone--over/);
      return [css(zone).borderTopColor !== rest, css(zone).borderTopStyle];
    });
    if (r) expect(r).toEqual([true, 'solid']);
  });

  test('single file (no multiple): "Drag a file here", "Choose a file"; a new file replaces the old one; onFilesChange gets the list; controlled: clearing it from outside empties it', async () => {
    const changes: string[] = [], setRef: { set?: (f: File[]) => void } = {};
    await render(<Controlled changes={changes} setRef={setRef} />);
    const el = rootOf('ctl');
    expect([el.querySelector('.dk-file-upload__title')!.textContent, choose(el).textContent, input(el).multiple]).toEqual(['Drag a file here', 'Choose a file', false]);
    await userEvent.upload(input(el), file('one.png', 'image/png', 10));
    await userEvent.upload(input(el), file('two.png', 'image/png', 10));
    expect([changes.join(';'), list(el).length]).toEqual(['one.png;two.png', 1]);
    React.act(() => setRef.set!([]));
    await expect.poll(() => list(el).length).toBe(0);
  });

  test('in a Field: the button is named "Due date, Choose a file" and described by the Field\'s hint, then its own; outside a Field it keeps its own name', async () => {
    await render(<>
      <Field label="Due date" hint="The signed form"><FileUpload data-testid="fu1" hint="PDF, up to 5 MB" /></Field>
      <FileUpload data-testid="fu2" />
    </>);
    const root = (t: string) => document.querySelector<HTMLElement>(`[data-testid=${t}]`)!;
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    const b = choose(root('fu1'));
    expect([text(b.getAttribute('aria-labelledby')), text(b.getAttribute('aria-describedby')), root('fu1').getAttribute('aria-describedby')])
      .toEqual(['Due date / Choose a file', 'The signed form / PDF, up to 5 MB', null]);
    expect([choose(root('fu2')).getAttribute('aria-labelledby'), choose(root('fu2')).textContent]).toEqual([null, 'Choose a file']);
  });

  test('ref.current.focus() and autoFocus land on the choose button, as a form library focusing the first invalid field expects; disabled, nothing is focused', async () => {
    const on = React.createRef<HTMLDivElement>(), off = React.createRef<HTMLDivElement>();
    await render(<>
      <FileUpload id="ffa" autoFocus />
      <FileUpload id="ffr" ref={on} />
      <FileUpload id="ffd" ref={off} disabled />
    </>);
    await expect.poll(() => document.activeElement).toBe(choose(rootOf('ffa')));
    expect(rootOf('ffa').hasAttribute('autofocus')).toBe(false);
    on.current!.focus();
    expect(document.activeElement).toBe(choose(rootOf('ffr')));
    off.current!.focus();
    expect(document.activeElement).toBe(choose(rootOf('ffr')));
    expect(on.current).toBe(rootOf('ffr'));
  });

  test('disabled: the button and input are disabled, the area faded', async () => {
    await render(<FileUpload id="dis" disabled />);
    const el = rootOf('dis');
    expect([choose(el).disabled, input(el).disabled]).toEqual([true, true]);
    await expect.poll(() => getComputedStyle(el.querySelector('.dk-file-upload__zone')!).opacity).toBe('0.5');
  });

  test('in a Field with an error and required: the button is aria-invalid and described by "Required" first, the native input required, the area outlined in danger; nothing leaks onto the wrapper and React doesn\'t warn', async () => {
    const seen: string[] = [], orig = console.error;
    console.error = (...a: unknown[]) => { seen.push(a.map(String).join(' ')); };
    try {
      await render(<>
        <Field label="Contract" error="Add the signed contract" required><FileUpload data-testid="fi1" required /></Field>
        <FileUpload id="fi2" invalid readOnly={false} />
        <FileUpload id="fi3" />
      </>);
    } finally { console.error = orig; }
    const root = document.querySelector<HTMLElement>('[data-testid=fi1]')!, b = choose(root);
    const text = (ids: string | null) => (ids || '').split(' ').map((i) => document.getElementById(i)?.textContent).join(' / ');
    expect([b.getAttribute('aria-invalid'), b.hasAttribute('aria-required'), text(b.getAttribute('aria-describedby')), input(root).required])
      .toEqual(['true', false, 'Required / Add the signed contract', true]);
    expect(['invalid', 'required', 'readonly', 'aria-invalid', 'aria-required', 'aria-readonly'].filter((a) => root.hasAttribute(a))).toEqual([]);
    expect(seen.filter((m) => /invalid|required|readOnly/i.test(m))).toEqual([]);
    const zone = (id: string) => getComputedStyle(rootOf(id).querySelector('.dk-file-upload__zone')!);
    expect([rootOf('fi2').className, zone('fi2').borderTopStyle, zone('fi2').borderTopColor === zone('fi3').borderTopColor, choose(rootOf('fi3')).hasAttribute('aria-invalid')])
      .toEqual(['dk-file-upload dk-file-upload--invalid', 'solid', false, false]);
  });

  test('readOnly: the files are listed (and submitted) without remove buttons; the button stays focusable (aria-disabled) but opens no picker; dropped files are ignored', async () => {
    const changes: string[] = [];
    await render(<form id="rof"><FileUpload id="ro" name="doc" readOnly files={[file('a.pdf', 'application/pdf', 10)]} onFilesChange={(f) => { changes.push(f.map((x) => x.name).join()); }} /></form>);
    const el = rootOf('ro'), w = watchPicker(el), b = choose(el);
    await expect.poll(() => input(el).files?.length).toBe(1);
    expect([names(el), el.querySelector('ul[aria-label] > li button'), b.disabled, b.getAttribute('aria-disabled'), input(el).disabled, el.className])
      .toEqual(['a.pdf', null, false, 'true', false, 'dk-file-upload dk-file-upload--readonly']);
    b.focus();
    expect(document.activeElement).toBe(b);
    await userEvent.keyboard('{Enter}');
    await userEvent.click(el.querySelector('.dk-file-upload__zone')!, { position: { x: 4, y: 4 } });
    const dt = new DataTransfer(); dt.items.add(file('b.pdf', 'application/pdf', 10));
    el.querySelector('.dk-file-upload__zone')!.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    expect([w.opened, changes, names(el), new FormData(document.getElementById('rof') as HTMLFormElement).getAll('doc').length]).toEqual([0, [], 'a.pdf', 1]);
  });

  test('formatFileSize: 0 B, 12 B, 1023 B, 1 KB, 1.5 KB, 10 MB, 3.3 GB', () => {
    expect([0, 12, 1023, 1024, 1536, 10 * 1024 * 1024 + 1, 3.25 * 1024 ** 3].map(formatFileSize).join('|')).toBe('0 B|12 B|1023 B|1 KB|1.5 KB|10 MB|3.3 GB');
  });

  test('contrast: text 4.5:1 (also while dragging), the icon and outline (also invalid) 3:1, in all six themes', async () => {
    await render(<Many />);
    const el = q(many);
    await userEvent.upload(input(el), file('photo.png', 'image/png', 10));
    await userEvent.upload(input(el), file('x.txt', 'text/plain', 1));
    const prevBg = document.body.style.background; document.body.style.background = 'var(--surface)';
    const still = document.createElement('style'); still.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(still);
    const low: string[] = []; let n = 0;
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      const zone = el.querySelector('.dk-file-upload__zone')!, zs = getComputedStyle(zone), pg = getComputedStyle(document.body).backgroundColor, ib = getComputedStyle(el.querySelector('.dk-file-upload__item')!).backgroundColor;
      const c = (sel: string) => getComputedStyle(el.querySelector(sel)!).color;
      const pairs: Array<[string, string, string, number]> = [['title', c('.dk-file-upload__title'), zs.backgroundColor, 4.5], ['hint', c('.dk-file-upload__hint'), zs.backgroundColor, 4.5], ['icon', c('.dk-file-upload__icon'), zs.backgroundColor, 3], ['zone outline', zs.borderTopColor, pg, 3], ['error', c('.dk-file-upload__error'), pg, 4.5], ['file name', c('.dk-file-upload__name'), ib, 4.5], ['size', c('.dk-file-upload__size'), ib, 4.5]];
      zone.classList.add('dk-file-upload__zone--over');
      const zo = getComputedStyle(zone).backgroundColor;
      pairs.push(['hint while dragging', c('.dk-file-upload__hint'), zo, 4.5], ['title while dragging', c('.dk-file-upload__title'), zo, 4.5]);
      zone.classList.remove('dk-file-upload__zone--over');
      el.classList.add('dk-file-upload--invalid');
      pairs.push(['invalid outline', getComputedStyle(zone).borderTopColor, pg, 3]);
      el.classList.remove('dk-file-upload--invalid');
      for (const [k, fg, bg, min] of pairs) { const r = contrast(fg, bg); n++; if (r < min) low.push(`${th} ${k} ${r.toFixed(2)}`); }
    }
    document.documentElement.setAttribute('data-theme', 'blue-light'); still.remove(); document.body.style.background = prevBg;
    expect(low).toEqual([]);
    expect(n).toBe(60);
  });

  test('--file-upload-zone-bg overrides one upload', async () => {
    await render(<FileUpload id="tok" style={{ '--file-upload-zone-bg': 'rgb(1, 2, 3)' } as React.CSSProperties} />);
    await expect.poll(() => getComputedStyle(rootOf('tok').querySelector('.dk-file-upload__zone')!).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('keyboard: Tab reaches the choose button first (the hidden input and the drop area are skipped); Enter and Space open the file picker; Tab then reaches each file\'s remove button, named after the file; Enter removes the file and focus moves to the one before it, and to the choose button once none are left (FQ1)', async () => {
    await render(<Many />);
    const el = q(many), w = watchPicker(el);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(choose(el));
    await userEvent.keyboard('{Enter}');
    expect(w.opened).toBe(1);
    await userEvent.keyboard(' ');
    expect(w.opened).toBe(2);
    await userEvent.upload(input(el), [file('a.png', 'image/png', 10), file('b.pdf', 'application/pdf', 10)]);
    await expect.poll(() => items(el).length).toBe(2);
    choose(el).focus();
    const stops: Array<string | null> = [];
    for (let i = 0; i < 2; i++) { await userEvent.keyboard('{Tab}'); stops.push(document.activeElement!.getAttribute('aria-label')); }
    expect(stops).toEqual(['Remove a.png', 'Remove b.pdf']);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => items(el).length).toBe(1);
    await expect.poll(() => document.activeElement!.getAttribute('aria-label')).toBe('Remove a.png');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => items(el).length).toBe(0);
    await expect.poll(() => document.activeElement).toBe(choose(el));
  });

  test('a refused type says what is accepted, in words from accept: "a PNG or JPG", "an SVG", "an audio file or MP4"; a type with no short name keeps the general message', async () => {
    await render(<>
      <FileUpload id="fa" accept=".png,.jpg,.jpeg" />
      <FileUpload id="fb" accept="image/svg+xml" />
      <FileUpload id="fc" accept="audio/*,video/mp4" />
      <FileUpload id="fd" accept=".csv,application/vnd.ms-excel" />
    </>);
    const msgs: string[] = [];
    for (const id of ['fa', 'fb', 'fc', 'fd']) {
      await userEvent.upload(input(rootOf(id)), [file('photo.heic', 'image/heic', 10)]);
      msgs.push(errs(rootOf(id))!);
    }
    expect(msgs).toEqual(['alert: photo.heic isn\'t a PNG or JPG.', 'alert: photo.heic isn\'t an SVG.', 'alert: photo.heic isn\'t an audio file or MP4.', 'alert: photo.heic: this type of file isn\'t accepted.']);
  });
  test('a <label for> that focuses the hidden input (as its click does) hands focus to the choose button', async () => {
    await render(<><label htmlFor="ful">Attachment</label><FileUpload id="ful" /></>);
    const inp = document.getElementById('ful') as HTMLInputElement;
    inp.focus();
    await expect.poll(() => document.activeElement && document.activeElement.closest('.dk-btn')).toBeTruthy();
    expect(document.activeElement).not.toBe(inp);
  });

});

describe('FileUpload: drops, folders and what is said (FQ1)', () => {
  const said = () => document.querySelector('[data-dk-announcer]')?.textContent ?? '';
  const fileDrag = (type: string, target: EventTarget) => {
    const dt = new DataTransfer(); dt.items.add(file('stray.png', 'image/png', 10));
    const e = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt });
    target.dispatchEvent(e);
    return e.defaultPrevented;
  };
  test('a file dropped outside the area doesn\'t open in the tab while a FileUpload can take it; a text drag, a read-only one and an unmounted one leave the page alone', async () => {
    const screen = await render(<Many />);
    const out = document.createElement('div'); document.body.appendChild(out);
    try {
      expect([fileDrag('dragover', out), fileDrag('drop', out)]).toEqual([true, true]);
      const text = new DataTransfer(); text.setData('text/plain', 'hi');
      const t = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: text }); out.dispatchEvent(t);
      expect(t.defaultPrevented).toBe(false);
      await screen.rerender(<FileUpload readOnly />);
      expect(fileDrag('drop', out)).toBe(false);
      await screen.unmount();
      expect(fileDrag('drop', out)).toBe(false);
    } finally { out.remove(); }
  });

  test('adding and removing are said politely: one file by name, several by count; in the provider\'s words', async () => {
    await render(<Many />);
    const el = q(many);
    await userEvent.upload(input(el), [file('report.pdf', 'application/pdf', 10)]);
    await expect.poll(said).toBe('report.pdf added.');
    await userEvent.upload(input(el), [file('a.png', 'image/png', 10), file('b.png', 'image/png', 10)]);
    await expect.poll(said).toBe('2 files added.');
    await userEvent.click(items(el)[0].querySelector('button')!);
    await expect.poll(said).toBe('report.pdf removed.');
  });

  test('Indonesian words for what is said and the new messages', async () => {
    await render(<SerupaProvider labels={idLabels}><FileUpload id="idfu" multiple /></SerupaProvider>);
    const el = rootOf('idfu');
    await userEvent.upload(input(el), [file('laporan.pdf', 'application/pdf', 10)]);
    await expect.poll(said).toBe('laporan.pdf ditambahkan.');
    await userEvent.upload(input(el), [file('laporan.pdf', 'application/pdf', 10)]);
    expect(errs(el)).toBe('alert: laporan.pdf sudah ditambahkan.');
    await userEvent.click(items(el)[0].querySelector('button')!);
    await expect.poll(said).toBe('laporan.pdf dihapus.');
  });

  test('a dropped folder is refused with reason "folder" and a message, while the files dropped with it are added', async () => {
    const rejects: string[] = [];
    await render(<Many rejects={rejects} />);
    const zone = q(`${many} .dk-file-upload__zone`), folder = new File([], 'Invoices'), pic = file('a.png', 'image/png', 10);
    // A real folder can't be put in a synthetic DataTransfer; this one says what the browser says for a dropped folder.
    const dt = { types: ['Files'], files: [folder, pic], dropEffect: 'none', items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true }) }, { kind: 'file', webkitGetAsEntry: () => ({ isDirectory: false }) }] };
    const e = new DragEvent('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'dataTransfer', { value: dt });
    zone.dispatchEvent(e);
    await expect.poll(() => names(q(many))).toBe('a.png');
    expect([errs(q(many)), rejects.join(';')]).toEqual(['alert: Invoices is a folder: choose the files in it instead.', 'folder']);
  });
});

describe('FileUpload: long file names (GR17)', () => {
  const LONG = 'quarterly-report-final-v2-approved-by-finance-department-';
  const fits = (el: Element) => el.scrollWidth <= el.clientWidth + 0.5;
  test.each(['ltr', 'rtl'])('a long name is cut in the middle in a %s page: the year and extension stay, the whole name is its title and is read once', async (dir) => {
    await render(<div dir={dir} style={{ width: 320 }}><FileUpload id={'gr17-' + dir} readOnly files={[file(LONG + '2025.pdf', 'application/pdf', 10), file(LONG + '2026.pdf', 'application/pdf', 10), file('a b.pdf', 'application/pdf', 10)]} /></div>);
    // Each name holds the start (cut), the end (kept) and the whole name for screen readers, in that order.
    const rows = items(rootOf('gr17-' + dir)).map((li) => li.querySelector('[title]')!);
    const shown = rows.map((n) => { const [start, end] = n.children; return [end.textContent, fits(end), fits(start), css(n).direction]; });
    expect(shown).toEqual([['t-2025.pdf', true, false, 'ltr'], ['t-2026.pdf', true, false, 'ltr'], ['a b.pdf', true, true, 'ltr']]);
    // The start ends where the end begins, with nothing lost or doubled, and a short name isn't cut at all.
    expect(rows.map((n) => { const [start, end, whole] = n.children; return [n.getAttribute('title'), start.textContent + end.textContent, whole.textContent, start.getAttribute('aria-hidden'), end.getAttribute('aria-hidden')]; })).toEqual(
      [LONG + '2025.pdf', LONG + '2026.pdf', 'a b.pdf'].map((n) => [n, n, n, 'true', 'true']));
  });
});
