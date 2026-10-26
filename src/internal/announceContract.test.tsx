// The announcement contract (E16): every place a component calls announce() is heard while a Dialog is open.
// The page behind a modal dialog is inert, so a screen reader reads nothing there, a live region included; the shared
// regions move into the innermost open modal (announce.ts). Each component's own test reads the region on a page
// with no dialog. Here every call site runs inside an open one, and its message has to land in a live region that is
// inside the dialog: polite (role="status") for news, assertive (role="alert") for an error.
// A component that starts calling announce() fails the last test until it has a row in SITES.
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { commands, userEvent } from 'vitest/browser';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { Combobox } from '../components/Combobox/Combobox';
import { CopyButton } from '../components/CopyButton/CopyButton';
import { Dialog } from '../components/Dialog/Dialog';
import { Field } from '../components/Field/Field';
import { InlineEdit } from '../components/InlineEdit/InlineEdit';
import { Input } from '../components/Input/Input';
import { Loader } from '../components/Loader/Loader';
import { NumberInput } from '../components/NumberInput/NumberInput';
import { Progress } from '../components/Progress/Progress';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';
import { SortableList } from '../components/SortableList/SortableList';
import { Splitter } from '../components/Splitter/Splitter';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/Table/Table';
import { toast, Toaster } from '../components/Toast/Toast';

interface Site {
  /** What sits in the dialog, at step 0 and after next(). */
  ui: (step: number) => React.ReactElement;
  /** Makes the component speak: as people do, or by moving to step 1. */
  act: (next: () => Promise<void>) => Promise<void>;
  /** What is said, and in which region. */
  says: RegExp;
  assertive?: true;
}

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const ITEMS = ['Apollo', 'Gemini', 'Mercury'].map((name) => ({ id: name, name }));

