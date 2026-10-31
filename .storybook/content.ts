import * as React from 'react';

// Worst-case content (KW9): the Content menu in Storybook's toolbar swaps a story's sample data for the hardest
// content a real page gets, or for none, or for one, so a story that reads well with tidy demo data can be checked
// against the rest. The names are written for our users first (Indonesian and English), then the general cases.
// Our own list. Addresses are example.com, so none of them reach anyone.
export type Content = 'demo' | 'worst' | 'empty' | 'one';
export const CONTENT: ReadonlyArray<{ value: Content; title: string }> = [
  { value: 'demo', title: 'Demo content' },
  { value: 'worst', title: 'Worst case' },
  { value: 'empty', title: 'Empty' },
  { value: 'one', title: 'One item' },
];

/** The Content menu's choice, which preview.tsx's decorator provides around every story. */
export const ContentContext = React.createContext<Content>('demo');
export const useContent = (): Content => React.useContext(ContentContext);

export interface Person {
  name: string;
  /** Left out on purpose in the worst case: an optional field that isn't filled in. */
  email?: string;
  role?: string;
  status: 'Active' | 'Invited';
  calls: number;
}

const DEMO: Person[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', status: 'Active', calls: 1204 },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor', status: 'Active', calls: 318 },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'Viewer', status: 'Invited', calls: 0 },
  { name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Editor', status: 'Active', calls: 87 },
];

const WORST: Person[] = [
  // A long Indonesian name with a title and a hyphen, and a long address with no place to break.
  { name: 'Raden Ayu Kusumawardhani-Soerjosoemarno', email: 'kusumawardhani.soerjosoemarno.keuangan.jakarta@example.com', role: 'Administrator, billing and payroll', status: 'Active', calls: 1284 },
  // One name only, as many Indonesians have, and no email.
  { name: 'Suparman', role: 'Editor', status: 'Invited', calls: 1 },
  // A one-letter name, and no role.
  { name: 'J', email: 'j@example.com', status: 'Active', calls: 0 },
  // Starts with an emoji.
  { name: '🌺 Dewi Lestari', email: 'dewi@example.com', role: 'Viewer', status: 'Active', calls: 42 },
  // Diacritics stacked high and low.
  { name: 'Zoë Ðặng-Nguyễn Øvergård', email: 'zoe.dang@example.com', role: 'Editor', status: 'Active', calls: 7 },
  // Right to left, and Chinese.
  { name: 'فاطمة الزهراء', email: 'fatimah@example.com', role: 'Viewer', status: 'Invited', calls: 3 },
  { name: '王小明', email: 'wang@example.com', role: 'Viewer', status: 'Active', calls: 15 },
];

const PEOPLE: Record<Content, Person[]> = { demo: DEMO, worst: WORST, empty: [], one: DEMO.slice(0, 1) };

/** The people a story shows, for the Content menu's choice. */
export const usePeople = (): Person[] => PEOPLE[useContent()];

/** Names for a story that has its own demo list: that list, the worst-case names, none, or its first one. */
export const useNames = (demo: readonly string[]): string[] => {
  const content = useContent();
  return content === 'demo' ? [...demo] : content === 'one' ? demo.slice(0, 1) : PEOPLE[content].map((p) => p.name);
};
