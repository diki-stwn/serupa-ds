# Avatar

A small picture of a person (a circle) or of a team, project or organisation (a square). When there's no picture, or it fails to load, it shows the initials, or a person icon when there's no name either.

```jsx
const { Avatar } = window.Serupa;

<Avatar src={user.photo} name={user.name} />
<Avatar name="Grace Hopper" size="lg" status="online" />
<Avatar name="Atlas" shape="square" />

// the name is already written next to it: hide the avatar from screen readers
<div className="flex items-center gap-2"><Avatar src={u.photo} name={u.name} alt="" size="sm" />{u.name}</div>
```

## When to use

- Showing who someone is: next to a comment, in a list of members, for the signed-in user.
- A team, project or organisation's picture or initials, as a square.
- Showing whether a person is online, busy, away or offline.

## When not to use

- Any other picture, such as a photo, a screenshot or an upload: use [Image](../Image/README.md) instead.
- A symbol for an action or a status: use [Icon](../Icon/README.md) instead.
- A count, a status word or a tag: use [Badge](../Badge/README.md) instead.

## Usage

- Pass `name` even when there's a `src`: it gives the accessible name, and the initials if the picture fails to load.
- Next to the written name, pass `alt=""` so screen readers don't read it twice.
- Use circles for people and squares for everything else.
- Set `statusLabel` when the status means something more specific, such as "in a meeting". By default the status is read through the `avatarStatus` label, so it follows the provider's language ("daring" in `idLabels`).

## Accessibility

- With a name, the avatar is one image (`role="img"`) named by it; the picture inside is decorative. Next to the written name, pass `alt=""` so it isn't read twice.
- The status is part of the name, so it isn't told by color alone.
- Initials and the person icon keep 4.5:1 on their background in all six themes (`Avatar.test.tsx`).
- In forced-colors mode the frame gets a border.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `src` | string | | The picture, cropped to fill the shape |
| `name` | string | | Gives the initials ("Grace Brewster Hopper" → "GH") and the accessible name |
| `alt` | string | the name | The accessible name; `alt=""` hides the avatar from screen readers |
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | 24, 32, 40, 48 or 64px |
| `shape` | `'circle'` \| `'square'` | `'circle'` | Circles for people, squares (8px corners) for everything else |
| `status` | `'online'` \| `'busy'` \| `'away'` \| `'offline'` | | A dot at the bottom end, also added to the accessible name ("Grace Hopper, online") |
| `statusLabel` | string | the status | What the status says to screen readers, such as "in a meeting" |
| `imgProps` | `<img>` props | `loading="lazy"`, `decoding="async"` | For the picture: `loading="eager"` for one above the fold, `referrerPolicy`, `crossOrigin` |

`className`, `style`, `ref` and everything else go to the outer `<span>`, which has `data-component="avatar"`, `data-size` and `data-shape`. `initials(name)` is exported too.

## Component tokens

Each is an optional override: set it on the page, a container or one avatar. The list lives in `src/components/Avatar/avatar.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--avatar-bg` | `secondary` | The background behind initials and the fallback icon. |
| `--avatar-text` | `text` | The initials and the fallback icon (4.5:1 on the background). |
| `--avatar-ring` | `surface` | The ring that separates the status dot from the picture. |
| `--avatar-status-online` | `success` | The status dot for status="online". |
| `--avatar-status-busy` | `danger` | The status dot for status="busy". |
| `--avatar-status-away` | `warning` | The status dot for status="away". |
| `--avatar-status-offline` | `field-border` | The status dot for status="offline". |
| `--avatar-size-xs` | `spacing-6` | size="xs" (24px). |
| `--avatar-size-sm` | `spacing-8` | size="sm" (32px). |
| `--avatar-size-md` | `spacing-10` | size="md", the default (40px). |
| `--avatar-size-lg` | `spacing-12` | size="lg" (48px). |
| `--avatar-size-xl` | `spacing-16` | size="xl" (64px). |
| `--avatar-radius-square` | `rounded-lg` | The corners of shape="square" (8px). |
| `--avatar-ring-width` | `border-width-2` | The ring around the status dot (2px). |
| `--avatar-weight` | `font-medium` | The initials' weight (500). |
