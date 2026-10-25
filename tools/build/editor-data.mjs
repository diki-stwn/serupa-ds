// Editor autocomplete (136): VS Code custom data, so the editor offers the utility classes in class="…" and the
// tokens in a stylesheet, each with what it sets. npm run build writes them into dist/vscode/ (tools/build/build.mjs).
//   serupa.html-data.json  class values (every utility class, with its declarations), data-theme, data-brand and
//                          data-mode values, for html.customData
//   serupa.css-data.json   every token as a property (--primary), with its description and blue-light value, for
//                          css.customData: offered where a page sets a token (:root { --primary: … })
// VS Code offers custom properties inside var() only from the stylesheet being edited, so custom data can't add them
// there.

/** Utility classes and their declarations, in the order utilities.css has them (responsive variants included). */
export function utilityClasses(css) {
  const out = new Map();
  // A rule on one line; its class is the selector's first (.divide-x > :not(:last-child), :where(.-space-x-2 > …)).
  for (const m of css.matchAll(/^\s*(?::where\()?\.((?:[A-Za-z0-9_-]|\\[0-9a-fA-F]{1,6} ?|\\.)+)[^{}\n]*\{ ([^{}]*) \}$/gm)) {
    // CSS escapes: \: and \. for the character, \32  (hex and a space) for a leading digit (2xl:).
    const name = m[1].replace(/\\([0-9a-fA-F]{1,6}) ?|\\(.)/g, (_, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch));
    if (!out.has(name)) out.set(name, m[2].trim());
  }
  return out;
}

/** The tokens tokens.css sets on :root, with their value there and their comment. */
export function tokenList(tokensCss) {
  const root = /:root, \[data-theme="[^"]+"\] \{([\s\S]*?)\n\}/.exec(tokensCss);
  if (!root) throw new Error('tokens.css: no :root block');
  return [...root[1].matchAll(/^\s*(--[a-z0-9-]+): ([^;]+);(?: \/\* (.*?) \*\/)?$/gm)].map((m) => ({ name: m[1], value: m[2].trim(), description: (m[3] || '').replace(/^Alias\. /, '') }));
}

const values = (list) => [...new Set(list)].sort().map((name) => ({ name }));

export function editorData(utilitiesCss, tokensCss) {
  const md = (value) => ({ kind: 'markdown', value });
  const html = {
    version: 1.1,
    globalAttributes: [
      { name: 'class', description: 'Serupa utility classes', values: [...utilityClasses(utilitiesCss)].map(([name, description]) => ({ name, description })) },
      { name: 'data-theme', description: 'A Serupa theme for this element and what it holds', values: values([...tokensCss.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1])) },
      { name: 'data-brand', description: "The Serupa brand, read by theme.js with data-mode (it sets data-theme)", values: values([...tokensCss.matchAll(/\[data-brand="([a-z]+)"\]/g)].map((m) => m[1])) },
      { name: 'data-mode', description: "Light, dark, or the visitor's setting (auto), read by theme.js with data-brand", values: values([...tokensCss.matchAll(/\[data-mode="([a-z]+)"\]/g)].map((m) => m[1])) },
    ],
  };
  const css = {
    version: 1.1,
    properties: tokenList(tokensCss).map((t) => ({ name: t.name, description: md(`${t.description ? t.description + '\n\n' : ''}\`${t.value}\` in blue-light. Use it as \`var(${t.name})\`.`) })),
  };
  return { html, css };
}
