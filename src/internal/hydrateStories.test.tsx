/// <reference types="vite/client" />
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { describe, expect, test } from 'vitest';

// Every story is rendered to HTML as a server would, then hydrated: React must find the same markup, with no
// mismatch and no recoverable error (F3). A mismatch makes React throw the server HTML away and render again in the
// browser, so a server-rendered page flashes and loses what people typed before hydration.
type Args = Record<string, unknown>;
type Ctx = { args: Args; globals: Args; parameters: Args; viewMode: 'story' };
type Decorator = (Story: React.ComponentType, ctx: Ctx) => React.ReactNode;
type Story = { args?: Args; render?: (args: Args, ctx: Ctx) => React.ReactNode; decorators?: Decorator[]; tags?: string[] };
type Meta = Story & { component?: React.ComponentType<Args>; title?: string };

// ErrorBoundary's stories throw on purpose to show the fallback, and React's server render has no error boundaries:
// the throw ends renderToString, so there is no server HTML to hydrate.
const SKIP = new Set(['ErrorBoundary']);
const files = import.meta.glob<Record<string, Meta | Story>>('../components/*/*.stories.tsx', { eager: true });

// The story as Storybook draws it: its args over the file's, its render (or the component), inside its decorators
// and then the file's.
function storyElement(meta: Meta, story: Story): React.ReactElement {
  const args = { ...meta.args, ...story.args };
  const ctx: Ctx = { args, globals: {}, parameters: {}, viewMode: 'story' };
  const render = story.render || meta.render;
  const Component = meta.component;
  let Inner: React.ComponentType = () => (render ? render(args, ctx) : Component ? <Component {...args} /> : null);
  for (const d of [...(story.decorators || []), ...(meta.decorators || [])]) {
    const Wrapped: React.ComponentType = Inner;
    Inner = (): React.ReactNode => d(Wrapped, ctx);
  }
  return <Inner />;
}

async function hydrate(ui: React.ReactElement) {
  const host = document.createElement('div');
  host.innerHTML = renderToString(ui);
  document.body.appendChild(host);
  const errors: string[] = [], logError = console.error;
  console.error = (...a: unknown[]) => { errors.push(a.map(String).join(' ')); };
  let root: Root | undefined;
  try {
    flushSync(() => { root = hydrateRoot(host, ui, { onRecoverableError: (e) => errors.push(String(e)) }); });
    await new Promise((r) => setTimeout(r, 20));
  } finally {
    console.error = logError;
    root?.unmount();
    host.remove();
  }
  return errors;
}

for (const [file, mod] of Object.entries(files)) {
  const meta = (mod.default || {}) as Meta;
  const name = file.split('/')[2];
  if (SKIP.has(name)) continue;
  describe(`${name} stories hydrate`, () => {
    for (const [exportName, story] of Object.entries(mod)) {
      if (exportName === 'default' || !story || typeof story !== 'object') continue;
      test(`${exportName}`, async () => {
        expect(await hydrate(storyElement(meta, story))).toEqual([]);
      });
    }
  });
}
