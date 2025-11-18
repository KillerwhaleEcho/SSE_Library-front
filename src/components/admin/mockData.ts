import { type Document ,type InfoBrief,type User,type Comment} from '@/api/all.ts'
import { type CommentItem } from '@/api/admin';
import {type UserRow } from '@/api/admin';
import {type message,type chatBox} from'@/api/all'
import avatarIcon from '@/assets/icon_user.png'

export const MOCK_DOCUMENTS: Document[] = [
    {
      infoBrief:{
    name: 'Vue 3 实战指南',
    documentId: 101,
    type: 'book',
    uploadTime: '2024-05-12 09:30:00',
    status: '开放',
    category: '前端开发',
    collections: 128,
    readCounts: 532,
    URL: 'https://example.com/docs/vue3',
      },
    bookISBN: '978-7-121-12345-6',
    author: '张三',
    cover: 'https://picsum.photos/seed/vue3/120/160',
    introduction: '系统介绍 Vue 3 核心特性与实战案例。',
    createYear: '2023',
    tags: ['Vue', '前端', 'JavaScript'],
    },
   {
      infoBrief:{
    name: 'Vue 3 实战指南',
    documentId: 101,
    type: 'book',
    uploadTime: '2024-05-12 09:30:00',
    status: '开放',
    category: '前端开发',
    collections: 128,
    readCounts: 532,
    URL: 'https://example.com/docs/vue3',
      },
    bookISBN: '978-7-121-12345-6',
    author: '张三',
    cover: 'https://picsum.photos/seed/vue3/120/160',
    introduction: '系统介绍 Vue 3 核心特性与实战案例。',
    createYear: '2023',
    tags: ['Vue', '前端', 'JavaScript'],
    },
  {
   infoBrief: {
    name: 'Spring Boot 微服务实践',
    documentId: 102,
    type: 'book',
    uploadTime: '2024-06-01 14:15:00',
    status: '审核中',
    category: '后端开发',
    collections: 86,
    readCounts: 421,
      URL: 'https://example.com/docs/spring',
    },
    bookISBN: '978-7-111-65432-1',
    author: '李四',
    cover: 'https://picsum.photos/seed/spring/120/160',
    introduction: '覆盖 Spring Boot 微服务架构的核心概念与落地方案。',
    createYear: '2022',
    tags: ['Spring', '微服务', 'Java'],
  },
    {
    infoBrief: {
    name: '数据分析入门',
    documentId: 103,
    type: 'file',
    uploadTime: '2024-04-22 16:45:00',
    status: '关闭',
    category: '数据科学',
    collections: 64,
    readCounts: 308,
    URL: 'https://example.com/docs/data-analysis', 
      },
    bookISBN: '978-7-302-76543-0',
    author: '王五',
    cover: 'https://picsum.photos/seed/data/120/160',
    introduction: '以真实案例讲解 Pandas、NumPy 与可视化工具的使用。',
    createYear: '2021',
    tags: ['数据分析', 'Python', 'Pandas'],
  },
    {
        infoBrief: {
    name: '产品原型设计规范',
    documentId: 104,
    type: 'file',
    uploadTime: '2024-07-08 10:20:00',
    status: '已撤回',
    category: '产品设计',
    collections: 25,
    readCounts: 102,
    URL: 'https://example.com/docs/ux',   
      },
    bookISBN: '978-7-900-12345-0',
    author: '赵六',
    cover: 'https://picsum.photos/seed/ux/120/160',
    introduction: '梳理常见原型设计规范与组件库使用建议。',
    createYear: '2020',
    tags: ['产品设计', '原型', '交互'],
  },
] as const




 export const createMockComments = (): CommentItem[] => [
  {
    commentId: 1,
    commenter: {
      userId: 301,
      username: "Alice",
      userAvatar: "https://avatars.dicebear.com/api/initials/Alice.svg",
      status: "active",
      createTime: "2024-03-12 09:21:00",
      email: "alice@example.com",
      role: "admin",
    },
    document: {
      name: "现代教育技术研究报告",
      documentId: 9001,
      type: "file",
      uploadTime: "2024-03-10 18:32:00",
      status: "开放",
      category: "教育学",
      collections: 87,
      readCounts: 423,
      URL: "#",
    },
    create_at: "2024-03-18 10:15:26",
    content: "这份报告的数据分析部分非常详细，对课堂教学设计提供了很多启发。",
     },
    {
    commentId: 1,
    commenter: {
      userId: 301,
      username: "Alice",
      userAvatar: "https://avatars.dicebear.com/api/initials/Alice.svg",
      status: "active",
      createTime: "2024-03-12 09:21:00",
      email: "alice@example.com",
      role: "admin",
    },
    document: {
      name: "现代教育技术研究报告",
      documentId: 9001,
      type: "file",
      uploadTime: "2024-03-10 18:32:00",
      status: "开放",
      category: "教育学",
      collections: 87,
      readCounts: 423,
      URL: "#",
    },
    create_at: "2024-03-18 10:15:26",
    content: "这份报告的数据分析部分非常详细，对课堂教学设计提供了很多启发。",
  },  {
    commentId: 1,
    commenter: {
      userId: 301,
      username: "Alice",
      userAvatar: "https://avatars.dicebear.com/api/initials/Alice.svg",
      status: "active",
      createTime: "2024-03-12 09:21:00",
      email: "alice@example.com",
      role: "admin",
    },
    document: {
      name: "现代教育技术研究报告",
      documentId: 9001,
      type: "file",
      uploadTime: "2024-03-10 18:32:00",
      status: "开放",
      category: "教育学",
      collections: 87,
      readCounts: 423,
      URL: "#",
    },
    create_at: "2024-03-18 10:15:26",
    content: "这份报告的数据分析部分非常详细，对课堂教学设计提供了很多启发。",
  },
  {
    commentId: 2,
    commenter: {
      userId: 302,
      username: "Bob",
      userAvatar: "https://avatars.dicebear.com/api/initials/Bob.svg",
      status: "active",
      createTime: "2024-01-08 14:07:00",
      email: "bob@example.com",
      role: "user",
    },
    document: {
      name: "人工智能导论课程讲义",
      documentId: 9002,
      type: "file",
      uploadTime: "2024-02-26 11:48:00",
      status: "开放",
      category: "计算机科学",
      collections: 132,
      readCounts: 1024,
      URL: "#",
    },
    create_at: "2024-03-19 16:42:03",
    content: "整理得很系统，特别是第二章机器学习部分的思维导图，便于理解。",
  },
  {
    commentId: 3,
    commenter: {
      userId: 303,
      username: "Celia",
      userAvatar: "https://avatars.dicebear.com/api/initials/Celia.svg",
      status: "active",
      createTime: "2023-12-21 20:12:00",
      email: "celia@example.com",
      role: "user",
    },
    document: {
      name: "高等数学习题精解",
      documentId: 9003,
      type: "book",
      uploadTime: "2024-03-15 09:05:00",
      status: "开放",
      category: "数学",
      collections: 65,
      readCounts: 358,
      URL: "#",
    },
    create_at: "2024-03-20 08:27:51",
    content: "答案步骤写得很清晰，建议下一版能增加一些易错点小贴士。",
  },
];


