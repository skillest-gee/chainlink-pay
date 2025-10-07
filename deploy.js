#!/usr/bin/env node

/**
 * ChainLinkPay Contract Deployment
 * Simple deployment script for the hackathon
 */

const { StacksTestnet } = require('@stacks/network');
const { 
  makeContractDeploy, 
  broadcastTransaction, 
  getAddressFromPrivateKey
} = require('@stacks/transactions');
const fs = require('fs');

// Load contract source
const CONTRACT_SOURCE = fs.readFileSync('contracts/enhanced-payment.clar', 'utf8');

async function deployContract() {
  try {
    console.log('🚀 Deploying ChainLinkPay Contract...');
    
    // Get private key from environment
    const privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ STACKS_PRIVATE_KEY environment variable not set');
      console.log('💡 Set your private key: $env:STACKS_PRIVATE_KEY="your_private_key_here"');
      process.exit(1);
    }
    
    // Create network
    const network = new StacksTestnet();
    const address = getAddressFromPrivateKey(privateKey, network.coreApiUrl);
    
    console.log(`📍 Deployer address: ${address}`);
    
    // Create deployment transaction
    const deployTx = await makeContractDeploy({
      contractName: 'chainlink-pay',
      codeBody: CONTRACT_SOURCE,
      senderKey: privateKey,
      network: network,
      anchorMode: 1,
      fee: 20000 // 0.02 STX fee
    });
    
    console.log('📡 Broadcasting transaction...');
    const result = await broadcastTransaction(deployTx, network.coreApiUrl);
    
    if (result) {
      console.log('✅ Contract deployed successfully!');
      console.log(`🔗 Transaction ID: ${result}`);
      console.log(`📋 Contract Address: ${address}.chainlink-pay`);
      console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${result}`);
      
      console.log('\n📝 Update your .env file with:');
      console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
      console.log(`REACT_APP_CONTRACT_NAME=chainlink-pay`);
      console.log(`REACT_APP_MERCHANT_ADDRESS=${address}`);
      
      return {
        success: true,
        contractAddress: address,
        txId: result
      };
    } else {
      throw new Error('Transaction broadcast failed');
    }
    
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run deployment
if (require.main === module) {
  deployContract().then(result => {
    if (result.success) {
      console.log('\n🎉 Deployment completed! Your contract is ready for the hackathon!');
    } else {
      console.error('\n❌ Deployment failed. Please check your setup.');
      process.exit(1);
    }
  });
}

module.exports = { deployContract };
