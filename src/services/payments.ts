import { callReadOnlyFunction, cvToJSON, stringAsciiCV, uintCV, bufferCVFromString } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, stacksNetwork, validateEnvironment } from '../config/stacksConfig';

export type PaymentData = {
  payer: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export class PaymentServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export async function getPayment(id: string): Promise<PaymentData | null> {
  try {
    // Validate environment first
    const envCheck = validateEnvironment();
    if (!envCheck.isValid) {
      throw new PaymentServiceError(
        `Configuration error: ${envCheck.errors.join(', ')}`,
        'CONFIG_ERROR'
      );
    }

    if (!id || id.trim() === '') {
      throw new PaymentServiceError('Payment ID is required', 'INVALID_ID');
    }

    if (!CONTRACT_ADDRESS) {
      throw new PaymentServiceError('Contract address not configured', 'NO_CONTRACT');
    }

    const options = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-payment',
      functionArgs: [bufferCVFromString(id)],
      senderAddress: CONTRACT_ADDRESS,
      network: stacksNetwork as any,
    };

    console.log('Fetching payment with options:', { 
      contractAddress: CONTRACT_ADDRESS, 
      contractName: CONTRACT_NAME, 
      paymentId: id 
    });

    const result = await callReadOnlyFunction(options);
    const json = cvToJSON(result) as any;
    
    if (!json) {
      console.warn('No result from contract call');
      return null;
    }

    if (json.type !== 'optional' || json.value === null) {
      console.log('Payment not found in contract');
      return null;
    }

    const v = json.value.value;
    const paymentData: PaymentData = {
      payer: v.payer.value,
      amount: v.amount.value,
      status: v.status.value,
      createdAt: v['created-at'].value,
      updatedAt: v['updated-at'].value,
    };

    console.log('Payment data retrieved:', paymentData);
    return paymentData;

  } catch (error: any) {
    console.error('Error fetching payment:', error);
    
    if (error instanceof PaymentServiceError) {
      throw error;
    }

    // Handle specific Stacks API errors
    if (error.message?.includes('Contract not found')) {
      throw new PaymentServiceError(
        'Smart contract not found. Please check your contract address.',
        'CONTRACT_NOT_FOUND'
      );
    }

    if (error.message?.includes('Function not found')) {
      throw new PaymentServiceError(
        'Payment function not found in contract. Please check your contract deployment.',
        'FUNCTION_NOT_FOUND'
      );
    }

    if (error.message?.includes('network')) {
      throw new PaymentServiceError(
        'Network error. Please check your internet connection and try again.',
        'NETWORK_ERROR'
      );
    }

    throw new PaymentServiceError(
      `Failed to fetch payment: ${error.message || 'Unknown error'}`,
      'FETCH_ERROR'
    );
  }
}

// Additional utility functions for better error handling
export async function checkContractStatus(): Promise<{ isDeployed: boolean; error?: string }> {
  try {
    if (!CONTRACT_ADDRESS || !CONTRACT_NAME) {
      return { isDeployed: false, error: 'Contract not configured' };
    }

    // Try to call a simple read-only function to check if contract exists
    const options = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-payment', // This should exist in our contract
      functionArgs: [bufferCVFromString('test')],
      senderAddress: CONTRACT_ADDRESS,
      network: stacksNetwork as any,
    };

    await callReadOnlyFunction(options);
    return { isDeployed: true };
  } catch (error: any) {
    if (error.message?.includes('Contract not found')) {
      return { isDeployed: false, error: 'Contract not deployed' };
    }
    if (error.message?.includes('Function not found')) {
      return { isDeployed: false, error: 'Contract deployed but function missing' };
    }
    if (error.message?.includes('network')) {
      return { isDeployed: false, error: 'Network error - check connection' };
    }
    return { isDeployed: false, error: error.message || 'Unknown error' };
  }
}

