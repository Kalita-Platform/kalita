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

Kalita is [non-custodial](https://en.bitcoin.it/wiki/Non-custodial_wallet) wallet that means only your local device stores your coins. No server or any other third party can access your funds. Also, that means only you are responsible for safekeeping your coins. Nobody can restore a lost wallet if you lose your [backup seed](/docs/design/backup).

# Seed 

The main secret your wallet has is [seed phrase](https://en.bitcoin.it/wiki/Seed_phrase). It is a random phrase that contains 12 or more words that allows you to restore the wallet on fresh installation.

<div class="row screen-pic">
    <img src="/seed_screen.png">
</div>

The best way to store your seed phrase is write it down on paper. The following ideas are likely are not the best ones:
* Taking photo or screenshot of the seed. The photo can be easily lost or leaked and you will lose your funds.
* Placing the seed in cloud or other online storage. At least the seed must be [GPG encrypted](https://www.gnupg.org/gph/en/manual/x110.html) but you definetely should be aware of unobvious attack vectors (like keyloggers or side channel attacks). So, do it only if you know what are doing.
