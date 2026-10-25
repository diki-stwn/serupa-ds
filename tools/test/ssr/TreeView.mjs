// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  TreeView: h(D.TreeView, { 'aria-label': 'Files', items: [{ id: 'src', label: 'src', children: [{ id: 'index', label: 'index.ts' }] }, { id: 'readme', label: 'README.md' }], defaultExpanded: ['src'], defaultValue: ['index'] }),
});
