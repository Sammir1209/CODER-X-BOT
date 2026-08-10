import { DetectedField, FieldType } from '../types/checkout';

interface PatternRule {
  type: FieldType;
  autocomplete: RegExp;
  attributeRegex: RegExp;
  textRegex: RegExp;
}

const FIELD_PATTERNS: PatternRule[] = [
  {
    type: 'cardNumber',
    autocomplete: /^cc-number$/i,
    attributeRegex: /card[_-]?number|cc[_-]?num(ber)?|cardnum|pan[_-]?num|card[_-]?no|num[_-]?carte|kartennummer|numero[_-]?cartao|numero[_-]?carta/i,
    textRegex: /card\s*number|n[uú]mero\s*de\s*tarjeta|n[oº]\s*tarjeta|cc\s*num|num[eé]ro\s*(de\s*)?carte|kartennummer|n[uú]mero\s*do\s*cart[aã]o|numero\s*(di\s*)?carta/i,
  },
  {
    type: 'expiry',
    autocomplete: /^cc-exp$|^cc-exp-month$|^cc-exp-year$/i,
    attributeRegex: /exp(ir(y|ation))?|exp[_-]?date|cc[_-]?exp|mm\s*\/\s*yy|exp|validade|scadenza|ablauf/i,
    textRegex: /expi|valid\s*thru|fecha\s*de\s*vencimiento|caducidad|mm\s*\/\s*yy|vencimiento|date\s*d'expiration|g[uü]ltig\s*bis|ablaufdatum|data\s*de\s*validade|data\s*di\s*scadenza/i,
  },
  {
    type: 'cvc',
    autocomplete: /^cc-csc$/i,
    attributeRegex: /cvc|cvv|csc|security[_-]?code|cvn|code[_-]?sec|cod[_-]?seg/i,
    textRegex: /cvc|cvv|security\s*code|c[oó]digo\s*de\s*seguridad|csc|code\s*de\s*s[eé]curit[eé]|sicherheitscode|pr[uü]fnummer|c[oó]digo\s*de\s*seguran[cç]a|codice\s*di\s*sicurezza/i,
  },
  {
    type: 'cardholderName',
    autocomplete: /^cc-name$|^name$/i,
    attributeRegex: /card[_-]?holder|cc[_-]?name|name[_-]?on[_-]?card|card[_-]?name|billing[_-]?name|full[_-]?name|nom[_-]?carte|karteninhaber|nome[_-]?cartao|titolare[_-]?carta/i,
    textRegex: /cardholder|name\s*on\s*card|nombre\s*del\s*titular|titular|nombre|nombre\s*completo|full\s*name|nom\s*sur\s*la\s*carte|karteninhaber|nome\s*no\s*cart[aã]o|titolare\s*della\s*carta/i,
  },
  {
    type: 'zipCode',
    autocomplete: /^postal-code$/i,
    attributeRegex: /zip|postal[_-]?code|postcode|zipcode|code[_-]?postal|postleitzahl|codigo[_-]?postal|cap/i,
    textRegex: /zip\s*code|postal\s*code|c[oó]digo\s*postal|code\s*postal|postleitzahl|c[oó]digo\s*postal|cap/i,
  },
  {
    type: 'country',
    autocomplete: /^country$/i,
    attributeRegex: /country|billing[_-]?country|pais|pays|land|paese/i,
    textRegex: /country|pa[ií]s|pays|land|paese/i,
  },
  {
    type: 'email',
    autocomplete: /^email$/i,
    attributeRegex: /email|mail|contact[_-]?email|courriel|adresse[_-]?mail/i,
    textRegex: /email|correo|mail|correo\s*electr[oó]nico|courriel|adresse\s*email/i,
  },
  {
    type: 'phone',
    autocomplete: /^tel$|^tel-national$/i,
    attributeRegex: /phone|mobile|celular|telefono|tel|contact[_-]?phone|telephone|handy|telef/i,
    textRegex: /m[oó]vil|phone|tel[eé]fono|celular|n[uú]mero\s*de\s*m[oó]vil|t[eé]l[eé]phone|telefon|handynummer/i,
  },
  {
    type: 'address1',
    autocomplete: /^address-line1$|^street-address$/i,
    attributeRegex: /address|addr1|address1|street|billing[_-]?address|line1|strasse|indirizzo/i,
    textRegex: /address|direcci[oó]n|calle|l[ií]nea\s*1\s*de\s*direcci[oó]n|linea\s*1|rue|stra[ss]e|indirizzo/i,
  },
  {
    type: 'address2',
    autocomplete: /^address-line2$/i,
    attributeRegex: /address2|suite|apt|apartment/i,
    textRegex: /address\s*2|apt|dpto|departamento/i,
  },
  {
    type: 'city',
    autocomplete: /^address-level2$/i,
    attributeRegex: /city|town|locality|ville|stadt|cidade|citta/i,
    textRegex: /city|ciudad|localidad|ville|stadt|cidade|citt[aà]/i,
  },
  {
    type: 'state',
    autocomplete: /^address-level1$|^billing-state$/i,
    attributeRegex: /state|region|province|county|provincia|departamento|estado|kanton/i,
    textRegex: /state|provincia|estado|regi[oó]n|province|bundesland|regione/i,
  },
];

