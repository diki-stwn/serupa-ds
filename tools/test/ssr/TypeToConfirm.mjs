// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  TypeToConfirm: h(D.TypeToConfirm, { phrase: 'acme/web', confirmLabel: 'Delete this repository', onConfirm: () => {} }),
});
