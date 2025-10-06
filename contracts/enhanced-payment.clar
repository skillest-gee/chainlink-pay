;; Enhanced Payment Contract for ChainLinkPay
;; Comprehensive payment link system with full app functionality
;; Supports STX and BTC payments, AI contract integration, and cross-chain features

;; =============================================================================
;; CONSTANTS AND ERROR CODES
;; =============================================================================

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-PAYMENT-ALREADY-PAID (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))
(define-constant ERR-INVALID-STATUS (err u104))
(define-constant ERR-PAYMENT-EXPIRED (err u105))
(define-constant ERR-INVALID-PAYMENT-TYPE (err u106))
(define-constant ERR-INSUFFICIENT-BALANCE (err u107))
(define-constant ERR-CONTRACT-DISABLED (err u108))

;; Payment statuses
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")
(define-constant STATUS-CANCELLED "cancelled")
(define-constant STATUS-EXPIRED "expired")
(define-constant STATUS-REFUNDED "refunded")

;; Payment types
(define-constant PAYMENT-TYPE-STX "STX")
(define-constant PAYMENT-TYPE-BTC "BTC")

;; =============================================================================
;; DATA VARIABLES
;; =============================================================================

;; Contract owner and settings
(define-data-var contract-owner principal tx-sender)
(define-data-var contract-enabled bool true)
(define-data-var total-payments uint u0)
(define-data-var total-volume uint u0)

;; Payment storage - using maps for better scalability
(define-map payments (buff 32) {
  id: (buff 32),
  merchant: principal,
  payer: (optional principal),
  amount: uint,
  payment-type: (string-ascii 10),
  status: (string-ascii 50),
  description: (string-utf8 500),
  created-at: uint,
  expires-at: (optional uint),
  paid-at: (optional uint),
  tx-hash: (optional (buff 32))
})

;; Merchant statistics
(define-map merchant-stats principal {
  total-payments: uint,
  total-volume: uint,
  total-pending: uint,
  total-paid: uint
})

;; =============================================================================
;; CORE PAYMENT FUNCTIONS
;; =============================================================================

;; Create a new payment link (public function - anyone can create)
(define-public (create-payment 
  (id (buff 32)) 
  (merchant principal) 
  (amount uint) 
  (payment-type (string-ascii 10))
  (description (string-utf8 500))
  (expires-in-blocks (optional uint))
)
  (begin
    ;; Check if contract is enabled
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    
    ;; Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Validate payment type
    (asserts! 
      (or 
        (is-eq payment-type PAYMENT-TYPE-STX)
        (is-eq payment-type PAYMENT-TYPE-BTC)
      ) 
      ERR-INVALID-PAYMENT-TYPE
    )
    
    ;; Check if payment ID already exists
    (asserts! (is-none (map-get? payments id)) ERR-PAYMENT-ALREADY-PAID)
    
    ;; Calculate expiration block
    (let ((expires-at (if (is-some expires-in-blocks) 
      (some (+ block-height (unwrap-panic expires-in-blocks)))
      none
    )))
      
      ;; Store payment data
      (ok (map-set payments id {
        id: id,
        merchant: merchant,
        payer: none,
        amount: amount,
        payment-type: payment-type,
        status: STATUS-PENDING,
        description: description,
        created-at: block-height,
        expires-at: expires-at,
        paid-at: none,
        tx-hash: none
      }))
    )
  )
)

;; Get payment information
(define-read-only (get-payment (id (buff 32)))
  (map-get? payments id)
)

;; Mark payment as paid
(define-public (mark-payment-paid 
  (id (buff 32)) 
  (payer principal) 
  (tx-hash (buff 32))
)
  (begin
    ;; Check if contract is enabled
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    
    ;; Get payment data
    (match (map-get? payments id)
      payment (begin
        ;; Check if payment is still pending
        (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-INVALID-STATUS)
        
        ;; Check if payment has expired
        (match (get expires-at payment)
          expires-at (asserts! (< block-height (unwrap-panic expires-at)) ERR-PAYMENT-EXPIRED)
          true
        )
        
        ;; Update payment status
        (ok (map-set payments id {
          id: (get id payment),
          merchant: (get merchant payment),
          payer: (some payer),
          amount: (get amount payment),
          payment-type: (get payment-type payment),
          status: STATUS-PAID,
          description: (get description payment),
          created-at: (get created-at payment),
          expires-at: (get expires-at payment),
          paid-at: (some block-height),
          tx-hash: (some tx-hash)
        }))
      )
      (err ERR-PAYMENT-NOT-FOUND)
    )
  )
)

