import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { transform } from 'sucrase';
import * as Serupa from '../index';
import { Alert } from '../components/Alert/Alert';
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary';
import { Textarea } from '../components/Textarea/Textarea';

/* Playground (127): JSX typed on the left runs against this build's components on the right. Every export of
   serupa-ds is in scope by name (Button, Card, SerupaProvider…), and React with its hooks. Write one element, or
   statements that end in a return: const [n, setN] = React.useState(0); return <Button onClick={…}>…</Button>.
   The code is the story's arg, so it can be changed in the Controls panel and travels in the URL. */

const SCOPE: Record<string, unknown> = { React, ...React, ...Serupa };
const NAMES = Object.keys(SCOPE).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default');

type Result = { element: React.ReactNode; error: null } | { element: null; error: string };
function run(code: string): Result {
  try {
    const body = /^\s*</.test(code) ? `return (${code}\n);` : code;
    const js = transform(body, { transforms: ['jsx', 'typescript'], jsxRuntime: 'classic', production: true }).code;
    // The code is the reader's own, run in their own browser, as in any live editor.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...NAMES, js) as (...args: unknown[]) => React.ReactNode;
    return { element: fn(...NAMES.map((n) => SCOPE[n])), error: null };
  } catch (e) {
    return { element: null, error: e instanceof Error ? e.message : String(e) };
  }
}

function Playground({ code: start }: { code: string }) {
  const [code, setCode] = React.useState(start);
  React.useEffect(() => setCode(start), [start]);
  const deferred = React.useDeferredValue(code);
  const result = React.useMemo(() => run(deferred), [deferred]);
  return (
    <div className="grid gap-4 md:grid-cols-2 items-start">
      <Textarea aria-label="Code" className="font-mono text-sm" rows={16} spellCheck={false} autoCapitalize="off" autoCorrect="off"
        value={code} onChange={(e) => setCode(e.target.value)} />
      <div aria-label="Preview" role="region" className="min-w-0">
        {result.error != null
          ? <Alert tone="danger" title="The code doesn't run">{result.error}</Alert>
          : <ErrorBoundary resetKeys={[deferred]} fallback={({ error }) => <Alert tone="danger" title="It threw while rendering">{error instanceof Error ? error.message : String(error)}</Alert>}>
            {result.element}
          </ErrorBoundary>}
      </div>
    </div>
  );
}

const meta = {
  title: 'Guides/Playground',
  component: Playground,
  parameters: { layout: 'padded', docs: { description: { component: 'Type JSX on the left and it runs against this build on the right. Every export of serupa-ds is in scope by name, and React with its hooks. Write one element, or statements that end in a return.' } } },
  argTypes: { code: { control: 'text', description: 'The code to run.' } },
} satisfies Meta<typeof Playground>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One element: a card with a form in it. */
export const Element: Story = {
  args: {
    code: `<Card>
  <div className="flex flex-col gap-4">
    <Field label="Email">
      <Input type="email" placeholder="ana@example.com" />
    </Field>
    <div className="flex gap-2">
      <Button>Subscribe</Button>
      <Button variant="outline">Not now</Button>
    </div>
  </div>
</Card>`,
  },
};

/** Statements that end in a return, with state. */
export const WithState: Story = {
  args: {
    code: `const [count, setCount] = useState(0);
return (
  <div className="flex items-center gap-3">
    <Button onClick={() => setCount(count + 1)}>Add one</Button>
    <Badge>{count}</Badge>
  </div>
);`,
  },
};
