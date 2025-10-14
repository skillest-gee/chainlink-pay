import { useCallback, useEffect } from 'react';
import { PaymentRecord } from './usePaymentStorage';

interface MerchantNotificationHook {
  notifyPaymentUpdate: (payment: PaymentRecord) => void;
  subscribeToPaymentUpdates: (merchantAddress: string, callback: (payment: PaymentRecord) => void) => () => void;
}

export const useMerchantNotifications = (): MerchantNotificationHook => {
  
  const notifyPaymentUpdate = useCallback((payment: PaymentRecord) => {
    console.log('Notifying merchant of payment update:', payment);
    
    // Dispatch custom event for real-time updates
    const paymentUpdateEvent = new CustomEvent('merchantPaymentUpdate', {
      detail: {
        payment,
        merchantAddress: payment.merchantAddress,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(paymentUpdateEvent);
    
    // Also dispatch global payment events
    const globalPaymentEvent = new CustomEvent('globalPaymentStatusChange', {
      detail: {
        paymentId: payment.id,
        status: payment.status,
        txId: payment.txId,
        merchantAddress: payment.merchantAddress,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(globalPaymentEvent);
    
    // Use postMessage for cross-tab communication
    window.postMessage({
      type: 'MERCHANT_PAYMENT_UPDATE',
      payment,
      merchantAddress: payment.merchantAddress
    }, '*');
    
    // If backend API exists, send notification
    // This would be implemented when backend is available
    /*
    fetch('/api/merchant/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment)
    }).catch(error => {
      console.warn('Failed to send payment notification to backend:', error);
    });
    */
  }, []);

  const subscribeToPaymentUpdates = useCallback((merchantAddress: string, callback: (payment: PaymentRecord) => void) => {
    console.log('Subscribing to payment updates for merchant:', merchantAddress);
    
    const handlePaymentUpdate = (event: CustomEvent) => {
      const payment = event.detail.payment as PaymentRecord;
      if (payment.merchantAddress === merchantAddress) {
        console.log('Payment update received for merchant:', merchantAddress, payment);
        callback(payment);
      }
    };

    const handlePostMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MERCHANT_PAYMENT_UPDATE') {
        const payment = event.data.payment as PaymentRecord;
        if (payment.merchantAddress === merchantAddress) {
          console.log('PostMessage payment update received for merchant:', merchantAddress, payment);
          callback(payment);
        }
      }
    };

    // Subscribe to events
    window.addEventListener('merchantPaymentUpdate', handlePaymentUpdate as EventListener);
    window.addEventListener('globalPaymentStatusChange', handlePaymentUpdate as EventListener);
    window.addEventListener('message', handlePostMessage);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('merchantPaymentUpdate', handlePaymentUpdate as EventListener);
      window.removeEventListener('globalPaymentStatusChange', handlePaymentUpdate as EventListener);
      window.removeEventListener('message', handlePostMessage);
      console.log('Unsubscribed from payment updates for merchant:', merchantAddress);
    };
  }, []);

  return {
    notifyPaymentUpdate,
    subscribeToPaymentUpdates
  };
};
