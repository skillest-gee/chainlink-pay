// Cross-Device Payment Synchronization Service
// Uses blockchain as the source of truth for payment status

import { PaymentLink, paymentStorage } from './paymentStorage';
import { paymentStatusAPI } from './paymentStatusAPI';

interface SyncStatus {
  lastSync: number;
  pendingPayments: string[];
  syncedPayments: string[];
}

class CrossDeviceSyncService {
  private static instance: CrossDeviceSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private syncStatus: SyncStatus = {
    lastSync: 0,
    pendingPayments: [],
    syncedPayments: []
  };

  private constructor() {
    this.initializeSync();
  }

  public static getInstance(): CrossDeviceSyncService {
    if (!CrossDeviceSyncService.instance) {
      CrossDeviceSyncService.instance = new CrossDeviceSyncService();
    }
    return CrossDeviceSyncService.instance;
  }

  private initializeSync() {
    // Start periodic sync every 3 seconds for real-time updates
    this.syncInterval = setInterval(() => {
      this.performCrossDeviceSync();
    }, 3000);

    // Also sync immediately when the service starts
    setTimeout(() => {
      this.performCrossDeviceSync();
    }, 1000);

    console.log('CrossDeviceSyncService: Initialized cross-device synchronization');
  }

  /**
   * Perform cross-device synchronization by checking blockchain status
   * This ensures all devices see the same payment status regardless of where the payment was made
   */
  public async performCrossDeviceSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('CrossDeviceSyncService: Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    console.log('CrossDeviceSyncService: Starting cross-device sync...');

    try {
      // Get all payments from local storage
      const allPayments = paymentStorage.getAllPaymentLinks();
      const pendingPayments = allPayments.filter(p => p.status === 'pending' && p.txHash);

      console.log(`CrossDeviceSyncService: Found ${pendingPayments.length} pending payments to sync`);

      let updatedCount = 0;
      const network = process.env.REACT_APP_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
      const apiUrl = network === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';

      // Check each pending payment against blockchain
      for (const payment of pendingPayments) {
        if (!payment.txHash) continue;

        try {
          console.log(`CrossDeviceSyncService: Checking blockchain for payment ${payment.id}, TX: ${payment.txHash}`);
          
          const response = await fetch(`${apiUrl}/extended/v1/tx/${payment.txHash}`);
          
          if (response.ok) {
            const txData = await response.json();
            console.log(`CrossDeviceSyncService: Blockchain status for ${payment.id}: ${txData.tx_status}`);

            if (txData.tx_status === 'success' && payment.status === 'pending') {
              // Payment confirmed on blockchain - update local storage
              console.log(`CrossDeviceSyncService: Payment ${payment.id} confirmed on blockchain, updating status`);
              
              const updatedPayment: PaymentLink = {
                ...payment,
                status: 'paid',
                paidAt: Date.now()
              };

              // Update local storage
              const allLocalPayments = paymentStorage.getAllPaymentLinks();
              const updatedLocalPayments = allLocalPayments.map(p => 
                p.id === payment.id ? updatedPayment : p
              );
              paymentStorage.saveAllPaymentLinks(updatedLocalPayments);

              // Update centralized API
              await paymentStatusAPI.savePayment(updatedPayment);
              await paymentStatusAPI.updatePaymentStatus(payment.id, 'paid', payment.txHash, payment.payerAddress);

              // Dispatch cross-device update events
              this.dispatchCrossDeviceUpdate(updatedPayment);

              updatedCount++;
              this.syncStatus.syncedPayments.push(payment.id);
            } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
              // Payment failed on blockchain
              console.log(`CrossDeviceSyncService: Payment ${payment.id} failed on blockchain: ${txData.tx_status}`);
              
              const updatedPayment: PaymentLink = {
                ...payment,
                status: 'cancelled'
              };

              // Update local storage
              const allLocalPayments = paymentStorage.getAllPaymentLinks();
              const updatedLocalPayments = allLocalPayments.map(p => 
                p.id === payment.id ? updatedPayment : p
              );
              paymentStorage.saveAllPaymentLinks(updatedLocalPayments);

              // Update centralized API
              await paymentStatusAPI.savePayment(updatedPayment);
              await paymentStatusAPI.updatePaymentStatus(payment.id, 'cancelled', payment.txHash, payment.payerAddress);

              // Dispatch cross-device update events
              this.dispatchCrossDeviceUpdate(updatedPayment);

              updatedCount++;
            }
          } else if (response.status === 404) {
            // Transaction not found yet - still pending
            console.log(`CrossDeviceSyncService: Payment ${payment.id} still pending on blockchain`);
          } else {
            console.error(`CrossDeviceSyncService: Error checking blockchain for ${payment.id}: ${response.status}`);
          }
        } catch (error) {
          console.error(`CrossDeviceSyncService: Error syncing payment ${payment.id}:`, error);
        }
      }

      this.syncStatus.lastSync = Date.now();
      this.syncStatus.pendingPayments = pendingPayments.map(p => p.id);

      if (updatedCount > 0) {
        console.log(`CrossDeviceSyncService: Cross-device sync completed, updated ${updatedCount} payments`);
      }

    } catch (error) {
      console.error('CrossDeviceSyncService: Error during cross-device sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Dispatch cross-device update events to notify all components
   */
  private dispatchCrossDeviceUpdate(payment: PaymentLink) {
    console.log(`CrossDeviceSyncService: Dispatching cross-device update for payment ${payment.id}`);

    // Dispatch multiple event types to ensure all components are notified
    const events = [
      'paymentCompleted',
      'paymentUpdated', 
      'merchantPaymentUpdate',
      'crossDevicePaymentUpdate',
      'paymentStatusAPIUpdate'
    ];

    events.forEach(eventType => {
      window.dispatchEvent(new CustomEvent(eventType, {
        detail: {
          paymentId: payment.id,
          status: payment.status,
          merchantAddress: payment.merchantAddress,
          txHash: payment.txHash,
          amount: payment.amount,
          paymentType: payment.paymentType,
          paidAt: payment.paidAt,
          crossDevice: true, // Flag to indicate this is a cross-device update
          timestamp: Date.now()
        }
      }));
    });
  }

  /**
   * Force immediate sync for a specific payment
   */
  public async forceSyncPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = paymentStorage.getAllPaymentLinks().find(p => p.id === paymentId);
      if (!payment || !payment.txHash) {
        console.log(`CrossDeviceSyncService: Payment ${paymentId} not found or no transaction hash`);
        return false;
      }

      console.log(`CrossDeviceSyncService: Force syncing payment ${paymentId}`);
      
      const network = process.env.REACT_APP_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
      const apiUrl = network === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/tx/${payment.txHash}`);
      
      if (response.ok) {
        const txData = await response.json();
        
        if (txData.tx_status === 'success' && payment.status === 'pending') {
          const updatedPayment: PaymentLink = {
            ...payment,
            status: 'paid',
            paidAt: Date.now()
          };

          // Update local storage
          const allLocalPayments = paymentStorage.getAllPaymentLinks();
          const updatedLocalPayments = allLocalPayments.map(p => 
            p.id === payment.id ? updatedPayment : p
          );
          paymentStorage.saveAllPaymentLinks(updatedLocalPayments);

          // Update centralized API
          await paymentStatusAPI.savePayment(updatedPayment);
          await paymentStatusAPI.updatePaymentStatus(payment.id, 'paid', payment.txHash, payment.payerAddress);

          // Dispatch cross-device update events
          this.dispatchCrossDeviceUpdate(updatedPayment);

          console.log(`CrossDeviceSyncService: Force sync completed for payment ${paymentId}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`CrossDeviceSyncService: Error force syncing payment ${paymentId}:`, error);
      return false;
    }
  }

  /**
   * Get sync status information
   */
  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Stop the sync service
   */
  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('CrossDeviceSyncService: Stopped cross-device synchronization');
  }

  /**
   * Restart the sync service
   */
  public restart() {
    this.stop();
    this.initializeSync();
  }
}

export const crossDeviceSync = CrossDeviceSyncService.getInstance();