/**
 * Calculates a confidence score (0 to 100) for a given HTML element representing a specific payment field.
 */
export function scoreInputElement(el: HTMLInputElement | HTMLSelectElement): DetectedField | null {
  const autocomplete = el.getAttribute('autocomplete') || '';
  const name = el.getAttribute('name') || '';
  const id = el.id || '';
  const placeholder = el.getAttribute('placeholder') || '';
  const ariaLabel = el.getAttribute('aria-label') || '';
  const className = el.className || '';
  const stableFieldName = (el.getAttribute('data-elements-stable-field-name') || '').toLowerCase();
  
  // Find associated label text if present
  let labelText = '';
  if (id) {
    const labelEl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (labelEl) labelText = labelEl.textContent || '';
  }
  if (!labelText && el.closest('label')) {
    labelText = el.closest('label')?.textContent || '';
  }

  let bestType: FieldType | null = null;
  let maxScore = 0;

  for (const pattern of FIELD_PATTERNS) {
    let score = 0;

    // Safety Guard: Never classify as cardNumber if the field specifies name, holder, titular, or nombre (but allow cardnumber)
    const combinedInfo = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText}`.toLowerCase();
    const isNameExclusion = /holder|titular|nombre|owner|propietario|name/i.test(combinedInfo) && !/number|num/i.test(combinedInfo);
    if (pattern.type === 'cardNumber' && isNameExclusion) {
      continue;
    }

    // 0. Universal Stripe Element Stable Attribute (+80)
    if (stableFieldName) {
      if (pattern.type === 'cardNumber' && stableFieldName.includes('cardnumber')) score += 80;
      else if (pattern.type === 'expiry' && stableFieldName.includes('cardexpiry')) score += 80;
      else if (pattern.type === 'cvc' && stableFieldName.includes('cardcvc')) score += 80;
      else if (pattern.type === 'zipCode' && stableFieldName.includes('postalcode')) score += 80;
      else if (pattern.type === 'address1' && stableFieldName.includes('billingaddress')) score += 80;
    }

    // 1. Autocomplete attribute (+40)
    if (autocomplete && pattern.autocomplete.test(autocomplete)) {
      score += 40;
    }

    // 2. Name / ID match (+50)
    if (pattern.attributeRegex.test(name) || pattern.attributeRegex.test(id)) {
      score += 50;
    }

    // 3. Placeholder / Aria-label match (+30)
    if (
      pattern.attributeRegex.test(placeholder) ||
      pattern.textRegex.test(placeholder) ||
      pattern.attributeRegex.test(ariaLabel) ||
      pattern.textRegex.test(ariaLabel)
    ) {
      score += 30;
    }

    // 4. Label text match (+20)
    if (labelText && pattern.textRegex.test(labelText)) {
      score += 20;
    }

    // 5. Stripe InputElement class (+20 if matched via attributes)
    if (className.includes('InputElement') && (pattern.attributeRegex.test(name) || pattern.attributeRegex.test(placeholder) || pattern.attributeRegex.test(ariaLabel))) {
      score += 20;
    }

    if (score > maxScore) {
      maxScore = score;
      bestType = pattern.type;
    }
  }

  if (!bestType || maxScore < 20) {
    return null;
  }

  const selector = generateSelector(el);

  return {
    fieldType: bestType,
    score: Math.min(maxScore, 100),
    selector,
    isIframe: false,
    autocomplete: autocomplete || undefined,
    placeholder: placeholder || undefined,
    name: name || undefined,
    id: id || undefined,
    tagName: el.tagName.toLowerCase(),
  };
}

/**
 * Utility to generate a deterministic CSS selector for a DOM element
 */
export function generateSelector(el: Element): string {
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }
  const name = el.getAttribute('name');
  if (name) {
    return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
  }
  const dataQa = el.getAttribute('data-qa') || el.getAttribute('data-testid');
  if (dataQa) {
    return `[data-testid="${CSS.escape(dataQa)}"]`;
  }
  // Fallback to structural path
  const parts: string[] = [];
  let curr: Element | null = el;
  while (curr && curr.nodeType === Node.ELEMENT_NODE && curr.tagName.toLowerCase() !== 'body') {
    let selector = curr.tagName.toLowerCase();
    if (curr.id) {
      selector += `#${CSS.escape(curr.id)}`;
      parts.unshift(selector);
      break;
    } else {
      let sibling = curr;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.tagName === curr.tagName) nth++;
      }
      if (nth !== 1) selector += `:nth-of-type(${nth})`;
    }
    parts.unshift(selector);
    curr = curr.parentElement;
  }
  return parts.join(' > ');
}
