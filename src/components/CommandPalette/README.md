# CommandPalette

A search over the app's commands and pages in a dialog, opened with ⌘K (Ctrl+K off Apple devices) from anywhere: type a few letters, move with the arrows, press Enter. It gives keyboard users, and people who know what they want, one fast way to every action and page.

```tsx
import { CommandPalette, type Command } from "serupa-ds";

const commands: Command[] = [
  { id: "home", label: "Home", group: "Pages", href: "/" },
  { id: "settings", label: "Settings", group: "Pages", keywords: ["preferences"], href: "/settings" },
  { id: "new", label: "New project", group: "Actions", icon: "add", shortcut: ["mod", "N"], onSelect: () => createProject() },
];

// Opens on ⌘K or Ctrl+K by itself
<CommandPalette commands={commands} />

// Opened from a button too
const [open, setOpen] = React.useState(false);
<Button onClick={() => setOpen(true)}>Search <Kbd keys={["mod", "K"]} size="sm" /></Button>
<CommandPalette commands={commands} open={open} onOpenChange={setOpen} />
```

## When to use

- An app with many pages and actions, where people who use it every day want to reach any of them without the mouse.
- A shortcut to actions that sit deep in menus or settings, alongside those menus.

## When not to use

- Searching the content of the product (documents, people, orders): use a [SearchInput](../SearchInput/README.md) with results on a page, or a [Combobox](../Combobox/README.md) to pick one item.
- As the only way to an action: not everyone knows about ⌘K, so keep every command in the menus and navigation too.
- A handful of actions on one object: use a [Menu](../Menu/README.md).

## Anatomy

Drawn from the `Default` story.

1. **Search field** (`.dk-command-palette__field`): what you type to filter commands and pages.
2. **List** (`.dk-command-palette__list`): the matching commands, in groups.
3. **Group heading** (`.dk-command-palette__heading`): names a group of commands.
4. **Command** (`.dk-command-palette__option`): one command; Enter runs the active one.
5. **Icon** (`.dk-command-palette__icon`): an optional picture of the command.
6. **Shortcut** (`.dk-command-palette__keys`): the keys that run it from anywhere, when it has them.

## Usage

- Write each `label` as the action or page in a few words, starting with the word people would type ("New project", not "Create a new project").
- Add `keywords` for the other words people use ("preferences" for Settings, "dark mode" for Switch theme). They find the command but aren't shown.
- Give commands a `group` ("Pages", "Actions"); groups are listed in the order they first appear. Commands with none go under "Commands".
- A command runs its `onSelect`, or goes to its `href`, after the palette has closed, so focus is back on the page. `onSelect` on the palette runs for every command, after the command's own.
- `shortcut` only shows the keys. Set the shortcut itself up with [useShortcut](../KeyboardShortcuts/README.md), so the palette teaches it.
- Mount one palette per app, near the root. The ⌘K shortcut is listed in [KeyboardShortcuts](../KeyboardShortcuts/README.md); change it with `hotkey`, or turn it off with `hotkey={false}` and open it yourself.
- Keep `commands` the same array between renders (state, a constant or `useMemo`). While searching it lists the best 50 matches (`limit`).

## Behavior

- Each opening starts with an empty field and the first command active.
- Matching ignores case and accents. A label that starts with what's typed comes first, then one with a word that does, then one that has it inside, then a keyword match; ties keep the order given. What matched is marked in each label.
- The list grows to 320px, then scrolls, keeping the active row in view.
- Escape or a click on the backdrop closes it with nothing chosen.

## Accessibility

- **Role and name:** a modal `<dialog>` named "Command palette" (`labels.commandPalette`, or your `aria-label`). The search field is a `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`, over a `role="listbox"` with one `role="group"` per group, named by its heading, of `role="option"` rows. A disabled command has `aria-disabled="true"`.
- **Keyboard:** focus stays in the field, and goes back to where it was when the palette closes (table below).
- **Screen readers:** once typing stops, the number of matches ("3 commands", `labels.commandsCount`) or "No matching commands" is said through the shared announcer.
- **Contrast:** the field, headings, rows and active row read 4.5:1 in all six themes (`CommandPalette.test.tsx`). In forced colors (Windows high contrast) the active row has an outline in Highlight, since the highlight and its bar are dropped there.
- **What's still yours:** labels people can guess, and a visible way to open it (a Button showing the keys) for people who don't know ⌘K.

| Key | Does |
| --- | --- |
| ⌘K (Ctrl+K off Apple devices), or `hotkey` | Opens it from anywhere on the page |
| ArrowDown, ArrowUp | Move through the enabled commands, wrapping at the ends |
| PageDown, PageUp | Go to the last or first command |
| Enter | Runs the active command (or, on a command focused another way, that one; Space too) |
| Escape | Closes it with nothing chosen |
| Tab | Stays in the dialog: the field is its only stop |

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<dialog>`. |
| `commands` | `Command[]` | | The commands and pages: `{ id, label, group?, keywords?, icon?, shortcut?, href?, disabled?, onSelect? }`. |
| `onSelect` | `(command: Command) => void` | | Runs for any command chosen, after the palette has closed and after the command's own `onSelect`. |
| `hotkey` | `string[] \| false` | `["mod", "K"]` | The keys that open it from anywhere on the page; `false` for none. |
| `placeholder` | `string` | `"Search commands and pages"` | The search field's placeholder and name (`labels.searchCommands`). |
| `emptyText` | `ReactNode` | `"No matching commands"` | Shown when nothing matches (`labels.noCommands`). A string is also said. |
| `limit` | `number` | `50` | How many it lists at most while searching, the best matches first. |
| `open` | `boolean` | | Controlled: close it yourself in `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Open at first (uncontrolled). |
| `onOpenChange` | `(open, { reason }) => void` | | Called with `true` on the hotkey (`reason: 'trigger'`) and `false` on Escape, the backdrop or a choice (`reason: 'select'`). |
| `closeOnBackdrop` | `boolean` | `true` | Whether a click on the backdrop closes it. |
| `finalFocus` | `RefObject<HTMLElement>` | | Where focus goes when it closes, instead of back to where it was. |

Every other prop, `className` and `ref` go to the [Dialog](../Dialog/README.md)'s `<dialog>`.

## Component tokens

Each is an optional override: set it on the page, a container or one CommandPalette. The list lives in `src/components/CommandPalette/command-palette.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from command-palette.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--command-palette-heading` | `text-muted` | A group's heading (4.5:1 on the dialog). |
| `--command-palette-divider` | `border` | The line under the search field. |
| `--command-palette-option-bg-active` | `highlight` | The active row's background (its text stays 4.5:1 on it). |
| `--command-palette-muted` | `text-muted` | The placeholder, icons and the empty message (4.5:1 on the dialog). |
| `--command-palette-indicator-active` | `primary` | The bar at the start of the active row. |
| `--command-palette-list-height` | `spacing-80` | The most the list grows to before it scrolls (320px). |
| `--command-palette-option-height` | `control-height-lg` | A row's least height (44px). |
<!-- token-table:end -->
