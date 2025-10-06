export type SupportedChain = 'ethereum' | 'polygon' | 'avalanche' | 'binance';

export const SUPPORTED_CHAINS: { id: SupportedChain; name: string }[] = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'avalanche', name: 'Avalanche' },
  { id: 'binance', name: 'BNB Chain' },
];

export const AXELAR_ENV = (process.env.REACT_APP_AXELAR_ENV as 'testnet' | 'mainnet') || 'testnet';

// Validate Axelar environment configuration
export function validateAxelarConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!process.env.REACT_APP_AXELAR_ENV) {
    errors.push('REACT_APP_AXELAR_ENV not set. Using testnet as default.');
  }
  
  if (AXELAR_ENV !== 'testnet' && AXELAR_ENV !== 'mainnet') {
    errors.push('Invalid AXELAR_ENV value. Must be "testnet" or "mainnet".');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get Axelar API endpoints based on environment
export function getAxelarEndpoints() {
  const env = AXELAR_ENV;
  
  return {
    testnet: {
      apiUrl: 'https://testnet.api.axelarscan.io',
      explorerUrl: 'https://testnet.axelarscan.io',
      rpcUrl: 'https://axelar-testnet-rpc.allthatnode.com:26657'
    },
    mainnet: {
      apiUrl: 'https://api.axelarscan.io',
      explorerUrl: 'https://axelarscan.io',
      rpcUrl: 'https://axelar-rpc.allthatnode.com:26657'
    }
  }[env];
}

