// npm run new-component -- <Name> [--group <Storybook group>]: starts a component folder with every file the
// contract asks for (tools/test/contract.mjs), already wired to the system: the component through component(), its
// CSS in the dk.components layer reading its own tokens, the tokens file, stories, a test, the Storybook page, the
// usage guide with its required headings, the preview page, its export list and its server-render case.
//   node tools/new-component.mjs Rating --group Forms
// Every place that still needs your words says TODO(new-component); tools/test/contract.mjs fails while one is left,
// so a half-made component can't merge. Then follow the steps it prints.
import fs from 'node:fs';
import path from 'node:path';

const P = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const name = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--group' && args[i - 1] !== '--root');
const root = path.resolve(arg('--root') || P);   // another checkout to write into (the generator's own test uses it)
const group = arg('--group') || 'Content';
if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) { console.error('usage: npm run new-component -- <Name> [--group <Storybook group>]   (Name in PascalCase, e.g. Rating)'); process.exit(2); }
const dir = path.join(root, 'src', 'components', name);
if (fs.existsSync(dir)) { console.error(`src/components/${name}/ already exists`); process.exit(1); }

const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const camel = name[0].toLowerCase() + name.slice(1);
const TODO = 'TODO(new-component)';
const token = (type, value, description, cssVar) => ({ $type: type, $value: value, $description: description, $extensions: { 'com.serupa': { cssVar } } });

