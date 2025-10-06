# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Stacks Configuration
REACT_APP_STACKS_NETWORK=testnet
REACT_APP_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
REACT_APP_CONTRACT_NAME=enhanced-payment
REACT_APP_MERCHANT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# OpenAI Configuration (Optional - for AI contract generation)
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Axelar Configuration
REACT_APP_AXELAR_ENV=testnet
REACT_APP_AXELAR_API_URL=https://api.axelarscan.io

# Bridge Configuration
REACT_APP_BRIDGE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
REACT_APP_BRIDGE_CONTRACT_NAME=bridge

# Development Configuration
REACT_APP_DEBUG=true
REACT_APP_VERSION=1.0.0
```

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp env.example .env
   ```

2. **Edit the .env file with your values:**
   - Replace `your_openai_api_key_here` with your actual OpenAI API key
   - Update contract addresses if needed
   - Adjust network settings as required

3. **Restart the development server:**
   ```bash
   npm start
   ```

## OpenAI API Key (Optional)

The OpenAI API key is optional. If not provided:
- ✅ The app will work with local templates
- ✅ AI contract generation will use fallback templates
- ✅ All other functionality remains fully operational

To get an OpenAI API key:
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add it to your `.env` file as `REACT_APP_OPENAI_API_KEY=your_key_here`

## Troubleshooting

### Environment Variables Not Loading
- Ensure the `.env` file is in the project root
- Restart the development server after adding variables
- Check that variable names start with `REACT_APP_`

### OpenAI Key Not Working
- Verify the key is correct and has sufficient credits
- Check that the key is properly set in the `.env` file
- Restart the development server after adding the key

### Contract Address Issues
- Ensure contract addresses are valid Stacks addresses
- Check that the contract is deployed on the correct network
- Verify the contract name matches the deployed contract
