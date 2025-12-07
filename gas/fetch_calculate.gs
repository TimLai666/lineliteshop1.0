const calculateBackendUrl = "https://lineliteshop.hazelnut-paradise.com/api/calculate";

function doAllCalculationsAndStoreResults() {
  const calculationResults = fetchCalculate(orderSheet);

  // Store RFM results
  const rfmData = calculationResults.rfm;
  setValuesToSheet(rfmSheet, rfmData);

  // todo: Store CAI results

  // todo: Store 購物籃結果
}

function CalculateRequest(orderData, config, type) {
  return {
    url: calculateBackendUrl + "/" + type,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    payload: JSON.stringify({ data: orderData, config: config }),
  };
}

function fetchCalculate(orderDataSheet) {
  const orderData = getValuesOfSheet(orderDataSheet);
  const requests = [
    CalculateRequest(orderData, {
      customerIDColName: "訂單 ID",
      tradingDayColName: "下單時間",
      amountColName: "總金額",
    }, "rfm"),
    // todo: CAI 計算參數
    CalculateRequest(orderData, {}, "cai"),
    // TODO: 購物籃
  ];
  const response = UrlFetchApp.fetchAll(requests);
  // Check for errors in the responses
  for (let i = 0; i < response.length; i++) {
    if (response[i].getResponseCode() !== 200) {
      throw new Error("Calculation request failed: " + response[i].getContentText());
    }
  }

  return {
    rfm: JSON.parse(response[0].getContentText()).RFM,
    cai: JSON.parse(response[1].getContentText()).CAI,
    // TODO: 購物籃
  };
}
