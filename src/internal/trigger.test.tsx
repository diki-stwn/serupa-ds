// The trigger contract (G9): Popover, Menu, ContextMenu and Tooltip need one element they can add a ref and handlers
// to, and say so by name when they get something else.
import * as React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Button } from '../components/Button/Button';
import { ContextMenu, Menu, MenuItem } from '../components/Menu/Menu';
import { Popover } from '../components/Popover/Popover';
import { Tooltip } from '../components/Tooltip/Tooltip';

type Make = (trigger: unknown) => React.ReactElement;
const WHO: Array<[string, string, Make]> = [
  ['Popover', 'trigger', (t) => <Popover trigger={t as React.ReactElement} aria-label="Filters">Body</Popover>],
  ['Menu', 'trigger', (t) => <Menu trigger={t as React.ReactElement}><MenuItem>Edit</MenuItem></Menu>],
  ['ContextMenu', 'target', (t) => <ContextMenu target={t as React.ReactElement} aria-label="File actions"><MenuItem>Edit</MenuItem></ContextMenu>],
  ['Tooltip', 'child', (t) => <Tooltip content="Saves the draft">{t as React.ReactElement}</Tooltip>],
];

// A trigger component that takes props but doesn't pass its ref on.
function Plain({ ref: _ref, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) { return <button type="button" {...props} />; }

afterEach(() => { vi.restoreAllMocks(); });

describe.each(WHO)('%s', (who, where, make) => {
  test('a text, several elements or a Fragment as the trigger is a clear error naming the component', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const bad of ['Open', [<b key="a">A</b>, <b key="b">B</b>], <><Button>Open</Button></>]) {
      let message = '';
      class Catch extends React.Component<{ children: React.ReactNode }, { e: string }> {
        override state = { e: '' };
        static getDerivedStateFromError(e: Error) { return { e: e.message }; }
        override render() { message = this.state.e; return this.state.e ? null : this.props.children; }
      }
      await render(<Catch>{make(bad)}</Catch>);
      await expect.poll(() => message).toBe(`Serupa: ${who} needs one element as its ${where}, such as <Button> (not a text, a list or a Fragment).`);
    }
  });

  test('a trigger that doesn\'t forward its ref warns once, naming the component; a Button doesn\'t', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(make(<Button>Open</Button>));
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('trigger doesn\'t forward its ref'))).toEqual([]);
    await render(<>{make(<Plain>Open</Plain>)}{make(<Plain>Again</Plain>)}</>);
    const said = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('trigger doesn\'t forward its ref'));
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(new RegExp(`^Serupa: ${who}'s trigger doesn't forward its ref to an element`));
  });
});