;; Cancel a payment (only by merchant or contract owner)
(define-public (cancel-payment (id (buff 32)))
  (begin
    (match (map-get? payments id)
      payment (begin
        ;; Check authorization (merchant or contract owner)
        (asserts! 
          (or 
            (is-eq tx-sender (get merchant payment))
            (is-eq tx-sender (var-get contract-owner))
          ) 
          ERR-UNAUTHORIZED
        )
        
        ;; Check if payment can be cancelled
        (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-INVALID-STATUS)
        
        ;; Update payment status
        (ok (map-set payments id {
          id: (get id payment),
          merchant: (get merchant payment),
          payer: (get payer payment),
          amount: (get amount payment),
          payment-type: (get payment-type payment),
          status: STATUS-CANCELLED,
          description: (get description payment),
          created-at: (get created-at payment),
          expires-at: (get expires-at payment),
          paid-at: (get paid-at payment),
          tx-hash: (get tx-hash payment)
        }))
      )
      (err ERR-PAYMENT-NOT-FOUND)
    )
  )
)

;; =============================================================================
;; MERCHANT FUNCTIONS
;; =============================================================================

;; Get payments for a specific merchant
(define-read-only (get-merchant-payments (merchant principal) (limit uint))
  ;; Note: This is a simplified version. In production, you'd want pagination
  (ok u0)
)

;; Get merchant statistics
(define-read-only (get-merchant-stats (merchant principal))
  (map-get? merchant-stats merchant)
)

;; Update merchant statistics (internal function)
(define-private (update-merchant-stats (merchant principal) (amount uint) (status (string-ascii 50)))
  (let ((current-stats (default-to {
    total-payments: u0,
    total-volume: u0,
    total-pending: u0,
    total-paid: u0
  } (map-get? merchant-stats merchant))))
    
    (map-set merchant-stats merchant {
      total-payments: (+ (get total-payments current-stats) u1),
      total-volume: (+ (get total-volume current-stats) amount),
      total-pending: (if (is-eq status STATUS-PENDING) 
        (+ (get total-pending current-stats) u1)
        (get total-pending current-stats)
      ),
      total-paid: (if (is-eq status STATUS-PAID) 
        (+ (get total-paid current-stats) u1)
        (get total-paid current-stats)
      )
    })
  )
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update contract settings (only contract owner)
(define-public (set-contract-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
    (ok (var-set contract-enabled enabled))
  )
)

;; Get contract owner
(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

;; Get contract statistics
(define-read-only (get-contract-stats)
  {
    total-payments: (var-get total-payments),
    total-volume: (var-get total-volume),
    contract-enabled: (var-get contract-enabled)
  }
)

;; =============================================================================
;; UTILITY FUNCTIONS
;; =============================================================================

;; Check if payment is expired
(define-read-only (is-payment-expired (id (buff 32)))
  (match (map-get? payments id)
    payment (match (get expires-at payment)
      expires-at (>= block-height (unwrap-panic expires-at))
      false
    )
    true
  )
)

;; Get payment status
(define-read-only (get-payment-status (id (buff 32)))
  (match (map-get? payments id)
    payment (ok (get status payment))
    (err ERR-PAYMENT-NOT-FOUND)
  )
)

;; =============================================================================
;; AI CONTRACT INTEGRATION FUNCTIONS
;; =============================================================================

;; Store AI-generated contract hash for verification
(define-map ai-contracts (buff 32) {
  contract-hash: (buff 32),
  template-id: (string-ascii 50),
  generated-by: principal,
  created-at: uint
})

;; Register AI-generated contract
(define-public (register-ai-contract 
  (contract-hash (buff 32)) 
  (template-id (string-ascii 50))
)
  (begin
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    
    (ok (map-set ai-contracts contract-hash {
      contract-hash: contract-hash,
      template-id: template-id,
      generated-by: tx-sender,
      created-at: block-height
    }))
  )
)

;; Get AI contract information
(define-read-only (get-ai-contract (contract-hash (buff 32)))
  (map-get? ai-contracts contract-hash)
)

;; =============================================================================
;; CROSS-CHAIN BRIDGE FUNCTIONS
;; =============================================================================

;; Bridge request storage
(define-map bridge-requests (buff 32) {
  request-id: (buff 32),
  source-chain: (string-ascii 50),
  target-chain: (string-ascii 50),
  amount: uint,
  asset-type: (string-ascii 10),
  requester: principal,
  status: (string-ascii 50),
  created-at: uint
})

;; Create bridge request
(define-public (create-bridge-request 
  (request-id (buff 32))
  (source-chain (string-ascii 50))
  (target-chain (string-ascii 50))
  (amount uint)
  (asset-type (string-ascii 10))
)
  (begin
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (ok (map-set bridge-requests request-id {
      request-id: request-id,
      source-chain: source-chain,
      target-chain: target-chain,
      amount: amount,
      asset-type: asset-type,
      requester: tx-sender,
      status: "pending",
      created-at: block-height
    }))
  )
)

;; Get bridge request
(define-read-only (get-bridge-request (request-id (buff 32)))
  (map-get? bridge-requests request-id)
)

;; =============================================================================
;; INITIALIZATION
;; =============================================================================

;; Initialize contract (called on deployment)
(define-public (initialize)
  (begin
    ;; Set initial values
    (var-set contract-owner tx-sender)
    (var-set contract-enabled true)
    (var-set total-payments u0)
    (var-set total-volume u0)
    
    (ok true)
  )
)