// Real payment link storage and management
export interface PaymentLink {
  id: string;
  amount: string;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
  paidAt?: number;
  txHash?: string;
  payerAddress?: string;
  merchantAddress: string;
}

export interface PaymentStats {
  totalLinks: number;
  totalPaid: number;
  totalPending: number;
  totalExpired: number;
  totalVolume: number; // in STX
}

class PaymentStorage {
  private storageKey = 'chainlink_payment_links';
  private statsKey = 'chainlink_payment_stats';

  // Get all payment links for a merchant
  getPaymentLinks(merchantAddress: string): PaymentLink[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const allLinks: PaymentLink[] = JSON.parse(stored);
      return allLinks.filter(link => link.merchantAddress === merchantAddress);
    } catch (error) {
      console.error('Error loading payment links:', error);
      return [];
    }
  }

  // Save a new payment link
  savePaymentLink(paymentLink: PaymentLink): void {
    try {
      const existing = this.getAllPaymentLinks();
      const updated = [...existing, paymentLink];
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.updateStats();
    } catch (error) {
      console.error('Error saving payment link:', error);
    }
  }

  // Update payment link status
  updatePaymentLinkStatus(id: string, status: PaymentLink['status'], txHash?: string, payerAddress?: string): void {
    try {
      const links = this.getAllPaymentLinks();
      const updated = links.map(link => {
        if (link.id === id) {
          return {
            ...link,
            status,
            txHash: txHash || link.txHash,
            payerAddress: payerAddress || link.payerAddress,
            paidAt: status === 'paid' ? Date.now() : link.paidAt
          };
        }
        return link;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.updateStats();
    } catch (error) {
      console.error('Error updating payment link:', error);
    }
  }

  // Get all payment links (for admin purposes)
  private getAllPaymentLinks(): PaymentLink[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading all payment links:', error);
      return [];
    }
  }

  // Get payment stats
  getPaymentStats(merchantAddress: string): PaymentStats {
    try {
      const links = this.getPaymentLinks(merchantAddress);
      
      const stats: PaymentStats = {
        totalLinks: links.length,
        totalPaid: links.filter(link => link.status === 'paid').length,
        totalPending: links.filter(link => link.status === 'pending').length,
        totalExpired: links.filter(link => link.status === 'expired').length,
        totalVolume: links
          .filter(link => link.status === 'paid')
          .reduce((sum, link) => sum + parseFloat(link.amount), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalLinks: 0,
        totalPaid: 0,
        totalPending: 0,
        totalExpired: 0,
        totalVolume: 0
      };
    }
  }

  // Update stats in localStorage
  private updateStats(): void {
    try {
      const allLinks = this.getAllPaymentLinks();
      const merchantsSet = new Set(allLinks.map(link => link.merchantAddress));
      const merchants = Array.from(merchantsSet);
      
      const statsByMerchant: Record<string, PaymentStats> = {};
      merchants.forEach(merchant => {
        statsByMerchant[merchant] = this.getPaymentStats(merchant);
      });
      
      localStorage.setItem(this.statsKey, JSON.stringify(statsByMerchant));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // Check for expired payment links
  checkExpiredLinks(): void {
    try {
      const links = this.getAllPaymentLinks();
      const now = Date.now();
      
      const updated = links.map(link => {
        if (link.status === 'pending' && link.expiresAt && now > link.expiresAt) {
          return { ...link, status: 'expired' as const };
        }
        return link;
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.updateStats();
    } catch (error) {
      console.error('Error checking expired links:', error);
    }
  }

  // Delete a payment link
  deletePaymentLink(id: string): void {
    try {
      const links = this.getAllPaymentLinks();
      const updated = links.filter(link => link.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.updateStats();
    } catch (error) {
      console.error('Error deleting payment link:', error);
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.statsKey);
  }
}

export const paymentStorage = new PaymentStorage();
