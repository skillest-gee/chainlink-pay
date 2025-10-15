// Contract Deployment Utility for AI-Generated Contracts
import { openContractCall, openContractDeploy } from '@stacks/connect';
import { makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { routeContractCall } from './walletProviderRouter';

export interface DeploymentOptions {
  contractName: string;
  contractCode: string;
  network?: 'testnet' | 'mainnet';
  fee?: number;
  userSession?: any;
  walletProvider?: 'xverse' | 'leather' | 'hiro' | 'stacks-connect' | 'unknown';
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

      // Get user address
      const userData = options.userSession.loadUserData();
      const userAddress = userData.profile.stxAddress.testnet;
      
      console.log('Contract Deployer: User address:', userAddress);
      console.log('Contract Deployer: Network:', this.network);

      // Create contract deployment transaction
      const deployOptions = {
        contractName: options.contractName,
        codeBody: options.contractCode,
        network: this.network,
        fee: options.fee || 50000, // 0.05 STX default fee
        sponsored: false,
        stxAddress: userAddress,
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
        }
      };

      // Use the correct deployment method based on wallet provider
      if (options.walletProvider === 'xverse' || options.walletProvider === 'leather') {
        // For Xverse and Leather wallets, we need to use the contract deployment flow
        await this.deployWithConnect(options.userSession, deployOptions);
      } else {
        // For other wallets, use the standard deployment
        await this.deployWithConnect(options.userSession, deployOptions);
      }

      return {
        success: true,
        transactionId: 'pending',
        contractAddress: userAddress,
        explorerUrl: `https://explorer.stacks.co/address/${userAddress}`
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
   * Deploy contract using Stacks Connect
   */
  private async deployWithConnect(userSession: any, deployOptions: any): Promise<void> {
    try {
      await openContractDeploy({
        contractName: deployOptions.contractName,
        codeBody: deployOptions.codeBody,
        network: deployOptions.network,
        appDetails: deployOptions.appDetails,
        onFinish: deployOptions.onFinish,
        onCancel: deployOptions.onCancel
      });
    } catch (error: any) {
      console.error('Contract Deployer: Connect deployment failed:', error);
      throw error;
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

    console.log('Contract Deployer: Validating contract:', contractName);
    console.log('Contract Deployer: Contract code length:', contractCode.length);
    console.log('Contract Deployer: Contract preview:', contractCode.substring(0, 200));

    // Basic validation
    if (!contractCode || contractCode.trim().length === 0) {
      errors.push('Contract code is empty');
      return { valid: false, errors };
    }

    if (!contractName || contractName.trim().length === 0) {
      errors.push('Contract name is required');
      return { valid: false, errors };
    }

    // Clean the contract code (remove comments and extra whitespace for analysis)
    const cleanCode = contractCode
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith(';;'))
      .join('\n');

    console.log('Contract Deployer: Clean code length:', cleanCode.length);

    // Check for Clarity-specific syntax
    const hasDefineConstant = cleanCode.includes('define-constant');
    const hasDefineDataVar = cleanCode.includes('define-data-var');
    const hasDefineMap = cleanCode.includes('define-map');
    const hasDefinePublic = cleanCode.includes('define-public');
    const hasDefineReadOnly = cleanCode.includes('define-read-only');

    console.log('Contract Deployer: Syntax check:', {
      hasDefineConstant,
      hasDefineDataVar,
      hasDefineMap,
      hasDefinePublic,
      hasDefineReadOnly
    });

    // More flexible validation - contract needs either constants/variables OR functions
    const hasDataDefinitions = hasDefineConstant || hasDefineDataVar || hasDefineMap;
    const hasFunctionDefinitions = hasDefinePublic || hasDefineReadOnly;

    if (!hasDataDefinitions && !hasFunctionDefinitions) {
      errors.push('Contract must define at least one constant, data variable, map, or function');
    }

    // Check for proper function structure if functions exist
    if (hasFunctionDefinitions) {
      // Clarity functions can be defined across multiple lines, so we just check
      // that we have function definitions and let the Clarity compiler handle syntax validation
      const hasFunctionKeywords = cleanCode.includes('define-public') || cleanCode.includes('define-read-only');
      
      if (!hasFunctionKeywords) {
        errors.push('Contract must contain function definitions');
      }
    }

    // Check for common syntax errors
    const openParens = (contractCode.match(/\(/g) || []).length;
    const closeParens = (contractCode.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses in contract code');
    }

    // Check for basic Clarity keywords
    if (!cleanCode.includes('define-')) {
      errors.push('Contract must contain at least one definition (define-constant, define-data-var, define-public, etc.)');
    }

    console.log('Contract Deployer: Validation result:', { valid: errors.length === 0, errors });

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

  /**
   * Get network information
   */
  getNetworkInfo(): { network: string; apiUrl: string; explorerUrl: string } {
    const networkType = process.env.REACT_APP_STACKS_NETWORK || 'testnet';
    const apiUrl = process.env.REACT_APP_STACKS_API_URL || 
      (networkType === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so');
    const explorerUrl = networkType === 'mainnet' ? 'https://explorer.stacks.co' : 'https://explorer.stacks.co';
    
    return {
      network: networkType,
      apiUrl,
      explorerUrl
    };
  }

  /**
   * Validate deployment prerequisites
   */
  validateDeploymentPrerequisites(userSession: any, walletProvider: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userSession) {
      errors.push('User session is required');
    }

    // More lenient wallet provider validation - if user is authenticated, allow deployment
    if (!userSession?.isUserSignedIn()) {
      errors.push('User must be signed in to deploy contracts');
    }

    try {
      const userData = userSession?.loadUserData();
      if (!userData?.profile?.stxAddress?.testnet) {
        errors.push('User address not found in session');
      }
    } catch (error) {
      errors.push('Invalid user session');
    }

    // Log the validation details for debugging
    console.log('Contract Deployer: Deployment prerequisites check:', {
      hasUserSession: !!userSession,
      isUserSignedIn: userSession?.isUserSignedIn(),
      walletProvider: walletProvider,
      hasUserData: !!userSession?.loadUserData(),
      errors: errors
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const contractDeployer = new ContractDeployer();
