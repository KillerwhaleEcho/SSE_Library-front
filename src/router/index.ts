import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Login from '@/views/login.vue';
import Home from '@/views/home.vue';
import Admin from '@/views/admin.vue';
import BookInfo from '@/views/bookInfo.vue';
import PostInfo from '@/views/postInfo.vue';
import User from '@/views/user.vue';
import Posts from '@/views/posts.vue';
import Chat from '@/views/chatView.vue';

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
    path: '/postInfo',
    name: 'PostInfo',
    component: PostInfo,
    meta: { requiresAuth: true },
    props: (route) => ({ postId: route.query.postId }),
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: { requiresAuth: true },
    // 当缺少 userId 时，使用本地存储的真实 ID 进行重定向
    beforeEnter: (to, _from, next) => {
      const normalizeUserId = (value: unknown): number | null => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      };

      const fromQuery = normalizeUserId(to.query.userId);
      if (fromQuery !== null) {
        next();
        return;
      }

      const storedId = normalizeUserId(localStorage.getItem('userId'));
      if (storedId !== null) {
        next({ path: '/user', query: { userId: storedId.toString() }, replace: true });
        return;
      }

      next('/login');
    },
    props: (route) => {
      const parsed = Number(route.query.userId);
      return { userId: Number.isFinite(parsed) ? parsed : undefined };
    },
  },
  {
    path: '/posts',
    name: 'Posts',
    component: Posts,
    meta: { requiresAuth: true },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true },
  },
  {
    path: '/sendPost',
    name: 'SendPost',
    component: () => import('@/views/sendPost.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isAdmin = /* 这里根据实际情况判断是否为管理员 */ false;

  // 类型断言
  const win = window as any;
  if (win.activeRequests) {
    win.activeRequests.forEach((controller: AbortController) => controller.abort());
    win.activeRequests = [];
  }
  
  if (win.activeTimers) {
    win.activeTimers.forEach((timer: number) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    win.activeTimers = [];
  }
  
  // 3. 给Vue一点时间完成组件卸载
  setTimeout(() => {
    next()
  }, 0)

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.isAdmin && !isAdmin) {
    next('/home');
  } else {
    next();
  }
});

export default router;
