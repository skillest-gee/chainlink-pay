// Environment validation utility
export interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    stacksNetwork: string;
    contractAddress: string;
    contractName: string;
    merchantAddress: string;
    openRouterApiKey: string;
    axelarEnv: string;
  };
}

export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required environment variables
  const stacksNetwork = process.env.REACT_APP_STACKS_NETWORK || 'testnet';
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
  const contractName = process.env.REACT_APP_CONTRACT_NAME || 'chainlink-pay';
  const merchantAddress = process.env.REACT_APP_MERCHANT_ADDRESS || '';
  const openRouterApiKey = process.env.REACT_APP_OPENROUTER_API_KEY || '';
  const axelarEnv = process.env.REACT_APP_AXELAR_ENV || 'testnet';
  
  // Validate Stacks network
  if (!stacksNetwork || !['testnet', 'mainnet'].includes(stacksNetwork)) {
    errors.push('REACT_APP_STACKS_NETWORK must be "testnet" or "mainnet"');
  }
  
  // Validate contract address
  if (!contractAddress) {
    errors.push('REACT_APP_CONTRACT_ADDRESS is required');
  } else if (contractAddress === 'ST000000000000000000002AMW42H') {
    warnings.push('Using placeholder contract address - contract not deployed');
  } else if (!contractAddress.startsWith('ST')) {
    errors.push('Invalid contract address format');
  }
  
  // Validate contract name
  if (!contractName) {
    errors.push('REACT_APP_CONTRACT_NAME is required');
  }
  
  // Validate merchant address
  if (!merchantAddress) {
    errors.push('REACT_APP_MERCHANT_ADDRESS is required');
  } else if (!merchantAddress.startsWith('ST')) {
    errors.push('Invalid merchant address format');
  }
  
  // Validate OpenRouter API key
  if (!openRouterApiKey) {
    warnings.push('REACT_APP_OPENROUTER_API_KEY not set - AI features will not work');
  } else if (!openRouterApiKey.startsWith('sk-or-v1-')) {
    warnings.push('Invalid OpenRouter API key format');
  }
  
  // Validate Axelar environment
  if (!axelarEnv || !['testnet', 'mainnet'].includes(axelarEnv)) {
    warnings.push('REACT_APP_AXELAR_ENV must be "testnet" or "mainnet"');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      stacksNetwork,
      contractAddress,
      contractName,
      merchantAddress,
      openRouterApiKey,
      axelarEnv
    }
  };
}

export function getEnvironmentStatus(): string {
  const validation = validateEnvironment();
  
  if (validation.isValid && validation.warnings.length === 0) {
    return 'production-ready';
  } else if (validation.isValid && validation.warnings.length > 0) {
    return 'demo-mode';
  } else {
    return 'configuration-error';
  }
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  const status = getEnvironmentStatus();
  
  console.log('🔧 Environment Status:', status);
  console.log('📋 Configuration:', validation.config);
  
  if (validation.errors.length > 0) {
    console.error('❌ Configuration Errors:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:', validation.warnings);
  }
  
  if (status === 'demo-mode') {
    console.log('🎭 Running in DEMO MODE - Some features may be limited');
  } else if (status === 'production-ready') {
    console.log('🚀 Running in PRODUCTION MODE - All features enabled');
  }
}
