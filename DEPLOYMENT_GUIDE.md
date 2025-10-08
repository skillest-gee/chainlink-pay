# 🚀 ChainLinkPay Contract Deployment Guide

## Quick Deployment Steps

### 1. **Get Testnet STX**
```bash
# Visit the Stacks testnet faucet
https://explorer.stacks.co/sandbox/faucet

# Enter your wallet address to get testnet STX
# You need at least 1-2 STX for deployment
```

### 2. **Get Your Private Key**
- Open your Stacks wallet (Hiro, Xverse, or Leather)
- Go to Settings > Show Private Key
- Copy your private key (starts with a number)

### 3. **Set Environment Variables**
```bash
# Set your deployer private key
export DEPLOYER_PRIVATE_KEY=your_private_key_here

# Verify network
export REACT_APP_STACKS_NETWORK=testnet
```

### 4. **Deploy the Contract**
```bash
# Install dependencies (if not already done)
npm install

# Run deployment script
node deploy-chainlink-pay.js
```

### 5. **Update Your App Configuration**
After successful deployment, update your `.env` file:

```env
REACT_APP_CONTRACT_ADDRESS=SP_YOUR_DEPLOYED_ADDRESS
REACT_APP_CONTRACT_NAME=chainlink-pay
REACT_APP_DEMO_MODE=false
```

### 6. **Restart Your App**
```bash
# Stop the current app (Ctrl+C)
# Start again
npm start
```

## 🔍 Verification Steps

### Check Deployment
1. **Transaction Explorer**: Visit the transaction URL shown in the deployment output
2. **Contract Explorer**: Check your contract on Stacks Explorer
3. **Test Functions**: Try creating a payment in your app

### Common Issues & Solutions

#### ❌ "Insufficient Balance"
- **Solution**: Get more testnet STX from the faucet
- **Check**: Visit https://explorer.stacks.co/sandbox/faucet

#### ❌ "Invalid Private Key"
- **Solution**: Make sure you copied the full private key
- **Format**: Should be a long string starting with a number

#### ❌ "Transaction Failed"
- **Solution**: Wait a few minutes and try again
- **Check**: Ensure you have enough STX for gas fees

#### ❌ "Contract Already Exists"
- **Solution**: Use a different contract name or deploy to a different address
- **Alternative**: Deploy to mainnet with a new name

## 📊 Contract Features

The deployed contract includes:

### ✅ **Core Payment Functions**
- `create-payment` - Create payment links
- `mark-paid` - Mark payments as completed
- `get-payment` - Retrieve payment details
- `cancel-payment` - Cancel pending payments

### ✅ **Escrow Functions**
- `create-escrow` - Create escrow payments
- `release-escrow` - Release escrow funds
- `dispute-escrow` - Dispute escrow payments

### ✅ **Split Payment Functions**
- `create-split-config` - Create split payment configurations
- `get-split-config` - Get split payment details

### ✅ **Subscription Functions**
- `create-subscription` - Create recurring payments
- `process-subscription` - Process subscription payments
- `cancel-subscription` - Cancel subscriptions

### ✅ **Analytics Functions**
- `get-stats` - Get platform statistics
- `get-merchant-stats` - Get merchant-specific stats

## 🎯 Testing Your Deployment

### 1. **Create a Payment Link**
```javascript
// This will be called from your app
const result = await contractCall({
  contractAddress: 'SP_YOUR_ADDRESS',
  contractName: 'chainlink-pay',
  functionName: 'create-payment',
  functionArgs: [
    bufferCVFromString('payment-id-123'),
    principalCV('SP_MERCHANT_ADDRESS'),
    uintCV(1000000), // 1 STX in microSTX
    stringUtf8CV('Test payment description'),
    stringAsciiCV('STX'),
    uintCV(100) // expires in 100 blocks
  ]
});
```

### 2. **Check Payment Status**
```javascript
const payment = await contractCall({
  contractAddress: 'SP_YOUR_ADDRESS',
  contractName: 'chainlink-pay',
  functionName: 'get-payment',
  functionArgs: [bufferCVFromString('payment-id-123')]
});
```

### 3. **Mark as Paid**
```javascript
const result = await contractCall({
  contractAddress: 'SP_YOUR_ADDRESS',
  contractName: 'chainlink-pay',
  functionName: 'mark-paid',
  functionArgs: [bufferCVFromString('payment-id-123')]
});
```

## 🚨 Important Notes

### Security
- **Never share your private key**
- **Use testnet for development only**
- **Test thoroughly before mainnet deployment**

### Gas Fees
- **Testnet**: Minimal fees (usually < 0.01 STX)
- **Mainnet**: Higher fees (0.1-1 STX depending on network)

### Contract Limits
- **Payment ID**: 32 bytes maximum
- **Description**: 500 characters maximum
- **Recipients**: 20 maximum for split payments

## 📞 Support

If you encounter issues:

1. **Check the transaction on Stacks Explorer**
2. **Verify your environment variables**
3. **Ensure sufficient STX balance**
4. **Check contract syntax for errors**

## 🎉 Success!

Once deployed successfully, your ChainLinkPay app will have:
- ✅ Real blockchain payments
- ✅ Escrow functionality
- ✅ Split payments
- ✅ Subscription management
- ✅ Analytics tracking

Your app is now production-ready for the hackathon! 🚀
