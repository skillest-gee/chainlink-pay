// hooks/useMerchantNotifications.ts
import { useEffect, useCallback } from 'react';
import { PaymentLink, paymentStorage } from '../services/paymentStorage';
import { paymentStatusAPI } from '../services/paymentStatusAPI';

export const useMerchantNotifications = () => {
  // Subscribe to payment updates for a specific merchant
  const subscribeToPaymentUpdates = useCallback((merchantAddress: string, callback: (payment: PaymentLink) => void) => {
    const handlePaymentUpdate = (event: CustomEvent) => {
      const { paymentId, merchantAddress: eventMerchantAddress } = event.detail;
      
      // Check if this update is for our merchant
      if (eventMerchantAddress && eventMerchantAddress !== merchantAddress) {
        return;
      }

      console.log('Payment update received for merchant:', merchantAddress, event.detail);

      // Fetch the updated payment data
      const fetchUpdatedPayment = async () => {
        try {
          // First try centralized API
          const apiPayment = await paymentStatusAPI.getPayment(paymentId);
          if (apiPayment) {
            // Convert PaymentStatusRecord to PaymentLink
            const paymentLink: PaymentLink = {
              id: apiPayment.id,
              amount: apiPayment.amount,
              description: apiPayment.description || '',
              status: apiPayment.status,
              createdAt: apiPayment.createdAt,
              paidAt: apiPayment.paidAt,
              txHash: apiPayment.txHash,
              payerAddress: apiPayment.payerAddress,
              merchantAddress: apiPayment.merchantAddress,
              paymentType: apiPayment.paymentType
            };
            callback(paymentLink);
            return;
          }

          // Fallback to localStorage
          const allPayments = paymentStorage.getAllPaymentLinks();
          const updatedPayment = allPayments.find(p => p.id === paymentId);
          if (updatedPayment) {
            callback(updatedPayment);
          }
        } catch (error) {
          console.error('Error fetching updated payment:', error);
        }
      };

      fetchUpdatedPayment();
    };

    const handleMerchantPaymentUpdate = (event: CustomEvent) => {
      const { paymentId, merchantAddress: eventMerchantAddress, status } = event.detail;
      
      if (eventMerchantAddress && eventMerchantAddress === merchantAddress) {
        console.log('Merchant-specific payment update:', paymentId, status);
        
        // Force immediate UI refresh
        setTimeout(async () => {
          const payments = await paymentStatusAPI.getPaymentsByMerchant(merchantAddress);
          // You might want to use a state setter here or trigger a refresh
        }, 100);
      }
    };

    // Listen for various payment events
    window.addEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
    window.addEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
    window.addEventListener('merchantPaymentUpdate', handleMerchantPaymentUpdate as EventListener);

    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
      window.removeEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
      window.removeEventListener('merchantPaymentUpdate', handleMerchantPaymentUpdate as EventListener);
    };
  }, []);

  // Manual refresh function for merchant
  const refreshMerchantPayments = useCallback(async (merchantAddress: string): Promise<PaymentLink[]> => {
    try {
      console.log('Manual refresh for merchant:', merchantAddress);
      
      // Force blockchain sync first
      await paymentStatusAPI.syncWithBlockchain();
      
      // Then get updated payments
      const apiPayments = await paymentStatusAPI.getPaymentsByMerchant(merchantAddress);
      
      // Convert PaymentStatusRecord[] to PaymentLink[]
      const payments: PaymentLink[] = apiPayments.map(apiPayment => ({
        id: apiPayment.id,
        amount: apiPayment.amount,
        description: apiPayment.description || '',
        status: apiPayment.status,
        createdAt: apiPayment.createdAt,
        paidAt: apiPayment.paidAt,
        txHash: apiPayment.txHash,
        payerAddress: apiPayment.payerAddress,
        merchantAddress: apiPayment.merchantAddress,
        paymentType: apiPayment.paymentType
      }));
      
      // Trigger UI update event
      window.dispatchEvent(new CustomEvent('merchantPaymentsRefreshed', {
        detail: { merchantAddress, payments }
      }));
      
      return payments;
    } catch (error) {
      console.error('Error refreshing merchant payments:', error);
      throw error;
    }
  }, []);

  return {
    subscribeToPaymentUpdates,
    refreshMerchantPayments
  };
};