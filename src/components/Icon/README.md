# Icon

Shows one icon as an inline SVG: from Material Symbols, always in the **Rounded** style with **Fill** on, or one of your own custom icons. Use it on its own or pass an icon straight to Button's `leftIcon`, `rightIcon` or `icon`.

```jsx
const { Icon, Button } = window.Serupa;

<Icon name="home" />                       // 24px, decorative
<Icon name="warning" size={20} style={{ color: 'var(--warning)' }} />
<Icon name="error" aria-label="Error" />   // meaningful: announced as "Error"
<Button leftIcon="add">New project</Button>
<Button variant="ghost" icon="settings" aria-label="Settings" />
<Icon name="rocket_launch" />              // any of the ~3,800 Material Symbols works by name
```

## When to use

- A symbol next to a label that helps people find it quickly: in buttons, menus, list rows and navigation.
- A status (success, warning, error, info) next to the message it belongs to.
- A large symbol in an empty state or an illustration.

## When not to use

- A button that shows only an icon: use [IconButton](../IconButton/README.md) instead; it requires the label an icon alone doesn't have.
- A photo, a screenshot or any other picture: use [Image](../Image/README.md) instead.
- A person's or team's picture: use [Avatar](../Avatar/README.md) instead.

## Usage

Find icons in the Material Symbols catalog (Rounded style) at fonts.google.com/icons. Names are lowercase with underscores (`arrow_forward`, `more_vert`); the import for a name is the same words in PascalCase (`ArrowForward`, `MoreVert`; a name starting with a digit gets `Icon` in front: `Icon10k`).

- Use Material Symbols Rounded, filled, and custom icons drawn to the same rules. Don't mix in other icon sets or the Outlined/Sharp styles.
- Before drawing a custom icon, check that Material Symbols doesn't already have one for that meaning.
- One icon per meaning across the product: `delete`, not `delete` in one place and `remove` in another.
- **Right to left:** arrows and chevrons that point along the line of reading (`arrow_forward`, `chevron_right`, `send`, `undo`…) flip by themselves in right-to-left text, so `<Button rightIcon="arrow_forward">Next</Button>` points the way an Arabic or Hebrew reader goes. Icons of things (a clock, a check, media controls) don't. Use `mirror` for your own arrows (`true`) or for an icon you already turn yourself (`false`).

### Setup: by name

There's no font to load. Every icon is an SVG drawn in the page, so it shows at once and nothing flashes while a file loads.

- **Every Material Symbol works by name** (`name="category"`, `leftIcon="category"`), about 3,800 of them, with autocomplete in TypeScript. Find one on the Foundations → Icons page in Storybook: search, then click to copy its name. A name loads the first time a page draws it, so it appears a moment later that first time: the icons the components use come from a small file (about 14 KB), and any other name from the full set. Apps that draw no names never download either. Both are dynamic imports, so this needs a bundler that splits them into files of their own, as Vite, Next.js, webpack and Rollup do by default. A build that puts everything in one file (esbuild without `--splitting`, Rollup with `inlineDynamicImports`, a single-chunk webpack or IIFE build) puts the full set in it too, about 2.7 MB (510 KB gzipped). There, draw imported icons (`icon={Close}`) or `registerIcons` the ones you use by name, and keep names out of the bundle's reach.
- **An imported icon works too** (`icon={Category}` with `import { Category } from "serupa-ds/icons"`), the same icon either way. It draws on the first render, and only the icons you import ship in your bundle, so prefer it for icons you know ahead of time.
- **The components' own icons** (Dialog's close, Checkbox's check, Select's chevron) are imported by each component, so they draw at once and on the server, and a bundle keeps only the icons of the components it uses.
- **On a plain page** (`serupa.iife.js`), every name works. `serupa-icons.iife.js` is no longer needed; it's kept, empty, for pages that still include it.
- **Server rendering:** the components' own icons and imported icons (`icon={Close}`) render on the server. A name (`name="close"`, `leftIcon="close"`) shows its empty box until the page loads in the browser. To draw it on the server, pass the imported icon instead, or register what you draw by name once before rendering: `registerIcons(Close, Add)`, or `registerIcons(await import("serupa-ds/icons"))` for every name.
- `registerIcons({ name, d })` adds an icon of your own in Material's shape (`d` on the 960-unit grid) under a name.

A name that isn't a Material Symbol or one of your icons draws an empty 1em box and logs a console warning.

### Custom icons

For what Material Symbols doesn't have, add your own SVG icons. They work everywhere a Material Symbols name does, with the same sizes, colors and accessibility:

```jsx
<Icon name="serupa-sparkle" />
<Button leftIcon="serupa-sparkle">Generate</Button>
```

**Draw** each icon so it sits with Material Symbols Rounded:

- A 24×24 frame (`viewBox="0 0 24 24"`) with about 2px of padding around the shape.
- Filled shapes with rounded corners and ends, like the Rounded style. Outlined (stroke) icons work too, at a 2px stroke.
- One color. The build draws every shape in the text color, so icons follow the theme. Parts that should show the background must be holes (a cut-out path, or `fill-rule="evenodd"`), not white shapes.
- Only shapes: outline text and flatten masks, gradients and effects before exporting. Figma's "Export as SVG" and Illustrator's "Export As SVG" both work.

