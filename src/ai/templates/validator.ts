import { ContractTemplate, TemplateInput } from './types';

export type ValidationIssue = { level: 'error' | 'warning'; message: string };

export function validateInputs(template: ContractTemplate, input: TemplateInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const ph of template.placeholders) {
    if (ph.required && !(ph.key in input)) {
      issues.push({ level: 'error', message: `Missing required: ${ph.key}` });
    }
    if (ph.type === 'uint' && ph.key in input) {
      const n = Number(input[ph.key]);
      if (!Number.isFinite(n) || n < 0) issues.push({ level: 'error', message: `${ph.key} must be a positive integer` });
    }
    if (ph.type === 'principal' && ph.key in input) {
      const s = String(input[ph.key]);
      if (!/^S[T|P][A-Za-z0-9\.\-]+$/.test(s)) issues.push({ level: 'error', message: `${ph.key} is not a valid principal` });
    }
  }
  return issues;
}

export function validateClaritySource(source: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!source.includes('(define-public')) issues.push({ level: 'warning', message: 'No public functions found' });
  if (source.length > 16_000) issues.push({ level: 'warning', message: 'Contract size may exceed limits' });
  // Basic guard to avoid leftover placeholders
  if (/\{\{.*?\}\}/.test(source)) issues.push({ level: 'error', message: 'Unfilled placeholders remain' });
  return issues;
}

