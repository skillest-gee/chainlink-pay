# 🚀 ChainLinkPay Contract Deployment Guide

This guide will help you deploy the enhanced-payment contract to the Stacks blockchain.

## 📋 Prerequisites

1. **Stacks Wallet**: Install Xverse or Hiro wallet
2. **Testnet STX**: Get testnet STX from [Stacks faucet](https://explorer.stacks.co/sandbox/faucet)
3. **Private Key**: Export your wallet's private key
4. **Node.js**: Version 16+ installed

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install @stacks/network @stacks/transactions @stacks/blockchain-api-client
```

### 2. Set Environment Variables
```bash
# For testnet deployment
export STACKS_PRIVATE_KEY=your_private_key_here
export STACKS_NETWORK=testnet

# For mainnet deployment (be careful!)
export STACKS_PRIVATE_KEY=your_private_key_here
export STACKS_NETWORK=mainnet
```

### 3. Get Testnet STX
1. Go to [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet)
2. Enter your wallet address
3. Request testnet STX (you'll need ~0.01 STX for deployment)

## 🚀 Deployment Methods

### Method 1: Using the Deployment Script (Recommended)

```bash
# Deploy to testnet
node deploy-contract.js testnet

# Deploy to mainnet (be careful!)
node deploy-contract.js mainnet
```

### Method 2: Using Clarinet (Advanced)

```bash
# Install Clarinet
cargo install clarinet

# Initialize project
clarinet init

# Deploy to testnet
clarinet deploy --testnet

# Deploy to mainnet
clarinet deploy --mainnet
```

### Method 3: Manual Deployment

1. **Copy contract source** from `contracts/enhanced-payment.clar`
2. **Go to [Stacks Explorer](https://explorer.stacks.co)**
3. **Connect your wallet**
4. **Deploy contract** with name `enhanced-payment`

## 📝 Contract Functions

### Core Payment Functions
- `create-payment` - Create new payment links
- `get-payment` - Get payment information
- `mark-payment-paid` - Mark payment as completed
- `cancel-payment` - Cancel a payment

### Merchant Functions
- `get-merchant-payments` - Get merchant's payments
- `get-merchant-stats` - Get merchant statistics

### Admin Functions
- `set-contract-enabled` - Enable/disable contract
- `get-contract-owner` - Get contract owner
- `get-contract-stats` - Get contract statistics

### AI Integration
- `register-ai-contract` - Register AI-generated contracts
- `get-ai-contract` - Get AI contract information

### Bridge Functions
- `create-bridge-request` - Create cross-chain bridge requests
- `get-bridge-request` - Get bridge request details

## 🔍 Verification

### 1. Check Deployment
```bash
# Verify contract is deployed
curl "https://api.testnet.hiro.so/v2/contracts/YOUR_ADDRESS/enhanced-payment"
```

### 2. Test Functions
```bash
# Test contract functions
npm run test:contract
```

### 3. Update Environment Variables
```bash
# Update your .env file
REACT_APP_CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS
REACT_APP_CONTRACT_NAME=enhanced-payment
REACT_APP_MERCHANT_ADDRESS=YOUR_ADDRESS
```

## 🧪 Testing

### Run Contract Tests
```bash
# Run all tests
npm run test

# Run specific test
npm run test:contract
```

### Test Payment Flow
1. **Create payment link** using the app
2. **Check payment status** in dashboard
3. **Test payment completion**
4. **Verify statistics** update correctly

## 🚨 Troubleshooting

### Common Issues

#### 1. "NoSuchContract" Error
- **Cause**: Contract not deployed or wrong address
- **Fix**: Verify contract address in .env file

#### 2. "Insufficient Balance" Error
- **Cause**: Not enough STX for transaction fees
- **Fix**: Get more testnet STX from faucet

#### 3. "Transaction Failed" Error
- **Cause**: Invalid function parameters
- **Fix**: Check function arguments match contract

#### 4. "Unauthorized" Error
- **Cause**: Wrong wallet connected
- **Fix**: Connect correct wallet address

### Debug Steps

1. **Check contract deployment**:
   ```bash
   curl "https://api.testnet.hiro.so/v2/contracts/YOUR_ADDRESS/enhanced-payment"
   ```

2. **Verify environment variables**:
   ```bash
   echo $REACT_APP_CONTRACT_ADDRESS
   echo $REACT_APP_CONTRACT_NAME
   ```

3. **Check wallet connection**:
   - Ensure wallet is connected to testnet
   - Verify wallet has sufficient STX

4. **Test contract functions**:
   ```bash
   # Test create-payment function
   curl -X POST "https://api.testnet.hiro.so/v2/contracts/call-read" \
     -H "Content-Type: application/json" \
     -d '{
       "contract_address": "YOUR_ADDRESS",
       "contract_name": "enhanced-payment",
       "function_name": "get-contract-stats",
       "function_args": []
     }'
   ```

## 📊 Contract Statistics

After deployment, you can check:
- **Total payments created**
- **Total volume processed**
- **Contract status** (enabled/disabled)
- **Merchant statistics**

## 🔄 Updates and Maintenance

### Updating Contract
1. **Modify contract source**
2. **Redeploy with new version**
3. **Update environment variables**
4. **Test all functions**

### Monitoring
- **Check transaction history**
- **Monitor contract calls**
- **Track error rates**
- **Update statistics**

## 🎯 Production Checklist

- [ ] Contract deployed successfully
- [ ] All functions tested
- [ ] Environment variables updated
- [ ] App tested with deployed contract
- [ ] Error handling verified
- [ ] Statistics tracking working
- [ ] AI integration tested
- [ ] Bridge functionality verified

## 📞 Support

If you encounter issues:
1. **Check the troubleshooting section**
2. **Verify your setup**
3. **Test with simple functions first**
4. **Check Stacks Explorer for transaction details**

## 🎉 Success!

Once deployed, your ChainLinkPay app will have:
- ✅ **Full payment link functionality**
- ✅ **STX and BTC payment support**
- ✅ **AI contract integration**
- ✅ **Cross-chain bridge support**
- ✅ **Comprehensive statistics**
- ✅ **Production-ready security**

Your contract is now ready for the hackathon! 🚀
