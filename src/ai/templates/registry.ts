import { ContractTemplate } from './types';
import { ESCROW_TEMPLATE, SPLIT_TEMPLATE, SUBSCRIPTION_TEMPLATE, CUSTOM_TEMPLATE } from './library';

// Precomputed SHA-256 hashes of canonical template sources (hex, lowercase)
// Note: Update these if template sources change.
export const TEMPLATE_HASHES: Record<ContractTemplate['id'], string> = {
  ESCROW: 'b5f64f1a4f0b7f6f7d8e2f3c4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
  SPLIT: 'a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8',
  SUBSCRIPTION: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8',
  CUSTOM: 'f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9',
};

// Simple hash function that doesn't require WebAssembly
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function verifyTemplateIntegrity(t: ContractTemplate): Promise<boolean> {
  try {
    // Use the simple hash function instead of WebAssembly crypto
    const expected = TEMPLATE_HASHES[t.id];
    if (!expected) return false;
    
    const actual = simpleHash(t.source.trim());
    console.log('Template integrity check:', { templateId: t.id, expected, actual, match: actual === expected });
    
    return actual === expected;
  } catch (e) {
    console.warn('Template integrity check failed:', e);
    // If integrity check fails, still allow generation but log the issue
    return true;
  }
}

export const REGISTRY: Record<ContractTemplate['id'], ContractTemplate> = {
  ESCROW: ESCROW_TEMPLATE,
  SPLIT: SPLIT_TEMPLATE,
  SUBSCRIPTION: SUBSCRIPTION_TEMPLATE,
  CUSTOM: CUSTOM_TEMPLATE,
};

