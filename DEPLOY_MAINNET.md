# Deploy to Stacks Mainnet for Real Payments

## Prerequisites
1. **Mainnet STX**: You need real STX tokens to deploy (not testnet)
2. **Mainnet Wallet**: Connect your wallet to Stacks mainnet
3. **Clarinet Setup**: Configure for mainnet deployment

## Steps to Deploy

### 1. Get Mainnet STX
- Buy STX from exchanges (Coinbase, Binance, etc.)
- Transfer to your wallet address

### 2. Update Clarinet Configuration
```bash
# Update contracts/Clarinet.toml
[network.mainnet]
url = "https://api.hiro.so"
```

### 3. Deploy Contract
```bash
# Deploy to mainnet
clarinet deploy --network mainnet
```

### 4. Update Environment Variables
```env
# .env file
REACT_APP_STACKS_NETWORK=mainnet
REACT_APP_STACKS_API_URL=https://api.hiro.so
REACT_APP_CONTRACT_ADDRESS=SP_YOUR_MAINNET_CONTRACT_ADDRESS
REACT_APP_MERCHANT_ADDRESS=SP_YOUR_MAINNET_WALLET_ADDRESS
```

## ⚠️ Important Notes

### Security Considerations
- **Real Money**: Mainnet uses real STX tokens (worth real money)
- **Testing**: Always test thoroughly on testnet first
- **Backup**: Keep your wallet seed phrase safe
- **Gas Fees**: Mainnet transactions cost real STX

### Cost Estimates
- **Contract Deployment**: ~5-10 STX (~$5-10 USD)
- **Transaction Fees**: ~0.001 STX per transaction (~$0.001 USD)

### Legal Compliance
- **Regulations**: Check local laws regarding cryptocurrency payments
- **Taxes**: Real payments may be taxable
- **KYC**: Consider if you need customer verification

## Testing Real Payments

### 1. Start with Small Amounts
- Test with 0.001 STX first
- Verify transactions on Stacks Explorer
- Check wallet balances

### 2. Monitor Transactions
- Use Stacks Explorer: https://explorer.stacks.co
- Check your wallet balance
- Verify contract interactions

### 3. User Experience
- Users need real STX in their wallets
- They'll pay real transaction fees
- Payments are irreversible

## Alternative: Hybrid Approach

### Testnet for Development
- Keep using testnet for development
- Test all features thoroughly

### Mainnet for Production
- Deploy to mainnet when ready
- Use environment variables to switch
- Have both testnet and mainnet versions

## Environment Switching

```javascript
// In your app, you can switch environments
const isMainnet = process.env.REACT_APP_STACKS_NETWORK === 'mainnet';
const networkName = isMainnet ? 'Mainnet' : 'Testnet';

// Show appropriate warnings
if (isMainnet) {
  console.warn('⚠️ REAL MONEY MODE - Using mainnet STX');
}
```

## Next Steps

1. **Get Mainnet STX**: Buy from exchanges
2. **Deploy Contract**: Use Clarinet to deploy
3. **Update Environment**: Set mainnet variables
4. **Test Thoroughly**: Start with small amounts
5. **Monitor**: Watch transactions and balances

Remember: **Real payments mean real money!** Always test on testnet first.
