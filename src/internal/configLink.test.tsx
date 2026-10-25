import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { config, configure } from './config';
import { Link } from '../components/Link/Link';
import { Navbar, NavbarLink } from '../components/Navbar/Navbar';
import { Breadcrumb, BreadcrumbItem } from '../components/Breadcrumb/Breadcrumb';
import { List, ListItem } from '../components/List/List';
import { Pagination } from '../components/Pagination/Pagination';

// configure({ link }) sets the link component once for the app: every component that renders a link uses it, and
// an item's own `as` (Pagination: linkAs) still wins (BL1).
const Marked = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(function Marked(p, r) { return <a {...p} ref={r} data-marked="" />; });
const marked = (sel: string) => [...document.querySelectorAll(sel)].map((a) => a.hasAttribute('data-marked'));

describe('configure({ link })', () => {
  test('Link, NavbarLink, BreadcrumbItem, ListItem and Pagination\'s page links go through it; as still wins', async () => {
    const was = config.link;
    configure({ link: Marked });
    try {
      await render(<div>
        <Link id="l1" href="#a">A</Link><Link id="l2" as="a" href="#b">B</Link>
        <Navbar brand="Acme"><NavbarLink id="n1" href="#n">N</NavbarLink></Navbar>
        <Breadcrumb><BreadcrumbItem id="b1" href="#h">Home</BreadcrumbItem><BreadcrumbItem current>Here</BreadcrumbItem></Breadcrumb>
        <List><ListItem id="i1" href="#i" title="Item" /></List>
        <nav id="pg"><Pagination count={3} page={2} getHref={(n) => '#p' + n} /></nav>
        <nav id="pg2"><Pagination count={3} page={2} getHref={(n) => '#q' + n} linkAs="a" /></nav>
      </div>);
      expect([marked('#l1'), marked('#l2'), marked('#n1'), marked('#b1'), marked('#i1 a, a#i1')].flat()).toEqual([true, false, true, true, true]);
      expect([marked('#pg a[href]').every(Boolean), marked('#pg2 a[href]').some(Boolean)]).toEqual([true, false]);
    } finally { config.link = was; }
  });
});
