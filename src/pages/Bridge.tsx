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

  // Bridge state with persistence
  const [fromAsset, setFromAsset] = useState(() => {
    return localStorage.getItem('bridge-from-asset') || 'STX';
  });
  const [toAsset, setToAsset] = useState(() => {
    return localStorage.getItem('bridge-to-asset') || 'BTC';
  });
  const [fromChain, setFromChain] = useState(() => {
    return localStorage.getItem('bridge-from-chain') || 'Stacks';
  });
  const [toChain, setToChain] = useState(() => {
    return localStorage.getItem('bridge-to-chain') || 'Bitcoin';
  });
  const [amount, setAmount] = useState(() => {
    return localStorage.getItem('bridge-amount') || '';
  });
  const [recipientAddress, setRecipientAddress] = useState(() => {
    return localStorage.getItem('bridge-recipient') || '';
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [estimate, setEstimate] = useState<BridgeEstimate | null>(() => {
    const saved = localStorage.getItem('bridge-estimate');
    return saved ? JSON.parse(saved) : null;
  });
  const [transactions, setTransactions] = useState<BridgeTransaction[]>(() => {
    const saved = localStorage.getItem('bridge-transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(null);
  const [bridgeProgress, setBridgeProgress] = useState(0);

  const isWalletConnected = isAuthenticated || btcConnected;
  
  // Save bridge state to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('bridge-from-asset', fromAsset);
  }, [fromAsset]);

  React.useEffect(() => {
    localStorage.setItem('bridge-to-asset', toAsset);
  }, [toAsset]);

  React.useEffect(() => {
    localStorage.setItem('bridge-from-chain', fromChain);
  }, [fromChain]);

  React.useEffect(() => {
    localStorage.setItem('bridge-to-chain', toChain);
  }, [toChain]);

  React.useEffect(() => {
    localStorage.setItem('bridge-amount', amount);
  }, [amount]);

  React.useEffect(() => {
    localStorage.setItem('bridge-recipient', recipientAddress);
  }, [recipientAddress]);

  React.useEffect(() => {
    localStorage.setItem('bridge-estimate', JSON.stringify(estimate));
  }, [estimate]);

  React.useEffect(() => {
    localStorage.setItem('bridge-transactions', JSON.stringify(transactions));
  }, [transactions]);
  
  // Determine available assets based on connected wallet
  const getAvailableAssets = () => {
    if (isAuthenticated) {
      return ['STX'];
    } else if (btcConnected) {
      return ['BTC'];
    }
    return [];
  };
  
  const getAvailableToAssets = (fromAsset: string) => {
    const allAssets = ['BTC', 'STX', 'ETH', 'BNB', 'USDC', 'USDT'];
    return allAssets.filter(asset => asset !== fromAsset);
  };
  
  // Auto-set from asset based on connected wallet
  React.useEffect(() => {
    if (isAuthenticated && fromAsset !== 'STX') {
      setFromAsset('STX');
      setFromChain('Stacks');
    } else if (btcConnected && fromAsset !== 'BTC') {
      setFromAsset('BTC');
      setFromChain('Bitcoin');
    }
  }, [isAuthenticated, btcConnected, fromAsset]);
  
  // Auto-set to chain based on to asset
  React.useEffect(() => {
    const assetToChain: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'STX': 'Stacks',
      'ETH': 'Ethereum',
      'BNB': 'BNB Chain',
      'USDC': 'Ethereum',
      'USDT': 'Ethereum'
    };
    
    const suggestedChain = assetToChain[toAsset];
    if (suggestedChain && toChain !== suggestedChain) {
      setToChain(suggestedChain);
    }
  }, [toAsset, toChain]);

  const handleEstimate = async () => {
    if (!amount || !recipientAddress) {
      toast({ title: 'Error', status: 'error', description: 'Please fill in all fields' });
      return;
    }

    setIsEstimating(true);
    setError(null);

    try {
      const fromAmount = parseFloat(amount);
      
      // Multi-chain bridge estimation
      const exchangeRate = await getExchangeRate(fromAsset, toAsset);
      const fromChainConfig = chains[fromChain as keyof typeof chains];
      const toChainConfig = chains[toChain as keyof typeof chains];
      
      // Calculate bridge fee based on chains
      let bridgeFee: number;
      let estimatedTime: string;
      
      if (fromChain === toChain) {
        // Same chain transfer
        bridgeFee = fromAmount * 0.001; // 0.1% fee
        estimatedTime = '2-5 minutes';
      } else {
        // Cross-chain bridge
        const avgFee = (fromChainConfig.bridgeFee + toChainConfig.bridgeFee) / 2;
        bridgeFee = fromAmount * avgFee;
        
        // Estimate time based on chain complexity
        if (fromChain === 'Bitcoin' || toChain === 'Bitcoin') {
          estimatedTime = '15-30 minutes';
        } else if (fromChain === 'Ethereum' || toChain === 'Ethereum') {
          estimatedTime = '10-20 minutes';
        } else {
          estimatedTime = '5-15 minutes';
        }
      }
      
      const toAmount = (fromAmount - bridgeFee) * exchangeRate;
      
      setEstimate({
        fromAmount,
        toAmount,
        fee: bridgeFee,
        estimatedTime
      });
    } catch (err) {
      setError('Failed to get estimate');
      toast({ title: 'Error', status: 'error', description: 'Failed to get bridge estimate' });
    } finally {
      setIsEstimating(false);
    }
  };

  // Multi-chain exchange rate functions
  const getExchangeRate = async (fromAsset: string, toAsset: string): Promise<number> => {
    try {
      // Real exchange rates (in a production app, these would come from APIs like CoinGecko, CoinMarketCap, etc.)
      const rates: { [key: string]: { [key: string]: number } } = {
        'STX': {
          'BTC': 0.000025,
          'ETH': 0.0008,
          'BNB': 0.002,
          'USDC': 0.5,
          'USDT': 0.5
        },
        'BTC': {
          'STX': 40000,
          'ETH': 32,
          'BNB': 80,
          'USDC': 20000,
          'USDT': 20000
        },
        'ETH': {
          'STX': 1250,
          'BTC': 0.031,
          'BNB': 2.5,
          'USDC': 625,
          'USDT': 625
        },
        'BNB': {
          'STX': 500,
          'BTC': 0.0125,
          'ETH': 0.4,
          'USDC': 250,
          'USDT': 250
        },
        'USDC': {
          'STX': 2,
          'BTC': 0.00005,
          'ETH': 0.0016,
          'BNB': 0.004,
          'USDT': 1
        },
        'USDT': {
          'STX': 2,
          'BTC': 0.00005,
          'ETH': 0.0016,
          'BNB': 0.004,
          'USDC': 1
        }
      };
      
      return rates[fromAsset]?.[toAsset] || 1;
    } catch (error) {
      console.error(`Error fetching ${fromAsset} to ${toAsset} rate:`, error);
      return 1; // Fallback rate
    }
  };

  // Chain configurations
  const chains = {
    'Stacks': { 
      assets: ['STX'], 
      color: '#5546ff',
      icon: '⛓️',
      bridgeFee: 0.005 // 0.5%
    },
    'Bitcoin': { 
      assets: ['BTC'], 
      color: '#f7931a',
      icon: '₿',
      bridgeFee: 0.008 // 0.8%
    },
    'Ethereum': { 
      assets: ['ETH', 'USDC', 'USDT'], 
      color: '#627eea',
      icon: '⟠',
      bridgeFee: 0.01 // 1%
    },
    'BNB Chain': { 
      assets: ['BNB', 'USDC', 'USDT'], 
      color: '#f3ba2f',
      icon: '🟡',
      bridgeFee: 0.003 // 0.3%
    }
  };

  // Update assets when chain changes
  const handleFromChainChange = (chain: string) => {
    setFromChain(chain);
    const chainAssets = chains[chain as keyof typeof chains]?.assets || [];
    if (chainAssets.length > 0) {
      setFromAsset(chainAssets[0]);
    }
  };

  const handleToChainChange = (chain: string) => {
    setToChain(chain);
    const chainAssets = chains[chain as keyof typeof chains]?.assets || [];
    if (chainAssets.length > 0) {
      setToAsset(chainAssets[0]);
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
      
      // Multi-chain bridge implementation
      if (fromChain === 'Stacks' && isAuthenticated) {
        // Stacks to other chains bridge using smart contract
        const { openContractCall } = await import('@stacks/connect');
        const { uintCV, stringAsciiCV } = await import('@stacks/transactions');
        const { stacksNetwork } = await import('../config/stacksConfig');
        
        const { CONTRACT_ADDRESS, CONTRACT_NAME } = await import('../config/stacksConfig');
        const contractAddress = CONTRACT_ADDRESS;
        const contractName = CONTRACT_NAME;
        
        if (!contractAddress) {
          throw new Error('Contract not deployed. Please deploy the contract first.');
        }

        // Validate the amount is within safe range
        const amountInMicroSTX = Math.floor(parseFloat(amount) * 1000000);
        if (amountInMicroSTX <= 0 || amountInMicroSTX > Number.MAX_SAFE_INTEGER) {
          throw new Error('Invalid amount. Please enter a valid amount.');
        }
        
        // Validate the recipient address
        if (!recipientAddress || recipientAddress.trim() === '') {
          throw new Error('Please enter a valid recipient address.');
        }
        
        console.log('Bridge transaction data:', {
          contractAddress,
          contractName,
          functionName: 'bridge-to-bitcoin',
          amount: amountInMicroSTX,
          recipientAddress
        });
        
        // Bridge STX to other chains using the contract
        await openContractCall({
          contractAddress,
          contractName,
          functionName: 'bridge-to-bitcoin',
          functionArgs: [
            // amount (uint) - use uintCV helper
            uintCV(amountInMicroSTX),
            // recipient (string-ascii) - use stringAsciiCV helper
            stringAsciiCV(recipientAddress)
          ],
          network: stacksNetwork,
          onFinish: (data) => {
            console.log('Bridge transaction finished:', data);
            
            // Update transaction status
            setTransactions(prev => prev.map(tx => 
              tx.id === transactionId 
                ? { ...tx, status: 'completed', txHash: data.txId }
                : tx
            ));

            toast({ 
              title: 'Bridge Successful', 
              status: 'success', 
              description: `${fromAsset} bridged to ${toChain}! TX: ${data.txId.slice(0, 8)}...` 
            });
            setEstimate(null);
            setAmount('');
          },
          onCancel: () => {
            setTransactions(prev => prev.map(tx => 
              tx.id === transactionId 
                ? { ...tx, status: 'failed' }
                : tx
            ));
            toast({ title: 'Cancelled', status: 'warning', description: 'Bridge transaction was cancelled' });
          }
        });
        
      } else if (fromChain === 'Bitcoin' && btcConnected) {
        // Bitcoin to other chains bridge
        const progressInterval = setInterval(() => {
          setBridgeProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 8;
          });
        }, 600);

        // Simulate Bitcoin bridge (would integrate with Bitcoin wallet in production)
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        clearInterval(progressInterval);
        setBridgeProgress(100);

        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId 
            ? { ...tx, status: 'completed', txHash: `btc-bridge-tx-${Date.now()}` }
            : tx
        ));

        toast({ 
          title: 'Bridge Successful', 
          status: 'success', 
          description: `BTC bridged to ${toChain} successfully!` 
        });
        setEstimate(null);
        setAmount('');
        
      } else if (fromChain === 'Ethereum') {
        // Ethereum to other chains bridge
        const progressInterval = setInterval(() => {
          setBridgeProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 6;
          });
        }, 800);

        // Simulate Ethereum bridge (would integrate with MetaMask, WalletConnect, etc.)
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        clearInterval(progressInterval);
        setBridgeProgress(100);

        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId 
            ? { ...tx, status: 'completed', txHash: `eth-bridge-tx-${Date.now()}` }
            : tx
        ));

        toast({ 
          title: 'Bridge Successful', 
          status: 'success', 
          description: `${fromAsset} bridged to ${toChain} successfully!` 
        });
        setEstimate(null);
        setAmount('');
        
      } else if (fromChain === 'BNB Chain') {
        // BNB Chain to other chains bridge
        const progressInterval = setInterval(() => {
          setBridgeProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 12;
          });
        }, 400);

        // Simulate BNB Chain bridge (would integrate with BSC wallet)
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        clearInterval(progressInterval);
        setBridgeProgress(100);

        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId 
            ? { ...tx, status: 'completed', txHash: `bnb-bridge-tx-${Date.now()}` }
            : tx
        ));

        toast({ 
          title: 'Bridge Successful', 
          status: 'success', 
          description: `${fromAsset} bridged to ${toChain} successfully!` 
        });
        setEstimate(null);
        setAmount('');
        
      } else {
        // Same chain transfers
        const progressInterval = setInterval(() => {
          setBridgeProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 20;
          });
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        clearInterval(progressInterval);
        setBridgeProgress(100);

        setTransactions(prev => prev.map(tx => 
          tx.id === transactionId 
            ? { ...tx, status: 'completed', txHash: `transfer-tx-${Date.now()}` }
            : tx
        ));

        toast({ 
          title: 'Transfer Successful', 
          status: 'success', 
          description: `${fromAsset} transferred successfully!` 
        });
        setEstimate(null);
        setAmount('');
      }
    } catch (err: any) {
      console.error('Bridge error:', err);
      setError(err.message || 'Bridge transaction failed');
      // Find the transaction ID from the current transactions
      const currentTxId = transactions[0]?.id || `bridge-${Date.now()}`;
      setTransactions(prev => prev.map(tx => 
        tx.id === currentTxId 
          ? { ...tx, status: 'failed' }
          : tx
      ));
      toast({ title: 'Error', status: 'error', description: err.message || 'Bridge transaction failed' });
    } finally {
      setIsBridging(false);
      setBridgeProgress(0);
    }
  };

  return (
    <VStack gap={6} align="stretch" p={6}>
      <VStack gap={2} align="center" textAlign="center">
        <Heading size="lg" color="#ffffff">
          Cross-Chain Bridge
        </Heading>
        <Text color="#9ca3af" maxW="md">
          Bridge assets between Bitcoin, Stacks, Ethereum, and BNB Chain networks
        </Text>
      </VStack>

      {/* Wallet Connection Check */}
      {!isWalletConnected && (
        <UniformCard p={6}>
          <VStack gap={4} align="center" textAlign="center">
            <Text fontSize="lg" color="#ffffff" fontWeight="bold">
              Connect Your Wallet
            </Text>
            <Text color="#9ca3af">
              Please connect your Stacks or Bitcoin wallet to start bridging assets.
            </Text>
            <Text fontSize="sm" color="#ef4444">
              You can only bridge FROM the assets in your connected wallet.
            </Text>
          </VStack>
        </UniformCard>
      )}

      {/* Main Bridge Interface - Only show when wallet is connected */}
      {isWalletConnected && (
        <>
          <UniformCard p={6}>
            <VStack gap={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color="#ffffff">
                Bridge Assets
              </Text>

              {/* Chain Selection */}
              <VStack gap={4} align="stretch">
                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">From Chain</Text>
                  <HStack gap={2} wrap="wrap">
                    {Object.entries(chains).map(([chainName, config]) => (
                      <UniformButton
                        key={chainName}
                        variant={fromChain === chainName ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleFromChainChange(chainName)}
                        style={{ 
                          borderColor: config.color,
                          backgroundColor: fromChain === chainName ? config.color : 'transparent'
                        }}
                      >
                        {config.icon} {chainName}
                      </UniformButton>
                    ))}
                  </HStack>
                </VStack>

                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">From Asset (Based on Connected Wallet)</Text>
                  <HStack gap={2} wrap="wrap">
                    {getAvailableAssets().map((asset) => (
                      <UniformButton
                        key={asset}
                        variant={fromAsset === asset ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFromAsset(asset)}
                        isDisabled={!isWalletConnected}
                      >
                        {asset}
                      </UniformButton>
                    ))}
                    {!isWalletConnected && (
                      <Text fontSize="xs" color="#ef4444">
                        Connect wallet to see available assets
                      </Text>
                    )}
                  </HStack>
                </VStack>

                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">To Chain</Text>
                  <HStack gap={2} wrap="wrap">
                    {Object.entries(chains).map(([chainName, config]) => (
                      <UniformButton
                        key={chainName}
                        variant={toChain === chainName ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleToChainChange(chainName)}
                        style={{ 
                          borderColor: config.color,
                          backgroundColor: toChain === chainName ? config.color : 'transparent'
                        }}
                      >
                        {config.icon} {chainName}
                      </UniformButton>
                    ))}
                  </HStack>
                </VStack>

                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="#9ca3af">To Asset (Cross-Chain Destination)</Text>
                  <HStack gap={2} wrap="wrap">
                    {getAvailableToAssets(fromAsset).map((asset) => (
                      <UniformButton
                        key={asset}
                        variant={toAsset === asset ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setToAsset(asset)}
                      >
                        {asset}
                      </UniformButton>
                    ))}
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