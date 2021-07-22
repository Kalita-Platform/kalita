async function getErgoPrice() {
    var resp = await $.ajax({
        url: "https://erg-oracle-ergusd.spirepools.com/frontendData",
        type: "GET",
        dataType: "json",
    });
    return parseFloat(JSON.parse(resp).latest_price);
}

async function getBtcPrice() {
    var resp = await $.ajax({
        url: "https://blockchain.info/ticker?cors=true",
        type: "GET",
        dataType: "json",
    });
    return parseFloat(resp.USD.last);
}

async function getRaisedErgs() {
    const resp = await $.ajax({
        url: "https://api.ergoplatform.com/api/v1/boxes/byAddress/9hViCLdA3AGpQ7o9hRh3eHsCedCCB72Xtuj1yo6uYnYUAJqzVwE",
        type: 'GET',
      });
    const boxes = resp.items;
    const raised = boxes.map(b => b.value).reduce((a, b) => a + b, 0);

    return raised / 1000000000;
}

async function getRaisedBtcs() {
    const resp = await $.ajax({
        url: "https://blockchain.info/q/addressbalance/bc1q8fhscz9ua5j76tkr04y9y7pr70gnq4lc40aun7",
        type: 'GET',
        dataType: "json",
      });

    return resp / 100000000;
}

async function updateCrowdfund() {
    let ergs = await getRaisedErgs();
    let ergUsd = await getErgoPrice();
    let btcs = await getRaisedBtcs();
    let btcUsd = await getBtcPrice();
    let btcErgs = btcs * btcUsd / ergUsd;

    let total = ergs;
    if (btcErgs) {
        total += btcErgs;
    }

    $(".raised-amount").text(total.toFixed(3).toString());

    let percent = total / minimalRaisedAmount;
    $(".funding-meter").text((100 * percent).toFixed(2).toString() + "%");

    setTimeout(updateCrowdfund, 60000);
}