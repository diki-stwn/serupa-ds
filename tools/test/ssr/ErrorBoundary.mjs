// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
// On the server a boundary renders its children (React doesn't run boundaries there).
export default ({ h, D }) => ({
    ErrorBoundary: h(D.ErrorBoundary, null, h(D.Badge, null, 'Guarded content')),
});
