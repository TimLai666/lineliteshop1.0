import { createRouter, createWebHistory } from 'vue-router'
import UserRegister from '../views/UserRegister.vue'
import OrderFood from '../views/OrderFood.vue'

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
    }
]

const router = createRouter({
    history: createWebHistory('/liff/'),  // 設定基礎路徑為 /liff/
    routes
})

// 簡化的路由守衛
router.beforeEach((to, from, next) => {
    // 設定頁面標題
    if (to.meta.title) {
        document.title += " | " + to.meta.title
    }

    console.log('導航到:', to.path)
    next()
})

export default router
