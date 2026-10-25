// Renders every story to HTML in Node, as a server would, in modules of their own (L2): the browser test
// (src/internal/hydrateStories.test.tsx) then hydrates HTML that no module state on its page produced, and must
// agree with it the way a real page must agree with its server.
// SERUPA_UPDATE_SERVER_HTML=1 also writes that HTML as the baselines in tools/test/baseline-server/ (E4), which
// src/internal/serverHtml.test.tsx compares it with: npm run test:server-html:update.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import type { TestProject } from 'vitest/node';
import { CLOCK } from '../lib.mjs';

export default async function setup(project: TestProject) {
  const server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', appType: 'custom',
    server: { middlewareMode: true, hmr: false }, define: project.vite.config.define, oxc: { jsx: { runtime: 'automatic' } } });
  // The same moment as the browser's (setup.ts), so a story that shows today shows the same day on both sides. It
  // stands still, so the baselines' times (RelativeTime's dateTime, say) are the same on every run.
  const RealDate = Date, now = new RealDate(CLOCK).getTime();
  const FixedDate = function (this: unknown, ...a: unknown[]) {
    if (!new.target) return new RealDate(now).toString();
    return Reflect.construct(RealDate, a.length ? a : [now], new.target) as Date;
  } as unknown as DateConstructor;
  FixedDate.prototype = RealDate.prototype;
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.now = () => now;
  globalThis.Date = FixedDate;
  try {
    const mod = await server.ssrLoadModule('/tools/test/vitest/stories.tsx');
    const html = mod.renderAll();
    project.provide('serverStories', html);
    if (process.env.SERUPA_UPDATE_SERVER_HTML) {
      const dir = path.join(process.cwd(), 'tools/test/baseline-server');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      for (const [name] of mod.stories) fs.writeFileSync(path.join(dir, name + '.html'), mod.serverBaseline(name, html));
      console.log(`Wrote ${mod.stories.length} server HTML baselines to tools/test/baseline-server/`);
    }
  } finally {
    globalThis.Date = RealDate;
    await server.close();
  }
}
