// Wallet Provider Router for Contract Calls
import { openContractCall, ContractCallOptions } from '@stacks/connect';

export interface WalletProviderRouterOptions {
  // Contract call properties
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  network?: any;
  userSession?: any;
  appDetails?: any;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
  sponsored?: boolean;
  postConditionMode?: any;
  postConditions?: any[];
  anchorMode?: any;
  attachment?: string;
  fee?: number | string;
  stxAddress?: string;
  authOrigin?: string;
  
  // Wallet provider routing
  walletProvider: 'xverse' | 'leather' | 'hiro' | 'unknown';
}

/**
 * Routes contract calls to the correct wallet provider
 * This ensures that the connected wallet provider is used instead of defaulting to Leather
 */
export const routeContractCall = async (options: WalletProviderRouterOptions): Promise<void> => {
  const { walletProvider, ...contractCallOptions } = options;
  
  console.log('=== WALLET PROVIDER ROUTING ===');
  console.log('Wallet provider:', walletProvider);
  console.log('Contract call options:', contractCallOptions);
  
  // Store original wallet providers
  const originalProviders = {
    XverseProvider: (window as any).XverseProvider,
    xverse: (window as any).xverse,
    XverseWallet: (window as any).XverseWallet,
    Xverse: (window as any).Xverse,
    LeatherProvider: (window as any).LeatherProvider,
    leather: (window as any).leather,
    hiro: (window as any).hiro,
    LeatherWallet: (window as any).LeatherWallet,
    Leather: (window as any).Leather
  };
  
  try {
    // Aggressive wallet provider isolation
    if (walletProvider === 'xverse') {
      console.log('Routing to Xverse - hiding Leather providers');
      // Hide all Leather/Hiro providers
      (window as any).LeatherProvider = undefined;
      (window as any).leather = undefined;
      (window as any).hiro = undefined;
      (window as any).LeatherWallet = undefined;
      (window as any).Leather = undefined;
    } else if (walletProvider === 'leather' || walletProvider === 'hiro') {
      console.log('Routing to Leather - hiding Xverse providers');
      // Hide all Xverse providers
      (window as any).XverseProvider = undefined;
      (window as any).xverse = undefined;
      (window as any).XverseWallet = undefined;
      (window as any).Xverse = undefined;
    }
    
    console.log('Available providers after isolation:');
    console.log('- XverseProvider:', !!(window as any).XverseProvider);
    console.log('- xverse:', !!(window as any).xverse);
    console.log('- LeatherProvider:', !!(window as any).LeatherProvider);
    console.log('- leather:', !!(window as any).leather);
    console.log('- hiro:', !!(window as any).hiro);
    
    // Use the standard openContractCall with isolated providers
    await openContractCall(contractCallOptions as ContractCallOptions);
    
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  } finally {
    // Always restore original providers
    console.log('Restoring original wallet providers');
    Object.keys(originalProviders).forEach(key => {
      (window as any)[key] = originalProviders[key as keyof typeof originalProviders];
    });
  }
};

/**
 * Check if a wallet provider supports contract calls
 */
export const isWalletProviderSupported = (walletProvider: 'xverse' | 'leather' | 'hiro' | 'unknown'): boolean => {
  return walletProvider !== 'unknown';
};

/**
 * Get the display name for a wallet provider
 */
export const getWalletProviderDisplayName = (walletProvider: 'xverse' | 'leather' | 'hiro' | 'unknown'): string => {
  switch (walletProvider) {
    case 'xverse':
      return 'Xverse Wallet';
    case 'leather':
      return 'Leather Wallet';
    case 'hiro':
      return 'Hiro Wallet';
    default:
      return 'Unknown Wallet';
  }
};
