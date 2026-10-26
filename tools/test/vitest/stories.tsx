/// <reference types="vite/client" />
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { inject } from 'vitest';

// Every story file, and each story as Storybook draws it, for the hydration check (F3): the browser test hydrates
// what serverStories.ts renders in Node.
type Args = Record<string, unknown>;
type Ctx = { args: Args; globals: Args; parameters: Args; viewMode: 'story' };
type Decorator = (Story: React.ComponentType, ctx: Ctx) => React.ReactNode;
type Story = { args?: Args; render?: (args: Args, ctx: Ctx) => React.ReactNode; decorators?: Decorator[]; tags?: string[] };
type Meta = Story & { component?: React.ComponentType<Args>; title?: string };

// ErrorBoundary's stories throw on purpose to show the fallback, and React's server render has no error boundaries:
// the throw ends renderToString, so there is no server HTML to hydrate.
// tools/test/run.mjs leaves the story-wide tests out of a pull request's run that covers only these.
const SKIP = new Set(['ErrorBoundary']);
const files = import.meta.glob<Record<string, Meta | Story>>('../../../src/components/*/*.stories.tsx', { eager: true });

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

// Component name, then each story's export name and element.
export const stories: Array<[string, Array<[string, React.ReactElement]>]> = Object.entries(files)
  .map(([file, mod]) => [file.split('/').at(-2)!, mod] as const)
  .filter(([name]) => !SKIP.has(name))
  .map(([name, mod]) => [name, Object.entries(mod)
    .filter(([exportName, story]) => exportName !== 'default' && !!story && typeof story === 'object')
    .map(([exportName, story]) => [exportName, storyElement((mod.default || {}) as Meta, story)] as [string, React.ReactElement])]);

// The components a pull request's run covers (SERUPA_ONLY, set by run.mjs --since), or every one on a full run.
export function storiesToRun(): typeof stories {
  const only = inject('only');
  return only === null ? stories : stories.filter(([n]) => only.split(',').includes(n));
}

// Every story's server HTML by "<Component>/<Story>", or "Error: …" when the server render throws.
export function renderAll(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, list] of stories) for (const [exportName, ui] of list) {
    try { out[`${name}/${exportName}`] = renderToString(ui); } catch (e) { out[`${name}/${exportName}`] = 'Error: ' + String((e as Error)?.message ?? e); }
  }
  return out;
}

// A component's stories' server HTML as its baseline file (tools/test/baseline-server/<Component>.html, E4): each
// story under a comment with its name, sorted by name (Node and the browser list a module's exports in different
// orders), one tag per line so a change reads as a diff of a few lines.
export function serverBaseline(name: string, html: Record<string, string>): string {
  const list = (stories.find(([n]) => n === name)?.[1] || []).map(([n]) => n).sort();
  return list.map((exportName) => `<!-- ${exportName} -->\n${(html[`${name}/${exportName}`] ?? '').replace(/></g, '>\n<')}\n`).join('\n');
}

// What serverStories.ts hands the browser tests (inject('serverStories')).
declare module 'vitest' {
  export interface ProvidedContext { serverStories: Record<string, string>; only: string | null }
}
