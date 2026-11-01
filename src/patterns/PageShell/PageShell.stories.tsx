import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Navbar, NavbarLink } from '../../components/Navbar/Navbar';
import { Sidebar, SidebarItem, SidebarSection } from '../../components/Sidebar/Sidebar';
import { Button } from '../../components/Button/Button';
import { Avatar } from '../../components/Avatar/Avatar';
import { Heading } from '../../components/Heading/Heading';
import { SkipLink } from '../../components/SkipLink/SkipLink';

/* Patterns are whole screens built from the components, for apps to copy (FEC1). Unlike a component's stories they
   are pages, so tools/test/storybook.mjs also runs the page rules on them: one main landmark, everything inside a
   landmark, two landmarks of a kind told apart by their names, an h1 and no skipped heading level, no id twice.
   It also checks that the first Tab stop is a skip link, and that following it puts focus in main, below the sticky
   Navbar. */
const meta = {
  title: 'Patterns/Page shell',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = ['Website redesign', 'Mobile app', 'Billing migration', 'Design tokens v2', 'Onboarding emails', 'Status page', 'Help centre', 'Pricing page', 'Search', 'Invoices', 'Team settings', 'Audit log'];

/* The page shell: a skip link first, a sticky Navbar (the banner), a Sidebar beside main, and a footer. The Navbar
   and the Sidebar are both navigation landmarks, so the Sidebar gets its own name ("Workspace"), told apart from the
   Navbar's "Main navigation". main takes the SkipLink's focus, and the Navbar's scroll-padding keeps
   it below the bar. */
export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-surface text-text">
      {/* The Sidebar stays beside main and below the bar while the page scrolls, and gives its room to main on a phone,
          where the Navbar's menu has the same links. */}
      <style>{'.page-shell__side { position: sticky; top: var(--dk-navbar-offset, 0px); height: calc(100vh - var(--dk-navbar-offset, 0px)); } @media (max-width: 40rem) { .page-shell__side { display: none; } }'}</style>
      <SkipLink />
      <Navbar sticky
        brand={<a href="#" className="text-base font-semibold text-text no-underline">Acme</a>}
        actions={<><Button variant="ghost" size="sm">Docs</Button><Avatar name="Ada Lovelace" size="sm" /></>}>
        <NavbarLink href="#" active>Dashboard</NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
        <NavbarLink href="#">Reports</NavbarLink>
      </Navbar>
      <div className="flex">
        <div className="page-shell__side">
          <Sidebar aria-label="Workspace">
            <SidebarSection>
              <SidebarItem href="#" icon="home" label="Home" active />
              <SidebarItem href="#" icon="folder" label="Projects" />
              <SidebarItem href="#" icon="group" label="Team" />
            </SidebarSection>
          </Sidebar>
        </div>
        <main id="main" className="min-w-0 flex-1 p-6 outline-none">
          <Heading level={1}>Projects</Heading>
          <p className="mt-2 text-sm text-text-muted">Twelve active projects in the Acme workspace.</p>
          <section aria-labelledby="recent" className="mt-6">
            <Heading level={2} id="recent">Recent</Heading>
            <ul className="mt-3 flex flex-col gap-3">
              {rows.map((r) => <li key={r} className="rounded-md border border-border p-4">{r}</li>)}
            </ul>
          </section>
        </main>
      </div>
      <footer className="border-t border-border p-6 text-sm text-text-muted">© 2026 Acme</footer>
    </div>
  ),
};
