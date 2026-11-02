# AvatarGroup

Avatars in an overlapping row, such as the people on a project or the assignees of a task. Avatars past `max` fold into a "+N" avatar at the end.

```tsx
import { Avatar, AvatarGroup } from "serupa-ds";

<AvatarGroup label="Assigned to" max={3}>
  <Avatar name="Ada Lovelace" src="/ada.jpg" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Alan Turing" />
  <Avatar name="Katherine Johnson" />
</AvatarGroup>

<AvatarGroup label="Members" size="sm" total={members.length}>
  {members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} src={m.photo} />)}
</AvatarGroup>
```

## When to use

- Showing who's involved in something at a glance: a project's members, a task's assignees, who's viewing a document.
- A compact list of people where the faces matter more than the names, and the row has little room.

## When not to use

- One person: use [Avatar](../Avatar/README.md) on its own.
- When people need to read, compare or act on the names (remove a member, change a role): use [List](../List/README.md) with an Avatar in each row instead.
- A long, complete list of people, such as a team directory: use [Table](../Table/README.md) or List; "+N" hides who's there.

## Anatomy

Drawn from the `Overflow` story.

1. **Avatar** (`.dk-avatar-group__item`): one person, overlapping the next.
2. **More** (`.dk-avatar-group__more`): how many more there are, after the ones that fit.

## Usage

- Give the group a `label` that says what the people are to the thing ("Assigned to", "Members"), so a screen reader hears more than a run of names.
- Keep `max` small (3 to 5). Past that, the row reads as texture rather than people.
- When you only have some of the people loaded, pass `total` so "+N" counts everyone not shown.
- Use one `size` for the group; mixed sizes in one row look like a mistake.
- Put the names on hover by wrapping each Avatar in a [Tooltip](../Tooltip/README.md).
- Without `max`, a group too long for its box (ten reviewers on a phone) wraps onto more lines rather than widening the page. Set `max` to keep it on one line.
- To let people see who's behind "+N", pass `showMore`: "+N" becomes a button that opens a [Popover](../Popover/README.md) listing them by name. To show them your own way (a Dialog, a members page), pass `onMore` instead.
- On a background other than `surface`, set `--avatar-group-ring` to that color so the rings blend in.

## Behavior

- Each avatar overlaps the one before by 8px (xs, sm), 12px (md, lg) or 16px (xl); earlier ones sit on top, so every status dot shows. The overlap uses logical margins, so the row runs right to left in RTL.
- Each avatar has a 2px ring in `surface`. On another background, set `--avatar-group-ring` to that color.
- Past 99, "+N" reads "99+" (past 9 at `xs`, "9+") so it fits; its name keeps the exact count ("116 more").
- "+N" is written in the locale's digits, as Badge's count is: "+٣" in `ar-EG`.
- Wrap an avatar in a Tooltip to show the name on hover; it still lines up with the others.
- With `showMore`, "+N" opens a popover listing each hidden avatar with its name, then "N more" for the ones you didn't pass (`total`). With `onMore`, it calls your handler. Without either, "+N" is a picture, not a control.

## Accessibility

- **Role and name:** `role="group"`, named by `label`. Each avatar keeps its own name (and status), so a screen reader reads every person shown, then "N more".
- **Keyboard:** with `showMore` or `onMore`, "+N" is a button that Tab reaches and Enter or Space opens, named like the picture ("2 more"). Otherwise nothing of its own; avatars inside links or Tooltips are reached by Tab as usual.
- **Contrast:** the "+N" text keeps 4.5:1 on its background in all six themes (`AvatarGroup.test.tsx`).
- **What's still yours:** a `label` for the group, and a `name` on every Avatar.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | none | Goes to the root `<div>`. |
| `children` | `<Avatar>` elements | | The avatars, in order. Each can sit inside a Tooltip or a link, and fragments are opened up. |
| `max` | `number` | all | The most avatars to show; the rest become "+N". |
| `total` | `number` | the number of children | How many there are in all, when you pass only some. "+N" counts the ones not shown. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Every avatar's size, wrapped ones included. It wins over each avatar's own `size`. |
| `label` | `string` | | The group's accessible name, such as "Assigned to". |
| `showMore` | `boolean` | `false` | Makes "+N" a button that opens a popover listing the people not shown. |
| `onMore` | `(event) => void` | | Makes "+N" a button that calls this, to show the rest your own way. Wins over `showMore`. |
| `moreLabel` | `(count) => string` | `"N more"` | What a screen reader hears for "+N". By default the `avatarMore` label ("N lainnya" in `idLabels`). |

`ref`, `className` and other props go to the outer `<div>`.

## Component tokens

Each is an optional override: set it on the page, a container or one group. The list lives in `src/components/AvatarGroup/avatar-group.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from avatar-group.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--avatar-group-ring` | `surface` | The ring around each avatar, which keeps the overlapping edges clear. Set it to the background the group sits on. |
| `--avatar-group-more-bg` | `secondary` | The "+N" avatar's background. |
| `--avatar-group-more-color` | `text` | The "+N" text (4.5:1 on more-bg). |
| `--avatar-group-more-hover-bg` | `secondary-hover` | The "+N" button's background on hover, with `showMore` or `onMore`. |
| `--avatar-group-focus-ring` | `focus-ring` | The focus ring round the "+N" button. |
| `--avatar-group-ring-width` | `border-width-2` | The ring's width (2px). |
| `--avatar-group-overlap-sm` | `spacing-2` | How far each avatar overlaps the one before at size xs and sm (8px). |
| `--avatar-group-overlap-md` | `spacing-3` | The overlap at size md, the default, and lg (12px). |
| `--avatar-group-overlap-lg` | `spacing-4` | The overlap at size xl (16px). |
<!-- token-table:end -->
