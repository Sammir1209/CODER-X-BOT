import { describe, it, expect } from 'vitest';
import { scoreInputElement, generateSelector } from '../../src/content/fieldMapper';

describe('fieldMapper heuristic candidate scoring engine', () => {
  it('correctly scores card number candidate input with autocomplete="cc-number"', () => {
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'cc-number');
    input.setAttribute('name', 'cardnumber');
    input.id = 'cc-num';

    const scored = scoreInputElement(input);
    expect(scored).not.toBeNull();
    expect(scored?.fieldType).toBe('cardNumber');
    expect(scored?.score).toBeGreaterThanOrEqual(90);
  });

  it('correctly scores CVC security code candidate input', () => {
    const input = document.createElement('input');
    input.setAttribute('name', 'cvc');
    input.setAttribute('placeholder', 'Security code (CVC)');

    const scored = scoreInputElement(input);
    expect(scored).not.toBeNull();
    expect(scored?.fieldType).toBe('cvc');
    expect(scored?.score).toBeGreaterThanOrEqual(50);
  });

  it('returns null for generic non-payment input', () => {
    const input = document.createElement('input');
    input.setAttribute('name', 'search_query');
    input.setAttribute('placeholder', 'Search items...');

    const scored = scoreInputElement(input);
    expect(scored).toBeNull();
  });

  it('generates valid CSS selector using element ID', () => {
    const input = document.createElement('input');
    input.id = 'payment-card-input';
    expect(generateSelector(input)).toBe('#payment-card-input');
  });
});
