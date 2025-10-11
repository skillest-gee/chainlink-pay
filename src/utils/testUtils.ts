/**
 * Testing utilities for ChainLinkPay
 * Provides mock data, test helpers, and validation functions
 */

import { PaymentLink } from '../services/paymentStorage';
import { validateBitcoinAddress, validateStacksAddress, validatePaymentAmount } from './security';

// Mock data for testing
export const MOCK_DATA = {
  // Mock Bitcoin addresses
  BITCOIN_ADDRESSES: {
    valid: [
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block
      '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Bech32
    ],
    invalid: [
      'invalid-address',
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN', // Too short
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaa' // Too long
    ]
  },

  // Mock Stacks addresses
  STACKS_ADDRESSES: {
    valid: [
      'SP000000000000000000002Q6VF78',
      'SM000000000000000000002Q6VF78',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
    ],
    invalid: [
      'invalid-address',
      'SP000000000000000000002Q6VF7', // Too short
      'SP000000000000000000002Q6VF78A' // Too long
    ]
  },

  // Mock payment amounts
  PAYMENT_AMOUNTS: {
    valid: [
      '0.00000001', // 1 satoshi
      '0.001', // 1 mBTC
      '1.0', // 1 BTC
      '100.5', // 100.5 BTC
      '1000000' // 1M BTC (max)
    ],
    invalid: [
      '0', // Zero
      '-1', // Negative
      '0.000000001', // Too small (less than 1 satoshi)
      '1000001', // Too large
      'abc', // Not a number
      '1.123456789' // Too many decimals
    ]
  },

  // Mock payment links
  PAYMENT_LINKS: [
    {
      id: 'test-payment-1',
      amount: '0.001',
      description: 'Test payment 1',
      status: 'pending' as const,
      createdAt: Date.now() - 3600000, // 1 hour ago
      expiresAt: Date.now() + 3600000, // 1 hour from now
      merchantAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      paymentType: 'BTC' as const
    },
    {
      id: 'test-payment-2',
      amount: '10.0',
      description: 'Test payment 2',
      status: 'paid' as const,
      createdAt: Date.now() - 7200000, // 2 hours ago
      paidAt: Date.now() - 1800000, // 30 minutes ago
      txHash: 'test-tx-hash-123',
      payerAddress: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      merchantAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      paymentType: 'BTC' as const
    }
  ] as PaymentLink[],

  // Mock smart contract data
  SMART_CONTRACTS: {
    simple: {
      name: 'SimplePayment',
      description: 'A simple payment contract',
      code: `(define-data-var total-payments uint u0)
(define-public (create-payment (amount uint) (description (string-utf8 256)))
  (begin
    (var-set total-payments (+ (var-get total-payments) u1))
    (ok true)
  )
)`,
      functions: ['create-payment'],
      variables: ['total-payments']
    },
    complex: {
      name: 'AdvancedPayment',
      description: 'An advanced payment contract with escrow',
      code: `(define-data-var total-payments uint u0)
(define-data-var total-volume uint u0)
(define-map payments uint {amount: uint, description: (string-utf8 256), status: (string-utf8 20)})

(define-public (create-payment (amount uint) (description (string-utf8 256)))
  (begin
    (var-set total-payments (+ (var-get total-payments) u1))
    (var-set total-volume (+ (var-get total-volume) amount))
    (map-set payments (var-get total-payments) {amount: amount, description: description, status: "pending"})
    (ok (var-get total-payments))
  )
)`,
      functions: ['create-payment'],
      variables: ['total-payments', 'total-volume', 'payments']
    }
  }
};

/**
 * Test validation functions
 */
export function runValidationTests(): { passed: number; failed: number; results: any[] } {
  const results: any[] = [];
  let passed = 0;
  let failed = 0;

  // Test Bitcoin address validation
  MOCK_DATA.BITCOIN_ADDRESSES.valid.forEach(address => {
    const result = validateBitcoinAddress(address);
    if (result) {
      passed++;
      results.push({ test: `Valid Bitcoin address: ${address}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Valid Bitcoin address: ${address}`, status: 'FAIL' });
    }
  });

  MOCK_DATA.BITCOIN_ADDRESSES.invalid.forEach(address => {
    const result = validateBitcoinAddress(address);
    if (!result) {
      passed++;
      results.push({ test: `Invalid Bitcoin address: ${address}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Invalid Bitcoin address: ${address}`, status: 'FAIL' });
    }
  });

  // Test Stacks address validation
  MOCK_DATA.STACKS_ADDRESSES.valid.forEach(address => {
    const result = validateStacksAddress(address);
    if (result) {
      passed++;
      results.push({ test: `Valid Stacks address: ${address}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Valid Stacks address: ${address}`, status: 'FAIL' });
    }
  });

  MOCK_DATA.STACKS_ADDRESSES.invalid.forEach(address => {
    const result = validateStacksAddress(address);
    if (!result) {
      passed++;
      results.push({ test: `Invalid Stacks address: ${address}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Invalid Stacks address: ${address}`, status: 'FAIL' });
    }
  });

  // Test payment amount validation
  MOCK_DATA.PAYMENT_AMOUNTS.valid.forEach(amount => {
    const result = validatePaymentAmount(amount);
    if (result.valid) {
      passed++;
      results.push({ test: `Valid payment amount: ${amount}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Valid payment amount: ${amount}`, status: 'FAIL', error: result.error });
    }
  });

  MOCK_DATA.PAYMENT_AMOUNTS.invalid.forEach(amount => {
    const result = validatePaymentAmount(amount);
    if (!result.valid) {
      passed++;
      results.push({ test: `Invalid payment amount: ${amount}`, status: 'PASS' });
    } else {
      failed++;
      results.push({ test: `Invalid payment amount: ${amount}`, status: 'FAIL' });
    }
  });

  return { passed, failed, results };
}

