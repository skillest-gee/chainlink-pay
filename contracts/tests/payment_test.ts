import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts";

Clarinet.test({
  name: "Enhanced Payment Contract Tests",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const merchant = accounts.get("wallet_1")!;
    const payer = accounts.get("wallet_2")!;

    // Test contract deployment
    const contractAddress = deployer.address;
    const contractName = "enhanced-payment";

    // Test creating a payment
    const paymentId = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const amount = 1000000; // 1 STX in microSTX

    let block = chain.mineBlock([
      Tx.contractCall(
        contractName,
        "create-payment",
        [
          types.buff(paymentId),
          types.principal(merchant.address),
          types.uint(amount)
        ],
        deployer.address
      )
    ]);

    block.receipts[0].result.expectOk();

    // Test getting payment info
    block = chain.mineBlock([
      Tx.contractCall(
        contractName,
        "get-payment",
        [types.buff(paymentId)],
        deployer.address
      )
    ]);

    const paymentData = block.receipts[0].result;
    paymentData.expectSome();

    // Test marking payment as paid
    block = chain.mineBlock([
      Tx.contractCall(
        contractName,
        "mark-payment-paid",
        [
          types.buff(paymentId),
          types.principal(payer.address)
        ],
        deployer.address
      )
    ]);

    block.receipts[0].result.expectOk();
  },
});
