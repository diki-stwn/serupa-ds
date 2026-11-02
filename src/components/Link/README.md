# Link

An inline text link: underlined, in the primary color or the surrounding text's. `external` opens a new tab and says so, and `as` renders your router's link so client-side navigation keeps working.

```jsx
const { Link, Text } = window.Serupa;

<Text>Read <Link href="/docs">the guide</Link> before you start.</Text>
<Link href="https://status.example.com" external>Status page</Link>
<Text size="sm" tone="muted">By signing up you agree to the <Link href="/terms" tone="neutral">terms</Link>.</Text>
<Link href="/pricing" underline="hover">Pricing</Link>

// With a router (React Router, Next.js…)
<Link as={RouterLink} to="/settings">Settings</Link>
```

## When to use

- Going to another page or place from inside a sentence.
- Lists of links where the place already says they're links: a nav bar, a footer, a list of related pages.
- Pointing to another site, with `external` so people know it opens a new tab.

## When not to use

- For an action that doesn't go anywhere, use a [Button](../Button/README.md) (`variant="link"` if it should look like a link).
- A call to action that should stand out, such as "Get started": use a [Button](../Button/README.md) with `href`.
- The trail of pages above the current one: use [Breadcrumb](../Breadcrumb/README.md).

## Anatomy

Drawn from the `External` story.

1. **Link** (`.dk-link`): the words that go somewhere.
2. **External icon** (`.dk-link__icon`): says it opens another site or a new tab, also in words for screen readers.

## Usage

- Keep the default underline in body text; use `underline="hover"` only where the place already says it's a link. Don't combine it with `tone="neutral"`: that link looks like plain text until it's hovered, so Link warns in the console.
- Use `tone="neutral"` in muted small print, such as terms under a form, so the link takes the text's color.
- With a router, register its link component once with `configure({ link })`, or pass it in `as`, so client-side navigation keeps working.
- A bare URL as the text is fine: it breaks across lines, even in a flex row or grid column, rather than push the layout wider.
- Check any `href` that comes from people, such as a profile's website: allow only `https:`, `http:`, `mailto:` or your own paths. React still renders a `javascript:` link, which runs code when clicked.

## Accessibility

- Underlined by default, so a link in a sentence doesn't rely on color alone (WCAG 1.4.1). Use `underline="hover"` only where the place already says it's a link: a nav bar, a footer, a list of links. Color alone doesn't do it in a sentence: the primary color is only 3.1–3.4:1 against body text in the light themes and 1.8–2.6:1 in the dark ones, under the 3:1 that 1.4.1 asks of a link set apart by color.
- The primary color keeps 4.5:1 on `surface`, on hover too, and the focus ring 3:1, in all six themes (`Link.test.tsx`).
- With `external`, screen readers hear "(opens in a new tab)" after the text, from the `opensInNewTab` label ("(terbuka di tab baru)" in `idLabels`). Link stays a Server Component: only that note is a small client component.
- The new-tab icon stays on the line of the last word: with a text label, the last word and the icon don't break apart, so the icon never starts a line by itself.
- Write link text that makes sense on its own ("Read the pricing guide", not "click here"): screen reader users often move from link to link.
- The keyboard focus ring follows the text when a link wraps onto two lines.
- `autoFocus` focuses the link once it mounts, also through `as` (React's own `autoFocus` works only on form controls). Use it sparingly, such as for the one way on from a confirmation page.

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the link |
| Enter | Follow it (Space scrolls the page, as on any link) |

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `tone` | `'primary'` \| `'neutral'` | `'primary'` | The primary color, or the surrounding text's color (still underlined) |
| `underline` | `'always'` \| `'hover'` | `'always'` | Always underlined, or only on hover and focus |
| `external` | boolean | `false` | Opens a new tab (`target="_blank"`, adds `noopener noreferrer` to your `rel`), with a new-tab icon and "(opens in a new tab)" for screen readers. Your `target="_self"` (or `_parent`, `_top`) keeps it in the tab, without the icon or the note |
| `as` | a component | the `configure({ link })` link, else `'a'` | Your router's link component; it gets `className`, `ref` and every other prop. Set it once for the app with `configure({ link })`; `as` wins for one link. Typed: the props and `ref` are those of the element `as` names, so `as={RouterLink} to="/x"` checks `to`, and without `as` they're an `<a>`'s. A link set only with `configure({ link })` is typed as an `<a>`, so pass it `href`. |

`href`, `id`, `className`, `style`, `ref`, `target`, `rel` and everything else go to the element (an `<a>`, or what `as` names), which has `data-component="link"`. It has no font size of its own: it takes the text around it.

## Component tokens

Each is an optional override: set it on the page, a container or one link. The list lives in `src/components/Link/link.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from link.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--link-text` | `primary` | tone="primary" text and underline (4.5:1 on surface). |
| `--link-text-hover` | `primary-hover` | tone="primary" on hover. |
| `--link-focus-ring` | `focus-ring` | The keyboard focus ring. |
| `--link-thickness` | `decoration-1` | The underline's thickness (1px). |
| `--link-thickness-hover` | `decoration-2` | The underline's thickness on hover (2px). |
| `--link-offset` | `underline-offset-2` | The gap between the text and the underline (2px). |
| `--link-icon-gap` | `spacing-0.5` | Space before the new-tab icon of an external link (2px). |
| `--link-focus-radius` | `rounded-sm` | The focus ring's corners (4px). |
<!-- token-table:end -->
