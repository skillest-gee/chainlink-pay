import { PaymentLink } from './paymentStorage';

interface PaymentSyncEvent {
  type: 'PAYMENT_UPDATED' | 'PAYMENT_CREATED' | 'PAYMENT_STATUS_CHANGED';
  paymentId: string;
  payment: PaymentLink;
  merchantAddress: string;
  timestamp: number;
}

class PaymentSyncService {
  private static instance: PaymentSyncService;
  private listeners: Map<string, ((event: PaymentSyncEvent) => void)[]> = new Map();
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startGlobalSync();
    this.setupStorageListener();
  }

  public static getInstance(): PaymentSyncService {
    if (!PaymentSyncService.instance) {
      PaymentSyncService.instance = new PaymentSyncService();
    }
    return PaymentSyncService.instance;
  }

  private startGlobalSync() {
    // Check for payment updates every 1 second
    this.syncInterval = setInterval(() => {
      this.checkForPaymentUpdates();
    }, 1000);
  }

  private setupStorageListener() {
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'chainlink-pay-payment-links' && e.newValue) {
        console.log('PaymentSyncService: Storage change detected from another tab');
        this.processStorageChange(e.newValue);
      }
    });
  }

  private checkForPaymentUpdates() {
    try {
      const stored = localStorage.getItem('chainlink-pay-payment-links');
      if (stored) {
        const payments: PaymentLink[] = JSON.parse(stored);
        const now = Date.now();
        
        // Check for recently updated payments (within last 5 seconds)
        payments.forEach(payment => {
          if (payment.paidAt && payment.paidAt > this.lastSyncTime) {
            console.log('PaymentSyncService: Found recently updated payment:', payment.id);
            this.broadcastPaymentUpdate(payment);
          }
        });
        
        this.lastSyncTime = now;
      }
    } catch (error) {
      console.error('PaymentSyncService: Error checking for updates:', error);
    }
  }

  private processStorageChange(newValue: string) {
    try {
      const payments: PaymentLink[] = JSON.parse(newValue);
      const now = Date.now();
      
      // Find payments that were recently updated
      payments.forEach(payment => {
        if (payment.paidAt && payment.paidAt > (now - 10000)) { // Within last 10 seconds
          console.log('PaymentSyncService: Processing storage change for payment:', payment.id);
          this.broadcastPaymentUpdate(payment);
        }
      });
    } catch (error) {
      console.error('PaymentSyncService: Error processing storage change:', error);
    }
  }

  private broadcastPaymentUpdate(payment: PaymentLink) {
    const event: PaymentSyncEvent = {
      type: 'PAYMENT_STATUS_CHANGED',
      paymentId: payment.id,
      payment,
      merchantAddress: payment.merchantAddress,
      timestamp: Date.now()
    };

    console.log('PaymentSyncService: Broadcasting payment update:', event);

    // Broadcast to all listeners
    this.listeners.forEach((callbacks, merchantAddress) => {
      if (merchantAddress === payment.merchantAddress || merchantAddress === 'global') {
        callbacks.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('PaymentSyncService: Error in callback:', error);
          }
        });
      }
    });

    // Also dispatch custom events for backward compatibility
    const customEvent = new CustomEvent('paymentSyncUpdate', {
      detail: event
    });
    window.dispatchEvent(customEvent);

    // Dispatch global payment events
    const globalEvent = new CustomEvent('globalPaymentStatusChange', {
      detail: {
        paymentId: payment.id,
        status: payment.status,
        txId: payment.txHash,
        merchantAddress: payment.merchantAddress,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(globalEvent);
  }

  public subscribe(merchantAddress: string, callback: (event: PaymentSyncEvent) => void): () => void {
    if (!this.listeners.has(merchantAddress)) {
      this.listeners.set(merchantAddress, []);
    }
    
    this.listeners.get(merchantAddress)!.push(callback);
    
    console.log('PaymentSyncService: Subscribed merchant:', merchantAddress);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(merchantAddress);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.listeners.delete(merchantAddress);
        }
      }
      console.log('PaymentSyncService: Unsubscribed merchant:', merchantAddress);
    };
  }

  public forceSync() {
    console.log('PaymentSyncService: Force sync requested');
    this.checkForPaymentUpdates();
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners.clear();
  }
}

export const paymentSyncService = PaymentSyncService.getInstance();
