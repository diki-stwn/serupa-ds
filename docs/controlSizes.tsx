// The Foundations/Control sizes page: the one-line controls side by side at each size, as
// src/internal/controlSizes.test.tsx holds them (one height, one corner radius and one text size per size), with the
// compact density beside the default. data-token-sheet puts the sheet in the visual test, so a drift shows there too.
import * as React from 'react';
import { Button } from '../src/components/Button/Button';
import { Combobox } from '../src/components/Combobox/Combobox';
import { DatePicker } from '../src/components/DatePicker/DatePicker';
import { Input } from '../src/components/Input/Input';
import { NumberInput } from '../src/components/NumberInput/NumberInput';
import { SegmentedControl } from '../src/components/SegmentedControl/SegmentedControl';
import { Select } from '../src/components/Select/Select';

type Size = 'sm' | 'md' | 'lg';
const OPTIONS = [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }];
const row = (size: Size) => [
  <Button key="b" size={size}>Save</Button>,
  <Input key="i" size={size} aria-label={`Name, ${size}`} placeholder="Name" />,
  <Select key="s" size={size} aria-label={`Status, ${size}`} options={[{ value: 'open', label: 'Open' }]} />,
  <Combobox key="c" size={size} aria-label={`Owner, ${size}`} placeholder="Owner" options={[{ value: 'ada', label: 'Ada' }]} />,
  <DatePicker key="d" size={size} aria-label={`Due, ${size}`} />,
  <NumberInput key="n" size={size} aria-label={`Seats, ${size}`} defaultValue={3} />,
  <SegmentedControl key="g" size={size} aria-label={`View, ${size}`} options={OPTIONS} defaultValue="list" />,
];
// Each control's column, so the rows line up: a date needs room for its whole format.
const CELL: Record<string, number | 'auto'> = { b: 'auto', d: 148, g: 'auto' };
const HEIGHT: Record<'comfortable' | 'compact', Record<Size, number>> = {
  comfortable: { sm: 24, md: 32, lg: 44 },
  compact: { sm: 24, md: 28, lg: 36 },
};

/** Each size as a row of controls on one baseline, in the default density and in data-density="compact". */
export function ControlSizes() {
  return <div data-token-sheet="control-sizes" style={{ display: 'grid', gap: 24 }}>
    {(['comfortable', 'compact'] as const).map((density) => <section key={density} data-density={density} style={{ display: 'grid', gap: 12 }}>
      <h2 className="sb-unstyled" style={{ margin: 0, font: '600 14px/20px var(--font-sans)' }}>{density === 'compact' ? 'data-density="compact"' : 'Default density'}</h2>
      {(['sm', 'md', 'lg'] as Size[]).map((size) => <div key={size} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <code style={{ inlineSize: 88, fontSize: 12 }}>{size} · {HEIGHT[density][size]}px</code>
        {row(size).map((el) => <span key={el.key} style={{ display: 'inline-flex', inlineSize: CELL[el.key as string] ?? 112, minInlineSize: el.key === 'b' ? 84 : undefined, maxInlineSize: '100%' }}>{el}</span>)}
      </div>)}
    </section>)}
  </div>;
}
