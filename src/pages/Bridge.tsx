import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Input, Badge, Heading } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { UniformCard } from '../components/UniformCard';
import { UniformButton } from '../components/UniformButton';
import { UniformInput } from '../components/UniformInput';

interface BridgeEstimate {
  fromAmount: number;
  toAmount: number;
  fee: number;
  estimatedTime: string;
}

interface BridgeTransaction {
  id: string;
  fromAsset: string;
  toAsset: string;
  amount: number;
  recipientAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
}

const Bridge: React.FC = () => {
  const { isAuthenticated, address } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress } = useBitcoinWallet();
  const { toast } = useToast();

  // Bridge state
  const [fromAsset, setFromAsset] = useState('STX');
  const [toAsset, setToAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bridgeProgress, setBridgeProgress] = useState(0);

  const isWalletConnected = isAuthenticated || btcConnected;

  const handleEstimate = async () => {
    if (!amount || !recipientAddress) {
      toast({ title: 'Error', status: 'error', description: 'Please fill in all fields' });
      return;
    }

    setIsEstimating(true);
    setError(null);

    try {
      // Simulate estimation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fromAmount = parseFloat(amount);
      const fee = fromAmount * 0.01; // 1% fee
      const toAmount = fromAmount - fee;
      
      setEstimate({
        fromAmount,
        toAmount,
        fee,
        estimatedTime: '5-10 minutes'
      });
    } catch (err) {
      setError('Failed to get estimate');
      toast({ title: 'Error', status: 'error', description: 'Failed to get bridge estimate' });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleBridge = async () => {
    if (!amount || !recipientAddress || !estimate) {
      toast({ title: 'Error', status: 'error', description: 'Please get an estimate first' });
      return;
    }

    if (!isWalletConnected) {
      toast({ title: 'Error', status: 'error', description: 'Please connect your wallet first' });
      return;
    }

    setIsBridging(true);
    setError(null);
    setBridgeProgress(0);

    try {
      const transactionId = `bridge-${Date.now()}`;
      const newTransaction: BridgeTransaction = {
        id: transactionId,
        fromAsset,
        toAsset,
        amount: parseFloat(amount),
        recipientAddress,
        status: 'processing',
        timestamp: Date.now()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Simulate bridge transaction with progress
      const progressInterval = setInterval(() => {
        setBridgeProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Simulate transaction completion
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(progressInterval);
      setBridgeProgress(100);

      // Update transaction status
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'completed', txHash: `bridge-tx-${Date.now()}` }
          : tx
      ));

      toast({ 
        title: 'Bridge Successful', 
        status: 'success', 
        description: `${fromAsset} bridged to ${toAsset} successfully!` 
      });
      setEstimate(null);
      setAmount('');
    } catch (err) {
      setError('Bridge transaction failed');
      toast({ title: 'Error', status: 'error', description: 'Bridge transaction failed' });
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <VStack gap={6} align="stretch" p={6}>
      <VStack gap={2} align="center" textAlign="center">
        <Heading size="lg" color="#ffffff">
          Cross-Chain Bridge
        </Heading>
        <Text color="#9ca3af" maxW="md">
          Bridge assets between Stacks and Bitcoin networks
        </Text>
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
              Connect your Stacks or Bitcoin wallet to use the bridge.
            </Text>
            <UniformButton variant="primary" size="md" onClick={() => window.location.href = '/'}>
              Connect Wallet
            </UniformButton>
          </VStack>
        </UniformCard>
      )}

      {/* Main Bridge Interface */}
      {isWalletConnected && (
        <>
          <UniformCard p={6}>
            <VStack gap={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color="#ffffff">
                Bridge Assets
              </Text>

              {/* Asset Selection */}
              <VStack gap={4} align="stretch">
                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">From Asset</Text>
                  <HStack gap={2}>
                    <UniformButton
                      variant={fromAsset === 'STX' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setFromAsset('STX')}
                    >
                      STX (Stacks)
                    </UniformButton>
                    <UniformButton
                      variant={fromAsset === 'BTC' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setFromAsset('BTC')}
                    >
                      BTC (Bitcoin)
                    </UniformButton>
                  </HStack>
                </VStack>

                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">To Asset</Text>
                  <HStack gap={2}>
                    <UniformButton
                      variant={toAsset === 'BTC' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setToAsset('BTC')}
                    >
                      BTC (Bitcoin)
                    </UniformButton>
                    <UniformButton
                      variant={toAsset === 'STX' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setToAsset('STX')}
                    >
                      STX (Stacks)
                    </UniformButton>
                  </HStack>
                </VStack>
              </VStack>

              {/* Amount Input */}
              <VStack gap={2} align="stretch">
                <Text fontSize="sm" color="#9ca3af">Amount</Text>
                <UniformInput
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </VStack>

              {/* Recipient Address */}
              <VStack gap={2} align="stretch">
                <Text fontSize="sm" color="#9ca3af">Recipient Address</Text>
                <UniformInput
                  placeholder="Enter recipient address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </VStack>

              {/* Estimate Button */}
              <UniformButton
                variant="secondary"
                onClick={handleEstimate}
                loading={isEstimating}
                disabled={!amount || !recipientAddress}
              >
                {isEstimating ? 'Getting Estimate...' : 'Get Estimate'}
              </UniformButton>

              {/* Estimate Display */}
              {estimate && (
                <Box p={4} bg="rgba(0, 0, 0, 0.4)" borderRadius="md" border="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
                  <VStack gap={2} align="stretch">
                    <HStack justify="space-between">
                      <Text color="#9ca3af">You send:</Text>
                      <Text color="#ffffff">{estimate.fromAmount} {fromAsset}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="#9ca3af">Fee:</Text>
                      <Text color="#ff6b6b">{estimate.fee} {fromAsset}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="#9ca3af">You receive:</Text>
                      <Text color="#10b981">{estimate.toAmount} {toAsset}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="#9ca3af">Estimated time:</Text>
                      <Text color="#ffffff">{estimate.estimatedTime}</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Bridge Button */}
              <UniformButton
                variant="primary"
                onClick={handleBridge}
                loading={isBridging}
                disabled={!estimate || isBridging}
              >
                {isBridging ? 'Bridging...' : 'Bridge Assets'}
              </UniformButton>

              {/* Progress Bar */}
              {isBridging && (
                <Box w="full" h="2" bg="rgba(255, 255, 255, 0.1)" borderRadius="full" overflow="hidden">
                  <Box
                    h="full"
                    bg="#10b981"
                    borderRadius="full"
                    transition="width 0.3s ease"
                    width={`${bridgeProgress}%`}
                  />
                </Box>
              )}

              {/* Error Display */}
              {error && (
                <Box p={3} bg="rgba(255, 107, 107, 0.1)" borderRadius="md" border="1px solid" borderColor="rgba(255, 107, 107, 0.3)">
                  <Text color="#ff6b6b" fontSize="sm">{error}</Text>
                </Box>
              )}
            </VStack>
          </UniformCard>

          {/* Transaction History */}
          {transactions.length > 0 && (
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold" color="#ffffff">
                  Bridge History
                </Text>
                
                <VStack gap={3} align="stretch">
                  {transactions.map((tx) => (
                    <Box
                      key={tx.id}
                      p={4}
                      bg="rgba(0, 0, 0, 0.4)"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                    >
                      <HStack justify="space-between" align="start">
                        <VStack gap={1} align="start">
                          <HStack gap={2}>
                            <Text color="#ffffff" fontWeight="medium">
                              {tx.amount} {tx.fromAsset} → {tx.toAsset}
                            </Text>
                            <Badge
                              colorScheme={
                                tx.status === 'completed' ? 'green' :
                                tx.status === 'failed' ? 'red' :
                                tx.status === 'processing' ? 'blue' : 'gray'
                              }
                              variant="subtle"
                            >
                              {tx.status}
                            </Badge>
                          </HStack>
                          <Text color="#9ca3af" fontSize="sm">
                            To: {tx.recipientAddress.slice(0, 8)}...{tx.recipientAddress.slice(-8)}
                          </Text>
                          {tx.txHash && (
                            <Text color="#9ca3af" fontSize="sm">
                              TX: {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                            </Text>
                          )}
                        </VStack>
                        <Text color="#9ca3af" fontSize="sm">
                          {new Date(tx.timestamp).toLocaleString()}
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </UniformCard>
          )}
        </>
      )}
    </VStack>
  );
};

export default Bridge;