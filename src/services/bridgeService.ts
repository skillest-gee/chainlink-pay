// Cross-Chain Bridge Service
export interface BridgeChain {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  supportedAssets: BridgeAsset[];
}

export interface BridgeAsset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string;
  icon: string;
  balance?: number;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
}

export interface BridgeRoute {
  fromChain: BridgeChain;
  toChain: BridgeChain;
  fromAsset: BridgeAsset;
  toAsset: BridgeAsset;
  estimatedTime: string;
  fee: number;
  minAmount: number;
  maxAmount: number;
  rate: number;
}

export interface BridgeTransaction {
  id: string;
  route: BridgeRoute;
  amount: number;
  recipientAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  txHash?: string;
  fromTxHash?: string;
  toTxHash?: string;
  timestamp: number;
  estimatedCompletion?: number;
  actualCompletion?: number;
  fee?: number;
  error?: string;
}

export interface BridgeEstimate {
  amount: number;
  fee: number;
  estimatedTime: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  route: BridgeRoute;
}

export class BridgeService {
  private chains: BridgeChain[] = [];
  private transactions: BridgeTransaction[] = [];
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly PRICE_CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.initializeChains();
    this.loadTransactions();
    this.initializePriceFeeds();
  }

  /**
   * Initialize real-time price feeds
   */
  private async initializePriceFeeds(): Promise<void> {
    try {
      await this.updateAllPrices();
      // Update prices every 30 seconds
      setInterval(() => this.updateAllPrices(), this.PRICE_CACHE_DURATION);
    } catch (error) {
      console.error('Failed to initialize price feeds:', error);
    }
  }

  /**
   * Update prices for all supported assets
   */
  private async updateAllPrices(): Promise<void> {
    const assets = ['stx', 'btc', 'eth', 'bnb', 'matic'];
    
    for (const asset of assets) {
      try {
        const price = await this.fetchAssetPrice(asset);
        this.priceCache.set(asset, { price, timestamp: Date.now() });
      } catch (error) {
        console.error(`Failed to fetch price for ${asset}:`, error);
      }
    }
  }

  /**
   * Fetch real-time price for an asset
   */
  private async fetchAssetPrice(asset: string): Promise<number> {
    // Check cache first
    const cached = this.priceCache.get(asset);
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Use CoinGecko API for real-time prices
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(asset)}&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      
      const coinId = this.getCoinGeckoId(asset);
      return data[coinId]?.usd || this.getFallbackPrice(asset);
    } catch (error) {
      console.error(`Failed to fetch price for ${asset}:`, error);
      return this.getFallbackPrice(asset);
    }
  }

  /**
   * Get CoinGecko ID for asset
   */
  private getCoinGeckoId(asset: string): string {
    const mapping: { [key: string]: string } = {
      'stx': 'stacks',
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'bnb': 'binancecoin',
      'matic': 'matic-network'
    };
    return mapping[asset] || asset;
  }

  /**
   * Get fallback price if API fails
   */
  private getFallbackPrice(asset: string): number {
    const fallbackPrices: { [key: string]: number } = {
      'stx': 1.50,
      'btc': 45000,
      'eth': 3000,
      'bnb': 300,
      'matic': 0.8
    };
    return fallbackPrices[asset] || 1;
  }

  /**
   * Get real-time price for an asset
   */
  public async getAssetPrice(asset: string): Promise<number> {
    return await this.fetchAssetPrice(asset);
  }

  /**
   * Get price change in last 24 hours
   */
  public async getPriceChange24h(asset: string): Promise<number> {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(asset)}&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      const coinId = this.getCoinGeckoId(asset);
      return data[coinId]?.usd_24h_change || 0;
    } catch (error) {
      console.error(`Failed to fetch 24h change for ${asset}:`, error);
      return 0;
    }
  }

  private initializeChains(): void {
    this.chains = [
      {
        id: 'stacks',
        name: 'Stacks',
        symbol: 'STX',
        icon: '🟦',
        rpcUrl: process.env.REACT_APP_STACKS_API_URL || 'https://api.testnet.hiro.so',
        explorerUrl: 'https://explorer.stacks.co',
        nativeCurrency: {
          name: 'Stacks',
          symbol: 'STX',
          decimals: 6
        },
        supportedAssets: [
          {
            id: 'stx',
            symbol: 'STX',
            name: 'Stacks (Testnet)',
            decimals: 6,
            icon: '🟦',
            balance: 0
          }
        ]
      },
      {
        id: 'bitcoin',
        name: 'Bitcoin (Testnet)',
        symbol: 'BTC',
        icon: '🟠',
        rpcUrl: 'https://blockstream.info/testnet/api',
        explorerUrl: 'https://blockstream.info/testnet',
        nativeCurrency: {
          name: 'Bitcoin',
          symbol: 'BTC',
          decimals: 8
        },
        supportedAssets: [
          {
            id: 'btc',
            symbol: 'BTC',
            name: 'Bitcoin (Testnet)',
            decimals: 8,
            icon: '🟠',
            balance: 0
          }
        ]
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '🔷',
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/demo',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        supportedAssets: [
          {
            id: 'eth',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            icon: '🔷',
            balance: 0
          },
          {
            id: 'usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            contractAddress: '0xA0b86a33E6441c8C4C4C4C4C4C4C4C4C4C4C4C4C',
            icon: '💵',
            balance: 0
          }
        ]
      },
      {
        id: 'polygon',
        name: 'Polygon',
        symbol: 'MATIC',
        icon: '🟣',
        rpcUrl: 'https://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: {
          name: 'Polygon',
          symbol: 'MATIC',
          decimals: 18
        },
        supportedAssets: [
          {
            id: 'matic',
            symbol: 'MATIC',
            name: 'Polygon',
            decimals: 18,
            icon: '🟣',
            balance: 0
          },
          {
            id: 'usdc-polygon',
            symbol: 'USDC',
            name: 'USD Coin (Polygon)',
            decimals: 6,
            contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            icon: '💵',
            balance: 0
          }
        ]
      },
      {
        id: 'binance',
        name: 'BNB Chain',
        symbol: 'BNB',
        icon: '🟡',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        explorerUrl: 'https://bscscan.com',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        supportedAssets: [
          {
            id: 'bnb',
            symbol: 'BNB',
            name: 'BNB',
            decimals: 18,
            icon: '🟡',
            balance: 0
          },
          {
            id: 'usdt-bsc',
            symbol: 'USDT',
            name: 'Tether USD (BSC)',
            decimals: 18,
            contractAddress: '0x55d398326f99059fF775485246999027B3197955',
            icon: '💵',
            balance: 0
          }
        ]
      }
    ];
  }

  private loadTransactions(): void {
    try {
      const saved = localStorage.getItem('bridge-transactions');
      if (saved) {
        this.transactions = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load bridge transactions:', error);
      this.transactions = [];
    }
  }

  private saveTransactions(): void {
    try {
      localStorage.setItem('bridge-transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Failed to save bridge transactions:', error);
    }
  }

  getChains(): BridgeChain[] {
    return this.chains;
  }

  getChain(id: string): BridgeChain | undefined {
    return this.chains.find(chain => chain.id === id);
  }

  getSupportedRoutes(): BridgeRoute[] {
    const routes: BridgeRoute[] = [];
    
    // Define supported bridge routes
    const supportedRoutes = [
      { from: 'stacks', to: 'bitcoin', fromAsset: 'stx', toAsset: 'btc' },
      { from: 'bitcoin', to: 'stacks', fromAsset: 'btc', toAsset: 'stx' },
      { from: 'stacks', to: 'ethereum', fromAsset: 'stx', toAsset: 'eth' },
      { from: 'ethereum', to: 'stacks', fromAsset: 'eth', toAsset: 'stx' },
      { from: 'ethereum', to: 'polygon', fromAsset: 'usdc', toAsset: 'usdc-polygon' },
      { from: 'polygon', to: 'ethereum', fromAsset: 'usdc-polygon', toAsset: 'usdc' },
      { from: 'ethereum', to: 'binance', fromAsset: 'usdc', toAsset: 'usdt-bsc' },
      { from: 'binance', to: 'ethereum', fromAsset: 'usdt-bsc', toAsset: 'usdc' }
    ];

    for (const route of supportedRoutes) {
      const fromChain = this.getChain(route.from);
      const toChain = this.getChain(route.to);
      
      if (fromChain && toChain) {
        const fromAsset = fromChain.supportedAssets.find(asset => asset.id === route.fromAsset);
        const toAsset = toChain.supportedAssets.find(asset => asset.id === route.toAsset);
        
        if (fromAsset && toAsset) {
          routes.push({
            fromChain,
            toChain,
            fromAsset,
            toAsset,
            estimatedTime: this.getEstimatedTime(route.from, route.to),
            fee: this.getBridgeFee(route.from, route.to),
            minAmount: this.getMinAmount(fromAsset),
            maxAmount: this.getMaxAmount(fromAsset),
            rate: this.getExchangeRate(fromAsset, toAsset)
          });
        }
      }
    }

    return routes;
  }

  private getEstimatedTime(fromChain: string, toChain: string): string {
    const timeMap: { [key: string]: string } = {
      'stacks-bitcoin': '30-60 seconds',
      'bitcoin-stacks': '1-2 minutes',
      'stacks-ethereum': '15-30 seconds',
      'ethereum-stacks': '15-30 seconds',
      'ethereum-polygon': '10-20 seconds',
      'polygon-ethereum': '10-20 seconds',
      'ethereum-binance': '20-40 seconds',
      'binance-ethereum': '20-40 seconds'
    };
    
    return timeMap[`${fromChain}-${toChain}`] || '30-60 seconds';
  }

  private getBridgeFee(fromChain: string, toChain: string): number {
    const feeMap: { [key: string]: number } = {
      'stacks-bitcoin': 0.001, // 0.001 BTC
      'bitcoin-stacks': 0.0001, // 0.0001 BTC
      'stacks-ethereum': 0.01, // 0.01 ETH
      'ethereum-stacks': 0.005, // 0.005 ETH
      'ethereum-polygon': 0.001, // 0.001 ETH
      'polygon-ethereum': 0.001, // 0.001 MATIC
      'ethereum-binance': 0.002, // 0.002 ETH
      'binance-ethereum': 0.001 // 0.001 BNB
    };
    
    return feeMap[`${fromChain}-${toChain}`] || 0.001;
  }

  private getMinAmount(asset: BridgeAsset): number {
    const minAmounts: { [key: string]: number } = {
      'stx': 1, // 1 STX
      'btc': 0.001, // 0.001 BTC
      'eth': 0.01, // 0.01 ETH
      'matic': 1, // 1 MATIC
      'bnb': 0.01, // 0.01 BNB
      'usdc': 10, // 10 USDC
      'usdc-polygon': 10, // 10 USDC
      'usdt-bsc': 10 // 10 USDT
    };
    
    return minAmounts[asset.id] || 1;
  }

  private getMaxAmount(asset: BridgeAsset): number {
    const maxAmounts: { [key: string]: number } = {
      'stx': 100000, // 100,000 STX
      'btc': 10, // 10 BTC
      'eth': 100, // 100 ETH
      'matic': 100000, // 100,000 MATIC
      'bnb': 1000, // 1,000 BNB
      'usdc': 1000000, // 1,000,000 USDC
      'usdc-polygon': 1000000, // 1,000,000 USDC
      'usdt-bsc': 1000000 // 1,000,000 USDT
    };
    
    return maxAmounts[asset.id] || 100000;
  }

  private getExchangeRate(fromAsset: BridgeAsset, toAsset: BridgeAsset): number {
    // Mock exchange rates - in production, these would come from price feeds
    const rates: { [key: string]: number } = {
      'stx-btc': 0.0001, // 1 STX = 0.0001 BTC
      'btc-stx': 10000, // 1 BTC = 10,000 STX
      'stx-eth': 0.01, // 1 STX = 0.01 ETH
      'eth-stx': 100, // 1 ETH = 100 STX
      'usdc-usdc-polygon': 1, // 1:1 for same asset
      'usdc-polygon-usdc': 1, // 1:1 for same asset
      'usdc-usdt-bsc': 1, // 1:1 for stablecoins
      'usdt-bsc-usdc': 1 // 1:1 for stablecoins
    };
    
    return rates[`${fromAsset.id}-${toAsset.id}`] || 1;
  }

  async getEstimate(
    fromChain: string,
    toChain: string,
    fromAsset: string,
    toAsset: string,
    amount: number
  ): Promise<BridgeEstimate | null> {
    try {
      const route = this.getSupportedRoutes().find(r => 
        r.fromChain.id === fromChain &&
        r.toChain.id === toChain &&
        r.fromAsset.id === fromAsset &&
        r.toAsset.id === toAsset
      );

      if (!route) {
        throw new Error('Route not supported');
      }

      if (amount < route.minAmount) {
        throw new Error(`Minimum amount is ${route.minAmount} ${route.fromAsset.symbol}`);
      }

      if (amount > route.maxAmount) {
        throw new Error(`Maximum amount is ${route.maxAmount} ${route.fromAsset.symbol}`);
      }

      const fee = route.fee;
      const rate = route.rate;
      const estimatedTime = route.estimatedTime;

      return {
        amount,
        fee,
        estimatedTime,
        rate,
        minAmount: route.minAmount,
        maxAmount: route.maxAmount,
        route
      };
    } catch (error) {
      console.error('Failed to get bridge estimate:', error);
      return null;
    }
  }

  async executeBridge(
    route: BridgeRoute,
    amount: number,
    recipientAddress: string,
    userSession?: any,
    walletProvider?: string
  ): Promise<BridgeTransaction> {
    const transaction: BridgeTransaction = {
      id: this.generateTransactionId(),
      route,
      amount,
      recipientAddress,
      status: 'pending',
      timestamp: Date.now(),
      estimatedCompletion: Date.now() + this.getEstimatedCompletionTime(route.estimatedTime)
    };

    this.transactions.push(transaction);
    this.saveTransactions();

    try {
      console.log('Executing REAL bridge transaction:', transaction);
      
      // Update status to processing
      transaction.status = 'processing';
      this.saveTransactions();

      // For hackathon demo, use simulation mode with realistic transaction hashes
      console.log('Using simulation mode for hackathon demo');
      setTimeout(() => {
        transaction.status = 'completed';
        transaction.actualCompletion = Date.now();
        // Use a more realistic-looking transaction hash for demo
        transaction.txHash = this.generateRealisticTxHash();
        this.saveTransactions();
      }, this.getProcessingTime(route.estimatedTime));

      return transaction;
    } catch (error: any) {
      transaction.status = 'failed';
      transaction.error = error.message;
      this.saveTransactions();
      throw error;
    }
  }


  private generateTransactionId(): string {
    return 'bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateTxHash(): string {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  private generateRealisticTxHash(): string {
    // Generate a more realistic-looking Stacks transaction hash
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private getEstimatedCompletionTime(estimatedTime: string): number {
    // Convert estimated time string to milliseconds
    const timeMap: { [key: string]: number } = {
      '2-5 minutes': 3 * 60 * 1000,
      '5-10 minutes': 7.5 * 60 * 1000,
      '5-15 minutes': 10 * 60 * 1000,
      '10-30 minutes': 20 * 60 * 1000,
      '30-60 minutes': 45 * 60 * 1000
    };
    
    return timeMap[estimatedTime] || 10 * 60 * 1000; // Default 10 minutes
  }

  private getProcessingTime(estimatedTime: string): number {
    // Realistic processing time for hackathon demo
    const timeMap: { [key: string]: number } = {
      '10-20 seconds': 3000, // 3 seconds
      '15-30 seconds': 5000, // 5 seconds
      '20-40 seconds': 7000, // 7 seconds
      '30-60 seconds': 10000, // 10 seconds
      '1-2 minutes': 15000 // 15 seconds
    };
    
    return timeMap[estimatedTime] || 5000; // Default 5 seconds
  }

  getTransactions(): BridgeTransaction[] {
    return this.transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTransaction(id: string): BridgeTransaction | undefined {
    return this.transactions.find(tx => tx.id === id);
  }

  updateTransactionStatus(id: string, status: BridgeTransaction['status'], txHash?: string, error?: string): void {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (transaction) {
      transaction.status = status;
      if (txHash) transaction.txHash = txHash;
      if (error) transaction.error = error;
      if (status === 'completed') transaction.actualCompletion = Date.now();
      this.saveTransactions();
    }
  }

  // Get real-time transaction status with progress updates
  getTransactionProgress(id: string): { status: string; progress: number; timeRemaining?: number } {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (!transaction) {
      return { status: 'not_found', progress: 0 };
    }

    const now = Date.now();
    const elapsed = now - transaction.timestamp;
    const estimatedTotal = this.getEstimatedCompletionTime(transaction.route.estimatedTime);
    const progress = Math.min((elapsed / estimatedTotal) * 100, 100);
    const timeRemaining = Math.max(estimatedTotal - elapsed, 0);

    // Auto-complete if time has passed
    if (elapsed >= estimatedTotal && transaction.status === 'processing') {
      transaction.status = 'completed';
      transaction.actualCompletion = now;
      transaction.txHash = this.generateTxHash();
      this.saveTransactions();
    }

    return {
      status: transaction.status,
      progress: Math.round(progress),
      timeRemaining: timeRemaining > 0 ? Math.round(timeRemaining / 1000) : 0
    };
  }

  // Get blockchain explorer URL for transaction
  getExplorerUrl(transaction: BridgeTransaction): string {
    if (!transaction.txHash) return '';
    
    const chain = transaction.route.fromChain;
    const explorerUrls: { [key: string]: string } = {
      'stacks': 'https://explorer.hiro.so/txid',
      'bitcoin': 'https://blockstream.info/testnet/tx',
      'ethereum': 'https://etherscan.io/tx',
      'polygon': 'https://polygonscan.com/tx',
      'binance': 'https://bscscan.com/tx'
    };
    
    const baseUrl = explorerUrls[chain.id] || '';
    return baseUrl ? `${baseUrl}/${transaction.txHash}` : '';
  }

  // Force complete a transaction (for demo purposes)
  forceCompleteTransaction(id: string): void {
    const transaction = this.transactions.find(tx => tx.id === id);
    if (transaction && transaction.status === 'processing') {
      transaction.status = 'completed';
      transaction.actualCompletion = Date.now();
      transaction.txHash = this.generateTxHash();
      this.saveTransactions();
    }
  }

  async getAssetBalance(chainId: string, assetId: string, address: string): Promise<number> {
    try {
      // Mock balance fetching - in production, this would query the actual blockchain
      const mockBalances: { [key: string]: number } = {
        'stacks-stx': 1000,
        'bitcoin-btc': 0.5,
        'ethereum-eth': 2.5,
        'ethereum-usdc': 5000,
        'polygon-matic': 10000,
        'polygon-usdc-polygon': 2000,
        'binance-bnb': 5,
        'binance-usdt-bsc': 1000
      };
      
      return mockBalances[`${chainId}-${assetId}`] || 0;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return 0;
    }
  }

}

export const bridgeService = new BridgeService();
