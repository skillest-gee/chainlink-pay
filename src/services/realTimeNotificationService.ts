import { PaymentLink } from './paymentStorage';
import { paymentStatusAPI } from './paymentStatusAPI';
import { crossDeviceBackendAPI } from './crossDeviceBackendAPI';

// Real-time notification service for instant payment updates
// This provides WebSocket-like functionality using polling and events

interface NotificationEvent {
  type: 'PAYMENT_COMPLETED' | 'PAYMENT_UPDATED' | 'PAYMENT_CANCELLED';
  paymentId: string;
  merchantAddress: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  txHash?: string;
  amount: string;
  timestamp: number;
}

interface MerchantSubscription {
  merchantAddress: string;
  callback: (event: NotificationEvent) => void;
  lastChecked: number;
}

class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;
  private subscriptions: Map<string, MerchantSubscription> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastPollTime = 0;
  private pollInterval = 2000; // Poll every 2 seconds for real-time updates

  private constructor() {
    this.startPolling();
  }

  public static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  /**
   * Subscribe to real-time payment updates for a merchant
   */
  public subscribe(merchantAddress: string, callback: (event: NotificationEvent) => void): () => void {
    const subscriptionId = `${merchantAddress}-${Date.now()}`;
    
    this.subscriptions.set(subscriptionId, {
      merchantAddress,
      callback,
      lastChecked: Date.now()
    });

    console.log(`RealTimeNotificationService: Subscribed merchant ${merchantAddress} to real-time updates`);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscriptionId);
      console.log(`RealTimeNotificationService: Unsubscribed merchant ${merchantAddress}`);
    };
  }

  /**
   * Start polling for payment updates
   */
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.pollInterval);

    console.log('RealTimeNotificationService: Started real-time polling');
  }

  /**
   * Stop polling for payment updates
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('RealTimeNotificationService: Stopped real-time polling');
  }

  /**
   * Check for payment updates and notify subscribers
   */
  private async checkForUpdates(): Promise<void> {
    if (this.subscriptions.size === 0) return;

    try {
      // Get all payments from cross-device backend
      const allPayments = await crossDeviceBackendAPI.getAllPayments();
      
      // Check each subscription for updates
      this.subscriptions.forEach((subscription, subscriptionId) => {
        const merchantPayments = allPayments.filter(p => 
          p.merchantAddress === subscription.merchantAddress &&
          p.lastUpdated > subscription.lastChecked
        );

        if (merchantPayments.length > 0) {
          console.log(`RealTimeNotificationService: Found ${merchantPayments.length} updates for merchant ${subscription.merchantAddress}`);
          
          // Notify about each updated payment
          for (const payment of merchantPayments) {
            const event: NotificationEvent = {
              type: payment.status === 'paid' ? 'PAYMENT_COMPLETED' : 'PAYMENT_UPDATED',
              paymentId: payment.id,
              merchantAddress: payment.merchantAddress,
              status: payment.status,
              txHash: payment.txHash,
              amount: payment.amount,
              timestamp: payment.lastUpdated
            };

            try {
              subscription.callback(event);
            } catch (error) {
              console.error('RealTimeNotificationService: Error in subscription callback:', error);
            }
          }

          // Update last checked time
          subscription.lastChecked = Date.now();
        }
      });

      this.lastPollTime = Date.now();
    } catch (error) {
      console.error('RealTimeNotificationService: Error checking for updates:', error);
    }
  }

  /**
   * Manually trigger a payment update notification
   */
  public notifyPaymentUpdate(payment: PaymentLink): void {
    const event: NotificationEvent = {
      type: payment.status === 'paid' ? 'PAYMENT_COMPLETED' : 'PAYMENT_UPDATED',
      paymentId: payment.id,
      merchantAddress: payment.merchantAddress,
      status: payment.status,
      txHash: payment.txHash,
      amount: payment.amount,
      timestamp: Date.now()
    };

    // Notify all subscribers for this merchant
    this.subscriptions.forEach((subscription, subscriptionId) => {
      if (subscription.merchantAddress === payment.merchantAddress) {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('RealTimeNotificationService: Error in manual notification:', error);
        }
      }
    });

    console.log(`RealTimeNotificationService: Manually notified payment update for ${payment.id}`);
  }

  /**
   * Get subscription count for debugging
   */
  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get polling status
   */
  public isPollingActive(): boolean {
    return this.isPolling;
  }
}

export const realTimeNotificationService = RealTimeNotificationService.getInstance();
