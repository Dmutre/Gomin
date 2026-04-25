const MASK_SUFFIX = '***';

export interface MaskFieldsOptions {
  visibleChars?: number;
}

function maskValue(value: unknown, visibleChars: number): unknown {
  if (value === null || value === undefined) return value;
  const str = String(value);
  return str.length <= visibleChars
    ? MASK_SUFFIX
    : str.slice(0, visibleChars) + MASK_SUFFIX;
}

function applyMask(
  obj: unknown,
  fields: string[],
  visibleChars: number,
): unknown {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => applyMask(item, fields, visibleChars));
  }

  const result = { ...(obj as Record<string, unknown>) };

  for (const field of fields) {
    const dot = field.indexOf('.');
    if (dot === -1) {
      if (field in result) {
        result[field] = maskValue(result[field], visibleChars);
      }
    } else {
      const key = field.slice(0, dot);
      const rest = field.slice(dot + 1);
      if (key in result) {
        result[key] = applyMask(result[key], [rest], visibleChars);
      }
    }
  }

  return result;
}

export function maskFields<T extends object>(
  obj: T,
  fields: string[],
  options: MaskFieldsOptions = {},
): T {
  const { visibleChars = 3 } = options;
  return applyMask(obj, fields, visibleChars) as T;
}
