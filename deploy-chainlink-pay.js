/**
 * ChainLinkPay Contract Deployment Script
 * Enhanced deployment script with nonce handling, verification, and configuration
 */

const { createNetwork } = require('@stacks/network');
const { 
  makeContractDeploy, 
  broadcastTransaction, 
  getAddressFromPrivateKey,
  TransactionVersion 
} = require('@stacks/transactions');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration - Use your existing env variables
const NETWORK = process.env.REACT_APP_STACKS_NETWORK || 'testnet';
const CONTRACT_NAME = process.env.REACT_APP_CONTRACT_NAME || 'chainlink-pay';
const CONTRACT_FILE = 'contracts/chainlink-pay.clar';
const EXISTING_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

// Your wallet address from environment
const WALLET_ADDRESS = process.env.REACT_APP_MERCHANT_ADDRESS || 'ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133';

// Enhanced Configuration
const DEPLOYMENT_CONFIG = {
  contractName: CONTRACT_NAME,
  contractFile: CONTRACT_FILE,
  fee: 50000, // 0.05 STX
  requiredBalance: 1, // Minimum STX required
  waitForConfirmation: true,
  generateEnv: true,
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
};

// Network configuration using your API URL
const networkConfig = {
  network: NETWORK,
  url: process.env.REACT_APP_STACKS_API_URL || (NETWORK === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so')
};

const network = createNetwork(networkConfig);

console.log('🚀 ChainLinkPay Contract Deployment');
console.log('=====================================');
console.log(`Network: ${NETWORK}`);
console.log(`Contract: ${DEPLOYMENT_CONFIG.contractName}`);
console.log('');

// Check if contract file exists
if (!fs.existsSync(DEPLOYMENT_CONFIG.contractFile)) {
  console.error('❌ Contract file not found:', DEPLOYMENT_CONFIG.contractFile);
  process.exit(1);
}

// Read contract source
const contractSource = fs.readFileSync(DEPLOYMENT_CONFIG.contractFile, 'utf8');
console.log('✅ Contract source loaded');

// Get deployer private key from environment
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!deployerKey) {
  console.error('❌ DEPLOYER_PRIVATE_KEY environment variable not set');
  console.log('');
  console.log('Please set your deployer private key:');
  console.log('export DEPLOYER_PRIVATE_KEY=your_private_key_here');
  console.log('');
  console.log('You can get a testnet private key from:');
  console.log('https://explorer.stacks.co/sandbox/faucet');
  process.exit(1);
}

// Get deployer address
const deployerAddress = getAddressFromPrivateKey(deployerKey, network.version);
console.log(`📍 Deployer Address: ${deployerAddress}`);

