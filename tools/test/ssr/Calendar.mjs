// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
// Dates, not strings (the props take Date), and a pinned month, so the case renders the same day whatever the clock says.
export default ({ h, D }) => ({
    Calendar: h(D.Calendar, { defaultValue: new Date(2026, 9, 18), defaultMonth: new Date(2026, 9, 1), locale: 'en-GB' }),
});
