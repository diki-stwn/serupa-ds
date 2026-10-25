# EmptyState

What a page or a panel shows when there's nothing in it yet, or nothing matches: an icon, a few words saying what's empty, what it means, and the action that fills it.

```jsx
const { EmptyState, Button } = window.Serupa;

<EmptyState
  icon="folder_open"
  title="No projects yet"
  description="Create a project to start tracking your work."
  actions={<Button leftIcon="add">New project</Button>}
/>

// Inside a table or a card, after a search
<EmptyState size="sm" icon="search_off" title="No results" description={`Nothing matches "${query}".`}
  actions={<Button variant="outline" onClick={clear}>Clear the search</Button>} />

// A slot to fill
<EmptyState variant="dashed" icon="upload" title="Drop files here" />
```

## When to use

- A list, a table or a page has nothing in it yet, such as a new account with no projects.
- A search or a filter matches nothing.
- A slot people fill themselves, such as an area waiting for its first item.

## When not to use

- Content that's still loading: use [Loader](../Loader/README.md) (a skeleton or a ring) instead, and show the empty state only once you know it's empty.
- Content that couldn't load because something failed: use an [Alert](../Alert/README.md) with a way to retry instead.
- A place to drop or choose files: use [FileUpload](../FileUpload/README.md), which checks and lists the files, instead.

## Usage

- Say what's empty and why, then what to do: "No invoices yet. Invoices you send show up here." with a "New invoice" button.
- After a search or a filter, say nothing matches and offer to clear it, rather than suggesting to create something.
- Keep it to one primary action.
- Use `size="sm"` inside a card, a table or a menu, and the default size for a whole page or panel.

## Accessibility

- The title is a heading (`h3` by default), so people can find it; set `headingLevel` to fit the page.
- The icon is decorative and hidden from screen readers.
- When the empty state appears after an action (a search), consider announcing it, for example by putting it in a region with `aria-live="polite"`.
- The title and description keep 4.5:1 on `surface`, and the icon 3:1 on its circle, in all six themes (`EmptyState.test.tsx`).

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `icon` | an icon name or element | none | An icon in a circle, or your own illustration at its own size |
| `title` | node | required | What's empty, in a few words |
| `description` | node | none | What it means or what to do next |
| `actions` | node | none | One or two Buttons |
| `size` | `'sm'` \| `'md'` | `'md'` | `sm` fits inside a card, a table or a menu |
| `variant` | `'plain'` \| `'dashed'` | `'plain'` | A dashed frame, for a drop zone or a slot to fill |
| `headingLevel` | `2`–`6` | `3` | The title's heading level |

`className`, `style`, `ref` and everything else go to the wrapper, which has `data-component="empty-state"`.

## Component tokens

Each is an optional override: set it on the page, a container or one empty state. The list lives in `src/components/EmptyState/empty-state.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--empty-state-icon-color` | `text-muted` | The icon (3:1 on icon-bg). |
| `--empty-state-icon-bg` | `secondary` | The circle behind the icon. |
| `--empty-state-title-color` | `text` | The title. |
| `--empty-state-description-color` | `text-muted` | The description (4.5:1 on surface). |
| `--empty-state-border` | `border` | The dashed frame of variant="dashed". |
| `--empty-state-title-size` | `text-base` | The title (16px; sm: 14px). |
| `--empty-state-title-weight` | `font-semibold` | The title's weight (600). |
| `--empty-state-description-size` | `text-sm` | The description (14px). |
| `--empty-state-icon-size` | `spacing-6` | The icon (24px). |
| `--empty-state-icon-box` | `spacing-12` | The circle behind it (48px; sm: 40px). |
| `--empty-state-icon-box-sm` | `spacing-10` | The circle at size sm (40px). |
| `--empty-state-max-width` | `container-sm` | The widest the text gets (384px). |
| `--empty-state-padding` | `spacing-12` | Space around the content (48px). |
| `--empty-state-padding-sm` | `spacing-6` | At size sm (24px). |
| `--empty-state-gap` | `spacing-4` | Space between the icon, the text and the actions (16px). |
| `--empty-state-border-width` | `border-width-1` | The dashed frame (1px). |
| `--empty-state-radius` | `rounded-lg` | The dashed frame's corners (8px). |