// Add this function to check if contract already exists
async function checkExistingDeployment() {
  if (EXISTING_CONTRACT_ADDRESS && EXISTING_CONTRACT_ADDRESS !== '') {
    console.log('⚠️  Existing contract found in environment:');
    console.log(`   Address: ${EXISTING_CONTRACT_ADDRESS}`);
    console.log(`   Name: ${CONTRACT_NAME}`);
    
    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('Do you want to deploy a new contract? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
  return true; // No existing contract, proceed with deployment
}

// Enhanced nonce fetching
async function getNonce(address) {
  try {
    console.log('🔍 Fetching current nonce...');
    const response = await fetch(`${network.coreApiUrl}/extended/v1/address/${address}/nonces`);
    const data = await response.json();
    const nonce = data.possible_next_nonce || 0;
    console.log(`📊 Current nonce: ${nonce}`);
    return nonce;
  } catch (error) {
    console.warn('⚠️  Failed to fetch nonce, using 0:', error.message);
    return 0;
  }
}

// Check deployer balance
async function checkBalance() {
  try {
    const response = await fetch(`${network.coreApiUrl}/extended/v1/address/${deployerAddress}/stx`);
    const data = await response.json();
    const balance = parseInt(data.balance) / 1000000; // Convert from microSTX to STX
    
    console.log(`💰 Deployer Balance: ${balance} STX`);
    
    if (balance < DEPLOYMENT_CONFIG.requiredBalance) {
      console.log(`⚠️  Warning: Low balance. You need at least ${DEPLOYMENT_CONFIG.requiredBalance} STX for deployment.`);
      console.log('Get testnet STX from: https://explorer.stacks.co/sandbox/faucet');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check balance:', error.message);
    return false;
  }
}

// Enhanced contract verification
async function verifyDeployment(txId) {
  if (!DEPLOYMENT_CONFIG.waitForConfirmation) {
    console.log('⏭️  Skipping verification (waitForConfirmation disabled)');
    return true;
  }

  console.log('⏳ Waiting for transaction confirmation...');
  console.log('   This may take 1-2 minutes...');
  
  // Wait for transaction to be processed
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  let attempts = 0;
  const maxAttempts = 6; // 3 minutes total
  
  while (attempts < maxAttempts) {
    try {
      console.log(`🔍 Checking transaction status (attempt ${attempts + 1}/${maxAttempts})...`);
      const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txId}`);
      const txData = await response.json();
      
      if (txData.tx_status === 'success') {
        console.log('✅ Contract deployed successfully!');
        return true;
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        console.log(`❌ Deployment failed with status: ${txData.tx_status}`);
        console.log('💡 This might be due to insufficient balance or network issues');
        return false;
      } else if (txData.tx_status === 'pending') {
        console.log('⏳ Transaction still pending, waiting...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      } else {
        console.log(`⚠️  Unexpected status: ${txData.tx_status}`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      }
    } catch (error) {
      console.error('❌ Failed to verify deployment:', error.message);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
  
  console.log('⏰ Verification timeout - transaction may still be processing');
  console.log('🔍 Check transaction status manually on Stacks Explorer');
  return false;
}

// Enhanced deploy contract with retry logic
async function deployContract() {
  let attempts = 0;
  
  while (attempts < DEPLOYMENT_CONFIG.maxRetries) {
    try {
      console.log(`📝 Creating deployment transaction (attempt ${attempts + 1}/${DEPLOYMENT_CONFIG.maxRetries})...`);
      
      // Get current nonce
      const currentNonce = await getNonce(deployerAddress);
      
      const txOptions = {
        contractName: DEPLOYMENT_CONFIG.contractName,
        codeBody: contractSource,
        senderKey: deployerKey,
        network: network,
        fee: DEPLOYMENT_CONFIG.fee,
        nonce: currentNonce,
      };

      const transaction = await makeContractDeploy(txOptions);
      console.log('✅ Transaction created');
      console.log(`📋 Transaction ID: ${transaction.txid()}`);
      
      console.log('📡 Broadcasting transaction...');
      const broadcastResponse = await broadcastTransaction(transaction, network);
      
      if (broadcastResponse.error) {
        throw new Error(broadcastResponse.error);
      }
      
      console.log('✅ Transaction broadcasted successfully!');
      
      // Verify deployment if enabled
      const verified = await verifyDeployment(transaction.txid());
      
      console.log('');
      console.log('🔍 Transaction Details:');
      console.log(`   Transaction ID: ${transaction.txid()}`);
      console.log(`   Contract Address: ${deployerAddress}`);
      console.log(`   Contract Name: ${DEPLOYMENT_CONFIG.contractName}`);
      console.log(`   Verification: ${verified ? '✅ Verified' : '⏳ Pending'}`);
      console.log('');
      console.log('📊 Next Steps:');
      console.log('1. Check transaction on Stacks Explorer:');
      console.log(`   https://explorer.stacks.co/txid/${transaction.txid()}`);
      
      if (DEPLOYMENT_CONFIG.generateEnv) {
        console.log('2. Update your .env file with the contract address:');
        console.log(`   REACT_APP_CONTRACT_ADDRESS=${deployerAddress}`);
        console.log(`   REACT_APP_CONTRACT_NAME=${DEPLOYMENT_CONFIG.contractName}`);
        console.log('3. Restart your app to use the new contract');
      }
      
      return {
        success: true,
        txId: transaction.txid(),
        contractAddress: deployerAddress,
        contractName: DEPLOYMENT_CONFIG.contractName,
        verified: verified
      };
      
    } catch (error) {
      attempts++;
      console.error(`❌ Deployment attempt ${attempts} failed:`, error.message);
      
      if (attempts < DEPLOYMENT_CONFIG.maxRetries) {
        console.log(`⏳ Retrying in ${DEPLOYMENT_CONFIG.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CONFIG.retryDelay));
      } else {
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Check your private key is correct');
        console.log('2. Ensure you have sufficient STX balance');
        console.log('3. Verify network configuration');
        console.log('4. Check contract syntax for errors');
        console.log('5. Try increasing the fee in DEPLOYMENT_CONFIG');
        
        return {
          success: false,
          error: error.message,
          attempts: attempts
        };
      }
    }
  }
}

// Enhanced main deployment function
async function main() {
  try {
    console.log('🔧 Deployment Configuration:');
    console.log(`   Contract: ${DEPLOYMENT_CONFIG.contractName}`);
    console.log(`   Network: ${NETWORK}`);
    console.log(`   Fee: ${DEPLOYMENT_CONFIG.fee / 1000000} STX`);
    console.log(`   Required Balance: ${DEPLOYMENT_CONFIG.requiredBalance} STX`);
    console.log(`   Max Retries: ${DEPLOYMENT_CONFIG.maxRetries}`);
    console.log(`   Wait for Confirmation: ${DEPLOYMENT_CONFIG.waitForConfirmation}`);
    console.log('');
    
    // Check if we should proceed with deployment
    const shouldDeploy = await checkExistingDeployment();
    if (!shouldDeploy) {
      console.log('Deployment cancelled.');
      return;
    }
    
    // Check balance first
    const hasEnoughBalance = await checkBalance();
    
    if (!hasEnoughBalance) {
      console.log('❌ Insufficient balance for deployment');
      console.log('Please get testnet STX from the faucet and try again');
      return;
    }
    
    // Deploy contract
    const result = await deployContract();
    
    if (result.success) {
      console.log('');
      console.log('🎉 Deployment completed successfully!');
      console.log('');
      console.log('📋 Contract Information:');
      console.log(`   Address: ${result.contractAddress}`);
      console.log(`   Name: ${result.contractName}`);
      console.log(`   Transaction: ${result.txId}`);
      console.log(`   Verified: ${result.verified ? 'Yes' : 'Pending'}`);
      
      // Save deployment info
      const deploymentInfo = {
        network: NETWORK,
        contractAddress: result.contractAddress,
        contractName: result.contractName,
        txId: result.txId,
        verified: result.verified,
        deployedAt: new Date().toISOString(),
        deployer: deployerAddress,
        apiUrl: process.env.REACT_APP_STACKS_API_URL,
        config: DEPLOYMENT_CONFIG
      };
      
      fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
      console.log('💾 Deployment info saved to deployment-info.json');
      
      // Update .env file with new contract address
      await updateEnvFile(result.contractAddress);
      
    } else {
      console.log('❌ Deployment failed after all retry attempts');
      console.log(`   Attempts: ${result.attempts || DEPLOYMENT_CONFIG.maxRetries}`);
      console.log(`   Error: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

// Function to update your existing .env file
async function updateEnvFile(newContractAddress) {
  try {
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update contract address
    envContent = envContent.replace(
      /REACT_APP_CONTRACT_ADDRESS=.*/,
      `REACT_APP_CONTRACT_ADDRESS=${newContractAddress}`
    );
    
    // Update merchant address if it's the same as old contract address
    const oldContractAddress = EXISTING_CONTRACT_ADDRESS;
    if (oldContractAddress && envContent.includes(`REACT_APP_MERCHANT_ADDRESS=${oldContractAddress}`)) {
      envContent = envContent.replace(
        /REACT_APP_MERCHANT_ADDRESS=.*/,
        `REACT_APP_MERCHANT_ADDRESS=${newContractAddress}`
      );
    }
    
    // Add deployment timestamp
    if (!envContent.includes('REACT_APP_DEPLOYMENT_TIMESTAMP')) {
      envContent += `\nREACT_APP_DEPLOYMENT_TIMESTAMP=${Date.now()}`;
    } else {
      envContent = envContent.replace(
        /REACT_APP_DEPLOYMENT_TIMESTAMP=.*/,
        `REACT_APP_DEPLOYMENT_TIMESTAMP=${Date.now()}`
      );
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with new contract address');
    console.log(`   New Contract: ${newContractAddress}`);
    
  } catch (error) {
    console.error('⚠️  Could not update .env file:', error.message);
    console.log('Please manually update REACT_APP_CONTRACT_ADDRESS in your .env file');
  }
}

// Configuration helper
function updateConfig(newConfig) {
  Object.assign(DEPLOYMENT_CONFIG, newConfig);
  console.log('🔧 Configuration updated:', newConfig);
}

// Run deployment
if (require.main === module) {
  main();
}

module.exports = { 
  deployContract, 
  checkBalance, 
  verifyDeployment, 
  getNonce,
  updateConfig,
  checkExistingDeployment,
  updateEnvFile,
  DEPLOYMENT_CONFIG 
};
