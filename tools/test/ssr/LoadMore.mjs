// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  LoadMore: h(D.LoadMore, { onLoadMore: () => {}, count: 20, total: 134 }),
  'LoadMore at the end': h(D.LoadMore, { onLoadMore: () => {}, hasMore: false }),
});
