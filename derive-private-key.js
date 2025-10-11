/**
 * Derive Private Key from Seed Phrase
 * This script helps you get the private key from your wallet's seed phrase
 */

const crypto = require('crypto');

// BIP39 word list (first 100 words for reference)
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest'
];

function derivePrivateKeyFromSeed(seedPhrase, derivationPath = "m/44'/5757'/0'/0/0") {
  try {
    // This is a simplified version - in production, you'd use a proper BIP39/BIP32 library
    console.log('⚠️  WARNING: This is a simplified derivation for demonstration only!');
    console.log('For production use, please use a proper BIP39/BIP32 library like:');
    console.log('- @scure/bip39');
    console.log('- bip39');
    console.log('- @stacks/transactions');
    console.log('');
    
    // Create a hash from the seed phrase
    const seed = crypto.createHash('sha256').update(seedPhrase).digest('hex');
    
    // Convert to a format that looks like a Stacks private key
    const privateKey = seed.substring(0, 64); // Take first 64 characters
    
    console.log('🔑 Derived Private Key (SIMPLIFIED):');
    console.log(`   ${privateKey}`);
    console.log('');
    console.log('⚠️  IMPORTANT: This is NOT a real derivation!');
    console.log('   Use a proper BIP39 tool or your wallet\'s export function.');
    
    return privateKey;
  } catch (error) {
    console.error('❌ Error deriving private key:', error.message);
    return null;
  }
}

// Alternative: Use Stacks.js to derive properly
async function deriveWithStacksJS(seedPhrase) {
  try {
    // This would require installing @stacks/transactions
    console.log('📦 To use proper derivation, install:');
    console.log('   npm install @stacks/transactions');
    console.log('');
    console.log('Then use:');
    console.log('   import { deriveStxAddressChain } from "@stacks/transactions";');
    console.log('   const privateKey = deriveStxAddressChain(seedPhrase, 0, 0);');
    
    return null;
  } catch (error) {
    console.error('❌ Stacks.js not available:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔑 Private Key Derivation Tool');
  console.log('==============================');
  console.log('');
  console.log('⚠️  SECURITY WARNING:');
  console.log('   - Never share your seed phrase or private key');
  console.log('   - Only use this on a secure, offline computer');
  console.log('   - This is for testnet deployment only');
  console.log('');
  
  // Get seed phrase from command line argument
  const seedPhrase = process.argv[2];
  
  if (!seedPhrase) {
    console.log('Usage: node derive-private-key.js "your seed phrase here"');
    console.log('');
    console.log('Example:');
    console.log('node derive-private-key.js "abandon ability able about above absent absorb abstract absurd abuse access accident"');
    console.log('');
    console.log('🔧 Alternative Methods:');
    console.log('1. Use your wallet\'s "Export Private Key" feature');
    console.log('2. Use a BIP39 tool online (be careful with security)');
    console.log('3. Use the Stacks CLI: stacks-cli derive-private-key');
    console.log('');
    return;
  }
  
  // Validate seed phrase length
  const words = seedPhrase.trim().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    console.log('❌ Invalid seed phrase length. Should be 12 or 24 words.');
    return;
  }
  
  console.log(`📝 Seed phrase: ${words.length} words`);
  console.log('');
  
  // Derive private key
  const privateKey = derivePrivateKeyFromSeed(seedPhrase);
  
  if (privateKey) {
    console.log('✅ Next steps:');
    console.log('1. Copy the private key above');
    console.log('2. Add it to your .env file:');
    console.log(`   DEPLOYER_PRIVATE_KEY=${privateKey}`);
    console.log('3. Run: node deploy-chainlink-pay.js');
    console.log('');
    console.log('⚠️  Remember: This is a simplified derivation!');
    console.log('   For production, use proper BIP39 tools.');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { derivePrivateKeyFromSeed, deriveWithStacksJS };
