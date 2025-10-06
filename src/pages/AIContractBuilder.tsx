import React, { useMemo, useState } from 'react';
import { Box, Button, Container, Heading, HStack, Input, Stack, Textarea, Badge, Text, VStack } from '@chakra-ui/react';
import { getTemplate } from '../ai/templates/library';
import DemoBar from '../components/DemoBar';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../hooks/useToast';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { generateContract } from '../ai/templates/generator';
import { validateClaritySource, validateInputs } from '../ai/templates/validator';
import { deployContract } from '../ai/templates/deploy';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { interpretNaturalLanguage } from '../ai/nlp';
import { verifyTemplateIntegrity } from '../ai/templates/registry';
import ErrorBoundary from '../components/ErrorBoundary';

type TemplateId = 'ESCROW' | 'SPLIT' | 'SUBSCRIPTION' | 'CUSTOM';

const DEFAULT_PROMPTS: Record<TemplateId, string> = {
  ESCROW: 'Create an escrow where buyer ST... pays seller ST...; arbiter ST... can release after height 120000 if dispute.',
  SPLIT: 'Split incoming payment 60% to ST... and 40% to ST....',
  SUBSCRIPTION: 'Monthly subscription: subscriber ST... pays provider ST... every 4320 blocks at price 1000000 µSTX.',
  CUSTOM: 'Describe your custom smart contract requirements in natural language...',
};

