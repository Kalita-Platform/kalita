+++
title = "Tokens"
description = "Description how wallet handles tokens"
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

Ergo blockchain natively supports tokens by embedding them in additional data of a transaction. According to the [ErgoScript whitepaper](https://ergoplatform.org/docs/ErgoScript.pdf), a box can store a maximum of 4 different tokens inside the `R2` register. The box encodes them as a collection of ID and the amount `Coll[(Coll[Byte], Long)]`.

## Keys

Although any wallet address can receive tokens, we decided to factor out tokens into their key chains. That simplifies balance management and restore procedure. 

<div class="row">
    <img src="/tokens/tokens_subtree.svg">
</div>

There are two major types of tokens:
* [NFT tokens](https://en.wikipedia.org/wiki/Non-fungible_token) are unique and not interchangeable. Each address in  the NFT key chain holds a different type of token. Ergo blockchain implements the token kind as a token with emission of 1 unit and restriction of splitting to 0 digits after the point.
* Fungible tokens that have emissions of more than 1 unit. The wallet provides its keychain for each token type with subchains for receiving and change.

## Restore 

We recover NFT tokens with the usual procedure by sequentially checking each key in the chain until there are a certain amount of empty addresses. That amount is called a [gap limit](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#Address_gap_limit). 

But, the wallet recovers the ordinary tokens in a slightly different way. As we cannot know the number of tokens in advance in restoring wallet, we introduce a gap limit for token subtree. As soon as the wallet scans a couple of empty token chains, we consider no more new token kinds in the user wallet.