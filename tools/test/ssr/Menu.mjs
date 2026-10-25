// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
    Menu: h(D.Menu, { trigger: h(D.Button, null, 'Actions') }, h(D.MenuGroup, { label: 'File' }, h(D.MenuItem, null, 'Rename')), h(D.MenuSeparator), h(D.MenuItem, null, 'Delete')),
    ContextMenu: h(D.ContextMenu, { 'aria-label': 'File actions', target: h('div', { tabIndex: 0 }, 'Report.pdf') }, h(D.MenuItem, null, 'Open')),
    MenuCheckboxItem: h(D.Menu, { open: true, trigger: h(D.Button, null, 'View') }, h(D.MenuCheckboxItem, { checked: true }, 'Grid'),
      h(D.MenuRadioGroup, { label: 'Sort by', value: 'name' }, h(D.MenuRadioItem, { value: 'name' }, 'Name'), h(D.MenuRadioItem, { value: 'date' }, 'Date'))),
    MenuSub: h(D.Menu, { open: true, trigger: h(D.Button, null, 'File') }, h(D.MenuSub, { label: 'Share' }, h(D.MenuItem, null, 'Email'))),
});
