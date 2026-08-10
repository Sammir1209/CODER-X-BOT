/**
 * CODER System — Card Generator Utility
 * 
 * Generates Luhn-valid card numbers from BIN prefixes with
 * random future expiry dates and CVVs.
 * 
 * Extracted from DashboardPage.tsx for reuse across popup and content script.
 */

import { detectCardBrand } from '../types/testCase';
import type { CardBrand } from '../utils/constants';

export interface GeneratedCard {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  brand: CardBrand;
}

/**
 * Generates a Luhn-valid card number from a BIN prefix.
 * Produces random future expiry date and appropriate CVV length.
 */
export function generateLuhnCard(bin: string): GeneratedCard {
  const cleanBin = bin.replace(/\D/g, '');
  const brand = detectCardBrand(cleanBin);
  const isAmex = brand === 'AMEX';
  const targetLength = isAmex ? 15 : 16;

  // Build card digits from BIN
  let cardDigits = cleanBin;
  while (cardDigits.length < targetLength - 1) {
    cardDigits += Math.floor(Math.random() * 10).toString();
  }

  // Calculate Luhn check digit
  let sum = 0;
  for (let i = 0; i < cardDigits.length; i++) {
    let digit = parseInt(cardDigits[i], 10);
    // In full card (targetLength), position from right for cardDigits[i] is (cardDigits.length + 1 - i).
    // Even positions from right must be doubled in Luhn.
    const isEvenPositionFromRight = (cardDigits.length - i) % 2 !== 0;
    if (isEvenPositionFromRight) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const fullNumber = cardDigits + checkDigit.toString();

  // Random future expiry (current month+1 to 5 years ahead)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const yearNum = currentYear + Math.floor(Math.random() * 5);
  let monthNum: number;
  if (yearNum === currentYear) {
    monthNum = currentMonth + Math.floor(Math.random() * (13 - currentMonth));
    if (monthNum > 12) monthNum = 12;
  } else {
    monthNum = Math.floor(Math.random() * 12) + 1;
  }

  // Random CVV (3 digits for most cards, 4 for Amex)
  const cvcLen = isAmex ? 4 : 3;
  let cvc = '';
  for (let i = 0; i < cvcLen; i++) {
    cvc += Math.floor(Math.random() * 10).toString();
  }

  return {
    number: fullNumber,
    expiryMonth: monthNum.toString().padStart(2, '0'),
    expiryYear: yearNum.toString(),
    cvc,
    brand,
  };
}

/**
 * Generates multiple Luhn-valid cards from a list of BIN prefixes.
 */
export function generateCardsFromBins(bins: string[], quantityPerBin: number): GeneratedCard[] {
  const cards: GeneratedCard[] = [];

  for (const bin of bins) {
    const cleanBin = bin.trim();
    if (!cleanBin || cleanBin.length < 4) continue;

    for (let i = 0; i < quantityPerBin; i++) {
      cards.push(generateLuhnCard(cleanBin));
    }
  }

  return cards;
}
