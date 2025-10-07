const { StacksMainnet, StacksTestnet } = require('@stacks/network');
const { makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey } = require('@stacks/transactions');
const { readFileSync } = require('fs');

async function deployContract() {
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ STACKS_PRIVATE_KEY environment variable not set');
    return { success: false, error: 'Private key not set' };
  }

  const CONTRACT_SOURCE = readFileSync('./contracts/ultra-simple.clar').toString();
  
  // Try different networks
  const networks = [
    new StacksTestnet({ url: 'https://api.testnet.hiro.so' }),
    new StacksTestnet({ url: 'https://api.testnet.stacks.co' }),
    new StacksTestnet({ url: 'https://stacks-node-api.testnet.stacks.co' })
  ];

  for (let i = 0; i < networks.length; i++) {
    try {
      const network = networks[i];
      const address = getAddressFromPrivateKey(privateKey, network.coreApiUrl);
      
      console.log(`📍 Trying network ${i + 1}: ${network.coreApiUrl}`);
      console.log(`📍 Deployer address: ${address}`);

      const deployTx = await makeContractDeploy({
        contractName: `chainlink-pay-hiro-${i + 1}`,
        codeBody: CONTRACT_SOURCE,
        senderKey: privateKey,
        network: network,
        anchorMode: 1,
        fee: 100000
      });

      console.log('📡 Broadcasting transaction...');
      const result = await broadcastTransaction(deployTx, network.coreApiUrl);

      if (result) {
        console.log('✅ Contract deployed successfully!');
        console.log(`🔗 Transaction ID: ${result}`);
        console.log(`📋 Contract Address: ${address}.chainlink-pay-hiro-${i + 1}`);
        console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${result}`);

        return {
          success: true,
          contractAddress: address,
          txId: result,
          network: network.coreApiUrl
        };
      }
    } catch (error) {
      console.log(`❌ Network ${i + 1} failed: ${error.message}`);
      continue;
    }
  }

  console.error('❌ All networks failed');
  return { success: false, error: 'All deployment attempts failed' };
}

if (require.main === module) {
  deployContract().catch(console.error);
}

module.exports = { deployContract };
