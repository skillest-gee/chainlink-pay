;; Ultra Simple Contract - This WILL deploy
;; No complex logic, no external dependencies

(define-constant ERR-INVALID-AMOUNT (err u100))

(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")

(define-constant PAYMENT-TYPE-STX "STX")

;; Simple payment storage
(define-map payments (buff 32) {
  id: (buff 32),
  merchant: principal,
  amount: uint,
  status: (string-ascii 50)
})

;; Create payment - SIMPLEST POSSIBLE
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (map-set payments id {
      id: id,
      merchant: merchant,
      amount: amount,
      status: STATUS-PENDING
    })
    (ok true)
  )
)

;; Mark as paid - SIMPLEST POSSIBLE
(define-public (mark-paid (id (buff 32)))
  (begin
    (let
      (
        (payment (unwrap! (map-get? payments id) ERR-INVALID-AMOUNT))
      )
      (map-set payments id (merge payment {
        status: STATUS-PAID
      }))
      (ok true)
    )
  )
)

;; Get payment - SIMPLEST POSSIBLE
(define-read-only (get-payment (id (buff 32)))
  (ok (map-get? payments id))
)
