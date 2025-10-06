import { ContractTemplate } from './types';

export const ESCROW_TEMPLATE: ContractTemplate = {
  id: 'ESCROW',
  name: 'Simple Escrow',
  version: '1.0.0',
  description: 'Funds locked until a condition or arbiter approval.',
  placeholders: [
    { key: 'buyer', type: 'principal', required: true },
    { key: 'seller', type: 'principal', required: true },
    { key: 'arbiter', type: 'principal', required: true },
    { key: 'deadline-height', type: 'uint', required: true },
    { key: 'amount-ustx', type: 'uint', required: true },
  ],
  source: `
;; ESCROW TEMPLATE
(define-constant buyer {{buyer}})
(define-constant seller {{seller}})
(define-constant arbiter {{arbiter}})
(define-constant deadline {{deadline-height}})
(define-constant amount {{amount-ustx}})

(define-data-var funded bool false)
(define-data-var released bool false)

(define-public (fund)
  (begin
    (asserts! (is-eq tx-sender buyer) (err u100))
    (asserts! (is-eq (var-get funded) false) (err u101))
    (stx-transfer? amount tx-sender (as-contract tx-sender))
  ))

(define-public (release)
  (begin
    (asserts! (or (is-eq tx-sender arbiter) (>= block-height deadline)) (err u102))
    (asserts! (is-eq (var-get released) false) (err u103))
    (var-set released true)
    (stx-transfer? amount (as-contract tx-sender) seller)
  ))
`,
};

export const SPLIT_TEMPLATE: ContractTemplate = {
  id: 'SPLIT',
  name: 'Split Payment',
  version: '1.0.0',
  description: 'Split incoming funds between multiple recipients by percentages.',
  placeholders: [
    { key: 'recipient-a', type: 'principal', required: true },
    { key: 'recipient-b', type: 'principal', required: true },
    { key: 'pct-a', type: 'uint', required: true },
    { key: 'pct-b', type: 'uint', required: true },
  ],
  source: `
;; SPLIT TEMPLATE
(define-constant a {{recipient-a}})
(define-constant b {{recipient-b}})
(define-constant pct-a {{pct-a}})
(define-constant pct-b {{pct-b}})

(define-public (split (amount uint))
  (begin
    (asserts! (is-eq (+ pct-a pct-b) u100) (err u100))
    (let ((a-amt (/ (* amount pct-a) u100))
          (b-amt (/ (* amount pct-b) u100)))
      (begin
        (try! (stx-transfer? a-amt tx-sender a))
        (try! (stx-transfer? b-amt tx-sender b))
        (ok true)
      )
    )
  ))
`,
};

export const SUBSCRIPTION_TEMPLATE: ContractTemplate = {
  id: 'SUBSCRIPTION',
  name: 'Simple Subscription',
  version: '1.0.0',
  description: 'Pay-per-period subscription with cancel option.',
  placeholders: [
    { key: 'provider', type: 'principal', required: true },
    { key: 'subscriber', type: 'principal', required: true },
    { key: 'period', type: 'uint', required: true },
    { key: 'price-ustx', type: 'uint', required: true },
  ],
  source: `
;; SUBSCRIPTION TEMPLATE
(define-constant provider {{provider}})
(define-constant subscriber {{subscriber}})
(define-constant period {{period}})
(define-constant price {{price-ustx}})
(define-data-var last-paid uint u0)

(define-public (pay)
  (begin
    (asserts! (is-eq tx-sender subscriber) (err u100))
    (asserts! (>= block-height (+ (var-get last-paid) period)) (err u101))
    (var-set last-paid block-height)
    (stx-transfer? price tx-sender provider)
  ))

(define-public (cancel)
  (ok true)
)
`,
};

export const TEMPLATES: Record<string, ContractTemplate> = {
  ESCROW: ESCROW_TEMPLATE,
  SPLIT: SPLIT_TEMPLATE,
  SUBSCRIPTION: SUBSCRIPTION_TEMPLATE,
};

export function getTemplate(id: ContractTemplate['id']) {
  return TEMPLATES[id];
}

