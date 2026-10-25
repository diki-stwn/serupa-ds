import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { Button } from '../Button/Button';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { Divider } from '../Divider/Divider';
import { Input } from '../Input/Input';
import { Menu, MenuItem } from '../Menu/Menu';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { Toolbar } from './Toolbar';

const el = (id: string) => document.getElementById(id) as HTMLElement;
const focused = () => document.activeElement && document.activeElement.id;
const stops = (id: string) => [...el(id).querySelectorAll<HTMLElement>('button, input')].map((b) => b.id + ':' + b.tabIndex).join();

function Format({ id = 'tb', ...props }: Partial<React.ComponentProps<typeof Toolbar>>) {
  return (
    <>
      <button id="before">Before</button>
      <Toolbar id={id} aria-label="Text formatting" {...props}>
        <ButtonGroup aria-label="Style">
          <ToggleButton id="b" icon="format_bold" aria-label="Bold" />
          <ToggleButton id="i" icon="format_italic" aria-label="Italic" />
        </ButtonGroup>
        <Divider orientation="vertical" />
        <Button id="off" variant="ghost" disabled>Off</Button>
        <Button id="link" variant="ghost">Link</Button>
      </Toolbar>
      <button id="after">After</button>
    </>
  );
}

describe('Toolbar', () => {
  test('a role="toolbar" named by aria-label, horizontal by default; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<Toolbar id="x" ref={ref} aria-label="Tools" className="extra" data-x="y"><Button>One</Button></Toolbar>);
    const e = el('x');
    expect([e.tagName, page.getByRole('toolbar', { name: 'Tools' }).element() === e, e.getAttribute('aria-orientation'), ref.current === e, e.className, e.dataset.x, e.dataset.component, e.dataset.orientation])
      .toEqual(['DIV', true, 'horizontal', true, 'dk-toolbar extra', 'y', 'toolbar', 'horizontal']);
  });

  test('one Tab stop: the first control; Tab goes in and straight out again', async () => {
    await render(<Format />);
    expect(stops('tb')).toBe('b:0,i:-1,off:-1,link:-1');
    el('before').focus();
    await userEvent.tab();
    expect(focused()).toBe('b');
    await userEvent.tab();
    expect(focused()).toBe('after');
  });

  test('Right and Left move focus, skipping a disabled control, and wrap at the ends; Home and End go to the first and last', async () => {
    await render(<Format />);
    el('b').focus();
    const seen: (string | null)[] = [];
    for (const k of ['{ArrowRight}', '{ArrowRight}', '{ArrowRight}', '{ArrowLeft}', '{End}', '{Home}', '{ArrowLeft}']) { await userEvent.keyboard(k); seen.push(focused()); }
    expect(seen).toEqual(['i', 'link', 'b', 'link', 'link', 'b', 'link']);
    expect(stops('tb')).toBe('b:-1,i:-1,off:-1,link:0');
  });

  test('coming back with Shift+Tab or Tab lands on the control used last', async () => {
    await render(<Format />);
    el('b').focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect(focused()).toBe('after');
    await userEvent.tab({ shift: true });
    expect(focused()).toBe('i');
    await userEvent.click(el('link'));
    expect(stops('tb')).toBe('b:-1,i:-1,off:-1,link:0');
  });

  test('vertical: aria-orientation, a column; Down and Up move focus and Right and Left don\'t', async () => {
    await render(<Format orientation="vertical" />);
    expect([el('tb').getAttribute('aria-orientation'), css(el('tb')).flexDirection]).toEqual(['vertical', 'column']);
    el('b').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('b');
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('i');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(focused()).toBe('link');
  });

  test('right to left: ArrowLeft goes to the next control', async () => {
    await render(<div dir="rtl"><Format /></div>);
    el('b').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('i');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('b');
  });

  test('in a text field the arrows, Home and End stay the field\'s; a control added later joins the order out of the Tab order', async () => {
    function Grow() {
      const [more, setMore] = React.useState(false);
      return <Toolbar id="tf" aria-label="Find"><Input id="q" aria-label="Find" defaultValue="abc" /><Button id="go" onClick={() => setMore(true)}>Go</Button>{more && <Button id="next">Next</Button>}</Toolbar>;
    }
    await render(<Grow />);
    const q = el('q') as HTMLInputElement;
    q.focus();
    q.setSelectionRange(3, 3);
    await userEvent.keyboard('{ArrowLeft}{Home}');
    expect([focused(), q.selectionStart]).toEqual(['q', 0]);
    await userEvent.click(el('go'));
    await expect.poll(() => el('next') && el('next').tabIndex).toBe(-1);
    el('go').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('next');
  });

  test('a Menu inside: its items aren\'t toolbar controls, and the Menu keeps its own arrow keys', async () => {
    await render(<Toolbar id="tm" aria-label="Edit"><Button id="cut">Cut</Button>
      <Menu trigger={<Button id="more">More</Button>}><MenuItem id="m1">One</MenuItem><MenuItem id="m2">Two</MenuItem></Menu></Toolbar>);
    expect(stops('tm')).toBe('cut:0,more:-1');
    el('more').focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => focused()).toBe('m1');
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('m2');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => focused()).toBe('more');
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('cut');
  });

  test('your onKeyDown runs first: preventDefault() keeps the toolbar from moving focus', async () => {
    await render(<Format onKeyDown={(e) => { if (e.key === 'ArrowRight') e.preventDefault(); }} />);
    el('b').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('b');
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('link');
  });

  test('layout: controls 4px apart inside 4px of padding, centered in a wrapping row', async () => {
    await render(<Format />);
    const s = css(el('tb'));
    expect([s.display, s.flexWrap, s.alignItems, s.columnGap, s.paddingTop, s.borderTopLeftRadius]).toEqual(['flex', 'wrap', 'center', '4px', '4px', '6px']);
  });

  test('its text reads 4.5:1 on its background in all six themes', async () => {
    await render(<Toolbar id="c" aria-label="Status">Text</Toolbar>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(el('c')).color, css(el('c')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });
});
