import { describe, expect, test } from 'vitest';
import { plural } from './plural';

const ru = { one: '# файл', few: '# файла', many: '# файлов', other: '# файла' };
const ar = { zero: 'لا ملفات', one: 'ملف واحد', two: 'ملفان', few: '# ملفات', many: '# ملفًا', other: '# ملف' };

describe('plural', () => {
  test('English: one and other', () => {
    expect(plural('en', 1, { one: '# result', other: '# results' })).toBe('1 result');
    expect(plural('en', 0, { one: '# result', other: '# results' })).toBe('0 results');
    expect(plural('en-US', 1200, { one: '# result', other: '# results' })).toBe('1,200 results');
  });

  test('Russian: one, few and many by the last digits', () => {
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => plural('ru', n, ru))).toEqual(
      ['1 файл', '2 файла', '5 файлов', '11 файлов', '21 файл', '22 файла', '25 файлов']);
  });

  test('Arabic: all six categories, with the count in Arabic digits', () => {
    expect([0, 1, 2, 3, 11, 100].map((n) => plural('ar-EG', n, ar))).toEqual(
      ['لا ملفات', 'ملف واحد', 'ملفان', '٣ ملفات', '١١ ملفًا', '١٠٠ ملف']);
  });

  test('a category left out falls back to other; Indonesian has only other', () => {
    expect(plural('ru', 5, { one: '# файл', other: '# файла' })).toBe('5 файла');
    expect(plural('id', 1, { one: '# berkas', other: '# berkas' })).toBe('1 berkas');
  });

  test('a locale Intl cannot read is treated as English; en_US is read as en-US', () => {
    expect(plural('not a locale!', 1, { one: 'one', other: 'other' })).toBe('one');
    expect(plural('en_US', 2, { one: 'one', other: 'other' })).toBe('other');
  });

  test('words without # are used as they are', () => {
    expect(plural('en', 3, { one: 'a file', other: 'some files' })).toBe('some files');
  });
});
