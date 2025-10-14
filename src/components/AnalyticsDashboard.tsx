import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { UniformCard } from './UniformCard';

interface AnalyticsData {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  averageTime: number;
  topChains: { chain: string; count: number; volume: number }[];
  recentActivity: { time: string; type: string; amount: number; status: string }[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTransactions: 0,
    totalVolume: 0,
    successRate: 0,
    averageTime: 0,
    topChains: [],
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalytics({
        totalTransactions: 1247,
        totalVolume: 45678.90,
        successRate: 98.5,
        averageTime: 2.3,
        topChains: [
          { chain: 'Stacks', count: 456, volume: 12345.67 },
          { chain: 'Bitcoin', count: 234, volume: 9876.54 },
          { chain: 'Ethereum', count: 189, volume: 5432.10 },
          { chain: 'Polygon', count: 156, volume: 3210.98 },
          { chain: 'BNB Chain', count: 98, volume: 2109.87 }
        ],
        recentActivity: [
          { time: '2 min ago', type: 'Bridge', amount: 150.00, status: 'completed' },
          { time: '5 min ago', type: 'Payment', amount: 75.50, status: 'completed' },
          { time: '8 min ago', type: 'Bridge', amount: 200.00, status: 'processing' },
          { time: '12 min ago', type: 'Payment', amount: 45.25, status: 'completed' },
          { time: '15 min ago', type: 'Bridge', amount: 300.00, status: 'completed' }
        ]
      });
      
      setIsLoading(false);
    };

    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text color="#9ca3af">Loading analytics...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="6xl" mx="auto" p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <VStack gap={2} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="#ffffff">
            📊 Bridge Analytics Dashboard
          </Text>
          <Text color="#9ca3af" fontSize="sm">
            Real-time insights into cross-chain bridge performance
          </Text>
        </VStack>

        {/* Key Metrics */}
        <VStack gap={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="#ffffff">
            Key Metrics
          </Text>
          <HStack gap={4} wrap="wrap">
            <UniformCard p={4} minW="200px">
              <VStack gap={2} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="#3b82f6">
                  {analytics.totalTransactions.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  Total Transactions
                </Text>
              </VStack>
            </UniformCard>

            <UniformCard p={4} minW="200px">
              <VStack gap={2} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="#10b981">
                  ${analytics.totalVolume.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  Total Volume
                </Text>
              </VStack>
            </UniformCard>

            <UniformCard p={4} minW="200px">
              <VStack gap={2} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="#f59e0b">
                  {analytics.successRate}%
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  Success Rate
                </Text>
              </VStack>
            </UniformCard>

            <UniformCard p={4} minW="200px">
              <VStack gap={2} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="#8b5cf6">
                  {analytics.averageTime}m
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  Avg. Time
                </Text>
              </VStack>
            </UniformCard>
          </HStack>
        </VStack>

        {/* Top Chains */}
        <UniformCard p={6}>
          <VStack gap={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color="#ffffff">
              Top Chains by Volume
            </Text>
            <VStack gap={3} align="stretch">
              {analytics.topChains.map((chain, index) => (
                <Box key={chain.chain}>
                  <HStack justify="space-between" align="center" mb={2}>
                    <HStack gap={3}>
                      <Text fontSize="sm" color="#ffffff" fontWeight="medium">
                        #{index + 1} {chain.chain}
                      </Text>
                      <Badge colorScheme="blue" variant="outline" fontSize="xs">
                        {chain.count} txns
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="#9ca3af">
                      ${chain.volume.toLocaleString()}
                    </Text>
                  </HStack>
                  <Box
                    w="100%"
                    h="4px"
                    bg="rgba(255, 255, 255, 0.1)"
                    borderRadius="full"
                    overflow="hidden"
                  >
                    <Box
                      h="100%"
                      bg="#3b82f6"
                      w={`${(chain.volume / analytics.topChains[0].volume) * 100}%`}
                      borderRadius="full"
                      transition="width 0.3s ease"
                    />
                  </Box>
                </Box>
              ))}
            </VStack>
          </VStack>
        </UniformCard>

        {/* Recent Activity */}
        <UniformCard p={6}>
          <VStack gap={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color="#ffffff">
              Recent Activity
            </Text>
            <VStack gap={3} align="stretch">
              {analytics.recentActivity.map((activity, index) => (
                <HStack key={index} justify="space-between" align="center" p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="lg">
                  <HStack gap={3}>
                    <Text fontSize="sm" color="#ffffff">
                      {activity.type}
                    </Text>
                    <Text fontSize="sm" color="#9ca3af">
                      ${activity.amount}
                    </Text>
                  </HStack>
                  <HStack gap={2}>
                    <Badge
                      colorScheme={activity.status === 'completed' ? 'green' : activity.status === 'processing' ? 'yellow' : 'red'}
                      variant="solid"
                      fontSize="xs"
                    >
                      {activity.status}
                    </Badge>
                    <Text fontSize="xs" color="#9ca3af">
                      {activity.time}
                    </Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </UniformCard>
      </VStack>
    </Box>
  );
};
