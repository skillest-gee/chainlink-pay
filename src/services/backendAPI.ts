import { PaymentLink } from './paymentStorage';

// Simple backend API using JSONBin.io for hackathon demo
// This provides centralized storage accessible from any device/browser

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
  private baseUrl = 'https://api.jsonbin.io/v3/b';
  private binId = '675a1b2e1f5677401f2c8a1a'; // Demo bin ID
  private apiKey = '$2a$10$8K1p/a0dL3Y7Z1x9vB2cRe'; // Demo API key
  
  private constructor() {}

  public static getInstance(): BackendAPI {
    if (!BackendAPI.instance) {
      BackendAPI.instance = new BackendAPI();
    }
    return BackendAPI.instance;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error('BackendAPI: Request failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all payments from backend
   */
  public async getAllPayments(): Promise<BackendPaymentRecord[]> {
    try {
      const response = await this.makeRequest(`/${this.binId}/latest`);
      
      if (response.success && response.data?.record) {
        return response.data.record.payments || [];
      }
      
      return [];
    } catch (error) {
      console.error('BackendAPI: Error fetching payments:', error);
      return [];
    }
  }

  /**
   * Save payment to backend
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

      // Save to backend
      const response = await this.makeRequest(`/${this.binId}`, {
        method: 'PUT',
        body: JSON.stringify({ payments: allPayments })
      });

      if (response.success) {
        console.log('BackendAPI: Payment saved successfully:', payment.id, payment.status);
        return true;
      }

      return false;
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
   * Check if backend is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/${this.binId}/latest`);
      return response.success;
    } catch (error) {
      console.error('BackendAPI: Backend not available:', error);
      return false;
    }
  }
}

export const backendAPI = BackendAPI.getInstance();
