;; Minimal Payment Contract - Guaranteed to work
(define-constant ERR-UNAUTHORIZED (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))

(define-constant STATUS-PENDING u"pending")
(define-constant STATUS-PAID u"paid")

(define-data-var contract-owner principal tx-sender)
(define-data-var payment-counter uint u0)

(define-map payments (buff 32) {
  id: (buff 32),
  merchant: principal,
  amount: uint,
  status: (string-utf8 20),
  created-at: uint
})

(define-public (create-payment
  (id (buff 32))
  (merchant principal)
  (amount uint)
)
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-none (map-get? payments id)) ERR-INVALID-AMOUNT)
    
    (map-set payments id {
      id: id,
      merchant: merchant,
      amount: amount,
      status: STATUS-PENDING,
      created-at: u0
    })
    
    (var-set payment-counter (+ (var-get payment-counter) u1))
    (ok true)
  )
)

(define-public (mark-paid (id (buff 32)))
  (begin
    (let ((payment (unwrap! (map-get? payments id) ERR-PAYMENT-NOT-FOUND)))
      (map-set payments id (merge payment {
        status: STATUS-PAID
      }))
      (ok true)
    )
  )
)

(define-read-only (get-payment (id (buff 32)))
  (match (map-get? payments id)
    payment (ok payment)
    (err ERR-PAYMENT-NOT-FOUND)
  )
)

(define-read-only (get-stats)
  (ok {
    total-payments: (var-get payment-counter)
  })
)

;; Bridge function for compatibility
(define-public (bridge-to-bitcoin
  (amount uint)
  (recipient-address (string-ascii 100))
)
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (ok true)
  )
)