import { describe, it, expect } from 'vitest';
import { generateLuhnCard, generateCardsFromBins } from '../../src/utils/cardGenerator';
import { isValidLuhn } from '../../src/types/testCase';

describe('cardGenerator Luhn card generation', () => {
  it('generates Luhn-valid 16-digit card for standard Visa/Mastercard BINs', () => {
    const bins = ['453201', '554718', '512345', '400000'];
    for (const bin of bins) {
      for (let i = 0; i < 20; i++) {
        const card = generateLuhnCard(bin);
        expect(card.number).toHaveLength(16);
        expect(isValidLuhn(card.number)).toBe(true);
      }
    }
  });

  it('generates Luhn-valid 15-digit card for Amex BINs', () => {
    const amexBins = ['340000', '378282'];
    for (const bin of amexBins) {
      for (let i = 0; i < 20; i++) {
        const card = generateLuhnCard(bin);
        expect(card.number).toHaveLength(15);
        expect(isValidLuhn(card.number)).toBe(true);
      }
    }
  });

  it('generates multiple valid cards from batch BIN list', () => {
    const cards = generateCardsFromBins(['453201', '554718'], 5);
    expect(cards).toHaveLength(10);
    for (const card of cards) {
      expect(isValidLuhn(card.number)).toBe(true);
    }
  });
});
