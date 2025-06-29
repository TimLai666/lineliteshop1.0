function doGet(e) {
    // 確保有 sheet 參數
    if (!e.parameter.sheet) {
        return ContentService.createTextOutput('Missing sheet parameter');
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
            return ContentService.createTextOutput('Invalid sheet parameter');
    }
}

function getCategories() {
    const sheet = categorySheet;
    if (!sheet) {
        return ContentService.createTextOutput('Sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const categories = data.slice(1).map(row => ({
        name: row[0],
        description: row[1],
        isActive: row[2] === '是'
    }));

    return ContentService.createTextOutput(JSON.stringify(categories))
        .setMimeType(ContentService.MimeType.JSON);
}

function getProducts() {
    const sheet = productSheet;
    if (!sheet) {
        return ContentService.createTextOutput('Sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const products = data.slice(1).map(row => ({
        name: row[0],
        category: row[1],
        price: row[2],
        stock: row[3],
        status: row[4]
    }));

    return ContentService.createTextOutput(JSON.stringify(products))
        .setMimeType(ContentService.MimeType.JSON);
}