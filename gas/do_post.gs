// 處理 POST 請求
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  switch (data.action) {
    case 'ADD_ORDER':
      return addOrder(data);
  }
}

// {
//   action: 'ADD_ORDER',
//   order: {
//     product: []
//     customer_id: '',
//   },
// }