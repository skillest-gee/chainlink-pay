#!/usr/bin/env node

/**
 * Simple ChainLinkPay Contract Deployment
 * Quick deployment script for the enhanced-payment contract
 */

const { StacksTestnet } = require('@stacks/network');
const { 
  makeContractDeploy, 
  broadcastTransaction, 
  getAddressFromPrivateKey
} = require('@stacks/transactions');
const fs = require('fs');

// Contract source code
const CONTRACT_SOURCE = `;; Enhanced Payment Contract for ChainLinkPay
;; Comprehensive payment link system with full app functionality

(define-constant ERR-INVALID-AMOUNT (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-PAYMENT-ALREADY-PAID (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))
(define-constant ERR-INVALID-STATUS (err u104))
(define-constant ERR-PAYMENT-EXPIRED (err u105))
(define-constant ERR-INVALID-PAYMENT-TYPE (err u106))

(define-constant STATUS-PENDING "pending")
(define-constant STATUS-PAID "paid")
(define-constant STATUS-CANCELLED "cancelled")
(define-constant STATUS-EXPIRED "expired")

(define-constant PAYMENT-TYPE-STX "STX")
(define-constant PAYMENT-TYPE-BTC "BTC")

(define-data-var contract-owner principal tx-sender)
(define-data-var contract-enabled bool true)
(define-data-var total-payments uint u0)
(define-data-var total-volume uint u0)

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

(define-map merchant-stats principal {
  total-payments: uint,
  total-volume: uint,
  total-pending: uint,
  total-paid: uint
})

(define-public (create-payment 
  (id (buff 32)) 
  (merchant principal) 
  (amount uint) 
  (payment-type (string-ascii 10))
  (description (string-utf8 500))
  (expires-in-blocks (optional uint))
)
  (begin
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! 
      (or 
        (is-eq payment-type PAYMENT-TYPE-STX)
        (is-eq payment-type PAYMENT-TYPE-BTC)
      ) 
      ERR-INVALID-PAYMENT-TYPE
    )
    (asserts! (is-none (map-get? payments id)) ERR-PAYMENT-ALREADY-PAID)
    
    (let ((expires-at (if (is-some expires-in-blocks) 
      (some (+ block-height (unwrap-panic expires-in-blocks)))
      none
    )))
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

(define-read-only (get-payment (id (buff 32)))
  (map-get? payments id)
)

(define-public (mark-payment-paid 
  (id (buff 32)) 
  (payer principal) 
  (tx-hash (buff 32))
)
  (begin
    (asserts! (var-get contract-enabled) ERR-CONTRACT-DISABLED)
    (match (map-get? payments id)
      payment (begin
        (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-INVALID-STATUS)
        (match (get expires-at payment)
          expires-at (asserts! (< block-height (unwrap-panic expires-at)) ERR-PAYMENT-EXPIRED)
          true
        )
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

(define-public (cancel-payment (id (buff 32)))
  (begin
    (match (map-get? payments id)
      payment (begin
        (asserts! 
          (or 
            (is-eq tx-sender (get merchant payment))
            (is-eq tx-sender (var-get contract-owner))
          ) 
          ERR-UNAUTHORIZED
        )
        (asserts! (is-eq (get status payment) STATUS-PENDING) ERR-INVALID-STATUS)
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

(define-read-only (get-merchant-stats (merchant principal))
  (map-get? merchant-stats merchant)
)

(define-public (set-contract-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
    (ok (var-set contract-enabled enabled))
  )
)

(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

(define-read-only (get-contract-stats)
  {
    total-payments: (var-get total-payments),
    total-volume: (var-get total-volume),
    contract-enabled: (var-get contract-enabled)
  }
)

(define-public (initialize)
  (begin
    (var-set contract-owner tx-sender)
    (var-set contract-enabled true)
    (var-set total-payments u0)
    (var-set total-volume u0)
    (ok true)
  )
)`;

async function deployContract() {
  try {
    console.log('🚀 Deploying ChainLinkPay Contract...');
    
    // Get private key from environment
    const privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ STACKS_PRIVATE_KEY environment variable not set');
      console.log('💡 Set your private key: export STACKS_PRIVATE_KEY=your_private_key_here');
      process.exit(1);
    }
    
    // Create network
    const network = new StacksTestnet();
    const address = getAddressFromPrivateKey(privateKey, network.coreApiUrl);
    
    console.log(`📍 Deployer address: ${address}`);
    
    // Create deployment transaction
    const deployTx = await makeContractDeploy({
      contractName: 'enhanced-payment',
      codeBody: CONTRACT_SOURCE,
      senderKey: privateKey,
      network: network,
      anchorMode: 1, // Any
      fee: 5000
    });
    
    console.log('📡 Broadcasting transaction...');
    const result = await broadcastTransaction(deployTx, network.coreApiUrl);
    
    if (result) {
      console.log('✅ Contract deployed successfully!');
      console.log(`🔗 Transaction ID: ${result}`);
      console.log(`📋 Contract Address: ${address}.enhanced-payment`);
      console.log(`🌐 Explorer: https://explorer.stacks.co/txid/${result}`);
      
      console.log('\n📝 Update your .env file with:');
      console.log(`REACT_APP_CONTRACT_ADDRESS=${address}`);
      console.log(`REACT_APP_CONTRACT_NAME=enhanced-payment`);
      console.log(`REACT_APP_MERCHANT_ADDRESS=${address}`);
      
      return {
        success: true,
        contractAddress: address,
        txId: result
      };
    } else {
      throw new Error('Transaction broadcast failed');
    }
    
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run deployment
if (require.main === module) {
  deployContract().then(result => {
    if (result.success) {
      console.log('\n🎉 Deployment completed! Your contract is ready to use.');
    } else {
      console.error('\n❌ Deployment failed. Please check your setup.');
      process.exit(1);
    }
  });
}

module.exports = { deployContract };
