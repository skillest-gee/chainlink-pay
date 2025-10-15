import { PaymentLink } from './paymentStorage';
import { paymentStatusAPI } from './paymentStatusAPI';
import { crossDeviceBackendAPI } from './crossDeviceBackendAPI';

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

// Blockchain verification service for automatic payment status checking
// This ensures payment status is always accurate by checking the blockchain

interface BlockchainStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'unknown';
  txHash?: string;
  blockHeight?: number;
  confirmations?: number;
  error?: string;
}

interface VerificationResult {
  paymentId: string;
  blockchainStatus: BlockchainStatus;
  needsUpdate: boolean;
  updatedPayment?: PaymentLink;
}

class BlockchainVerificationService {
  private static instance: BlockchainVerificationService;
  private verificationInterval: NodeJS.Timeout | null = null;
  private isVerifying = false;
  private verificationIntervalMs = 5000; // Check every 5 seconds
  private lastVerificationTime = 0;

  private constructor() {
    this.startVerification();
  }

  public static getInstance(): BlockchainVerificationService {
    if (!BlockchainVerificationService.instance) {
      BlockchainVerificationService.instance = new BlockchainVerificationService();
    }
    return BlockchainVerificationService.instance;
  }

  /**
   * Start automatic blockchain verification
   */
  private startVerification(): void {
    if (this.isVerifying) return;

    this.isVerifying = true;
    this.verificationInterval = setInterval(() => {
      this.verifyPendingPayments();
    }, this.verificationIntervalMs);

    console.log('BlockchainVerificationService: Started automatic blockchain verification');
  }

  /**
   * Stop automatic blockchain verification
   */
  public stopVerification(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
    this.isVerifying = false;
    console.log('BlockchainVerificationService: Stopped automatic blockchain verification');
  }

  /**
   * Verify all pending payments against the blockchain
   */
  private async verifyPendingPayments(): Promise<void> {
    try {
      const allPayments = await crossDeviceBackendAPI.getAllPayments();
      const pendingPayments = allPayments.filter(p => 
        p.status === 'pending' && p.txHash
      );

      if (pendingPayments.length === 0) return;

      console.log(`BlockchainVerificationService: Verifying ${pendingPayments.length} pending payments`);

      for (const payment of pendingPayments) {
        if (payment.txHash) {
          const result = await this.verifyPayment(payment);
          if (result.needsUpdate && result.updatedPayment) {
            await this.updatePaymentStatus(result.updatedPayment);
          }
        }
      }

      this.lastVerificationTime = Date.now();
    } catch (error) {
      console.error('BlockchainVerificationService: Error verifying payments:', error);
    }
  }

