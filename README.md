# 🔗 ChainLinkPay - Bitcoin Payment Platform

> **A revolutionary DeFi platform that bridges Bitcoin and Stacks ecosystems, enabling seamless cross-chain payments, AI-powered smart contract generation, and real-world financial solutions.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://chainlink-f41fxhmev-clementarthur753-1864s-projects.vercel.app)
[![Built with Stacks](https://img.shields.io/badge/Built%20with-Stacks-orange?style=for-the-badge&logo=bitcoin)](https://stacks.co)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

## 🌟 Overview

ChainLinkPay is a comprehensive DeFi platform that solves real-world problems by bridging the gap between Bitcoin and Stacks ecosystems. It provides a complete suite of financial tools including payment processing, cross-chain asset bridging, AI-powered smart contract generation, and comprehensive analytics.

### 🎯 Problem Solved

- **Multi-Chain Fragmentation**: Users struggle to move assets between Bitcoin, Stacks, Ethereum, and BNB Chain ecosystems
- **Complex Smart Contract Development**: Developers need AI assistance for Clarity contract creation
- **Payment Processing Complexity**: Merchants need simple, secure payment solutions across multiple chains
- **Lack of Real-World DeFi Applications**: Most DeFi projects don't solve actual business problems

### 💡 Solution

ChainLinkPay provides:
- **Multi-Chain Bridge**: Seamlessly move assets between Bitcoin, Stacks, Ethereum, and BNB Chain
- **AI Contract Builder**: Generate production-ready Clarity smart contracts
- **Payment Link System**: Create and manage payment links with real blockchain transactions
- **Comprehensive Dashboard**: Track all transactions and analytics across multiple chains
- **Real-World Integration**: Built for actual business use cases

## 🚀 Features

### 💳 Payment Processing
- **Real Blockchain Transactions**: All payments are processed on-chain using Stacks smart contracts
- **Multi-Asset Support**: Accept payments in STX and Bitcoin
- **Payment Links**: Generate shareable payment links for customers
- **Real-Time Status**: Track payment status with blockchain confirmation
- **Merchant Dashboard**: Comprehensive analytics and transaction history

### 🌉 Multi-Chain Bridge
- **Bitcoin ↔ Stacks ↔ Ethereum ↔ BNB Chain**: Comprehensive cross-chain asset transfers
- **Supported Assets**: BTC, STX, ETH, BNB, USDC, USDT
- **Live Exchange Rates**: Dynamic pricing based on market conditions
- **Competitive Fees**: 0.3% - 1% bridge fees depending on chain
- **Fast Processing**: 5-30 minute bridge completion
- **Transaction Tracking**: Real-time status updates

### 🤖 AI Smart Contract Builder
- **Natural Language Input**: Describe your contract in plain English
- **Clarity Generation**: Produces production-ready Clarity smart contracts
- **Template Library**: Pre-built templates for common use cases
- **Validation & Testing**: Built-in contract validation and improvement suggestions
- **OpenRouter Integration**: Powered by advanced AI models

### 📊 Analytics Dashboard
- **Real-Time Balance**: Live STX and Bitcoin balance tracking
- **Transaction History**: Complete payment and bridge transaction logs
- **Performance Metrics**: Revenue, volume, and growth analytics
- **Wallet Integration**: Seamless connection to Stacks and Bitcoin wallets

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Chakra UI v3** for modern, responsive design
- **Vite** for fast development and building
- **React Router** for navigation

### Blockchain
- **Stacks Blockchain** for smart contracts and STX transactions
- **Clarity** smart contract language
- **Bitcoin** integration for BTC payments
- **Stacks Connect** for wallet integration

### AI & Services
- **OpenRouter API** for AI contract generation
- **Axelar SDK** for cross-chain functionality
- **Local Storage** for payment link management

### Deployment
- **Vercel** for frontend hosting
- **Stacks Testnet** for smart contract deployment
- **Clarinet** for contract development and testing

## 📁 Project Structure

```
chainlink-pay/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── PaymentLinkGenerator.tsx
│   │   ├── WalletConnectButton.tsx
│   │   ├── TutorialModal.tsx
│   │   └── ...
│   ├── pages/              # Main application pages
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Pay.tsx
│   │   ├── Bridge.tsx
│   │   └── AIContractBuilder.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useStacksWallet.ts
│   │   ├── useBitcoinWallet.ts
│   │   └── useStxBalance.ts
│   ├── services/           # Business logic services
│   │   ├── aiService.ts
│   │   ├── paymentStorage.ts
│   │   └── payments.ts
│   └── config/             # Configuration files
│       └── stacksConfig.ts
├── contracts/              # Smart contracts
│   └── chainlink-pay.clar
├── public/                 # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Stacks wallet (Xverse, Leather, etc.)
- Bitcoin wallet (Unisat, OKX, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chainlink-pay.git
   cd chainlink-pay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Stacks Network Configuration
   REACT_APP_STACKS_NETWORK=testnet
   REACT_APP_STACKS_API_URL=https://api.testnet.hiro.so
   REACT_APP_CONTRACT_NAME=chainlink-pay
   REACT_APP_CONTRACT_ADDRESS=ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133
   REACT_APP_MERCHANT_ADDRESS=ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133

   # AI Configuration
   REACT_APP_OPENAI_API_KEY=your_openrouter_api_key_here
   REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here

   # Demo Mode
   REACT_APP_DEMO_MODE=false
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Smart Contract Deployment

The project includes a deployed smart contract on Stacks Testnet:

**Contract Address**: `ST5MNAJQ2VTGAQ7RP9EVBCQWYT0YHSKS4DM60133`
**Contract Name**: `chainlink-pay`

### Contract Functions
- `create-payment`: Register a new payment on-chain
- `mark-paid`: Mark a payment as completed
- `get-payment`: Retrieve payment details
- `bridge-to-bitcoin`: Bridge STX to Bitcoin
- `get-stats`: Get contract statistics

## 💰 How It Works

### Payment Flow
1. **Merchant** creates a payment link with amount and description
2. **Customer** scans the QR code or clicks the link
3. **Wallet** connects and processes the payment on-chain
4. **Smart Contract** records the transaction
5. **Dashboard** updates with real-time status

### Bridge Flow
1. **User** selects assets to bridge (STX ↔ Bitcoin)
2. **System** calculates exchange rate and fees
3. **User** confirms the bridge transaction
4. **Smart Contract** processes the cross-chain transfer
5. **Assets** arrive in destination wallet

### AI Contract Builder
1. **User** describes the desired contract functionality
2. **AI** generates Clarity smart contract code
3. **System** validates and suggests improvements
4. **User** can deploy or export the contract

## 🌐 Live Demo

**🔗 [Try ChainLinkPay Now](https://chainlink-f41fxhmev-clementarthur753-1864s-projects.vercel.app)**

### Demo Features
- ✅ Real wallet connections (Stacks & Bitcoin)
- ✅ Live payment processing
- ✅ Cross-chain bridge functionality
- ✅ AI contract generation
- ✅ Real-time analytics dashboard

## 📱 Supported Wallets

### Stacks Wallets
- **Xverse** (Recommended)
- **Leather** (Hiro)
- **Stacks Wallet**

### Bitcoin Wallets
- **Unisat**
- **OKX**
- **Bitget**
- **Xverse** (Bitcoin support)

## 🔒 Security Features

- **Smart Contract Auditing**: All contracts are validated and tested
- **Wallet Integration**: Secure connection through official wallet APIs
- **Real Blockchain Transactions**: No fake or simulated transactions
- **Error Handling**: Comprehensive error handling and user feedback
- **Input Validation**: All user inputs are validated and sanitized

## 🎯 Real-World Use Cases

### E-commerce
- Online stores can accept Bitcoin and STX payments
- Generate payment links for customers
- Track sales and revenue in real-time

### Freelancing
- Freelancers can receive payments in multiple cryptocurrencies
- Create payment requests for clients
- Bridge assets between different ecosystems

### DeFi Integration
- Bridge assets between Bitcoin and Stacks ecosystems
- Access DeFi protocols on both chains
- Optimize asset allocation across chains

### Business Payments
- B2B payments in cryptocurrency
- Cross-border transactions
- Automated payment processing

## 🚀 Future Roadmap

### Phase 1 (Current)
- ✅ Basic payment processing
- ✅ Cross-chain bridge
- ✅ AI contract builder
- ✅ Analytics dashboard

### Phase 2 (Next)
- 🔄 Multi-chain support (Ethereum, Polygon)
- 🔄 Advanced DeFi integrations
- 🔄 Mobile app development
- 🔄 API for third-party integrations

### Phase 3 (Future)
- 🔄 Institutional features
- 🔄 Advanced analytics
- 🔄 Compliance tools
- 🔄 Enterprise solutions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stacks Foundation** for the amazing blockchain platform
- **OpenRouter** for AI contract generation capabilities
- **Chakra UI** for the beautiful component library
- **Vercel** for seamless deployment

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/your-username/chainlink-pay/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/chainlink-pay/issues)
- **Discord**: [Join our community](https://discord.gg/your-discord)
- **Email**: support@chainlinkpay.com

## 🏆 Hackathon Submission

This project was built for the **Stacks Vibe Coding Hackathon** and demonstrates:

- ✅ **Real-world problem solving**: Bridges Bitcoin and Stacks ecosystems
- ✅ **Technical innovation**: AI-powered smart contract generation
- ✅ **User experience**: Intuitive interface for complex DeFi operations
- ✅ **Production ready**: Fully functional with real blockchain transactions
- ✅ **Comprehensive features**: Payment processing, bridging, analytics, and more

---

**Built with ❤️ for the Stacks ecosystem**

*ChainLinkPay - Making DeFi accessible to everyone*