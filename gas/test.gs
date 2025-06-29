function testAddOrder() {
    const orderData = {
        order: {
            product: [{ product: '章魚燒', quantity: 2 }, { product: '西瓜汁', quantity: 2 }], // 使用產品名稱
            customer_id: 'C001',
            note: '請不要太辣，謝謝！'
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

function testGetCategories() {
    try {
        const result = getCategories();
        const responseText = result.getContent();
        const response = JSON.parse(responseText);

        if (Array.isArray(response) && response.length > 0) {
            console.log('測試成功: 類別數據已獲取');
            console.log(response);
        } else {
            console.log('測試失敗: 類別數據格式不正確或為空');
        }
    } catch (error) {
        Logger.log('測試發生錯誤:', error);
    }
}

function testGetProducts() {
    try {
        const result = getProducts();
        const responseText = result.getContent();
        const response = JSON.parse(responseText);

        if (Array.isArray(response) && response.length > 0) {
            console.log('測試成功: 產品數據已獲取');
            console.log(response);
        } else {
            console.log('測試失敗: 產品數據格式不正確或為空');
        }
    } catch (error) {
        Logger.log('測試發生錯誤:', error);
    }
}

function testGetCustomers() {
    try {
        const result = getCustomers();
        const responseText = result.getContent();
        const response = JSON.parse(responseText);

        if (Array.isArray(response) && response.length > 0) {
            console.log('測試成功: 顧客數據已獲取');
            console.log(response);
        } else {
            console.log('測試失敗: 顧客數據格式不正確或為空');
        }
    } catch (error) {
        Logger.log('測試發生錯誤:', error);
    }
}