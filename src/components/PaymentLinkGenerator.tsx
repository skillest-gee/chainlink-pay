import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, Input, Textarea, Text, Skeleton, Badge, VStack } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { openSTXTransfer } from '@stacks/connect';
import { stacksNetwork, MERCHANT_ADDRESS, CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/stacksConfig';
import { openContractCall } from '@stacks/connect';
import { bufferCVFromString, principalCV, uintCV } from '@stacks/transactions';
// import { useDemo } from '../context/DemoContext'; // Removed for production
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { paymentStorage, PaymentLink } from '../services/paymentStorage';
import { UniformButton } from './UniformButton';
import { UniformInput, UniformTextarea } from './UniformInput';
import { UniformCard } from './UniformCard';

function generateId() {
  // Simple unique ID using timestamp + random segment
  return 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function isValidAmount(value: string) {
  if (!value) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

export default function PaymentLinkGenerator() {
  const { toast } = useToast();
  const { isAuthenticated } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, balance: btcBalance, connect: connectBTC } = useBitcoinWallet();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentType, setPaymentType] = useState<'STX' | 'BTC'>('STX');
  const [error, setError] = useState<string | null>(null);
  // const { enabled: demoEnabled, preset } = useDemo(); // Removed for production

  // Debug configuration
  console.log('PaymentLinkGenerator - Configuration:');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('MERCHANT_ADDRESS:', MERCHANT_ADDRESS);
  console.log('CONTRACT_ADDRESS:', CONTRACT_ADDRESS);
  console.log('CONTRACT_NAME:', CONTRACT_NAME);
  console.log('Amount:', amount);
  console.log('isValidAmount(amount):', isValidAmount(amount));
  console.log('Pay button disabled:', !isValidAmount(amount) || !MERCHANT_ADDRESS);
  console.log('Register button disabled:', !amount);

  const amountInvalid = touched && !isValidAmount(amount);

  const link = useMemo(() => {
    if (!generatedId) return '';
    const origin = window.location.origin;
    const params = new URLSearchParams();
    params.set('amount', amount);
    if (description) params.set('desc', description);
    return `${origin}/pay/${generatedId}?${params.toString()}`;
  }, [generatedId, amount, description]);

  const onGenerate = async () => {
    setTouched(true);
    setError(null);
    
    if (!isValidAmount(amount)) {
      const errorMsg = 'Enter a positive number.';
      setError(errorMsg);
      toast({ title: 'Invalid amount', description: errorMsg, status: 'error' });
      return;
    }

    if (paymentType === 'BTC' && !btcConnected) {
      const errorMsg = 'Please connect your Bitcoin wallet first';
      setError(errorMsg);
      toast({ title: 'Bitcoin wallet required', description: errorMsg, status: 'error' });
      return;
    }

    if (!MERCHANT_ADDRESS) {
      const errorMsg = 'Set REACT_APP_MERCHANT_ADDRESS in .env';
      setError(errorMsg);
      toast({ title: 'Merchant address required', description: errorMsg, status: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      const id = generateId();
      setGeneratedId(id);

      // Create payment link with expiration (24 hours)
      const paymentLink: PaymentLink = {
        id,
        amount,
        description,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        merchantAddress: MERCHANT_ADDRESS,
        paymentType: paymentType // Add payment type to the link
      };

      // Save to storage
      paymentStorage.savePaymentLink(paymentLink);

      toast({ title: 'Payment link generated', description: `${paymentType} payment link created successfully`, status: 'success' });
    } catch (e: any) {
      toast({ title: 'Failed to generate link', description: e?.message || 'Unknown error', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const onCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link copied to clipboard', status: 'success' });
      setCopied(true);
    } catch (e: any) {
      toast({ title: 'Copy failed', description: e?.message || 'Try selecting and copying manually.', status: 'error' });
    }
  };

  // useEffect(() => {
  //   if (!demoEnabled) return;
  //   if (preset === 'simple-payment') {
  //     setAmount('10');
  //     setDescription('Demo coffee payment');
  //   }
  // }, [demoEnabled, preset]); // Removed for production

  const onPay = async () => {
    console.log('Pay with Wallet button clicked');
    console.log('Current state:', { isAuthenticated, amount, MERCHANT_ADDRESS, CONTRACT_ADDRESS, paymentType, btcConnected });
    setTouched(true);
    setError(null);
    setIsPaying(true);
    
    try {
      if (paymentType === 'STX') {
        if (!isAuthenticated) {
          const errorMsg = 'Please connect your Stacks wallet first';
          setError(errorMsg);
          toast({ title: 'Wallet required', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!isValidAmount(amount)) {
          const errorMsg = 'Enter a positive number.';
          setError(errorMsg);
          toast({ title: 'Invalid amount', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!MERCHANT_ADDRESS) {
          const errorMsg = 'Set REACT_APP_MERCHANT_ADDRESS in .env';
          setError(errorMsg);
          toast({ title: 'Missing merchant address', description: errorMsg, status: 'error' });
          return;
        }
        
        console.log('Initiating STX transfer...');
        console.log('Amount:', amount, 'STX');
        console.log('Merchant:', MERCHANT_ADDRESS);
        console.log('Description:', description);
        
        const microStx = Math.round(Number(amount) * 1_000_000);
        console.log('MicroSTX amount:', microStx);
        
        await openSTXTransfer({
          network: stacksNetwork,
          recipient: MERCHANT_ADDRESS,
          amount: microStx.toString(),
          memo: description?.slice(0, 34),
          onFinish: (result: any) => {
            console.log('STX transfer completed:', result);
            try { (window as any).__stats?.addVolume?.(Number(amount)); } catch {}
            toast({ title: 'Transaction submitted', description: `Sent ${amount} STX to ${MERCHANT_ADDRESS}`, status: 'success' });
          },
          onCancel: () => {
            console.log('STX transfer cancelled by user');
            toast({ title: 'Transaction cancelled', status: 'info' });
          },
        });
      } else if (paymentType === 'BTC') {
        if (!btcConnected) {
          const errorMsg = 'Please connect your Bitcoin wallet first';
          setError(errorMsg);
          toast({ title: 'Bitcoin wallet required', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!isValidAmount(amount)) {
          const errorMsg = 'Enter a positive number.';
          setError(errorMsg);
          toast({ title: 'Invalid amount', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!MERCHANT_ADDRESS) {
          const errorMsg = 'Set REACT_APP_MERCHANT_ADDRESS in .env';
          setError(errorMsg);
          toast({ title: 'Missing merchant address', description: errorMsg, status: 'error' });
          return;
        }
        
        console.log('Initiating Bitcoin transfer...');
        console.log('Amount:', amount, 'BTC');
        console.log('Merchant:', MERCHANT_ADDRESS);
        console.log('Description:', description);
        
        // For Bitcoin, we'll use the bridge functionality
        toast({ title: 'Bitcoin Payment', description: 'Bitcoin payments are processed through the cross-chain bridge. Please use the Bridge page for Bitcoin transactions.', status: 'info' });
      }
    } catch (e: any) {
      console.error('Payment error:', e);
      const errorMsg = e?.message || 'Could not initiate payment';
      setError(errorMsg);
      toast({ title: 'Payment failed', description: errorMsg, status: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  const onRegisterOnChain = async () => {
    console.log('Register On-Chain button clicked');
    console.log('Current state:', { isAuthenticated, amount, CONTRACT_ADDRESS, CONTRACT_NAME, paymentType, btcConnected });
    setError(null);
    setIsRegistering(true);
    
    try {
      // Check if demo mode is enabled
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        toast({ 
          title: 'Demo Mode', 
          description: 'Payment registered locally. In production, this would register on the Stacks blockchain.', 
          status: 'success' 
        });
        return;
      }
      
      if (paymentType === 'STX') {
        if (!isAuthenticated) {
          const errorMsg = 'Please connect your Stacks wallet first';
          setError(errorMsg);
          toast({ title: 'Wallet required', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!CONTRACT_ADDRESS) {
          const errorMsg = 'Set REACT_APP_CONTRACT_ADDRESS';
          setError(errorMsg);
          toast({ title: 'Contract not configured', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!amount || !isValidAmount(amount)) {
          const errorMsg = 'Enter a valid amount to register';
          setError(errorMsg);
          toast({ title: 'Invalid amount', description: errorMsg, status: 'error' });
          return;
        }
      } else if (paymentType === 'BTC') {
        if (!btcConnected) {
          const errorMsg = 'Please connect your Bitcoin wallet first';
          setError(errorMsg);
          toast({ title: 'Bitcoin wallet required', description: errorMsg, status: 'error' });
          return;
        }
        
        if (!amount || !isValidAmount(amount)) {
          const errorMsg = 'Enter a valid amount to register';
          setError(errorMsg);
          toast({ title: 'Invalid amount', description: errorMsg, status: 'error' });
          return;
        }
        
        // For Bitcoin, we'll use the bridge functionality
        toast({ title: 'Bitcoin Registration', description: 'Bitcoin payments are registered through the cross-chain bridge. Please use the Bridge page for Bitcoin transactions.', status: 'info' });
        return;
      }
    
      const id = generatedId || generateId();
      const microStx = Math.round(Number(amount) * 1_000_000);
      
      console.log('Registering payment on-chain...');
      console.log('Payment ID:', id);
      console.log('Amount:', amount, 'STX');
      console.log('Contract:', CONTRACT_ADDRESS, CONTRACT_NAME);
      console.log('Function: create-payment');
      
      await openContractCall({
        network: stacksNetwork,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'create-payment',
        functionArgs: [
          bufferCVFromString(id), 
          principalCV(MERCHANT_ADDRESS || 'ST000000000000000000002AMW42H'), 
          uintCV(microStx)
        ],
        onFinish: (result: any) => {
          console.log('Contract call completed:', result);
          setGeneratedId(id);
          try { (window as any).__stats?.addVolume?.(Number(amount)); } catch {}
          toast({ 
            title: 'Payment registered on-chain', 
            description: `Payment ${id} registered successfully`,
            status: 'success' 
          });
        },
        onCancel: () => {
          console.log('Contract call cancelled by user');
          toast({ title: 'Registration cancelled', status: 'info' });
        },
      } as any);
    } catch (e: any) {
      console.error('Contract call error:', e);
      const errorMsg = e?.message || 'Unknown error';
      setError(errorMsg);
      toast({ title: 'On-chain register failed', description: errorMsg, status: 'error' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Box 
      overflowX="hidden" 
      px={{ base: 6, md: 8 }}
      py={{ base: 8, md: 10 }}
      bg="rgba(30, 30, 30, 0.95)"
      backdropFilter="blur(20px)"
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="rgba(0, 212, 255, 0.3)"
      shadow="0 25px 80px rgba(0, 0, 0, 0.6)"
      _hover={{
        borderColor: 'rgba(0, 212, 255, 0.5)',
        boxShadow: '0 30px 100px rgba(0, 212, 255, 0.25)',
        transform: 'translateY(-2px)'
      }}
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '3xl',
        padding: '1px',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 107, 53, 0.3))',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'xor',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
      }}
    >
      <VStack gap={{ base: 4, md: 6 }} align="stretch">
        {/* Input Section */}
        <VStack gap={{ base: 3, md: 4 }} align="stretch">
        {/* Payment Type Selector */}
        <Box>
          <Text mb={3} fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="#ffffff">
            💳 Payment Type
          </Text>
          <HStack gap={4} justify="center">
            <Button
              colorScheme={paymentType === 'STX' ? 'blue' : 'gray'}
              variant={paymentType === 'STX' ? 'solid' : 'outline'}
              onClick={() => setPaymentType('STX')}
              size={{ base: "md", md: "lg" }}
              fontWeight="semibold"
              px={6}
              py={3}
            >
              🟠 STX (Stacks)
            </Button>
            <Button
              colorScheme={paymentType === 'BTC' ? 'orange' : 'gray'}
              variant={paymentType === 'BTC' ? 'solid' : 'outline'}
              onClick={() => setPaymentType('BTC')}
              size={{ base: "md", md: "lg" }}
              fontWeight="semibold"
              px={6}
              py={3}
            >
              🟡 BTC (Bitcoin)
            </Button>
          </HStack>
        </Box>

        <Box title={`Enter the amount in ${paymentType} for this payment`}>
          <Text mb={3} fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">
            Amount ({paymentType}) *
          </Text>
          <Input
            placeholder={paymentType === 'STX' ? "e.g. 10.5" : "e.g. 0.001"}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onBlur={() => setTouched(true)}
            inputMode="decimal"
            data-invalid={amountInvalid}
            bg="white"
            borderColor="gray.300"
            borderWidth="2px"
            size={{ base: "md", md: "lg" }}
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
          />
          {amountInvalid && <Text color="red.500" fontSize="md" mt={2} fontWeight="medium">Enter a valid positive amount.</Text>}
          {paymentType === 'BTC' && !btcConnected && (
            <HStack gap={2} mt={2}>
              <Text fontSize="sm" color="orange.600">
                Connect Bitcoin wallet to enable BTC payments
              </Text>
              <Button size="sm" colorScheme="orange" onClick={connectBTC} variant="outline">
                Connect Bitcoin Wallet
              </Button>
            </HStack>
          )}
          {paymentType === 'BTC' && btcConnected && (
            <Text fontSize="sm" color="green.600" mt={2}>
              ✅ Bitcoin wallet connected: {btcAddress?.slice(0, 8)}... ({btcBalance} BTC)
            </Text>
          )}
        </Box>

        <Box title="Add a description to help identify this payment">
          <Text mb={3} fontSize="lg" fontWeight="semibold" color="gray.700">
            Description
          </Text>
          <Textarea 
            placeholder="What is this payment for?" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            bg="white"
            borderColor="gray.300"
            borderWidth="2px"
            size={{ base: "md", md: "lg" }}
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
          />
        </Box>
      </VStack>

      {/* Error Display */}
      {error && (
        <Box 
          bg="red.50" 
          borderColor="red.200" 
          borderWidth="2px" 
          borderRadius="lg" 
          p={4}
          mb={4}
        >
          <Text color="red.700" fontWeight="semibold" mb={2}>
            ⚠️ Error
          </Text>
          <Text color="red.600" fontSize="sm">
            {error}
          </Text>
        </Box>
      )}

          {/* Action Buttons */}
          <VStack gap={4}>
            <VStack gap={3} w="100%">
              <HStack gap={3} wrap="wrap" justify="center" w="100%">
                <Button 
                  bg="linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)"
                  color="white"
                  border="none"
                  borderRadius="xl"
                  fontWeight="semibold"
                  px={{ base: 8, md: 10 }}
                  py={{ base: 4, md: 6 }}
                  fontSize={{ base: "md", md: "lg" }}
                  w={{ base: "100%", sm: "auto" }}
                  onClick={onGenerate} 
                  loading={isGenerating}
                  loadingText="Generating..."
                  title="Generate a shareable payment link"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
                    bg: 'linear-gradient(135deg, #0099cc 0%, #0077aa 100%)'
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)'
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  boxShadow="0 8px 25px rgba(0, 212, 255, 0.3)"
                >
                  🔗 Generate Link
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onCopy} 
                  disabled={!link}
                  size={{ base: "md", md: "lg" }}
                  title="Copy the payment link to clipboard"
                  fontWeight="semibold"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 4, md: 6 }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderWidth="2px"
                  borderColor="blue.300"
                  color="blue.600"
                  _hover={{ bg: "blue.50", borderColor: "blue.400" }}
                  w={{ base: "100%", sm: "auto" }}
                >
                  📋 Copy Link
                </Button>
              </HStack>

              <HStack gap={3} wrap="wrap" justify="center" w="100%">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('Register On-Chain button clicked');
                    onRegisterOnChain();
                  }} 
                  disabled={!amount || isRegistering}
                  loading={isRegistering}
                  loadingText="Registering..."
                  size={{ base: "md", md: "lg" }}
                  title="Register this payment on the blockchain"
                  fontWeight="semibold"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 4, md: 6 }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderWidth="2px"
                  borderColor="purple.300"
                  color="purple.600"
                  _hover={{ bg: "purple.50", borderColor: "purple.400" }}
                  w={{ base: "100%", sm: "auto" }}
                >
                  ⛓️ Register On-Chain
                </Button>
              </HStack>
            </VStack>
          </VStack>

      {/* Loading State */}
      {isGenerating && (
        <Box bg="blue.50" borderColor="blue.200" borderWidth="2px" borderRadius="xl" p={6}>
          <HStack gap={4}>
            <Skeleton height="24px" width="24px" borderRadius="full" />
            <Text color="blue.600" fontSize="lg" fontWeight="semibold">Generating your payment link...</Text>
          </HStack>
        </Box>
      )}

      {/* Generated Link */}
        {link && (
        <Box bg="green.50" borderColor="green.400" borderWidth="2px" borderRadius="xl" p={6} shadow="lg">
          <VStack gap={6}>
            <HStack gap={3}>
              <Text fontSize="lg" color="green.600" fontWeight="bold">
                ✅ Payment Link Generated
              </Text>
              {copied && <Badge colorScheme="green" fontSize="md" px={3} py={1}>Copied!</Badge>}
            </HStack>
            
            <Box p={4} bg="white" borderRadius="lg" w="100%" borderWidth="1px" borderColor="gray.200">
              <Text fontSize="md" color="gray.700" wordBreak="break-all" fontFamily="mono" fontWeight="medium">
                {link}
              </Text>
            </Box>
            
            <VStack gap={3}>
              <Text fontSize="lg" color="gray.600" textAlign="center" fontWeight="semibold">
                Scan QR code to pay
              </Text>
              <Box p={4} bg="white" borderRadius="lg" shadow="md">
                <QRCodeSVG value={link} size={180} bgColor="#FFFFFF" fgColor="#000000" />
              </Box>
            </VStack>
          </VStack>
            </Box>
        )}
    </VStack>
    </Box>
  );
}

