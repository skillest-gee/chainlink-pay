import React from 'react';
import { Box, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { UniformCard } from './UniformCard';
import { UniformButton } from './UniformButton';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: "Connect Your Wallet",
      description: "Connect your Xverse or Leather wallet to start using ChainLinkPay",
      icon: "🔗"
    },
    {
      title: "Create Payment Links",
      description: "Generate shareable payment links in seconds with QR codes",
      icon: "💳"
    },
    {
      title: "AI Contract Builder",
      description: "Generate smart contracts using natural language with AI",
      icon: "🤖"
    },
    {
      title: "Cross-Chain Bridge",
      description: "Bridge assets between Bitcoin, Stacks, Ethereum, and more",
      icon: "🌉"
    }
  ];

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.8)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <UniformCard maxW="2xl" w="full" p={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Text fontSize="xl" fontWeight="bold" color="#ffffff">
                🎯 Welcome to ChainLinkPay
              </Text>
              <Text fontSize="sm" color="#9ca3af">
                Your AI-powered Bitcoin payment platform
              </Text>
            </VStack>
            <UniformButton
              onClick={onClose}
              variant="secondary"
              size="sm"
            >
              ✕
            </UniformButton>
          </HStack>

          {/* Features */}
          <VStack gap={4} align="stretch">
            <Text fontSize="lg" fontWeight="medium" color="#ffffff">
              🚀 Key Features
            </Text>
            {steps.map((step, index) => (
              <HStack key={index} gap={4} align="start">
                <Box
                  w={12}
                  h={12}
                  bg="rgba(59, 130, 246, 0.1)"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xl"
                >
                  {step.icon}
                </Box>
                <VStack align="start" gap={1} flex={1}>
                  <Text fontSize="md" fontWeight="medium" color="#ffffff">
                    {step.title}
                  </Text>
                  <Text fontSize="sm" color="#9ca3af">
                    {step.description}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>

          {/* Quick Start */}
          <Box
            bg="rgba(16, 185, 129, 0.1)"
            border="1px solid rgba(16, 185, 129, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={3} align="stretch">
              <Text fontSize="md" fontWeight="medium" color="#10b981">
                🎬 Quick Start Guide
              </Text>
              <VStack gap={2} align="stretch">
                <Text fontSize="sm" color="#9ca3af">
                  1. Connect your wallet using the button in the top right
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  2. Try creating a payment link from the dashboard
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  3. Explore the AI contract builder for smart contracts
                </Text>
                <Text fontSize="sm" color="#9ca3af">
                  4. Use the bridge to move assets between chains
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Hackathon Info */}
          <Box
            bg="rgba(255, 193, 7, 0.1)"
            border="1px solid rgba(255, 193, 7, 0.2)"
            borderRadius="lg"
            p={4}
          >
            <VStack gap={2} align="center">
              <Badge colorScheme="yellow" variant="solid" fontSize="sm">
                🏆 Stacks Vibe Coding Hackathon
              </Badge>
              <Text fontSize="sm" color="#9ca3af" textAlign="center">
                Built with AI-powered smart contract generation and cross-chain bridge technology
              </Text>
            </VStack>
          </Box>

          {/* Actions */}
          <HStack gap={3} justify="center">
            <UniformButton
              onClick={onClose}
              variant="primary"
              size="md"
            >
              Get Started
            </UniformButton>
          </HStack>
        </VStack>
      </UniformCard>
    </Box>
  );
};

export default TutorialModal;
