/**
 * Environment Variables Validation
 * Comprehensive validation for all required environment variables
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

export interface EnvConfig {
  // Stacks Configuration
  REACT_APP_STACKS_NETWORK: string;
  REACT_APP_STACKS_API_URL: string;
  REACT_APP_CONTRACT_ADDRESS: string;
  REACT_APP_CONTRACT_NAME: string;
  REACT_APP_MERCHANT_ADDRESS: string;
  
  // OpenAI Configuration (Optional)
  REACT_APP_OPENAI_API_KEY?: string;
  
  // Axelar Configuration (Optional)
  REACT_APP_AXELAR_ENV?: string;
  REACT_APP_AXELAR_API_URL?: string;
  
  // Bridge Configuration (Optional)
  REACT_APP_BRIDGE_CONTRACT_ADDRESS?: string;
  REACT_APP_BRIDGE_CONTRACT_NAME?: string;
  
  // Development Configuration
  REACT_APP_DEBUG?: string;
  REACT_APP_DEMO_MODE?: string;
  REACT_APP_VERSION?: string;
}

/**
 * Required environment variables for core functionality
 */
const REQUIRED_ENV_VARS = [
  'REACT_APP_STACKS_NETWORK',
  'REACT_APP_STACKS_API_URL',
  'REACT_APP_CONTRACT_ADDRESS',
  'REACT_APP_CONTRACT_NAME',
  'REACT_APP_MERCHANT_ADDRESS'
] as const;

/**
 * Optional environment variables for enhanced functionality
 */
const OPTIONAL_ENV_VARS = [
  'REACT_APP_OPENAI_API_KEY',
  'REACT_APP_AXELAR_ENV',
  'REACT_APP_AXELAR_API_URL',
  'REACT_APP_BRIDGE_CONTRACT_ADDRESS',
  'REACT_APP_BRIDGE_CONTRACT_NAME',
  'REACT_APP_DEBUG',
  'REACT_APP_DEMO_MODE',
  'REACT_APP_VERSION'
] as const;

/**
 * Validate all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
      missing.push(varName);
    }
  }

  // Check for placeholder values
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  if (contractAddress === 'ST000000000000000000002AMW42H' || contractAddress === '') {
    errors.push('Contract address is not configured. Please set REACT_APP_CONTRACT_ADDRESS with your deployed contract address.');
  }

  // Check network configuration
  const network = process.env.REACT_APP_STACKS_NETWORK;
  if (network && !['testnet', 'mainnet'].includes(network)) {
    errors.push('REACT_APP_STACKS_NETWORK must be either "testnet" or "mainnet"');
  }

  // Check API URL format
  const apiUrl = process.env.REACT_APP_STACKS_API_URL;
  if (apiUrl && !apiUrl.startsWith('https://')) {
    warnings.push('REACT_APP_STACKS_API_URL should use HTTPS for security');
  }

  // Check OpenAI API key format
  const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith('sk-')) {
    warnings.push('REACT_APP_OPENAI_API_KEY format appears invalid (should start with "sk-")');
  }

  // Check demo mode
  const demoMode = process.env.REACT_APP_DEMO_MODE;
  if (demoMode === 'true') {
    warnings.push('Demo mode is enabled. Some features may be limited.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missing
  };
}

/**
 * Get environment configuration with defaults
 */
export function getEnvConfig(): EnvConfig {
  return {
    // Stacks Configuration
    REACT_APP_STACKS_NETWORK: process.env.REACT_APP_STACKS_NETWORK || 'testnet',
    REACT_APP_STACKS_API_URL: process.env.REACT_APP_STACKS_API_URL || 'https://api.testnet.hiro.so',
    REACT_APP_CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS || '',
    REACT_APP_CONTRACT_NAME: process.env.REACT_APP_CONTRACT_NAME || 'enhanced-payment',
    REACT_APP_MERCHANT_ADDRESS: process.env.REACT_APP_MERCHANT_ADDRESS || '',
    
    // OpenAI Configuration (Optional)
    REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY,
    
    // Axelar Configuration (Optional)
    REACT_APP_AXELAR_ENV: process.env.REACT_APP_AXELAR_ENV || 'testnet',
    REACT_APP_AXELAR_API_URL: process.env.REACT_APP_AXELAR_API_URL || 'https://api.axelarscan.io',
    
    // Bridge Configuration (Optional)
    REACT_APP_BRIDGE_CONTRACT_ADDRESS: process.env.REACT_APP_BRIDGE_CONTRACT_ADDRESS,
    REACT_APP_BRIDGE_CONTRACT_NAME: process.env.REACT_APP_BRIDGE_CONTRACT_NAME || 'bridge',
    
    // Development Configuration
    REACT_APP_DEBUG: process.env.REACT_APP_DEBUG || 'false',
    REACT_APP_DEMO_MODE: process.env.REACT_APP_DEMO_MODE || 'false',
    REACT_APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0'
  };
}

/**
 * Display environment validation results in console
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  console.log('🔍 Environment Variables Validation');
  console.log('=====================================');
  
  if (validation.isValid) {
    console.log('✅ All required environment variables are configured');
  } else {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (validation.missing.length > 0) {
    console.error('❌ Missing variables:');
    validation.missing.forEach(missing => console.error(`  - ${missing}`));
  }
  
  console.log('=====================================');
}

/**
 * Check if a specific feature is available based on environment variables
 */
export function isFeatureAvailable(feature: 'ai' | 'bridge' | 'demo'): boolean {
  switch (feature) {
    case 'ai':
      return !!process.env.REACT_APP_OPENAI_API_KEY;
    case 'bridge':
      return !!(process.env.REACT_APP_BRIDGE_CONTRACT_ADDRESS && process.env.REACT_APP_BRIDGE_CONTRACT_NAME);
    case 'demo':
      return process.env.REACT_APP_DEMO_MODE === 'true';
    default:
      return false;
  }
}