// Keyed "Component" or "Component: what happens"; the part before the colon is the component that calls announce().
const SITES: Record<string, Site> = {
  'Button: successText once the action is done': {
    ui: () => <Button id="go" onClick={async () => {}} successText="Invite sent">Send invite</Button>,
    act: async () => { await userEvent.click($('#go')); }, says: /Invite sent/ },
  'Badge: loadingText when it starts loading': {
    ui: (s) => <Badge loading={s === 1} loadingText="Refreshing status">Live</Badge>,
    act: (next) => next(), says: /Refreshing status/ },
  'Loader: its label when it shows': {
    ui: (s) => (s ? <Loader label="Loading results" delay={0} /> : <span />),
    act: (next) => next(), says: /Loading results/ },
  'Toast: a toast': {
    ui: () => <span />,
    act: async () => { React.act(() => { toast({ title: 'Link copied', duration: 0 }); }); }, says: /Link copied/ },
  'Toast: a danger toast interrupts': {
    ui: () => <span />,
    act: async () => { React.act(() => { toast({ title: 'Upload failed', tone: 'danger', duration: 0 }); }); }, says: /Upload failed/, assertive: true },
  'Combobox: how many options match once typing stops': {
    ui: () => <Combobox aria-label="Planet" options={['Mars', 'Mercury', 'Venus']} />,
    act: async () => { await userEvent.click($('input[role="combobox"]')); await userEvent.keyboard('M'); }, says: /2 results/ },
  'Field: a new error message': {
    ui: (s) => <Field label="Email" error={s ? 'Enter an email address with an @' : 'Enter an email address'}><Input /></Field>,
    act: (next) => next(), says: /Enter an email address with an @/ },
  'InlineEdit: a failed save': {
    ui: () => <InlineEdit label="Slug" defaultValue="apollo" validate={(x) => (x.includes(' ') ? 'Use dashes instead of spaces.' : null)} />,
    act: async () => { await userEvent.click($('[data-component="inline-edit"] button')); await userEvent.fill($('[data-component="inline-edit"] input'), 'apollo plan'); await userEvent.keyboard('{Enter}'); }, says: /Use dashes instead of spaces/ },
  'NumberInput: typed text that isn\'t a number': {
    ui: () => <NumberInput id="qty" aria-label="Quantity" defaultValue={5} />,
    act: async () => { await userEvent.fill($('#qty'), 'abc'); $('#qty').blur(); }, says: /"abc" wasn't accepted/, assertive: true },
  'SortableList: picking an item up with Space': {
    ui: () => <SortableList items={ITEMS} getKey={(t) => t.id} getLabel={(t) => t.name} renderItem={(t) => t.name} onReorder={() => {}} />,
    act: async () => { $('button[aria-label$=" Gemini"]').focus(); await userEvent.keyboard(' '); }, says: /Gemini.*2.*3/ },
  'Splitter: a press on the handle that starts placing it': {
    ui: () => <Splitter style={{ width: '400px', height: '100px' }}><p>Start</p><p>End</p></Splitter>,
    act: async () => { await userEvent.click($('[role=separator]')); }, says: /Press where the handle should go/ },
  'PasswordInput: Caps Lock turning on': {
    ui: () => <PasswordInput aria-label="Password" />,
    act: async () => { const f = $('input'); f.focus(); f.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, modifierCapsLock: true })); }, says: /Caps Lock is on/ },
  'Progress: announceComplete when the value reaches max': {
    ui: (s) => <Progress label="Upload" value={s ? 100 : 60} announceComplete />,
    act: (next) => next(), says: /Upload: complete/ },
  'Table: a new sort order': {
    ui: (s) => <Table><TableHead><TableRow><TableHeaderCell sort={s ? 'ascending' : 'none'} onSort={() => {}}>Name</TableHeaderCell></TableRow></TableHead><TableBody><TableRow><TableCell>Apollo</TableCell></TableRow></TableBody></Table>,
    act: (next) => next(), says: /Sorted by Name, ascending/ },
  'CopyButton: copied': {
    ui: () => <CopyButton id="copy" value="https://serupa.dev" />,
    act: async () => { await userEvent.click($('#copy')); }, says: /Copied/ },
  'CopyButton: copying failed': {
    ui: () => <CopyButton id="copy" value="https://serupa.dev" />,
    act: async () => { writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError')); vi.spyOn(document, 'execCommand').mockReturnValue(false); await userEvent.click($('#copy')); }, says: /Couldn't copy/, assertive: true },
};

let writeText: ReturnType<typeof vi.fn>;
beforeEach(() => {
  writeText = vi.fn(async () => {});
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => { React.act(() => toast.dismiss()); vi.restoreAllMocks(); });

function InDialog({ site, step }: { site: Site; step: number }) {
  return <><Toaster /><Dialog open onOpenChange={() => {}} title="Settings">{site.ui(step)}</Dialog></>;
}

describe('every announcement is heard inside an open Dialog', () => {
  test.each(Object.entries(SITES))('%s', async (_name, site) => {
    const r = await render(<InDialog site={site} step={0} />);
    await expect.poll(() => !!document.querySelector('dialog[open]')).toBe(true);
    const sel = site.assertive ? '[data-dk-announcer-assertive]' : '[data-dk-announcer]';
    // Every message said from here on, wherever it was said.
    const heard: string[] = [];
    const watch = new MutationObserver(() => {
      for (const el of document.querySelectorAll<HTMLElement>(sel)) if (el.textContent && $('dialog[open]')?.contains(el)) heard.push(el.textContent);
    });
    watch.observe(document.body, { childList: true, characterData: true, subtree: true });
    try {
      await site.act(async () => { await r.rerender(<InDialog site={site} step={1} />); });
      await expect.poll(() => heard.join(' | '), { timeout: 4000 }).toMatch(site.says);
      const region = [...document.querySelectorAll<HTMLElement>(sel)].find((el) => $('dialog[open]').contains(el))!;
      expect([region.getAttribute('role'), region.getAttribute('aria-live')]).toEqual(site.assertive ? ['alert', 'assertive'] : ['status', 'polite']);
    } finally {
      watch.disconnect();
    }
  }, 15_000);

  test('every component that calls announce() has a row above', async () => {
    // The component folders, from the generated index (tools/build/registry.mjs builds it from them).
    const index = await commands.readFile('src/generated/components.ts');
    const DIRS = [...index.matchAll(/from "\.\.\/components\/(\w+)"/g)].map((m) => m[1]);
    const covered = new Set(Object.keys(SITES).map((k) => k.split(':')[0]));
    const callers: string[] = [];
    for (const dir of DIRS) {
      let src = '';
      try { src = await commands.readFile(`src/components/${dir}/${dir}.tsx`); } catch { continue; }
      if (/\bannounce\(/.test(src)) callers.push(dir);
    }
    expect(callers.length).toBeGreaterThan(5);
    expect(callers.filter((c) => !covered.has(c))).toEqual([]);
  });
});