export const DEMO_USERS: UserRow[] = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    status: "active",
  },
  {
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
    },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 4,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 5,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 6,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
    },
  {
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },{
    id: 2,
    name: "王五",
    email: "wangwu@example.com",
    status: "active",
  },
];


export const chatBoxFallback: chatBox[] = [
  {
    sessionId: 1001,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 2,
    userAvatar2: avatarIcon,
    userName2: "李四",
    lastMessage: "你好，请问这个商品还有货吗？",
    lastTime: "2024-01-15 14:30:25",
    unreadCount: 3
  },
  {
    sessionId: 1002,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 3,
    userAvatar2: avatarIcon,
    userName2: "王五",
    lastMessage: "明天下午可以送货",
    lastTime: "2024-01-15 13:45:12",
    unreadCount: 0
  },
  {
    sessionId: 1003,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 4,
    userAvatar2: avatarIcon,
    userName2: "赵六",
    lastMessage: "好的，我已经下单了",
    lastTime: "2024-01-15 12:20:33",
    unreadCount: 1
  },
  {
    sessionId: 1004,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 5,
    userAvatar2: avatarIcon,
    userName2: "钱七",
    lastMessage: "这个价格还能再优惠吗？",
    lastTime: "2024-01-15 11:15:47",
    unreadCount: 0
  },
  {
    sessionId: 1005,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 6,
    userAvatar2: avatarIcon,
    userName2: "孙八",
    lastMessage: "快递已经发出了",
    lastTime: "2024-01-15 10:05:19",
    unreadCount: 2
  },
  {
    sessionId: 1006,
    userId1: 1,
    userAvatar1: avatarIcon,
    userName1: "张三",
    userId2: 7,
    userAvatar2: avatarIcon,
    userName2: "周九",
    lastMessage: "谢谢你的帮助！",
    lastTime: "2024-01-15 09:30:55",
    unreadCount: 0
  }
];


