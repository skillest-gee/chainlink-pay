import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Input, Textarea, Badge, Heading } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { paymentStorage, PaymentLink } from '../services/paymentStorage';
import { UniformButton } from './UniformButton';
import { UniformInput, UniformTextarea } from './UniformInput';
import { UniformCard } from './UniformCard';
import { isValidAmount as validateAmount, isValidDescription, validateTransactionParams } from '../utils/validation';
import { bufferCV, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { routeContractCall } from '../utils/walletProviderRouter';
import { stacksNetwork, CONTRACT_ADDRESS, CONTRACT_NAME, CONTRACT_DEPLOYED, verifyContractDeployment } from '../config/stacksConfig';
// Removed error handler and buffer utils imports - using simplified error handling

function generateId() {
  return 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Removed duplicate isValidAmount function - using imported one

export default function PaymentLinkGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, address, userSession, walletProvider, detectWalletProvider, disconnect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, connect: connectBTC } = useBitcoinWallet();
  
  const [amount, setAmount] = useState(() => {
    return localStorage.getItem('payment-amount') || '';
  });
  const [description, setDescription] = useState(() => {
    return localStorage.getItem('payment-description') || '';
  });
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentType, setPaymentType] = useState<'STX' | 'BTC'>(() => {
    return (localStorage.getItem('payment-type') as 'STX' | 'BTC') || 'STX';
  });
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled' | 'expired'>('pending');
  const [paymentHistory, setPaymentHistory] = useState<PaymentLink[]>([]);

  // Save form state to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('payment-amount', amount);
  }, [amount]);

  React.useEffect(() => {
    localStorage.setItem('payment-description', description);
  }, [description]);

  React.useEffect(() => {
    localStorage.setItem('payment-type', paymentType);
  }, [paymentType]);

  // Load payment history and listen for payment updates
  React.useEffect(() => {
    const loadPaymentHistory = () => {
      const allPayments = paymentStorage.getAllPaymentLinks();
      const currentAddress = isAuthenticated ? address : btcAddress;
      const userPayments = allPayments.filter(payment => 
        payment.merchantAddress === currentAddress
      );
      setPaymentHistory(userPayments);
      
      // Check if current generated payment is completed
      if (generatedId) {
        const currentPayment = userPayments.find(p => p.id === generatedId);
        if (currentPayment) {
          setPaymentStatus(currentPayment.status);
        }
      }
    };

    loadPaymentHistory();

    // Listen for payment completion events
    const handlePaymentUpdate = (event: CustomEvent) => {
      console.log('PaymentLinkGenerator: Payment update received', event.detail);
      // Immediate refresh when payment is updated
      setTimeout(() => {
        console.log('PaymentLinkGenerator: Immediate refresh after payment update');
        loadPaymentHistory();
      }, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
    window.addEventListener('paymentUpdated', handlePaymentUpdate as EventListener);

    return () => {
      window.removeEventListener('paymentCompleted', handlePaymentUpdate as EventListener);
      window.removeEventListener('paymentUpdated', handlePaymentUpdate as EventListener);
    };
  }, [isAuthenticated, address, btcConnected, btcAddress, generatedId]);

  // Load existing payment links for this wallet on component mount
  React.useEffect(() => {
    const currentAddress = isAuthenticated ? address : btcAddress;
    if (currentAddress) {
      const allPayments = paymentStorage.getAllPaymentLinks();
      const userPayments = allPayments.filter(p => p.merchantAddress === currentAddress);
      
      // If user has recent payments, show the most recent one
      if (userPayments.length > 0) {
        const latestPayment = userPayments.sort((a, b) => b.createdAt - a.createdAt)[0];
        setGeneratedId(latestPayment.id);
        setAmount(latestPayment.amount);
        setDescription(latestPayment.description);
        setPaymentType(latestPayment.paymentType || 'STX');
      }
    }
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  // Listen for wallet state changes
  React.useEffect(() => {
    const handleWalletChange = () => {
      console.log('PaymentLinkGenerator: Wallet state changed, reloading data');
      const currentAddress = isAuthenticated ? address : btcAddress;
      if (currentAddress) {
        const allPayments = paymentStorage.getAllPaymentLinks();
        const userPayments = allPayments.filter(p => p.merchantAddress === currentAddress);
        
        if (userPayments.length > 0) {
          const latestPayment = userPayments.sort((a, b) => b.createdAt - a.createdAt)[0];
          setGeneratedId(latestPayment.id);
          setAmount(latestPayment.amount);
          setDescription(latestPayment.description);
          setPaymentType(latestPayment.paymentType || 'STX');
        }
      }
    };

    window.addEventListener('walletConnected', handleWalletChange);
    window.addEventListener('walletDisconnected', handleWalletChange);

    return () => {
      window.removeEventListener('walletConnected', handleWalletChange);
      window.removeEventListener('walletDisconnected', handleWalletChange);
    };
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  const handleGenerate = async () => {
    // Validate all inputs
    const validation = validateTransactionParams({
      amount,
      description
    });

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      toast({ title: 'Validation Error', status: 'error', description: validation.errors.join(', ') });
      return;
    }

    if (!isAuthenticated && !btcConnected) {
      setError('Please connect your wallet to create payment links');
      toast({ title: 'Wallet Required', status: 'error', description: 'Please connect your wallet to create payment links' });
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const id = generateId();
      setGeneratedId(id);
      
      const paymentLink: PaymentLink = {
        id,
        amount: amount,
        description,
        paymentType,
        status: 'pending',
        createdAt: Date.now(),
        merchantAddress: isAuthenticated ? address! : (btcConnected ? btcAddress! : 'unknown')
      };

      paymentStorage.savePaymentLink(paymentLink);
      toast({ title: 'Success', status: 'success', description: 'Payment link generated successfully!' });
    } catch (err: any) {
      console.error('Generate payment link error:', err);
      setError(err.message || 'Failed to generate payment link');
      toast({ title: 'Error', status: 'error', description: err.message || 'Failed to generate payment link' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegisterOnChain = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Wallet Required', status: 'warning', description: 'Please connect your Stacks wallet first' });
      return;
    }

    if (!amount || !description) {
      toast({ title: 'Missing Information', status: 'error', description: 'Please fill in amount and description' });
      return;
    }

    // Check if contract is deployed
    if (!CONTRACT_DEPLOYED) {
      toast({ 
        title: 'Contract Not Deployed', 
        status: 'error', 
        description: 'The smart contract is not deployed. Please contact the administrator or use local payment links only.' 
      });
      return;
    }

    // Verify contract deployment
    const isDeployed = await verifyContractDeployment();
    if (!isDeployed) {
      toast({ 
        title: 'Contract Not Found', 
        status: 'error', 
        description: 'The smart contract could not be found on the blockchain. Please try again later or contact support.' 
      });
      return;
    }

    setIsRegistering(true);
    setError(null);

    // Temporarily disable other wallet providers to force the correct one
    let originalLeatherProvider: any = null;
    let originalXverseProvider: any = null;

    try {
      // Use static imports instead of dynamic imports to avoid React hooks issues
      const network = stacksNetwork;
      const contractAddress = CONTRACT_ADDRESS;
      const contractName = CONTRACT_NAME;

      // Use the same payment ID that was generated for the payment link
      const paymentId = generatedId || generateId();
      
      // Debug wallet provider information
      console.log('Wallet provider debug:', {
        walletProvider,
        isAuthenticated,
        address,
        userSession: !!userSession,
        userSessionIsSignedIn: userSession?.isUserSignedIn()
      });
      
      // Validate wallet connection and provider
      if (!userSession || !userSession.isUserSignedIn()) {
        toast({ 
          title: 'Wallet Not Connected', 
          status: 'error', 
          description: 'Please connect your wallet first before registering payments on-chain.' 
        });
        return;
      }

      // Check wallet provider consistency (informational only)
      const currentProvider = detectWalletProvider();
      console.log('Wallet provider check:', { walletProvider, currentProvider });
      
      // Only show warning if there's a significant mismatch, but don't force reconnection
      if (walletProvider && currentProvider !== walletProvider && currentProvider !== 'unknown') {
        console.warn(`Wallet provider mismatch detected: expected ${walletProvider}, detected ${currentProvider}`);
        // Don't force reconnection - just log the warning and continue
        // The userSession should still work with the connected wallet
      }
      
      // Trust the userSession - if it's working, the wallet is available
      // The wallet provider availability checks are too aggressive and can cause false positives
      
      // Create a 32-byte buffer for the payment ID
      const encoder = new TextEncoder();
      const idBuffer = bufferCV(encoder.encode(paymentId));
      
      // Validate the amount is within safe range
      const amountInMicroSTX = Math.floor(parseFloat(amount) * 1000000);
      if (amountInMicroSTX <= 0 || amountInMicroSTX > Number.MAX_SAFE_INTEGER) {
        throw new Error('Invalid amount. Please enter a valid amount.');
      }
      
      // Validate the address is a proper principal
      if (!address || typeof address !== 'string' || address.length < 30) {
        console.error('Invalid wallet address:', address);
        throw new Error('Invalid wallet address. Please ensure your wallet is properly connected.');
      }
      
      // Additional validation for Stacks address format
      if (!address.startsWith('SP') && !address.startsWith('ST')) {
        console.error('Invalid Stacks address format:', address);
        throw new Error('Invalid Stacks address format. Please connect a valid Stacks wallet.');
      }
      
      console.log('Contract call data:', {
        contractAddress,
        contractName,
        functionName: 'create-payment',
        paymentId,
        merchantAddress: address,
        amount: amountInMicroSTX
      });
      
      // Debug wallet connection before contract call
      console.log('=== CONTRACT CALL DEBUG ===');
      console.log('Connected address:', address);
      console.log('Is authenticated:', isAuthenticated);
      console.log('Wallet provider:', walletProvider);
      console.log('Contract address:', contractAddress);
      console.log('Contract name:', contractName);
      console.log('Full contract ID:', `${contractAddress}.${contractName}`);
      console.log('Network:', network);
      console.log('User session:', userSession);
      
      // Use the user session from the hook
      console.log('User session exists:', !!userSession);
      console.log('User session is signed in:', userSession?.isUserSignedIn());
      if (userSession?.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        console.log('User data from session:', userData);
        console.log('User profile:', userData.profile);
      }
      
      // Create payment registration transaction using Stacks Connect
      // Add debug logging to understand wallet provider behavior
      console.log('=== OPEN CONTRACT CALL DEBUG ===');
      console.log('Wallet provider:', walletProvider);
      console.log('User session:', userSession);
      console.log('Is user signed in:', userSession?.isUserSignedIn());
      console.log('User data:', userSession?.loadUserData());
      console.log('Available wallet providers before isolation:');
      console.log('- LeatherProvider:', !!(window as any).LeatherProvider);
      console.log('- leather:', !!(window as any).leather);
      console.log('- XverseProvider:', !!(window as any).XverseProvider);
      console.log('- xverse:', !!(window as any).xverse);
      
      
      if (walletProvider === 'xverse') {
        // Temporarily hide Leather provider to force Xverse
        console.log('Forcing Xverse wallet - hiding Leather providers');
        if ((window as any).LeatherProvider) {
          originalLeatherProvider = (window as any).LeatherProvider;
          (window as any).LeatherProvider = undefined;
        }
        if ((window as any).leather) {
          originalLeatherProvider = (window as any).leather;
          (window as any).leather = undefined;
        }
        if ((window as any).hiro) {
          originalLeatherProvider = (window as any).hiro;
          (window as any).hiro = undefined;
        }
        // Also hide any other potential Leather references
        if ((window as any).LeatherWallet) {
          (window as any).LeatherWallet = undefined;
        }
        if ((window as any).Leather) {
          (window as any).Leather = undefined;
        }
      } else if (walletProvider === 'leather') {
        // Temporarily hide Xverse provider to force Leather
        console.log('Forcing Leather wallet - hiding Xverse providers');
        if ((window as any).XverseProvider) {
          originalXverseProvider = (window as any).XverseProvider;
          (window as any).XverseProvider = undefined;
        }
        if ((window as any).xverse) {
          originalXverseProvider = (window as any).xverse;
          (window as any).xverse = undefined;
        }
        if ((window as any).XverseWallet) {
          (window as any).XverseWallet = undefined;
        }
        if ((window as any).Xverse) {
          (window as any).Xverse = undefined;
        }
      }
      
      console.log('Available wallet providers after isolation:');
      console.log('- LeatherProvider:', !!(window as any).LeatherProvider);
      console.log('- leather:', !!(window as any).leather);
      console.log('- XverseProvider:', !!(window as any).XverseProvider);
      console.log('- xverse:', !!(window as any).xverse);
      
      await routeContractCall({
        contractAddress,
        contractName,
        functionName: 'create-payment',
        functionArgs: [
          // id (buff 32) - use bufferCV helper
          idBuffer,
          // merchant (principal) - use standardPrincipalCV helper
          standardPrincipalCV(address),
          // amount (uint) - use uintCV helper
          uintCV(amountInMicroSTX)
        ],
        network,
        // Explicitly use the current user session to ensure correct wallet
        userSession: userSession,
        // Configure to use the specific wallet provider that's already connected
        // Use the appDetails to ensure consistent wallet provider usage
        appDetails: {
          name: 'ChainLinkPay',
          icon: window.location.origin + '/logo.png',
        },
        // Route to the correct wallet provider
        walletProvider: walletProvider || 'unknown',
        onFinish: (data: any) => {
          console.log('Contract call finished:', data);
          console.log('Payment ID used in contract:', paymentId);
          console.log('Buffer used in contract:', idBuffer);
          
          // Restore wallet providers
          if (originalLeatherProvider) {
            (window as any).LeatherProvider = originalLeatherProvider;
            (window as any).leather = originalLeatherProvider;
            (window as any).hiro = originalLeatherProvider;
          }
          if (originalXverseProvider) {
            (window as any).XverseProvider = originalXverseProvider;
            (window as any).xverse = originalXverseProvider;
          }
          
          toast({ 
            title: 'Success', 
            status: 'success', 
            description: `Payment registered on-chain! TX: ${data.txId.slice(0, 8)}...` 
          });
          
          // Don't call handleGenerate() here as it contains React hooks
          // The payment link is already generated and stored locally
        },
        onCancel: () => {
          console.log('=== CONTRACT CALL CANCELLED ===');
          console.log('Contract call was cancelled by user or wallet');
          console.log('Wallet provider at time of cancellation:', walletProvider);
          console.log('Available wallet providers at cancellation:');
          console.log('- LeatherProvider:', !!(window as any).LeatherProvider);
          console.log('- leather:', !!(window as any).leather);
          console.log('- XverseProvider:', !!(window as any).XverseProvider);
          console.log('- xverse:', !!(window as any).xverse);
          
          // Restore wallet providers
          if (originalLeatherProvider) {
            (window as any).LeatherProvider = originalLeatherProvider;
            (window as any).leather = originalLeatherProvider;
            (window as any).hiro = originalLeatherProvider;
          }
          if (originalXverseProvider) {
            (window as any).XverseProvider = originalXverseProvider;
            (window as any).xverse = originalXverseProvider;
          }
          
          const errorMessage = 'Transaction was rejected by user';
          toast({ title: 'Transaction Rejected', status: 'error', description: errorMessage });
        }
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Restore wallet providers in case of error
      if (originalLeatherProvider) {
        (window as any).LeatherProvider = originalLeatherProvider;
        (window as any).leather = originalLeatherProvider;
        (window as any).hiro = originalLeatherProvider;
      }
      if (originalXverseProvider) {
        (window as any).XverseProvider = originalXverseProvider;
        (window as any).xverse = originalXverseProvider;
      }
      
      const errorMessage = err.message || 'Failed to register payment on blockchain';
      setError(errorMessage);
      setErrorDetails({
        code: 'REGISTRATION_ERROR',
        details: errorMessage,
        action: 'Please try again or check your wallet connection',
        severity: 'error',
        originalError: err.message || err.toString()
      });
      toast({ title: 'Registration Failed', status: 'error', description: errorMessage });
    } finally {
      setIsRegistering(false);
    }
  };


  const copyToClipboard = async () => {
    if (generatedId && amount && description) {
      // Create URL with payment data as parameters
      const params = new URLSearchParams({
        amount: amount,
        description: description,
        merchant: isAuthenticated ? address! : (btcConnected ? btcAddress! : 'unknown'),
        type: paymentType || 'STX'
      });
      const url = `${window.location.origin}/pay/${generatedId}?${params.toString()}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Copied', status: 'info', description: 'Payment link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paymentUrl = generatedId && amount && description ? (() => {
    const params = new URLSearchParams({
      amount: amount,
      description: description,
      merchant: isAuthenticated ? address! : (btcConnected ? btcAddress! : 'unknown'),
      type: paymentType || 'STX'
    });
    return `${window.location.origin}/pay/${generatedId}?${params.toString()}`;
  })() : '';

  // Check if wallet is connected
  const isWalletConnected = isAuthenticated || btcConnected;

  return (
    <VStack gap={6} align="stretch">
      {/* Header with Innovation Showcase */}
      <VStack gap={4} textAlign="center">
        <VStack gap={2}>
          <Heading size="xl" color="#ffffff">
            💳 Payment Link Generator
          </Heading>
          <Text color="#9ca3af" maxW="2xl" fontSize="lg">
            Create secure Bitcoin and STX payment links with QR codes. Share payment requests instantly across any device or platform.
          </Text>
        </VStack>
        
        {/* Payment Innovation Showcase */}
        <Box 
          bg="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)"
          border="1px solid rgba(245, 158, 11, 0.2)"
          borderRadius="xl"
          p={4}
          maxW="2xl"
        >
          <VStack gap={2}>
            <Heading size="sm" color="#f59e0b">
              🚀 Payment Innovation
            </Heading>
            <Text fontSize="xs" color="#9ca3af" textAlign="center">
              Revolutionary payment link sharing with embedded data. Works across devices, browsers, and platforms.
            </Text>
            <HStack gap={2} wrap="wrap" justify="center">
              <Text fontSize="xs" color="#10b981">✓ URL-Embedded Data</Text>
              <Text fontSize="xs" color="#10b981">✓ Cross-Device Sharing</Text>
              <Text fontSize="xs" color="#10b981">✓ QR Code Generation</Text>
              <Text fontSize="xs" color="#10b981">✓ Blockchain Tracking</Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      {/* Wallet Connection Check */}
      {!isWalletConnected && (
        <UniformCard p={6}>
          <VStack gap={4} align="center" textAlign="center">
            <Text fontSize="2xl">🔗</Text>
            <Heading size="md" color="#ffffff">
              Connect Your Wallet
            </Heading>
            <Text color="#9ca3af">
              Connect your Stacks or Bitcoin wallet to create payment links and register them on-chain.
            </Text>
            <HStack gap={3}>
              <UniformButton variant="primary" size="md" onClick={() => window.location.href = '/'}>
                Connect Wallet
              </UniformButton>
            </HStack>
          </VStack>
        </UniformCard>
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isWalletConnected && (
        <>
      {/* Payment Type Selection */}
      <VStack gap={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
          Payment Type
        </Text>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as 'STX' | 'BTC')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            width: '100%'
          }}
        >
          <option value="STX" style={{ backgroundColor: '#000000', color: '#ffffff' }}>STX (Stacks)</option>
          <option value="BTC" style={{ backgroundColor: '#000000', color: '#ffffff' }}>BTC (Bitcoin)</option>
        </select>
      </VStack>

      {/* Amount Input */}
      <VStack gap={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
          Amount
          </Text>
        <UniformInput
          type="number"
          placeholder="Enter amount"
            value={amount}
          onChange={(e) => setAmount(e.target.value)}
          variant="default"
        />
      </VStack>

      {/* Description Input */}
      <VStack gap={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
            Description
          </Text>
        <UniformTextarea
          placeholder="Enter payment description"
            value={description} 
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </VStack>

      {/* Generate Button */}
      <UniformButton
        variant="primary"
        onClick={handleGenerate}
        disabled={!amount || !description || isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Payment Link'}
      </UniformButton>

      {/* Error Display */}
      {error && (
        <Box p={4} bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)" borderRadius="lg">
          <VStack gap={2} align="stretch">
            <HStack gap={2} align="center">
              <Text fontSize="lg">🚨</Text>
              <Text color="#ef4444" fontSize="sm" fontWeight="medium">Error</Text>
            </HStack>
            <Text color="#ef4444" fontSize="sm">{error}</Text>
            {errorDetails && (
              <Box p={2} bg="rgba(0, 0, 0, 0.3)" borderRadius="md">
                <Text color="#9ca3af" fontSize="xs" fontFamily="mono">
                  {typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}
                </Text>
              </Box>
            )}
            <Button
              size="sm"
              variant="ghost"
              color="#ef4444"
              onClick={() => {
                setError(null);
                setErrorDetails(null);
              }}
            >
              Dismiss
            </Button>
          </VStack>
        </Box>
      )}

      {/* Generated Payment Link */}
      {generatedId && (
        <UniformCard 
          p={6}
          opacity={paymentStatus === 'paid' || paymentStatus === 'expired' ? 0.7 : 1}
          borderColor={
            paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.3)' : 
            paymentStatus === 'expired' ? 'rgba(245, 158, 11, 0.3)' :
            undefined
          }
        >
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="#ffffff">
                Payment Link Generated
              </Text>
              <Badge 
                colorScheme={
                  paymentStatus === 'paid' ? 'green' : 
                  paymentStatus === 'cancelled' ? 'red' : 
                  paymentStatus === 'expired' ? 'orange' :
                  'blue'
                }
              >
                {paymentStatus === 'paid' ? '✅ Paid' : 
                 paymentStatus === 'cancelled' ? '❌ Cancelled' : 
                 paymentStatus === 'expired' ? '⏰ Expired' :
                 '⏳ Pending'}
              </Badge>
            </HStack>
            
            {/* QR Code */}
            <Box textAlign="center" p={4} bg="#ffffff" borderRadius="lg">
              <QRCodeSVG value={paymentUrl} size={200} />
            </Box>
            
            {/* Payment URL */}
            <VStack gap={2} align="stretch">
              <Text fontSize="sm" fontWeight="medium" color="#9ca3af">
                Payment URL:
              </Text>
              <Box p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg" border="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
                <Text fontSize="sm" color="#ffffff" fontFamily="mono" wordBreak="break-all">
                  {paymentUrl}
                </Text>
              </Box>
            </VStack>

            {/* Action Buttons */}
            <HStack gap={3} justify="center">
              <UniformButton
                variant="secondary"
                onClick={copyToClipboard}
                disabled={copied || paymentStatus === 'paid' || paymentStatus === 'expired'}
              >
                {copied ? 'Copied!' : 
                 paymentStatus === 'paid' ? 'Payment Completed' : 
                 paymentStatus === 'expired' ? 'Link Expired' :
                 'Copy Link'}
              </UniformButton>

              {isAuthenticated && (
                <>
                  <UniformButton
                    variant="accent"
                    onClick={handleRegisterOnChain}
                    disabled={isRegistering || paymentStatus === 'paid' || paymentStatus === 'expired'}
                  >
                    {isRegistering ? 'Registering...' : 
                     paymentStatus === 'paid' ? 'Already Registered' : 
                     paymentStatus === 'expired' ? 'Link Expired' :
                     'Register On-Chain'}
                  </UniformButton>

                  {/* Payment Status Messages */}
                  {generatedId && (
                    <Box p={3} 
                         bg={
                           paymentStatus === 'paid' ? "rgba(16, 185, 129, 0.1)" :
                           paymentStatus === 'cancelled' ? "rgba(239, 68, 68, 0.1)" :
                           paymentStatus === 'expired' ? "rgba(245, 158, 11, 0.1)" :
                           "rgba(59, 130, 246, 0.1)"
                         } 
                         border="1px solid" 
                         borderColor={
                           paymentStatus === 'paid' ? "rgba(16, 185, 129, 0.3)" :
                           paymentStatus === 'cancelled' ? "rgba(239, 68, 68, 0.3)" :
                           paymentStatus === 'expired' ? "rgba(245, 158, 11, 0.3)" :
                           "rgba(59, 130, 246, 0.3)"
                         } 
                         borderRadius="lg">
                      <Text 
                        color={
                          paymentStatus === 'paid' ? "#10b981" :
                          paymentStatus === 'cancelled' ? "#ef4444" :
                          paymentStatus === 'expired' ? "#f59e0b" :
                          "#3b82f6"
                        } 
                        fontSize="sm" 
                        textAlign="center">
                        {paymentStatus === 'paid' ? '🎉 Payment completed successfully! Your customer has paid.' :
                         paymentStatus === 'cancelled' ? '❌ Payment was cancelled.' :
                         paymentStatus === 'expired' ? '⏰ Payment link has expired. Create a new one to receive payments.' :
                         '⏳ Payment link created! Share this link with your customer to receive payment.'}
                      </Text>
                    </Box>
                  )}
                </>
              )}
            </HStack>

            {/* Wallet Connection Status */}
            {!isAuthenticated && (
              <Box p={3} bg="rgba(59, 130, 246, 0.1)" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)" borderRadius="lg">
                <Text color="#3b82f6" fontSize="sm" textAlign="center">
                  Connect your wallet to register payments on-chain and make payments
                </Text>
              </Box>
            )}
          </VStack>
        </UniformCard>
        )}

        {/* Payment History Section */}
        {paymentHistory.length > 0 && (
          <UniformCard p={6}>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading size="md" color="#ffffff">
                  Payment History
                </Heading>
                <HStack gap={2}>
                  <Badge colorScheme="blue">{paymentHistory.length} payments</Badge>
                  <UniformButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('Manual refresh of payment history');
                      const allPayments = paymentStorage.getAllPaymentLinks();
                      const currentAddress = isAuthenticated ? address : btcAddress;
                      const userPayments = allPayments.filter(payment => 
                        payment.merchantAddress === currentAddress
                      );
                      setPaymentHistory(userPayments);
                      
                      // Check if current generated payment is completed
                      if (generatedId) {
                        const currentPayment = userPayments.find(p => p.id === generatedId);
                        if (currentPayment) {
                          setPaymentStatus(currentPayment.status);
                        }
                      }
                    }}
                    title="Refresh payment status"
                  >
                    🔄
                  </UniformButton>
                </HStack>
              </HStack>
              
              <VStack gap={3} align="stretch">
                {paymentHistory.slice(0, 5).map((payment) => (
                  <Box 
                    key={payment.id}
                    p={4} 
                    bg="rgba(255, 255, 255, 0.05)" 
                    border="1px solid" 
                    borderColor="rgba(255, 255, 255, 0.1)" 
                    borderRadius="lg"
                  >
                    <HStack justify="space-between" align="center">
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                          {payment.description}
                        </Text>
                        <Text fontSize="xs" color="#9ca3af">
                          {payment.amount} {payment.paymentType} • {new Date(payment.createdAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <VStack align="end" gap={1}>
                        <Badge 
                          colorScheme={
                            payment.status === 'paid' ? 'green' : 
                            payment.status === 'cancelled' ? 'red' : 
                            payment.status === 'expired' ? 'orange' :
                            'blue'
                          }
                        >
                          {payment.status === 'paid' ? '✅ Paid' : 
                           payment.status === 'cancelled' ? '❌ Cancelled' : 
                           payment.status === 'expired' ? '⏰ Expired' :
                           '⏳ Pending'}
                        </Badge>
                        {payment.status === 'paid' && payment.paidAt && (
                          <Text fontSize="xs" color="#10b981">
                            Paid {new Date(payment.paidAt).toLocaleDateString()}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
              
              {paymentHistory.length > 5 && (
                <Text fontSize="sm" color="#9ca3af" textAlign="center">
                  Showing 5 of {paymentHistory.length} payments. View all in Dashboard.
                </Text>
              )}
            </VStack>
          </UniformCard>
        )}
        </>
        )}
    </VStack>
  );
}