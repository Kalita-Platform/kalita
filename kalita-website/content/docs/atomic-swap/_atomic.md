+++
title = "Atomic Swaps"
description = "How atomic swap works and why it is cool"
date = 2021-05-01T19:30:00+00:00
updated = 2021-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = ""
toc = true
top = false
+++


### Introdution
An atomic swap is a smart contract technology that enables the exchange of one cryptocurrency for another without using centralized intermediaries, such as exchanges. This article will show the atomic swap between ergo and bitcoin.

### Step 1. Creating order.
- Alice forms a order for the exchange of BTC <-> Ergo.
- Alice posts a order transaction Tx0 to Ergo blockchain in the form of a smart contract.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step1.png">
</div>
&nbsp;

### Step 2. Order propagation.
- Indexer A listens to the ERGO blockchain and finds an order, updates its order book.
- Indexers synchronize their state, Indexer B receives the order.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step2.png">
</div>
&nbsp;

### Step 3. Order received.
- Bob is subscribed to the order book of indexer B, so he sees a suitable order there.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step3.png">
</div>
&nbsp;

### Step 4. Creating swap transaction.

- Bob forms an atomic swap: a semi-signed multisig transaction Tx1 Ergo with HTLC encrypted using Alice's public key, is sent to indexer B.
- Bob's response spreads across the Indexers network, Indexer A sees the request and sends Alice an alert about a possible deal.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step4.png">
</div>
&nbsp;

### Step 5. Signing Ergo transaction.
- Alice signs Bob's Tx1 Ergo transaction and sends it back.
- Signed by Alice and Bob Ergo HTLC Tx1 is sent back to Bob in indexer B.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step5.png">
</div>
&nbsp;

### Step 6. Creating refundable transaction to Alice.
- Bob posts the Tx2 transfer of Ergo to Alice with a hash lock to his key, the refund transaction Tx1 signed by Alice and Bob through the Indexers remains with Bob in case Alice does not pay within 48 hours.
- Indexer A sees transfer transaction Tx2 to Alice in the Ergo blockchain.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step6.png">
</div>
&nbsp;

### Step 7. Alice gets refundable Tx2.
- Alice gets filters from the Ergo block with Tx2 using Indexer A.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step7.png">
</div>
&nbsp;

### Step 8. Creating refundable transaction to Bob.
- Alice forms a refund transaction Tx3, in which HTLC blocks BTC for 24 hours, and sends it encrypted to Indexer A.
- Indexers are synchronized and Indexer B sees Tx3, sends it to Bob.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step8.png">
</div>
&nbsp;

### Step 9. Signing BTC transaction.
- Bob signs Tx3 and returns it to Indexer B.
- Indexer A sees Tx3 signed by Bob, notifies Alice.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step9.png">
</div>
&nbsp;

### Step 10. Alice sends BTC to Bob.
- Alice posts into BTC blockchain transfer transaction BTC Tx4 to Bob.
- Indexer B sees the transaction and sends it to Bob through filters.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step10.png">
</div>
&nbsp;

### Step 11. Bob takes BTC.
- With a Tx5 transaction, Bob takes this money to his address, this transaction contains a secret from Tx2.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step11.png">
</div>
&nbsp;

### Step 12. Alice takes Ergo.
- Alice sees through the indexer A that her BTC was gone by transaction Tx5, which contained a secret from Tx2 for Ergo and takes them using Tx6.
<div class="col-lg-16">
  <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step12.png">
</div>
&nbsp;
