export const resources = {
  'en-US': {
    translation: {
      common: {
        errors: {
          requestFailed: 'The request failed.',
        },
      },
      auth: {
        login: {
          title: 'Login',
        },
        setup: {
          title: 'Create admin',
        },
      },
      chats: {
        workbench: {
          title: 'Chat workbench',
        },
      },
      errors: {
        unauthenticated: 'Please sign in to continue.',
        forbidden: 'You do not have permission to perform this action.',
        notFound: 'The requested resource was not found.',
        validationFailed: 'The request parameters are invalid.',
        internalError: 'The request failed.',
        passwordTooShort: 'Password must be at least {{min}} characters.',
      },
    },
  },
  'zh-CN': {
    translation: {
      common: {
        errors: {
          requestFailed: '请求失败。',
        },
      },
      auth: {
        login: {
          title: '登录',
        },
        setup: {
          title: '创建管理员',
        },
      },
      chats: {
        workbench: {
          title: '聊天工作台',
        },
      },
      errors: {
        unauthenticated: '请先登录。',
        forbidden: '你没有权限执行此操作。',
        notFound: '请求的资源不存在。',
        validationFailed: '请求参数无效。',
        internalError: '请求失败。',
        passwordTooShort: '密码至少需要 {{min}} 个字符。',
      },
    },
  },
  'zh-TW': {
    translation: {
      common: {
        errors: {
          requestFailed: '請求失敗。',
        },
      },
      auth: {
        login: {
          title: '登入',
        },
        setup: {
          title: '建立管理員',
        },
      },
      chats: {
        workbench: {
          title: '聊天工作台',
        },
      },
      errors: {
        unauthenticated: '請先登入。',
        forbidden: '你沒有權限執行此操作。',
        notFound: '請求的資源不存在。',
        validationFailed: '請求參數無效。',
        internalError: '請求失敗。',
        passwordTooShort: '密碼至少需要 {{min}} 個字元。',
      },
    },
  },
  'ja-JP': {
    translation: {
      common: {
        errors: {
          requestFailed: 'リクエストに失敗しました。',
        },
      },
      auth: {
        login: {
          title: 'ログイン',
        },
        setup: {
          title: '管理者を作成',
        },
      },
      chats: {
        workbench: {
          title: 'チャットワークベンチ',
        },
      },
      errors: {
        unauthenticated: '続行するにはログインしてください。',
        forbidden: 'この操作を実行する権限がありません。',
        notFound: '指定されたリソースが見つかりません。',
        validationFailed: 'リクエストパラメーターが無効です。',
        internalError: 'リクエストに失敗しました。',
        passwordTooShort: 'パスワードは {{min}} 文字以上で入力してください。',
      },
    },
  },
} as const;
