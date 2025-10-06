# Switch to Real Payments (Mainnet)

## Quick Steps to Enable Real Payments

### 1. Update Environment Variables
```env
# Change these in your .env file:
REACT_APP_STACKS_NETWORK=mainnet
REACT_APP_STACKS_API_URL=https://api.hiro.so
REACT_APP_CONTRACT_ADDRESS=SP_YOUR_MAINNET_CONTRACT_ADDRESS
REACT_APP_MERCHANT_ADDRESS=SP_YOUR_MAINNET_WALLET_ADDRESS
```

### 2. Deploy Contract to Mainnet
```bash
# Deploy your contract to mainnet
clarinet deploy --network mainnet
```

### 3. Get Real STX
- Buy STX from exchanges
- Transfer to your wallet
- You'll need ~5-10 STX for deployment

### 4. Test with Small Amounts
- Start with 0.001 STX payments
- Verify on Stacks Explorer
- Check your wallet balance

## ⚠️ Important Warnings

### Real Money Mode
- **Real STX**: Users will pay with real money
- **Real Fees**: Transaction fees cost real STX
- **Irreversible**: Payments cannot be undone
- **Taxes**: May be taxable income

### Security
- **Backup Wallet**: Keep seed phrase safe
- **Test First**: Always test on testnet
- **Monitor**: Watch for failed transactions
- **Support**: Be ready to help users

## Current Status: Testnet Safe Mode

Right now your app is in **safe testnet mode**:
- ✅ No real money at risk
- ✅ Perfect for testing
- ✅ Great for hackathon demo
- ✅ Users can try without risk

## For Hackathon Demo

### Option 1: Keep Testnet (Recommended)
- Safe for demo
- No real money needed
- Users can try freely
- Perfect for judges to test

### Option 2: Switch to Mainnet
- Real payments work
- More impressive demo
- Requires real STX
- Higher stakes

## Recommendation

**For hackathon**: Keep testnet mode
- Judges can test safely
- No financial risk
- Easy to demonstrate
- Focus on functionality

**For production**: Switch to mainnet
- Real payments
- Real business value
- Requires careful setup
- Higher responsibility