export const messageFallback: message[] = [
  {
    sessionId: 1001,
    senderId: 2,
    sendTime: "2024-01-15 14:30:25",
    senderName: "李四",
    senderAvatar: avatarIcon,
    content: "你好，请问这个商品还有货吗？",
    status: '已发送'
  },
  {
    sessionId: 1001,
    senderId: 1,
    sendTime: "2024-01-15 14:31:10",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "有的，目前库存充足",
    status: '已发送'
  },
  {
    sessionId: 1001,
    senderId: 2,
    sendTime: "2024-01-15 14:32:05",
    senderName: "李四",
    senderAvatar: avatarIcon,
    content: "那太好了，我今天能下单吗？",
    status: '已发送'
  },
  {
    sessionId: 1001,
    senderId: 1,
    sendTime: "2024-01-15 14:33:20",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "当然可以，我们支持当天发货",
    status: '已发送'
  },
  {
    sessionId: 1002,
    senderId: 3,
    sendTime: "2024-01-15 13:45:12",
    senderName: "王五",
    senderAvatar: avatarIcon,
    content: "明天下午可以送货",
    status: '已发送'
  },
  {
    sessionId: 1002,
    senderId: 1,
    sendTime: "2024-01-15 13:46:30",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "好的，具体几点？",
    status: '已发送'
  },
  {
    sessionId: 1002,
    senderId: 3,
    sendTime: "2024-01-15 13:47:15",
    senderName: "王五",
    senderAvatar: avatarIcon,
    content: "下午2-4点之间",
    status: '未读'
  },
  {
    sessionId: 1003,
    senderId: 4,
    sendTime: "2024-01-15 12:20:33",
    senderName: "赵六",
    senderAvatar: avatarIcon,
    content: "好的，我已经下单了",
    status: '已发送'
  },
  {
    sessionId: 1003,
    senderId: 1,
    sendTime: "2024-01-15 12:21:45",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "收到，我们会尽快处理",
    status: '未接收'
  },
  {
    sessionId: 1004,
    senderId: 5,
    sendTime: "2024-01-15 11:15:47",
    senderName: "钱七",
    senderAvatar: avatarIcon,
    content: "这个价格还能再优惠吗？",
    status: '已发送'
  },
  {
    sessionId: 1004,
    senderId: 1,
    sendTime: "2024-01-15 11:16:30",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "这是最低价了，还包邮哦",
    status: '已发送'
  },
  {
    sessionId: 1005,
    senderId: 1,
    sendTime: "2024-01-15 10:05:19",
    senderName: "张三",
    senderAvatar: avatarIcon,
    content: "快递已经发出了",
    status: '已发送'
  },
  {
    sessionId: 1005,
    senderId: 6,
    sendTime: "2024-01-15 10:06:22",
    senderName: "孙八",
    senderAvatar: avatarIcon,
    content: "太好了，期待收货",
    status: '未读'
  },
  {
    sessionId: 1006,
    senderId: 7,
    sendTime: "2024-01-15 09:30:55",
    senderName: "周九",
    senderAvatar: avatarIcon,
    content: "谢谢你的帮助！",
    status: '已发送'
  }
];
