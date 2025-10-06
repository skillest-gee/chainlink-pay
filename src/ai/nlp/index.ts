import { extractParams } from './extract';
import { mapToIntent } from './map';
import { Intent } from './types';

export function interpretNaturalLanguage(text: string): Intent {
  const extracted = extractParams(text);
  return mapToIntent(text, extracted);
}

export * from './types';

