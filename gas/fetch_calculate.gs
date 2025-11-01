const calculateBackendUrl = "https://api.example.com/api/calculate";

function CalculateRequest(orderData, type) {
  return {
    url: calculateBackendUrl + "/" + type,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    payload: orderData,
  };
}

function fetchCalculate(orderData) {
  const requests = [
    CalculateRequest(orderData, "rfm"),
    CalculateRequest(orderData, "cai"),
    // TODO: 購物籃
  ];
  const response = UrlFetchApp.fetchAll(requests);
  return {
    rfm: response[0].content,
    cai: response[1].content,
    // TODO: 購物籃
  };
}
