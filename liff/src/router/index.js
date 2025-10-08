import { createRouter, createWebHistory } from 'vue-router'
import UserRegister from '../views/UserRegister.vue'
import OrderFood from '../views/OrderFood.vue'
import MyOrders from '../views/MyOrders.vue'
import liff from '@line/liff'
import { validateUserForNavigation, UserValidator } from '../utils/userValidator.js'

const routes = [
    {
        path: '/',
        redirect: () => {
            // 重定向到點餐頁面
            return { name: 'OrderFood' }
        }
    },
    {
        path: '/register',
        name: 'UserRegister',
        component: UserRegister,
        meta: {
            title: '用戶註冊'
        }
    },
    {
        path: '/order',
        name: 'OrderFood',
        component: OrderFood,
        meta: {
            title: '線上點餐'
        }
    },
    {
        path: '/my-orders',
        name: 'MyOrders',
        component: MyOrders,
        meta: {
            title: '我的訂單'
        }
    }
]

const router = createRouter({
    history: createWebHistory('/liff/'),  // 設定基礎路徑為 /liff/
    routes
})

// 簡化的路由守衛
router.beforeEach(async (to, from, next) => {
    try {
        console.log('路由守衛: 導航至', to.path, '路由名稱:', to.name)

        // 獲取用戶 ID
        const user_line_uid = await UserValidator.getUserIdFromLiff(liff)
        console.log('路由守衛: 用戶 LINE UID:', user_line_uid)

        // 使用驗證工具檢查用戶狀態
        const validation = await validateUserForNavigation(user_line_uid, to.name, to)

        if (validation.shouldRedirect) {
            console.log('路由守衛: 需要重定向到', validation.redirectTo)
            return next({ name: validation.redirectTo, query: validation.query })
        }

        // 設定頁面標題
        if (to.meta.title) {
            document.title = "小小商家一點靈 | " + to.meta.title
        }

        console.log('路由守衛: 驗證通過，導航到:', to.path)
        next()

    } catch (error) {
        console.error('路由守衛錯誤:', error)
        // 發生任何錯誤都重定向到註冊頁面
        if (to.name !== 'UserRegister') {
            console.log('路由守衛: 發生錯誤，重定向到註冊頁面')
            return next({ name: 'UserRegister' })
        }
        next()
    }
})

export default router
