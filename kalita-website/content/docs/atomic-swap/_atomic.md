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
An atomic swap is a smart contract technology that provides a way to exchange one cryptocurrency for another without using centralized intermediaries, such as exchanges. Here we describe atomic swap protocol by example between Ergo and Bitcoin.
There are two parties in exchange: Alice and Bob. Alice desires to get Bob's Ergo coin and give him a Bitcoin coin. Communication between parties is performed via encrypted connection in [Yam network](/docs/design/backend/#yam-network). The implementation relies on [HTLC (Hashed Timelock Contract)](https://www.investopedia.com/terms/h/hashed-timelock-contract.asp) and compatible with payment channels in [Lightning Network](https://lightning.network/lightning-network-paper.pdf).


### Step 1. Creating order.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/atomic/creating_order.svg">
</div>

Atomic swap orders are created on the wallet and published on indexers via the yam network. To protect the network from the influx of empty orders and a potential DDoS attack, Alice must provide proof of ownership of the funds that she intends to exchange. This is done as follows: when creating an order, Alice sends a request to the indexer with a specified amount for exchange and receives in response some number X, which must be signed with a private key and sent back to the indexer along with the public key and UTXO, which contains funds exceeding the amount declared for exchange, as well as the price for the exchange in the number of requested altcoins. If the indexer confirms the ownership of the funds and the validity of the request, then an order is formed on it, consisting of the volume of currency, the price, and the hash of the public key of the wallet, which is connected through the yam network.

### Step 2. Accepting order.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/atomic/accepting_order.svg">
</div>

To accept the order, Bob also needs to prove that he has funds in Ergo, in an amount greater than or equal to the price specified in the order. Bob performs similar operations to demonstrate the presence of funds: a number signed with a private key, a UTXO with the required amount of money and hash of the public key of the wallet. After Bob has demonstrated that he has the funds, the indexer puts the order in the "running" state and connects Alice with Bob using yam network.


### Step 3. Alice's escrow.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/yam_order.svg">
</div>

Bob contacts Alice and sends the public key **pk(Bob)**, with which he will receive money from Alice. Alice creates script **(sc1)**:
```
or(and(pk(Bob),sha256(secret)),and(pk(Alice),after(256)))
```
The script consists of two branches:
- `and(pk(Bob),sha256(secret))` where Bob takes money using **pk(Bob)** and **secret**.
- `and(pk(Alice),after(256))`   if Bob does not withdraw money after 256 blocks, Alice can withdraw money using her public key **pk(Alice)**.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/script1.svg">
</div>

Using this script **(sc1)**, Alice creates a P2WSH address to which she sends money. A link (block Id, transaction Id, output number) to the UTXO of this address and the serialized script **(sc1)** is sent to Bob via the yam network. Bob must check this P2WSH address to see if the amount of money at this address matches the amount specified in the order, and also that it is blocked by the hash of the script **(sc1)**. Reading the script, Bob receives Alice's public key **pk(Alice)** and the hash of the secret **sha256(secret)**, and verifies that he can take the money and that Alice's refund part is blocked by at least 256 blocks in time. If these conditions are not met, Bob aborts the exchange.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/yam_script1.svg">
</div>

### Step 4. Bob's escrow.
If everything matches, Bob creates an Ergo script **(sc2)**:

**!!!Script needs to be checked!!!**
```
{
  val defined = (OUTPUTS(0).R2[Coll[(Coll[Byte], Long)]].isDefined
                && OUTPUTS(0).R4[Coll[Byte]].isDefined)
    (alicePk && sha256(secret)) || (bobPk && HEIGHT > bobDeadline)
    } else { false } )         
}
```
The script consists of two branches:
- `(alicePk && sha256(secret))` where Alice takes money using **pk(Alice)** and **sha256(secret)**.
- `(bobPk && HEIGHT > bobDeadline)` if Alice does not withdraw money after 128 blocks, Bob can withdraw money using his public key **pk(Bob)**.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/script2.svg">
</div>

This script **(sc2)** creates an Ergo P2SH address to which Bob sends money. A link in the ergo blockchain (block Id, box Id) to the UTXO of this address and the serialized ergo script **(sc2)** are sent to Alice via the yam network. Alice checks the P2SH address that it is blocked by the script hash **(sc2)**. While reading the script, Alice receives Bob's public key **pk(Bob)** and checks that **(sc2)** is locked to her public key **pk(Alice)**, and that Bob's refund part is locked in time for at least 128 blocks, and that the amount of money is correct specified in the order. If these conditions are not met, Alice aborts the exchange.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/yam_script2.svg">
</div>

### Step 5. Redeeming.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/atomic_map.svg">
</div>

Alice withdraw her Ergo by publishing a transaction with a redeem script **(sc2)**, where the argument is the original hash **(secret)**, for the branch: `(alicePk && sha256(secret))`. The secret goes to the blockchain and becomes available to Bob. If Alice does not take any action and does not pick up Ergo, then according to the script **(sc2)**, Bob picks up his Ergo after 128 blocks, along the branch: `(bobPk && HEIGHT > bobDeadline)`. In the case of publishing a secret, Bob, using the published original hash **(secret)**, publishes a transaction according to the script **(sc1)** with the original **(secret)** in the arguments and withdraw the bitcoins along the branch: `and (pk (Bob), sha256 (secret))`. If Bob does not fit into 256 bitcoin blocks, Alice takes both the received Ergo and her bitcoins, publishing the transaction using the script **(sc1)** on the branch: `and(pk(Alice),after(256))`. If Alice does not publish a transaction with a secret and does not receive Ergo, then after 128 blocks Bob can take back his Ergos, and after 256 blocks Alice can take back her bitcoins.
