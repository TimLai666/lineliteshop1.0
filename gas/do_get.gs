function doGet(e) {
    // 驗證 token
    if (!e.parameter.token || e.parameter.token !== settings.token) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Invalid or missing token'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // 確保有 sheet 參數
    if (!e.parameter.sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Missing sheet parameter'
        })).setMimeType(ContentService.MimeType.JSON);
    }

    // 根據 sheet 執行不同的操作
    switch (e.parameter.sheet) {
        case 'CATEGORIES':
            return getCategories();
        case 'PRODUCTS':
            return getProducts();
        case 'CUSTOMERS':
            return getCustomers();
        case 'ORDERS':
            return getOrders();
        default:
            return ContentService.createTextOutput(JSON.stringify({
                status: 'error',
                message: 'Invalid sheet parameter'
            })).setMimeType(ContentService.MimeType.JSON);
    }
}

function getCategories() {
    const sheet = categorySheet;
    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Sheet not found',
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const categories = data.slice(1).map(row => ({
        name: row[0],
        description: row[1],
        is_active: row[2] === '是'
    }));

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: categories,
    }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getProducts() {
    const sheet = productSheet;
    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Sheet not found',
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const products = data.slice(1).map(row => ({
        name: row[0],
        category: row[1],
        price: row[2],
        stock: row[3],
        status: row[4]
    }));

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: products,
    }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getCustomers() {
    const sheet = customerSheet;
    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Sheet not found',
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const customers = data.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        birthday: row[2],
        phone: row[3],
        note: row[4]
    }));

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: customers,
    }))
        .setMimeType(ContentService.MimeType.JSON);
}

function getOrders() {
    const sheet = orderSheet;
    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: 'Sheet not found',
        })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const orders = data.slice(1).map(row => ({
        id: row[0],
        products: row[1] ? row[1].split(', ').map(item => {
            const [product, quantity] = item.split('*');
            return { product, quantity: parseInt(quantity, 10) || 0 };
        }) : [], // 如果產品資料為空，返回空陣列
        customer_id: row[2],
        customer_name: row[3],
        status: row[4],
        time: row[5],
        totalAmount: row[6],
        customer_note: row[7],  // 顧客輸入的備註
        internal_note: row[8],  // 店家筆記

    }));

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: orders,
    }))
        .setMimeType(ContentService.MimeType.JSON);
}