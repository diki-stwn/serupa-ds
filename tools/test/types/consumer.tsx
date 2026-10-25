// A project using the package, type-checked against the built types (dist/index.d.ts, dist/icons.d.ts) as it
// installs them: imported by the package's name, through package.json's exports. tools/test/types.mjs compiles it.
// Each assertion is a promise the API makes to projects; a @ts-expect-error line is a mistake the types must catch
// (the compiler fails when it stops catching it). Nothing here runs.
import * as React from 'react';
import {
  Button, Checkbox, Combobox, DatePicker, DateRangePicker, Dialog, IconButton, Image, Input, Link, NumberInput, RadioGroup, Radio,
  SegmentedControl, Select, SerupaProvider, Slider, SortableList, Stack, Tabs, toast, configure, enLabels, idLabels, useSerupa, version,
  type ButtonProps, type DateRange, type IconName, type SerupaLabels, type SliderValue, type ToastOptions,
} from 'serupa-ds';
import { type IconData } from 'serupa-ds/icons';

// Equal<A, B> is true only when A and B are the same type (not merely assignable either way).
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const is = <T extends true>(): T | void => undefined;
type ParamOf<F> = F extends (value: infer V) => unknown ? V : never;
type RefOf<C> = C extends React.ForwardRefExoticComponent<infer P> ? (P extends React.RefAttributes<infer E> ? E : never) : never;

// Refs reach the element each component documents.
is<Equal<RefOf<typeof Input>, HTMLInputElement>>();
is<Equal<RefOf<typeof Checkbox>, HTMLInputElement>>();
is<Equal<RefOf<typeof Select>, HTMLSelectElement>>();
is<Equal<RefOf<typeof Dialog>, HTMLDialogElement>>();
is<Equal<RefOf<typeof Link>, HTMLAnchorElement>>();

// Button: a <button> without href, a link with it, and each one's ref and click event to match.
const buttonRef = React.createRef<HTMLButtonElement>();
const anchorRef = React.createRef<HTMLAnchorElement>();
export const buttons = [
  <Button ref={buttonRef} type="submit" onClick={(_e) => is<Equal<typeof _e, React.MouseEvent<HTMLButtonElement>>>()}>Save</Button>,
  <Button ref={anchorRef} href="/docs" target="_blank" onClick={(_e) => is<Equal<typeof _e, React.MouseEvent<HTMLAnchorElement>>>()}>Docs</Button>,
  // An async onClick is allowed: the button waits for it.
  <Button onClick={async () => { await Promise.resolve(); }} successText="Saved">Save</Button>,
  // @ts-expect-error: a link has no type
  <Button href="/docs" type="submit">Docs</Button>,
  // @ts-expect-error: a <button>'s ref can't be an anchor's
  <Button ref={anchorRef}>Save</Button>,
  // @ts-expect-error: an unknown variant
  <Button variant="fancy">Save</Button>,
];
is<Equal<ButtonProps['href'], string | undefined>>();

// IconButton needs a label, and takes it instead of aria-label or children.
export const iconButtons = [
  <IconButton icon="more_vert" label="More" />,
  // @ts-expect-error: no label
  <IconButton icon="more_vert" />,
];

// Image needs alt ("" for a decorative picture).
export const images = [
  <Image src="/a.png" alt="" />,
  // @ts-expect-error: no alt
  <Image src="/a.png" />,
];

// Value callbacks get the value's own type.
is<Equal<ParamOf<React.ComponentProps<typeof Combobox>['onValueChange']>, string | null>>();
is<Equal<ParamOf<React.ComponentProps<typeof DatePicker>['onValueChange']>, Date | null>>();
is<Equal<ParamOf<React.ComponentProps<typeof DateRangePicker>['onValueChange']>, DateRange>>();
is<Equal<ParamOf<React.ComponentProps<typeof NumberInput>['onValueChange']>, number | null>>();
is<Equal<ParamOf<React.ComponentProps<typeof SegmentedControl>['onValueChange']>, string>>();
is<Equal<ParamOf<React.ComponentProps<typeof Tabs>['onValueChange']>, string>>();
is<Equal<DateRange, { start: Date | null; end: Date | null }>>();

// Generic components infer their value from what's passed.
declare const count: number;
declare const range: [number, number];
export const generics = [
  <RadioGroup value={count} onChange={(_v) => is<Equal<typeof _v, number>>()}><Radio value={2}>Two</Radio></RadioGroup>,
  <RadioGroup<'s' | 'm'> defaultValue="s" onChange={(_v) => is<Equal<typeof _v, 's' | 'm'>>()}><Radio value="s">S</Radio></RadioGroup>,
  // @ts-expect-error: a value outside the group's type
  <RadioGroup<'s' | 'm'> defaultValue="xl" />,
  <Slider value={count} onValueChange={(_v) => is<Equal<typeof _v, number>>()} aria-label="Volume" />,
  <Slider value={range} onValueChange={(_v) => is<Equal<typeof _v, [number, number]>>()} />,
  // @ts-expect-error: a range has two ends
  <Slider value={[10, 50, 90]} />,
  <SortableList items={[{ id: 1, name: 'Apollo' }]} getKey={(t) => t.id} getLabel={(t) => t.name} renderItem={(t) => t.name} onReorder={(_items) => is<Equal<typeof _items, { id: number; name: string }[]>>()} />,
  // @ts-expect-error: the item has no title
  <SortableList items={[{ id: 1, name: 'Apollo' }]} getKey={(t) => t.id} getLabel={(t) => t.title} renderItem={(t) => t.name} onReorder={() => {}} />,
];
is<Equal<SliderValue, number | [number, number]>>();

// Layout props take the spacing scale and the listed elements only.
export const layout = [
  <Stack gap={4} as="section" />,
  // @ts-expect-error: not a step of the spacing scale
  <Stack gap={7.5} />,
  // @ts-expect-error: not one of Stack's elements
  <Stack as="button" />,
];

// Icons: any Material Symbol by name, or the data from serupa-ds/icons.
const someIcon: IconData = { name: 'add', d: 'M0 0' };
is<Equal<IconData, { readonly name: string; readonly d: string }>>();
export const iconName: IconName = 'category';
export const iconData = <Button leftIcon={someIcon}>Add</Button>;

// Localization: labels are a full set; a provider takes some of them.
const words: SerupaLabels = idLabels;
is<Equal<typeof enLabels, SerupaLabels>>();
export const provider = <SerupaProvider locale="id-ID" labels={{ ...words }}><Input /></SerupaProvider>;
export const someLabels = <SerupaProvider labels={{}}><Input /></SerupaProvider>;
// @ts-expect-error: a word that no component uses
export const unknownLabel = <SerupaProvider labels={{ notAWord: 'x' }} />;
export const settings = () => useSerupa();

// The functions.
is<Equal<ReturnType<typeof toast>, string>>();
is<Equal<Parameters<typeof toast.dismiss>, [id?: string]>>();
const options: ToastOptions = { title: 'Saved', tone: 'success', action: { label: 'Undo', onClick: () => {} } };
toast(options);
toast('Saved');
// @ts-expect-error: an unknown tone
toast({ title: 'Saved', tone: 'great' });
configure({ link: 'a' });
is<Equal<typeof version, string>>();

// Plain pages: window.Serupa has every component, and theme only when theme.js is loaded.
is<Equal<typeof window.Serupa.Button, typeof Button>>();
is<Equal<typeof window.Serupa.version, string>>();
// @ts-expect-error: theme may be missing
window.Serupa.theme.set({ mode: 'dark' });
window.Serupa.theme?.set({ brand: 'violet' });