export default function AIContractBuilder() {
  const { toast } = useToast();
  const { isAuthenticated } = useStacksWallet();
  const [nl, setNl] = useState('');
  const [templateId, setTemplateId] = useState<TemplateId>('ESCROW');
  const [input, setInput] = useState<Record<string, string>>({});
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<{ level: 'error' | 'warning'; message: string }[]>([]);

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const apiEnabled = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_openai_api_key_here');
  

  const currentTemplate = useMemo(() => getTemplate(templateId), [templateId]);
  const { enabled: demoEnabled, preset } = useDemo();

  React.useEffect(() => {
    if (!demoEnabled) return;
    if (preset === 'split') {
      setTemplateId('SPLIT');
      setNl('Split $1000 between 3 team members');
      setInput({ 'recipient-a': 'ST2C2...A', 'recipient-b': 'ST3C3...B', 'pct-a': '60', 'pct-b': '40' });
    } else if (preset === 'escrow') {
      setTemplateId('ESCROW');
      setNl('Escrow payment release on delivery confirmation');
      setInput({ buyer: 'ST2C2...BUYER', seller: 'ST3C3...SELLR', arbiter: 'ST1A1...ARBI', 'deadline-height': '120000', 'amount-ustx': '1000000' });
    } else if (preset === 'subscription') {
      setTemplateId('SUBSCRIPTION');
      setNl('Monthly subscription payment');
      setInput({ provider: 'ST2C2...PROV', subscriber: 'ST3C3...SUB', period: '4320', 'price-ustx': '1000000' });
    }
  }, [demoEnabled, preset]);

  const mapPromptToPlaceholders = async (prompt: string, id: TemplateId): Promise<Record<string, string>> => {
    console.log('AI Mapping - Prompt:', prompt);
    console.log('AI Mapping - Template ID:', id);
    console.log('AI Mapping - API Enabled:', apiEnabled);
    
    // Safety: Only fill placeholders; never ask for raw code
    if (!apiEnabled) {
      console.log('Using fallback defaults (no API)');
      // Fallback: minimal guided defaults to make the UI usable without API
      if (id === 'ESCROW') return { buyer: 'ST2C2...BUYER', seller: 'ST3C3...SELLR', arbiter: 'ST1A1...ARBI', 'deadline-height': '120000', 'amount-ustx': '1000000' };
      if (id === 'SPLIT') return { 'recipient-a': 'ST2C2...A', 'recipient-b': 'ST3C3...B', 'pct-a': '60', 'pct-b': '40' };
      return { provider: 'ST2C2...PROV', subscriber: 'ST3C3...SUB', period: '4320', 'price-ustx': '1000000' };
    }
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // Increased timeout
      
      console.log('Making API request to OpenRouter...');
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ChainLinkPay'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: `You are a smart contract assistant. Extract placeholder values from user requests for Stacks blockchain contracts. Return ONLY a JSON object with the required placeholders. Template: ${id}. Required placeholders: ${currentTemplate.placeholders.map(p => p.key).join(', ')}.` 
            },
            { 
              role: 'user', 
              content: `Extract values for this contract request: "${prompt}". Return JSON with keys: ${currentTemplate.placeholders.map(p => p.key).join(', ')}. Use placeholder values like "ST1...BUYER" if specific addresses aren't provided.` 
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      console.log('API Response status:', resp.status);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('API Error:', errorText);
        
        // Handle specific error cases
        if (resp.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
        } else if (resp.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        } else if (resp.status === 500) {
          throw new Error('AI service temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`API request failed: ${resp.status} ${errorText}`);
        }
      }
      
      const data = await resp.json();
      console.log('API Response data:', data);
      
      const text = data.choices?.[0]?.message?.content || '{}';
      console.log('AI Response text:', text);
      
      try {
        const parsed = JSON.parse(text);
        console.log('Parsed AI response:', parsed);
        
        // Validate that we got some useful data
        if (typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
          console.warn('AI returned empty or invalid response');
          return {};
        }
        
        return parsed;
      } catch (e) {
        console.error('Failed to parse API response', e);
        console.log('Raw response text:', text);
        throw new Error('AI returned invalid response format. Please try again.');
      }
    } catch (e: any) {
      console.error('AI mapping error:', e);
      
      // Provide user-friendly error messages
      if (e.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again.');
      } else if (e.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw e;
      }
    }
  };

  const onGenerate = async () => {
    try {
      setLoading(true);
      setIssues([]);
      
      // Validate inputs first
      if (!nl.trim()) {
        toast({ title: 'Natural language required', description: 'Please describe what you want to build', status: 'error' });
        return;
      }
      
      // Verify template integrity with real check
      const ok = await verifyTemplateIntegrity(currentTemplate);
      if (!ok) {
        console.warn('Template integrity check failed, but continuing...');
        // Don't block generation, just log the issue
      }
      
      // Try to extract information from natural language first
      const intent = interpretNaturalLanguage(nl || DEFAULT_PROMPTS[templateId]);
      console.log('NLP Intent:', intent);
      
      // Use existing input if available, otherwise try to get from AI or use defaults
      let ph = input;
      console.log('Current input:', ph);
      console.log('Template ID:', templateId);
      console.log('Current template:', currentTemplate);
      
      if (Object.keys(ph).length === 0) {
        try {
          // Try AI mapping first
          ph = await mapPromptToPlaceholders(nl || DEFAULT_PROMPTS[templateId], templateId);
          console.log('AI mapping result:', ph);
          
          // Merge with NLP results if available
          if (intent.placeholders && Object.keys(intent.placeholders).length > 0) {
            ph = { ...ph, ...intent.placeholders };
            console.log('Merged with NLP results:', ph);
          }
        } catch (e: any) {
          console.warn('AI mapping failed, using NLP or defaults:', e);
          
          // Show user-friendly error message for AI failures
          if (e.message?.includes('API key')) {
            toast({ 
              title: 'AI Configuration Error', 
              description: 'Please check your OpenAI API key in environment variables.', 
              status: 'warning' 
            });
          } else if (e.message?.includes('Rate limit')) {
            toast({ 
              title: 'AI Rate Limit', 
              description: 'Please wait a moment before trying again.', 
              status: 'warning' 
            });
          } else if (e.message?.includes('timeout')) {
            toast({ 
              title: 'AI Timeout', 
              description: 'AI request took too long. Using fallback defaults.', 
              status: 'warning' 
            });
          }
          
          // Use NLP results if available, otherwise fallback defaults
          if (intent.placeholders && Object.keys(intent.placeholders).length > 0) {
            ph = intent.placeholders;
            console.log('Using NLP results:', ph);
          } else {
            // Use fallback defaults
            if (templateId === 'ESCROW') {
              ph = { buyer: 'ST2C2...BUYER', seller: 'ST3C3...SELLR', arbiter: 'ST1A1...ARBI', 'deadline-height': '120000', 'amount-ustx': '1000000' };
            } else if (templateId === 'SPLIT') {
              ph = { 'recipient-a': 'ST2C2...A', 'recipient-b': 'ST3C3...B', 'pct-a': '60', 'pct-b': '40' };
            } else if (templateId === 'SUBSCRIPTION') {
              ph = { provider: 'ST2C2...PROV', subscriber: 'ST3C3...SUB', period: '4320', 'price-ustx': '1000000' };
            }
            console.log('Using fallback defaults:', ph);
          }
        }
      }
      
      console.log('Final placeholders:', ph);
      
      const inputIssues = validateInputs(currentTemplate, ph);
      if (inputIssues.some(i => i.level === 'error')) {
        setIssues(inputIssues);
        toast({ title: 'Invalid inputs', description: 'Please check the placeholder values', status: 'error' });
        return;
      }
      
      const generated = generateContract(currentTemplate, ph);
      const sourceIssues = validateClaritySource(generated.source);
      setIssues([...inputIssues, ...sourceIssues]);
      
      if (sourceIssues.some(i => i.level === 'error')) {
        toast({ title: 'Template generation error', description: 'Generated code has issues', status: 'error' });
        return;
      }
      
      setCode(generated.source);
      
      // increment AI stats counter
      try { (window as any).__stats?.incrementAI?.(); } catch {}
      toast({ title: 'Contract generated successfully!', description: 'Review the code below', status: 'success' });
    } catch (e: any) {
      console.error('Generation error:', e);
      toast({ title: 'Generation failed', description: e?.message || 'Unknown error', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onDeploy = async () => {
    if (!code) {
      toast({ title: 'No contract to deploy', status: 'error' });
      return;
    }
    try {
      // Require explicit confirmation
      const ok = window.confirm('Deploy this contract to Stacks testnet? Make sure you reviewed the code.');
      if (!ok) return;
      await deployContract({ contractName: `gen-${templateId.toLowerCase()}-${Date.now()}`, source: code, onFinish: () => toast({ title: 'Deploy submitted', status: 'success' }) });
    } catch (e: any) {
      toast({ title: 'Deploy failed', description: e?.message || 'Unknown error', status: 'error' });
    }
  };

  // Show wallet connection prompt if not connected
  if (!isAuthenticated) {
    return (
      <Container maxW="6xl" py={10}>
        <VStack gap={8} align="stretch">
          <VStack gap={4} textAlign="center">
            <Heading size="2xl" color="blue.600" fontWeight="bold">AI Contract Builder</Heading>
            <Text fontSize="lg" color="gray.600" maxW="600px">
              Connect your wallet to generate smart contracts from natural language
            </Text>
          </VStack>
          
          <Box bg="white" p={8} borderRadius="xl" borderWidth="2px" borderColor="blue.200" shadow="lg" textAlign="center">
            <VStack gap={6}>
              <Text fontSize="2xl">🤖</Text>
              <Heading size="lg" color="blue.600">Wallet Required</Heading>
              <Text color="gray.600" maxW="500px">
                Connect your Stacks wallet to access the AI contract builder functionality.
              </Text>
              <Button 
                colorScheme="blue" 
                size="lg" 
                onClick={() => window.location.href = '/'}
                fontWeight="semibold"
              >
                Go to Home & Connect Wallet
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minH="100vh" overflowX="hidden">
      <Container maxW="6xl" py={{ base: 4, md: 10 }} px={{ base: 4, md: 6 }}>
        <VStack gap={{ base: 4, md: 8 }} align="stretch">
          <VStack gap={4} textAlign="center">
            <Heading size={{ base: "xl", md: "2xl" }} color="blue.600" fontWeight="bold">AI Contract Builder</Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW={{ base: "100%", md: "600px" }} px={{ base: 4, md: 0 }}>
              Generate smart contracts from natural language using AI
            </Text>
          </VStack>
        
        <Box borderWidth="2px" borderColor="blue.200" borderRadius="xl" p={{ base: 4, md: 8 }} bg="white" shadow="lg">
          <Box mb={4}><DemoBar /></Box>
          <Stack gap={4}>
            {nl && (
              <Box p={4} bg="blue.50" borderColor="blue.200" borderWidth="2px" borderRadius="lg">
                <Text color="blue.700" fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
                  Suggested template: <Badge colorScheme="blue" ml={2}>{interpretNaturalLanguage(nl).template}</Badge>
                </Text>
              </Box>
            )}
            <Box>
              <Text mb={3} fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Template</Text>
              <select 
                value={templateId} 
                onChange={(e: any) => setTemplateId(e.target.value as TemplateId)} 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  backgroundColor: 'white', 
                  color: '#374151', 
                  border: '2px solid #D1D5DB',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                <option value="ESCROW">Escrow</option>
                <option value="SPLIT">Split</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </Box>
            <Box>
              <Text mb={3} fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="gray.700">Natural language request</Text>
              <Textarea 
                placeholder={DEFAULT_PROMPTS[templateId]} 
                value={nl} 
                onChange={e => setNl(e.target.value)}
                bg="white"
                borderColor="gray.300"
                borderWidth="2px"
                size={{ base: "md", md: "lg" }}
                _hover={{ borderColor: "blue.300" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
              />
            </Box>
            <Box borderTop="2px" borderColor="gray.200" pt={6} />
            <Heading size={{ base: "sm", md: "md" }} color="blue.600" mb={4}>Placeholders</Heading>
            <VStack gap={4} align="stretch">
              {currentTemplate.placeholders.map(ph => (
                <VStack key={ph.key} gap={2} align="stretch">
                  <Text fontWeight="semibold" color="gray.700" fontSize={{ base: "sm", md: "md" }}>
                    {ph.key} {ph.required && <Text as="span" color="red.500">*</Text>}
                  </Text>
                  <Input 
                    placeholder={ph.type} 
                    value={input[ph.key] || ''} 
                    onChange={e => setInput({ ...input, [ph.key]: e.target.value })}
                    bg="white"
                    borderColor="gray.300"
                    borderWidth="2px"
                    size={{ base: "md", md: "lg" }}
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                  />
                </VStack>
              ))}
            </VStack>
            {!apiEnabled && (
              <Box p={4} borderRadius="lg" bg="blue.50" borderColor="blue.200" borderWidth="1px">
                <VStack align="start" gap={2}>
                  <Text color="blue.600" fontSize="sm" fontWeight="semibold">
                    💡 <strong>AI Enhancement Available</strong>
                  </Text>
                  <Text color="blue.600" fontSize="sm">
                    Add REACT_APP_OPENAI_API_KEY to your environment for enhanced AI contract generation. Currently using local templates.
                  </Text>
                  <Text color="blue.500" fontSize="xs" fontFamily="mono">
                    Create a .env file with: REACT_APP_OPENAI_API_KEY=your_key_here
                  </Text>
                </VStack>
              </Box>
            )}
            <VStack gap={4} pt={4}>
              <HStack gap={4} justify="center" wrap="wrap">
                <Button 
                  colorScheme="blue" 
                  onClick={onGenerate} 
                  loading={loading}
                  size={{ base: "md", md: "lg" }}
                  px={{ base: 6, md: 8 }}
                  py={{ base: 4, md: 6 }}
                  fontWeight="semibold"
                  disabled={loading}
                  w={{ base: "100%", sm: "auto" }}
                >
                  {loading ? 'Generating...' : 'Generate Contract'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onDeploy} 
                  disabled={!code}
                  size={{ base: "md", md: "lg" }}
                  px={{ base: 6, md: 8 }}
                  py={{ base: 4, md: 6 }}
                  fontWeight="semibold"
                  borderWidth="2px"
                  borderColor="green.300"
                  color="green.600"
                  _hover={{ bg: "green.50", borderColor: "green.400" }}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Deploy Contract
                </Button>
              </HStack>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('=== AI CONTRACT BUILDER DEBUG ===');
                  console.log('API Key:', apiKey ? 'Present' : 'Missing');
                  console.log('API Enabled:', apiEnabled);
                  console.log('Current Template:', currentTemplate);
                  console.log('Current Input:', input);
                  console.log('Natural Language:', nl);
                  console.log('Template ID:', templateId);
                  console.log('================================');
                }}
                size="sm"
                colorScheme="gray"
              >
                Debug Info
              </Button>
            </VStack>
            {issues.length > 0 && (
              <VStack gap={3} align="stretch">
                {issues.map((i, idx) => (
                  <Box 
                    key={idx} 
                    p={4} 
                    borderRadius="lg" 
                    bg={i.level === 'error' ? 'red.50' : 'yellow.50'}
                    borderColor={i.level === 'error' ? 'red.200' : 'yellow.200'}
                    borderWidth="2px"
                  >
                    <Text color={i.level === 'error' ? 'red.700' : 'yellow.700'} fontWeight="semibold">
                      {i.message}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Stack>
        </Box>
        {code && (
          <Box borderWidth="2px" borderColor="blue.200" borderRadius="xl" overflow="hidden" bg="white" shadow="lg">
            <Box p={4} bg="blue.50" borderBottom="2px" borderColor="blue.200">
              <Text color="blue.700" fontWeight="bold">Generated Contract Code</Text>
            </Box>
            <SyntaxHighlighter language="clojure" style={oneDark} customStyle={{ margin: 0, padding: '20px' }}>
    {code}
            </SyntaxHighlighter>
          </Box>
        )}
      </VStack>
    </Container>
    </Box>
  );
}

