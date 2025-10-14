// Contract Deployment Utility for AI-Generated Contracts
import { openContractCall } from '@stacks/connect';
import { makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { routeContractCall } from './walletProviderRouter';

export interface DeploymentOptions {
  contractName: string;
  contractCode: string;
  network?: 'testnet' | 'mainnet';
  fee?: number;
  userSession?: any;
  walletProvider?: 'xverse' | 'leather' | 'hiro' | 'unknown';
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface DeploymentResult {
  success: boolean;
  transactionId?: string;
  contractAddress?: string;
  error?: string;
  explorerUrl?: string;
}

export class ContractDeployer {
  private network: any;
  private apiUrl: string;

  constructor() {
    const networkType = process.env.REACT_APP_STACKS_NETWORK || 'testnet';
    this.apiUrl = process.env.REACT_APP_STACKS_API_URL || 
      (networkType === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so');
    
    this.network = createNetwork(networkType as 'testnet' | 'mainnet');
  }

  /**
   * Deploy contract using wallet connection (recommended for users)
   */
  async deployWithWallet(options: DeploymentOptions): Promise<DeploymentResult> {
    try {
      console.log('Contract Deployer: Starting wallet-based deployment');
      console.log('Contract name:', options.contractName);
      console.log('Contract code length:', options.contractCode.length);
      console.log('Wallet provider:', options.walletProvider);

      if (!options.userSession) {
        throw new Error('User session required for wallet deployment');
      }

      if (!options.walletProvider || options.walletProvider === 'unknown') {
        throw new Error('Wallet provider not detected. Please connect your wallet.');
      }

      // Use the wallet provider router to ensure correct wallet is used
      await routeContractCall({
        contractAddress: options.userSession.loadUserData().profile.stxAddress.testnet,
        contractName: options.contractName,
        functionName: 'deploy-contract',
        functionArgs: [],
        network: this.network,
        userSession: options.userSession,
        appDetails: {
          name: 'ChainLinkPay AI Builder',
          icon: window.location.origin + '/favicon.ico'
        },
        onFinish: (data: any) => {
          console.log('Contract deployment finished:', data);
          if (options.onFinish) {
            options.onFinish(data);
          }
        },
        onCancel: () => {
          console.log('Contract deployment cancelled');
          if (options.onCancel) {
            options.onCancel();
          }
        },
        walletProvider: options.walletProvider
      });

      return {
        success: true,
        transactionId: 'pending',
        contractAddress: options.userSession.loadUserData().profile.stxAddress.testnet,
        explorerUrl: `https://explorer.stacks.co/address/${options.userSession.loadUserData().profile.stxAddress.testnet}`
      };

    } catch (error: any) {
      console.error('Contract Deployer: Wallet deployment failed:', error);
      return {
        success: false,
        error: error.message || 'Deployment failed'
      };
    }
  }

  /**
   * Deploy contract using direct transaction (for server-side deployment)
   */
  async deployDirect(options: DeploymentOptions): Promise<DeploymentResult> {
    try {
      console.log('Contract Deployer: Starting direct deployment');
      
      // This would require a private key, which we don't have in the browser
      // This method is for reference only
      throw new Error('Direct deployment requires server-side implementation with private key');

    } catch (error: any) {
      console.error('Contract Deployer: Direct deployment failed:', error);
      return {
        success: false,
        error: error.message || 'Direct deployment failed'
      };
    }
  }

  /**
   * Validate contract code before deployment
   */
  validateContract(contractCode: string, contractName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!contractCode || contractCode.trim().length === 0) {
      errors.push('Contract code is empty');
    }

    if (!contractName || contractName.trim().length === 0) {
      errors.push('Contract name is required');
    }

    // Clarity syntax validation
    if (!contractCode.includes('define-constant') && !contractCode.includes('define-data-var')) {
      errors.push('Contract must define at least one constant or data variable');
    }

    if (!contractCode.includes('define-public') && !contractCode.includes('define-read-only')) {
      errors.push('Contract must define at least one public or read-only function');
    }

    // Check for proper contract structure
    const lines = contractCode.split('\n');
    let hasValidStructure = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('define-public') || trimmedLine.startsWith('define-read-only')) {
        hasValidStructure = true;
        break;
      }
    }

    if (!hasValidStructure) {
      errors.push('Contract must have at least one function definition');
    }

    // Check for common syntax errors
    const openParens = (contractCode.match(/\(/g) || []).length;
    const closeParens = (contractCode.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses in contract code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate deployment instructions for manual deployment
   */
  generateDeploymentInstructions(contractCode: string, contractName: string): string {
    return `
# Contract Deployment Instructions

## Contract: ${contractName}

### Option 1: Deploy via Stacks Explorer
1. Go to https://explorer.stacks.co/
2. Connect your wallet
3. Navigate to "Deploy Contract"
4. Paste the contract code below
5. Set contract name: ${contractName}
6. Submit the transaction

### Option 2: Deploy via Clarinet (if you have it installed)
1. Create a new Clarinet project
2. Add the contract to \`contracts/${contractName}.clar\`
3. Run: \`clarinet deployments apply --deployment-plan-path deployments/default.testnet-plan.yaml\`

### Contract Code:
\`\`\`clarity
${contractCode}
\`\`\`

### Network: ${process.env.REACT_APP_STACKS_NETWORK || 'testnet'}
### API URL: ${this.apiUrl}

### Important Notes:
- Make sure you have enough STX for deployment fees
- Contract name must be unique on the network
- Test the contract thoroughly before mainnet deployment
`;
  }

  /**
   * Get deployment cost estimate
   */
  getDeploymentCostEstimate(contractCode: string): { fee: number; stxFee: string } {
    // Rough estimate based on contract size
    const baseFee = 50000; // 0.05 STX base fee
    const sizeFee = Math.ceil(contractCode.length / 1000) * 10000; // 0.01 STX per 1KB
    const totalFee = baseFee + sizeFee;
    
    return {
      fee: totalFee,
      stxFee: (totalFee / 1000000).toFixed(6) + ' STX'
    };
  }
}

export const contractDeployer = new ContractDeployer();
