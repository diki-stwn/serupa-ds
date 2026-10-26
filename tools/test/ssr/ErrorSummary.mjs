// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  ErrorSummary: h(D.ErrorSummary, { errors: [{ field: 'email', message: 'Enter your email address' }] }),
});
