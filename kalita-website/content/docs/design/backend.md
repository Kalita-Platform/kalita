+++
title = "Backend"
description = "Wallet indexer server design."
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

Here we descibes what is happening behind the scene of wallet GUI. Unlike many wallets we provide exhaustive information about backend design 

## Compact filters 

When one develops a light wallet, one of the most challenging tasks you face is finding which coins belong to a user. You cannot simply scan all blocks for user transactions as it defeats the "lightness" of the wallet. You cannot collect user public keys and send them to a remote server in exchange for related transactions as it destroys the user's privacy. 

<div class="row justify-content-center">
    <img src="/backend/filter_sync.svg">
</div>

So, we propose solution — user agnostic [compact filters](https://github.com/bitcoin/bips/blob/master/bip-0158.mediawiki). They are specific kinds of index structures that we calculate for each block of a blockchain. They help the wallet answering the question: "Are my coins located in the particular block?". Filters are produced once and don't reveal any information about the user that requests them. Also, they allow reducing the amount of consumed traffic by a factor of 400.

Sync process of wallet consists of two phases:
1. We fetch a bundle of filters from the indexer server and locally apply the filters to the user's public keys. We get a list of blocks that might contain transactions that belong to the wallet.
1. Download and scan whole blocks from the previous step from an Ergo node. Filters can provide false-positive matches when there are no user-related transactions in the block. However, the rate is [tiny](https://gist.github.com/sipa/576d5f09c3b86c3b1b75598d799fc845), roughly one false positive for 100 thousand.

## Indexers

<div class="row justify-content-center">
    <img src="/backend/indexer_design.svg">
</div>

At the moment, Ergo nodes are not able to produce such filters on themselves, so we introduce an indexer server that has to have the following properties:
1. Indexers should not harm the privacy of a user. We provide operation via the Tor network to secure connection privacy. Communication protocol should not contain information that allows the indexer to track user coins.
1. Indexer should be lightweight and deployable on widespread hardware. We expect that users can use self-hosted indexers to improve privacy and reduce dependency on community infrastructure.


### Yam Network 

Indexer servers form a flat peer-to-peer network that will allow us to connect remote wallets Yam network's name is originated from a postal system widely used in Medieval Russia. 

Communication between wallets is required for the proper implementation of atomic swaps as their protocol requires several rounds of negotiation between swapping parties.

<div class="row justify-content-center">
    <img src="/backend/indexers_network.svg">
</div>

Transport protocol between two nodes based on Lightning Network [BOLT](https://github.com/lightningnetwork/lightning-rfc/blob/master/08-transport.md). That compatibility between networks will allow us to implement payment channels for Ergo in the future and even implement sending payments directly between Lightning and Yam network.

Each yam node has a public-private key pair that the sender uses to envelop messages in [onion-like way](https://github.com/lightningnetwork/lightning-rfc/blob/master/04-onion-routing.md). Each hop removes one layer of encryption and sends it to the next node until the destination wallet receives the message.