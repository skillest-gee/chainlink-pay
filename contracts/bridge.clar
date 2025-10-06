;; Bridge Contract for Cross-Chain Asset Transfers
;; This contract handles bridging STX and other assets to other chains

(define-constant ERR-UNAUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-BRIDGE-NOT-FOUND (err u102))
(define-constant ERR-INVALID-CHAIN (err u103))
(define-constant ERR-BRIDGE-ALREADY-PROCESSED (err u104))

;; Bridge data structure
(define-data-var bridge-data (optional {
    id: (buff 32),
    sender: principal,
    amount: uint,
    destination-chain: (string-ascii 50),
    status: (string-ascii 20),
    created-at: uint,
    processed-at: uint
}) none)

;; Supported destination chains
(define-constant CHAIN-ETHEREUM "ethereum")
(define-constant CHAIN-POLYGON "polygon")
(define-constant CHAIN-AVALANCHE "avalanche")
(define-constant CHAIN-BINANCE "binance")

;; Bridge statuses
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PROCESSING "processing")
(define-constant STATUS-COMPLETED "completed")
(define-constant STATUS-FAILED "failed")

;; Contract owner
(define-data-var contract-owner principal tx-sender)

;; Create a new bridge request
(define-public (create-bridge (id (buff 32)) (destination-chain (string-ascii 50)) (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (or 
      (is-eq destination-chain CHAIN-ETHEREUM)
      (is-eq destination-chain CHAIN-POLYGON)
      (is-eq destination-chain CHAIN-AVALANCHE)
      (is-eq destination-chain CHAIN-BINANCE)
    ) ERR-INVALID-CHAIN)
    
    (ok (var-set bridge-data (some {
      id: id,
      sender: tx-sender,
      amount: amount,
      destination-chain: destination-chain,
      status: STATUS-PENDING,
      created-at: block-height,
      processed-at: u0
    })))
  )
)

;; Process bridge request (only by contract owner)
(define-public (process-bridge (id (buff 32)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-UNAUTHORIZED)
    (match (var-get bridge-data)
      bridge (begin
        (asserts! (is-eq (get status bridge) STATUS-PENDING) ERR-BRIDGE-ALREADY-PROCESSED)
        (ok (var-set bridge-data (some {
          id: (get id bridge),
          sender: (get sender bridge),
          amount: (get amount bridge),
          destination-chain: (get destination-chain bridge),
          status: STATUS-PROCESSING,
          created-at: (get created-at bridge),
          processed-at: block-height
        })))
      )
      (err ERR-BRIDGE-NOT-FOUND)
    )
  )
)

;; Complete bridge request
(define-public (complete-bridge (id (buff 32)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-UNAUTHORIZED)
    (match (var-get bridge-data)
      bridge (begin
        (asserts! (is-eq (get status bridge) STATUS-PROCESSING) ERR-BRIDGE-ALREADY-PROCESSED)
        (ok (var-set bridge-data (some {
          id: (get id bridge),
          sender: (get sender bridge),
          amount: (get amount bridge),
          destination-chain: (get destination-chain bridge),
          status: STATUS-COMPLETED,
          created-at: (get created-at bridge),
          processed-at: block-height
        })))
      )
      (err ERR-BRIDGE-NOT-FOUND)
    )
  )
)

;; Get bridge information
(define-read-only (get-bridge (id (buff 32)))
  (var-get bridge-data)
)

;; Get bridge status
(define-read-only (get-bridge-status (id (buff 32)))
  (match (var-get bridge-data)
    bridge (ok (get status bridge))
    none (ok "not-found")
  )
)

;; Get contract owner
(define-read-only (get-contract-owner)
  (var-get contract-owner)
)
