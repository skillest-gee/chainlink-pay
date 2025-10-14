import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Badge, Heading } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { UniformCard } from '../components/UniformCard';
import { UniformButton } from '../components/UniformButton';
import { UniformInput } from '../components/UniformInput';
import { validateTransactionParams } from '../utils/validation';
import { CONTRACT_DEPLOYED, verifyContractDeployment } from '../config/stacksConfig';
import { bridgeService, BridgeChain, BridgeAsset, BridgeRoute, BridgeTransaction, BridgeEstimate } from '../services/bridgeService';
import { routeContractCall } from '../utils/walletProviderRouter';

const Bridge: React.FC = () => {
  const { isAuthenticated, address, userSession, walletProvider, detectWalletProvider, disconnect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress } = useBitcoinWallet();
  const { toast } = useToast();
  
  // Bridge state
  const [chains, setChains] = useState<BridgeChain[]>([]);
  const [fromChain, setFromChain] = useState<BridgeChain | null>(null);
  const [toChain, setToChain] = useState<BridgeChain | null>(null);
  const [fromAsset, setFromAsset] = useState<BridgeAsset | null>(null);
  const [toAsset, setToAsset] = useState<BridgeAsset | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<BridgeTransaction | null>(null);

  // Initialize bridge service
  useEffect(() => {
    const availableChains = bridgeService.getChains();
    setChains(availableChains);
    
    // Set default chains based on connected wallet
    const stacksChain = availableChains.find(chain => chain.id === 'stacks');
    const bitcoinChain = availableChains.find(chain => chain.id === 'bitcoin');
    
    if (stacksChain && bitcoinChain) {
      // Always set Stacks as the source chain since that's what the wallet is connected to
      setFromChain(stacksChain);
      setFromAsset(stacksChain.supportedAssets[0]); // STX
      setToChain(bitcoinChain);
      setToAsset(bitcoinChain.supportedAssets[0]); // BTC
    }
    
    // Load existing transactions
    setTransactions(bridgeService.getTransactions());
  }, []);

  // Update source chain/asset based on connected wallet
  useEffect(() => {
    if (isAuthenticated && fromChain?.id !== 'stacks') {
      const stacksChain = chains.find(chain => chain.id === 'stacks');
      if (stacksChain) {
        setFromChain(stacksChain);
        setFromAsset(stacksChain.supportedAssets[0]); // STX
      }
    }
  }, [isAuthenticated, chains, fromChain]);

  // Auto-estimate when parameters change
  useEffect(() => {
    if (fromChain && toChain && fromAsset && toAsset && amount && parseFloat(amount) > 0) {
      handleEstimate();
    }
  }, [fromChain, toChain, fromAsset, toAsset, amount]);

  const handleEstimate = async () => {
    if (!fromChain || !toChain || !fromAsset || !toAsset || !amount) return;
    
    setIsEstimating(true);
    try {
      const estimateResult = await bridgeService.getEstimate(
        fromChain.id,
        toChain.id,
        fromAsset.id,
        toAsset.id,
        parseFloat(amount)
      );
      
      if (estimateResult) {
        setEstimate(estimateResult);
      } else {
        setEstimate(null);
        toast({
          title: 'Estimate Failed',
          status: 'error',
          description: 'Unable to get bridge estimate. Please check your parameters.',
        });
      }
    } catch (error: any) {
      setEstimate(null);
      toast({
        title: 'Estimate Error',
        status: 'error',
        description: error.message || 'Failed to get bridge estimate',
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleBridge = async () => {
    if (!fromChain || !toChain || !fromAsset || !toAsset || !amount || !recipientAddress || !estimate) {
      toast({
        title: 'Missing Information',
        status: 'error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (!isWalletConnected) {
        toast({ 
        title: 'Wallet Not Connected',
          status: 'error', 
        description: 'Please connect your wallet to bridge assets',
        });
        return;
      }

    setIsBridging(true);
    try {
      const route: BridgeRoute = {
        fromChain,
        toChain,
        fromAsset,
        toAsset,
        estimatedTime: estimate.estimatedTime,
        fee: estimate.fee,
        minAmount: estimate.minAmount,
        maxAmount: estimate.maxAmount,
        rate: estimate.rate
      };

      const transaction = await bridgeService.executeBridge(
        route,
        parseFloat(amount),
        recipientAddress,
        userSession,
        walletProvider
      );

      setTransactions(bridgeService.getTransactions());
      setSelectedTransaction(transaction);

            toast({ 
        title: 'Bridge Initiated',
              status: 'success', 
        description: `Bridge transaction started. ID: ${transaction.id}`,
      });

      // Clear form
      setAmount('');
      setRecipientAddress('');
      setEstimate(null);

    } catch (error: any) {
        toast({ 
        title: 'Bridge Failed',
        status: 'error',
        description: error.message || 'Failed to initiate bridge transaction',
      });
    } finally {
      setIsBridging(false);
    }
  };

  const handleChainChange = (chainId: string, type: 'from' | 'to') => {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return;

    if (type === 'from') {
      // Only allow Stacks as source since that's what the wallet is connected to
      if (chain.id === 'stacks') {
        setFromChain(chain);
        setFromAsset(chain.supportedAssets[0]); // STX
      } else {
        toast({ 
          title: 'Invalid Source Chain',
          status: 'warning',
          description: 'You can only bridge from Stacks (STX) since that\'s your connected wallet.',
        });
      }
    } else {
      setToChain(chain);
      setToAsset(chain.supportedAssets[0]);
    }
  };

  const handleAssetChange = (assetId: string, type: 'from' | 'to') => {
    if (!fromChain || !toChain) return;

    const asset = (type === 'from' ? fromChain : toChain).supportedAssets.find(a => a.id === assetId);
    if (!asset) return;

    if (type === 'from') {
      // Only allow STX as source asset since that's what the wallet holds
      if (asset.id === 'stx') {
        setFromAsset(asset);
      } else {
        toast({ 
          title: 'Invalid Source Asset',
          status: 'warning',
          description: 'You can only bridge STX since that\'s what your wallet contains.',
        });
      }
    } else {
      setToAsset(asset);
    }
  };

  const swapChains = () => {
    // Disable swap functionality since source is always Stacks/STX
    toast({
      title: 'Swap Disabled',
      status: 'info',
      description: 'Source chain is always Stacks (STX) based on your connected wallet.',
    });
  };

  const isWalletConnected = isAuthenticated || btcConnected;

  return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Box maxW="7xl" mx="auto" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={4} textAlign="center">
            <Heading size={{ base: "lg", md: "xl" }} color="#ffffff">
            🌉 Cross-Chain Bridge
          </Heading>
            <Text color="#9ca3af" maxW="3xl" fontSize={{ base: "md", md: "lg" }} textAlign="center">
              Bridge your STX from Stacks testnet to other blockchains. 
              Your connected wallet determines the source chain and asset.
          </Text>
            
            {/* Testnet Warning */}
            <Box
              bg="rgba(255, 193, 7, 0.1)"
              border="1px solid rgba(255, 193, 7, 0.3)"
              borderRadius="lg"
          p={4}
          maxW="2xl"
        >
          <VStack gap={2}>
                <Text fontSize="sm" fontWeight="medium" color="#ffc107">
                  ⚠️ Testnet Environment
                </Text>
            <Text fontSize="xs" color="#9ca3af" textAlign="center">
                  You are bridging on testnet. All transactions use test tokens and have no real value.
            </Text>
              </VStack>
            </Box>
            
            {/* Supported Chains */}
            <HStack gap={3} justify="center" wrap="wrap">
              {chains.map(chain => (
                <Badge key={chain.id} colorScheme="blue" variant="solid" px={3} py={1} borderRadius="full">
                  {chain.icon} {chain.name}
              </Badge>
              ))}
            </HStack>
      </VStack>

          {/* Main Bridge Interface */}
          <HStack gap={8} align="start" wrap="wrap">
            {/* Bridge Form */}
            <Box flex="1" minW="400px">
        <UniformCard p={6}>
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Bridge Assets
                    </Heading>
                    <Badge colorScheme={isWalletConnected ? 'green' : 'red'} fontSize="sm">
                      {isWalletConnected ? '🔗 Wallet Connected' : '🔌 Wallet Not Connected'}
                    </Badge>
                  </HStack>

                  {/* From Chain & Asset - Locked to Stacks/STX */}
                  <VStack gap={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                        From (Connected Wallet)
                      </Text>
                      <Badge colorScheme="green" fontSize="xs">
                        🔒 Locked
                      </Badge>
                    </HStack>
                    <HStack gap={3}>
                      <Box
                        bg="rgba(255, 255, 255, 0.05)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        borderRadius="8px"
                        padding="8px 12px"
                        flex="1"
                        opacity={0.7}
                      >
                        <Text color="#ffffff" fontSize="14px">
                          🟦 Stacks (Testnet)
            </Text>
                      </Box>
                      <Box
                        bg="rgba(255, 255, 255, 0.05)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        borderRadius="8px"
                        padding="8px 12px"
                        flex="1"
                        opacity={0.7}
                      >
                        <Text color="#ffffff" fontSize="14px">
                          🟦 STX
            </Text>
                      </Box>
                    </HStack>
                    <Text fontSize="xs" color="#9ca3af">
                      Source is locked to your connected Stacks wallet
            </Text>
          </VStack>

                  {/* Swap Button - Disabled */}
                  <HStack justify="center">
                    <Button
                      onClick={swapChains}
                      variant="outline"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      color="#9ca3af"
                      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                      size="sm"
                      disabled
                    >
                      🔄 Swap (Disabled)
                    </Button>
                  </HStack>

                  {/* To Chain & Asset */}
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                      To
              </Text>
                    <HStack gap={3}>
                      <select
                        value={toChain?.id || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChainChange(e.target.value, 'to')}
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
                        {chains.map(chain => (
                          <option key={chain.id} value={chain.id} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {chain.icon} {chain.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={toAsset?.id || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleAssetChange(e.target.value, 'to')}
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
                        {toChain?.supportedAssets.map(asset => (
                          <option key={asset.id} value={asset.id} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {asset.icon} {asset.symbol}
                          </option>
                        ))}
                      </select>
                  </HStack>
                </VStack>

                {/* Amount Input */}
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                      Amount
                    </Text>
                  <UniformInput
                    type="number"
                      placeholder="0.00"
                value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                      variant="default"
                />
                    {estimate && (
                      <Text fontSize="xs" color="#9ca3af">
                        Min: {estimate.minAmount} {fromAsset?.symbol} | Max: {estimate.maxAmount} {fromAsset?.symbol}
                      </Text>
                    )}
                </VStack>

                {/* Recipient Address */}
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                      Recipient Address
                    </Text>
                  <UniformInput
                    placeholder="Enter recipient address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                      variant="default"
                  />
                </VStack>

                  {/* Bridge Estimate */}
                  {estimate && (
                    <Box
                      bg="rgba(59, 130, 246, 0.1)"
                      border="1px solid rgba(59, 130, 246, 0.2)"
                      borderRadius="lg"
                      p={4}
                    >
                  <VStack gap={2} align="stretch">
                        <Text fontSize="sm" fontWeight="medium" color="#3b82f6">
                          Bridge Estimate
                        </Text>
                    <HStack justify="space-between">
                          <Text fontSize="sm" color="#9ca3af">You send:</Text>
                          <Text fontSize="sm" color="#ffffff">
                            {amount} {fromAsset?.symbol}
                          </Text>
                    </HStack>
                    <HStack justify="space-between">
                          <Text fontSize="sm" color="#9ca3af">You receive:</Text>
                          <Text fontSize="sm" color="#ffffff">
                            {(parseFloat(amount) * estimate.rate).toFixed(6)} {toAsset?.symbol}
                          </Text>
                    </HStack>
                    <HStack justify="space-between">
                          <Text fontSize="sm" color="#9ca3af">Bridge fee:</Text>
                          <Text fontSize="sm" color="#ffffff">
                            {estimate.fee} {fromAsset?.symbol}
                          </Text>
                    </HStack>
                    <HStack justify="space-between">
                          <Text fontSize="sm" color="#9ca3af">Estimated time:</Text>
                          <Text fontSize="sm" color="#ffffff">
                            {estimate.estimatedTime}
                          </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Bridge Button */}
                    <UniformButton
                    onClick={handleBridge}
                    isLoading={isBridging}
                    loadingText="Bridging..."
                    disabled={!isWalletConnected || !estimate || isEstimating}
                      variant="primary"
                    size="lg"
                    >
                    {isEstimating ? 'Estimating...' : 'Bridge Assets'}
                    </UniformButton>
              </VStack>
            </UniformCard>
            </Box>

          {/* Transaction History */}
            <Box flex="1" minW="400px">
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                  Bridge History
                    </Heading>
                    <Badge colorScheme="blue" fontSize="sm">
                      {transactions.length} Transactions
                    </Badge>
                  </HStack>

                  {transactions.length === 0 ? (
                    <Text color="#9ca3af" textAlign="center" py={8}>
                      No bridge transactions yet
                      </Text>
                  ) : (
                    <VStack gap={3} align="stretch" maxH="400px" overflowY="auto">
                      {transactions.map(transaction => (
                        <Box
                          key={transaction.id}
                          bg="rgba(255, 255, 255, 0.05)"
                          border="1px solid rgba(255, 255, 255, 0.1)"
                          borderRadius="lg"
                      p={4}
                          cursor="pointer"
                          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <VStack gap={2} align="stretch">
                            <HStack justify="space-between" align="center">
                          <HStack gap={2}>
                                <Text fontSize="sm" color="#ffffff">
                                  {transaction.route.fromAsset.icon} {transaction.route.fromAsset.symbol}
                                </Text>
                                <Text fontSize="sm" color="#9ca3af">→</Text>
                                <Text fontSize="sm" color="#ffffff">
                                  {transaction.route.toAsset.icon} {transaction.route.toAsset.symbol}
                  </Text>
                              </HStack>
                          <Badge 
                            colorScheme={
                                  transaction.status === 'completed' ? 'green' :
                                  transaction.status === 'processing' ? 'blue' :
                                  transaction.status === 'failed' ? 'red' : 'yellow'
                                }
                                fontSize="xs"
                              >
                                {transaction.status}
                          </Badge>
                          </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="#9ca3af">
                                {transaction.amount} {transaction.route.fromAsset.symbol}
                          </Text>
                              <Text fontSize="xs" color="#9ca3af">
                                {new Date(transaction.timestamp).toLocaleString()}
                        </Text>
                        </HStack>
                          </VStack>
                      </Box>
                    ))}
                  </VStack>
                  )}
                </VStack>
              </UniformCard>
            </Box>
          </HStack>

          {/* Transaction Details Modal */}
          {selectedTransaction && (
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="md" color="#ffffff">
                    Transaction Details
                  </Heading>
                  <Button
                    onClick={() => setSelectedTransaction(null)}
                    variant="outline"
                    size="sm"
                    color="#ffffff"
                    borderColor="rgba(255, 255, 255, 0.2)"
                  >
                    ✕
                  </Button>
                </HStack>

                <VStack gap={3} align="stretch">
                  <HStack justify="space-between">
                    <Text color="#9ca3af">Transaction ID:</Text>
                    <Text color="#ffffff" fontFamily="mono" fontSize="sm">
                      {selectedTransaction.id}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="#9ca3af">Status:</Text>
                    <Badge
                      colorScheme={
                        selectedTransaction.status === 'completed' ? 'green' :
                        selectedTransaction.status === 'processing' ? 'blue' :
                        selectedTransaction.status === 'failed' ? 'red' : 'yellow'
                      }
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="#9ca3af">Amount:</Text>
                    <Text color="#ffffff">
                      {selectedTransaction.amount} {selectedTransaction.route.fromAsset.symbol}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="#9ca3af">Recipient:</Text>
                    <Text color="#ffffff" fontFamily="mono" fontSize="sm">
                      {selectedTransaction.recipientAddress}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="#9ca3af">Estimated Time:</Text>
                    <Text color="#ffffff">
                      {selectedTransaction.route.estimatedTime}
                    </Text>
                  </HStack>
                  {selectedTransaction.txHash && (
                    <HStack justify="space-between">
                      <Text color="#9ca3af">Transaction Hash:</Text>
                      <Text color="#3b82f6" fontFamily="mono" fontSize="sm" cursor="pointer">
                        {selectedTransaction.txHash.substring(0, 20)}...
                      </Text>
                    </HStack>
                  )}
                  {selectedTransaction.error && (
                    <Box
                      bg="rgba(255, 107, 107, 0.1)"
                      border="1px solid rgba(255, 107, 107, 0.3)"
                      borderRadius="md"
                      p={3}
                    >
                      <Text color="#ff6b6b" fontSize="sm">
                        Error: {selectedTransaction.error}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </VStack>
            </UniformCard>
      )}
      </VStack>
      </Box>
    </Box>
  );
};

export default Bridge;