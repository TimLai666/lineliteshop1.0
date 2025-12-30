const calculateBackendUrl = "https://lineliteshop.hazelnut-paradise.com/api/calculate";

function doAllCalculationsAndStoreResults() {
  const { rfm: rfmData, cai: caiData } = fetchCalculate(orderSheet);


  // Store RFM results
  setValuesToSheet(rfmSheet, rfmData);

  // Store CAI results
  setValuesToSheet(caiSheet, caiData);

  // todo: Store 購物籃結果
}

function CalculateRequest(orderData, config, type) {
  return {
    url: calculateBackendUrl + "/" + type,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + settings.token,
    },
    payload: JSON.stringify({ data: orderData, config: config }),
  };
}

function fetchCalculate(orderDataSheet) {
  const orderData = getValuesOfSheet(orderDataSheet);
  const statusColIndex = orderData[0].indexOf("狀態");
  const completedOrderData = orderData.filter((row, index) => {
    // 保留標題列
    if (index === 0) return true;
    // 保留狀態為「已完成」的訂單
    return row[statusColIndex] === "已完成";
  });
  const requests = [
    CalculateRequest(completedOrderData, {
      customerIDColName: "顧客 ID",
      tradingDayColName: "下單時間",
      amountColName: "總金額",
    }, "rfm"),
    // todo: CAI 計算參數
    CalculateRequest(completedOrderData, {
      customerIDColName: "顧客 ID",
      tradingDayColName: "下單時間",
    }, "cai"),
    // TODO: 購物籃
  ];
  Logger.log("Sending calculation requests: " + requests);
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
