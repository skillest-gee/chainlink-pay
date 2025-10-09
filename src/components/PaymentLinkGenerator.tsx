import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Input, Textarea, Select, Badge } from '@chakra-ui/react';
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
  const { isAuthenticated } = useStacksWallet();
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
        merchantAddress: isAuthenticated ? 'connected' : 'local'
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
      toast({ title: 'Wallet Required', status: 'warning', description: 'Please connect your wallet first' });
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Simulate on-chain registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: 'Success', status: 'success', description: 'Payment registered on-chain successfully!' });
    } catch (err) {
      setError('Failed to register payment on-chain');
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
    if (generatedId) {
      const url = `${window.location.origin}/pay/${generatedId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Copied', status: 'info', description: 'Payment link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paymentUrl = generatedId ? `${window.location.origin}/pay/${generatedId}` : '';

  return (
    <VStack gap={6} align="stretch">
      {/* Payment Type Selection */}
      <VStack gap={3} align="stretch">
        <Text fontSize="sm" fontWeight="medium" color="#ffffff">
          Payment Type
        </Text>
        <Select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as 'STX' | 'BTC')}
          bg="rgba(255, 255, 255, 0.05)"
          borderColor="rgba(255, 255, 255, 0.1)"
          color="#ffffff"
          _focus={{ borderColor: '#3b82f6' }}
        >
          <option value="STX" style={{ backgroundColor: '#000000', color: '#ffffff' }}>STX (Stacks)</option>
          <option value="BTC" style={{ backgroundColor: '#000000', color: '#ffffff' }}>BTC (Bitcoin)</option>
        </Select>
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
    </VStack>
  );
}