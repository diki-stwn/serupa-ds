import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Checkbox } from '../components/Checkbox/Checkbox';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { Field } from '../components/Field/Field';
import { FileUpload } from '../components/FileUpload/FileUpload';
import { Heading } from '../components/Heading/Heading';
import { Input } from '../components/Input/Input';
import { Link } from '../components/Link/Link';
import { Loader } from '../components/Loader/Loader';
import { Radio, RadioGroup } from '../components/Radio/Radio';
import { Switch } from '../components/Switch/Switch';
import { Text } from '../components/Text/Text';

// A word, a URL or an id with no place to break: it wraps inside a narrow box instead of running out of it (AP1).
const LONG = 'https://example.com/a-very-long-path-with-no-spaces-at-all-0123456789abcdef';

describe('long words', () => {
  test('labels, hints, errors and text wrap a long word inside a 120px box', async () => {
    const screen = await render(<div data-testid="box" style={{ width: '120px' }}>
      <Checkbox>{LONG}</Checkbox>
      <RadioGroup aria-label="Plan"><Radio value="a">{LONG}</Radio></RadioGroup>
      <Switch>{LONG}</Switch>
      <Field label={LONG} hint={LONG} error={LONG}><Input /></Field>
      <EmptyState title={LONG} description={LONG} />
      <Loader variant="text" label={LONG} delay={0} />
      <FileUpload title={LONG} hint={LONG} />
      <Heading>{LONG}</Heading>
      <Text>{LONG}</Text>
      <p><Link href="#x">{LONG}</Link></p>
    </div>);
    const box = screen.getByTestId('box').element() as HTMLElement, right = box.getBoundingClientRect().right;
    // A field or a button keeps its text on one line and scrolls or truncates it, on purpose. The text Loader's glint
    // (data-words) is a window clipping a copy of the words as wide as the label, so it scrolls by design.
    const over = [...box.querySelectorAll<HTMLElement>('*')].filter((e) => e.getClientRects().length && !e.closest('input, button') && !e.hasAttribute('data-words') && (e.getBoundingClientRect().right > right + 0.5 || e.scrollWidth > Math.ceil(e.getBoundingClientRect().width) + 1))
      .map((e) => e.className || e.tagName);
    expect(over).toEqual([]);
  });
});
