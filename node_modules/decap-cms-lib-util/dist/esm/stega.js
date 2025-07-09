import { vercelStegaEncode } from '@vercel/stega';
import { isImmutableMap, isImmutableList } from './types';

/**
 * Context passed to encode functions, containing the current state of the encoding process
 */

/**
 * Get the fields that should be used for encoding nested values
 */
function getNestedFields(f) {
  if (f) {
    if ('types' in f) {
      var _f$types;
      return (_f$types = f.types) !== null && _f$types !== void 0 ? _f$types : [];
    }
    if ('fields' in f) {
      var _f$fields;
      return (_f$fields = f.fields) !== null && _f$fields !== void 0 ? _f$fields : [];
    }
    if ('field' in f) {
      return f.field ? [f.field] : [];
    }
    return [f];
  }
  return [];
}

/**
 * Encode a string value by appending steganographic data
 * For markdown fields, encode each paragraph separately
 */
function encodeString(value, {
  fields,
  path
}) {
  var _fields$;
  const stega = vercelStegaEncode({
    decap: path
  });
  const isMarkdown = ((_fields$ = fields[0]) === null || _fields$ === void 0 ? void 0 : _fields$.widget) === 'markdown';
  if (isMarkdown && value.includes('\n\n')) {
    const blocks = value.split(/(\n\n+)/);
    return blocks.map(block => block.trim() ? block + stega : block).join('');
  }
  return value + stega;
}

/**
 * Encode a list of values, handling both simple values and nested objects/lists
 * For typed lists, use the type field to determine which fields to use
 */
function encodeList(list, ctx) {
  let newList = list;
  for (let i = 0; i < newList.size; i++) {
    const item = newList.get(i);
    if (isImmutableMap(item)) {
      const itemType = item.get('type');
      if (typeof itemType === 'string') {
        // For typed items, look up fields based on type
        const field = ctx.fields.find(f => f.name === itemType);
        const newItem = ctx.visit(item, getNestedFields(field), `${ctx.path}.${i}`);
        newList = newList.set(i, newItem);
      } else {
        // For untyped items, use current fields
        const newItem = ctx.visit(item, ctx.fields, `${ctx.path}.${i}`);
        newList = newList.set(i, newItem);
      }
    } else {
      // For simple values, use first field if available
      const field = ctx.fields[0];
      const newItem = ctx.visit(item, field ? [field] : [], `${ctx.path}.${i}`);
      if (newItem !== item) {
        newList = newList.set(i, newItem);
      }
    }
  }
  return newList;
}

/**
 * Encode a map of values, looking up the appropriate field for each key
 * and recursively encoding nested values
 */
function encodeMap(map, ctx) {
  let newMap = map;
  for (const [key, val] of newMap.entrySeq().toArray()) {
    const field = ctx.fields.find(f => f.name === key);
    if (field) {
      const fields = getNestedFields(field);
      const newVal = ctx.visit(val, fields, ctx.path ? `${ctx.path}.${key}` : key);
      if (newVal !== val) {
        newMap = newMap.set(key, newVal);
      }
    }
  }
  return newMap;
}

/**
 * Main entry point for encoding steganographic data into entry values
 * Uses a visitor pattern with caching to handle recursive structures
 */
export function encodeEntry(value, fields) {
  const plainFields = fields.toJS();
  const cache = new Map();
  function visit(value, fields, path = '') {
    const cached = cache.get(path);
    if (cached === value) return value;
    const ctx = {
      fields,
      path,
      visit
    };
    let result;
    if (isImmutableList(value)) {
      result = encodeList(value, ctx);
    } else if (isImmutableMap(value)) {
      result = encodeMap(value, ctx);
    } else if (typeof value === 'string') {
      result = encodeString(value, ctx);
    } else {
      result = value;
    }
    cache.set(path, result);
    return result;
  }
  return visit(value, plainFields);
}