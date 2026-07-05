export const resources = {
  "en-US": {
    translation: {
      common: {
        errors: {
          requestFailed: "The request failed.",
        },
      },
      assets: {
        navigation: {
          back: "Back",
        },
        scope: {
          all: "All",
          mine: "Mine",
          public: "Public",
        },
        sort: {
          fieldLabel: "Sort field",
          directionLabel: "Sort direction",
          ascending: "Ascending",
          descending: "Descending",
        },
        pagination: {
          navigationLabel: "Pagination",
          pageSizeLabel: "Items per page",
          firstPage: "First page",
          previousPage: "Previous page",
          nextPage: "Next page",
          lastPage: "Last page",
        },
      },
      auth: {
        login: {
          title: "Login",
          submit: "Login",
        },
        setup: {
          title: "Create admin",
          submit: "Create",
        },
        form: {
          username: "Account",
          password: "Password",
          validation:
            "Enter an account and a password of at least 12 characters.",
        },
      },
      chats: {
        workbench: {
          title: "Chat workbench",
        },
      },
      characters: {
        list: {
          title: "Character cards",
          importAction: "Import character card",
          createAction: "New character card",
          searchLabel: "Search character cards",
          searchPlaceholder: "Search name, comment, or tags",
          loading: "Loading character cards",
          loadFailed: "Failed to load character cards",
          empty: "No character cards yet",
          publicVisibility: "Public",
          privateVisibility: "Private",
          unused: "Unused",
          usageCount: "{{count}} times",
          sort: {
            createdAt: "Created time",
            updatedAt: "Updated time",
            name: "A-Z",
            lastUsedAt: "Recently used",
            usageCount: "Most used",
          },
        },
        editor: {
          createTitle: "New character card",
          editTitle: "Edit character card",
          createSubmit: "Create",
          saveSubmit: "Save",
          mainEditorLabel: "Character card main editor",
          sections: {
            basic: {
              title: "Basic info",
              description:
                "Core identity information used in lists and chat selection",
            },
            content: {
              title: "Character content",
              description:
                "Controls persona, opening dialogue, and example tone",
            },
            prompts: {
              title: "Prompt overrides",
              description:
                "Overrides prompt fragments used during context assembly",
            },
            metadata: {
              title: "Metadata",
              description: "Creator information that can be edited directly",
            },
          },
          fields: {
            name: "Name",
            comment: "Comment",
            tags: "Tags",
            tagsDescription: "Separate multiple tags with commas",
            version: "Version",
            visibility: "Visibility",
            description: "Character description",
            firstMessage: "First message",
            alternateGreetings: "Alternate greetings",
            personality: "Persona summary",
            scenario: "Scenario",
            creatorNotes: "Creator notes",
            messageExample: "Dialogue example",
            systemPrompt: "System prompt",
            postHistoryInstructions: "Post-history instructions",
            creator: "Creator",
            nickname: "Nickname",
          },
          errors: {
            nameRequired: "Name is required.",
            saveFailed: "Failed to save character card.",
          },
        },
        greetings: {
          title: "Opening messages",
          sectionTitle: "Alternate greetings",
          itemLabel: "Greeting {{index}}",
          deleteAction: "Delete greeting {{index}}",
          addAction: "Add greeting",
        },
        import: {
          title: "Import character card",
          fileSectionTitle: "Select file",
          chooseFile: "Choose a JSON or PNG character card",
          fileRequired: "Choose a character card file",
          failed: "Failed to import character card",
          submit: "Confirm import",
        },
      },
      errors: {
        unauthenticated: "Please sign in to continue.",
        forbidden: "You do not have permission to perform this action.",
        notFound: "The requested resource was not found.",
        validationFailed: "The request parameters are invalid.",
        internalError: "The request failed.",
        passwordTooShort: "Password must be at least {{min}} characters.",
      },
    },
  },
  "zh-CN": {
    translation: {
      common: {
        errors: {
          requestFailed: "请求失败。",
        },
      },
      assets: {
        navigation: {
          back: "返回",
        },
        scope: {
          all: "全部",
          mine: "我的",
          public: "公开",
        },
        sort: {
          fieldLabel: "排序字段",
          directionLabel: "排序方向",
          ascending: "升序",
          descending: "降序",
        },
        pagination: {
          navigationLabel: "分页",
          pageSizeLabel: "每页数量",
          firstPage: "第一页",
          previousPage: "上一页",
          nextPage: "下一页",
          lastPage: "最后一页",
        },
      },
      auth: {
        login: {
          title: "登录",
          submit: "登录",
        },
        setup: {
          title: "创建管理员",
          submit: "创建",
        },
        form: {
          username: "账号",
          password: "密码",
          validation: "请输入账号，并填写至少 12 位密码。",
        },
      },
      chats: {
        workbench: {
          title: "聊天工作台",
        },
      },
      characters: {
        list: {
          title: "角色卡",
          importAction: "导入角色卡",
          createAction: "新增角色卡",
          searchLabel: "搜索角色卡",
          searchPlaceholder: "搜索名称、注释、标签",
          loading: "正在加载角色卡",
          loadFailed: "角色卡加载失败",
          empty: "暂无角色卡",
          publicVisibility: "公开",
          privateVisibility: "私有",
          unused: "未使用",
          usageCount: "{{count}} 次",
          sort: {
            createdAt: "创建时间",
            updatedAt: "更新时间",
            name: "A-Z",
            lastUsedAt: "最近使用",
            usageCount: "最常使用",
          },
        },
        editor: {
          createTitle: "新增角色卡",
          editTitle: "编辑角色卡",
          createSubmit: "创建",
          saveSubmit: "保存",
          mainEditorLabel: "角色卡主编辑",
          sections: {
            basic: {
              title: "基础信息",
              description: "角色卡在列表和聊天选择中的基本识别信息",
            },
            content: {
              title: "角色内容",
              description: "控制角色人设、对话开场和示例语气",
            },
            prompts: {
              title: "提示词覆盖",
              description: "覆盖上下文组装时使用的提示词片段",
            },
            metadata: {
              title: "元数据",
              description: "可直接维护的创作者信息",
            },
          },
          fields: {
            name: "名称",
            comment: "注释",
            tags: "标签",
            tagsDescription: "用逗号分隔多个标签",
            version: "版本号",
            visibility: "权限",
            description: "角色描述",
            firstMessage: "第一条消息",
            alternateGreetings: "其他开场",
            personality: "角色设定摘要",
            scenario: "情景",
            creatorNotes: "角色备注",
            messageExample: "对话示例",
            systemPrompt: "系统提示词",
            postHistoryInstructions: "历史后提示",
            creator: "创建者",
            nickname: "昵称",
          },
          errors: {
            nameRequired: "名称不能为空",
            saveFailed: "保存角色卡失败",
          },
        },
        greetings: {
          title: "开场消息",
          sectionTitle: "其他开场",
          itemLabel: "开场 {{index}}",
          deleteAction: "删除开场 {{index}}",
          addAction: "添加开场",
        },
        import: {
          title: "导入角色卡",
          fileSectionTitle: "选择文件",
          chooseFile: "选择 JSON 或 PNG 角色卡",
          fileRequired: "请选择角色卡文件",
          failed: "导入角色卡失败",
          submit: "确认导入",
        },
      },
      errors: {
        unauthenticated: "请先登录。",
        forbidden: "你没有权限执行此操作。",
        notFound: "请求的资源不存在。",
        validationFailed: "请求参数无效。",
        internalError: "请求失败。",
        passwordTooShort: "密码至少需要 {{min}} 个字符。",
      },
    },
  },
  "zh-TW": {
    translation: {
      common: {
        errors: {
          requestFailed: "請求失敗。",
        },
      },
      assets: {
        navigation: {
          back: "返回",
        },
        scope: {
          all: "全部",
          mine: "我的",
          public: "公開",
        },
        sort: {
          fieldLabel: "排序欄位",
          directionLabel: "排序方向",
          ascending: "升冪",
          descending: "降冪",
        },
        pagination: {
          navigationLabel: "分頁",
          pageSizeLabel: "每頁數量",
          firstPage: "第一頁",
          previousPage: "上一頁",
          nextPage: "下一頁",
          lastPage: "最後一頁",
        },
      },
      auth: {
        login: {
          title: "登入",
          submit: "登入",
        },
        setup: {
          title: "建立管理員",
          submit: "建立",
        },
        form: {
          username: "帳號",
          password: "密碼",
          validation: "請輸入帳號，並填寫至少 12 位密碼。",
        },
      },
      chats: {
        workbench: {
          title: "聊天工作台",
        },
      },
      characters: {
        list: {
          title: "角色卡",
          importAction: "匯入角色卡",
          createAction: "新增角色卡",
          searchLabel: "搜尋角色卡",
          searchPlaceholder: "搜尋名稱、註釋、標籤",
          loading: "正在載入角色卡",
          loadFailed: "角色卡載入失敗",
          empty: "尚無角色卡",
          publicVisibility: "公開",
          privateVisibility: "私人",
          unused: "未使用",
          usageCount: "{{count}} 次",
          sort: {
            createdAt: "建立時間",
            updatedAt: "更新時間",
            name: "A-Z",
            lastUsedAt: "最近使用",
            usageCount: "最常使用",
          },
        },
        editor: {
          createTitle: "新增角色卡",
          editTitle: "編輯角色卡",
          createSubmit: "建立",
          saveSubmit: "儲存",
          mainEditorLabel: "角色卡主編輯器",
          sections: {
            basic: {
              title: "基本資訊",
              description: "角色卡在列表和聊天選擇中的基本識別資訊",
            },
            content: {
              title: "角色內容",
              description: "控制角色人設、對話開場和示例語氣",
            },
            prompts: {
              title: "提示詞覆蓋",
              description: "覆蓋組裝上下文時使用的提示詞片段",
            },
            metadata: {
              title: "中繼資料",
              description: "可直接維護的創作者資訊",
            },
          },
          fields: {
            name: "名稱",
            comment: "註釋",
            tags: "標籤",
            tagsDescription: "用逗號分隔多個標籤",
            version: "版本號",
            visibility: "權限",
            description: "角色描述",
            firstMessage: "第一則訊息",
            alternateGreetings: "其他開場",
            personality: "角色設定摘要",
            scenario: "情境",
            creatorNotes: "角色備註",
            messageExample: "對話示例",
            systemPrompt: "系統提示詞",
            postHistoryInstructions: "歷史後提示",
            creator: "建立者",
            nickname: "暱稱",
          },
          errors: {
            nameRequired: "名稱不能為空",
            saveFailed: "儲存角色卡失敗",
          },
        },
        greetings: {
          title: "開場訊息",
          sectionTitle: "其他開場",
          itemLabel: "開場 {{index}}",
          deleteAction: "刪除開場 {{index}}",
          addAction: "新增開場",
        },
        import: {
          title: "匯入角色卡",
          fileSectionTitle: "選擇檔案",
          chooseFile: "選擇 JSON 或 PNG 角色卡",
          fileRequired: "請選擇角色卡檔案",
          failed: "匯入角色卡失敗",
          submit: "確認匯入",
        },
      },
      errors: {
        unauthenticated: "請先登入。",
        forbidden: "你沒有權限執行此操作。",
        notFound: "請求的資源不存在。",
        validationFailed: "請求參數無效。",
        internalError: "請求失敗。",
        passwordTooShort: "密碼至少需要 {{min}} 個字元。",
      },
    },
  },
  "ja-JP": {
    translation: {
      common: {
        errors: {
          requestFailed: "リクエストに失敗しました。",
        },
      },
      assets: {
        navigation: {
          back: "戻る",
        },
        scope: {
          all: "すべて",
          mine: "自分",
          public: "公開",
        },
        sort: {
          fieldLabel: "並び替え項目",
          directionLabel: "並び替え方向",
          ascending: "昇順",
          descending: "降順",
        },
        pagination: {
          navigationLabel: "ページネーション",
          pageSizeLabel: "1ページあたりの件数",
          firstPage: "最初のページ",
          previousPage: "前のページ",
          nextPage: "次のページ",
          lastPage: "最後のページ",
        },
      },
      auth: {
        login: {
          title: "ログイン",
          submit: "ログイン",
        },
        setup: {
          title: "管理者を作成",
          submit: "作成",
        },
        form: {
          username: "アカウント",
          password: "パスワード",
          validation:
            "アカウントと 12 文字以上のパスワードを入力してください。",
        },
      },
      chats: {
        workbench: {
          title: "チャットワークベンチ",
        },
      },
      characters: {
        list: {
          title: "キャラクターカード",
          importAction: "キャラクターカードをインポート",
          createAction: "新規キャラクターカード",
          searchLabel: "キャラクターカードを検索",
          searchPlaceholder: "名前、コメント、タグを検索",
          loading: "キャラクターカードを読み込んでいます",
          loadFailed: "キャラクターカードの読み込みに失敗しました",
          empty: "キャラクターカードはまだありません",
          publicVisibility: "公開",
          privateVisibility: "非公開",
          unused: "未使用",
          usageCount: "{{count}} 回",
          sort: {
            createdAt: "作成日時",
            updatedAt: "更新日時",
            name: "A-Z",
            lastUsedAt: "最近使用",
            usageCount: "使用回数が多い順",
          },
        },
        editor: {
          createTitle: "新規キャラクターカード",
          editTitle: "キャラクターカードを編集",
          createSubmit: "作成",
          saveSubmit: "保存",
          mainEditorLabel: "キャラクターカードメインエディター",
          sections: {
            basic: {
              title: "基本情報",
              description: "一覧とチャット選択で使う基本識別情報",
            },
            content: {
              title: "キャラクター内容",
              description: "人物像、開始メッセージ、例示口調を制御します",
            },
            prompts: {
              title: "プロンプト上書き",
              description:
                "コンテキスト組み立て時に使うプロンプト断片を上書きします",
            },
            metadata: {
              title: "メタデータ",
              description: "直接編集できる作成者情報",
            },
          },
          fields: {
            name: "名前",
            comment: "コメント",
            tags: "タグ",
            tagsDescription: "複数のタグはカンマで区切ります",
            version: "バージョン",
            visibility: "権限",
            description: "キャラクター説明",
            firstMessage: "最初のメッセージ",
            alternateGreetings: "別の開始メッセージ",
            personality: "人物像の要約",
            scenario: "シナリオ",
            creatorNotes: "作成者メモ",
            messageExample: "会話例",
            systemPrompt: "システムプロンプト",
            postHistoryInstructions: "履歴後プロンプト",
            creator: "作成者",
            nickname: "ニックネーム",
          },
          errors: {
            nameRequired: "名前は必須です。",
            saveFailed: "キャラクターカードの保存に失敗しました。",
          },
        },
        greetings: {
          title: "開始メッセージ",
          sectionTitle: "別の開始メッセージ",
          itemLabel: "開始 {{index}}",
          deleteAction: "開始 {{index}} を削除",
          addAction: "開始を追加",
        },
        import: {
          title: "キャラクターカードをインポート",
          fileSectionTitle: "ファイルを選択",
          chooseFile: "JSON または PNG キャラクターカードを選択",
          fileRequired: "キャラクターカードファイルを選択してください",
          failed: "キャラクターカードのインポートに失敗しました",
          submit: "インポートを確定",
        },
      },
      errors: {
        unauthenticated: "続行するにはログインしてください。",
        forbidden: "この操作を実行する権限がありません。",
        notFound: "指定されたリソースが見つかりません。",
        validationFailed: "リクエストパラメーターが無効です。",
        internalError: "リクエストに失敗しました。",
        passwordTooShort: "パスワードは {{min}} 文字以上で入力してください。",
      },
    },
  },
} as const;
