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


# New protocol.

## Step 1. Order money proof.

### Indexer. Creating order. 
Алисе необходимо запруфать индексеру наличие денег пользователя в Эрго или Битке, чтобы нельзя было
ддосить заявками без денег.
Для доказательства индексатор выдает число Х, которое нужно подписать приватным ключом, и предоставить публичный ключ и UTXO, на котором есть >= средств, заявленных в ордере.
Заявка хранит в себе цену и альткоин, на который будет может возможен обмен.
Должен лежать хэш публичного ключа кошелька, по которому идёт связть через ям-сеть.

### Indexer. Accepting order.
Бобу необходимо запруфать индексеру, что у него есть количество денег в Битке или Эрго >= цены, указанной в ордере. До этого момента индексатор на ставит ордер в "выполняющийся" и не связывает Алису с Бобу. Используя ту же процедуру наличия денег.

## Step 2.

### Swap. Alice escrow.
Боб связывается с Алисой, и Алиса повторяет процедуру наличия денег и присылает публичный ключ pk(Bob), по которому он будет забирать деньги у Алисы. Алиса создает скрипт (sc1) `or(and(pk(Bob),sha256(secret)),and(pk(Alice),after(256)))` в котором либо Боб забирает деньги, пользуясь pk(b1) и секретом, либо спустя 256 блоков деньги возвращаются Алисе.

По этому скрипту (sc1) создает P2WSH-адрес, на который Алиса отправляет деньги. Ссылку (Id блока, Id транзы, номер выхода) на UTXO этого адреса и сериализованный скрипт (sc1) отправляется ямщиком Бобу.

Боб должен проверить этот P2WSH-адрес, что он заблокирован на хэш скрипта (sc1). Читая скрипт, Боб получает публичный ключ Алисы pk(Alice) и хэш секрета sha256(secret), и проверяет, что он может забрать по своему секрету и что рефанд часть Алисы заблочена по времени не меньше чем на 256 блоков.

### Swap. Bob escrow.

После этого Боб создает в Эрго-скрипт (sc2)
`or(and(pk(Alice),sha256(secret)),and(pk(Bob),after(128)))`
в котором публичный ключ Алисы pk(Alice), хэш секрета sha256(secret) и refund-часть, которая позволит вернуть деньги Бобу через 128 блоков в Эрго-сети.

По этому скрипту (sc2) создает Эрго-аналог P2WSH-адрес, на который Боб отправляет деньги. Ссылку в эрго-блокчейне (Id блока, id бокса) на UTXO этого адреса и сериализованный эрго-скрипт (sc2) отправляется ямщиком Алисе.

Алиса проверяет эрго-аналог P2WSH-адрес, что он заблокирован на хэш скрипта (sc2). Читая скрипт, Алиса получает публичный ключ Боба pk(Bob) и проверят, что sc2 заблочен на её публичный ключ pk(Alice), и что рефанд часть Боба заблочена по времени не меньше чем на 128 блоков.  

### Swap. Redeeming.

Алиса забирает свои эрго публикуя транзакцию со redeem-скриптом (sc2), где аргументом идёт праобраз хэша (секрет), для ветки: `and(pk(Alice),sha256(secret))`.
Секрет попадает в блокчейн, где Боб может его считать.
В случае, если Алиса не предпренимает никаких действий и не забирает Эрго, то согласно скрипту (sc2), Боб забирает свои эрго через 128 блоков, по ветке: `and(pk(Bob),after(128))`.
В случае публикации секрета, Боб, пользуясь опбуликованным праобразом публикует транзакцию по скрипту (sc1) с праобразом в аргументах и забирает битки по ветке: `and(pk(Bob),sha256(secret))`.
Если Боб не укладывается в 256 блоков битка, Алиса забирает и полученные эрго, и битки, публиикуя транзу, по скрипту (sc1) по ветке: `and(pk(Alice),after(256))`.
В случае, если Алиса вообще не публикует транзакцию с секретом и не забирает Ерго, то после 128 блоков, Боб может забрать свои деньги, а после 256 - Алиса.



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
