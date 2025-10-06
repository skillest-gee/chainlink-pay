import { ExtractedParams, Intent } from './types';

export function mapToIntent(nl: string, p: ExtractedParams): Intent {
  // Choose template heuristics
  let template: Intent['template'] = 'UNKNOWN';
  if (p.keywords.includes('escrow')) template = 'ESCROW';
  else if (p.keywords.includes('split') || p.percentages.length >= 2) template = 'SPLIT';
  else if (p.keywords.includes('subscription') || p.periods.length > 0) template = 'SUBSCRIPTION';

  const placeholders: Record<string, string> = {};
  const issues: Intent['issues'] = [];
  const suggestions: string[] = [];

  if (template === 'ESCROW') {
    placeholders['buyer'] = p.principals[0] || '';
    placeholders['seller'] = p.principals[1] || '';
    placeholders['arbiter'] = p.principals[2] || '';
    placeholders['deadline-height'] = String((p.deadlines[0]?.blockHeight) || (p.periods[0]?.blocks) || 0);
    placeholders['amount-ustx'] = String(Math.round((p.amounts[0] || 0) * 1_000_000));
    if (!placeholders['buyer'] || !placeholders['seller']) suggestions.push('Provide buyer and seller Stacks addresses.');
    if (!placeholders['arbiter']) suggestions.push('Provide an arbiter address or specify a time-based release.');
    if (Number(placeholders['deadline-height']) <= 0) suggestions.push('Add a block-height deadline for fallback release.');
  } else if (template === 'SPLIT') {
    placeholders['recipient-a'] = p.principals[0] || '';
    placeholders['recipient-b'] = p.principals[1] || '';
    placeholders['pct-a'] = String(p.percentages[0] || 0);
    placeholders['pct-b'] = String(p.percentages[1] || 0);
    if ((Number(placeholders['pct-a']) + Number(placeholders['pct-b'])) !== 100) suggestions.push('Ensure percentages add up to 100.');
  } else if (template === 'SUBSCRIPTION') {
    placeholders['provider'] = p.principals[0] || '';
    placeholders['subscriber'] = p.principals[1] || '';
    const blocks = p.periods[0]?.blocks || (p.periods[0]?.days ? p.periods[0]!.days! * 144 : 0);
    placeholders['period'] = String(blocks);
    placeholders['price-ustx'] = String(Math.round((p.amounts[0] || 0) * 1_000_000));
    if (Number(placeholders['period']) <= 0) suggestions.push('Specify the period in blocks or days.');
  }

  let confidence = 0.5;
  if (template !== 'UNKNOWN') confidence += 0.3;
  if (p.principals.length >= 2 || p.percentages.length >= 2 || p.periods.length > 0) confidence += 0.2;

  return { template, placeholders, confidence, issues, suggestions };
}

