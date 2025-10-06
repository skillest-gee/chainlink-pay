import React from 'react';
import { Box, Heading, Text, Container, HStack, VStack, Badge, Button } from '@chakra-ui/react';
import PaymentLinkGenerator from '../components/PaymentLinkGenerator';
import DemoBar from '../components/DemoBar';
import { useStacksWallet } from '../hooks/useStacksWallet';

export default function Home() {
  const { isAuthenticated, connect, address } = useStacksWallet();
  
  console.log('Home component - isAuthenticated:', isAuthenticated, 'address:', address);
  
  return (
    <Container maxW="6xl" py={10}>
      <VStack gap={8} align="stretch">
        {/* Hero Section */}
            <VStack gap={6} textAlign="center" py={8}>
              <Heading size="3xl" color="blue.600" fontWeight="bold">
                ChainLinkPay
              </Heading>
              <Text fontSize="xl" color="gray.600" maxW="700px" fontWeight="500">
                Create Bitcoin payment links in seconds. Send invoices, get paid instantly.
              </Text>
              <Text fontSize="lg" color="gray.500" maxW="600px">
                Perfect for freelancers, businesses, and anyone who wants to accept Bitcoin payments easily.
              </Text>
              <HStack gap={4} wrap="wrap" justify="center">
                <Badge colorScheme="blue" fontSize="md" px={4} py={2} borderRadius="full" fontWeight="semibold">
                  ⚡ Instant Payments
                </Badge>
                <Badge colorScheme="green" fontSize="md" px={4} py={2} borderRadius="full" fontWeight="semibold">
                  🔗 Shareable Links
                </Badge>
                <Badge colorScheme="purple" fontSize="md" px={4} py={2} borderRadius="full" fontWeight="semibold">
                  🤖 AI Smart Contracts
                </Badge>
              </HStack>
            </VStack>

            {/* Testnet Token Faucet */}
            <Box bg="orange.50" borderColor="orange.200" borderWidth="2px" borderRadius="xl" p={6} shadow="lg">
              <VStack gap={4}>
                <HStack gap={3}>
                  <Text fontSize="2xl">🚰</Text>
                  <Text fontSize="lg" fontWeight="bold" color="orange.700">
                    Need Testnet Tokens?
                  </Text>
                </HStack>
                <Text fontSize="md" color="orange.600" textAlign="center">
                  Get free testnet STX tokens to try the app. Click the button below to get tokens from the faucet.
                </Text>
                <Button 
                  colorScheme="orange" 
                  size="lg"
                  onClick={() => window.open('https://explorer.hiro.so/sandbox/faucet?chain=testnet', '_blank')}
                  fontWeight="bold"
                >
                  🚰 Get Testnet Tokens
                </Button>
              </VStack>
            </Box>

            {/* Demo Bar */}
            <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" p={8} shadow="lg">
              <VStack gap={6}>
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  Try our demo features
                </Text>
                <DemoBar />
              </VStack>
            </Box>

        {/* Features Grid */}
        <VStack gap={6} align="stretch">
          <HStack gap={6} wrap="wrap" justify="center">
            <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" w={{ base: "100%", sm: "320px" }} cursor="pointer" _hover={{ borderColor: "blue.400", transform: "translateY(-4px)", shadow: "xl" }} transition="all 0.3s" p={{ base: 6, md: 8 }} textAlign="center" title="Generate payment links in seconds with AI assistance" shadow="md">
              <Text fontSize={{ base: "4xl", md: "5xl" }} mb={4}>🔗</Text>
              <Heading size="md" mb={3} color="blue.600">Payment Links</Heading>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600" fontWeight="500" mb={3}>
                Create shareable links for Bitcoin payments. Send to customers via email, text, or social media.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Like PayPal, but for Bitcoin
              </Text>
            </Box>

            <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" w={{ base: "100%", sm: "320px" }} cursor="pointer" _hover={{ borderColor: "blue.400", transform: "translateY(-4px)", shadow: "xl" }} transition="all 0.3s" p={{ base: 6, md: 8 }} textAlign="center" title="Use natural language to generate smart contracts" shadow="md">
              <Text fontSize={{ base: "4xl", md: "5xl" }} mb={4}>🤖</Text>
              <Heading size="md" mb={3} color="blue.600">AI Contract Builder</Heading>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600" fontWeight="500" mb={3}>
                Describe what you want in plain English. AI generates the smart contract code for you.
              </Text>
              <Text fontSize="sm" color="gray.500">
                No coding required
              </Text>
            </Box>

            <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" w={{ base: "100%", sm: "320px" }} cursor="pointer" _hover={{ borderColor: "blue.400", transform: "translateY(-4px)", shadow: "xl" }} transition="all 0.3s" p={{ base: 6, md: 8 }} textAlign="center" title="Bridge Bitcoin to other blockchain networks" shadow="md">
              <Text fontSize={{ base: "4xl", md: "5xl" }} mb={4}>🌉</Text>
              <Heading size="md" mb={3} color="blue.600">Cross-Chain Bridge</Heading>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600" fontWeight="500" mb={3}>
                Send Bitcoin to Ethereum, Polygon, and other networks. Use your Bitcoin in DeFi.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Bitcoin everywhere
              </Text>
            </Box>
          </HStack>
        </VStack>

        {/* How it Works */}
        <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" p={{ base: 6, md: 8 }} shadow="lg">
          <VStack gap={6}>
            <Heading size="lg" color="blue.600" textAlign="center">How It Works</Heading>
            <VStack gap={6} align="stretch">
              <HStack gap={{ base: 4, md: 8 }} wrap="wrap" justify="center">
                <VStack gap={3} w={{ base: "100%", sm: "200px" }} textAlign="center">
                  <Text fontSize={{ base: "3xl", md: "4xl" }}>1️⃣</Text>
                  <Text fontWeight="bold" color="blue.600" fontSize={{ base: "sm", md: "md" }}>Connect Wallet</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Link your Stacks wallet to get started</Text>
                </VStack>
                <VStack gap={3} w={{ base: "100%", sm: "200px" }} textAlign="center">
                  <Text fontSize={{ base: "3xl", md: "4xl" }}>2️⃣</Text>
                  <Text fontWeight="bold" color="blue.600" fontSize={{ base: "sm", md: "md" }}>Create Link</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Enter amount and description</Text>
                </VStack>
                <VStack gap={3} w={{ base: "100%", sm: "200px" }} textAlign="center">
                  <Text fontSize={{ base: "3xl", md: "4xl" }}>3️⃣</Text>
                  <Text fontWeight="bold" color="blue.600" fontSize={{ base: "sm", md: "md" }}>Share & Get Paid</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">Send link to customers, receive Bitcoin</Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Payment Generator */}
        <Box bg="white" borderColor="blue.200" borderWidth="2px" borderRadius="xl" p={{ base: 4, md: 8 }} shadow="lg">
          <VStack gap={6}>
            <VStack gap={3}>
              <Heading size="lg" color="blue.600" textAlign="center">Create Your First Payment</Heading>
              {!isAuthenticated ? (
                <Text color="gray.600" textAlign="center" fontSize={{ base: "md", md: "lg" }} fontWeight="500">
                  Connect your wallet and generate a payment link in seconds
                </Text>
              ) : (
                <Text color="gray.600" textAlign="center" fontSize={{ base: "md", md: "lg" }} fontWeight="500">
                  Generate a payment link in seconds
                </Text>
              )}
            </VStack>
            {isAuthenticated ? (
              <PaymentLinkGenerator />
            ) : (
              <VStack gap={4} p={6} bg="gray.50" borderRadius="lg" borderWidth="2px" borderColor="gray.200">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  🔗 Connect Your Wallet First
                </Text>
                <Text color="gray.600" textAlign="center">
                  You need to connect your Stacks wallet to create payment links and access all features.
                </Text>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={() => {
                    console.log('Connect wallet button clicked');
                    connect();
                  }}
                  fontWeight="semibold"
                >
                  Connect Wallet
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

