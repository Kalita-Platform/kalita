+++
title = "ErgoMix"
description = "How ErgoMix works and why we should use it"
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
ErgoMix is a practical implementation of ZeroJoin on topof Ergo, a smart contract platform based on Sigma protocols which is practical privacy enhancing protocol for blockchain transactions. It helps to make indistinguishable transactions from multiple parties.

There is description of ZeroJoin protocol, differences ZeroJoin from CoinJoin, details of practical Ergo implementation called ErgoMix, and it's usage in Kalita Wallet.


### CoinJoin.

CoinJoin is a trustless method for combining multiple payments from multiple spenders into a single transaction to make it more difficult for outside parties to determine which spender paid which recipient or recipients. Canonical CoinJoin is when two inputs of equal value are joined to generate two outputs of equal value, and the process is repeated. In this model, each CoinJoin transaction has exactly two inputs (the boxes at thetail of the arrows) and two outputs (the boxes at the head of the arrows).Creating such a transaction requires a private off-chain interaction betweenthe two parties supplying the inputs, which is denoted by the dashed line.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/ergomix/coinjoin.svg">
</div>

The key idea of CoinJoin is that the two output boxes are indistinguishable in the following sense.
1.  The owner of each input box controls exactly one output box.
2.  An outsider cannot guess with probability better than 1/2, which out-put corresponds to which input.
Thus, each CoinJoin transaction provides 50% unlinkability.  The outputbox can be used as input to further CoinJoin transactions and the process repeated to increase the unlinkability to any desired level.  CoinJoin requires two parties to interactively signa transaction off-chain and this interactive nature is the primary drawbackof CoinJoin, which ZeroJoin aims to overcome.

### ZeroCoin.

ZeroCoin protocol was created to improve CoinJoin and solve scaling problems. The protocol uses a mixing pool (called the unspent-box pool, or simply the *U-pool*), to
which an ordinary coin is added as a commitment _c_ to secrets _(r,s)_. The coin is later spent such that the link to _c_ is not publicly visible. The value _c_ must be
permanently stored in the *U-pool*, since the spending transaction cannot reveal it.  Instead, it reveals the secret _s_ (the _serial number_) along with
a zero-knowledge proof that _s_ was used in a commitment from the pool. To prevent double spending, the serial number is also stored in another space called
the spent-box pool (the *S-pool*).  A coin can be spent from the *U-pool* only if the corresponding serial number does not exist in the *S-pool*.

<div class="row justify-content-center" style="margin-bottom:40px;margin-top:40px;">
    <img src="/docs/ergomix/zerocoin.svg">
</div>


### ZeroJoin.

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
