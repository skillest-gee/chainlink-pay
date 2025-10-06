;; Simple Payment Contract for BTC PayLink Pro
;; Basic payment functionality for demonstration

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-UNAUTHORIZED (err u101))

;; Simple payment tracking
(define-data-var payment-amount uint u0)
(define-data-var payment-recipient principal tx-sender)
(define-data-var payment-status (string-ascii 50) "pending")

;; Create payment
(define-public (create-payment (amount uint) (recipient principal))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (ok (begin
      (var-set payment-amount amount)
      (var-set payment-recipient recipient)
      (var-set payment-status "pending")
    ))
  )
)

;; Get payment info
(define-read-only (get-payment-info)
  {
    amount: (var-get payment-amount),
    recipient: (var-get payment-recipient),
    status: (var-get payment-status)
  }
)

;; Mark as paid
(define-public (mark-paid)
  (begin
    (asserts! (is-eq tx-sender (var-get payment-recipient)) ERR-UNAUTHORIZED)
    (ok (var-set payment-status "paid"))
  )
)
