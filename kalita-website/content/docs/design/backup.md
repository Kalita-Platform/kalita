+++
title = "Swap backups"
description = "Description how wallet handles backups"
date = 2021-07-06T19:30:00+00:00
updated = 2021-07-06T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
toc = true
top = false
+++

The ability to restore funds after losing access to a wallet is an all-important feature. Though the [seed phrase](/docs/design/keys/#seed) allows a user to restore their wallet, it works only for funds under their complete control, and that contains all data on-chain. [Atomic swap](/docs/atomic-swap/atomic) is an instance of such problematic funds.

A finished swap is not an issue as we can discover all necessary parts on-chain using [filters](/docs/design/backend#compact-filters). On the other side, once Alice or Bob locked their coins inside escrow contracts, some pieces of the puzzle persist off-chain. Moreover, if the user is not fast enough, they can [donate](/docs/atomic-swap/atomic/#abort-scenario) their funds to another swap side.

So, there are two primary components that we need to restore to resume the ongoing swap. First is the secret preimage for unlocking escrow contracts that Alice generates at the beginning of the trade. The second is escrow redeem scripts where Alice and Bob lock their funds. 

## Secret derivation

Each time a new swap starts, Alice generates a unique secret that is used as proof of payment and allows both parties to take exchanged funds from corresponding escrow boxes. We propose a way to deterministically derive the secret from the user's seed phrase by extending a [BIP32 key tree](/docs/design/keys/#key-tree) with a new keychain.

<div class="row">
    <img src="/backup/swap_secret_subtree.svg">
</div>

Swaps chain derives one chain for public/private keys used in escrow contracts and one chain for swap secrets. Note that we don't need to derive public keys for secrets. Moreover, we pass the keys through the key stretching [scrypt](https://en.wikipedia.org/wiki/Scrypt) to prevent any attacks that can compromise the parent secret key and thus all future swaps.

## Redeem script

Unlike swap secrets, you cannot derive [redeem script](/docs/atomic-swap/atomic#step-3-alice-s-escrow) by knowing only the seed phrase. The script contains a public key of Bob that Alice cannot derive by herself. Also, details of the P2WSH operation make it impossible to derive the script from blockchain until somebody spends the corresponding output.


<div class="row">
    <img src="/backup/backup_restore.svg">
</div>

Our solution is to ask the yam node about the missing redeem script. The node tracks the swap process anyway as it needs to detect the malicious behavior of Bob or Alice (see [UTXO ban](/docs/atomic-swap/atomic#utxo-ban)). If Alice desires to get both scripts for BTC and Ergo escrow accounts, she should send the swap order id and her public key. The node sends encrypted scripts with Alice's public key. If Bob or another third party asked for scripts, they wouldn't able to decrypt the answer.
