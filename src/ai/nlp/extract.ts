import { ExtractedParams } from './types';

const principalRegex = /S[TP][A-Za-z0-9\.-]+/g;
const amountRegex = /(\d+(?:\.\d+)?)\s*(?:stx|ustx|\$)?/gi;
const percentRegex = /(\d{1,3})%/g;
const daysRegex = /(\d+)\s*(?:day|days)/i;
const blocksRegex = /(\d+)\s*(?:block|blocks)/i;

export function extractParams(text: string): ExtractedParams {
  const principals = (text.match(principalRegex) || []).slice(0, 10);
  const percentages = Array.from(text.matchAll(percentRegex)).map(m => Number(m[1])).filter(n => Number.isFinite(n));
  const amounts = Array.from(text.matchAll(amountRegex)).map(m => Number(m[1])).filter(n => Number.isFinite(n));

  const periods: ExtractedParams['periods'] = [];
  const deadlines: ExtractedParams['deadlines'] = [];
  const d = text.match(daysRegex);
  if (d) periods.push({ days: Number(d[1]) });
  const b = text.match(blocksRegex);
  if (b) periods.push({ blocks: Number(b[1]) });

  const keywords = [
    /escrow/i.test(text) ? 'escrow' : null,
    /split|share|percentage/i.test(text) ? 'split' : null,
    /subscribe|subscription|every month|monthly|period/i.test(text) ? 'subscription' : null,
    /deliver|delivery|milestone/i.test(text) ? 'delivery' : null,
    /deadline|expire/i.test(text) ? 'deadline' : null,
  ].filter(Boolean) as string[];

  return { amounts, principals, percentages, periods, deadlines, keywords };
}