/**
 * Generate test payment link
 */
export function generateTestPaymentLink(overrides: Partial<PaymentLink> = {}): PaymentLink {
  const basePayment: PaymentLink = {
    id: `test-${Date.now()}`,
    amount: '0.001',
    description: 'Test payment',
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000, // 1 hour
    merchantAddress: MOCK_DATA.BITCOIN_ADDRESSES.valid[0],
    paymentType: 'BTC'
  };

  return { ...basePayment, ...overrides };
}

/**
 * Mock wallet connection for testing
 */
export function mockWalletConnection(type: 'stacks' | 'bitcoin' = 'bitcoin') {
  return {
    isConnected: true,
    address: type === 'bitcoin' 
      ? MOCK_DATA.BITCOIN_ADDRESSES.valid[0]
      : MOCK_DATA.STACKS_ADDRESSES.valid[0],
    balance: type === 'bitcoin' ? 0.5 : 1000,
    network: 'testnet',
    type
  };
}

/**
 * Mock API responses for testing
 */
export const MOCK_API_RESPONSES = {
  // Mock Stacks API responses
  stacks: {
    balance: {
      stx: { balance: '1000000000' }, // 1000 STX in microSTX
      total_sent: '0',
      total_received: '1000000000',
      total_fees_sent: '0',
      locked: '0',
      lock_height: 0,
      burnchain_lock_height: 0,
      burnchain_unlock_height: 0
    },
    transactions: {
      results: [
        {
          tx_id: 'test-tx-1',
          tx_status: 'success',
          tx_type: 'token_transfer',
          fee_rate: '1000',
          sender_address: MOCK_DATA.STACKS_ADDRESSES.valid[0],
          token_transfer: {
            recipient_address: MOCK_DATA.STACKS_ADDRESSES.valid[1],
            amount: '1000000',
            memo: 'Test transfer'
          }
        }
      ],
      total: 1,
      limit: 20,
      offset: 0
    }
  },

  // Mock Bitcoin API responses
  bitcoin: {
    balance: 0.5,
    transactions: [
      {
        txid: 'test-btc-tx-1',
        confirmations: 6,
        value: 100000, // 0.001 BTC in satoshis
        address: MOCK_DATA.BITCOIN_ADDRESSES.valid[0]
      }
    ]
  },

  // Mock AI service responses
  ai: {
    contractGeneration: {
      success: true,
      contract: MOCK_DATA.SMART_CONTRACTS.simple.code,
      explanation: 'This contract creates a simple payment tracking system.',
      functions: MOCK_DATA.SMART_CONTRACTS.simple.functions,
      variables: MOCK_DATA.SMART_CONTRACTS.simple.variables
    }
  },

  // Mock Axelar bridge responses
  axelar: {
    estimate: {
      sourceChain: 'bitcoin',
      destinationChain: 'stacks',
      amount: '0.001',
      estimatedFee: '0.0001',
      estimatedTime: 300, // 5 minutes
      route: ['bitcoin', 'axelar', 'stacks']
    }
  }
};

/**
 * Test environment setup
 */
export function setupTestEnvironment() {
  // Mock localStorage
  const mockStorage: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }
    },
    writable: true
  });

  // Mock fetch for API calls
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(MOCK_API_RESPONSES.stacks.balance),
    })
  ) as jest.Mock;

  // Mock crypto for secure ID generation
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    }
  });
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  private startTime: number = 0;
  private endTime: number = 0;

  start() {
    this.startTime = performance.now();
  }

  end() {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  measure<T>(fn: () => T): { result: T; duration: number } {
    this.start();
    const result = fn();
    const duration = this.end();
    return { result, duration };
  }

  async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start();
    const result = await fn();
    const duration = this.end();
    return { result, duration };
  }
}

/**
 * Test data cleanup
 */
export function cleanupTestData() {
  // Clear localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }

  // Clear any test cookies
  if (typeof document !== 'undefined') {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  }
}

/**
 * Generate test report
 */
export function generateTestReport(testResults: any[]): string {
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const passRate = ((passed / total) * 100).toFixed(1);

  return `
🧪 ChainLinkPay Test Report
============================
Total Tests: ${total}
Passed: ${passed} ✅
Failed: ${failed} ❌
Pass Rate: ${passRate}%

${failed > 0 ? `
Failed Tests:
${testResults.filter(r => r.status === 'FAIL').map(r => `- ${r.test}: ${r.error || 'Unknown error'}`).join('\n')}
` : 'All tests passed! 🎉'}
`;
}
