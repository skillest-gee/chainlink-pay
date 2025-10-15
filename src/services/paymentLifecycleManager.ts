import { PaymentLink } from './paymentStorage';
import { paymentStatusAPI } from './paymentStatusAPI';
import { crossDeviceBackendAPI } from './crossDeviceBackendAPI';
import { realTimeNotificationService } from './realTimeNotificationService';
import { blockchainVerificationService } from './blockchainVerificationService';

// Payment lifecycle manager for complete end-to-end payment workflow
// This orchestrates the entire payment process from generation to completion

interface PaymentLifecycleEvent {
  type: 'PAYMENT_CREATED' | 'PAYMENT_REGISTERED' | 'PAYMENT_PAID' | 'PAYMENT_VERIFIED' | 'PAYMENT_COMPLETED';
  payment: PaymentLink;
  timestamp: number;
  metadata?: any;
}

interface PaymentWorkflow {
  payment: PaymentLink;
  status: 'created' | 'registered' | 'pending' | 'paid' | 'verified' | 'completed';
  onChainTxHash?: string;
  paymentTxHash?: string;
  createdAt: number;
  registeredAt?: number;
  paidAt?: number;
  verifiedAt?: number;
  completedAt?: number;
}

class PaymentLifecycleManager {
  private static instance: PaymentLifecycleManager;
  private workflows: Map<string, PaymentWorkflow> = new Map();
  private eventListeners: Map<string, (event: PaymentLifecycleEvent) => void> = new Map();

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): PaymentLifecycleManager {
    if (!PaymentLifecycleManager.instance) {
      PaymentLifecycleManager.instance = new PaymentLifecycleManager();
    }
    return PaymentLifecycleManager.instance;
  }

  /**
   * Initialize all required services
   */
  private initializeServices(): void {
    // Services are already initialized as singletons
    console.log('PaymentLifecycleManager: Services initialized');
  }

  /**
   * Create a new payment workflow
   */
  public async createPayment(payment: PaymentLink): Promise<PaymentWorkflow> {
    const workflow: PaymentWorkflow = {
      payment,
      status: 'created',
      createdAt: Date.now()
    };

    this.workflows.set(payment.id, workflow);

    // Save to all storage systems
    await this.savePaymentToAllSystems(payment);

    // Dispatch event
    this.dispatchEvent({
      type: 'PAYMENT_CREATED',
      payment,
      timestamp: Date.now()
    });

    console.log(`PaymentLifecycleManager: Created payment workflow for ${payment.id}`);
    return workflow;
  }

  /**
   * Register payment on-chain
   */
  public async registerPaymentOnChain(paymentId: string, onChainTxHash: string): Promise<void> {
    const workflow = this.workflows.get(paymentId);
    if (!workflow) {
      console.error(`PaymentLifecycleManager: Workflow not found for payment ${paymentId}`);
      return;
    }

    workflow.status = 'registered';
    workflow.onChainTxHash = onChainTxHash;
    workflow.registeredAt = Date.now();

    // Update payment with on-chain transaction hash but keep status as pending
    const updatedPayment: PaymentLink = {
      ...workflow.payment,
      status: 'pending', // CRITICAL: Keep status as pending until customer actually pays
      txHash: onChainTxHash
    };

    workflow.payment = updatedPayment;
    this.workflows.set(paymentId, workflow);

    // Save to all systems
    await this.savePaymentToAllSystems(updatedPayment);

    // Dispatch event
    this.dispatchEvent({
      type: 'PAYMENT_REGISTERED',
      payment: updatedPayment,
      timestamp: Date.now(),
      metadata: { onChainTxHash }
    });

    console.log(`PaymentLifecycleManager: Registered payment ${paymentId} on-chain`);
  }

  /**
   * Mark payment as paid
   */
  public async markPaymentPaid(paymentId: string, paymentTxHash: string, payerAddress?: string): Promise<void> {
    const workflow = this.workflows.get(paymentId);
    if (!workflow) {
      console.error(`PaymentLifecycleManager: Workflow not found for payment ${paymentId}`);
      return;
    }

    workflow.status = 'paid';
    workflow.paymentTxHash = paymentTxHash;
    workflow.paidAt = Date.now();

    // Update payment with payment details
    const updatedPayment: PaymentLink = {
      ...workflow.payment,
      status: 'paid',
      txHash: paymentTxHash,
      payerAddress: payerAddress || workflow.payment.payerAddress,
      paidAt: Date.now()
    };

    workflow.payment = updatedPayment;
    this.workflows.set(paymentId, workflow);

    // Save to all systems
    await this.savePaymentToAllSystems(updatedPayment);

    // Notify real-time service
    realTimeNotificationService.notifyPaymentUpdate(updatedPayment);

    // Dispatch event
    this.dispatchEvent({
      type: 'PAYMENT_PAID',
      payment: updatedPayment,
      timestamp: Date.now(),
      metadata: { paymentTxHash, payerAddress }
    });

    console.log(`PaymentLifecycleManager: Marked payment ${paymentId} as paid`);
  }

  /**
   * Verify payment on blockchain
   */
  public async verifyPayment(paymentId: string): Promise<boolean> {
    const workflow = this.workflows.get(paymentId);
    if (!workflow) {
      console.error(`PaymentLifecycleManager: Workflow not found for payment ${paymentId}`);
      return false;
    }

    const verificationResult = await blockchainVerificationService.verifyPayment(workflow.payment);
    
    if (verificationResult.needsUpdate && verificationResult.updatedPayment) {
      workflow.status = 'verified';
      workflow.verifiedAt = Date.now();
      workflow.payment = verificationResult.updatedPayment;
      this.workflows.set(paymentId, workflow);

      // Save to all systems
      await this.savePaymentToAllSystems(verificationResult.updatedPayment);

      // Dispatch event
      this.dispatchEvent({
        type: 'PAYMENT_VERIFIED',
        payment: verificationResult.updatedPayment,
        timestamp: Date.now(),
        metadata: { verificationResult }
      });

      console.log(`PaymentLifecycleManager: Verified payment ${paymentId} on blockchain`);
      return true;
    }

    return false;
  }

  /**
   * Complete payment workflow
   */
  public async completePayment(paymentId: string): Promise<void> {
    const workflow = this.workflows.get(paymentId);
    if (!workflow) {
      console.error(`PaymentLifecycleManager: Workflow not found for payment ${paymentId}`);
      return;
    }

    workflow.status = 'completed';
    workflow.completedAt = Date.now();
    this.workflows.set(paymentId, workflow);

    // Dispatch event
    this.dispatchEvent({
      type: 'PAYMENT_COMPLETED',
      payment: workflow.payment,
      timestamp: Date.now()
    });

    console.log(`PaymentLifecycleManager: Completed payment workflow for ${paymentId}`);
  }

  /**
   * Get payment workflow
   */
  public getPaymentWorkflow(paymentId: string): PaymentWorkflow | undefined {
    return this.workflows.get(paymentId);
  }

  /**
   * Get all workflows for a merchant
   */
  public getMerchantWorkflows(merchantAddress: string): PaymentWorkflow[] {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.payment.merchantAddress === merchantAddress
    );
  }

  /**
   * Get active payments (not completed)
   */
  public getActivePayments(merchantAddress: string): PaymentWorkflow[] {
    return this.getMerchantWorkflows(merchantAddress).filter(
      workflow => workflow.status !== 'completed'
    );
  }

  /**
   * Get completed payments
   */
  public getCompletedPayments(merchantAddress: string): PaymentWorkflow[] {
    return this.getMerchantWorkflows(merchantAddress).filter(
      workflow => workflow.status === 'completed'
    );
  }

  /**
   * Save payment to all storage systems
   */
  private async savePaymentToAllSystems(payment: PaymentLink): Promise<void> {
    try {
      // Save to cross-device backend
      await crossDeviceBackendAPI.savePayment(payment);
      
      // Save to payment status API
      await paymentStatusAPI.savePayment(payment);
      
      console.log(`PaymentLifecycleManager: Saved payment ${payment.id} to all systems`);
    } catch (error) {
      console.error(`PaymentLifecycleManager: Error saving payment ${payment.id}:`, error);
    }
  }

  /**
   * Subscribe to payment lifecycle events
   */
  public subscribe(eventType: string, callback: (event: PaymentLifecycleEvent) => void): () => void {
    const subscriptionId = `${eventType}-${Date.now()}`;
    this.eventListeners.set(subscriptionId, callback);

    return () => {
      this.eventListeners.delete(subscriptionId);
    };
  }

  /**
   * Dispatch lifecycle event
   */
  private dispatchEvent(event: PaymentLifecycleEvent): void {
    this.eventListeners.forEach((callback, subscriptionId) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`PaymentLifecycleManager: Error in event listener ${subscriptionId}:`, error);
      }
    });

    // Also dispatch to window for global listeners
    window.dispatchEvent(new CustomEvent('paymentLifecycleEvent', {
      detail: event
    }));
  }

  /**
   * Get workflow statistics
   */
  public getWorkflowStats(merchantAddress: string): {
    total: number;
    active: number;
    completed: number;
    pending: number;
    paid: number;
  } {
    const workflows = this.getMerchantWorkflows(merchantAddress);
    
    return {
      total: workflows.length,
      active: workflows.filter(w => w.status !== 'completed').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      pending: workflows.filter(w => w.status === 'pending').length,
      paid: workflows.filter(w => w.status === 'paid' || w.status === 'verified').length
    };
  }
}

export const paymentLifecycleManager = PaymentLifecycleManager.getInstance();
