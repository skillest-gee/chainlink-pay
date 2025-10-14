import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { UniformCard } from './UniformCard';
import { UniformButton } from './UniformButton';

interface DemoEnvironmentProps {
  onStartDemo: (demoType: string) => void;
}

export const DemoEnvironment: React.FC<DemoEnvironmentProps> = ({ onStartDemo }) => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const demos = [
    {
      id: 'payment-link',
      title: 'Payment Link Demo',
      description: 'Create and share a payment link in 30 seconds',
      duration: '2 minutes',
      features: ['Wallet connection', 'Payment generation', 'QR code', 'Real-time tracking'],
      color: 'blue'
    },
    {
      id: 'ai-contract',
      title: 'AI Contract Builder',
      description: 'Generate smart contracts with natural language',
      duration: '3 minutes',
      features: ['AI generation', 'Optimization suggestions', 'Gas analysis', 'Deployment'],
      color: 'green'
    },
    {
      id: 'cross-chain-bridge',
      title: 'Cross-Chain Bridge',
      description: 'Bridge assets between multiple blockchains',
      duration: '2 minutes',
      features: ['Multi-chain support', 'Real-time prices', 'Analytics', 'Transaction tracking'],
      color: 'purple'
    },
    {
      id: 'full-demo',
      title: 'Complete Platform Demo',
      description: 'End-to-end demonstration of all features',
      duration: '5 minutes',
      features: ['All features', 'Real transactions', 'Live data', 'Professional presentation'],
      color: 'orange'
    }
  ];

  const handleStartDemo = (demoId: string) => {
    setActiveDemo(demoId);
    onStartDemo(demoId);
  };

  return (
    <Box maxW="6xl" mx="auto" p={6}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <VStack gap={4} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="#ffffff">
            🎬 Interactive Demo Environment
          </Text>
          <Text color="#9ca3af" maxW="3xl">
            Experience ChainLinkPay's powerful features with pre-configured examples and guided tours.
            Perfect for hackathon demonstrations and user onboarding.
          </Text>
        </VStack>

        {/* Demo Options */}
        <VStack gap={6} align="stretch">
          {demos.map((demo) => (
            <UniformCard key={demo.id} p={6}>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between" align="start">
                  <VStack align="start" gap={2}>
                    <HStack gap={3}>
                      <Text fontSize="lg" fontWeight="bold" color="#ffffff">
                        {demo.title}
                      </Text>
                      <Badge colorScheme={demo.color} variant="solid">
                        {demo.duration}
                      </Badge>
                    </HStack>
                    <Text color="#9ca3af" fontSize="sm">
                      {demo.description}
                    </Text>
                  </VStack>
                  
                  <UniformButton
                    onClick={() => handleStartDemo(demo.id)}
                    variant="primary"
                    size="sm"
                    isDisabled={activeDemo === demo.id}
                  >
                    {activeDemo === demo.id ? 'Running...' : 'Start Demo'}
                  </UniformButton>
                </HStack>

                {/* Features */}
                <HStack gap={2} wrap="wrap">
                  {demo.features.map((feature, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      colorScheme={demo.color}
                      fontSize="xs"
                    >
                      {feature}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </UniformCard>
          ))}
        </VStack>

        {/* Quick Actions */}
        <UniformCard p={6}>
          <VStack gap={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color="#ffffff">
              🚀 Quick Actions
            </Text>
            <HStack gap={4} wrap="wrap">
              <UniformButton
                onClick={() => onStartDemo('sample-data')}
                variant="secondary"
                size="sm"
              >
                Load Sample Data
              </UniformButton>
              <UniformButton
                onClick={() => onStartDemo('reset')}
                variant="secondary"
                size="sm"
              >
                Reset Demo
              </UniformButton>
              <UniformButton
                onClick={() => setIsOpen(!isOpen)}
                variant="secondary"
                size="sm"
              >
                {isOpen ? 'Hide' : 'Show'} Demo Tips
              </UniformButton>
            </HStack>

            {isOpen && (
              <Box
                bg="rgba(59, 130, 246, 0.1)"
                border="1px solid rgba(59, 130, 246, 0.2)"
                borderRadius="lg"
                p={4}
              >
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#3b82f6">
                    💡 Demo Tips for Hackathon Judges
                  </Text>
                  <VStack gap={2} align="stretch">
                    <Text fontSize="xs" color="#9ca3af">
                      • Start with the Payment Link demo to show simplicity
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      • Highlight AI contract generation as unique innovation
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      • Show cross-chain bridge for technical complexity
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      • Use Complete Platform Demo for full impact
                    </Text>
                    <Text fontSize="xs" color="#9ca3af">
                      • Emphasize production-ready code quality
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            )}
          </VStack>
        </UniformCard>

        {/* Status */}
        {activeDemo && (
          <UniformCard p={4}>
            <HStack justify="space-between" align="center">
              <HStack gap={3}>
                <Text fontSize="sm" color="#ffffff">
                  🎬 Active Demo:
                </Text>
                <Badge colorScheme="green" variant="solid">
                  {demos.find(d => d.id === activeDemo)?.title}
                </Badge>
              </HStack>
              <UniformButton
                onClick={() => setActiveDemo(null)}
                variant="secondary"
                size="sm"
              >
                Stop Demo
              </UniformButton>
            </HStack>
          </UniformCard>
        )}
      </VStack>
    </Box>
  );
};
