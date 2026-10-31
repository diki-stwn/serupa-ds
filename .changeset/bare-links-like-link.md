---
"serupa-ds": minor
---

base.css: a bare link (an `<a href>` from Markdown, a CMS or plain HTML, with no class) now looks and behaves like `<Link>`. It wraps a long URL instead of widening the page at 320px (WCAG 1.4.10), draws Link's 1px underline that thickens to 2px on hover (so hover isn't shown by color alone), and reads the `--link-text`, `--link-text-hover`, `--link-thickness`, `--link-thickness-hover` and `--link-offset` tokens, so setting `--link-text` on a section recolors its plain links too. An `<a>` with no href (an anchor target, a router link before it hydrates) now reads as text: the surrounding color, no underline. On iOS Safari a bare input, select or textarea gets 16px text, as Input already does, so focusing it no longer zooms the page. Every rule stays at zero specificity, so any class still wins.
