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
An atomic swap is a smart contract technology that provides a way to exchange one cryptocurrency for another without using centralized intermediaries, such as exchanges.

Here we describe atomic swap protocol by example between Ergo and Bitcoin. There are two parties in exchange: Alice and Bob. Alice desires to get Bob's Ergo coin in exchange for a Bitcoin coin. Communication between parties is performed via encrypted connection in [Yam network](/docs/design/backend/#yam-network). The implementation relies on [HTLC (Hashed Timelock Contract)](https://www.investopedia.com/terms/h/hashed-timelock-contract.asp) and compatible with payment channels in [Lightning Network](https://lightning.network/lightning-network-paper.pdf).


### Step 1. Creating order.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/atomic/creating_order.svg">
</div>

Atomic swap orders are created on the wallet and published on indexers via the Yam network. Alice must [prove ownership](#appendix-a-p2wsh-ownership) of the funds that she intends to exchange. That protects the network from the influx of empty orders (spoofing).

Alice requests the indexer with a specified amount for exchange and receives in response a random nonce. Alice signs the nonce with a private key that locks P2WPKH UTXO and sends back the corresponding public key, reference to the UTXO, and the price for the exchange in the number of requested Ergo.

Yam node validates the ownership of the funds and publishes the new order in its liquidity pool. The order contains:
- Currency codes
- Bitcoin and Ergo amounts
- Proof of UTXO ownership

The order doesn't include a hash of the public key of Alice's wallet, forcing Bob to communicate with the node that hosted the order. Otherwise, Bob could bypass the indexer and start the swap directly by sending messages via other yam nodes.

### Step 2. Accepting order.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/atomic/accepting_order.svg">
</div>

Bob also needs to [prove](#appendix-a-p2wsh-ownership) that he has enough funds in Ergo to accept the order. After Bob has demonstrated that he has the funds, the indexer puts the order in the "running" state and connects Alice with Bob by sending him a hash of the session key that plays the [role](/docs/design/backend/#routing) of destination ID in the Yam network.

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
- `and(pk(Alice),after(256))`   if Bob does not withdraw money after 256 blocks (here we use relative blocks for simplicity), Alice can withdraw money using her public key **pk(Alice)**.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/script1.svg">
</div>

Alice sends funds to the script **(sc1)** using the P2WSH address. A UTXO link (block ID, transaction ID, output number) and the serialized script **(sc1)** is sent to Bob via the Yam network. Bob must check that Alice locked the required amount of funds to the P2WSH address and that the address corresponds to the hash of the script **(sc1)**.

Bob learns Alice's public key **pk(Alice)** and the hash of the secret **sha256(secret)** by reading the script. Also, Bob ensures that Alice can refund no sooner than after 256 blocks in the future so Bob can finish the swap before the deadline. If these conditions fail, Bob [aborts](/docs/atomic-swap/atomic/#abort-scenario) the exchange.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/yam_script1.svg">
</div>

### Step 4. Bob's escrow.
If everything matches, Bob creates an Ergo script **(sc2)**:

```
{
    val secret = getVar[Coll[Byte]](1).get
    anyOf(Coll(
        pkB && HEIGHT > 640,
        allOf(Coll(
            pkA,
            secret.size < 33,
            sha256(secret) == secret_hash
        ))
    ))
}
```
The script consists of two branches:
- `allOf(Coll(pkA, secret.size < 33, sha256(secret) == secret_hash))` where Alice takes money using **pk(Alice)** and **sha256(secret)**. Size check prevents an attack when Alice uses secret larger than is allowed to embed in Ergo transaction.
- `pkB && HEIGHT > 640` if Alice does not withdraw money after 640 Ergo blocks (the equalivent of 128 Bitcoin blocks), Bob can withdraw money using his public key **pk(Bob)**.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/script2.svg">
</div>

The script **(sc2)** creates an Ergo P2SH address to which Bob sends money. A link in the ergo blockchain (block Id, box Id) to the UTXO of this address and the serialized ergo script **(sc2)** are sent to Alice via the Yam network. Alice checks that the address corresponds to the **(sc2)** script. Alice receives Bob's public key **pk(Bob)** from the script and checks that **(sc2)** is locked to her public key **pk(Alice)**, and that Bob's refund part is locked in time for at least 128 blocks, and that the amount of money is as specified in the order. If these conditions fail, Alice [aborts](/docs/atomic-swap/atomic/#abort-scenario) the exchange.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/yam_script2.svg">
</div>

### Step 5. Redeeming.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/atomic_map.svg">
</div>

Alice broadcasts a transaction that moves her Ergo from the box **(sc2)** with the original hash **secret** as an argument. The secret goes to the Ergo blockchain and becomes public. Bob learns the **secret** and publishes a transaction according to the script **(sc1)** and withdraws his Bitcoin.

### Proof of ownership.

#### BTC

To prove ownership of bitcoins Alice has to follow these steps:
1. Create new P2WPKH address with public key **pk(Alice)**.
2. Get a long random string called **nonce** from indexer.
3. Sign **nonce** with **pk(Alice)** and send the signature to the indexer.
4. The indexer checks that **nonce** is signed with the same key **pk(Alice)** that was used to create the P2WPKH address.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
<img src="/docs/atomic/checkownership.svg">
</div>

### Abort scenario

If Alice does not publish a transaction with a secret taking her Ergo, Bob takes back the Ergo after 640 blocks, and Alice takes back her Bitcoin after 256 blocks.

If Alice has published the **secret** and Bob did not redeem the Bitcoin within 256 blocks, Alice takes both the Ergo and her Bitcoin back using the refund branch in the script **(sc1)**.
