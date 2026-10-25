// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
// A Date, not a string (the prop takes Date), so the server formats a value into the field.
export default ({ h, D }) => ({
    DatePicker: h(D.DatePicker, { 'aria-label': 'Date', defaultValue: new Date(2026, 9, 18), name: 'date', locale: 'en-GB' }),
});
