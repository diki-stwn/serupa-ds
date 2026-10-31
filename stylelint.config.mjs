// Stylelint: the recommended rules for all the CSS, and for the components the system's own conventions
// (tools/lint/stylelint-serupa.mjs) and logical properties, so they work in right-to-left text.
/** @type {import('stylelint').Config} */
export default {
  extends: 'stylelint-config-recommended',
  plugins: ['./tools/lint/stylelint-serupa.mjs'],
  ignoreFiles: ['dist/**', 'storybook-static/**', 'node_modules/**', 'tokens.css', 'src/styles/utilities.template.css'],
  rules: {
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'property-no-deprecated': [true, { ignoreProperties: ['-webkit-box-orient'] }],
    'declaration-property-value-no-unknown': [true, { ignoreProperties: { 'mix-blend-mode': ['plus-darker'], 'justify-content': ['baseline'] } }],
  },
  overrides: [
    {
      files: ['src/components/**/*.css'],
      rules: {
        'serupa/component-layer': true,
        'serupa/no-raw-value': true,
        'serupa/color-through-component-token': true,
        'serupa/focus-ring-outline': true,
        'serupa/no-physical-shorthand': true,
        // Selectors that reach into another block's elements today: the Input-based fields style .dk-input__field,
        // AvatarGroup .dk-avatar__frame, DateRangePicker the calendar's arrows, Image the dialog's body. Each goes
        // when Input, Avatar, Calendar and Dialog get the component token or modifier it needs (SG2 follow-ups).
        'serupa/own-block': [true, { known: { Combobox: ['dk-input'], NumberInput: ['dk-input'], PasswordInput: ['dk-input'], SearchInput: ['dk-input'], AvatarGroup: ['dk-avatar'], DateRangePicker: ['dk-calendar'], Image: ['dk-dialog'] } }],
        // BEM-style names: dk-block, dk-block__element, dk-block--modifier (and dk-block__element--modifier).
        'selector-class-pattern': ['^dk-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$', { resolveNestedSelectors: true, message: (c) => `"${c}" isn't a Serupa class name: dk-block, dk-block__element or dk-block--modifier, lowercase with hyphens` }],
        'property-disallowed-list': [
          ['left', 'right', '/^margin-(left|right)$/', '/^padding-(left|right)$/', '/^border-(left|right)(-|$)/', '/^border-(top|bottom)-(left|right)-radius$/', '/^scroll-(margin|padding)-(left|right)$/'],
          { message: 'Use the logical property (inset-inline-*, margin-inline-*, padding-inline-*, border-inline-*, border-*-start/end-radius), so the component works in right-to-left text.' },
        ],
        'declaration-property-value-disallowed-list': [
          { float: ['/^(left|right)$/'], clear: ['/^(left|right)$/'], 'text-align': ['/^(left|right)$/'] },
          { message: 'Use inline-start or inline-end (start or end for text-align), so the component works in right-to-left text.' },
        ],
      },
    },
    {
      // Status and palette tones use fixed palette steps, checked for contrast in tools/test/badge.mjs, and the
      // state layer is black or white.
      files: ['src/components/Badge/Badge.css'],
      rules: { 'serupa/color-through-component-token': [true, { allowPalette: true }] },
    },
  ],
};
