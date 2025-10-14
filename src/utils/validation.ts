/**
 * Input validation utilities for the ChainLinkPay application
 */

// Stacks address validation
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Stacks addresses start with 'SP' (mainnet) or 'ST' (testnet)
  const stacksAddressRegex = /^[SP][0-9A-Z]{38}$/;
  return stacksAddressRegex.test(address);
}

// Bitcoin address validation (basic)
export function isValidBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Basic Bitcoin address patterns
  const bitcoinAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
  return bitcoinAddressRegex.test(address);
}

// Amount validation
export function isValidAmount(amount: string | number): { valid: boolean; error?: string } {
  if (!amount && amount !== 0) {
    return { valid: false, error: 'Amount is required' };
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount too large (max: 1,000,000)' };
  }
  
  return { valid: true };
}

// Email validation
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Description validation
export function isValidDescription(description: string): { valid: boolean; error?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description is required' };
  }
  
  if (description.trim().length < 3) {
    return { valid: false, error: 'Description must be at least 3 characters' };
  }
  
  if (description.length > 500) {
    return { valid: false, error: 'Description too long (max: 500 characters)' };
  }
  
  return { valid: true };
}

// Payment ID validation
export function isValidPaymentId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Payment ID should be alphanumeric and reasonable length
  const idRegex = /^[a-zA-Z0-9_-]{8,64}$/;
  return idRegex.test(id);
}

// Network validation
export function isValidNetwork(network: string): boolean {
  const validNetworks = ['testnet', 'mainnet'];
  return validNetworks.includes(network);
}

// Contract address validation
export function isValidContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Stacks contract addresses start with 'SP' (mainnet) or 'ST' (testnet)
  const contractAddressRegex = /^[SP][0-9A-Z]{38}$/;
  return contractAddressRegex.test(address);
}

// URL validation
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Form validation helper
export function validateForm(fields: Record<string, any>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate required fields
  for (const [field, value] of Object.entries(fields)) {
    if (field.includes('required') && (!value || value.toString().trim() === '')) {
      errors[field] = `${field.replace('required', '')} is required`;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Sanitize input
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Format address for display
export function formatAddress(address: string, length: number = 6): string {
  if (!address || typeof address !== 'string') return '';
  
  if (address.length <= length * 2) return address;
  
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

// Format amount for display
export function formatAmount(amount: number | string, decimals: number = 6): string {
  if (amount === null || amount === undefined) return '0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '0.00';
  
  return numAmount.toFixed(decimals);
}

// Validate transaction parameters
export function validateTransactionParams(params: {
  amount?: string | number;
  recipient?: string;
  description?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (params.amount !== undefined) {
    const amountValidation = isValidAmount(params.amount);
    if (!amountValidation.valid) {
      errors.push(amountValidation.error || 'Invalid amount');
    }
  }
  
  if (params.recipient) {
    if (!isValidStacksAddress(params.recipient) && !isValidBitcoinAddress(params.recipient)) {
      errors.push('Invalid recipient address');
    }
  }
  
  if (params.description) {
    const descValidation = isValidDescription(params.description);
    if (!descValidation.valid) {
      errors.push(descValidation.error || 'Invalid description');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
