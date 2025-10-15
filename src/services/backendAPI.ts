import { PaymentLink } from './paymentStorage';

// Demo backend API using localStorage with cross-tab communication
// This provides centralized storage accessible from any device/browser for hackathon demo

interface BackendPaymentRecord {
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

interface BackendResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class BackendAPI {
  private static instance: BackendAPI;
  private storageKey = 'chainlink-pay-backend-demo';
  private syncKey = 'chainlink-pay-sync';
  
  private constructor() {}

  public static getInstance(): BackendAPI {
    if (!BackendAPI.instance) {
      BackendAPI.instance = new BackendAPI();
    }
    return BackendAPI.instance;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse> {
    try {
      // For demo purposes, we'll use localStorage with cross-tab communication
      // This simulates a backend API for the hackathon demo
      return { success: true, data: {} };
    } catch (error: any) {
      console.error('BackendAPI: Request failed:', error);
      return { success: false, error: error.message };
    }
  }

  private broadcastUpdate(paymentId: string, status: string) {
    // Broadcast update to all tabs/windows
    const event = new CustomEvent('backendPaymentUpdate', {
      detail: { paymentId, status, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
    
    // Also use localStorage event for cross-tab communication
    localStorage.setItem(this.syncKey, JSON.stringify({
      paymentId,
      status,
      timestamp: Date.now()
    }));
  }

  /**
   * Get all payments from backend (localStorage for demo)
   */
  public async getAllPayments(): Promise<BackendPaymentRecord[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.payments || [];
      }
      return [];
    } catch (error) {
      console.error('BackendAPI: Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Save payment to backend (localStorage for demo)
   */
  public async savePayment(payment: PaymentLink): Promise<boolean> {
    try {
      const paymentRecord: BackendPaymentRecord = {
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

      // Get existing payments
      const allPayments = await this.getAllPayments();
      
      // Update or add payment
      const existingIndex = allPayments.findIndex(p => p.id === payment.id);
      if (existingIndex >= 0) {
        allPayments[existingIndex] = paymentRecord;
      } else {
        allPayments.push(paymentRecord);
      }

      // Save to localStorage (simulating backend)
      const backendData = {
        payments: allPayments,
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(backendData));
      
      // Broadcast update to all tabs
      this.broadcastUpdate(payment.id, payment.status);
      
      console.log('BackendAPI: Payment saved successfully:', payment.id, payment.status);
      return true;
    } catch (error) {
      console.error('BackendAPI: Error saving payment:', error);
      return false;
    }
  }

  /**
   * Get payment by ID
   */
  public async getPayment(paymentId: string): Promise<BackendPaymentRecord | null> {
    try {
      const allPayments = await this.getAllPayments();
      return allPayments.find(p => p.id === paymentId) || null;
    } catch (error) {
      console.error('BackendAPI: Error fetching payment:', error);
      return null;
    }
  }

  /**
   * Get payments by merchant address
   */
  public async getPaymentsByMerchant(merchantAddress: string): Promise<BackendPaymentRecord[]> {
    try {
      const allPayments = await this.getAllPayments();
      return allPayments.filter(p => p.merchantAddress === merchantAddress);
    } catch (error) {
      console.error('BackendAPI: Error fetching merchant payments:', error);
      return [];
    }
  }

  /**
   * Update payment status
   */
  public async updatePaymentStatus(
    paymentId: string, 
    status: 'pending' | 'paid' | 'cancelled' | 'expired',
    txHash?: string,
    payerAddress?: string
  ): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        console.error('BackendAPI: Payment not found:', paymentId);
        return false;
      }

      const updatedPayment: BackendPaymentRecord = {
        ...payment,
        status,
        txHash: txHash || payment.txHash,
        payerAddress: payerAddress || payment.payerAddress,
        paidAt: status === 'paid' ? Date.now() : payment.paidAt,
        lastUpdated: Date.now()
      };

      const success = await this.savePayment(updatedPayment as PaymentLink);
      
      if (success) {
        console.log('BackendAPI: Payment status updated:', paymentId, status);
      }
      
      return success;
    } catch (error) {
      console.error('BackendAPI: Error updating payment status:', error);
      return false;
    }
  }

  /**
   * Check if backend is available (always true for localStorage demo)
   */
  public async isAvailable(): Promise<boolean> {
    return true; // localStorage is always available
  }

  /**
   * Initialize cross-tab communication
   */
  public initializeCrossTabSync(): void {
    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.syncKey && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          console.log('BackendAPI: Cross-tab sync received:', syncData);
          
          // Dispatch event for components to handle
          window.dispatchEvent(new CustomEvent('backendPaymentUpdate', {
            detail: syncData
          }));
        } catch (error) {
          console.error('BackendAPI: Error parsing sync data:', error);
        }
      }
    });

    // Listen for custom events
    window.addEventListener('backendPaymentUpdate', (event: any) => {
      console.log('BackendAPI: Backend payment update received:', event.detail);
    });

    console.log('BackendAPI: Cross-tab communication initialized');
  }
}

export const backendAPI = BackendAPI.getInstance();
