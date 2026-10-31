# Prose

Styles for content nobody wrote in components: HTML from Markdown, a CMS or a rich-text editor, such as a help article, a changelog or a blog post. base.css takes the browser's spacing off headings and paragraphs so that app screens line up, which leaves such content as one wall of text; inside Prose it reads as a document again.

```tsx
import { Prose } from "serupa-ds";

<Prose as="article" dangerouslySetInnerHTML={{ __html: html }} />
```

## When to use

- Around HTML you don't control element by element: rendered Markdown, CMS fields, rich-text editor output, or a long page of plain elements such as terms of service.

## When not to use

- Around your app's own screens and components: they space themselves with Stack and the spacing utilities, and Prose would add space between them.
- For one line or paragraph of text: use [Text](../Text/README.md), and [Heading](../Heading/README.md) for a heading.

## Usage

- Sanitize HTML from users or a CMS before you pass it to `dangerouslySetInnerHTML` (through your Trusted Types policy, if the page has one), or render the Markdown to elements: Prose only styles what's inside it.
- Each block is spaced from the one before it, with more space before a heading and none before the first block, so nothing needs a margin of its own. Lists, quotes, details, cells and definitions are spaced the same way inside.
- The column is capped at about 65 characters a line (`container-prose`), the comfortable reading width. Give it a `className` such as `max-w-none` to fill its container.
- Lists get their bullets and numbers back (disc, then circle and square when nested), indented with logical properties, so they sit on the right in RTL.
- Links are base.css's bare links: Link's colors, underline and focus ring, and a long URL wraps. A visited link takes its own shade (`link-visited`), so readers can see what they've already read; app screens keep Link's one color.
- A wide table or code block scrolls in its own box instead of widening the page. Images and videos never overflow the column, and an image that fails to load shows its alt text in muted italics.

## Accessibility

- **Role and name:** none of its own. It's a `<div>` by default; use `as="article"` for content that stands on its own, such as a post. The headings inside keep their levels, so start them below the page's own.
- **Keyboard:** none of its own. Links inside take the base focus ring, and a table or code block that scrolls can be scrolled with the trackpad or the scrollbar.
- **Contrast:** body text, headings, quotes and list markers keep 4.5:1 on the page, and a visited link reads 4.5:1 on `surface` and `surface-muted` in all six themes (`Prose.test.tsx`, and the foundation check for `link-visited`). Browsers allow only a color change on a visited link, so it's a reading aid, never the only way to tell something.
- **What's still yours:** sanitized HTML, sensible heading levels, and alt text on the images.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `as` | `'div'` \| `'article'` \| `'section'` | `'div'` | The element. |
| `children` | `ReactNode` | | The content, or pass HTML with `dangerouslySetInnerHTML`. |
| `id` | `string` | | Goes to the element. |

`className`, `ref` and other props go to the element.

## Component tokens

Each is an optional override: set it on the page, a container or one Prose. The list lives in `src/components/Prose/prose.tokens.json` (also in `design-tokens/components/`).

| Token | Default | Use |
| --- | --- | --- |
| `--prose-text` | `text` | The body text (4.5:1 on the page). |
| `--prose-heading` | `text` | Headings. |
| `--prose-link-visited` | `link-visited` | A visited link: a shade apart from primary, 4.5:1 on the page in every theme. |
| `--prose-marker` | `text-muted` | List bullets and numbers. |
| `--prose-quote-text` | `text-muted` | A blockquote's text. |
| `--prose-quote-border` | `border-strong` | The bar at a blockquote's start. |
| `--prose-code-bg` | `surface-muted` | Behind inline code and code blocks. |
| `--prose-caption` | `text-muted` | Figure captions, and the alt text of an image that failed to load. |
| `--prose-table-border` | `border` | The line under each table row. |
| `--prose-quote-border-width` | `border-width-4` | The width of a blockquote's bar (4px). |
| `--prose-code-radius` | `rounded-sm` | Inline code's corners. |
| `--prose-pre-radius` | `rounded-md` | A code block's corners (6px). |
| `--prose-flow` | `spacing-4` | Space before each block after the first (16px). |
| `--prose-flow-heading` | `spacing-8` | Space before a heading, and around a rule (32px). |
| `--prose-flow-after-heading` | `spacing-3` | Space between a heading and what follows it (12px). |
| `--prose-flow-list` | `spacing-2` | Space between list items (8px). |
| `--prose-list-indent` | `spacing-6` | The indent of lists and definitions (24px). |
| `--prose-quote-indent` | `spacing-4` | Space between a blockquote's bar and its text (16px). |
| `--prose-pre-padding` | `spacing-4` | Space inside a code block (16px). |
