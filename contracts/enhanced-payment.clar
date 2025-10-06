;; Enhanced Payment Contract for BTC PayLink Pro
;; This contract handles payment link creation, tracking, and management

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-PAYMENT-ALREADY-PAID (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))
(define-constant ERR-INVALID-STATUS (err u104))

;; Payment data structure
(define-data-var payment-data (optional {id: (buff 32), payer: principal, amount: uint, status: (string-ascii 50), created-at: uint, updated-at: uint}) none)

;; Payment statuses
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")
(define-constant STATUS-CANCELLED "cancelled")
(define-constant STATUS-EXPIRED "expired")

;; Contract owner
(define-data-var contract-owner principal tx-sender)

;; Create a new payment link
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint))
  (begin
    ;; Allow anyone to create payments (removed owner restriction)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (ok (var-set payment-data (some {
      id: id,
      payer: merchant,
      amount: amount,
      status: STATUS-PENDING,
      created-at: block-height,
      updated-at: block-height
    })))
  )
)

;; Get payment information
(define-read-only (get-payment (id (buff 32)))
  (var-get payment-data)
)

;; Update payment status (only by contract owner)
(define-public (update-payment-status (id (buff 32)) (new-status (string-ascii 50)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-UNAUTHORIZED)
    (match (var-get payment-data)
      payment (ok (var-set payment-data (some {
        id: (get id payment),
        payer: (get payer payment),
        amount: (get amount payment),
        status: new-status,
        created-at: (get created-at payment),
        updated-at: block-height
      })))
      (err ERR-PAYMENT-NOT-FOUND)
    )
  )
)

;; Mark payment as paid
(define-public (mark-payment-paid (id (buff 32)) (payer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-UNAUTHORIZED)
    (match (var-get payment-data)
      payment (begin
        (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-INVALID-STATUS)
        (ok (var-set payment-data (some {
          id: (get id payment),
          payer: payer,
          amount: (get amount payment),
          status: STATUS-PAID,
          created-at: (get created-at payment),
          updated-at: block-height
        })))
      )
      (err ERR-PAYMENT-NOT-FOUND)
    )
  )
)

;; Get contract owner
(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

;; Get payment count (for analytics)
(define-read-only (get-payment-count)
  (match (var-get payment-data)
    payment (ok u1)
    none (ok u0)
  )
)
