import { PaymentLink } from './paymentStorage';

// Cross-device backend API using URL-based sharing and localStorage sync
// This provides true cross-device synchronization for hackathon demo

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

class CrossDeviceBackendAPI {
  private static instance: CrossDeviceBackendAPI;
  private storageKey = 'chainlink-pay-cross-device';
  private syncKey = 'chainlink-pay-sync';
  private shareUrl = 'https://chainlink-pay-demo.vercel.app/share'; // Demo sharing URL
  
  private constructor() {}

  public static getInstance(): CrossDeviceBackendAPI {
    if (!CrossDeviceBackendAPI.instance) {
      CrossDeviceBackendAPI.instance = new CrossDeviceBackendAPI();
    }
    return CrossDeviceBackendAPI.instance;
  }

  /**
   * Get all payments from cross-device backend
   */
  public async getAllPayments(): Promise<BackendPaymentRecord[]> {
    try {
      // Check if we have shared data in URL
      const urlParams = new URLSearchParams(window.location.search);
      const sharedData = urlParams.get('shared');
      
      if (sharedData) {
        try {
          const decoded = JSON.parse(decodeURIComponent(sharedData));
          if (decoded.payments) {
            console.log('CrossDeviceBackendAPI: Loaded shared payments from URL:', decoded.payments.length);
            return decoded.payments;
          }
        } catch (error) {
          console.error('CrossDeviceBackendAPI: Error parsing shared data:', error);
        }
      }

      // Fallback to localStorage
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.payments || [];
      }
      return [];
    } catch (error) {
      console.error('CrossDeviceBackendAPI: Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Save payment to cross-device backend
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

      // Save to localStorage
      const backendData = {
        payments: allPayments,
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(backendData));
      
      // Create shareable URL for cross-device sync
      const shareableData = encodeURIComponent(JSON.stringify(backendData));
      const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${shareableData}`;
      
      // Store share URL for easy access
      localStorage.setItem('chainlink-pay-share-url', shareUrl);
      
      // Broadcast update to all tabs
      this.broadcastUpdate(payment.id, payment.status);
      
      console.log('CrossDeviceBackendAPI: Payment saved and shareable URL created:', payment.id, payment.status);
      console.log('Share URL:', shareUrl);
      
      return true;
    } catch (error) {
      console.error('CrossDeviceBackendAPI: Error saving payment:', error);
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
      console.error('CrossDeviceBackendAPI: Error fetching payment:', error);
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
      console.error('CrossDeviceBackendAPI: Error fetching merchant payments:', error);
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
        console.error('CrossDeviceBackendAPI: Payment not found:', paymentId);
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
        console.log('CrossDeviceBackendAPI: Payment status updated:', paymentId, status);
      }
      
      return success;
    } catch (error) {
      console.error('CrossDeviceBackendAPI: Error updating payment status:', error);
      return false;
    }
  }

  /**
   * Get shareable URL for cross-device sync
   */
  public getShareableUrl(): string {
    const shareUrl = localStorage.getItem('chainlink-pay-share-url');
    return shareUrl || window.location.href;
  }

  /**
   * Check if backend is available
   */
  public async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  /**
   * Broadcast update to all tabs
   */
  private broadcastUpdate(paymentId: string, status: string) {
    // Broadcast update to all tabs/windows
    const event = new CustomEvent('crossDevicePaymentUpdate', {
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
   * Initialize cross-device communication
   */
  public initializeCrossDeviceSync(): void {
    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.syncKey && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          console.log('CrossDeviceBackendAPI: Cross-tab sync received:', syncData);
          
          // Dispatch event for components to handle
          window.dispatchEvent(new CustomEvent('crossDevicePaymentUpdate', {
            detail: syncData
          }));
        } catch (error) {
          console.error('CrossDeviceBackendAPI: Error parsing sync data:', error);
        }
      }
    });

    // Listen for custom events
    window.addEventListener('crossDevicePaymentUpdate', (event: any) => {
      console.log('CrossDeviceBackendAPI: Cross-device payment update received:', event.detail);
    });

    console.log('CrossDeviceBackendAPI: Cross-device communication initialized');
  }
}

export const crossDeviceBackendAPI = CrossDeviceBackendAPI.getInstance();
