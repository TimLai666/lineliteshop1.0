import { getApiBaseUrl } from '../config'

// API 基礎設定
const API_BASE_URL = getApiBaseUrl()

// HTTP 請求工具函數
const httpRequest = async (url, options = {}) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    }

    try {
        const response = await fetch(url, config)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('API 請求失敗:', error)
        throw error
    }
}

// API 服務類別
export class ApiService {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    // GET 請求
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseUrl)
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key])
            }
        })

        return httpRequest(url.toString(), {
            method: 'GET'
        })
    }

    // POST 請求
    async post(endpoint, data = {}) {
        const url = new URL(endpoint, this.baseUrl)

        return httpRequest(url.toString(), {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    // PUT 請求
    async put(endpoint, data = {}) {
        const url = new URL(endpoint, this.baseUrl)

        return httpRequest(url.toString(), {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    // DELETE 請求
    async delete(endpoint) {
        const url = new URL(endpoint, this.baseUrl)

        return httpRequest(url.toString(), {
            method: 'DELETE'
        })
    }
}

// 建立 API 服務實例
export const apiService = new ApiService()
