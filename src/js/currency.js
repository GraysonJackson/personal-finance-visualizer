/**
 * Currency and Integer-Cents Mathematical Engine
 * Guarantees zero floating-point rounding errors across all calculations.
 */

/**
 * Parses any currency string or number into exact integer cents.
 * Handles:
 *  - "$1,250.50" -> 125050
 *  - "-$1,850.00" -> -185000
 *  - "($700.00)" -> -70000 (accounting negative format)
 *  - "2500" -> 250000 (treats integers as whole dollars if no decimal point)
 *  - "25.5" -> 2550
 *  - "0.99" -> 99
 *
 * @param {string|number} raw
 * @returns {{ cents: number, isNegative: boolean, isValid: boolean, error?: string }}
 */
export function parseCurrencyToCents(raw) {
  const invalid=error=>({cents:0,isNegative:false,isValid:false,error});
  if(raw===null||raw===undefined)return invalid('Empty value');
  let text=String(raw).trim();if(!text)return invalid('Empty value');
  let negative=false;
  if(text.startsWith('(')&&text.endsWith(')')){negative=true;text=text.slice(1,-1).trim();}
  else if(text.endsWith('-')){negative=true;text=text.slice(0,-1).trim();}
  else if(text.startsWith('-')){negative=true;text=text.slice(1).trim();}
  text=text.replace(/^\$/,'').trim();
  if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text))return invalid('Use USD with at most two decimal places and valid thousands grouping');
  const [whole,fraction='']=text.replaceAll(',','').split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents))return invalid('Amount exceeds the safe integer range');
  return {cents:negative?-cents:cents,isNegative:negative,isValid:true};
}

/**
 * Formats integer cents into standard USD currency string ($X,XXX.XX).
 * @param {number} cents
 * @param {boolean} [showSign=false]
 * @returns {string}
 */
export function formatCents(cents, showSign = false) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) {
    return '$0.00';
  }
  const isNeg = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formattedDollars = dollars.toLocaleString('en-US');
  const centsStr = remainder.toString().padStart(2, '0');

  if (isNeg) {
    return `-$${formattedDollars}.${centsStr}`;
  }
  if (showSign && cents > 0) {
    return `+$${formattedDollars}.${centsStr}`;
  }
  return `$${formattedDollars}.${centsStr}`;
}

/**
 * Formats integer cents with exact cent annotation ($X,XXX.XX (XX,XXX¢)).
 * @param {number} cents
 * @returns {string}
 */
export function formatCentsExact(cents) {
  const formatted = formatCents(cents);
  const rawCents = Math.abs(cents).toLocaleString('en-US');
  return `${formatted} (${rawCents}¢)`;
}

/**
 * Sum an array of integer cents.
 * @param {number[]} centsArray
 * @returns {number}
 */
export function sumCents(values){return values.reduce((sum,value)=>{if(!Number.isSafeInteger(value)||!Number.isSafeInteger(sum+value))throw new RangeError('Amounts exceed the safe integer range');return sum+value;},0);}
