/**
 * Security utilities for ChainLinkPay
 * Provides validation, sanitization, and security checks
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  // Bitcoin address validation (Legacy, SegWit, Bech32)
  BITCOIN_ADDRESS: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
  
  // Stacks address validation
  STACKS_ADDRESS: /^[SM][0-9A-Z]{38,41}$/,
  
  // Payment amount validation (positive number with max 8 decimals)
  PAYMENT_AMOUNT: /^[0-9]+(\.[0-9]{1,8})?$/,
  
  // Description validation (alphanumeric, spaces, basic punctuation)
  DESCRIPTION: /^[a-zA-Z0-9\s\-_.,!?()]{1,500}$/,
  
  // Contract name validation
  CONTRACT_NAME: /^[a-zA-Z][a-zA-Z0-9\-_]{0,39}$/,
  
  // API key validation
  API_KEY: /^[a-zA-Z0-9\-_]{20,100}$/
};

// Security constants
export const SECURITY_LIMITS = {
  MAX_PAYMENT_AMOUNT: 1000000, // 1M BTC (safety limit)
  MIN_PAYMENT_AMOUNT: 0.00000001, // 1 satoshi
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTRACT_NAME_LENGTH: 40,
  MAX_API_RETRIES: 3,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate Bitcoin address format
 */
export function validateBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  return VALIDATION_PATTERNS.BITCOIN_ADDRESS.test(address);
}

/**
 * Validate Stacks address format
 */
export function validateStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  return VALIDATION_PATTERNS.STACKS_ADDRESS.test(address);
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: string | number): { valid: boolean; error?: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Invalid amount format' };
  }
  
  if (numAmount < SECURITY_LIMITS.MIN_PAYMENT_AMOUNT) {
    return { valid: false, error: 'Amount too small (minimum 1 satoshi)' };
  }
  
  if (numAmount > SECURITY_LIMITS.MAX_PAYMENT_AMOUNT) {
    return { valid: false, error: 'Amount too large (maximum 1M BTC)' };
  }
  
  if (!VALIDATION_PATTERNS.PAYMENT_AMOUNT.test(amount.toString())) {
    return { valid: false, error: 'Invalid amount format' };
  }
  
  return { valid: true };
}

/**
 * Validate payment description
 */
export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description is required' };
  }
  
  if (description.length > SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: `Description too long (max ${SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH} characters)` };
  }
  
  if (!VALIDATION_PATTERNS.DESCRIPTION.test(description)) {
    return { valid: false, error: 'Description contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validate contract name
 */
export function validateContractName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Contract name is required' };
  }
  
  if (name.length > SECURITY_LIMITS.MAX_CONTRACT_NAME_LENGTH) {
    return { valid: false, error: `Contract name too long (max ${SECURITY_LIMITS.MAX_CONTRACT_NAME_LENGTH} characters)` };
  }
  
  if (!VALIDATION_PATTERNS.CONTRACT_NAME.test(name)) {
    return { valid: false, error: 'Invalid contract name format' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting implementation
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - SECURITY_LIMITS.RATE_LIMIT_WINDOW;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - SECURITY_LIMITS.RATE_LIMIT_WINDOW;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Generate secure random ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data for logging (not for security, just for debugging)
 */
export function hashForLogging(data: string): string {
  // Simple hash for logging purposes only
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  return VALIDATION_PATTERNS.API_KEY.test(apiKey);
}

/**
 * Check if running in secure context
 */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

/**
 * Security headers for API requests
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: Record<string, any> = {}): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`🔒 Security Event: ${event}`, {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...details
    });
  }
}

/**
 * Validate environment security
 */
export function validateEnvironmentSecurity(): { secure: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check HTTPS
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    warnings.push('Application not served over HTTPS');
  }
  
  // Check secure context
  if (!isSecureContext()) {
    warnings.push('Not running in secure context');
  }
  
  // Check for development environment in production
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    warnings.push('Development environment detected in production');
  }
  
  return {
    secure: warnings.length === 0,
    warnings
  };
}
