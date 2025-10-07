const { StacksTestnet } = require('@stacks/network');
const { makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey } = require('@stacks/transactions');
const { readFileSync } = require('fs');

async function deployContract() {
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ STACKS_PRIVATE_KEY environment variable not set');
    console.error('💡 Set your private key: $env:STACKS_PRIVATE_KEY="your_private_key_here"');
    return { success: false, error: 'Private key not set' };
  }

  const CONTRACT_SOURCE = readFileSync('./contracts/minimal-working.clar').toString();
  const network = new StacksTestnet();
  const address = getAddressFromPrivateKey(privateKey, network.coreApiUrl);

  console.log(`📍 Deployer address: ${address}`);

  // Create deployment transaction
  const deployTx = await makeContractDeploy({
    contractName: 'chainlink-pay-final',
    codeBody: CONTRACT_SOURCE,
    senderKey: privateKey,
    network: network,
    anchorMode: 1, // Any
    fee: 50000 // 0.05 STX fee
  });

  console.log('📡 Broadcasting transaction...');
  const result = await broadcastTransaction(deployTx, network.coreApiUrl);

  if (result) {
    console.log('✅ Contract deployed successfully!');
    console.log(`🔗 Transaction ID: ${result}`);
    console.log(`📋 Contract Address: ${address}.chainlink-pay-final`);
    console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${result}`);

    console.log('\n📝 Update your .env file with:');
    console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
    console.log(`REACT_APP_CONTRACT_NAME=chainlink-pay-final`);
    console.log(`REACT_APP_MERCHANT_ADDRESS=${address}`);

    return {
      success: true,
      contractAddress: address,
      txId: result
    };
  } else {
    console.error('❌ Contract deployment failed.');
    return { success: false, error: 'Deployment failed' };
  }
}

if (require.main === module) {
  deployContract().catch(console.error);
}

module.exports = { deployContract };
