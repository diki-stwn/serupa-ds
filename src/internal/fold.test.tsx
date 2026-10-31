import { describe, expect, test } from 'vitest';
import { fold } from './fold';

describe('fold', () => {
  test.each([
    ['lodz', 'Łódź'], ['da nang', 'Đà Nẵng'], ['orsted', 'Ørsted'], ['aeon', 'Æon'], ['strasse', 'Straße'], ['hal far', 'Ħal Far'],
    ['oeuvre', 'Œuvre'], ['thorsmork', 'Þórsmörk'], ['sao paulo', 'São Paulo'], ['angstrom', 'Ångström'], ['istanbul', 'İstanbul'],
    ['diyarbakir', 'Diyarbakır'], ['tokyo', 'ｔｏｋｙｏ'], ['トウキョウ', 'ﾄｳｷｮｳ'],
  ])('"%s" matches "%s"', (typed, label) => {
    expect(fold(label)).toContain(fold(typed));
  });

  test('typed with the accents, or in capitals, it still matches; different letters still differ', () => {
    expect(fold('ŁÓDŹ')).toBe(fold('lodz'));
    expect(fold('Straße')).toBe('strasse');
    expect(fold('ｔｏｋｙｏ')).toBe('tokyo');
    expect(fold('Paris')).not.toContain(fold('lodz'));
  });

  test('accents and Arabic and Hebrew points are ignored, but a vowel sign, tone mark or voicing mark makes another word (GR29)', () => {
    expect([fold('مُحَمَّد') === fold('محمد'), fold('שָׁלוֹם') === fold('שלום'), fold('Đà Nẵng') === fold('da nang'), fold('ｶﾞｽ') === fold('ガス')]).toEqual([true, true, true, true]);
    const differ = [['कम', 'काम'], ['दिल', 'दाल'], ['কম', 'কাম'], ['கடை', 'கோடை'], ['ไข่', 'ไข้'], ['カス', 'ガス']];
    expect(differ.filter(([typed, label]) => fold(label).includes(fold(typed)))).toEqual([]);
  });

  test('hiragana and katakana are one: "こーひー" finds "コーヒー" and "ｺｰﾋｰ"; a voicing mark still makes another word (L8E17)', () => {
    expect([fold('コーヒー') === fold('こーひー'), fold('ｺｰﾋｰ') === fold('こーひー'), fold('トウキョウ駅').includes(fold('とうきょう')), fold('ガス') === fold('がす'), fold('カス') === fold('がす')]).toEqual([true, true, true, true, false]);
  });

  test('Greek final sigma ς is σ: a search in capitals finds the word, and either sigma finds the other (L8E14)', () => {
    expect([fold('ΑΣ') === fold('ας'), fold('Αστυ').includes(fold('ΑΣ')), fold('ΟΔΟΣ') === fold('οδοσ'), fold('Οδός') === 'οδοσ']).toEqual([true, true, true, true]);
  });

  test('Cyrillic й, ў and ї are letters, not и, у and і with an accent; ё still finds е, and Latin ă and ĭ fold as before (GR41)', () => {
    const differ = [['мои', 'мой'], ['Сергеи', 'Сергей'], ['у', 'ў'], ['Киів', 'Київ'], ['йод', 'иод']];
    expect(differ.filter(([typed, label]) => fold(label).includes(fold(typed)))).toEqual([]);
    expect([fold('Ёлка') === fold('елка'), fold('ЙОД') === fold('йод'), fold('Brăila') === 'braila', fold('Ĭ') === 'i']).toEqual([true, true, true, true]);
  });
});
