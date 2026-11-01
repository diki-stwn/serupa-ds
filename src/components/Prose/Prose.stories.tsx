import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from './Prose';

// What Markdown renders to: headings, paragraphs, lists, a quote, code, a table, a rule and an image, with no classes.
// Written as elements here, since a story may not write HTML from a string (Trusted Types); an app passes its
// sanitized HTML the same way, or renders its Markdown to elements.
function Article() {
  return <>
    <h2>Getting started</h2>
    <p>Serupa styles your app's screens with components. Content written in Markdown, such as this help page, has <a href="#install">plain links</a>, <strong>bold</strong>, <em>emphasis</em> and <code>inline code</code>.</p>
    <ul><li>Install the package.</li><li>Import the styles once.<ul><li>Or link the CSS file from a plain page.</li></ul></li><li>Render a component.</li></ul>
    <h3 id="install">Install</h3>
    <ol><li>Run the installer.</li><li>Restart the dev server.</li></ol>
    <pre><code>{'npm install serupa-ds\nimport "serupa-ds/styles.css";'}</code></pre>
    <blockquote><p>Good defaults make the right thing the easy thing.</p></blockquote>
    <table><thead><tr><th>Plan</th><th>Seats</th><th>Price</th></tr></thead><tbody><tr><td>Free</td><td>3</td><td>$0</td></tr><tr><td>Team</td><td>25</td><td>$12 a seat</td></tr></tbody></table>
    <hr />
    <dl><dt>Token</dt><dd>A named value, such as a color or a space.</dd></dl>
    <p><img src="data:image/png;base64," alt="A diagram of the install steps" width={320} height={120} /></p>
  </>;
}

const meta = {
  title: 'Components/Layout and type/Prose',
  component: Prose,
  args: { as: 'article' },
  render: (args) => <Prose {...args}><Article /></Prose>,
} satisfies Meta<typeof Prose>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// The stress story (G14): an unbroken URL, a long word, a wide table and a long code line in a narrow column. The
// text wraps; the table and the code scroll in their own boxes, not the page.
export const LongContent: Story = {
  render: (args) => <div style={{ maxWidth: 280 }}><Prose {...args}>
    <h2>Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenversicherung</h2>
    <p>See https://example.com/a/very/long/path/that/does/not/break/anywhere/on/its/own/without/help/from/css for details.</p>
    <pre><code>const veryLongVariableName = someFunctionWithALongName(argumentNumberOne, argumentNumberTwo, argumentNumberThree);</code></pre>
    <table><thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Location</th><th>Started</th><th>Calls</th></tr></thead><tbody><tr><td>Maximiliana Wolfeschlegelsteinhausen</td><td>Administrator</td><td>Billing and invoicing</td><td>Jakarta Selatan</td><td>2024-03-01</td><td>1,204</td></tr></tbody></table>
  </Prose></div>,
};
