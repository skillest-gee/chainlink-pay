// AI Service for Contract Generation using Gemini AI API
export interface AIContractRequest {
  description: string;
  template: string;
  language: string;
  requirements?: string[];
}

export interface AIContractResponse {
  contract: string;
  explanation: string;
  suggestions: string[];
  errors?: string[];
  warnings?: string[];
  optimizations?: ContractOptimization[];
  gasEstimate?: GasEstimate;
  securityScore?: number;
}

export interface ContractOptimization {
  type: 'gas' | 'security' | 'performance' | 'readability';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface GasEstimate {
  deployment: number;
  averageFunction: number;
  optimization: string;
}

export interface ContractValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    // Prioritize Gemini API key
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    console.log('AI Service initialized with API key:', this.apiKey ? 'Present' : 'Missing');
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      GEMINI_KEY_LENGTH: process.env.REACT_APP_GEMINI_API_KEY?.length || 0,
      OPENAI_KEY_LENGTH: process.env.REACT_APP_OPENAI_API_KEY?.length || 0,
      ALL_ENV_KEYS: Object.keys(process.env).filter(key => key.includes('API'))
    });
    
    if (!this.apiKey) {
      console.warn('⚠️  No Gemini API key found. Please set REACT_APP_GEMINI_API_KEY environment variable.');
    }
  }

  async generateContract(request: AIContractRequest): Promise<AIContractResponse> {
    console.log('AI Service: Environment variables:', {
      GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY ? 'Present' : 'Missing',
      OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY ? 'Present' : 'Missing',
      apiKey: this.apiKey ? 'Present' : 'Missing'
    });

    if (!this.apiKey) {
      // Provide a fallback contract template
      console.log('No Gemini API key found, using fallback contract template');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('API')));
      console.log('Please set REACT_APP_GEMINI_API_KEY environment variable in Vercel deployment settings');
      return this.getFallbackContract(request);
    }

    console.log('AI Service: Generating contract with API key:', this.apiKey.substring(0, 10) + '...');

    const prompt = this.buildPrompt(request);
    
    try {
      console.log('Making Gemini API request to:', `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey.substring(0, 10)}...`);
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8000,
          topK: 40,
          topP: 0.95
        }
      };
      
      console.log('Request body:', requestBody);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('AI Service: Request timeout after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API key configuration.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Gemini API server error. Please try again later.');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.parseAIResponse(content, request);
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        console.log('Request timeout detected, using fallback contract');
        return this.getFallbackContract(request);
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('Network error detected, using fallback contract');
        return this.getFallbackContract(request);
      }
      
      if (error.message?.includes('Invalid API key') || error.message?.includes('401')) {
        console.log('API key error detected, using fallback contract');
        return this.getFallbackContract(request);
      }
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout')) {
        console.log('Fetch/timeout error detected, using fallback contract');
        return this.getFallbackContract(request);
      }
      
      // For any other error, provide fallback instead of throwing
      console.log('Unknown error detected, using fallback contract');
      return this.getFallbackContract(request);
    }
  }

  async validateContract(contract: string): Promise<ContractValidation> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY environment variable.');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic Clarity syntax validation
    if (!contract.includes('define-constant')) {
      errors.push('Contract must define at least one constant');
    }

    if (!contract.includes('define-data-var') && !contract.includes('define-map')) {
      errors.push('Contract must define data variables or maps');
    }

    if (!contract.includes('define-public') && !contract.includes('define-read-only')) {
      errors.push('Contract must define at least one public or read-only function');
    }

    // Check for proper error handling
    if (!contract.includes('ERR-')) {
      warnings.push('Consider adding error constants for better error handling');
    }

    // Check for security patterns
    if (!contract.includes('asserts!')) {
      warnings.push('Consider adding assertions for security');
    }

    // Check for proper function structure
    const lines = contract.split('\n');
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('define-public') && !trimmedLine.includes('(')) {
        errors.push(`Line ${index + 1}: Invalid function definition syntax`);
      }

      if (trimmedLine.includes('unwrap!') && !trimmedLine.includes('match')) {
        warnings.push(`Line ${index + 1}: Consider using match instead of unwrap! for better error handling`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Generate contract with AI-powered optimizations
   */
  async generateOptimizedContract(request: AIContractRequest): Promise<AIContractResponse> {
    console.log('AI Service: Generating optimized contract');
    
    // First generate the base contract
    const baseResponse = await this.generateContract(request);
    
    if (!baseResponse.contract) {
      return baseResponse;
    }
    
    // Add optimizations and analysis
    const optimizations = this.analyzeContractOptimizations(baseResponse.contract);
    const gasEstimate = this.estimateGasCosts(baseResponse.contract);
    const securityScore = this.calculateSecurityScore(baseResponse.contract);
    
    return {
      ...baseResponse,
      optimizations,
      gasEstimate,
      securityScore,
      suggestions: [
        ...baseResponse.suggestions,
        ...optimizations.map(opt => opt.suggestion)
      ]
    };
  }

  /**
   * Analyze contract for optimization opportunities
   */
  private analyzeContractOptimizations(contract: string): ContractOptimization[] {
    const optimizations: ContractOptimization[] = [];
    
    // Gas optimization analysis
    if (contract.includes('map-set') && !contract.includes('map-insert')) {
      optimizations.push({
        type: 'gas',
        title: 'Use map-insert for new entries',
        description: 'map-insert is more gas-efficient than map-set for new map entries',
        impact: 'medium',
        suggestion: 'Replace map-set with map-insert for new entries to save gas'
      });
    }
    
    // Security analysis
    if (contract.includes('tx-sender') && !contract.includes('asserts!')) {
      optimizations.push({
        type: 'security',
        title: 'Add authorization checks',
        description: 'Using tx-sender without assertions can be a security risk',
        impact: 'high',
        suggestion: 'Add proper authorization checks with asserts! for security'
      });
    }
    
    // Performance analysis
    if (contract.includes('unwrap!') && !contract.includes('match')) {
      optimizations.push({
        type: 'performance',
        title: 'Use match instead of unwrap!',
        description: 'match provides better error handling than unwrap!',
        impact: 'medium',
        suggestion: 'Replace unwrap! with match for better error handling'
      });
    }
    
    // Readability analysis
    if (!contract.includes(';;')) {
      optimizations.push({
        type: 'readability',
        title: 'Add comments for clarity',
        description: 'Comments improve code readability and maintainability',
        impact: 'low',
        suggestion: 'Add comments to explain complex logic and improve readability'
      });
    }
    
    return optimizations;
  }

  /**
   * Estimate gas costs for contract deployment and functions
   */
  private estimateGasCosts(contract: string): GasEstimate {
    const lines = contract.split('\n').length;
    const functions = (contract.match(/define-public/g) || []).length;
    const maps = (contract.match(/define-map/g) || []).length;
    const vars = (contract.match(/define-data-var/g) || []).length;
    
    // Rough estimation based on contract complexity
    const baseDeployment = 10000; // Base deployment cost
    const lineCost = lines * 10; // Cost per line
    const functionCost = functions * 1000; // Cost per function
    const dataCost = (maps + vars) * 500; // Cost per data structure
    
    const deployment = baseDeployment + lineCost + functionCost + dataCost;
    const averageFunction = Math.max(1000, deployment / Math.max(1, functions));
    
    let optimization = 'Good';
    if (deployment > 50000) {
      optimization = 'Consider reducing complexity';
    } else if (deployment < 20000) {
      optimization = 'Excellent gas efficiency';
    }
    
    return {
      deployment,
      averageFunction,
      optimization
    };
  }

  /**
   * Calculate security score for the contract
   */
  private calculateSecurityScore(contract: string): number {
    let score = 100;
    
    // Check for security best practices
    if (!contract.includes('asserts!')) score -= 20;
    if (contract.includes('unwrap!') && !contract.includes('match')) score -= 15;
    if (!contract.includes('ERR-')) score -= 10;
    if (contract.includes('tx-sender') && !contract.includes('asserts!')) score -= 25;
    if (!contract.includes('define-constant')) score -= 5;
    
    // Bonus points for good practices
    if (contract.includes('match')) score += 10;
    if (contract.includes('define-constant ERR-')) score += 15;
    if (contract.includes('asserts!')) score += 20;
    
    return Math.max(0, Math.min(100, score));
  }

  async improveContract(contract: string, feedback: string): Promise<AIContractResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY environment variable.');
    }

    const prompt = `Improve this Clarity contract based on feedback:

CONTRACT:
${contract}

FEEDBACK: ${feedback}

Return improved contract in \`\`\`clarity code blocks only.`;

    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 6000,
          }
        })
      });

      console.log('AI Service: Improve contract response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Gemini API key. Please check your REACT_APP_GEMINI_API_KEY environment variable.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Gemini API server error. Please try again later.');
        } else {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('AI Service: Improve contract response data:', data);
      console.log('AI Service: Candidates:', data.candidates);
      console.log('AI Service: First candidate:', data.candidates?.[0]);
      console.log('AI Service: Content:', data.candidates?.[0]?.content);
      console.log('AI Service: Parts:', data.candidates?.[0]?.content?.parts);

      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('AI Service: Extracted raw response:', rawResponse);
      
      if (!rawResponse) {
        console.log('AI Service: No response found');
        console.log('AI Service: Full response structure:', JSON.stringify(data, null, 2));
        
        // Check if we hit token limit
        if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          console.log('AI Service: Hit token limit, using fallback');
          return this.getFallbackContract({
            description: `Improved contract based on: ${feedback}`,
            template: 'escrow',
            language: 'clarity'
          });
        }
        
        throw new Error('No response generated. Please try again.');
      }

      // Parse the response to separate contract code from explanations
      const parsedResponse = this.parseAIResponse(rawResponse, {
        description: `Improved contract based on: ${feedback}`,
        template: 'escrow',
        language: 'clarity'
      });

      // Clean the contract code
      if (parsedResponse.contract) {
        parsedResponse.contract = this.cleanContractCode(parsedResponse.contract);
      }

      return {
        contract: parsedResponse.contract,
        explanation: parsedResponse.explanation || `Contract improved based on your feedback: ${feedback}`,
        suggestions: parsedResponse.suggestions || [
          'Review the improved contract for security',
          'Test the contract functionality',
          'Consider additional error handling'
        ]
      };
    } catch (error: any) {
      console.error('AI Service: Improve contract error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  private getDemoResponse(request: AIContractRequest): AIContractResponse {
    console.log('AI Service: Using demo mode - API key not configured');
    
    const demoContracts = {
      payment: `;; Demo Payment Contract
(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))

(define-data-var total-payments uint u0)
(define-data-var total-volume uint u0)
(define-data-var contract-owner principal tx-sender)

(define-public (create-payment (amount uint) (description (string-utf8 256)))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (var-set total-payments (+ (var-get total-payments) u1))
    (var-set total-volume (+ (var-get total-volume) amount))
    (ok true)
  )
)

(define-read-only (get-stats)
  (ok (tuple 
    (total-payments (var-get total-payments))
    (total-volume (var-get total-volume))
  ))
)`,
      escrow: `;; Demo Escrow Contract
(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-ESCROW-NOT-FOUND (err u101))

(define-data-var escrow-id uint u0)
(define-map escrows uint (tuple 
  (buyer principal)
  (seller principal)
  (amount uint)
  (status (string-utf8 20))
))

(define-public (create-escrow (seller principal) (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (var-set escrow-id (+ (var-get escrow-id) u1))
    (ok (map-set escrows (var-get escrow-id) (tuple 
      (buyer tx-sender)
      (seller seller)
      (amount amount)
      (status "pending")
    )))
  )
)`,
      custom: `;; Demo Custom Contract
(define-constant ERR-INVALID-INPUT (err u100))

(define-data-var contract-data uint u0)
(define-data-var contract-owner principal tx-sender)

(define-public (custom-function (input uint))
  (begin
    (asserts! (> input u0) ERR-INVALID-INPUT)
    (var-set contract-data input)
    (ok true)
  )
)`
    };

    const contract = demoContracts[request.template as keyof typeof demoContracts] || demoContracts.custom;
    
    return {
      contract,
      explanation: `This is a demo ${request.template} contract generated in demo mode. To use the full AI service, please configure your Gemini API key in the environment variables.`,
      suggestions: [
        'Add input validation',
        'Implement error handling',
        'Add read-only functions for data access',
        'Consider gas optimization'
      ],
      warnings: ['Demo mode - API key not configured'],
      errors: []
    };
  }

  private getDemoValidation(contract: string): ContractValidation {
    console.log('AI Service: Using demo validation - API key not configured');
    
    const errors: string[] = [];
    const warnings: string[] = ['Demo mode - API key not configured'];
    const suggestions: string[] = [
      'Configure Gemini API key for full validation',
      'Add input validation to functions',
      'Implement proper error handling',
      'Consider gas optimization'
    ];

    // Basic validation even in demo mode
    if (!contract.trim()) {
      errors.push('Contract code is empty');
    }

    if (!contract.includes('define-')) {
      errors.push('Contract must contain at least one definition');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private getFallbackContract(request: AIContractRequest): AIContractResponse {
    const contractName = request.description || 'payment-contract';
    const contractCode = `;; ${contractName} - Generated Contract Template
;; This is a template contract. For AI-generated contracts, please configure your Gemini API key.

;; Define error constants
(define-constant ERR-PAYMENT-NOT-FOUND (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-TRANSFER-FAILED (err u103))

;; Contract owner
(define-data-var contract-owner principal tx-sender)

;; Payment data structure
(define-map payments (buff 32) (tuple 
  (amount uint)
  (merchant principal)
  (payer principal)
  (status (string-utf8 20))
  (created-at uint)
))

;; Create a new payment
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (ok (map-set payments id (tuple 
      (amount amount)
      (merchant merchant)
      (payer tx-sender)
      (status "pending")
      (created-at block-height)
    )))
  )
)

;; Process payment with STX transfer
(define-public (process-payment (id (buff 32)))
  (let ((payment (default-to (tuple (amount u0) (merchant tx-sender) (payer tx-sender) (status "pending") (created-at u0)) (map-get? payments id))))
    (begin
      (asserts! (is-eq (get status payment) "pending") ERR-PAYMENT-NOT-FOUND)
      (asserts! (is-eq tx-sender (get payer payment)) ERR-UNAUTHORIZED)
      
      ;; Transfer STX from payer to merchant
      (try! (stx-transfer? (get amount payment) tx-sender (get merchant payment)))
      
      ;; Update payment status
      (ok (map-set payments id (merge payment (tuple (status "paid")))))
    )
  )
)

;; Mark payment as paid (admin function)
(define-public (mark-paid (id (buff 32)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
    (let ((payment (default-to (tuple (amount u0) (merchant tx-sender) (payer tx-sender) (status "pending") (created-at u0)) (map-get? payments id))))
      (ok (map-set payments id (merge payment (tuple (status "paid")))))
    )
  )
)

;; Get payment details
(define-read-only (get-payment (id (buff 32)))
  (ok (default-to (tuple (amount u0) (merchant tx-sender) (payer tx-sender) (status "not-found") (created-at u0)) (map-get? payments id)))
)

;; Get contract owner
(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

;; Get contract stats
(define-read-only (get-stats)
  (ok (tuple 
    (owner (var-get contract-owner))
    (block-height block-height)
  ))
)`;

    return {
      contract: contractCode,
      explanation: `This is a template payment contract with basic functionality:

**Features:**
- Create payments with unique IDs
- Mark payments as paid
- Query payment details
- Basic authorization and error handling

**Functions:**
- \`create-payment\`: Creates a new payment record
- \`mark-paid\`: Marks a payment as completed
- \`get-payment\`: Retrieves payment information
- \`get-stats\`: Returns contract statistics

**Note:** This is a template. For AI-generated custom contracts, please configure your Gemini API key in the environment variables.`,
      suggestions: [
        'Add escrow functionality',
        'Implement payment splitting',
        'Add subscription support',
        'Include analytics and reporting',
        'Add multi-token support'
      ],
      warnings: [
        'Only contract owner can create and mark payments',
        'Payment amounts must be greater than zero',
        'Proper error handling for invalid operations'
      ]
    };
  }

  private buildPrompt(request: AIContractRequest): string {
    const templateDescriptions = {
      payment: 'payment processing',
      escrow: 'escrow transactions',
      split: 'payment splitting',
      subscription: 'recurring payments'
    };

    const requirements = request.requirements && request.requirements.length > 0 
      ? `\nADDITIONAL REQUIREMENTS:\n${request.requirements.map(req => `- ${req}`).join('\n')}`
      : '';

    return `Generate a syntactically correct Clarity smart contract for Stacks blockchain:

DESCRIPTION: ${request.description}
TYPE: ${templateDescriptions[request.template as keyof typeof templateDescriptions] || request.template}${requirements}

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. Use proper Clarity syntax - NO syntax errors
2. Use (ok value) and (err error) patterns correctly in match statements
3. Use stx-transfer? for STX transfers, NOT stx-transfer-from?
4. Use default-to u0 for safe map access: (default-to u0 (map-get? map-name key))
5. Use as-contract for contract-initiated transfers: (as-contract (stx-transfer? amount sender recipient))
6. Use proper match patterns: (match result (ok success) (err error))
7. Use asserts! for validation: (asserts! condition error-constant)
8. Use try! for operations that can fail: (try! (stx-transfer? amount sender recipient))
9. Define error constants: (define-constant ERR-NAME (err u100))
10. Use proper function signatures: (define-public (function-name (param type) (param2 type)))

SYNTAX EXAMPLES:
- STX Transfer: (try! (stx-transfer? amount tx-sender recipient))
- Contract Transfer: (try! (as-contract (stx-transfer? amount tx-sender recipient)))
- Map Access: (default-to u0 (map-get? user-balances tx-sender))
- Match Pattern: (match result (ok success) (ok true) (err error) (err ERR-NAME))
- Assertion: (asserts! (> amount u0) ERR-INVALID-AMOUNT)

Return ONLY the contract code in \`\`\`clarity code blocks. No explanations.`;
  }

  private parseAIResponse(content: string, request: AIContractRequest): AIContractResponse {
    console.log('AI Service: Parsing response content:', content);
    console.log('AI Service: Content length:', content.length);
    
    // Extract contract code (try multiple patterns)
    let contract = '';
    let explanation = '';
    let suggestions: string[] = [];
    
    // Try different code block patterns - prioritize clarity blocks
    const codePatterns = [
      /```clarity\n([\s\S]*?)\n```/,
      /```clarity\n([\s\S]*?)```/,
      /```\n([\s\S]*?)\n```/,
      /```([\s\S]*?)```/
    ];
    
    for (const pattern of codePatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim()) {
        contract = match[1].trim();
        console.log('AI Service: Found contract with pattern:', pattern.toString());
        console.log('AI Service: Contract length:', contract.length);
        console.log('AI Service: Contract preview:', contract.substring(0, 200));
        break;
      }
    }
    
    // If no code blocks found, try to extract Clarity code from the content
    if (!contract) {
      // Look for Clarity-specific syntax
      const clarityKeywords = ['define-constant', 'define-data-var', 'define-public', 'define-read-only'];
      const lines = content.split('\n');
      const contractLines = [];
      let inContract = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (clarityKeywords.some(keyword => trimmedLine.includes(keyword))) {
          inContract = true;
        }
        if (inContract) {
          contractLines.push(line);
        }
        // Stop if we hit explanation text
        if (inContract && (trimmedLine.toLowerCase().includes('explanation') || 
                          trimmedLine.toLowerCase().includes('suggestions') ||
                          trimmedLine.toLowerCase().includes('note:') ||
                          trimmedLine.toLowerCase().includes('features:') ||
                          trimmedLine.toLowerCase().includes('functions:'))) {
          break;
        }
      }
      
      if (contractLines.length > 0) {
        contract = contractLines.join('\n').trim();
        console.log('AI Service: Extracted contract from content lines');
      }
    }
    
    // Clean the contract code - remove any non-Clarity content
    if (contract) {
      contract = this.cleanContractCode(contract);
      // Fix common syntax errors
      contract = this.fixCommonSyntaxErrors(contract);
    }
    
    // If still no contract, use the entire content as fallback
    if (!contract || contract.length < 50) {
      console.log('AI Service: No contract found, using fallback');
      return this.getFallbackContract(request);
    }
    
    console.log('AI Service: Final contract length:', contract.length);

    // Extract explanation from the remaining content (after removing contract code)
    const contentWithoutCode = content.replace(/```[\s\S]*?```/g, '').trim();
    
    // Look for explanation patterns
    const explanationPatterns = [
      /explanation[:\s]*([\s\S]*?)(?:suggestions|features|functions|note|$)/i,
      /this contract[:\s]*([\s\S]*?)(?:suggestions|features|functions|note|$)/i,
      /description[:\s]*([\s\S]*?)(?:suggestions|features|functions|note|$)/i
    ];
    
    for (const pattern of explanationPatterns) {
      const match = contentWithoutCode.match(pattern);
      if (match && match[1] && match[1].trim()) {
        explanation = match[1].trim();
        break;
      }
    }
    
    // If no explanation found, use default
    if (!explanation) {
      explanation = 'This contract has been generated based on your requirements. Review the code and validate before deployment.';
    }

    // Extract suggestions
    const suggestionsMatch = contentWithoutCode.match(/suggestions[:\s]*([\s\S]*?)$/i);
    if (suggestionsMatch) {
      suggestions = suggestionsMatch[1]
        .split('\n')
        .filter(s => s.trim())
        .map(s => s.replace(/^[-*]\s*/, '').trim())
        .filter(s => s.length > 0);
    }
    
    // Default suggestions if none found
    if (suggestions.length === 0) {
      suggestions = [
        'Review all function parameters and return types',
        'Test with various input scenarios',
        'Consider adding more error handling',
        'Validate all assertions and security checks'
      ];
    }

    return {
      contract,
      explanation,
      suggestions,
      errors: [],
      warnings: []
    };
  }

  /**
   * Clean contract code by removing non-Clarity content
   */
  private cleanContractCode(contract: string): string {
    const lines = contract.split('\n');
    const cleanLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments that aren't Clarity comments
      if (!trimmedLine || trimmedLine.startsWith(';;')) {
        cleanLines.push(line);
        continue;
      }
      
      // Skip lines that look like explanations or non-code
      if (trimmedLine.toLowerCase().includes('explanation') ||
          trimmedLine.toLowerCase().includes('suggestions') ||
          trimmedLine.toLowerCase().includes('features:') ||
          trimmedLine.toLowerCase().includes('functions:') ||
          trimmedLine.toLowerCase().includes('note:') ||
          trimmedLine.toLowerCase().includes('description:') ||
          trimmedLine.startsWith('**') ||
          trimmedLine.startsWith('*') ||
          trimmedLine.startsWith('-')) {
        continue;
      }
      
      // Keep Clarity code lines
      if (trimmedLine.startsWith('define-') ||
          trimmedLine.startsWith('(') ||
          trimmedLine.startsWith(')') ||
          trimmedLine.includes('(') ||
          trimmedLine.includes(')') ||
          trimmedLine.startsWith('  ') ||
          trimmedLine.startsWith('\t')) {
        cleanLines.push(line);
      }
    }
    
    return cleanLines.join('\n').trim();
  }

  /**
   * Fix common syntax errors in AI-generated contracts
   */
  private fixCommonSyntaxErrors(contract: string): string {
    let fixedContract = contract;

    // Fix stx-transfer-from? to stx-transfer?
    fixedContract = fixedContract.replace(/stx-transfer-from\?/g, 'stx-transfer?');

    // Fix incorrect match patterns
    fixedContract = fixedContract.replace(/\(match\s+([^)]+)\s+([^)]+)\s+\(ok\s+([^)]+)\)\s+\(err\s+([^)]+)\)\)/g, 
      '(match $1 (ok $3) (err $4))');

    // Fix map access without default-to
    fixedContract = fixedContract.replace(/\(map-get\?\s+([^)]+)\s+([^)]+)\)/g, 
      '(default-to u0 (map-get? $1 $2))');

    // Fix tuple access without proper syntax
    fixedContract = fixedContract.replace(/\.([a-zA-Z-]+)/g, ' (get $1');

    // Fix missing parentheses in tuple access
    fixedContract = fixedContract.replace(/\(get\s+([^)]+)\s+([^)]+)(?!\))/g, '(get $1 $2)');

    // Fix incorrect error patterns
    fixedContract = fixedContract.replace(/\(err\s+u(\d+)\)/g, '(err u$1)');

    // Fix missing ok wrapping in return statements
    fixedContract = fixedContract.replace(/return\s+([^;]+);/g, '(ok $1)');

    // Fix incorrect function signatures
    fixedContract = fixedContract.replace(/define-public\s+\(([^)]+)\)\s*$/gm, 
      'define-public ($1)');

    // Fix missing begin blocks
    fixedContract = fixedContract.replace(/define-public\s+\(([^)]+)\)\s*([^(])/g, 
      'define-public ($1)\n  (begin\n    $2');

    // Fix missing closing parentheses
    const openParens = (fixedContract.match(/\(/g) || []).length;
    const closeParens = (fixedContract.match(/\)/g) || []).length;
    
    if (openParens > closeParens) {
      fixedContract += ')'.repeat(openParens - closeParens);
    }

    return fixedContract;
  }
}

export const aiService = new AIService();
