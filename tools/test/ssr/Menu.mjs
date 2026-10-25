// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
    Menu: h(D.Menu, { trigger: h(D.Button, null, 'Actions') }, h(D.MenuGroup, { label: 'File' }, h(D.MenuItem, null, 'Rename')), h(D.MenuSeparator), h(D.MenuItem, null, 'Delete')),
    MenuSub: h(D.Menu, { open: true, trigger: h(D.Button, null, 'File') }, h(D.MenuSub, { label: 'Share' }, h(D.MenuItem, null, 'Email'))),
});
