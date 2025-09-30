import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Login from '@/views/login.vue';
import Home from '@/views/home.vue';
import Admin from '@/views/admin.vue';
import BookInfo from '@/views/bookInfo.vue';
import User from '@/views/user.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, isAdmin: true },
  },
  {
    path: '/bookInfo',
    name: 'BookInfo',
    component: BookInfo,
    meta: { requiresAuth: true },
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isAdmin = /* 这里根据实际情况判断是否为管理员 */ false;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.isAdmin && !isAdmin) {
    next('/home');
  } else {
    next();
  }
});

export default router;