import { describe, expect, test } from 'vitest';
import { DEFAULT_LABELS, idLabels } from './labels';

// Every word a component says or shows on its own, in English and Indonesian, called with sample arguments: none is
// empty, none has doubled or stray punctuation or spacing, and none is left in English in the Indonesian set.
// Sample arguments for each label that's a function. A new one needs a line here, so its words are checked too.
const ARGS: Record<string, unknown[]> = {
  page: [3], stepOf: [2, 5], slideOf: [2, 5], moreToasts: [9], toastShortcut: ['F8'],
  contrast: ['4.5'], lowContrast: ['4.5'], meterZone: ['92%', 'high'], colorName: ['blue', 'dark'],
  reorderGrabbed: ['Apollo', 2, 5], reorderMoved: ['Apollo', 2, 5], reorderDropped: ['Apollo', 2, 5], reorderCancelled: ['Apollo', 2, 5],
  avatarMore: [3], avatarStatus: ['online'], charactersLeft: [12], clearValue: ['Email'], inputNotAccepted: ['abc'],
  keyName: ['Up arrow'], tableSorted: ['Amount', 'ascending'], resultsCount: [3],
};
function said(set: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(set).map(([k, v]) => {
    if (typeof v !== 'function') return [k, String(v)];
    if (!ARGS[k]) throw new Error(`labels.test.tsx: add sample arguments for the "${k}" label to ARGS`);
    return [k, String((v as (...a: unknown[]) => unknown)(...ARGS[k]))];
  }));
}
// Words that are the same in both languages. "Slide" is the usual loanword in Indonesian.
const SAME = new Set(['menu', 'ok', 'hexCode', 'sliderMinimum', 'slideRole']);

describe('labels', () => {
  const en = said(DEFAULT_LABELS as unknown as Record<string, unknown>), id = said(idLabels as unknown as Record<string, unknown>);
  test('the two sets have the same keys', () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
  });
  test('no label is empty, untrimmed, or has doubled punctuation or spaces', () => {
    const bad = (set: Record<string, string>) => Object.entries(set).filter(([, t]) => !t.trim() || t !== t.trim() || /\.\.(?!\.)|\.\s*\.|,\s*[,.]|\s[,.:;!?]|\s{2}|\.…|…\./.test(t)).map(([k, t]) => k + ': ' + t);
    expect([bad(en), bad(id)]).toEqual([[], []]);
  });
  test('no Indonesian label is still in English', () => {
    expect(Object.keys(en).filter((k) => !SAME.has(k) && en[k] === id[k] && /[a-z]{3}/i.test(en[k])).map((k) => k + ': ' + en[k])).toEqual([]);
  });
});
