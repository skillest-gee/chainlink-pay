import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, Input, Textarea, Text, Skeleton, Badge, VStack } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { openSTXTransfer } from '@stacks/connect';
import { stacksNetwork, MERCHANT_ADDRESS, CONTRACT_ADDRESS, CONTRACT_NAME } from '../config/stacksConfig';
import { openContractCall } from '@stacks/connect';
import { bufferCVFromString, principalCV, uintCV } from '@stacks/transactions';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { paymentStorage, PaymentLink } from '../services/paymentStorage';

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
  const [copied, setCopied] = useState(false);
  const [paymentType, setPaymentType] = useState<'STX' | 'BTC'>('STX');
  const { enabled: demoEnabled, preset } = useDemo();

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

  const onGenerate = () => {
    setTouched(true);
    if (!isValidAmount(amount)) {
      toast({ title: 'Invalid amount', description: 'Enter a positive number.', status: 'error' });
      return;
    }

    if (paymentType === 'BTC' && !btcConnected) {
      toast({ title: 'Bitcoin wallet required', description: 'Please connect your Bitcoin wallet first', status: 'error' });
      return;
    }

    if (!MERCHANT_ADDRESS) {
      toast({ title: 'Merchant address required', description: 'Set REACT_APP_MERCHANT_ADDRESS in .env', status: 'error' });
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

  useEffect(() => {
    if (!demoEnabled) return;
    if (preset === 'simple-payment') {
      setAmount('10');
      setDescription('Demo coffee payment');
    }
  }, [demoEnabled, preset]);

  const onPay = async () => {
    console.log('Pay with Wallet button clicked');
    console.log('Current state:', { isAuthenticated, amount, MERCHANT_ADDRESS, CONTRACT_ADDRESS, paymentType, btcConnected });
    setTouched(true);
    
    if (paymentType === 'STX') {
      if (!isAuthenticated) {
        console.log('STX wallet not authenticated');
        toast({ title: 'Wallet required', description: 'Please connect your Stacks wallet first', status: 'error' });
        return;
      }
      
      if (!isValidAmount(amount)) {
        console.log('Invalid amount:', amount);
        toast({ title: 'Invalid amount', description: 'Enter a positive number.', status: 'error' });
        return;
      }
      
      if (!MERCHANT_ADDRESS) {
        console.log('Missing merchant address');
        toast({ title: 'Missing merchant address', description: 'Set REACT_APP_MERCHANT_ADDRESS in .env', status: 'error' });
        return;
      }
      
      try {
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
      } catch (e: any) {
        console.error('STX transfer error:', e);
        toast({ title: 'Payment failed', description: e?.message || 'Could not initiate payment', status: 'error' });
      }
    } else if (paymentType === 'BTC') {
      if (!btcConnected) {
        console.log('Bitcoin wallet not connected');
        toast({ title: 'Bitcoin wallet required', description: 'Please connect your Bitcoin wallet first', status: 'error' });
        return;
      }
      
      if (!isValidAmount(amount)) {
        console.log('Invalid amount:', amount);
        toast({ title: 'Invalid amount', description: 'Enter a positive number.', status: 'error' });
        return;
      }
      
      if (!MERCHANT_ADDRESS) {
        console.log('Missing merchant address');
        toast({ title: 'Missing merchant address', description: 'Set REACT_APP_MERCHANT_ADDRESS in .env', status: 'error' });
        return;
      }
      
      try {
        console.log('Initiating Bitcoin transfer...');
        console.log('Amount:', amount, 'BTC');
        console.log('Merchant:', MERCHANT_ADDRESS);
        console.log('Description:', description);
        
        // For Bitcoin, we'll use the bridge functionality
        toast({ title: 'Bitcoin Payment', description: 'Bitcoin payments are processed through the cross-chain bridge. Please use the Bridge page for Bitcoin transactions.', status: 'info' });
      } catch (e: any) {
        console.error('Bitcoin transfer error:', e);
        toast({ title: 'Payment failed', description: e?.message || 'Could not initiate payment', status: 'error' });
      }
    }
  };

  const onRegisterOnChain = async () => {
    console.log('Register On-Chain button clicked');
    console.log('Current state:', { isAuthenticated, amount, CONTRACT_ADDRESS, CONTRACT_NAME, paymentType, btcConnected });
    
    if (paymentType === 'STX') {
      if (!isAuthenticated) {
        console.log('STX wallet not authenticated');
        toast({ title: 'Wallet required', description: 'Please connect your Stacks wallet first', status: 'error' });
        return;
      }
      
      if (!CONTRACT_ADDRESS) {
        console.log('Contract address not configured');
        toast({ title: 'Contract not configured', description: 'Set REACT_APP_CONTRACT_ADDRESS', status: 'error' });
        return;
      }
      
      if (!amount || !isValidAmount(amount)) {
        console.log('Invalid amount for registration:', amount);
        toast({ title: 'Invalid amount', description: 'Enter a valid amount to register', status: 'error' });
        return;
      }
    } else if (paymentType === 'BTC') {
      if (!btcConnected) {
        console.log('Bitcoin wallet not connected');
        toast({ title: 'Bitcoin wallet required', description: 'Please connect your Bitcoin wallet first', status: 'error' });
        return;
      }
      
      if (!amount || !isValidAmount(amount)) {
        console.log('Invalid amount for registration:', amount);
        toast({ title: 'Invalid amount', description: 'Enter a valid amount to register', status: 'error' });
        return;
      }
      
      // For Bitcoin, we'll use the bridge functionality
      toast({ title: 'Bitcoin Registration', description: 'Bitcoin payments are registered through the cross-chain bridge. Please use the Bridge page for Bitcoin transactions.', status: 'info' });
      return;
    }
    
    try {
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
      toast({ title: 'On-chain register failed', description: e?.message || 'Unknown error', status: 'error' });
    }
  };

  return (
    <Box overflowX="hidden" px={{ base: 2, md: 0 }}>
      <VStack gap={{ base: 4, md: 6 }} align="stretch">
        {/* Input Section */}
        <VStack gap={{ base: 3, md: 4 }} align="stretch">
        {/* Payment Type Selector */}
        <Box>
          <Text mb={3} fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">
            Payment Type
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

          {/* Action Buttons */}
          <VStack gap={4}>
            <VStack gap={3} w="100%">
              <HStack gap={3} wrap="wrap" justify="center" w="100%">
                <Button 
                  colorScheme="blue" 
                  onClick={onGenerate} 
                  loading={isGenerating}
                  size={{ base: "md", md: "lg" }}
                  title="Generate a shareable payment link"
                  fontWeight="semibold"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 4, md: 6 }}
                  fontSize={{ base: "sm", md: "md" }}
                  w={{ base: "100%", sm: "auto" }}
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
                  disabled={!amount}
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

