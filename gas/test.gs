function testAddOrder() {
    const orderData = {
        order: {
            product: ['章魚燒', '西瓜汁'],
            customer_id: 'C001',
        },
    };

    addOrder(orderData);
}