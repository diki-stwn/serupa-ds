import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';

// These stories crash on purpose. React reports every caught error with console.error; keep those few quiet so the
// browser console only shows real problems.
const ON_PURPOSE = ['The chart data could not be read', 'Crashed on purpose'];
const quiet = (args: unknown[]) => args.some((a) => ON_PURPOSE.some((m) => (a instanceof Error ? a.message : String(a)).includes(m)));
if (typeof window !== 'undefined' && !(console.error as { serupaQuiet?: boolean }).serupaQuiet) {
  const error = console.error.bind(console);
  console.error = Object.assign((...args: unknown[]) => { if (!quiet(args)) error(...args); }, { serupaQuiet: true });
}

function Broken(): React.ReactElement { throw new Error('The chart data could not be read'); }
function Flaky() {
  const [crash, setCrash] = React.useState(false);
  if (crash) throw new Error('Crashed on purpose');
  return <Button variant="outline" destructive onClick={() => setCrash(true)}>Break this widget</Button>;
}

const meta = {
  title: 'Components/Feedback/ErrorBoundary',
  component: ErrorBoundary,
  args: { children: <Broken /> },
  argTypes: { children: { control: false }, fallback: { control: false } },
  render: (args) => <div style={{ maxWidth: 480 }}><ErrorBoundary {...args} /></div>,
} satisfies Meta<typeof ErrorBoundary>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A child threw while rendering: the default fallback, a danger Alert with Try again. */
export const Playground: Story = {};

/** Your own title and message. */
export const CustomText: Story = { args: { title: "Couldn't load the chart", description: 'The rest of the page still works. Try again in a moment.' } };

/** A fallback of your own, as a function of { error, reset }. */
export const CustomFallback: Story = {
  args: {
    fallback: ({ reset }) => <Card style={{ padding: 16 }}><p style={{ marginTop: 0 }}>The sales chart is unavailable.</p><Button size="sm" onClick={reset}>Reload chart</Button></Card>,
  },
};

/** Working until it breaks: press the button, then Try again. */
export const Interactive: Story = { args: { children: <Flaky /> } };
