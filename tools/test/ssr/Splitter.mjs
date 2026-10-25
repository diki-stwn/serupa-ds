// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  Splitter: h(D.Splitter, { separatorLabel: 'Folders', defaultSize: 30 }, h('nav', null, 'Folders'), h('main', null, 'Messages')),
});
