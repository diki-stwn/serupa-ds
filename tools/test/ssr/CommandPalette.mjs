// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  CommandPalette: h(D.CommandPalette, { open: true, onOpenChange() {}, commands: [{ id: 'home', label: 'Home', group: 'Pages' }, { id: 'new', label: 'New project', shortcut: ['mod', 'N'] }] }),
});
