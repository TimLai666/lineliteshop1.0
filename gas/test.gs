function testAddOrder() {
    const orderData = {
        order: {
            product: [{ product: '章魚燒', quantity: 2 }, { product: '西瓜汁', quantity: 2 }], // 使用產品名稱
            customer_id: 'C001',
        },
    };

    try {
        const result = addOrder(orderData);
        const responseText = result.getContent();
        const response = JSON.parse(responseText);

        if (response.status === 'success') {
            console.log('測試成功: 訂單已添加');
        } else {
            console.log('測試失敗:', response.message);
        }
    } catch (error) {
        console.error('測試發生錯誤:', error);
    }
}