const files = {
  [`${name}.tsx`]: `"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { component } from "../../internal/component";

export interface ${name}Props extends React.HTMLAttributes<HTMLDivElement> {
  /** ${TODO}: describe each prop here; Storybook and the API baseline read these comments. */
  children?: React.ReactNode;
}

/** ${TODO}: one line on what ${name} is for. */
export const ${name} = /* @__PURE__ */ component<HTMLDivElement, ${name}Props>("${name}", function ${name}(props, ref) {
  const { className, ...rest } = props;
  return <div {...rest} ref={ref} className={cn("dk-${kebab}", className)} data-component="${kebab}" />;
});
`,
  'index.ts': `// The package exports what this file exports: tools/build/registry.mjs collects every component folder's index.ts.
export { ${name} } from "./${name}";
export type { ${name}Props } from "./${name}";
`,
  [`${name}.css`]: `/* ---------------------------------------------------------------
   ${name}: ${TODO} what it looks like, in a sentence or two. Every value reads one of its own tokens
   (${kebab}.tokens.json), which fall back to the shared ones.
   --------------------------------------------------------------- */
@layer dk.components {
.dk-${kebab} {
  padding: var(--${kebab}-padding, var(--spacing-4));
  border-radius: var(--${kebab}-radius, var(--rounded-md));
  background: var(--${kebab}-bg, var(--surface));
  color: var(--${kebab}-text, var(--text));
}
}
`,
  [`${kebab}.tokens.json`]: JSON.stringify({ [camel]: {
    $description: `${name}'s component tokens. Each one is an optional override: set the CSS variable (--${kebab}-<name>) on the page, a container or one ${name}, and every ${name} inside follows. Unset, it uses the shared token it references here; tools/test/foundation.mjs checks that bundle.css uses exactly these defaults.`,
    color: { bg: token('color', '{color.surface}', 'The background.', `--${kebab}-bg`), text: token('color', '{color.text}', 'The text (4.5:1 on bg).', `--${kebab}-text`) },
    radius: { radius: token('dimension', '{radius.rounded-md}', 'The corners (6px).', `--${kebab}-radius`) },
    spacing: { padding: token('dimension', '{spacing.spacing-4}', 'Space inside, on every side (16px).', `--${kebab}-padding`) },
  } }, null, 2) + '\n',
  [`${name}.stories.tsx`]: `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ${name} } from './${name}';

const meta = {
  title: 'Components/${group}/${name}',
  component: ${name},
  args: { children: '${name}' },
} satisfies Meta<typeof ${name}>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
// ${TODO}: a story for every state and variant (the visual baselines and the Storybook check cover each one).
export const Default: Story = {};
`,
  [`${name}.test.tsx`]: `import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { THEMES, contrast, css } from '../../../tools/test/vitest/helpers';
import { ${name} } from './${name}';

const el = (id: string) => document.getElementById(id) as HTMLElement;

describe('${name}', () => {
  test('renders a <div>; ref, className and other props reach it', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(<${name} id="x" ref={ref} className="extra" data-x="y">Hello</${name}>);
    const e = el('x');
    expect([e.tagName, e.textContent, ref.current === e, e.className, e.dataset.x, e.dataset.component]).toEqual(['DIV', 'Hello', true, 'dk-${kebab} extra', 'y', '${kebab}']);
  });

  test('its text reads 4.5:1 on its background in all six themes', async () => {
    await render(<${name} id="c">Text</${name}>);
    for (const th of THEMES) {
      document.documentElement.setAttribute('data-theme', th);
      expect(contrast(css(el('c')).color, css(el('c')).backgroundColor), th).toBeGreaterThanOrEqual(4.5);
    }
  });

  // ${TODO}: a test for every behaviour: keyboard, focus, ARIA states, each variant.
});
`,
  [`${name}.mdx`]: `import { Meta, Title, Description, Primary, Controls, Stories } from '@storybook/addon-docs/blocks';
import { Guide } from '../../../docs/blocks';
import * as Stories${name} from './${name}.stories';
import guide from './README.md?raw';

<Meta of={Stories${name}} />

<Title />

<Primary />

<Controls />

<Guide source={guide} />

## Examples

<Stories title="" includePrimary={false} />
`,
  'README.md': `# ${name}

${TODO}: one or two sentences: what it is and the job it does for the person using the product.

\`\`\`tsx
import { ${name} } from "serupa-ds";

<${name}>…</${name}>
\`\`\`

## When to use

- ${TODO}: a situation where this is the right choice.

## When not to use

- ${TODO}: a situation, and what to use instead ([Other](../Other/README.md)).

## Usage

- ${TODO}: how to use it well.

## Accessibility

- **Role and name:** ${TODO}
- **Keyboard:** ${TODO}
- **Contrast:** its text reads 4.5:1 on its background in all six themes (\`${name}.test.tsx\`).
- **What's still yours:** ${TODO}

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| \`children\` | \`ReactNode\` | | ${TODO} |

\`className\`, \`ref\` and other props go to the \`<div>\`.

## Component tokens

Each is an optional override: set it on the page, a container or one ${name}. The list lives in \`src/components/${name}/${kebab}.tokens.json\` (also in \`design-tokens/components/\`).

| Token | Default | Use |
| --- | --- | --- |
| \`--${kebab}-bg\` | \`surface\` | The background. |
| \`--${kebab}-text\` | \`text\` | The text (4.5:1 on bg). |
| \`--${kebab}-radius\` | \`rounded-md\` | The corners (6px). |
| \`--${kebab}-padding\` | \`spacing-4\` | Space inside, on every side (16px). |
`,
  'preview.html': `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${name} — preview</title>
<style>
  body { margin: 0; padding: 16px; background: var(--surface); color: var(--text); font-family: var(--font-sans); }
</style>
</head>
<body>
<div id="root"></div>
<script>
  var T = window.Serupa, h = React.createElement;
  ReactDOM.createRoot(document.getElementById('root')).render(h(T.${name}, null, '${name}'));
</script>
</body>
</html>
`,
};

fs.mkdirSync(dir, { recursive: true });
for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
const ssr = path.join(root, 'tools', 'test', 'ssr', `${name}.mjs`);
fs.mkdirSync(path.dirname(ssr), { recursive: true });
fs.writeFileSync(ssr, `// Server-rendered by tools/test/package.mjs: each case renders with renderToString from the built package.
export default ({ h, D }) => ({
  ${name}: h(D.${name}, null, '${name}'),
});
`);
console.log(`Made src/components/${name}/ (${Object.keys(files).length} files) and tools/test/ssr/${name}.mjs. Next:
  1. Fill in every ${TODO} (contract.mjs fails while one is left), and build the component.
  2. npm run tokens (its tokens file in design-tokens/), npm run build, then node tools/test/api.mjs --update and
     node tools/test/size.mjs --update ${name}.
  3. npx changeset (minor: "Added: ${name} …").
  4. Open the pull request and add the "update-visual-baselines" label for its pictures.`);
