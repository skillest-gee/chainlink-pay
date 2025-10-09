import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Button, Input, Select, Badge, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription, ProgressBar, Divider, Code } from '@chakra-ui/react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBitcoinWallet } from '../hooks/useBitcoinWallet';
import { useToast } from '../hooks/useToast';
import { UniformButton } from '../components/UniformButton';
import { UniformInput } from '../components/UniformInput';
import { UniformCard } from '../components/UniformCard';
import { testWalletConnection, testBridgeFunctionality } from '../utils/walletTest';

interface BridgeTransaction {
  id: string;
  fromAsset: string;
  toAsset: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  timestamp: number;
}

interface BridgeEstimate {
  amount: number;
  fee: number;
  estimatedTime: string;
  route: string;
  slippage: number;
}

export default function Bridge() {
  const { isAuthenticated, address, connect } = useStacksWallet();
  const { isConnected: btcConnected, address: btcAddress, connect: connectBTC, balance: btcBalance } = useBitcoinWallet();
  const { toast } = useToast();
  
  // Form state
  const [fromAsset, setFromAsset] = useState('STX');
  const [toAsset, setToAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  
  // Bridge state
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(null);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bridgeProgress, setBridgeProgress] = useState(0);

  // Available assets for bridging
  const supportedAssets = [
    { value: 'STX', label: 'Stacks (STX)', icon: '🟦', balance: '0' },
    { value: 'BTC', label: 'Bitcoin (BTC)', icon: '🟠', balance: btcBalance ? btcBalance.toString() : '0' },
    { value: 'USDC', label: 'USD Coin (USDC)', icon: '💵', balance: '0' },
    { value: 'USDT', label: 'Tether (USDT)', icon: '💵', balance: '0' }
  ];

  // Bridge routes and networks
  const bridgeRoutes = [
    { from: 'STX', to: 'BTC', network: 'Stacks → Bitcoin', fee: '0.001', time: '5-10 min' },
    { from: 'BTC', to: 'STX', network: 'Bitcoin → Stacks', fee: '0.0001', time: '10-15 min' },
    { from: 'STX', to: 'USDC', network: 'Stacks → Ethereum', fee: '0.002', time: '3-5 min' },
    { from: 'USDC', to: 'STX', network: 'Ethereum → Stacks', fee: '0.001', time: '5-8 min' }
  ];

  useEffect(() => {
    // Auto-fill recipient address with connected wallet
    if (isAuthenticated && address) {
      setRecipientAddress(address);
    }
    if (btcConnected && btcAddress) {
      setRecipientAddress(btcAddress);
    }
  }, [isAuthenticated, address, btcConnected, btcAddress]);

  // Test wallet integration on component mount
  useEffect(() => {
    const runTests = async () => {
      console.log('=== BRIDGE PAGE WALLET INTEGRATION TEST ===');
      
      // Test wallet connections
      const walletTest = await testWalletConnection();
      console.log('Wallet connection test:', walletTest);
      
      // Test bridge functionality
      const bridgeTest = testBridgeFunctionality();
      console.log('Bridge functionality test:', bridgeTest);
      
      // Log current wallet states
      console.log('Current wallet states:');
      console.log('- Stacks wallet connected:', isAuthenticated);
      console.log('- Stacks address:', address);
      console.log('- Bitcoin wallet connected:', btcConnected);
      console.log('- Bitcoin address:', btcAddress);
      console.log('- Bitcoin balance:', btcBalance);
    };
    
    runTests();
  }, [isAuthenticated, address, btcConnected, btcAddress, btcBalance]);

  const handleEstimate = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsEstimating(true);
    setError(null);

    try {
      // Simulate fee estimation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockEstimate: BridgeEstimate = {
        amount: Number(amount),
        fee: Number(amount) * 0.001, // 0.1% fee
        estimatedTime: '5-10 minutes',
        route: `${fromAsset} → ${toAsset}`,
        slippage: 0.5
      };
      
      setEstimate(mockEstimate);
      toast('Fee estimation completed', 'success');
    } catch (err) {
      setError('Failed to estimate fees');
      toast('Fee estimation failed', 'error');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleBridge = async () => {
    if (!isAuthenticated && fromAsset === 'STX') {
      toast('Please connect your Stacks wallet first', 'error');
      connect();
      return;
    }

    if (!btcConnected && fromAsset === 'BTC') {
      toast('Please connect your Bitcoin wallet first', 'error');
      connectBTC();
      return;
    }

    if (!recipientAddress) {
      setError('Please enter recipient address');
      return;
    }
    
    setIsBridging(true);
    setError(null);
    setBridgeProgress(0);

    try {
      // Simulate bridge transaction with progress
      const transactionId = `bridge-${Date.now()}`;
      const newTransaction: BridgeTransaction = {
        id: transactionId,
        fromAsset,
        toAsset,
        amount: Number(amount),
        status: 'processing',
        timestamp: Date.now()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Simulate progress
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
      setTransactions(prev => 
        prev.map(tx => 
          tx.id === transactionId 
            ? { ...tx, status: 'completed', txHash: `0x${Math.random().toString(16).substr(2, 64)}` }
            : tx
        )
      );

      toast('Bridge transaction completed successfully!', 'success');
      setEstimate(null);
      setAmount('');
    } catch (err) {
      setError('Bridge transaction failed');
      toast('Bridge transaction failed', 'error');
    } finally {
      setIsBridging(false);
      setBridgeProgress(0);
    }
  };

  const getAssetBalance = (asset: string) => {
    switch (asset) {
      case 'BTC':
        return btcBalance || 0;
      case 'STX':
        return 0; // Would get from Stacks wallet
      default:
        return 0;
    }
  };

  const getRouteInfo = (from: string, to: string) => {
    return bridgeRoutes.find(route => route.from === from && route.to === to);
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  const handleTestWallets = async () => {
    try {
      const walletTest = await testWalletConnection();
      const bridgeTest = testBridgeFunctionality();
      
      console.log('Wallet Test Results:', walletTest);
      console.log('Bridge Test Results:', bridgeTest);
      
      toast('Wallet integration test completed. Check console for details.', 'success');
    } catch (error) {
      console.error('Wallet test failed:', error);
      toast('Wallet test failed. Check console for details.', 'error');
    }
  };

    return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Container maxW="6xl" py={8} px={4}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={4} textAlign="center">
            <Heading size="xl" color="#ffffff">
              Cross-Chain Bridge
            </Heading>
            <Text color="#9ca3af" maxW="3xl" fontSize="lg">
              Bridge Bitcoin, Stacks, and other assets across blockchain networks. Secure, fast, and cost-effective cross-chain transactions.
            </Text>
          </VStack>
          
          {/* Main Bridge Interface */}
          <VStack gap={6} align="stretch">
            {/* Bridge Form */}
            <UniformCard p={6}>
              <VStack gap={6} align="stretch">
                <Heading size="md" color="#ffffff">
                  Bridge Assets
                </Heading>

                {/* Asset Selection */}
                <VStack gap={4} align="stretch">
                  <HStack gap={4} align="stretch">
                    {/* From Asset */}
                    <VStack gap={3} align="stretch" flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                        From
              </Text>
                      <Select
                        value={fromAsset}
                        onChange={(e) => setFromAsset(e.target.value)}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        color="#ffffff"
                        _focus={{ borderColor: '#3b82f6' }}
                size="lg" 
                      >
                        {supportedAssets.map((asset) => (
                          <option key={asset.value} value={asset.value} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {asset.icon} {asset.label}
                          </option>
                        ))}
                      </Select>
                      <Text fontSize="xs" color="#9ca3af">
                        Balance: {formatBalance(getAssetBalance(fromAsset))} {fromAsset}
          </Text>
        </VStack>
        
                    {/* Arrow */}
                    <Box display="flex" alignItems="center" justifyContent="center" mt={8}>
                      <Text fontSize="2xl" color="#3b82f6">→</Text>
                    </Box>

                    {/* To Asset */}
                    <VStack gap={3} align="stretch" flex="1">
                      <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                        To
                      </Text>
                      <Select
                        value={toAsset}
                        onChange={(e) => setToAsset(e.target.value)}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        color="#ffffff"
                        _focus={{ borderColor: '#3b82f6' }}
                size="lg"
                      >
                        {supportedAssets.filter(asset => asset.value !== fromAsset).map((asset) => (
                          <option key={asset.value} value={asset.value} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                            {asset.icon} {asset.label}
                          </option>
                        ))}
                      </Select>
                      <Text fontSize="xs" color="#9ca3af">
                        Balance: {formatBalance(getAssetBalance(toAsset))} {toAsset}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* Amount Input */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Amount
                  </Text>
                  <UniformInput
                    type="number"
                    placeholder="Enter amount to bridge"
                value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                size="lg"
                  />
                  <HStack justify="space-between" align="center">
                    <Text fontSize="xs" color="#9ca3af">
                      Available: {formatBalance(getAssetBalance(fromAsset))} {fromAsset}
                    </Text>
              <Button 
                      size="xs"
                      variant="ghost"
                      color="#3b82f6"
                      onClick={() => setAmount(getAssetBalance(fromAsset).toString())}
                    >
                      Max
              </Button>
            </HStack>
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
                    size="lg"
                  />
                  <Text fontSize="xs" color="#9ca3af">
                    {toAsset} address where you want to receive the bridged assets
                  </Text>
                </VStack>

                {/* Action Buttons */}
                <VStack gap={3} align="stretch">
                  <HStack gap={3} justify="center" wrap="wrap">
                    <UniformButton
                      variant="secondary"
                      onClick={handleEstimate}
                      loading={isEstimating}
                      disabled={!amount || Number(amount) <= 0}
                      size="lg"
                    >
                      {isEstimating ? 'Estimating...' : 'Estimate Fees'}
                    </UniformButton>

                    <UniformButton
                      variant="primary"
                      onClick={handleBridge}
                      loading={isBridging}
                      disabled={!estimate || !recipientAddress || (!isAuthenticated && fromAsset === 'STX') || (!btcConnected && fromAsset === 'BTC')}
                      size="lg"
                    >
                      {isBridging ? 'Bridging...' : 'Bridge Assets'}
                    </UniformButton>
                  </HStack>
                  
                  <HStack gap={2} justify="center" wrap="wrap">
                    <UniformButton
                      variant="ghost"
                      onClick={handleTestWallets}
                      size="sm"
                    >
                      Test Wallet Integration
                    </UniformButton>
                  </HStack>
                </VStack>

                {/* Error Display */}
                {error && (
                  <AlertRoot status="error">
                    <AlertIndicator />
                    <AlertContent>
                      <AlertTitle>Error!</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </AlertContent>
                  </AlertRoot>
                )}

                {/* Wallet Connection Status */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Wallet Status
                  </Text>
                  
                  <HStack justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                    <HStack gap={2} align="center">
                      <Text fontSize="sm" color="#ffffff">Stacks Wallet</Text>
                      <Badge colorScheme={isAuthenticated ? 'green' : 'red'} fontSize="xs">
                        {isAuthenticated ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </HStack>
                    {address && (
                      <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </Text>
                    )}
                  </HStack>

                  <HStack justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                    <HStack gap={2} align="center">
                      <Text fontSize="sm" color="#ffffff">Bitcoin Wallet</Text>
                      <Badge colorScheme={btcConnected ? 'green' : 'red'} fontSize="xs">
                        {btcConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </HStack>
                    {btcAddress && (
                      <Text fontSize="xs" color="#9ca3af" fontFamily="mono">
                        {btcAddress.slice(0, 6)}...{btcAddress.slice(-4)}
                      </Text>
                    )}
                  </HStack>
                </VStack>

                {/* Wallet Requirements */}
                {(!isAuthenticated && fromAsset === 'STX') && (
                  <AlertRoot status="warning">
                    <AlertIndicator />
                    <AlertContent>
                      <AlertTitle>Stacks Wallet Required</AlertTitle>
                      <AlertDescription>
                        Please connect your Stacks wallet to bridge STX tokens.
                      </AlertDescription>
                    </AlertContent>
                  </AlertRoot>
                )}

                {(!btcConnected && fromAsset === 'BTC') && (
                  <AlertRoot status="warning">
                    <AlertIndicator />
                    <AlertContent>
                      <AlertTitle>Bitcoin Wallet Required</AlertTitle>
                      <AlertDescription>
                        Please connect your Bitcoin wallet to bridge BTC tokens.
                      </AlertDescription>
                    </AlertContent>
                  </AlertRoot>
                )}
              </VStack>
            </UniformCard>

            {/* Fee Estimation */}
            {estimate && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ffffff">
                    Bridge Estimation
                  </Heading>
                  
                  <VStack gap={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="#9ca3af">Amount</Text>
                      <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                        {estimate.amount} {fromAsset}
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="#9ca3af">Bridge Fee</Text>
                      <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                        {estimate.fee.toFixed(6)} {fromAsset}
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="#9ca3af">You'll Receive</Text>
                      <Text fontSize="sm" color="#10b981" fontWeight="medium">
                        {(estimate.amount - estimate.fee).toFixed(6)} {toAsset}
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="#9ca3af">Estimated Time</Text>
                      <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                        {estimate.estimatedTime}
                      </Text>
                    </HStack>
                    
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="#9ca3af">Route</Text>
                      <Text fontSize="sm" color="#3b82f6" fontWeight="medium">
                        {estimate.route}
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </UniformCard>
            )}

            {/* Bridge Progress */}
            {isBridging && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ffffff">
                    Bridge Progress
                  </Heading>
                  
                  <VStack gap={3} align="stretch">
                    <Progress 
                      value={bridgeProgress} 
                      colorScheme="blue" 
                      size="lg" 
                      borderRadius="md"
                      bg="rgba(255, 255, 255, 0.1)"
                    />
                    <Text fontSize="sm" color="#9ca3af" textAlign="center">
                      {bridgeProgress}% Complete
                    </Text>
                  </VStack>
                </VStack>
              </UniformCard>
            )}

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ffffff">
                    Recent Bridge Transactions
                  </Heading>
                  
                  <VStack gap={3} align="stretch">
                    {transactions.slice(0, 5).map((tx) => (
                      <Box key={tx.id} p={4} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                        <HStack justify="space-between" align="center">
                          <VStack align="start" gap={1}>
                            <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                              {tx.amount} {tx.fromAsset} → {tx.toAsset}
                  </Text>
                            <Text fontSize="xs" color="#9ca3af">
                              {new Date(tx.timestamp).toLocaleString()}
                  </Text>
                            {tx.txHash && (
                              <Code fontSize="xs" color="#3b82f6">
                                {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                              </Code>
                            )}
                          </VStack>
                          
                          <Badge 
                            colorScheme={
                              tx.status === 'completed' ? 'green' : 
                              tx.status === 'processing' ? 'blue' : 
                              tx.status === 'failed' ? 'red' : 'yellow'
                            }
                            fontSize="sm"
                          >
                            {tx.status.toUpperCase()}
                          </Badge>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </UniformCard>
            )}

            {/* Bridge Information */}
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  Bridge Information
                </Heading>
                
                <VStack gap={3} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Supported Networks</Text>
                    <Text fontSize="sm" color="#ffffff">Stacks, Bitcoin, Ethereum</Text>
                  </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Bridge Type</Text>
                    <Text fontSize="sm" color="#ffffff">Cross-Chain</Text>
                  </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Security</Text>
                    <Text fontSize="sm" color="#ffffff">Multi-Sig, Time-locked</Text>
                  </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Average Time</Text>
                    <Text fontSize="sm" color="#ffffff">5-15 minutes</Text>
                  </HStack>
                  
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="#9ca3af">Bridge Fee</Text>
                    <Text fontSize="sm" color="#ffffff">0.1% - 0.5%</Text>
                  </HStack>
                </VStack>
              </VStack>
            </UniformCard>
          </VStack>
      </VStack>
    </Container>
    </Box>
  );
}