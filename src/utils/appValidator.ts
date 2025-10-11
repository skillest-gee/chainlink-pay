// Comprehensive application validation utility
import { validateEnvironment, getEnvironmentStatus } from './environmentValidator';
import { paymentStorage } from '../services/paymentStorage';
import { aiService } from '../services/aiService';

export interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export interface AppValidationReport {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export class AppValidator {
  private results: ValidationResult[] = [];

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({ component, status, message, details });
  }

  async validateEnvironment(): Promise<void> {
    try {
      const validation = validateEnvironment();
      const status = getEnvironmentStatus();
      
      if (validation.isValid) {
        this.addResult('environment', 'pass', `Environment configuration is valid (${status})`);
      } else {
        this.addResult('environment', 'fail', `Environment configuration has errors: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        this.addResult('environment', 'warning', `Environment warnings: ${validation.warnings.join(', ')}`);
      }
    } catch (error) {
      this.addResult('environment', 'fail', `Environment validation failed: ${error}`);
    }
  }

  async validatePaymentStorage(): Promise<void> {
    try {
      // Test payment storage functionality
      const testPayment = {
        id: 'test-' + Date.now(),
        amount: '1.0',
        description: 'Test payment',
        status: 'pending' as const,
        createdAt: Date.now(),
        merchantAddress: 'test-merchant'
      };

      // Test save
      paymentStorage.savePaymentLink(testPayment);
      
      // Test retrieve
      const retrieved = paymentStorage.getAllPaymentLinks();
      const found = retrieved.find(p => p.id === testPayment.id);
      
      if (found) {
        this.addResult('payment-storage', 'pass', 'Payment storage is working correctly');
      } else {
        this.addResult('payment-storage', 'fail', 'Payment storage failed to save/retrieve data');
      }

      // Test stats
      const stats = paymentStorage.getPaymentStats('test-merchant');
      if (stats.totalLinks >= 0) {
        this.addResult('payment-storage', 'pass', 'Payment statistics calculation is working');
      } else {
        this.addResult('payment-storage', 'fail', 'Payment statistics calculation failed');
      }

      // Cleanup test data
      paymentStorage.deletePaymentLink(testPayment.id);
      
    } catch (error) {
      this.addResult('payment-storage', 'fail', `Payment storage validation failed: ${error}`);
    }
  }

  async validateAIService(): Promise<void> {
    try {
      const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        this.addResult('ai-service', 'warning', 'OpenRouter API key not configured - AI features disabled');
        return;
      }

      if (!apiKey.startsWith('sk-or-v1-')) {
        this.addResult('ai-service', 'warning', 'Invalid OpenRouter API key format');
        return;
      }

      // Test AI service with a simple request
      const testRequest = {
        description: 'Test contract generation',
        template: 'payment',
        language: 'clarity',
        requirements: ['Basic functionality']
      };

      try {
        const response = await aiService.generateContract(testRequest);
        
        if (response.contract && response.contract.length > 0) {
          this.addResult('ai-service', 'pass', 'AI service is working correctly');
        } else {
          this.addResult('ai-service', 'fail', 'AI service returned empty response');
        }
      } catch (error) {
        this.addResult('ai-service', 'fail', `AI service test failed: ${error}`);
      }
      
    } catch (error) {
      this.addResult('ai-service', 'fail', `AI service validation failed: ${error}`);
    }
  }

  async validateWalletIntegration(): Promise<void> {
    try {
      // Check if wallet providers are available
      const hasStacksConnect = typeof (window as any).StacksConnect !== 'undefined';
      const hasBitcoinWallets = 
        typeof (window as any).unisat !== 'undefined' ||
        typeof (window as any).okxwallet !== 'undefined' ||
        typeof (window as any).bitget !== 'undefined';

      if (hasStacksConnect) {
        this.addResult('wallet-integration', 'pass', 'Stacks wallet integration available');
      } else {
        this.addResult('wallet-integration', 'warning', 'Stacks wallet not detected - user needs to install wallet');
      }

      if (hasBitcoinWallets) {
        this.addResult('wallet-integration', 'pass', 'Bitcoin wallet integration available');
      } else {
        this.addResult('wallet-integration', 'warning', 'Bitcoin wallet not detected - user needs to install wallet');
      }
      
    } catch (error) {
      this.addResult('wallet-integration', 'fail', `Wallet integration validation failed: ${error}`);
    }
  }

  async validateNetworkConnectivity(): Promise<void> {
    try {
      // Test Stacks API connectivity
      const stacksApiUrl = process.env.REACT_APP_STACKS_API_URL || 'https://api.testnet.hiro.so';
      
      const response = await fetch(`${stacksApiUrl}/v2/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        this.addResult('network-connectivity', 'pass', 'Stacks API is accessible');
      } else {
        this.addResult('network-connectivity', 'fail', `Stacks API returned status: ${response.status}`);
      }
      
    } catch (error) {
      this.addResult('network-connectivity', 'fail', `Network connectivity test failed: ${error}`);
    }
  }

  async validateUIComponents(): Promise<void> {
    try {
      // Check if required UI libraries are loaded
      const hasChakraUI = typeof (window as any).ChakraUI !== 'undefined' || 
                         document.querySelector('[data-chakra-ui]') !== null;
      
      const hasReactRouter = typeof (window as any).ReactRouter !== 'undefined' ||
                            document.querySelector('[data-react-router]') !== null;

      if (hasChakraUI) {
        this.addResult('ui-components', 'pass', 'Chakra UI is loaded');
      } else {
        this.addResult('ui-components', 'warning', 'Chakra UI not detected - UI may not render correctly');
      }

      if (hasReactRouter) {
        this.addResult('ui-components', 'pass', 'React Router is loaded');
      } else {
        this.addResult('ui-components', 'warning', 'React Router not detected - navigation may not work');
      }
      
    } catch (error) {
      this.addResult('ui-components', 'fail', `UI components validation failed: ${error}`);
    }
  }

  async runFullValidation(): Promise<AppValidationReport> {
    this.results = [];
    
    console.log('🔍 Starting comprehensive application validation...');
    
    await this.validateEnvironment();
    await this.validatePaymentStorage();
    await this.validateAIService();
    await this.validateWalletIntegration();
    await this.validateNetworkConnectivity();
    await this.validateUIComponents();
    
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      warnings: this.results.filter(r => r.status === 'warning').length
    };

    let overall: 'healthy' | 'degraded' | 'critical';
    if (summary.failed === 0 && summary.warnings === 0) {
      overall = 'healthy';
    } else if (summary.failed === 0) {
      overall = 'degraded';
    } else {
      overall = 'critical';
    }

    const report: AppValidationReport = {
      overall,
      timestamp: Date.now(),
      results: this.results,
      summary
    };

    console.log('📊 Validation Report:', report);
    return report;
  }
}

export const appValidator = new AppValidator();
