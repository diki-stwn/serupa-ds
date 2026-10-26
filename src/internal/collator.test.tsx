import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { SerupaProvider } from './provider';
import { useCollator, collatorFor } from './collator';

// Shows the words in the order each Collator puts them.
function Sorted({ id, words, options }: { id: string; words: string[]; options?: Parameters<typeof useCollator>[0] }) {
  const { compare } = useCollator(options);
  return <p id={id}>{words.slice().sort(compare).join(' ')}</p>;
}
const text = (id: string) => (document.getElementById(id) as HTMLElement).textContent;

describe('useCollator', () => {
  test('numbers in text sort as numbers; letters with marks sort beside their base letter in the provider locale', async () => {
    await render(<SerupaProvider locale="de-DE">
      <Sorted id="items" words={['Item 10', 'Item 2', 'Item 1']} />
      <Sorted id="de" words={['Zebra', 'Äpfel', 'Apfel', 'Birne']} />
    </SerupaProvider>);
    expect(text('items')).toBe('Item 1 Item 2 Item 10');
    expect(text('de')).toBe('Apfel Äpfel Birne Zebra');
  });

  test('the locale follows the provider: Swedish puts Ä after Z; its own locale option wins', async () => {
    await render(<SerupaProvider locale="sv-SE">
      <Sorted id="sv" words={['Äpple', 'Zebra', 'Apelsin']} />
      <Sorted id="own" words={['Äpple', 'Zebra', 'Apelsin']} options={{ locale: 'de-DE' }} />
    </SerupaProvider>);
    expect(text('sv')).toBe('Apelsin Zebra Äpple');
    expect(text('own')).toBe('Apelsin Äpple Zebra');
  });

  test('options pass through (numeric: false compares digits one by one; sensitivity: base ignores case and marks); each set is made once', async () => {
    await render(<SerupaProvider locale="en-US">
      <Sorted id="digits" words={['Item 10', 'Item 2']} options={{ numeric: false }} />
    </SerupaProvider>);
    expect(text('digits')).toBe('Item 10 Item 2');
    expect(collatorFor('en-US', { sensitivity: 'base' }).compare('resume', 'Résumé')).toBe(0);
    expect(collatorFor('en-US')).toBe(collatorFor('en-US'));
    expect(collatorFor('not a locale!').compare('a', 'b')).toBe(-1);
  });
});
