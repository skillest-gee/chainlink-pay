;; ChainLinkPay - Minimal Working Contract
;; This contract will deploy successfully

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-PAYMENT-ALREADY-PAID (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))

(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")
(define-constant STATUS-CANCELLED "cancelled")

(define-constant PAYMENT-TYPE-STX "STX")
(define-constant PAYMENT-TYPE-BTC "BTC")

;; Contract owner
(define-data-var contract-owner principal tx-sender)
(define-data-var total-payments uint u0)

;; Payment storage
(define-map payments (buff 32) {
  id: (buff 32),
  merchant: principal,
  payer: (optional principal),
  amount: uint,
  payment-type: (string-ascii 10),
  status: (string-ascii 50),
  description: (string-utf8 500),
  created-at: uint,
  paid-at: (optional uint)
})

;; Create a new payment link
(define-public (create-payment (id (buff 32)) (merchant principal) (amount uint) (payment-type (string-ascii 10)) (description (string-utf8 500)))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (is-none (map-get? payments id)) ERR-PAYMENT-ALREADY-PAID)
    (asserts! (or (is-eq payment-type PAYMENT-TYPE-STX) (is-eq payment-type PAYMENT-TYPE-BTC)) ERR-INVALID-AMOUNT)

    (map-set payments id {
      id: id,
      merchant: merchant,
      payer: none,
      amount: amount,
      payment-type: payment-type,
      status: STATUS-PENDING,
      description: description,
      created-at: u0,
      paid-at: none
    })
    (var-set total-payments (+ (var-get total-payments) u1))
    (ok true)
  )
)

;; Mark payment as paid
(define-public (mark-payment-paid (id (buff 32)) (payer principal))
  (begin
    (let
      (
        (payment (unwrap! (map-get? payments id) ERR-PAYMENT-NOT-FOUND))
      )
      (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-PAYMENT-ALREADY-PAID)
      (map-set payments id (merge payment {
        payer: (some payer),
        status: STATUS-PAID,
        paid-at: (some u0)
      }))
      (ok true)
    )
  )
)

;; Get payment information
(define-read-only (get-payment (id (buff 32)))
  (ok (map-get? payments id))
)

;; Get total payments count
(define-read-only (get-total-payments)
  (ok (var-get total-payments))
)