/**
 * CODER System — Luhn Card Generator Service for Telegram Bot
 * Native ESM implementation for quick Luhn card generation.
 */

export function generateLuhnCard(bin) {
  const cleanBin = String(bin).replace(/\D/g, '');
  if (!cleanBin || cleanBin.length < 4) return null;

  const isAmex = cleanBin.startsWith('34') || cleanBin.startsWith('37');
  const targetLength = isAmex ? 15 : 16;

  let cardDigits = cleanBin;
  while (cardDigits.length < targetLength - 1) {
    cardDigits += Math.floor(Math.random() * 10).toString();
  }

  let sum = 0;
  for (let i = 0; i < cardDigits.length; i++) {
    let digit = parseInt(cardDigits[i], 10);
    const isEvenPositionFromRight = (cardDigits.length - i) % 2 !== 0;
    if (isEvenPositionFromRight) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const fullNumber = cardDigits + checkDigit.toString();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const yearNum = currentYear + Math.floor(Math.random() * 5);
  let monthNum;
  if (yearNum === currentYear) {
    monthNum = currentMonth + Math.floor(Math.random() * (13 - currentMonth));
    if (monthNum > 12) monthNum = 12;
  } else {
    monthNum = Math.floor(Math.random() * 12) + 1;
  }

  const cvcLen = isAmex ? 4 : 3;
  let cvc = '';
  for (let i = 0; i < cvcLen; i++) {
    cvc += Math.floor(Math.random() * 10).toString();
  }

  const monthStr = monthNum.toString().padStart(2, '0');
  const yearStr = yearNum.toString();
  const brand = isAmex ? 'AMEX' : cleanBin.startsWith('4') ? 'VISA' : cleanBin.startsWith('5') ? 'MASTERCARD' : 'DISCOVER';

  return {
    number: fullNumber,
    month: monthStr,
    year: yearStr,
    cvc,
    brand,
    formatted: `${fullNumber}|${monthStr}|${yearStr}|${cvc}`
  };
}

export function generateCards(bin, count = 10) {
  const cards = [];
  const qty = Math.min(Math.max(1, count), 50);
  for (let i = 0; i < qty; i++) {
    const card = generateLuhnCard(bin);
    if (card) cards.push(card);
  }
  return cards;
}
