export type IntentTemplate = 'ESCROW' | 'SPLIT' | 'SUBSCRIPTION' | 'UNKNOWN';

export interface ExtractedParams {
  amounts: number[]; // STX (may be inferred from words)
  principals: string[]; // potential Stacks addresses/placeholders
  percentages: number[];
  periods: { blocks?: number; days?: number }[];
  deadlines: { blockHeight?: number; days?: number }[];
  keywords: string[];
}

export interface Intent {
  template: IntentTemplate;
  placeholders: Record<string, string>;
  confidence: number; // 0..1
  issues: { level: 'error' | 'warning'; message: string }[];
  suggestions: string[];
}

