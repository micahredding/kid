import { isColor, getColor, mixColors } from './colors.mjs';
import { isEmoji, getEmoji } from './emoji.mjs';
import { getVariable, setVariable, hasVariable } from './variables.mjs';

const OPERATORS = new Set(['+', '-', 'x', '*', '/', '÷', '=']);

function isOperator(token) {
  return OPERATORS.has(token);
}

function isNumber(token) {
  return /^\d+(\.\d+)?$/.test(token);
}

function isFraction(token) {
  return /^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(token);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}

function countDecimalPlaces(value) {
  const text = String(value);
  if (!text.includes('e')) return (text.split('.')[1] || '').length;

  const [coefficient, exponentText] = text.split('e');
  const decimals = (coefficient.split('.')[1] || '').length;
  return Math.max(0, decimals - Number(exponentText));
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function makeFraction(numerator, denominator) {
  const value = denominator === 0 ? numerator : numerator / denominator;
  const originalText = `${formatNumber(numerator)}/${formatNumber(denominator)}`;
  const scale = 10 ** Math.max(countDecimalPlaces(numerator), countDecimalPlaces(denominator));
  let reducedNumerator = Math.round(numerator * scale);
  let reducedDenominator = Math.round(denominator * scale);
  const divisor = gcd(reducedNumerator, reducedDenominator);

  reducedNumerator /= divisor;
  reducedDenominator /= divisor;

  if (reducedDenominator < 0) {
    reducedNumerator *= -1;
    reducedDenominator *= -1;
  }

  if (reducedDenominator === 1) {
    return { type: 'number', data: reducedNumerator };
  }

  return {
    type: 'fraction',
    data: {
      numerator: reducedNumerator,
      denominator: reducedDenominator,
      value,
      originalNumerator: numerator,
      originalDenominator: denominator,
      text: [
        originalText,
        `${formatNumber(reducedNumerator)}/${formatNumber(reducedDenominator)}`,
        formatNumber(value),
      ].filter((part, index, parts) => index === 0 || part !== parts[index - 1]).join(' = '),
    },
  };
}

function numericValue(value) {
  if (value.type === 'number') return value.data;
  if (value.type === 'fraction') return value.data.value;
  return null;
}

// Tokenize input, splitting on whitespace AND around operators even without spaces.
// "4+4" → ["4", "+", "4"], "4 + 4" → ["4", "+", "4"], "4x4" → ["4", "x", "4"]
// But "trex" should NOT split on "x" — only split "x" when between digits.
function tokenize(line) {
  // First split on whitespace
  const rawTokens = line.split(/\s+/).filter(Boolean);
  const result = [];

  for (const raw of rawTokens) {
    if (isFraction(raw)) {
      result.push(raw);
      continue;
    }

    // Split around +, -, /, ÷ (always operator characters)
    // Split around * only when adjacent to digits
    // Split around x only when between digits (to avoid splitting "trex")
    const parts = raw.split(/((?<=[0-9])[x*](?=[0-9])|[+=\-/÷])/);
    for (const part of parts) {
      if (part !== '') result.push(part);
    }
  }

  return result;
}

function resolveToken(token) {
  if (isFraction(token)) {
    const [numerator, denominator] = token.split('/').map(Number);
    return makeFraction(numerator, denominator);
  }
  if (isNumber(token)) {
    return { type: 'number', data: parseFloat(token) };
  }
  if (isColor(token)) {
    return { type: 'color', data: { ...getColor(token) } };
  }
  if (isEmoji(token)) {
    return { type: 'emoji', data: getEmoji(token) };
  }
  if (hasVariable(token)) {
    // Return a copy of the stored value
    const v = getVariable(token);
    return { ...v };
  }
  return { type: 'text', data: token };
}

function applyOp(left, op, right) {
  // = is the unshifted + key, treat as +
  if (op === '=') op = '+';

  const leftNumber = numericValue(left);
  const rightNumber = numericValue(right);

  // Numeric arithmetic
  if (leftNumber !== null && rightNumber !== null) {
    switch (op) {
      case '+': return { type: 'number', data: leftNumber + rightNumber };
      case '-': return { type: 'number', data: leftNumber - rightNumber };
      case 'x':
      case '*': return { type: 'number', data: leftNumber * rightNumber };
      case '/':
        return makeFraction(leftNumber, rightNumber);
      case '÷': return { type: 'number', data: rightNumber === 0 ? leftNumber : leftNumber / rightNumber };
    }
  }

  // Color + Color = mix
  if (op === '+' && left.type === 'color' && right.type === 'color') {
    return { type: 'color', data: mixColors(left.data, right.data) };
  }

  // ColoredBlocks + Color = mix the block color
  if (op === '+' && left.type === 'colored_blocks' && right.type === 'color') {
    return {
      type: 'colored_blocks',
      data: { count: left.data.count, color: mixColors(left.data.color, right.data) }
    };
  }

  // ColoredBlocks + Number = add more blocks
  if (op === '+' && left.type === 'colored_blocks' && right.type === 'number') {
    return {
      type: 'colored_blocks',
      data: { count: left.data.count + right.data, color: left.data.color }
    };
  }

  // Number + Color = colored blocks
  if (op === '+' && left.type === 'number' && right.type === 'color') {
    return { type: 'colored_blocks', data: { count: left.data, color: right.data } };
  }

  // Number + ColoredBlocks = add count
  if (op === '+' && left.type === 'number' && right.type === 'colored_blocks') {
    return {
      type: 'colored_blocks',
      data: { count: left.data + right.data.count, color: right.data.color }
    };
  }

  // ColoredBlocks + ColoredBlocks
  if (op === '+' && left.type === 'colored_blocks' && right.type === 'colored_blocks') {
    // If same color, add counts. Otherwise, mix colors and add counts.
    const color = arraysEqual(left.data.color.rgb, right.data.color.rgb)
      ? left.data.color
      : mixColors(left.data.color, right.data.color);
    return {
      type: 'colored_blocks',
      data: { count: left.data.count + right.data.count, color }
    };
  }

  // Multiply/divide: number op non-number doesn't make sense for *, treat as juxtaposition
  if ((op === 'x' || op === '*') && left.type === 'number') {
    return applyJuxtaposition(left, right);
  }

  // Default: concatenation for +, otherwise just juxtapose
  if (op === '+') {
    return concatenateValues(left, right);
  }
  return concatenateValues(left, { type: 'text', data: ` ${op} ` }, right);
}

function applyJuxtaposition(left, right) {
  // Number followed by something = repeat
  if (left.type === 'number') {
    const count = Math.max(0, Math.min(Math.floor(left.data), 1000)); // cap at 1000
    if (right.type === 'color') {
      return { type: 'colored_blocks', data: { count, color: right.data } };
    }
    if (right.type === 'colored_blocks') {
      return { type: 'colored_blocks', data: { count: count * right.data.count, color: right.data.color } };
    }
    if (right.type === 'emoji') {
      return { type: 'emoji', data: right.data.repeat(count) };
    }
    if (right.type === 'text') {
      return { type: 'text', data: Array(count).fill(right.data).join(' ') };
    }
    if (right.type === 'number') {
      // Two numbers juxtaposed: treat as separate tokens concatenated
      return { type: 'text', data: `${left.data} ${right.data}` };
    }
    if (right.type === 'list') {
      const items = [];
      for (let j = 0; j < count; j++) items.push(...right.data);
      return { type: 'list', data: items };
    }
  }

  if (left.type === 'fraction') {
    return concatenateValues(left, right);
  }

  // Color followed by number = colored blocks
  if (left.type === 'color' && right.type === 'number') {
    const count = Math.max(0, Math.min(Math.floor(right.data), 1000));
    return { type: 'colored_blocks', data: { count, color: left.data } };
  }

  // Default: concatenation
  return concatenateValues(left, right);
}

function concatenateValues(...values) {
  // Flatten list values, then combine adjacent text/emoji into single items
  const flat = [];
  for (const v of values) {
    if (v.type === 'list') {
      flat.push(...v.data);
    } else {
      flat.push(v);
    }
  }

  // If all items are simple text/emoji/number/fraction, collapse to a single text
  if (flat.every(v => v.type === 'text' || v.type === 'emoji' || v.type === 'number' || v.type === 'fraction')) {
    return { type: 'text', data: flat.map(v => valueToPlainString(v)).join('') };
  }

  return { type: 'list', data: flat };
}

function valueToPlainString(v) {
  switch (v.type) {
    case 'number': return String(v.data);
    case 'fraction': return v.data.text;
    case 'text': return v.data;
    case 'emoji': return v.data;
    case 'color': return `[${v.data.name || 'mixed'}]`;
    case 'colored_blocks': return `[${v.data.count}x ${v.data.color.name || 'mixed'}]`;
    default: return String(v.data);
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function evaluate(line) {
  try {
    // Sanitize: strip control characters, limit length
    line = line.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').slice(0, 1000);

    const tokens = tokenize(line.trim());
    if (tokens.length === 0) {
      return { type: 'text', data: '' };
    }

    // Handle assignment: set <name> <value...>
    if (tokens[0].toLowerCase() === 'set' && tokens.length >= 3) {
      const name = tokens[1];
      const rhs = evaluate(tokens.slice(2).join(' '));
      setVariable(name, rhs);
      return rhs;
    }

    let acc = resolveToken(tokens[0]);
    let i = 1;

    while (i < tokens.length) {
      const token = tokens[i];

      if (isOperator(token)) {
        // Operator: consume next token
        i++;
        if (i >= tokens.length) break; // trailing operator, just stop
        const right = resolveToken(tokens[i]);
        acc = applyOp(acc, token, right);
      } else {
        // Juxtaposition
        const right = resolveToken(token);
        acc = applyJuxtaposition(acc, right);
      }
      i++;
    }

    return acc;
  } catch {
    // Never crash: return the raw input
    return { type: 'text', data: line };
  }
}
