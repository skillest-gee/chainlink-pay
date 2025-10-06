import { createNetwork } from '@stacks/network';
import { AccountsApi, Configuration } from '@stacks/blockchain-api-client';

// Environment variable validation
const requiredEnvVars = {
  REACT_APP_STACKS_NETWORK: process.env.REACT_APP_STACKS_NETWORK,
  REACT_APP_STACKS_API_URL: process.env.REACT_APP_STACKS_API_URL,
  REACT_APP_CONTRACT_ADDRESS: process.env.REACT_APP_CONTRACT_ADDRESS,
  REACT_APP_CONTRACT_NAME: process.env.REACT_APP_CONTRACT_NAME,
  REACT_APP_MERCHANT_ADDRESS: process.env.REACT_APP_MERCHANT_ADDRESS,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.error('Please check your .env file and ensure all required variables are set.');
}

const networkConfig = {
  network: (process.env.REACT_APP_STACKS_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  url: process.env.REACT_APP_STACKS_API_URL || 'https://api.testnet.hiro.so',
};

export const stacksNetwork = createNetwork(networkConfig);

export const appDetails = {
  name: 'ChainLinkPay',
  icon: window.location.origin + '/logo.png',
};

export const STACKS_NETWORK_KEY = process.env.REACT_APP_STACKS_NETWORK || 'testnet';
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
export const CONTRACT_NAME = process.env.REACT_APP_CONTRACT_NAME || 'enhanced-payment';
export const MERCHANT_ADDRESS = process.env.REACT_APP_MERCHANT_ADDRESS || '';

// Validate contract configuration
if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'ST000000000000000000002AMW42H') {
  console.warn('⚠️  Using placeholder contract address. Please update REACT_APP_CONTRACT_ADDRESS with your deployed contract address.');
}

const config = new Configuration({
  basePath: process.env.REACT_APP_STACKS_API_URL || 'https://api.testnet.hiro.so',
});
export const accountsApi = new AccountsApi(config);

// Export environment validation function
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'ST000000000000000000002AMW42H') {
    errors.push('Contract address not configured. Please set REACT_APP_CONTRACT_ADDRESS.');
  }
  
  if (!CONTRACT_NAME) {
    errors.push('Contract name not configured. Please set REACT_APP_CONTRACT_NAME.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

