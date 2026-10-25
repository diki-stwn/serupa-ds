import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Input } from '../components/Input/Input';
import { Textarea } from '../components/Textarea/Textarea';

const ui = <div><Input id="mi" aria-label="Code" maxLength={6} defaultValue="ab" /><Textarea id="mt" aria-label="Note" maxLength={20} /></div>;

// The native cap holds before hydration, or with no script at all; then the components count characters as people
// see them, which the native one can't (BE2).
describe('maxLength and hydration', () => {
  test('server HTML has the native maxlength; it comes off after hydration, without a mismatch', async () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(ui);
    document.body.appendChild(host);
    const attrs = () => ['mi', 'mt'].map((id) => host.querySelector('#' + id)!.getAttribute('maxlength'));
    expect(attrs()).toEqual(['6', '20']);
    const errors: string[] = [], logError = console.error;
    console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); };
    let root: Root | undefined;
    try {
      flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
      await new Promise((r) => setTimeout(r, 50));
    } finally { console.error = logError; }
    expect([attrs(), errors]).toEqual([[null, null], []]);
    root?.unmount(); host.remove();
  });

  test('a client-only render never sets the native maxlength', async () => {
    await render(ui);
    expect(['mi', 'mt'].map((id) => document.getElementById(id)!.getAttribute('maxlength'))).toEqual([null, null]);
  });
});
