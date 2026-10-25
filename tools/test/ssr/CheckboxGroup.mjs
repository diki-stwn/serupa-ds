// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
    CheckboxGroup: h(D.CheckboxGroup, { defaultValue: ['a'], 'aria-label': 'Tags', name: 'tags' }, h(D.Checkbox, { selectAll: true }, 'All'), h(D.Checkbox, { value: 'a' }, 'A'), h(D.Checkbox, { value: 'b' }, 'B')),
});
