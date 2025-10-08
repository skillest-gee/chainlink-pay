/**
 * ChainLinkPay Contract Deployment Script for Xverse Wallet
 * Simplified deployment using your Xverse wallet address
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ChainLinkPay Contract Deployment (Xverse Wallet)');
console.log('====================================================');
console.log('');

// Your Xverse wallet address
const XVerse_ADDRESS = 'ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133';
const CONTRACT_NAME = 'chainlink-pay';
const CONTRACT_FILE = 'contracts/chainlink-pay.clar';

console.log(`📍 Your Xverse Address: ${XVerse_ADDRESS}`);
console.log(`📄 Contract: ${CONTRACT_NAME}`);
console.log('');

// Check if contract file exists
if (!fs.existsSync(CONTRACT_FILE)) {
  console.error(`❌ Contract file not found: ${CONTRACT_FILE}`);
  process.exit(1);
}

console.log('✅ Contract file found');
console.log('');

// Read contract source
const contractSource = fs.readFileSync(CONTRACT_FILE, 'utf8');
console.log('✅ Contract source loaded');
console.log('');

console.log('📋 Deployment Instructions:');
console.log('==========================');
console.log('');
console.log('1. 🌐 Go to Stacks Explorer:');
console.log('   https://explorer.stacks.co/sandbox/deploy');
console.log('');
console.log('2. 📝 Fill in the deployment form:');
console.log(`   Contract Name: ${CONTRACT_NAME}`);
console.log(`   Contract Code:`);
console.log('   (Copy the code from contracts/chainlink-pay.clar)');
console.log('');
console.log('3. 🔑 Connect your Xverse wallet');
console.log(`   Your address: ${XVerse_ADDRESS}`);
console.log('');
console.log('4. 💰 Make sure you have testnet STX');
console.log('   Get STX from: https://explorer.hiro.so/sandbox/faucet');
console.log('');
console.log('5. 🚀 Deploy the contract');
console.log('');
console.log('6. 📋 After deployment, update your .env file with:');
console.log(`   REACT_APP_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.${CONTRACT_NAME}`);
console.log(`   REACT_APP_MERCHANT_ADDRESS=${XVerse_ADDRESS}`);
console.log('');

console.log('📄 Contract Code:');
console.log('================');
console.log('');
console.log(contractSource);
console.log('');
console.log('✅ Copy the above code to the Stacks Explorer deployment form');
console.log('');
console.log('🎯 Next Steps:');
console.log('1. Get testnet STX from faucet');
console.log('2. Deploy via Stacks Explorer');
console.log('3. Update your .env file with the contract address');
console.log('4. Test your app!');
