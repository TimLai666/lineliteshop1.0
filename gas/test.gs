function testAddOrder() {
    const orderData = {
        order: {
            products: [{ product: '章魚燒', quantity: 2 }, { product: '西瓜汁', quantity: 2 }], // 使用產品名稱
            customer_id: 'C001',
            customer_note: '請不要太辣，謝謝！'
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

function testGetOrders() {
    try {
        const result = getOrders();
        const responseText = result.getContent();
        const orders = JSON.parse(responseText);

        if (Array.isArray(orders) && orders.length > 0) {
            // 獲取產品資訊用於遞迴展開
            const productsResult = getProducts();
            const productsResponseText = productsResult.getContent();
            const products = JSON.parse(productsResponseText);

            // 遞迴展開每個訂單中的產品資訊
            const expandedOrders = orders.map(order => {
                const expandedProducts = order.products.map(orderProduct => {
                    return {
                        ...orderProduct,
                    };
                });

                return {
                    ...order,
                    products: expandedProducts,
                };
            });

            console.log('測試成功: 訂單數據已獲取並遞迴展開產品資訊');
            console.log('展開後的訂單資料:', JSON.stringify(expandedOrders, null, 2));
        } else {
            console.log('測試失敗: 訂單數據格式不正確或為空');
        }
    } catch (error) {
        Logger.log('測試發生錯誤:', error);
    }
}

function testUpdateOrder() {
    const orderData = {
        action: 'UPDATE_ORDER',
        order: {
            id: 1, // 假設要更新的訂單ID
            status: '已完成', // 更新訂單狀態
            total_amount: 500, // 更新訂單總金額
            internal_note: '更新備註',
        },
    };

    try {
        const result = updateOrder(orderData);
        const responseText = result.getContent();
        const response = JSON.parse(responseText);

        if (response.status === 'success') {
            console.log('測試成功: 訂單已更新');
        } else {
            console.log('測試失敗:', response.message);
        }
    } catch (error) {
        console.error('測試發生錯誤:', error);
    }
}