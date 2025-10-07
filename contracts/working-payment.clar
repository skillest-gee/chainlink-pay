;; Working Payment Contract for ChainLinkPay
;; This contract will deploy successfully

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-PAYMENT-ALREADY-PAID (err u102))

(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")

(define-constant PAYMENT-TYPE-STX "STX")

;; Simple payment storage
(define-map payments (buff 32) {
  id: (buff 32),
  merchant: principal,
  amount: uint,
  status: (string-ascii 50),
  description: (string-utf8 500)
})

;; Create payment - SIMPLEST POSSIBLE
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint) (description (string-utf8 500)))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (map-set payments id {
      id: id,
      merchant: merchant,
      amount: amount,
      status: STATUS-PENDING,
      description: description
    })
    (ok true)
  )
)

;; Mark as paid
(define-public (mark-paid (id (buff 32)))
  (begin
    (let
      (
        (payment (unwrap! (map-get? payments id) ERR-PAYMENT-NOT-FOUND))
      )
      (map-set payments id (merge payment {
        status: STATUS-PAID
      }))
      (ok true)
    )
  )
)

;; Get payment
(define-read-only (get-payment (id (buff 32)))
  (ok (map-get? payments id))
)
