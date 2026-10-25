// Renders every story to HTML in Node, as a server would, in modules of their own (L2): the browser test
// (src/internal/hydrateStories.test.tsx) then hydrates HTML that no module state on its page produced, and must
// agree with it the way a real page must agree with its server.
import { createServer } from 'vite';
import type { TestProject } from 'vitest/node';
import { CLOCK } from '../lib.mjs';

export default async function setup(project: TestProject) {
  const server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', appType: 'custom',
    server: { middlewareMode: true, hmr: false }, define: project.vite.config.define, oxc: { jsx: { runtime: 'automatic' } } });
  // The same moment as the browser's (setup.ts), so a story that shows today shows the same day on both sides.
  const RealDate = Date, shift = new RealDate(CLOCK).getTime() - RealDate.now();
  const FixedDate = function (this: unknown, ...a: unknown[]) {
    if (!new.target) return new RealDate(RealDate.now() + shift).toString();
    return Reflect.construct(RealDate, a.length ? a : [RealDate.now() + shift], new.target) as Date;
  } as unknown as DateConstructor;
  FixedDate.prototype = RealDate.prototype;
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.now = () => RealDate.now() + shift;
  globalThis.Date = FixedDate;
  try {
    const mod = await server.ssrLoadModule('/tools/test/vitest/stories.tsx');
    project.provide('serverStories', mod.renderAll());
  } finally {
    globalThis.Date = RealDate;
    await server.close();
  }
}
