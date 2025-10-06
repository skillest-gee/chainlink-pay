import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.6/index.ts';

Clarinet.test({
  name: "Enhanced Payment Contract - Full Test Suite",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const merchant = accounts.get('wallet_1')!;
    const payer = accounts.get('wallet_2')!;
    const contractName = 'enhanced-payment';
    
    // Test 1: Contract initialization
    {
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'initialize', [], deployer.address)
      ]);
      
      block.receipts[0].result.expectOk().expectBool(true);
    }
    
    // Test 2: Create payment (STX)
    {
      const paymentId = 'test-payment-001';
      const amount = 1000000; // 1 STX in microSTX
      const paymentType = 'STX';
      const description = 'Test STX payment';
      const expiresInBlocks = 100;
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(amount),
          types.ascii(paymentType),
          types.utf8(description),
          types.some(types.uint(expiresInBlocks))
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 3: Create payment (BTC)
    {
      const paymentId = 'test-payment-002';
      const amount = 50000000; // 0.05 BTC in satoshis
      const paymentType = 'BTC';
      const description = 'Test BTC payment';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(amount),
          types.ascii(paymentType),
          types.utf8(description),
          types.none()
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 4: Get payment information
    {
      const paymentId = 'test-payment-001';
      
      const result = chain.callReadOnlyFn(contractName, 'get-payment', [
        types.buff(paymentId)
      ], merchant.address);
      
      result.result.expectSome().expectTuple();
    }
    
    // Test 5: Mark payment as paid
    {
      const paymentId = 'test-payment-001';
      const txHash = '0x1234567890abcdef';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'mark-payment-paid', [
          types.buff(paymentId),
          types.principal(payer.address),
          types.buff(txHash)
        ], deployer.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 6: Cancel payment
    {
      const paymentId = 'test-payment-002';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'cancel-payment', [
          types.buff(paymentId)
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 7: Get contract statistics
    {
      const result = chain.callReadOnlyFn(contractName, 'get-contract-stats', [], deployer.address);
      result.result.expectTuple();
    }
    
    // Test 8: Get merchant statistics
    {
      const result = chain.callReadOnlyFn(contractName, 'get-merchant-stats', [
        types.principal(merchant.address)
      ], merchant.address);
      
      result.result.expectSome().expectTuple();
    }
    
    // Test 9: AI contract registration
    {
      const contractHash = 'ai-contract-hash-123';
      const templateId = 'ESCROW';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'register-ai-contract', [
          types.buff(contractHash),
          types.ascii(templateId)
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 10: Bridge request creation
    {
      const requestId = 'bridge-request-001';
      const sourceChain = 'stacks';
      const targetChain = 'ethereum';
      const amount = 1000000;
      const assetType = 'STX';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-bridge-request', [
          types.buff(requestId),
          types.ascii(sourceChain),
          types.ascii(targetChain),
          types.uint(amount),
          types.ascii(assetType)
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
    }
    
    // Test 11: Error handling - Invalid amount
    {
      const paymentId = 'test-payment-invalid';
      const amount = 0; // Invalid amount
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(amount),
          types.ascii('STX'),
          types.utf8('Invalid payment'),
          types.none()
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectErr().expectUint(100); // ERR-INVALID-AMOUNT
    }
    
    // Test 12: Error handling - Unauthorized access
    {
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'set-contract-enabled', [
          types.bool(false)
        ], merchant.address) // Not contract owner
      ]);
      
      block.receipts[0].result.expectErr().expectUint(103); // ERR-UNAUTHORIZED
    }
  }
});

Clarinet.test({
  name: "Enhanced Payment Contract - Edge Cases",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const merchant = accounts.get('wallet_1')!;
    const contractName = 'enhanced-payment';
    
    // Initialize contract
    chain.mineBlock([
      Tx.contractCall(contractName, 'initialize', [], deployer.address)
    ]);
    
    // Test: Duplicate payment ID
    {
      const paymentId = 'duplicate-payment';
      
      // Create first payment
      let block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(1000000),
          types.ascii('STX'),
          types.utf8('First payment'),
          types.none()
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectOk();
      
      // Try to create duplicate payment
      block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(2000000),
          types.ascii('STX'),
          types.utf8('Duplicate payment'),
          types.none()
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectErr().expectUint(102); // ERR-PAYMENT-ALREADY-PAID
    }
    
    // Test: Invalid payment type
    {
      const paymentId = 'invalid-type-payment';
      
      const block = chain.mineBlock([
        Tx.contractCall(contractName, 'create-payment', [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(1000000),
          types.ascii('INVALID'), // Invalid payment type
          types.utf8('Invalid type payment'),
          types.none()
        ], merchant.address)
      ]);
      
      block.receipts[0].result.expectErr().expectUint(106); // ERR-INVALID-PAYMENT-TYPE
    }
    
    // Test: Payment not found
    {
      const result = chain.callReadOnlyFn(contractName, 'get-payment', [
        types.buff('non-existent-payment')
      ], merchant.address);
      
      result.result.expectNone();
    }
  }
});
