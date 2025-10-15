import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Badge, 
  Heading, 
  IconButton,
  useDisclosure
} from '@chakra-ui/react';
import { BridgeTransaction, bridgeService } from '../services/bridgeService';

interface BridgeTrackingModalProps {
  transaction: BridgeTransaction;
  isOpen: boolean;
  onClose: () => void;
}

export const BridgeTrackingModal: React.FC<BridgeTrackingModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const [progress, setProgress] = useState({ status: 'processing', progress: 0, timeRemaining: 0 });
  const [explorerUrl, setExplorerUrl] = useState('');

  useEffect(() => {
    if (!isOpen || !transaction) return;

    // Get initial progress
    const initialProgress = bridgeService.getTransactionProgress(transaction.id);
    setProgress({
      status: initialProgress.status,
      progress: initialProgress.progress,
      timeRemaining: initialProgress.timeRemaining || 0
    });

    // Get explorer URL if transaction has hash
    if (transaction.txHash) {
      const url = bridgeService.getExplorerUrl(transaction);
      setExplorerUrl(url);
    }

    // Update progress every second
    const interval = setInterval(() => {
      const currentProgress = bridgeService.getTransactionProgress(transaction.id);
      setProgress({
        status: currentProgress.status,
        progress: currentProgress.progress,
        timeRemaining: currentProgress.timeRemaining || 0
      });

      // Update explorer URL if transaction gets completed
      if (currentProgress.status === 'completed' && !explorerUrl) {
        const updatedTransaction = bridgeService.getTransaction(transaction.id);
        if (updatedTransaction?.txHash) {
          const url = bridgeService.getExplorerUrl(updatedTransaction);
          setExplorerUrl(url);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, transaction, explorerUrl]);

  if (!isOpen || !transaction) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      case 'cancelled': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '⚠️';
      default: return '❓';
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Completing...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="var(--bg-overlay)"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="var(--bg-card)"
        border="1px solid var(--border-primary)"
        borderRadius="lg"
        p={6}
        maxW="500px"
        w="100%"
        boxShadow="0 20px 25px rgba(0, 0, 0, 0.1)"
      >
        <VStack gap={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Heading size="md" color="var(--text-primary)">
              🌉 Bridge Tracking
            </Heading>
            <IconButton
              aria-label="Close"
              variant="ghost"
              size="sm"
              color="var(--text-secondary)"
              onClick={onClose}
            >
              <Text>✕</Text>
            </IconButton>
          </HStack>

          {/* Transaction Info */}
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <Text color="var(--text-tertiary)">Transaction ID:</Text>
              <Text color="var(--text-primary)" fontFamily="mono" fontSize="sm">
                {transaction.id.substring(0, 20)}...
              </Text>
            </HStack>

            <HStack justify="space-between">
              <Text color="var(--text-tertiary)">Route:</Text>
              <HStack gap={2}>
                <Text color="var(--text-primary)">
                  {transaction.route.fromAsset.icon} {transaction.route.fromAsset.symbol}
                </Text>
                <Text color="var(--text-tertiary)">→</Text>
                <Text color="var(--text-primary)">
                  {transaction.route.toAsset.icon} {transaction.route.toAsset.symbol}
                </Text>
              </HStack>
            </HStack>

            <HStack justify="space-between">
              <Text color="var(--text-tertiary)">Amount:</Text>
              <Text color="var(--text-primary)">
                {transaction.amount} {transaction.route.fromAsset.symbol}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <Text color="var(--text-tertiary)">Status:</Text>
              <Badge colorScheme={getStatusColor(progress.status)}>
                {getStatusIcon(progress.status)} {progress.status}
              </Badge>
            </HStack>
          </VStack>

          {/* Progress Section */}
          {progress.status === 'processing' && (
            <VStack gap={3} align="stretch">
              <Text color="var(--text-primary)" fontWeight="medium">
                Progress
              </Text>
              <Box
                w="100%"
                h="8px"
                bg="var(--surface-secondary)"
                borderRadius="md"
                overflow="hidden"
              >
                <Box
                  w={`${progress.progress}%`}
                  h="100%"
                  bg="var(--text-accent)"
                  borderRadius="md"
                  transition="width 0.3s ease"
                />
              </Box>
              <HStack justify="space-between">
                <Text color="var(--text-tertiary)" fontSize="sm">
                  {progress.progress}% Complete
                </Text>
                <Text color="var(--text-tertiary)" fontSize="sm">
                  {formatTimeRemaining(progress.timeRemaining)}
                </Text>
              </HStack>
            </VStack>
          )}

          {/* Completed Section */}
          {progress.status === 'completed' && (
            <VStack gap={3} align="stretch">
              <Box
                bg="rgba(16, 185, 129, 0.1)"
                border="1px solid rgba(16, 185, 129, 0.3)"
                borderRadius="md"
                p={3}
              >
                <VStack gap={2}>
                  <Text color="var(--text-accent)" fontWeight="medium">
                    ✅ Bridge Completed Successfully!
                  </Text>
                  <Text color="var(--text-tertiary)" fontSize="sm">
                    Your assets have been successfully bridged to the destination chain.
                  </Text>
                </VStack>
              </Box>

              {explorerUrl && (
                <VStack gap={2} align="stretch">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--text-accent)',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    🔗 View on Blockchain Explorer
                  </a>
                  <Box
                    bg="rgba(255, 193, 7, 0.1)"
                    border="1px solid rgba(255, 193, 7, 0.3)"
                    borderRadius="md"
                    p={2}
                  >
                    <Text color="var(--text-accent)" fontSize="xs">
                      ⚠️ Demo Mode: This is a simulated transaction for hackathon demonstration. 
                      In production, this would be a real blockchain transaction.
                    </Text>
                  </Box>
                </VStack>
              )}
            </VStack>
          )}

          {/* Failed Section */}
          {progress.status === 'failed' && (
            <Box
              bg="rgba(239, 68, 68, 0.1)"
              border="1px solid rgba(239, 68, 68, 0.3)"
              borderRadius="md"
              p={3}
            >
              <VStack gap={2}>
                <Text color="var(--border-error)" fontWeight="medium">
                  ❌ Bridge Failed
                </Text>
                <Text color="var(--text-tertiary)" fontSize="sm">
                  The bridge transaction encountered an error. Please try again.
                </Text>
                {transaction.error && (
                  <Text color="var(--border-error)" fontSize="xs">
                    Error: {transaction.error}
                  </Text>
                )}
              </VStack>
            </Box>
          )}

          {/* Action Buttons */}
          <HStack gap={3} justify="flex-end">
            {progress.status === 'processing' && (
              <Button
                size="sm"
                variant="outline"
                color="var(--text-accent)"
                borderColor="var(--border-accent)"
                onClick={() => {
                  bridgeService.forceCompleteTransaction(transaction.id);
                  const updatedProgress = bridgeService.getTransactionProgress(transaction.id);
                  setProgress({
                    status: updatedProgress.status,
                    progress: updatedProgress.progress,
                    timeRemaining: updatedProgress.timeRemaining || 0
                  });
                }}
              >
                ⚡ Force Complete (Demo)
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              color="var(--text-secondary)"
              onClick={onClose}
            >
              Close
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};
