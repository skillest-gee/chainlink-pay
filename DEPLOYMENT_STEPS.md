# 🚀 ChainLinkPay Contract Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Environment Setup**
- [ ] Private key obtained from wallet
- [ ] At least 5-10 STX in testnet wallet
- [ ] Environment variables configured
- [ ] Contract file updated

### ✅ **Your Current Configuration**
```bash
REACT_APP_CONTRACT_NAME="enhance-payments"
REACT_APP_MERCHANT_ADDRESS="ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133"
REACT_APP_STACKS_NETWORK="testnet"
REACT_APP_STACKS_API_URL="https://api.testnet.hiro.so"
```

## 🔧 **Step 1: Get Your Private Key**

### **Option A: Export from Wallet (Recommended)**
1. Open your Leather or Xverse wallet
2. Go to Settings → Security
3. Find "Export Private Key" or "Reveal Private Key"
4. Copy the private key

### **Option B: Use BIP39 Tool**
1. Go to: https://iancoleman.io/bip39/
2. Enter your seed phrase
3. Select "Stacks" as coin
4. Use derivation path: `m/44'/5757'/0'/0/0`
5. Copy the private key

## 🔧 **Step 2: Update Environment**

Add this line to your `.env` file:
```bash
DEPLOYER_PRIVATE_KEY=your_actual_private_key_here
```

## 🚀 **Step 3: Deploy Contract**

Run the deployment script:
```bash
node deploy-chainlink-pay.js
```

## 📊 **Step 4: Update App Configuration**

After successful deployment, update your `.env` file with the new contract address:
```bash
REACT_APP_CONTRACT_ADDRESS=SP_NEW_DEPLOYED_ADDRESS
```

## 🎯 **Step 5: Test Deployment**

1. Restart your app: `npm start`
2. Go to Payment Link Generator
3. Click "Register on Chain"
4. Verify transaction appears on Stacks Explorer

## 🔍 **Troubleshooting**

### **"Insufficient Balance"**
- Get more STX from: https://explorer.stacks.co/sandbox/faucet

### **"Invalid Private Key"**
- Double-check private key format
- Ensure no extra spaces or characters

### **"Contract Already Exists"**
- Use a different contract name
- Or deploy to a different address

### **"Transaction Failed"**
- Check transaction on Stacks Explorer
- Use: `curl -L 'https://api.hiro.so/extended/v1/tx/YOUR_TX_HASH' -H 'Accept: application/json'`

## 📈 **Contract Features**

### ✅ **Core Functions**
- `create-payment` - Create payment links
- `mark-paid` - Mark payments as completed
- `get-payment` - Retrieve payment details
- `cancel-payment` - Cancel pending payments

### ✅ **Advanced Features**
- `create-escrow` - Create escrow payments
- `release-escrow` - Release escrow funds
- `bridge-to-bitcoin` - Bridge STX to Bitcoin
- `get-stats` - Get platform statistics

### ✅ **Admin Functions**
- `set-platform-fee-rate` - Update fee rate
- `withdraw-fees` - Withdraw platform fees

## 🎉 **Success Indicators**

- ✅ Contract deployed successfully
- ✅ Transaction confirmed on Stacks Explorer
- ✅ App can call contract functions
- ✅ Payment links work with real blockchain
- ✅ Dashboard shows real data

## 📞 **Need Help?**

If deployment fails:
1. Check the error message
2. Verify your private key
3. Ensure sufficient STX balance
4. Check network connectivity
5. Try increasing the fee in deployment config
