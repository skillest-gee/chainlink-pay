import { PaymentLink } from './paymentStorage';

interface PaymentStatusRecord {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  txHash?: string;
  payerAddress?: string;
  paidAt?: number;
  merchantAddress: string;
  amount: string;
  description?: string;
  paymentType: 'STX' | 'BTC';
  createdAt: number;
  lastUpdated: number;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PaymentStatusAPI {
  private static instance: PaymentStatusAPI;
  private baseURL: string;
  private cache: Map<string, PaymentStatusRecord> = new Map();
  private lastSyncTime: number = 0;

  private constructor() {
    // Use a simple JSON storage service or create our own endpoint
    // For now, we'll use a public JSON storage service like JSONBin or create a simple API
    this.baseURL = 'https://api.jsonbin.io/v3/b';
    this.initializeAPI();
  }

  public static getInstance(): PaymentStatusAPI {
    if (!PaymentStatusAPI.instance) {
      PaymentStatusAPI.instance = new PaymentStatusAPI();
    }
    return PaymentStatusAPI.instance;
  }

  private async initializeAPI() {
    // Initialize with empty data if needed
    try {
      await this.getAllPayments();
    } catch (error) {
      console.log('PaymentStatusAPI: Initializing with empty data');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$YOUR_JSONBIN_KEY', // Replace with actual key
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error('PaymentStatusAPI: Request failed:', error);
      return { success: false, error: error.message };
    }
  }

  public async savePayment(payment: PaymentLink): Promise<boolean> {
    try {
      const paymentRecord: PaymentStatusRecord = {
        id: payment.id,
        status: payment.status,
        txHash: payment.txHash,
        payerAddress: payment.payerAddress,
        paidAt: payment.paidAt,
        merchantAddress: payment.merchantAddress,
        amount: payment.amount,
        description: payment.description,
        paymentType: payment.paymentType || 'STX',
        createdAt: payment.createdAt,
        lastUpdated: Date.now()
      };

      // Update cache
      this.cache.set(payment.id, paymentRecord);

      // For now, we'll use a simple approach with localStorage as backup
      // In production, this would sync to a real backend
      const allPayments = await this.getAllPayments();
      const existingIndex = allPayments.findIndex(p => p.id === payment.id);
      
      if (existingIndex >= 0) {
        allPayments[existingIndex] = paymentRecord;
      } else {
        allPayments.push(paymentRecord);
      }

      // Store in localStorage as backup
      localStorage.setItem('chainlink-pay-api-cache', JSON.stringify(Array.from(this.cache.entries())));
      
      console.log('PaymentStatusAPI: Payment saved:', payment.id, payment.status);
      return true;
    } catch (error) {
      console.error('PaymentStatusAPI: Error saving payment:', error);
      return false;
    }
  }

  public async getPayment(paymentId: string): Promise<PaymentStatusRecord | null> {
    try {
      // Check cache first
      if (this.cache.has(paymentId)) {
        return this.cache.get(paymentId)!;
      }

      // Load from localStorage backup
      const cached = localStorage.getItem('chainlink-pay-api-cache');
      if (cached) {
        const cacheEntries = JSON.parse(cached);
        this.cache = new Map(cacheEntries);
        if (this.cache.has(paymentId)) {
          return this.cache.get(paymentId)!;
        }
      }

      return null;
    } catch (error) {
      console.error('PaymentStatusAPI: Error getting payment:', error);
      return null;
    }
  }

  public async getAllPayments(): Promise<PaymentStatusRecord[]> {
    try {
      // Load from localStorage backup
      const cached = localStorage.getItem('chainlink-pay-api-cache');
      if (cached) {
        const cacheEntries = JSON.parse(cached);
        this.cache = new Map(cacheEntries);
        return Array.from(this.cache.values());
      }

      return [];
    } catch (error) {
      console.error('PaymentStatusAPI: Error getting all payments:', error);
      return [];
    }
  }

  public async getPaymentsByMerchant(merchantAddress: string): Promise<PaymentStatusRecord[]> {
    try {
      const allPayments = await this.getAllPayments();
      return allPayments.filter(p => p.merchantAddress === merchantAddress);
    } catch (error) {
      console.error('PaymentStatusAPI: Error getting payments by merchant:', error);
      return [];
    }
  }

  public async updatePaymentStatus(paymentId: string, status: 'pending' | 'paid' | 'cancelled' | 'expired', txHash?: string, payerAddress?: string): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        console.error('PaymentStatusAPI: Payment not found:', paymentId);
        return false;
      }

      const updatedPayment: PaymentStatusRecord = {
        ...payment,
        status,
        txHash: txHash || payment.txHash,
        payerAddress: payerAddress || payment.payerAddress,
        paidAt: status === 'paid' ? Date.now() : payment.paidAt,
        lastUpdated: Date.now()
      };

      return await this.savePayment(updatedPayment as PaymentLink);
    } catch (error) {
      console.error('PaymentStatusAPI: Error updating payment status:', error);
      return false;
    }
  }

  public async checkBlockchainStatus(txId: string): Promise<'pending' | 'confirmed' | 'cancelled' | 'unknown'> {
    try {
      console.log('PaymentStatusAPI: Checking blockchain status for:', txId);
      
      const network = process.env.REACT_APP_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
      const apiUrl = network === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('PaymentStatusAPI: Transaction not found yet, still pending');
          return 'pending';
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('PaymentStatusAPI: Blockchain transaction data:', data);

      if (data.tx_status === 'success') {
        console.log('PaymentStatusAPI: Transaction confirmed on blockchain!');
        return 'confirmed';
      } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        console.log('PaymentStatusAPI: Transaction failed on blockchain:', data.tx_status);
        return 'cancelled';
      } else {
        console.log('PaymentStatusAPI: Transaction still pending on blockchain:', data.tx_status);
        return 'pending';
      }
    } catch (error) {
      console.error('PaymentStatusAPI: Error checking blockchain status:', error);
      return 'unknown';
    }
  }

  public async syncWithBlockchain(): Promise<void> {
    try {
      console.log('PaymentStatusAPI: Syncing with blockchain...');
      const allPayments = await this.getAllPayments();
      const pendingPayments = allPayments.filter(p => p.status === 'pending' && p.txHash);
      
      for (const payment of pendingPayments) {
        if (payment.txHash) {
          const blockchainStatus = await this.checkBlockchainStatus(payment.txHash);
          
          if (blockchainStatus === 'confirmed' && payment.status !== 'paid') {
            console.log('PaymentStatusAPI: Updating payment status to paid:', payment.id);
            await this.updatePaymentStatus(payment.id, 'paid', payment.txHash, payment.payerAddress);
            
            // Dispatch update event
            this.dispatchPaymentUpdate(payment.id, 'paid');
          } else if (blockchainStatus === 'cancelled' && payment.status !== 'cancelled') {
            console.log('PaymentStatusAPI: Updating payment status to cancelled:', payment.id);
            await this.updatePaymentStatus(payment.id, 'cancelled', payment.txHash, payment.payerAddress);
            
            // Dispatch update event
            this.dispatchPaymentUpdate(payment.id, 'cancelled');
          }
        }
      }
      
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('PaymentStatusAPI: Error syncing with blockchain:', error);
    }
  }

  private dispatchPaymentUpdate(paymentId: string, status: string) {
    const event = new CustomEvent('paymentStatusAPIUpdate', {
      detail: {
        paymentId,
        status,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  public startPeriodicSync(intervalMs: number = 5000) {
    setInterval(() => {
      this.syncWithBlockchain();
    }, intervalMs);
  }
}

export const paymentStatusAPI = PaymentStatusAPI.getInstance();
