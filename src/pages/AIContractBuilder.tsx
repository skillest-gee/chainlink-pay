import React, { useState, useRef } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Button, Textarea, Badge, AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription, Code, Collapsible, useDisclosure } from '@chakra-ui/react';
import { useToast } from '../hooks/useToast';
import { UniformButton } from '../components/UniformButton';
import { UniformTextarea } from '../components/UniformInput';
import { UniformCard } from '../components/UniformCard';
import { aiService, AIContractRequest, AIContractResponse, ContractValidation } from '../services/aiService';
import { contractDeployer, DeploymentResult } from '../utils/contractDeployer';
import { useStacksWallet } from '../hooks/useStacksWallet';

export default function AIContractBuilder() {
  const { toast } = useToast();
  const { isAuthenticated, userSession, walletProvider } = useStacksWallet();
  const { open: showSuggestions, onToggle: toggleSuggestions } = useDisclosure();
  const { open: showValidation, onToggle: toggleValidation } = useDisclosure();
  
  // Form state with persistence
  const [request, setRequest] = useState(() => {
    return localStorage.getItem('ai-builder-request') || '';
  });
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('ai-builder-template') || 'payment';
  });
  const [requirements, setRequirements] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai-builder-requirements');
    return saved ? JSON.parse(saved) : [];
  });
  const [newRequirement, setNewRequirement] = useState('');
  
  // AI state with persistence
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Results state with persistence
  const [aiResponse, setAiResponse] = useState<AIContractResponse | null>(() => {
    const saved = localStorage.getItem('ai-builder-response');
    return saved ? JSON.parse(saved) : null;
  });
  const [validation, setValidation] = useState<ContractValidation | null>(() => {
    const saved = localStorage.getItem('ai-builder-validation');
    return saved ? JSON.parse(saved) : null;
  });
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [contractName, setContractName] = useState(() => {
    return localStorage.getItem('ai-builder-contract-name') || 'my-contract';
  });
  const [error, setError] = useState<string | null>(null);
  const [improvementFeedback, setImprovementFeedback] = useState(() => {
    return localStorage.getItem('ai-builder-feedback') || '';
  });
  // Production-ready AI Contract Builder - no test states needed
  
  // UI state with persistence
  const [activeTab, setActiveTab] = useState<'generate' | 'validate' | 'improve' | 'deploy'>(() => {
    return (localStorage.getItem('ai-builder-tab') as any) || 'generate';
  });
  const [copied, setCopied] = useState(false);

  // Save state to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('ai-builder-request', request);
  }, [request]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-template', selectedTemplate);
  }, [selectedTemplate]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-requirements', JSON.stringify(requirements));
  }, [requirements]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-response', JSON.stringify(aiResponse));
  }, [aiResponse]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-validation', JSON.stringify(validation));
  }, [validation]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-feedback', improvementFeedback);
  }, [improvementFeedback]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-tab', activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    localStorage.setItem('ai-builder-contract-name', contractName);
  }, [contractName]);

  const templates = [
    { value: 'payment', label: 'Payment Contract', description: 'Basic payment processing with escrow' },
    { value: 'escrow', label: 'Escrow Contract', description: 'Secure escrow with timeout and dispute resolution' },
    { value: 'split', label: 'Split Payment', description: 'Multi-party payment splitting and distribution' },
    { value: 'subscription', label: 'Subscription', description: 'Recurring payment system with billing cycles' },
    { value: 'custom', label: 'Custom Contract', description: 'Fully customized contract from description' }
  ];

  const handleGenerate = async () => {
    console.log('AI Contract Builder: handleGenerate called');
    console.log('Request:', request);
    console.log('Request trimmed:', request.trim());
    
    if (!request.trim()) {
      console.log('AI Contract Builder: No request provided');
      setError('Please enter a contract description');
      toast({ title: 'Error', status: 'error', description: 'Please enter a contract description' });
      return;
    }

    console.log('AI Contract Builder: Starting generation process');
    setIsGenerating(true);
    setError(null);
    setAiResponse(null);

    try {
      const aiRequest: AIContractRequest = {
        description: request,
        template: selectedTemplate,
        language: 'clarity',
        requirements: requirements.length > 0 ? requirements : undefined
      };

      console.log('AI Contract Builder: Generating contract with request:', aiRequest);
      console.log('AI Contract Builder: AI Service instance:', aiService);
      
      const response = await aiService.generateContract(aiRequest);
      console.log('AI Contract Builder: Received response:', response);
      console.log('AI Contract Builder: Contract length:', response?.contract?.length || 0);
      console.log('AI Contract Builder: Contract preview:', response?.contract?.substring(0, 100) || 'No contract');
      
      if (!response || !response.contract || response.contract.trim().length < 50) {
        console.log('AI Contract Builder: Contract validation failed');
        console.log('AI Contract Builder: Response object:', JSON.stringify(response, null, 2));
        throw new Error('No contract generated. Please try again.');
      }
      
      setAiResponse(response);
      setActiveTab('validate');
      toast({ title: 'Success', status: 'success', description: 'Contract generated successfully!' });
    } catch (err: any) {
      console.error('AI Contract Builder: Generation error:', err);
      setError(err.message || 'Failed to generate contract');
      toast({ title: 'Generation Failed', status: 'error', description: err.message || 'Failed to generate contract' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!aiResponse?.contract) {
      setError('No contract to validate');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const validationResult = await aiService.validateContract(aiResponse.contract);
      setValidation(validationResult);
      setActiveTab('validate');
      
      if (validationResult.valid) {
        toast({ title: 'Success', status: 'success', description: 'Contract validation passed!' });
      } else {
        toast({ title: 'Warning', status: 'warning', description: 'Contract validation found issues' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate contract');
      toast({ title: 'Validation Failed', status: 'error', description: err.message || 'Failed to validate contract' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImprove = async () => {
    if (!aiResponse?.contract || !improvementFeedback.trim()) {
      setError('Please provide feedback for improvement');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const improvedResponse = await aiService.improveContract(aiResponse.contract, improvementFeedback);
      setAiResponse(improvedResponse);
      setActiveTab('validate');
      toast({ title: 'Success', status: 'success', description: 'Contract improved successfully!' });
    } catch (err: any) {
      setError(err.message || 'Failed to improve contract');
      toast({ title: 'Improvement Failed', status: 'error', description: err.message || 'Failed to improve contract' });
    } finally {
      setIsImproving(false);
    }
  };

  const handleDeploy = async () => {
    if (!aiResponse?.contract) {
      setError('No contract to deploy');
      return;
    }

    if (!isAuthenticated) {
      setError('Please connect your wallet to deploy contracts');
      toast({ title: 'Error', status: 'error', description: 'Please connect your wallet to deploy contracts' });
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      console.log('AI Contract Builder: Starting deployment');
      console.log('Contract name:', contractName);
      console.log('Contract code length:', aiResponse.contract.length);
      console.log('Wallet provider:', walletProvider);

      // Validate contract before deployment
      const validation = contractDeployer.validateContract(aiResponse.contract, contractName);
      if (!validation.valid) {
        throw new Error(`Contract validation failed: ${validation.errors.join(', ')}`);
      }

      // Deploy contract using wallet
      const result = await contractDeployer.deployWithWallet({
        contractName,
        contractCode: aiResponse.contract,
        userSession,
        walletProvider: walletProvider || 'unknown',
        onFinish: (data: any) => {
          console.log('Deployment transaction finished:', data);
          setDeploymentResult({
            success: true,
            transactionId: data.txId,
            contractAddress: data.txId, // Will be updated when confirmed
            explorerUrl: `https://explorer.stacks.co/txid/${data.txId}`
          });
          toast({ 
            title: 'Success', 
            status: 'success', 
            description: 'Contract deployment transaction submitted!' 
          });
        },
        onCancel: () => {
          console.log('Deployment cancelled by user');
          toast({ 
            title: 'Cancelled', 
            status: 'info', 
            description: 'Contract deployment cancelled' 
          });
        }
      });

      if (result.success) {
        setDeploymentResult(result);
        setActiveTab('deploy');
        toast({ 
          title: 'Success', 
          status: 'success', 
          description: 'Contract deployment initiated successfully!' 
        });
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (err: any) {
      console.error('AI Contract Builder: Deployment error:', err);
      setError(err.message || 'Failed to deploy contract');
      toast({ title: 'Deployment Failed', status: 'error', description: err.message || 'Failed to deploy contract' });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClearAll = () => {
    // Clear all state
    setRequest('');
    setSelectedTemplate('payment');
    setRequirements([]);
    setNewRequirement('');
    setAiResponse(null);
    setValidation(null);
    setDeploymentResult(null);
    setContractName('my-contract');
    setError(null);
    setImprovementFeedback('');
    setActiveTab('generate');
    setCopied(false);
    
    // Clear localStorage
    localStorage.removeItem('ai-builder-request');
    localStorage.removeItem('ai-builder-template');
    localStorage.removeItem('ai-builder-requirements');
    localStorage.removeItem('ai-builder-response');
    localStorage.removeItem('ai-builder-validation');
    localStorage.removeItem('ai-builder-feedback');
    localStorage.removeItem('ai-builder-tab');
    localStorage.removeItem('ai-builder-contract-name');
    
    toast({ 
      title: 'Cleared', 
      status: 'info', 
      description: 'All data cleared. You can start fresh!' 
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Success', status: 'success', description: 'Contract copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Error', status: 'error', description: 'Failed to copy contract' });
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  // Production-ready AI Contract Builder - test functions removed

  // Production-ready AI Contract Builder - debug functions removed

  const handleTestGeminiDirect = async () => {
    const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!geminiKey) {
      toast({
        title: 'No API Key',
        status: 'error',
        description: 'REACT_APP_GEMINI_API_KEY not found in environment variables',
      });
      return;
    }

    try {
      const testPrompt = `Generate a simple Clarity smart contract for payments. 

IMPORTANT: Return the contract code wrapped in \`\`\`clarity code blocks like this:
\`\`\`clarity
;; Your contract code here
(define-constant CONTRACT-OWNER tx-sender)
;; ... rest of contract
\`\`\`

Do not include any explanation or additional text outside the code blocks.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: testPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      });

      console.log('Direct API test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct API test response data:', data);
        
        const contractCode = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Direct API test contract code:', contractCode);
        
        if (contractCode) {
          // Test the parsing
          const contractMatch = contractCode.match(/```clarity\n([\s\S]*?)\n```/) || 
                               contractCode.match(/```clarity\n([\s\S]*?)```/) ||
                               contractCode.match(/```\n([\s\S]*?)\n```/) ||
                               contractCode.match(/```([\s\S]*?)```/);
          
          const parsedContract = contractMatch ? contractMatch[1].trim() : contractCode;
          console.log('Direct API test parsed contract:', parsedContract);
          
          toast({
            title: 'Gemini API Working!',
            status: 'success',
            description: `Successfully generated contract (${parsedContract.length} chars)`,
          });
        } else {
          toast({
            title: 'API Response Issue',
            status: 'warning',
            description: 'Gemini API responded but no contract generated',
          });
        }
      } else {
        const errorText = await response.text();
        console.log('Direct API test error:', errorText);
        toast({
          title: 'API Error',
          status: 'error',
          description: `Gemini API error: ${response.status} ${response.statusText}`,
        });
      }
    } catch (error: any) {
      console.log('Direct API test network error:', error);
      toast({
        title: 'Network Error',
        status: 'error',
        description: `Failed to connect to Gemini API: ${error.message}`,
      });
    }
  };

  // Production-ready AI Contract Builder - comprehensive test removed

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  return (
    <Box minH="100vh" bg="#000000" color="#ffffff">
      <Container maxW="7xl" py={8} px={4}>
        <VStack gap={8} align="stretch">
          {/* Header with Innovation Showcase */}
          <VStack gap={6} textAlign="center">
            <VStack gap={4}>
              <Heading size="xl" color="#ffffff">
                🤖 AI Smart Contract Builder
              </Heading>
              <Text color="#9ca3af" maxW="3xl" fontSize="lg">
                Generate professional Clarity smart contracts using AI. Describe your requirements in natural language and get production-ready code with validation and deployment support.
              </Text>
            </VStack>
            
            {/* Feature Highlights */}
            <HStack gap={3} justify="center" wrap="wrap">
              <Badge colorScheme="blue" variant="solid" px={3} py={1} borderRadius="full">
                ✨ AI-Powered Generation
              </Badge>
              <Badge colorScheme="green" variant="solid" px={3} py={1} borderRadius="full">
                🔒 Security Validation
              </Badge>
              <Badge colorScheme="purple" variant="solid" px={3} py={1} borderRadius="full">
                🚀 Deploy Ready
              </Badge>
              <Badge colorScheme="orange" variant="solid" px={3} py={1} borderRadius="full">
                📱 Mobile Optimized
              </Badge>
            </HStack>
            
            {/* Innovation Showcase */}
            <Box 
              bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)"
              border="1px solid rgba(59, 130, 246, 0.2)"
              borderRadius="xl"
              p={6}
              maxW="4xl"
            >
              <VStack gap={3}>
                <Heading size="md" color="#3b82f6">
                  🏆 Hackathon Innovation
                </Heading>
                <Text fontSize="sm" color="#9ca3af" textAlign="center">
                  First-of-its-kind AI-powered Clarity smart contract generator. 
                  Transform natural language into production-ready Stacks blockchain contracts.
                </Text>
                <HStack gap={2} wrap="wrap" justify="center">
                  <Text fontSize="xs" color="#10b981">✓ Gemini AI Integration</Text>
                  <Text fontSize="xs" color="#10b981">✓ Clarity Syntax Validation</Text>
                  <Text fontSize="xs" color="#10b981">✓ Security Analysis</Text>
                  <Text fontSize="xs" color="#10b981">✓ Template Library</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>

          {/* Main Content */}
          <VStack gap={6} align="stretch">
            {/* Contract Generation Form */}
            <UniformCard p={{ base: 4, md: 6 }}>
              <VStack gap={6} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="md" color="#ffffff">
                    Contract Requirements
                  </Heading>
                  <HStack gap={2}>
                    <Badge colorScheme={isAuthenticated ? 'green' : 'red'} fontSize="sm">
                      {isAuthenticated ? `🔗 ${walletProvider === 'xverse' ? 'Xverse' : walletProvider === 'leather' ? 'Leather' : 'Wallet'} Connected` : '🔌 Wallet Not Connected'}
                    </Badge>
                    {isAuthenticated && (
                      <Badge colorScheme="blue" fontSize="sm">
                        Ready to Deploy
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                {/* Template Selection */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Contract Template
                  </Text>
                          <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
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
                    {templates.map((template) => (
                      <option key={template.value} value={template.value} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                        {template.label} - {template.description}
                      </option>
                    ))}
                          </select>
                </VStack>

                {/* Contract Name */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Contract Name
                  </Text>
                  <input
                    type="text"
                    placeholder="my-contract"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                </VStack>

                {/* Natural Language Description */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Describe Your Contract
                  </Text>
                  <UniformTextarea
                    placeholder="Describe what your contract should do in detail (e.g., 'Create a payment contract that handles escrow transactions with a 3-day timeout, dispute resolution, and automatic release')"
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    rows={4}
                    variant="default"
                    fontSize="md"
                  />
                </VStack>

                {/* Additional Requirements */}
                <VStack gap={3} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                    Additional Requirements (Optional)
                  </Text>
                  <HStack gap={2}>
                    <UniformTextarea
                      placeholder="Add specific requirement..."
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      rows={1}
                      variant="default"
                      flex="1"
                    />
                    <UniformButton
                      variant="secondary"
                      onClick={addRequirement}
                      disabled={!newRequirement.trim()}
                    >
                      Add
                    </UniformButton>
                  </HStack>
                  
                  {requirements.length > 0 && (
                    <VStack gap={2} align="stretch">
                      {requirements.map((req, index) => (
                        <HStack key={index} justify="space-between" p={2} bg="rgba(255, 255, 255, 0.05)" borderRadius="md">
                          <Text fontSize="sm" color="#ffffff">{req}</Text>
                          <Button
                            size="sm"
                            variant="ghost"
                            color="#ef4444"
                            onClick={() => removeRequirement(index)}
                          >
                            Remove
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>

                {/* Action Buttons */}
                <HStack gap={3} justify="center" wrap="wrap">
                  <UniformButton
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={!request.trim() || isGenerating}
                    size="lg"
                  >
                    {isGenerating ? 'Generating Contract...' : 'Generate Contract with AI'}
                  </UniformButton>
                  
                  {/* Production-ready AI Contract Builder - test AI button removed */}
                  
                  <UniformButton
                    variant="secondary"
                    onClick={() => {
                      setRequest('Create a simple payment contract that allows users to send STX tokens');
                      toast({ title: 'Info', status: 'info', description: 'Sample request loaded. Click Generate Contract to test.' });
                    }}
                    size="sm"
                  >
                    Load Sample
                  </UniformButton>
                  
                  <UniformButton
                    variant="secondary"
                    onClick={handleClearAll}
                    size="sm"
                  >
                    Clear All
                  </UniformButton>
                  
                  {/* Production-ready AI Contract Builder - test buttons removed */}
                </HStack>

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
              </VStack>
            </UniformCard>

            {/* AI Response */}
            {aiResponse && (
              <UniformCard p={6}>
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Generated Contract
                    </Heading>
                    <HStack gap={2}>
                      <Badge colorScheme="green" fontSize="sm">AI Generated</Badge>
                      <UniformButton
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(aiResponse.contract)}
                        disabled={copied}
                      >
                        {copied ? 'Copied!' : 'Copy Code'}
                      </UniformButton>
                    </HStack>
                  </HStack>

                  {/* Contract Explanation */}
                  {aiResponse.explanation && (
                    <Box p={4} bg="rgba(59, 130, 246, 0.1)" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)" borderRadius="lg">
                      <Text fontSize="sm" color="#3b82f6" fontWeight="medium" mb={2}>
                        AI Explanation:
                      </Text>
                      <Text fontSize="sm" color="#ffffff">
                        {aiResponse.explanation}
                      </Text>
                    </Box>
                  )}

                  {/* Contract Code */}
                  <Box p={4} bg="#0a0a0a" borderRadius="lg" border="1px solid" borderColor="rgba(255, 255, 255, 0.1)">
                    <Code
                      as="pre"
                      fontSize="sm"
                      color="#ffffff"
                      fontFamily="mono"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                      display="block"
                      p={0}
                      bg="transparent"
                    >
                      {aiResponse.contract}
                    </Code>
                  </Box>

                  {/* AI Suggestions */}
                  {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                    <Box>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSuggestions}
                        color="#3b82f6"
                        mb={2}
                      >
                        {showSuggestions ? 'Hide' : 'Show'} AI Suggestions ({aiResponse.suggestions.length})
                      </Button>
                      <Collapsible.Root open={showSuggestions}>
                        <Collapsible.Content>
                          <VStack gap={2} align="stretch">
                            {aiResponse.suggestions.map((suggestion, index) => (
                              <Box key={index} p={3} bg="rgba(59, 130, 246, 0.1)" borderRadius="md">
                                <Text fontSize="sm" color="#ffffff">
                                  💡 {suggestion}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <HStack gap={3} justify="center" wrap="wrap">
                    <UniformButton
                      variant="secondary"
                      onClick={handleValidate}
                      disabled={isValidating}
                    >
                      {isValidating ? 'Validating...' : 'Validate Contract'}
                    </UniformButton>

                    <UniformButton
                      variant="accent"
                      onClick={() => setActiveTab('improve')}
                    >
                      Improve Contract
                    </UniformButton>

                    <UniformButton
                      variant="primary"
                      onClick={handleDeploy}
                      loading={isDeploying}
                      disabled={!isAuthenticated || !aiResponse?.contract}
                    >
                      {!isAuthenticated ? 'Connect Wallet to Deploy' : 
                       isDeploying ? 'Deploying...' : 
                       `Deploy Contract (${contractDeployer.getDeploymentCostEstimate(aiResponse?.contract || '').stxFee})`}
                    </UniformButton>
                  </HStack>
                </VStack>
              </UniformCard>
            )}

            {/* Contract Validation */}
            {validation && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Contract Validation
                    </Heading>
                    <Badge colorScheme={validation.valid ? 'green' : 'red'} fontSize="sm">
                      {validation.valid ? 'Valid' : 'Issues Found'}
                    </Badge>
                  </HStack>

                  {validation.errors.length > 0 && (
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="#ef4444">
                        Errors ({validation.errors.length}):
                      </Text>
                      {validation.errors.map((error, index) => (
                        <Box key={index} p={3} bg="rgba(239, 68, 68, 0.1)" borderRadius="md">
                          <Text fontSize="sm" color="#ef4444">
                            ❌ {error}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {validation.warnings.length > 0 && (
                    <VStack gap={2} align="stretch">
                      <Text fontSize="sm" fontWeight="medium" color="#f59e0b">
                        Warnings ({validation.warnings.length}):
                      </Text>
                      {validation.warnings.map((warning, index) => (
                        <Box key={index} p={3} bg="rgba(245, 158, 11, 0.1)" borderRadius="md">
                          <Text fontSize="sm" color="#f59e0b">
                            ⚠️ {warning}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {validation.valid && (
                    <Box p={4} bg="rgba(16, 185, 129, 0.1)" border="1px solid" borderColor="rgba(16, 185, 129, 0.3)" borderRadius="lg">
                      <Text fontSize="sm" color="#10b981" fontWeight="medium">
                        ✅ Contract validation passed! The contract is ready for deployment.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </UniformCard>
            )}

            {/* Contract Improvement */}
            {activeTab === 'improve' && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <Heading size="md" color="#ffffff">
                    Improve Contract
                  </Heading>
                  
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                      Provide feedback for improvement:
                    </Text>
                    <UniformTextarea
                      placeholder="Describe what you'd like to improve (e.g., 'Add more security checks', 'Improve error handling', 'Add more documentation')"
                      value={improvementFeedback}
                      onChange={(e) => setImprovementFeedback(e.target.value)}
                      rows={3}
                      variant="default"
                    />
                  </VStack>

                  <HStack gap={3} justify="center">
                    <UniformButton
                      variant="secondary"
                      onClick={() => setActiveTab('validate')}
                    >
                      Cancel
                    </UniformButton>
                    <UniformButton
                      variant="primary"
                      onClick={handleImprove}
                      disabled={!improvementFeedback.trim() || isImproving}
                    >
                      {isImproving ? 'Improving...' : 'Improve Contract'}
                    </UniformButton>
                  </HStack>
                </VStack>
              </UniformCard>
            )}

            {/* Test Results - Removed for simplified testing */}

            {/* Deployment Results */}
            {deploymentResult && (
              <UniformCard p={6}>
                <VStack gap={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="#ffffff">
                      Deployment Results
                    </Heading>
                    <Badge colorScheme={deploymentResult.success ? 'green' : 'red'} fontSize="sm">
                      {deploymentResult.success ? 'Success' : 'Failed'}
                    </Badge>
                  </HStack>

                  {deploymentResult.success ? (
                    <VStack gap={4} align="stretch">
                      <Box p={4} bg="rgba(16, 185, 129, 0.1)" border="1px solid" borderColor="rgba(16, 185, 129, 0.3)" borderRadius="lg">
                        <Text fontSize="sm" color="#10b981" fontWeight="medium" mb={2}>
                          ✅ Contract deployment initiated successfully!
                        </Text>
                        <Text fontSize="sm" color="#ffffff">
                          Your contract is being deployed to the Stacks blockchain. This may take a few minutes to confirm.
                        </Text>
                      </Box>

                      {deploymentResult.transactionId && (
                        <VStack gap={2} align="stretch">
                          <Text fontSize="sm" fontWeight="medium" color="#ffffff">
                            Transaction Details:
                          </Text>
                          <Box p={3} bg="rgba(255, 255, 255, 0.05)" borderRadius="md">
                            <Text fontSize="sm" color="#9ca3af">
                              Transaction ID: {deploymentResult.transactionId}
                            </Text>
                            {deploymentResult.contractAddress && (
                              <Text fontSize="sm" color="#9ca3af">
                                Contract Address: {deploymentResult.contractAddress}
                              </Text>
                            )}
                          </Box>
                        </VStack>
                      )}

                      {deploymentResult.explorerUrl && (
                        <HStack gap={3} justify="center">
                          <UniformButton
                            variant="secondary"
                            onClick={() => window.open(deploymentResult.explorerUrl, '_blank')}
                          >
                            View on Explorer
                          </UniformButton>
                          <UniformButton
                            variant="primary"
                            onClick={() => copyToClipboard(aiResponse?.contract || '')}
                          >
                            Copy Contract Code
                          </UniformButton>
                        </HStack>
                      )}
                    </VStack>
                  ) : (
                    <Box p={4} bg="rgba(239, 68, 68, 0.1)" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)" borderRadius="lg">
                      <Text fontSize="sm" color="#ef4444" fontWeight="medium" mb={2}>
                        ❌ Deployment failed
                      </Text>
                      <Text fontSize="sm" color="#ffffff">
                        {deploymentResult.error || 'An unknown error occurred during deployment.'}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </UniformCard>
            )}

            {/* How It Works */}
            <UniformCard p={6}>
              <VStack gap={4} align="stretch">
                <Heading size="md" color="#ffffff">
                  How AI Contract Builder Works
                </Heading>
                
                <VStack gap={4} align="stretch">
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">1</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Describe Your Contract</Text>
                      <Text fontSize="sm" color="#9ca3af">Tell us what your contract should do in plain English. Be specific about features, security requirements, and business logic.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">2</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">AI Generation</Text>
                      <Text fontSize="sm" color="#9ca3af">Our AI analyzes your requirements and generates professional Clarity code with proper security, error handling, and documentation.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">3</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Validation & Improvement</Text>
                      <Text fontSize="sm" color="#9ca3af">Validate the contract syntax, review AI suggestions, and request improvements based on your feedback.</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack gap={4} align="start">
                    <Box w="40px" h="40px" bg="#3b82f6" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                      <Text fontSize="lg" fontWeight="bold">4</Text>
                    </Box>
                    <VStack align="start" gap={1}>
                      <Text fontSize="md" fontWeight="medium" color="#ffffff">Deploy to Blockchain</Text>
                      <Text fontSize="sm" color="#9ca3af">Deploy your validated contract to the Stacks blockchain with transaction tracking and explorer links.</Text>
                    </VStack>
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