  /**
   * Verify a single payment against the blockchain
   */
  public async verifyPayment(payment: PaymentLink | BackendPaymentRecord): Promise<VerificationResult> {
    if (!payment.txHash) {
      return {
        paymentId: payment.id,
        blockchainStatus: { status: 'unknown', error: 'No transaction hash' },
        needsUpdate: false
      };
    }

    try {
      const blockchainStatus = await this.checkBlockchainStatus(payment.txHash);
      
      let needsUpdate = false;
      let updatedPayment: PaymentLink | undefined;

      // Check if blockchain status differs from stored status
      // CRITICAL FIX: Only mark as paid if this is a payment transaction, not a registration transaction
      // Registration transactions (create-payment) should not automatically mark payments as paid
      if (blockchainStatus.status === 'confirmed' && payment.status === 'pending' && payment.payerAddress) {
        // Only mark as paid if there's a payer address (meaning customer actually paid)
        needsUpdate = true;
        updatedPayment = {
          id: payment.id,
          amount: payment.amount,
          description: payment.description || '',
          status: 'paid',
          createdAt: payment.createdAt,
          paidAt: Date.now(),
          txHash: payment.txHash,
          payerAddress: payment.payerAddress,
          merchantAddress: payment.merchantAddress,
          paymentType: payment.paymentType
        };
      } else if (blockchainStatus.status === 'failed' && payment.status === 'pending') {
        needsUpdate = true;
        updatedPayment = {
          id: payment.id,
          amount: payment.amount,
          description: payment.description || '',
          status: 'cancelled',
          createdAt: payment.createdAt,
          txHash: payment.txHash,
          payerAddress: payment.payerAddress,
          merchantAddress: payment.merchantAddress,
          paymentType: payment.paymentType
        };
      }

      return {
        paymentId: payment.id,
        blockchainStatus,
        needsUpdate,
        updatedPayment
      };
    } catch (error) {
      console.error(`BlockchainVerificationService: Error verifying payment ${payment.id}:`, error);
      return {
        paymentId: payment.id,
        blockchainStatus: { status: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' },
        needsUpdate: false
      };
    }
  }

  /**
   * Check blockchain status for a transaction hash
   */
  private async checkBlockchainStatus(txHash: string): Promise<BlockchainStatus> {
    try {
      const network = process.env.REACT_APP_STACKS_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
      const apiUrl = network === 'testnet' 
        ? 'https://api.testnet.hiro.so' 
        : 'https://api.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txHash}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const txData = await response.json();
      
      // CRITICAL FIX: Only verify mark-paid transactions, not create-payment transactions
      const functionName = txData.contract_call?.function_name;
      if (functionName && functionName !== 'mark-paid') {
        console.log(`BlockchainVerificationService: Skipping verification for ${functionName} transaction - only verifying mark-paid transactions`);
        return {
          status: 'unknown',
          txHash: txData.tx_id,
          error: `Not a payment transaction: ${functionName}`
        };
      }
      
      if (txData.tx_status === 'success') {
        return {
          status: 'confirmed',
          txHash: txData.tx_id,
          blockHeight: txData.block_height,
          confirmations: txData.confirmations || 0
        };
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        return {
          status: 'failed',
          txHash: txData.tx_id,
          error: `Transaction failed: ${txData.tx_status}`
        };
      } else {
        return {
          status: 'pending',
          txHash: txData.tx_id
        };
      }
    } catch (error) {
      console.error('BlockchainVerificationService: Error checking blockchain status:', error);
      return {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update payment status in all storage systems
   */
  private async updatePaymentStatus(updatedPayment: PaymentLink): Promise<void> {
    try {
      console.log(`BlockchainVerificationService: Updating payment status for ${updatedPayment.id} to ${updatedPayment.status}`);

      // Update cross-device backend
      await crossDeviceBackendAPI.savePayment(updatedPayment);
      await crossDeviceBackendAPI.updatePaymentStatus(
        updatedPayment.id,
        updatedPayment.status,
        updatedPayment.txHash,
        updatedPayment.payerAddress
      );

      // Update payment status API
      await paymentStatusAPI.savePayment(updatedPayment);
      await paymentStatusAPI.updatePaymentStatus(
        updatedPayment.id,
        updatedPayment.status,
        updatedPayment.txHash,
        updatedPayment.payerAddress
      );

      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('paymentCompleted', {
        detail: {
          paymentId: updatedPayment.id,
          merchantAddress: updatedPayment.merchantAddress,
          txHash: updatedPayment.txHash,
          amount: updatedPayment.amount,
          paymentType: updatedPayment.paymentType,
          status: updatedPayment.status
        }
      }));

      window.dispatchEvent(new CustomEvent('merchantPaymentUpdate', {
        detail: {
          paymentId: updatedPayment.id,
          status: updatedPayment.status,
          merchantAddress: updatedPayment.merchantAddress,
          txHash: updatedPayment.txHash
        }
      }));

      console.log(`BlockchainVerificationService: Successfully updated payment ${updatedPayment.id}`);
    } catch (error) {
      console.error(`BlockchainVerificationService: Error updating payment status for ${updatedPayment.id}:`, error);
    }
  }

  /**
   * Manually verify a specific payment
   */
  public async verifyPaymentManually(paymentId: string): Promise<VerificationResult | null> {
    try {
      const payment = await crossDeviceBackendAPI.getPayment(paymentId);
      if (!payment) {
        console.error(`BlockchainVerificationService: Payment ${paymentId} not found`);
        return null;
      }

      return await this.verifyPayment(payment as PaymentLink);
    } catch (error) {
      console.error(`BlockchainVerificationService: Error in manual verification for ${paymentId}:`, error);
      return null;
    }
  }

  /**
   * Get verification status
   */
  public getVerificationStatus(): { isActive: boolean; lastCheck: number; interval: number } {
    return {
      isActive: this.isVerifying,
      lastCheck: this.lastVerificationTime,
      interval: this.verificationIntervalMs
    };
  }
}

export const blockchainVerificationService = BlockchainVerificationService.getInstance();
