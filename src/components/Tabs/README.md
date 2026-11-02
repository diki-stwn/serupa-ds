# Tabs

Switches between related panels in one place, such as a project's Overview, Activity and Settings. It follows the WAI-ARIA tabs pattern: `Tabs` holds the state, `TabList` the row of `Tab`s, and each `TabPanel` the content for the tab with the same `value`.

```jsx
const { Tabs, TabList, Tab, TabPanel } = window.Serupa;

<Tabs defaultValue="overview">
  <TabList aria-label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="activity" icon="history">Activity</Tab>
    <Tab value="settings" disabled>Settings</Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
  <TabPanel value="activity">…</TabPanel>
  <TabPanel value="settings">…</TabPanel>
</Tabs>

// controlled, as pills
<Tabs value={view} onValueChange={setView} variant="pill" size="sm">…</Tabs>
```

## When to use

- Several views of the same thing that people switch between, one at a time: a project's Overview, Activity and Settings.
- A page with more content than fits, where each part stands on its own and people know which one they want.
- Panels that should keep their state while people look elsewhere, such as a half-filled form: hidden panels stay in the page.

## When not to use

- Choosing a value, such as a period (Day, Week, Month) for the same content: use [SegmentedControl](../SegmentedControl/README.md) instead. It's a radio group, not a set of panels.
- Steps people go through in order: use [Stepper](../Stepper/README.md) instead.
- Moving between pages that each have their own URL: use links, in a [Navbar](../Navbar/README.md) or a [Sidebar](../Sidebar/README.md).
- Sections people may want open side by side, or read one after another: use [Accordion](../Accordion/README.md) instead.

## Anatomy

Drawn from the `Pill` story.

1. **Tab list** (`.dk-tabs__list`): the tabs, in one row that scrolls when they don't fit.
2. **Tab** (`.dk-tabs__tab`): shows its panel; the arrow keys move between tabs.
3. **Icon** (`.dk-tabs__icon`): an optional picture beside the tab's name.
4. **Panel** (`.dk-tabs__panel`): the content of the chosen tab.

## Usage

- Keep tab labels to a word or two. When the tabs don't fit, the row scrolls sideways: the edge with more tabs past it fades out, and the selected tab is always scrolled into view, but people can still miss the tabs out of view. It scrolls in a CSS grid track or a flex row too, without widening the page.
- Use `orientation="vertical"` for a settings page or anything with more than about six tabs: a column at the start of the panels, which has room for them all.
- Set `activation="manual"` when a panel is slow to show, so arrowing past a tab doesn't select it.
- Hidden panels keep their state. Set `keepMounted={false}` on a panel that doesn't need to, so it renders only while it's selected.
- The browser's find-in-page searches kept panels too. They're `hidden="until-found"`, so a match on another tab selects that tab and shows it, as Accordion opens an item. A disabled tab's panel isn't searched.
- Show a tab people can't use yet as `disabled` rather than leaving it out, when knowing it exists helps them.
- Tabs that can be closed: when the selected tab is removed, uncontrolled Tabs select the next enabled tab (or else the previous one) and call `onValueChange`. If focus was on the closed tab (its own close button, or a Delete key you handle), it moves to the tab now selected, not to the page. With `value`, set it to another tab yourself when you remove the selected one; Tabs warns in the console otherwise.

## Accessibility

- `role="tablist"`, `"tab"` and `"tabpanel"`, with `aria-selected`, `aria-controls` and `aria-labelledby` set for you.
- Only the selected tab is in the Tab order, and the shown panel itself can take focus, so keyboard users always reach the content (a kept panel of another tab is out of the Tab order). When a controlled `value` matches no tab (a stale link, data still loading), the first enabled tab takes the Tab stop instead, so the list can still be reached.
- Tab labels keep 4.5:1, and the selected line and pill 3:1 against `surface`, in all six themes (`Tabs.test.tsx`). The focus ring sits inside the tab so the scrolling row can't clip it.
- The selected line or fill slides from the tab selected before. Pick another tab mid-slide and it turns back from where it is, not from the last tab. With reduced motion it moves at once, and so it does when an arrow, Home or End picks the tab.
- In forced-colors mode the selected tab is marked in `Highlight`.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Into the tab list (on the selected tab), then to the selected panel |
| ← → | The previous or next tab, wrapping, following the text direction; disabled tabs are skipped. Also selects it unless `activation="manual"`. With `orientation="vertical"`, ↑ ↓ do this instead |
| Home, End | The first or last tab |
| Enter, Space | Selects the focused tab |

