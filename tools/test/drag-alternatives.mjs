// Dragging movements (66, WCAG 2.5.7): whatever a component lets people do by dragging, a single pointer must also
// do without one (a press, a tap on a button), because some people can't hold a press while they move. Every
// component whose source listens for a pointer or touch move, or a drag, is listed in DRAGS with what the drag does
// and the test (file and part of its title) that shows a press doing the same. A new one fails until it's listed.
// What has no such alternative yet is in KNOWN, under the queue item that adds it; a KNOWN line whose component no
// longer drags, or a listed test that's gone, fails too.
//   node tools/test/drag-alternatives.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, done, report } from './lib.mjs';

const MOVES = /\bpointermove\b|\bonPointerMove\b|\btouchmove\b|\bonTouchMove\b|\bonDrag(Start|Over|Enter)?\b|\bdragover\b/;

const DRAGS = {
  Slider: { drag: 'drag a thumb along the track', press: ['Slider.test.tsx', 'a press on the track jumps there'] },
  Carousel: { drag: 'swipe to the next or previous slide', press: ['Carousel.test.tsx', 'next moves one slide at a time'] },
  Drawer: { drag: 'swipe it toward its edge to close', press: ['Drawer.test.tsx', 'the ×, Escape and the browser close it'] },
  FileUpload: { drag: 'drag files onto the area', press: ['FileUpload.test.tsx', 'the button opens the file picker'] },
  SortableList: { drag: 'drag a row by its handle', press: ['SortableList.test.tsx', 'a press without moving picks the row up'] },
};
// Moves that aren't a drag: nothing is held down while the pointer moves.
const NOT_DRAG = {
  Menu: 'onPointerMove only moves focus to the item under the pointer, as hover does',
};
const KNOWN = {
  Splitter: ['FG1: the panes resize only by dragging the handle (or by keyboard); a double-click only collapses, with collapsible'],
};

const dir = path.join(PROJECT, 'src', 'components');
const dragging = fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isDirectory()).filter((n) =>
  fs.readdirSync(path.join(dir, n)).some((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) && MOVES.test(fs.readFileSync(path.join(dir, n, f), 'utf8'))));

const results = [{ name: `found the components that drag (${dragging.length})`, ok: dragging.length >= 6, detail: `only ${dragging.join(', ')}` }];
for (const n of dragging) {
  const what = DRAGS[n] ? `${DRAGS[n].drag}, or press instead` : NOT_DRAG[n] ? 'not a drag' : KNOWN[n] ? `no single-pointer way yet (${KNOWN[n][0].split(':')[0]})` : null;
  results.push({ name: `${n}: what it does by dragging is listed: ${what || 'not listed'}`, ok: !!what,
    detail: 'add it to DRAGS in tools/test/drag-alternatives.mjs with a test of the press that does the same, or to KNOWN under a queue item' });
}
for (const [n, { press: [file, title] }] of Object.entries(DRAGS)) {
  const f = path.join(dir, n, file);
  const ok = fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes(title);
  results.push({ name: `${n}: a test shows a press doing what the drag does ("${title}")`, ok, detail: `no test in src/components/${n}/${file} has "${title}" in its title` });
}
for (const n of [...Object.keys(DRAGS), ...Object.keys(NOT_DRAG), ...Object.keys(KNOWN)]) {
  if (!dragging.includes(n)) results.push({ name: `${n}: still drags`, ok: false, detail: 'it no longer listens for a move; take its line out' });
}
done(report('Dragging alternatives', results));
