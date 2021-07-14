+++
title = "Keys management"
description = "Description how wallet handles keys"
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

Kalita is a [non-custodial](https://en.bitcoin.it/wiki/Non-custodial_wallet) wallet. That means only your local device stores your coins. No server or any other third party can access your funds. Also, that means only you are responsible for safekeeping your coins. Nobody can restore a lost wallet if you lose your [backup seed](/docs/design/backup).

# Seed

The main secret of your wallet is a [seed phrase](https://en.bitcoin.it/wiki/Seed_phrase). It is a random phrase that contains 12 or more words that allow you to restore the wallet on a fresh installation.

<div class="row screen-pic">
    <img src="/seed_screen.png">
</div>

The best way to store your seed phrase is to write it down on paper or something [more durable](https://wiki.trezor.io/Cryptosteel). The following ideas are likely not the best:
* If you take a photo or a screenshot of the seed, the picture can be easily lost or leaked, and you will lose your funds.
* If you place the seed in a cloud or other online storage, the cloud provider or social engineering can sweep your wallet. At the bare minimum the seed must be [GPG encrypted](https://www.gnupg.org/gph/en/manual/x110.html), but you definitely should be aware of unobvious attack vectors (like keyloggers or side-channel attacks). So, do it only if you know what you are doing.

# Key tree

The next step in the wallet overview is the keys derivation mechanism. The seed phrase generates an infinite tree of public and private keys. We use widely adopted standards for deterministic derivation from the Bitcoin world, such as [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki), [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md). In addition, our implementation is [EIP3](https://github.com/ergoplatform/eips/blob/master/eip-0003.md) compliant.

The derivation scheme allows you to generate a new key for each new transaction and organize key chains by purpose. What is even handier, you can restore all your keys and funds using only the seed phrase. Another great opportunity is that you can create a [watch-only](https://www.quora.com/What-does-watch-only-mean-in-Blockchain-wallet) wallet and keep your private keys in an [air-gapped](https://en.bitcoin.it/wiki/Cold_storage) device.

<div class="row">
    <img src="/keys/derivation_tree.svg">
</div>

The wallet derives two root keys after the generation of a new mnemonic.  They are called [extended keys](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#extended-keys), one is the root public key, and the second one is for the private root key. The wallet derives the keys according to given [derivation path](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#master-key-generation) in the key tree:

```haskell
m/44'/429'/0'
```
* The **m** stands for **Master Node** layer that is derived directly from the wallet seed.
* The **44'** part stands for **purpose** part from [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) and marks that we support that standard. The extra tick symbol marks that we apply additional hardening to the layer, so that some [subtle attacks](https://medium.com/@blainemalone01/hd-wallets-why-hardened-derivation-matters-89efcdc71671) are not possible.
* The **429'** part refers to **Ergo** currency in [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) and [EIP3](https://github.com/ergoplatform/eips/blob/master/eip-0003.md) standards.
* The last **0'** marks that the wallet is first in the tree. We are going to support multiple wallets/accounts per mnemonic in the future.

Finally, the wallet derives keys for specific sequences of addresses at the bottom of the tree:
1. **External chain** produces addresses that one sees on "Receive Ergo" screen. Any incoming transaction from other people or smart contracts should go there.
1. **Internal chain** produces addresses where your wallet collects change from outcoming transactions. The chain should contain only funds that the wallet sends back to itself.
1. [Atomic swaps](/docs/atomic-swap/atomic) chain produces addresses for escrow smart contracts. The chain has to contain only funds temporarily locked in swaps.

# Storage

The wallet defines two types of sensitive data. Public data is crucial for user privacy, but a wallet can keep it in memory for a long time. For instance, the wallet needs public keys to detect incoming transactions and generate new addresses. The private keys can spend your funds, so the wallet must keep them unencrypted only for a brief moment of transaction signing.

## Private storage

We provide a specific implementation of the private storage for each supported platform.

In **Android**, we use [Keystore API](https://developer.android.com/training/articles/keystore.html) to store an [AES key](https://datatracker.ietf.org/doc/html/rfc5116#section-5.2) that encrypts the private keys.

In **iOS** and **macOS**, we use [Keychain Services](https://developer.apple.com/documentation/security/keychain_services#//apple_ref/doc/uid/TP30000897-CH203-TP1) to store private keys directly.

In **Windows** and **Linux**, we use [scrypt](https://en.wikipedia.org/wiki/Scrypt) for transforming user passwords into the key for [AES key](https://datatracker.ietf.org/doc/html/rfc5116#section-5.2) that encrypts the private keys.

## Public storage

The wallet also protects the public storage by encryption, but we don't want a user to enter the password each time public meta-information updates. Thus, we use [ECIES](https://en.wikipedia.org/wiki/Integrated_Encryption_Scheme) asymmetric encryption to save the encrypted file without the requirement of knowing decryption password.
