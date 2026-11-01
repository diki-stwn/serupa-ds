// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
// On the server it draws the first 20 rows, with padding below for the rest.
export default ({ h, D }) => ({
  VirtualList: h(D.VirtualList, { 'aria-label': 'Rows', count: 1000, renderItem: (i) => h(D.ListItem, { title: 'Row ' + (i + 1) }) }),
});