## Props

### Tabs

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `value` | string | | The selected tab (controlled), with `onValueChange` |
| `defaultValue` | string | the first enabled tab | The tab selected at first (uncontrolled) |
| `onValueChange` | `(value) => void` | | Called when a tab is chosen |
| `variant` | `'line'` \| `'pill'` | `'line'` | A line under the selected tab, or the selected tab filled in `primary` |
| `size` | `'sm'` \| `'md'` | `'md'` | 32px or 36px tabs |
| `activation` | `'auto'` \| `'manual'` | `'auto'` | Whether arrow keys also select, or only move (then Enter or Space selects). Use manual when a panel is slow to show |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | A row over the panels, or a column beside them (`aria-orientation`, ↑ ↓). The line variant's line moves to the column's end side |

### TabList, Tab and TabPanel

- `TabList`: the row. Give it an `aria-label` when nothing on the page says what the tabs are for. It scrolls sideways when the tabs don't fit (down, when vertical and its height is limited), fading out the edge with more tabs past it, and keeps the selected tab in view.
- `Tab`: `value` (required), `icon` (a name or element), `disabled`, and every `<button>` prop.
- `TabPanel`: `value` (required). Hidden panels stay in the page and keep their state; `keepMounted={false}` renders a panel only while it's selected.

Each part takes `className`, `style`, `ref` and other props. `Tabs` has `data-component="tabs"` and `data-variant`; tabs and panels have `data-state="active"` or `"inactive"`.

## Component tokens

Each is an optional override: set it on the page, a container or one set of tabs. The list lives in `src/components/Tabs/tabs.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from tabs.tokens.json by npm run tokens: edit the descriptions there) -->
**Colors**

| Token | Default | Use |
| --- | --- | --- |
| `--tabs-text` | `text-muted` | A tab's label (4.5:1 on surface). |
| `--tabs-text-hover` | `text` | A tab's label on hover. |
| `--tabs-text-selected` | `text` | The selected tab's label (line). |
| `--tabs-indicator` | `primary` | The line under the selected tab (3:1 on surface). |
| `--tabs-border` | `border` | The line under the whole tab list (line). |
| `--tabs-pill-bg-hover` | `secondary` | A pill tab's background on hover. |
| `--tabs-pill-bg-pressed` | `pressed` | A pill tab's background while it's pressed, before it's selected, one step past hover. |
| `--tabs-pill-bg-selected` | `primary` | The selected pill tab's background. |
| `--tabs-pill-text-selected` | `on-primary` | The selected pill tab's label. |
| `--tabs-focus-ring` | `focus-ring` | The keyboard focus ring, on a tab and on the panel. |
| `--tabs-focus-gap-color` | `surface` | The gap between the focus ring and the selected pill's fill. |

**Sizing**

| Token | Default | Use |
| --- | --- | --- |
| `--tabs-height-sm` | `control-height-md` | A tab's height with size="sm" (32px). |
| `--tabs-height-md` | `spacing-9` | A tab's height with size="md", the default (36px). |

**Border**

| Token | Default | Use |
| --- | --- | --- |
| `--tabs-indicator-width` | `border-width-2` | The thickness of the selected tab's line (2px). |
| `--tabs-radius` | `rounded-md` | A tab's corners (6px): the focus ring, and the pills. |

**Spacing**

| Token | Default | Use |
| --- | --- | --- |
| `--tabs-padding-x` | `spacing-3` | Padding at a tab's sides (12px). |
| `--tabs-gap` | `spacing-1` | Space between tabs (4px). |
| `--tabs-icon-gap` | `spacing-2` | Space between a tab's icon and label (8px). |
| `--tabs-panel-gap` | `spacing-4` | Space above a panel, or beside it when vertical (16px). |
| `--tabs-fade-size` | `spacing-8` | How far the row fades out at an edge with more tabs past it (32px). |

**Type**

| Token | Default | Use |
| --- | --- | --- |
| `--tabs-weight` | `font-medium` | A tab's label weight (500). |
<!-- token-table:end -->
