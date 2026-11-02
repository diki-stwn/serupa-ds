# Accordion

A stack of items whose content shows and hides under a title button: FAQs, settings groups, long forms split into sections. One item open at a time by default, or several with `type="multiple"`.

```jsx
const { Accordion, AccordionItem } = window.Serupa;

<Accordion defaultValue={['shipping']}>
  <AccordionItem value="shipping" title="How long does shipping take?">Orders ship within 2 business days.</AccordionItem>
  <AccordionItem value="returns" title="Can I return an item?">Yes, within 30 days.</AccordionItem>
</Accordion>

<Accordion type="multiple" variant="card" headingLevel={2}>…</Accordion>

// Controlled
<Accordion value={open} onValueChange={setOpen}>…</Accordion>
```

## When to use

- Many sections where most people need only one or two, such as FAQs.
- Settings groups or a long form split into sections that people open as they need them.
- A narrow screen where showing every section at once would make the page very long.

## When not to use

- Content everyone needs to read, or compare across sections: show it on the page under [Heading](../Heading/README.md)s instead.
- Views of the same thing that people switch between: use [Tabs](../Tabs/README.md) instead.
- Steps people go through in order: use [Stepper](../Stepper/README.md) instead.
- One piece of content that shows and hides on its own: the native `<details>` and `<summary>` do that.

## Anatomy

Drawn from the `Playground` story.

1. **Item** (`.dk-accordion__item`): one section: its heading and its panel.
2. **Trigger** (`.dk-accordion__trigger`): the button in the heading that opens and closes the section.
3. **Title** (`.dk-accordion__title`): the section's name, inside the trigger.
4. **Chevron** (`.dk-accordion__icon`): turns to show whether the section is open.
5. **Panel** (`.dk-accordion__panel`): the section's content, shown when it's open.

## Usage

- Write titles that say what's inside, so people can pick one without opening the others.
- Use `type="multiple"` when people may want two sections open to compare them.
- Set `headingLevel` to fit the page's outline.
- Keep anything people must not miss out of a closed item: closed content is hidden from everyone.
- With many items and `type="multiple"`, add `showExpandAll` so people can open everything at once (to read or print the whole page) and close it again.
- The browser's find-in-page (Ctrl+F or ⌘F) searches closed items too, and opens the item a match is in.
- Closed items keep their content, and its state (a half-filled form, a playing video's position). Set `keepMounted={false}` on an item whose content is heavy and doesn't need to, such as a chart or a long table, so it renders only while open. Find-in-page can't find content that isn't there, so keep the default for text people may search.

## Accessibility

- Follows the WAI-ARIA accordion pattern: each title is a button inside a heading, with `aria-expanded` and `aria-controls`; an open item's content is a region labelled by its title. Closed items aren't regions, so screen readers' landmark lists hold only what's showing, and with `type="multiple"` and more than six items no panel is a region (the APG's advice against crowding the landmarks); the content still follows its heading.
- Up and Down move between titles (wrapping, skipping disabled ones), Home and End go to the first and last; Enter and Space open and close.
- Closed content is `hidden="until-found"`, so it's out of the tab order and screen readers skip it, but find-in-page still finds it: a match fires `beforematch`, which opens that item (in `single`, closing the open one). It's set once the closing animation ends. A disabled item's content stays `visibility: hidden` and isn't searchable. Before hydration, and in browsers without `until-found`, closed content is `visibility: hidden` as before.
- The Expand all button is a plain `<button>` that says "Expand all" or, once every enabled item is open, "Collapse all" (the `expandAll` and `collapseAll` labels in `SerupaProvider`). Disabled items stay as they are.
- With `collapsible={false}` the open item's button has `aria-disabled`, since pressing it does nothing.
- Titles and content keep 4.5:1, the chevron 3:1, on `surface` in all six themes (`Accordion.test.tsx`). Opening, the panel grows to its content's height while the content unfolds (a fade and an opening clip), so what's below slides down instead of jumping. Closing, it folds back while the height shrinks. A second press mid-way turns back from where it is. With reduced motion it only fades, and the height changes at once.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the titles and anything focusable in open items; closed content is skipped. With `showExpandAll`, its button comes first |
| Enter / Space | Opens or closes the focused item |
| Down / Up | The next or previous title, wrapping, skipping disabled ones |
| Home / End | The first or last title |

## Props

### Accordion

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `type` | `'single'` \| `'multiple'` | `'single'` | One open at a time, or any number |
| `value` | `string[]` | none | The open items (controlled) |
| `defaultValue` | `string[]` | `[]` | The items open at first. With `single`, only the first counts |
| `onValueChange` | `(value: string[]) => void` | none | Called when an item opens or closes |
| `collapsible` | boolean | `true` | With `single`: lets the open item close, leaving none open |
| `variant` | `'plain'` \| `'card'` | `'plain'` | Lines between items, or a bordered, rounded frame |
| `headingLevel` | `2`–`6` | `3` | The titles' heading level, to fit the page outline |
| `showExpandAll` | boolean | `false` | With `multiple`: an Expand all / Collapse all button above the items |

`className`, `style`, `ref` and everything else go to the wrapper, which has `data-component="accordion"`.

### AccordionItem

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | node | required | What the title button says |
| `value` | string | its position (`"0"`, `"1"`…) | Identifies it in `value` |
| `disabled` | boolean | `false` | Can't be opened or closed |
| `children` | node | none | The content |
| `keepMounted` | boolean | `true` | `false` renders the content only while the item is open (and while it closes), for heavy content. Its state is lost on close, and find-in-page can't find it |

`className`, `ref` and everything else go to the item, which has `data-state="open"` or `"closed"`.

## Component tokens

Each is an optional override: set it on the page, a container or one accordion. The list lives in `src/components/Accordion/accordion.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from accordion.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--accordion-border` | `border` | The lines between items, and the frame of variant="card". |
| `--accordion-title-color` | `text` | An item's title. |
| `--accordion-content-color` | `text-muted` | An item's content (4.5:1 on surface). |
| `--accordion-icon-color` | `text-muted` | The chevron. |
| `--accordion-bg` | `surface` | The background of variant="card". |
| `--accordion-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--accordion-trigger-bg-pressed` | `pressed` | A title's fill while it's held down. |
| `--accordion-title-size` | `text-sm` | Title text (14px). |
| `--accordion-title-weight` | `font-medium` | Title weight (500). |
| `--accordion-content-size` | `text-sm` | Content text (14px). |
| `--accordion-padding-y` | `spacing-4` | Space above and below a title, and below the content (16px). |
| `--accordion-padding-x` | `spacing-4` | Side padding in variant="card" (16px). |
| `--accordion-icon-size` | `spacing-5` | The chevron (20px). |
| `--accordion-border-width` | `border-width-1` | Lines and frame (1px). |
| `--accordion-radius` | `rounded-lg` | The corners of variant="card" (8px). |
| `--accordion-duration` | `motion-change-md` | Opening: the fade, unfold and height (200ms), and the chevron turning. Closing folds back and shrinks over motion-exit-md (150ms). |
<!-- token-table:end -->
