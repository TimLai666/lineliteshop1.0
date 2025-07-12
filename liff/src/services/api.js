// API 基礎服務
const getApiBaseUrl = () => '/api'


export const apiService = {
    // GET 請求
    async get(endpoint, params = {}) {
        const baseUrl = getApiBaseUrl()
        let url = baseUrl + '/' + endpoint

        // 處理查詢參數
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, value)
        })

        if (searchParams.toString()) {
            url += '?' + searchParams.toString()
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`)
            error.status = response.status
            throw error
        }

        return response.json()
    },

    // POST 請求
    async post(endpoint, data = {}) {
        const baseUrl = getApiBaseUrl()
        const url = baseUrl + '/' + endpoint

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`)
            error.status = response.status
            throw error
        }

        return response.json()
    },

    // PUT 請求
    async put(endpoint, data = {}) {
        const baseUrl = getApiBaseUrl()
        const url = baseUrl + '/' + endpoint

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`)
            error.status = response.status
            throw error
        }

        return response.json()
    },

    // PATCH 請求
    async patch(endpoint, data = {}) {
        const baseUrl = getApiBaseUrl()
        const url = baseUrl + '/' + endpoint

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`)
            error.status = response.status
            throw error
        }

        return response.json()
    }
}
