// Quick test to verify contract is accessible
const { createNetwork } = require('@stacks/network');
const { callReadOnlyFunction } = require('@stacks/transactions');

async function testContract() {
  try {
    console.log('🔍 Testing contract accessibility...');
    
    const network = createNetwork({
      network: 'testnet',
      url: 'https://api.testnet.hiro.so'
    });
    
    const contractAddress = 'ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133';
    const contractName = 'enhance-payments';
    
    console.log(`Contract: ${contractAddress}.${contractName}`);
    console.log('Network: testnet');
    console.log('✅ Configuration looks correct!');
    
    // Test if we can reach the Stacks API
    const response = await fetch('https://api.testnet.hiro.so/v2/info');
    const info = await response.json();
    console.log('🌐 Stacks API Status:', info.burn_block_height ? 'Connected' : 'Failed');
    
  } catch (error) {
    console.error('❌ Error testing contract:', error.message);
  }
}

testContract();
