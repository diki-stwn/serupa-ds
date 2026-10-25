// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  ToggleGroup: h(D.ToggleGroup, { 'aria-label': 'Text alignment', defaultValue: ['left'] }, h(D.ToggleButton, { value: 'left' }, 'Left'), h(D.ToggleButton, { value: 'right' }, 'Right')),
});
