---
"serupa-ds": minor
---

Editor autocomplete: the package now carries VS Code custom data, `serupa-ds/vscode/serupa.html-data.json` and `serupa-ds/vscode/serupa.css-data.json`. Point `html.customData` and `css.customData` at them, and VS Code offers every utility class in `class="…"` with what it sets, the themes in `data-theme`, and every token where a stylesheet sets one. The README's "Editor autocomplete" section has the settings.
