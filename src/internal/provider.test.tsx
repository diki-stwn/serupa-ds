import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Alert } from '../components/Alert/Alert';
import { Calendar } from '../components/Calendar/Calendar';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { FileUpload } from '../components/FileUpload/FileUpload';
import { Icon } from '../components/Icon/Icon';
import { Loader } from '../components/Loader/Loader';
import { Pagination } from '../components/Pagination/Pagination';
import { TimePicker } from '../components/TimePicker/TimePicker';
import { idLabels } from './labels';
import { SerupaProvider, useSerupa } from './provider';

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const name = (sel: string) => q(sel).getAttribute('aria-label');
const Square = { name: 'my_square', d: 'M100-100h760v-760H100z' };

describe('SerupaProvider labels', () => {
  test('replace the words the components say on their own', async () => {
    await render(<SerupaProvider labels={{ dismiss: 'Abaikan', previousPage: 'Sebelumnya', nextPage: 'Berikutnya', pagination: 'Halaman', page: (n) => 'Halaman ' + n, loading: 'Memuat' }}>
      <Alert title="Saved" onDismiss={() => {}} />
      <Pagination count={3} defaultPage={2} />
      <Loader delay={0} />
    </SerupaProvider>);
    expect(name('.dk-alert__dismiss')).toBe('Abaikan');
    expect(name('.dk-pagination')).toBe('Halaman');
    const arrows = [...document.querySelectorAll('.dk-pagination__arrow')].map((a) => a.getAttribute('aria-label'));
    expect(arrows).toEqual(['Sebelumnya', 'Berikutnya']);
    expect(document.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Halaman 2');
    expect(name('.dk-loader')).toBe('Memuat');
  });

  test('labels and icons written inline keep the settings when a parent re-renders with the same contents; new contents still change them (U2)', async () => {
    const seen: Array<ReturnType<typeof useSerupa>> = [];
    const Peek = React.memo(function Peek() { seen.push(useSerupa()); return null; });
    const star = { name: 'u2_star', d: 'M0 0h24v24H0z' };
    let bump: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0); bump = setN;
      return <SerupaProvider labels={{ close: n < 2 ? 'Tutup' : 'Keluar' }} icons={[{ star }]}><Peek /></SerupaProvider>;
    }
    await render(<App />);
    React.act(() => bump(1));   // same words, written inline again
    expect(seen.length).toBe(1);
    React.act(() => bump(2));   // new words
    expect([seen.length, seen[seen.length - 1].labels.close, seen[0].icons.has('u2_star')]).toEqual([2, 'Keluar', true]);
  });

  test('a component prop still wins; an inner provider changes only what it sets', async () => {
    await render(<SerupaProvider labels={{ dismiss: 'Abaikan' }}>
      <Alert id="a" title="One" onDismiss={() => {}} />
      <Alert id="b" title="Two" onDismiss={() => {}} dismissLabel="Hide" />
      <SerupaProvider labels={{ dragFiles: 'Taruh di sini', close: '' }}>
        <Alert id="c" title="Three" onDismiss={() => {}} />
        <FileUpload multiple />
      </SerupaProvider>
    </SerupaProvider>);
    expect(q('#a .dk-alert__dismiss').getAttribute('aria-label')).toBe('Abaikan');
    expect(q('#b .dk-alert__dismiss').getAttribute('aria-label')).toBe('Hide');
    expect(q('#c .dk-alert__dismiss').getAttribute('aria-label')).toBe('Abaikan');
    expect(q('.dk-file-upload__title').textContent).toBe('Taruh di sini');
  });

  test('idLabels covers every key, and English is the default without a provider', async () => {
    let seen: ReturnType<typeof useSerupa> | undefined;
    function Peek() { seen = useSerupa(); return null; }
    await render(<Peek />);
    expect(seen!.labels.close).toBe('Close');
    expect(seen!.locale).toBeUndefined();
    expect(Object.keys(idLabels).sort()).toEqual(Object.keys(seen!.labels).sort());
    expect(Object.values(idLabels).every((v) => typeof v === 'function' || String(v).trim() !== '')).toBe(true);
  });
});

describe('SerupaProvider locale', () => {
  test('dates and times follow it when the component has no locale prop', async () => {
    await render(<SerupaProvider locale="de-DE">
      <Calendar id="cal" defaultMonth={new Date(2026, 2, 1)} />
      <DatePicker id="dp" aria-label="Datum" defaultValue={new Date(2026, 2, 5)} />
      <TimePicker id="tp" aria-label="Zeit" defaultValue="14:05" />
      <DatePicker id="en" aria-label="Date" locale="en-US" defaultValue={new Date(2026, 2, 5)} />
    </SerupaProvider>);
    expect(q('#cal').textContent).toContain('März 2026');
    expect(q('#cal th').getAttribute('abbr')).toBe('Montag');   // Monday first in German
    expect((q('#dp') as HTMLInputElement).value).toBe('05.03.2026');
    expect((q('#tp') as HTMLInputElement).value).toBe('14:05');
    expect((q('#en') as HTMLInputElement).value).toBe('03/05/2026');
  });

  test('two server renders with different locales stay apart', async () => {
    const page = (locale: string) => renderToString(<SerupaProvider locale={locale}><DatePicker aria-label="d" defaultValue={new Date(2026, 2, 5)} /></SerupaProvider>);
    const [de, us] = await Promise.all([Promise.resolve().then(() => page('de-DE')), Promise.resolve().then(() => page('en-US'))]);
    expect(de).toContain('value="05.03.2026"');
    expect(us).toContain('value="03/05/2026"');
  });
});

describe('SerupaProvider icons', () => {
  test('draw by name inside it, and only there', async () => {
    await render(<>
      <SerupaProvider icons={[Square]}><Icon id="in" name={'my_square'} /></SerupaProvider>
      <Icon id="out" name={'my_square'} />
    </>);
    expect(q('#in path')?.getAttribute('d')).toBe(Square.d);
    expect(q('#out path')).toBeNull();
  });
});
