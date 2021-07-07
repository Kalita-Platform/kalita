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

### Step 1. Creating request.
<div class="row>
  <div class="col-lg-4">
    <ul>
      <li>Alice forms a request for the exchange of BTC <-> Ergo.</li>
      <li>Alice posts a request transaction Tx0 to Ergo blockchain in the form of a smart contract.</li>
    </ul>
  </div>
  <div class="col-lg-16">
    <img style="max-height:100%; max-width:100%;" class="atomicstep" src="/docs/atomic/step1.png">
  </div>
</div>
