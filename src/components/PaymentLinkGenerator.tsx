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

function generateId() {
  return 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function isValidAmount(value: string) {
  if (!value) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

export default function PaymentLinkGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, address } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, connect: connectBTC } = useBitcoinWallet();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentType, setPaymentType] = useState<'STX' | 'BTC'>('STX');
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    if (!isValidAmount(amount)) {
      setError('Please enter a valid amount');
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
    } catch (err) {
      setError('Failed to generate payment link');
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

    setIsRegistering(true);
    setError(null);

    try {
      // Import Stacks Connect and Clarity Value helpers
      const { openContractCall } = await import('@stacks/connect');
      const { bufferCV, standardPrincipalCV, uintCV } = await import('@stacks/transactions');
      
      // Use existing network configuration
      const { stacksNetwork } = await import('../config/stacksConfig');
      const network = stacksNetwork;
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      const contractName = process.env.REACT_APP_CONTRACT_NAME || 'chainlink-pay';
      
      if (!contractAddress || contractAddress === 'ST000000000000000000002AMW42H') {
        throw new Error('Contract not deployed. Please deploy the contract first.');
      }

      // Generate a unique ID for the payment
      const paymentId = generateId();
      
      // Create a 32-byte buffer for the payment ID using a more reliable method
      let idBuffer: Uint8Array;
      try {
        // Method 1: Try to create from hex string if paymentId is hex
        if (paymentId.match(/^[0-9a-fA-F]+$/)) {
          const hexString = paymentId.padStart(64, '0').slice(0, 64); // Ensure 32 bytes (64 hex chars)
          idBuffer = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            idBuffer[i] = parseInt(hexString.substr(i * 2, 2), 16);
          }
        } else {
          // Method 2: Use TextEncoder for string IDs
          const paymentIdBytes = new TextEncoder().encode(paymentId);
          idBuffer = new Uint8Array(32);
          for (let i = 0; i < Math.min(32, paymentIdBytes.length); i++) {
            idBuffer[i] = paymentIdBytes[i];
          }
        }
      } catch (error) {
        console.error('Error creating buffer:', error);
        throw new Error('Failed to create payment ID buffer');
      }
      
      console.log('Buffer details for create-payment:', {
        paymentId,
        bufferLength: idBuffer.length,
        bufferBytes: Array.from(idBuffer),
        bufferHex: Array.from(idBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
      });
      
      // Validate the amount is within safe range
      const amountInMicroSTX = Math.floor(parseFloat(amount) * 1000000);
      if (amountInMicroSTX <= 0 || amountInMicroSTX > Number.MAX_SAFE_INTEGER) {
        throw new Error('Invalid amount. Please enter a valid amount.');
      }
      
      // Validate the address is a proper principal
      if (!address || !/^[SP][0-9A-Z]{39}$/.test(address)) {
        throw new Error('Invalid wallet address.');
      }
      
      console.log('Contract call data:', {
        contractAddress,
        contractName,
        functionName: 'create-payment',
        paymentId,
        merchantAddress: address,
        amount: amountInMicroSTX
      });
      
      // Create payment registration transaction using Stacks Connect
      await openContractCall({
        contractAddress,
        contractName,
        functionName: 'create-payment',
        functionArgs: [
          // id (buff 32) - use bufferCV helper
          bufferCV(idBuffer),
          // merchant (principal) - use standardPrincipalCV helper
          standardPrincipalCV(address),
          // amount (uint) - use uintCV helper
          uintCV(amountInMicroSTX)
        ],
        network,
        onFinish: (data) => {
          console.log('Contract call finished:', data);
          toast({ 
            title: 'Success', 
            status: 'success', 
            description: `Payment registered on-chain! TX: ${data.txId.slice(0, 8)}...` 
          });
          
          // Generate local payment link as well
          handleGenerate();
        },
        onCancel: () => {
          console.log('Contract call cancelled');
          toast({ title: 'Cancelled', status: 'info', description: 'Transaction cancelled by user' });
        }
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register payment on-chain');
      toast({ 
        title: 'Registration Failed', 
        status: 'error', 
        description: err.message || 'Failed to register payment on-chain' 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePay = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Wallet Required', status: 'warning', description: 'Please connect your wallet first' });
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: 'Success', status: 'success', description: 'Payment processed successfully!' });
    } catch (err) {
      setError('Payment failed');
    } finally {
      setIsPaying(false);
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
                  loading={isGenerating}
        disabled={!isValidAmount(amount)}
      >
        {isGenerating ? 'Generating...' : 'Generate Payment Link'}
      </UniformButton>

      {/* Error Display */}
      {error && (
        <Box p={3} bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)" borderRadius="lg">
          <Text color="#ef4444" fontSize="sm">{error}</Text>
        </Box>
      )}

      {/* Generated Payment Link */}
      {generatedId && (
        <UniformCard p={6}>
          <VStack gap={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="#ffffff">
                Payment Link Generated
              </Text>
              <Badge colorScheme="green">Generated</Badge>
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
                disabled={copied}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </UniformButton>

              {isAuthenticated && (
                <>
                  <UniformButton
                    variant="accent"
                    onClick={handleRegisterOnChain}
                    loading={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : 'Register On-Chain'}
                  </UniformButton>

                  <UniformButton
                    variant="primary"
                    onClick={handlePay}
                    loading={isPaying}
                  >
                    {isPaying ? 'Processing...' : 'Pay Now'}
                  </UniformButton>
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
        </>
      )}
    </VStack>
  );
}