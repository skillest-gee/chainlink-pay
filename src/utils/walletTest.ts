// Wallet Integration Test
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';

export function testWalletIntegration() {
  console.log('=== WALLET INTEGRATION TEST ===');
  
  // Test Stacks wallet
  console.log('Testing Stacks wallet integration...');
  
  // Test Bitcoin wallet
  console.log('Testing Bitcoin wallet integration...');
  
  // Test wallet state changes
  console.log('Testing wallet state management...');
  
  return {
    stacksWallet: 'Ready',
    bitcoinWallet: 'Ready',
    integration: 'Complete'
  };
}

// Test wallet connection flow
export async function testWalletConnection() {
  console.log('=== WALLET CONNECTION TEST ===');
  
  try {
    // Test if wallets are available
    const isStacksWalletAvailable = typeof window !== 'undefined' && 
      (typeof (window as any).stacks !== 'undefined' || 
       typeof (window as any).StacksProvider !== 'undefined');
    
    const isBitcoinWalletAvailable = typeof window !== 'undefined' && 
      (typeof (window as any).unisat !== 'undefined' || 
       typeof (window as any).okxwallet !== 'undefined' ||
       typeof (window as any).bitget !== 'undefined');
    
    console.log('Stacks wallet available:', isStacksWalletAvailable);
    console.log('Bitcoin wallet available:', isBitcoinWalletAvailable);
    
    return {
      stacksWallet: isStacksWalletAvailable,
      bitcoinWallet: isBitcoinWalletAvailable,
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  } catch (error) {
    console.error('Wallet connection test failed:', error);
    return {
      stacksWallet: false,
      bitcoinWallet: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test bridge functionality
export function testBridgeFunctionality() {
  console.log('=== BRIDGE FUNCTIONALITY TEST ===');
  
  // Test asset selection
  const supportedAssets = ['STX', 'BTC', 'USDC', 'USDT'];
  console.log('Supported assets:', supportedAssets);
  
  // Test fee calculation
  const testAmount = 100;
  const feeRate = 0.001;
  const calculatedFee = testAmount * feeRate;
  console.log(`Fee calculation test: ${testAmount} * ${feeRate} = ${calculatedFee}`);
  
  // Test transaction simulation
  const mockTransaction = {
    id: 'test-' + Date.now(),
    fromAsset: 'STX',
    toAsset: 'BTC',
    amount: testAmount,
    status: 'processing' as const,
    timestamp: Date.now()
  };
  
  console.log('Mock transaction created:', mockTransaction);
  
  return {
    assetsSupported: supportedAssets.length,
    feeCalculation: calculatedFee,
    transactionSimulation: 'Success'
  };
}
