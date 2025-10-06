import { ContractTemplate, GeneratedContract, TemplateInput, TemplatePlaceholder } from './types';

function sanitizePrincipal(value: unknown): string {
  if (typeof value !== 'string' || !/^S[T|P][A-Za-z0-9\.\-]+$/.test(value)) throw new Error('Invalid principal');
  return value;
}

function sanitizeUint(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid uint');
  return `u${Math.floor(n)}`;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid string');
  if (value.length > 256) throw new Error('String too long');
  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function sanitizeBuffer(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid buffer');
  const hex = value.toLowerCase();
  if (!/^0x[0-9a-f]*$/.test(hex)) throw new Error('Buffer must be hex');
  return hex;
}

function fillPlaceholder(ph: TemplatePlaceholder, raw: unknown): string {
  switch (ph.type) {
    case 'principal':
      return sanitizePrincipal(raw);
    case 'uint':
      return sanitizeUint(raw);
    case 'string':
      return sanitizeString(raw);
    case 'buffer':
      return sanitizeBuffer(raw);
    default:
      throw new Error('Unsupported placeholder type');
  }
}

export function generateContract(template: ContractTemplate, input: TemplateInput): GeneratedContract {
  // Validate required keys
  for (const ph of template.placeholders) {
    if (ph.required && !(ph.key in input)) {
      throw new Error(`Missing required placeholder: ${ph.key}`);
    }
  }

  // Replace placeholders safely
  let source = template.source;
  const filled: string[] = [];
  for (const ph of template.placeholders) {
    if (ph.key in input) {
      const safeValue = fillPlaceholder(ph, input[ph.key]);
      const re = new RegExp(`\\{\\{${ph.key}\\}\\}`, 'g');
      source = source.replace(re, safeValue);
      filled.push(ph.key);
    }
  }

  return {
    templateId: template.id,
    source,
    metadata: { version: template.version, filledKeys: filled },
  };
}

