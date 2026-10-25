// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  Toolbar: h(D.Toolbar, { 'aria-label': 'Text formatting' }, h(D.ToggleButton, { icon: 'format_bold', 'aria-label': 'Bold' }), h(D.Button, { variant: 'ghost' }, 'Clear')),
});
