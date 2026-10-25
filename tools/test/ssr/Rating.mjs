// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  Rating: h(D.Rating, { 'aria-label': 'Your rating', defaultValue: 3 }),
  RatingReadOnly: h(D.Rating, { readOnly: true, value: 4.3 }),
});
