const settings = new Proxy({}, {
    get(_, prop) {
        const sheet = settingsSheet;
        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
            const key = data[i][0];
            const value = data[i][2];
            if (key === prop) {
                return value;
            }
        }
        return undefined;
    }
});
