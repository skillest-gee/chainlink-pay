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
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY || '';
    console.log('AI Service initialized with API key:', this.apiKey ? 'Present' : 'Missing');
  }

  async generateContract(request: AIContractRequest): Promise<AIContractResponse> {
    console.log('AI Service: Environment variables:', {
      GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY ? 'Present' : 'Missing',
      OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY ? 'Present' : 'Missing',
      apiKey: this.apiKey ? 'Present' : 'Missing'
    });

    if (!this.apiKey) {
      // Provide a fallback contract template
      console.log('No API key found, using fallback contract template');
      return this.getFallbackContract(request);
    }

    console.log('AI Service: Generating contract with API key:', this.apiKey.substring(0, 10) + '...');

    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000
          }
        })
      });

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
      
      // If it's an API key error, provide fallback
      if (error.message?.includes('Invalid API key') || error.message?.includes('401')) {
        console.log('API key error detected, using fallback contract');
        return this.getFallbackContract(request);
      }
      
      throw new Error(`Failed to generate contract with AI: ${error.message || 'Unknown error'}. Please try again.`);
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

  async improveContract(contract: string, feedback: string): Promise<AIContractResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY environment variable.');
    }

    const prompt = `Please improve this Clarity smart contract based on the feedback provided:

CONTRACT:
${contract}

FEEDBACK:
${feedback}

Please provide an improved version with better security, error handling, and documentation.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'ChainLinkPay AI Contract Builder'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Clarity smart contract developer. Improve contracts based on feedback, focusing on security, efficiency, and best practices.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

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
      const content = data.choices[0]?.message?.content || '';
      
      return this.parseAIResponse(content, { description: feedback, template: 'improvement', language: 'clarity' });
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to improve contract with AI. Please try again.');
    }
  }

  private getDemoResponse(request: AIContractRequest): AIContractResponse {
    console.log('AI Service: Using demo mode - API key not configured');
    
    const demoContracts = {
      payment: `;; Demo Payment Contract
(define-data-var total-payments uint u0)
(define-data-var total-volume uint u0)

(define-public (create-payment (amount uint) (description (string-utf8 256)))
  (begin
    (var-set total-payments (+ (var-get total-payments) u1))
    (var-set total-volume (+ (var-get total-volume) amount))
    (ok true)
  )
)

(define-read-only (get-stats)
  {total-payments: (var-get total-payments), total-volume: (var-get total-volume)}
)`,
      escrow: `;; Demo Escrow Contract
(define-data-var escrow-id uint u0)
(define-map escrows uint {buyer: principal, seller: principal, amount: uint, status: (string-utf8 20)})

(define-public (create-escrow (seller principal) (amount uint))
  (begin
    (var-set escrow-id (+ (var-get escrow-id) u1))
    (map-set escrows (var-get escrow-id) {buyer: tx-sender, seller: seller, amount: amount, status: "pending"})
    (ok (var-get escrow-id))
  )
)`,
      custom: `;; Demo Custom Contract
(define-data-var contract-data uint u0)

(define-public (custom-function (input uint))
  (begin
    (var-set contract-data input)
    (ok true)
  )
)`
    };

    const contract = demoContracts[request.template as keyof typeof demoContracts] || demoContracts.custom;
    
    return {
      contract,
      explanation: `This is a demo ${request.template} contract generated in demo mode. To use the full AI service, please configure your OpenRouter API key in the environment variables.`,
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
      'Configure OpenRouter API key for full validation',
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
;; This is a template contract. For AI-generated contracts, please configure your OpenRouter API key.

(define-constant CONTRACT-OWNER tx-sender)

;; Define payment status constants
(define-constant STATUS-PENDING (string-utf8 7))
(define-constant STATUS-PAID (string-utf8 4))
(define-constant STATUS-CANCELLED (string-utf8 9))

;; Define error constants
(define-constant ERR-PAYMENT-NOT-FOUND (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))

;; Payment data structure
(define-data-var payments
  (map (buff 32) (tuple 
    (amount uint)
    (merchant principal)
    (status (string-utf8 20))
    (created-at uint)
  ))
  (map (buff 32) (tuple 
    (amount u0)
    (merchant tx-sender)
    (status STATUS-PENDING)
    (created-at u0)
  ))
)

;; Create a new payment
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (ok (map-set payments id (tuple 
      (amount amount)
      (merchant merchant)
      (status STATUS-PENDING)
      (created-at block-height)
    )))
  )
)

;; Mark payment as paid
(define-public (mark-paid (id (buff 32)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (match (map-get? payments id)
      payment (ok (map-set payments id (merge payment (tuple (status STATUS-PAID)))))
      (err ERR-PAYMENT-NOT-FOUND)
    )
  )
)

;; Get payment details
(define-read-only (get-payment (id (buff 32)))
  (match (map-get? payments id)
    payment (ok payment)
    (err ERR-PAYMENT-NOT-FOUND)
  )
)

;; Get contract stats
(define-read-only (get-stats)
  (ok (tuple 
    (total-payments u0)
    (total-amount u0)
    (owner CONTRACT-OWNER)
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

**Note:** This is a template. For AI-generated custom contracts, please configure your OpenRouter API key in the environment variables.`,
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
      payment: 'Basic payment processing contract',
      escrow: 'Secure escrow transaction contract',
      split: 'Multi-party payment splitting contract',
      subscription: 'Recurring payment subscription contract'
    };

    return `Generate a professional Clarity smart contract for the Stacks blockchain with the following requirements:

DESCRIPTION: ${request.description}
TEMPLATE: ${templateDescriptions[request.template as keyof typeof templateDescriptions] || request.template}
LANGUAGE: Clarity

REQUIREMENTS:
- Use proper Clarity syntax and best practices
- Include comprehensive error handling with custom error constants
- Add security checks and assertions
- Include detailed documentation comments
- Use appropriate data variables and maps
- Implement proper access controls
- Add read-only functions for data retrieval
- Include contract statistics and analytics

Please generate a complete, production-ready Clarity contract that follows Stacks blockchain standards. Return ONLY the Clarity code wrapped in \`\`\`clarity code blocks.`;
  }

  private parseAIResponse(content: string, request: AIContractRequest): AIContractResponse {
    // Extract contract code (usually between ```clarity and ```)
    const contractMatch = content.match(/```clarity\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) ||
                         content.match(/```([\s\S]*?)```/);
    
    const contract = contractMatch ? contractMatch[1].trim() : content;

    // Extract explanation
    const explanationMatch = content.match(/EXPLANATION:([\s\S]*?)(?:SUGGESTIONS:|$)/i);
    const explanation = explanationMatch ? explanationMatch[1].trim() : 
      'This contract has been generated based on your requirements. Review the code and validate before deployment.';

    // Extract suggestions
    const suggestionsMatch = content.match(/SUGGESTIONS:([\s\S]*?)$/i);
    const suggestions = suggestionsMatch ? 
      suggestionsMatch[1].split('\n').filter(s => s.trim()).map(s => s.replace(/^[-*]\s*/, '').trim()) :
      [
        'Review all function parameters and return types',
        'Test with various input scenarios',
        'Consider adding more error handling',
        'Validate all assertions and security checks'
      ];

    return {
      contract,
      explanation,
      suggestions,
      errors: [],
      warnings: []
    };
  }
}

export const aiService = new AIService();
