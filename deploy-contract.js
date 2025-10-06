#!/usr/bin/env node

/**
 * ChainLinkPay Contract Deployment Script
 * Deploys the enhanced-payment contract to Stacks testnet/mainnet
 */

const { StacksTestnet, StacksMainnet } = require('@stacks/network');
const { 
  makeContractDeploy, 
  broadcastTransaction, 
  getAddressFromPrivateKey,
  TransactionVersion,
  AnchorMode
} = require('@stacks/transactions');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testnet: {
    network: new StacksTestnet(),
    url: 'https://api.testnet.hiro.so',
    explorer: 'https://explorer.stacks.co'
  },
  mainnet: {
    network: new StacksMainnet(),
    url: 'https://api.hiro.so',
    explorer: 'https://explorer.stacks.co'
  }
};

// Contract configuration
const CONTRACT_CONFIG = {
  name: 'enhanced-payment',
  file: 'contracts/enhanced-payment.clar',
  version: '1.0.0'
};

/**
 * Load contract source code
 */
function loadContractSource() {
  try {
    const contractPath = path.join(__dirname, CONTRACT_CONFIG.file);
    const source = fs.readFileSync(contractPath, 'utf8');
    console.log(`✅ Loaded contract source from ${CONTRACT_CONFIG.file}`);
    return source;
  } catch (error) {
    console.error(`❌ Error loading contract: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Deploy contract to Stacks network
 */
async function deployContract(privateKey, network = 'testnet') {
  try {
    console.log(`🚀 Deploying ${CONTRACT_CONFIG.name} to ${network}...`);
    
    // Load contract source
    const contractSource = loadContractSource();
    
    // Get network configuration
    const networkConfig = CONFIG[network];
    if (!networkConfig) {
      throw new Error(`Invalid network: ${network}. Use 'testnet' or 'mainnet'`);
    }
    
    // Get deployer address
    const address = getAddressFromPrivateKey(privateKey, networkConfig.network.coreApiUrl);
    console.log(`📍 Deployer address: ${address}`);
    
    // Create contract deployment transaction
    const deployTx = await makeContractDeploy({
      contractName: CONTRACT_CONFIG.name,
      codeBody: contractSource,
      senderKey: privateKey,
      network: networkConfig.network,
      anchorMode: AnchorMode.Any,
      fee: 5000, // 0.005 STX fee
      nonce: 0
    });
    
    console.log(`📝 Contract deployment transaction created`);
    console.log(`💰 Fee: ${deployTx.auth.spendingCondition?.fee || 'Unknown'} microSTX`);
    
    // Broadcast transaction
    console.log(`📡 Broadcasting transaction to ${networkConfig.url}...`);
    const result = await broadcastTransaction(deployTx, networkConfig.url);
    
    if (result) {
      console.log(`✅ Contract deployed successfully!`);
      console.log(`🔗 Transaction ID: ${result}`);
      console.log(`🌐 Explorer: ${networkConfig.explorer}/txid/${result}`);
      console.log(`📋 Contract Address: ${address}.${CONTRACT_CONFIG.name}`);
      
      // Generate environment variables
      console.log(`\n📝 Add these to your .env file:`);
      console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
      console.log(`REACT_APP_CONTRACT_NAME=${CONTRACT_CONFIG.name}`);
      console.log(`REACT_APP_MERCHANT_ADDRESS=${address}`);
      
      return {
        success: true,
        txId: result,
        contractAddress: address,
        contractName: CONTRACT_CONFIG.name,
        explorer: `${networkConfig.explorer}/txid/${result}`
      };
    } else {
      throw new Error('Transaction broadcast failed');
    }
    
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify contract deployment
 */
async function verifyContract(contractAddress, contractName, network = 'testnet') {
  try {
    console.log(`🔍 Verifying contract deployment...`);
    
    const networkConfig = CONFIG[network];
    const contractUrl = `${networkConfig.url}/v2/contracts/${contractAddress}/${contractName}`;
    
    const response = await fetch(contractUrl);
    const contract = await response.json();
    
    if (contract && contract.contract_id) {
      console.log(`✅ Contract verified: ${contract.contract_id}`);
      console.log(`📅 Deployed at block: ${contract.source_code}`);
      return true;
    } else {
      console.log(`❌ Contract not found or not yet mined`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main deployment function
 */
async function main() {
  console.log(`🎯 ChainLinkPay Contract Deployment`);
  console.log(`=====================================`);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const network = args[0] || 'testnet';
  const privateKey = process.env.STACKS_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error(`❌ STACKS_PRIVATE_KEY environment variable not set`);
    console.log(`💡 Set your private key: export STACKS_PRIVATE_KEY=your_private_key_here`);
    process.exit(1);
  }
  
  if (!['testnet', 'mainnet'].includes(network)) {
    console.error(`❌ Invalid network: ${network}`);
    console.log(`💡 Use 'testnet' or 'mainnet'`);
    process.exit(1);
  }
  
  console.log(`🌐 Network: ${network}`);
  console.log(`📦 Contract: ${CONTRACT_CONFIG.name} v${CONTRACT_CONFIG.version}`);
  
  // Deploy contract
  const result = await deployContract(privateKey, network);
  
  if (result.success) {
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`📋 Contract Details:`);
    console.log(`   Address: ${result.contractAddress}`);
    console.log(`   Name: ${result.contractName}`);
    console.log(`   Transaction: ${result.txId}`);
    console.log(`   Explorer: ${result.explorer}`);
    
    // Wait a moment for transaction to be mined
    console.log(`\n⏳ Waiting for transaction to be mined...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify deployment
    const verified = await verifyContract(result.contractAddress, result.contractName, network);
    if (verified) {
      console.log(`✅ Contract is live and ready to use!`);
    } else {
      console.log(`⏳ Contract is deployed but may still be mining. Check explorer in a few minutes.`);
    }
    
  } else {
    console.error(`❌ Deployment failed: ${result.error}`);
    process.exit(1);
  }
}

// Run deployment if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  deployContract,
  verifyContract,
  CONFIG,
  CONTRACT_CONFIG
};