**Add** them:

1. Put the SVG in `assets/Icons/` (the Icons set on the design system page). The file name is the icon's name: lowercase letters and digits, words joined by `-` or `_`, such as `serupa-sparkle.svg`. A prefix such as `serupa-` keeps your names apart from Material Symbols; a custom icon with the same name as a Material Symbol replaces it everywhere.
2. Run `node tools/icons/build.mjs` (or `node tools/icons/build.mjs path/to/folder`), then `npm run build`. It writes the icons and their names (`CustomIconName`, so TypeScript autocompletes them) into `src/icons.ts`; the build puts them in `dist/`.
3. Run it again after changing or removing a file. `node tools/icons/build.mjs --check` fails if the components are out of step, for CI.

The build keeps only the shapes and removes editor leftovers (ids, classes, sizes, Figma and Illustrator metadata). It refuses a file, with the reason, when it holds anything that could run code or load something (scripts, event handlers, links, images), anything that isn't a plain shape (text, gradients, masks, filters, `<use>`), another grid, or a second color. A refused file stops the build, and the components stay as they were.

`Serupa.customIcons` lists the custom icons' names.

### Sizes

The same for Material Symbols and custom icons.

| Size | Use |
| --- | --- |
| 14px | Inside `sm` buttons |
| 16px | Inside `md` buttons, inline with `text-sm` |
| 20px | Inside `lg` buttons, list rows, inputs |
| 24px | Default: toolbars, navigation, standalone |
| 40px+ | Empty states, illustrations |

Every icon is the 24px design (Material Symbols' optical size 24), scaled.

### Color

Icons take the text color (`currentColor`). Set it with an alias, never a palette color: `text` or `text-muted` for neutral icons, and `success`, `warning`, `danger` or `info` for status icons. Icons that carry meaning need 3:1 contrast against their background.

### Common icons

| Action | Name |
| --- | --- |
| Create / add | `add` |
| Edit | `edit` |
| Delete | `delete` |
| Close | `close` |
| Search | `search` |
| Settings | `settings` |
| More | `more_vert`, `more_horiz` |
| Next / back | `arrow_forward`, `arrow_back` |
| Menu open | `expand_more`, `chevron_right` |
| Success / error / warning / info | `check_circle`, `error`, `warning`, `info` |

## Accessibility

- **Role and name:** icons are decorative by default (`aria-hidden`). Give an icon an `aria-label` only when it's the sole carrier of meaning, such as a status icon without text. With `aria-label` or `aria-labelledby` it becomes `role="img"` with that name.
- **Next to text:** leave it decorative; the text already says what it means.
- **Icon-only buttons:** the button needs the name, not the icon: pass `aria-label` to the Button, or use [IconButton](../IconButton/README.md), which requires a `label`.
- **Contrast:** icons that carry meaning need 3:1 against their background (see Color, under Usage).
- **Translation:** icons are SVGs with no text, so translation tools and screen readers never see an icon's name.
- **Keyboard:** none: the svg is `focusable="false"`, so it's never a Tab stop of its own, in a button or not.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<span>`. |
| `name` | `IconName`: any Material Symbol's name, a custom icon's name, or a name you registered | | Give `name` or `icon`. A custom icon with the same name as a Material Symbol wins. All names autocomplete. |
| `icon` | `IconData`: a Material Symbol imported from `serupa-ds/icons` | | Give `name` or `icon`: `icon={ArrowForward}`. |
| `size` | `number \| string` | 24px, or the button's icon size inside a Button | Pixels as a number (or a string of one: `"20"` is 20px), or any CSS length. Sets the font size; the icon is 1em square. |
| `mirror` | `boolean \| 'auto'` | `'auto'` | Flips the icon in right-to-left text (`dir="rtl"`), so it points the way reading goes. `'auto'` flips Material Symbols' directional icons (`arrow_forward`, `arrow_back`, `chevron_left`, `chevron_right`, `navigate_next`, `first_page`, `last_page`, `send`, `reply`, `undo`, `redo`, `open_in_new`, `logout` and the like) and nothing else; `true` flips any icon (your own custom arrow), `false` none (an icon you turn yourself). |
| `aria-label` | `string` | | Makes the icon meaningful: `role="img"` with this name. Without it (or `aria-labelledby`) the icon is `aria-hidden`. |

`className`, `style`, `ref` and other `<span>` props go to the outer `<span>`, which has `data-icon` with the icon's name.

Also exported: `registerIcons(...icons)` adds icons that work by name, `getIcon(name)` returns the Material Symbol (or registered icon) for a name, and the `MaterialIconName` type lists every name. Every icon prop in the system (Button's `leftIcon`, `rightIcon` and `icon`, IconButton and Fab's `icon`, Input's icons, and the rest) takes a name, an imported icon or any element (`IconSource`).

## Component tokens

None: it draws in `currentColor` at 1em of its font size, so it takes its color from the text and its size from `size` or the text around it.
