// Anatomy diagrams (128): a component's parts, numbered on the live component. The parts come from its README's
// "## Anatomy" section, a numbered list of `**Name** (`.selector`): what it is`, so the picture and the words come
// from one place and tools/test/anatomy.mjs can check that every part is in the story it's drawn on.
//   ## Anatomy
//
//   Drawn from the `Confirmation` story.        (", opened." after it: the diagram opens the story's menu or popover)
//
//   1. **Panel** (`.dk-dialog__panel`): the box over the dimmed page.
import * as React from 'react';
import { DocsContext, Story } from '@storybook/addon-docs/blocks';

export type AnatomyPart = { n: number; name: string; selector: string };
export type Anatomy = { story?: string; opened?: boolean; parts: AnatomyPart[] };

/** The parts and the story an "## Anatomy" section names. */
export function parseAnatomy(section: string): Anatomy {
  const drawn = /^Drawn from the `(\w+)` story(, opened)?\./m.exec(section);
  const parts = [...section.matchAll(/^(\d+)\. \*\*(.+?)\*\* \(`([^`]+)`\)/gm)].map((m) => ({ n: Number(m[1]), name: m[2], selector: m[3] }));
  return { story: drawn?.[1], opened: !!drawn?.[2], parts };
}

// export name → the story id's last part, as Storybook makes it (FullScreen → full-screen, WithRTL → with-rtl)
const idPart = (exportName: string) => exportName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();

type Box = { n: number; x: number; y: number; w: number; h: number };

/** Where an element is drawn: its own box, or the boxes of what's in it when it has no size of its own (a mark that
 * only places its label), or nothing when it isn't drawn. */
function drawnBox(e: Element): { left: number; top: number; right: number; bottom: number } | null {
  const own = e.getBoundingClientRect();
  if (own.width > 0 && own.height > 0) return own;
  const rs = [...e.querySelectorAll('*')].map((x) => x.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rs.length) return null;
  return { left: Math.min(...rs.map((r) => r.left)), top: Math.min(...rs.map((r) => r.top)), right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) };
}

/** The story with each part outlined and numbered. An overlay (a dialog, a popover) is drawn from a still copy of it
 * set open in the page's flow, under the story, so its parts can be pointed at without opening anything. */
export function AnatomyDiagram({ parts, story, opened }: Anatomy) {
  const ctx = React.useContext(DocsContext);
  const stories = ctx.componentStories();
  const chosen = (story && stories.find((s) => s.id.endsWith('--' + idPart(story)))) || stories[0];
  const stage = React.useRef<HTMLDivElement>(null);
  const frozen = React.useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = React.useState<Box[]>([]);
  // A picture: the list under it names each part. The stage turns inert once the story has had a moment to open
  // what it opens on arrival, so the copies above can be taken first.
  const [still, setStill] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setStill(true), 800); return () => clearTimeout(t); }, []);
  React.useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let frame = 0;
    // Still copies of the story's overlays, open and in flow, without ids (the story keeps its own). Each is copied
    // the first time it's there with content: a menu or popover a story opens on arrival may close once the stage
    // turns inert.
    const copied = new WeakSet<Element>();
    const freeze = () => {
      const box = frozen.current;
      if (!box) return;
      for (const o of el.querySelectorAll<HTMLElement>('dialog, [popover]')) {
        if (box.contains(o) || copied.has(o) || !o.childElementCount) continue;
        copied.add(o);
        const c = o.cloneNode(true) as HTMLElement;
        c.removeAttribute('popover');
        c.removeAttribute('hidden');
        for (const k of ['left', 'top', 'right', 'bottom', 'inset', 'position-anchor']) c.style.removeProperty(k);   // where it was placed
        if (c.dataset.state === 'closed') c.dataset.state = 'open';
        for (const x of [c, ...c.querySelectorAll('[id]')]) x.removeAttribute('id');
        if (c instanceof HTMLDialogElement) c.setAttribute('open', '');
        box.append(c);
      }
    };
    // "opened": a menu or popover that only has content while open is opened once the story is there, copied, and
    // the page put back as it was (scroll and focus), so reading the page doesn't jump to it.
    let open: ReturnType<typeof setTimeout> | undefined;
    const openOnce = () => {
      const trigger = opened && open === undefined ? el.querySelector<HTMLElement>('[aria-haspopup][aria-expanded="false"]') : null;
      if (!trigger) return;
      const { scrollX, scrollY } = window, had = document.activeElement as HTMLElement | null;
      trigger.click();
      open = setTimeout(() => {
        freeze();
        if (trigger.getAttribute('aria-expanded') === 'true') trigger.click();   // closed again: the copy stays
        window.scrollTo(scrollX, scrollY);
        had?.focus?.({ preventScroll: true });
        measure();
      }, 150);
    };
    const measure = () => {
      freeze();
      openOnce();
      const o = el.getBoundingClientRect();
      const found: Box[] = [];
      for (const p of parts) {
        // The first one that is drawn: a part can be in the markup more than once (one per item), or hidden in one.
        const hit = [...(frozen.current?.querySelectorAll(p.selector) || []), ...el.querySelectorAll(p.selector)].map(drawnBox).find(Boolean);
        if (hit) found.push({ n: p.n, x: hit.left - o.left, y: hit.top - o.top, w: hit.right - hit.left, h: hit.bottom - hit.top });
      }
      setBoxes((was) => (JSON.stringify(was) === JSON.stringify(found) ? was : found));
    };
    const later = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const ro = new ResizeObserver(later);
    ro.observe(el);
    const mo = new MutationObserver(later);
    mo.observe(el, { subtree: true, childList: true, attributes: true });
    const t = setTimeout(measure, 300);   // after the story's fonts and its own first layout
    later();
    return () => { ro.disconnect(); mo.disconnect(); cancelAnimationFrame(frame); clearTimeout(t); clearTimeout(open); };
  }, [parts, chosen?.id, opened]);
  if (!chosen) return null;
  return <figure className="sb-anatomy sb-unstyled" role="img" aria-label={`Anatomy: ${parts.length} parts, numbered as in the list that follows`}>
    <div className="sb-anatomy__stage" ref={stage} inert={still} aria-hidden="true">
      <Story of={chosen.moduleExport} />
      <div className="sb-anatomy__frozen" ref={frozen} />
      {boxes.map((b) => <React.Fragment key={b.n}>
        <span className="sb-anatomy__box" style={{ transform: `translate(${b.x}px, ${b.y}px)`, width: b.w, height: b.h }} />
        <span className="sb-anatomy__n" style={{ transform: `translate(${b.x - 10}px, ${b.y - 10}px)` }}>{b.n}</span>
      </React.Fragment>)}
    </div>
  </figure>;
}
