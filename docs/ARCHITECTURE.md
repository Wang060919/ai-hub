# AI Hub 架构设计

本文档定义 AI Hub 的分层架构、模块职责与接入规范。V1.1 阶段将按此架构重塑项目结构。

## 文档优先级

当前 V1.x 主线文档统一按以下顺序使用：

1. `docs/VERSION_PLAN.md`
2. `docs/ARCHITECTURE.md`
3. `docs/TASKS.md`
4. `README.md`

以下文档为历史参考，不再作为当前版本开发的直接裁决依据：

- `docs/AI_Hub_Version_Roadmap.md`
- `docs/AI_Hub_Implementation_Plan.md`
- `docs/AI_Hub_Project_Planning.md`

## 一、分层架构总览

```
┌─────────────────────────────────────────┐
│              Frontend 层                 │
│  页面 / 组件 / 路由 / 前端状态管理       │
├─────────────────────────────────────────┤
│               API 层                    │
│  REST 接口定义 / 请求校验 / 响应格式化    │
├─────────────────────────────────────────┤
│             Modules 层                  │
│  功能模块：chat / files / kb / screen    │
│           / voice / sandbox / skills    │
├─────────────────────────────────────────┤
│            Services 层                  │
│  业务逻辑：对话管理 / 文件解析 / 全文检索 │
│           / 语音处理 / 沙盒执行          │
├─────────────────────────────────────────┤
│            Adapters 层                  │
│  外部系统适配：LLM / ChromaDB / Docker   │
│              / STT / TTS / Dify         │
├─────────────────────────────────────────┤
│             Core 层                     │
│  配置 / 日志 / 错误处理 / 事件总线       │
│   / 模型路由 / 技能注册                  │
└─────────────────────────────────────────┘
```

## 二、各层职责

### Core 层（`backend/core/`）

基础能力层，不包含业务逻辑：

- `config.py` — 配置管理，统一读取环境变量与配置文件
- `logging.py` — 日志管理，统一日志格式与输出
- `errors.py` — 错误处理，统一异常定义与错误响应
- `events.py` — 事件总线，模块间松耦合通信
- `model_router.py` — 模型路由，根据请求特征分发到不同模型
- `skill_registry.py` — 技能注册中心，管理技能生命周期

### Adapters 层（`backend/adapters/`）

外部系统适配，每个 adapter 封装一个外部依赖：

- `llm/` — 大模型适配（OpenAI / Ollama / DeepSeek 等）
- `chromadb/` — ChromaDB 适配预留（V1.5+ 预留，当前未落地）
- `docker/` — Docker 沙盒适配
- `stt/` — 语音转文字适配
- `tts/` — 文字转语音适配
- `dify/` — Dify API 适配

Adapter 规则：

- 每个 adapter 必须定义抽象接口
- 具体实现可替换，不侵入上层
- adapter 不持有业务状态

### Services 层（`backend/services/`）

业务逻辑层，编排 adapter 与 core 能力：

- `chat/` — 对话管理、会话上下文、消息流控
- `file/` — 文件解析、内容提取、格式转换
- `knowledge/` — 文档切片、全文检索、检索增强问答
- `screen/` — 屏幕识别、区域感知、监控调度
- `voice/` — 语音对话编排、VAD 调度
- `sandbox/` — 沙盒任务编排、安全策略

Service 规则：

- service 调用 adapter，不直接操作外部系统
- service 可调用多个 adapter 完成一个业务
- service 通过 core 层获取配置、记录日志

### Modules 层（已移除）

`backend/modules/` 曾作为功能模块层，但所有目录始终为空 scaffold，实际未承载任何业务逻辑。
当前架构中，`api/routes/` 直接调用 `services/` 层，不再经过 modules 中间层。

### API 层（`backend/api/`）

对外接口层：

- `routes/` — 按功能模块拆分的路由文件
- `schemas/` — 请求/响应 Pydantic 模型
- `middleware/` — 认证、限流、CORS 等中间件
- `dependencies/` — FastAPI 依赖注入

API 规则：

- 一个路由文件对应一个功能模块
- schema 复用，避免重复定义
- 不在路由中写业务逻辑

### Frontend 层（`frontend/`）

前端页面与组件：

- `pages/` — 页面级组件（Chat / Files / Knowledge / Screen / Settings）
- `components/` — 通用 UI 组件（消息气泡 / 文件列表 / 加载状态等）
- `hooks/` — 自定义 React/Vue hooks
- `services/` — 前端 API 调用封装
- `stores/` — 前端状态管理

Frontend 规则：

- 每个页面对应一个 module
- 通用组件抽取到 components/
- API 调用统一通过 services/ 封装
- 不允许在页面组件中直接写 fetch/axios 调用

## 三、前后端通信规范

- 协议：HTTP REST + JSON（实时场景用 SSE / WebSocket）
- 统一响应格式：

```json
{
  "status": "ok",
  "data": {},
  "error": null
}
```

- 统一错误格式：

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "human readable message"
  }
}
```

- 前端通过 `frontend/services/` 封装所有 API 调用
- 后端通过 `backend/api/routes/` 暴露接口

## 四、配置管理

- 所有配置通过 `backend/core/config.py` 统一读取
- 优先级：环境变量 > `.env` 文件 > 默认值
- 前端配置通过后端 `/config` 接口获取（仅返回前端需要的公开配置）
- 敏感配置（API Key 等）不暴露给前端

## 五、日志与错误处理

- 统一日志格式：时间戳 + 级别 + 模块 + 消息
- 错误分类：业务错误 / 系统错误 / 外部依赖错误
- 业务错误返回友好提示，系统错误记录完整堆栈
- adapter 层的错误统一转换为内部错误码再向上抛出

## 六、目录结构规划（V1.1 完成后）

```text
ai-hub/
├── backend/
│   ├── main.py                  # FastAPI 应用入口
│   ├── core/                    # 基础能力层
│   │   ├── config.py
│   │   ├── logging.py
│   │   ├── errors.py
│   │   ├── events.py
│   │   ├── model_router.py
│   │   └── skill_registry.py
│   ├── adapters/                # 外部系统适配层
│   │   ├── llm/
│   │   ├── chromadb/
│   │   ├── docker/
│   │   ├── stt/
│   │   ├── tts/
│   │   └── dify/
│   ├── services/                # 业务逻辑层
│   │   ├── chat/
│   │   ├── file/
│   │   ├── knowledge/
│   │   ├── screen/
│   │   ├── voice/
│   │   └── sandbox/
│   ├── modules/                 # 功能模块层
│   │   ├── chat/
│   │   ├── files/
│   │   ├── knowledge/
│   │   ├── screen/
│   │   ├── voice/
│   │   ├── sandbox/
│   │   └── skills/
│   └── api/                     # API 接口层
│       ├── routes/
│       ├── schemas/
│       ├── middleware/
│       └── dependencies/
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── stores/
├── src-tauri/                   # Tauri 桌面壳
├── docs/                        # 项目文档
├── scripts/                     # 测试与工具脚本
└── data/                        # 本地数据（不提交）
```

## 七、模块接入流程

新功能接入 AI Hub 的标准流程：

1. 确定功能属于哪个 service
2. 在 `backend/services/<service>/` 下实现业务逻辑
3. 如需外部依赖，在 `backend/adapters/<adapter>/` 下实现适配
4. 在 `backend/api/routes/` 下添加路由
5. 在 `backend/api/schemas/` 下添加请求/响应模型
6. 在 `frontend/pages/` 下添加页面
7. 在 `frontend/services/` 下封装 API 调用
8. 更新架构文档

## 八、已清理的预留位置

以下曾作为预留目录，现已按"不得顺手预埋"原则移除：

- ~~`backend/modules/`~~ — 所有子目录（chat、files、knowledge、screen、voice、sandbox、skills）均为空 scaffold，已删除

仍保留的 adapter 目录：

- `backend/adapters/deepseek.py` — DeepSeek API 适配（V1.2 已实现）

后续如需引入新的 service 或 adapter，按当前阶段版本路线图明确允许后再创建目录。

V1.7 当前主题补充：

- V1.7 主题已固定为“本地 Markdown 笔记接入 / Obsidian Bridge 第一版”
- 该阶段优先复用现有 `files` 与 `knowledge` 模块
- 第一版重点是手动指定 Markdown 单文件或受控目录接入
- 当前后端 Markdown 接入入口为 `POST /knowledge/index-file` 与 `POST /knowledge/index-markdown-directory`
- 当前前端只在 Knowledge 页面提供完整 Markdown 手动接入表单，Panel 仅展示摘要和跳转入口
- 当前不要求为 V1.7 新增语音模块、STT、TTS 或桌面语音助手链路

## 九、V1.5 当前前端结构补充

V1.5-M9 文档同步补充：当前前端桌面应用结构整理已完成核心目标，进入收尾。这里描述的是现有前端结构整理结果，不代表桌宠、悬浮窗、React / Vue 重构或 V1.6 面板能力已经完成。

当前 `frontend/public/js/` 已形成如下分层：

```text
frontend/public/js/
  api/
    chat.js
    client.js
    files.js
    knowledge.js
    metadata.js
  ui/
    error.js
    loading.js
    status.js
  core/
    markdown.js
    utils.js
  catalog/
    file-tools-catalog.js
  chat/
    chat.js
  files/
    files.js
  knowledge/
    knowledge.js
  panel/
    panel.js
```

当前职责边界：

- `api/`：前端 API 请求封装
- `ui/`：通用状态、按钮 loading、错误盒子等 UI 工具
- `core/`：通用纯函数，例如 `escapeHtml` 与 assistant Markdown 渲染
- `catalog/`：纯数据目录，例如 `fileToolsCatalog`
- `chat/`、`files/`、`knowledge/`：各自页面的业务模块
- `panel/`：Panel 入口层模块，负责摘要展示、快速 Chat 与跳转桥接
- `frontend/public/app.js`：入口编排，负责 DOM 引用、state 组装、模块初始化、事件绑定、Tab 切换、backend metadata 检查，以及少量页面级展示逻辑

当前边界保持不变：

- 不新增桌宠 / 悬浮窗
- 不引入 React / Vue
- 不新增依赖
- 不改后端知识库实现
- 不把 `/chat` 自动接入知识库
- 不扩展 Tauri 权限

## 十、V1.6 当前规划补充

V1.6 当前方向已统一为“桌面小面板 / 项目管家面板第一版”。这一阶段的重点是前端桌面入口重组，而不是后端插件化或技能网关扩张。

当前建议理解为：

- 复用现有单页桌面壳，在现有 `Backend Status`、`Chat`、`Files / Tools`、`Knowledge` 基础上增加更紧凑的 Panel 入口层
- Panel 只做入口、摘要和快捷动作，不替代完整页面
- 所有高成本或高风险动作仍保持手动触发
- 第一版优先不修改 Tauri 权限，不扩大后端能力边界

当前已完成到 M6 的入口层能力包括：

- Panel 壳层与独立顶层 tab
- Panel 后端状态摘要，复用现有 metadata 结果
- Panel 知识库状态摘要，复用现有 knowledge status 结果，并显示 Markdown 接入摘要
- Panel 快速 Chat 手动发送，复用现有 chat API
- Panel 跳转到完整后端状态、聊天、文件工具、知识库区域

当前明确不应写成 V1.6 已完成的内容：

- 完整桌宠形态
- 技能网关 / 插件系统已落地
- 新的后端能力阶段
- `/chat` 自动接入知识库
- 自动文件读取、自动入库、自动长期记忆

## 十一、V1.8 当前规划补充

V1.8 当前主题已统一为“Tauri 桌面体验增强 + Panel 轻量优化”。这一阶段的重点不是扩展后端能力，也不是把桌面端推进到桌宠、托盘或全局快捷键形态，而是在现有单窗口 Tauri 壳层和 Panel 入口层基础上继续做小步体验增强。

当前建议理解为：

- 继续复用现有单页桌面壳与现有页面结构
- 默认启动体验更偏向 Panel，且仍保留手动切换到完整页面
- 对 Tauri 默认窗口尺寸做保守微调，不改变权限边界
- Panel 继续做入口、摘要和跳转桥接，不替代完整 Chat / Files / Knowledge 页面
- Markdown 接入摘要继续复用现有 Knowledge 状态结果做桌面化表达
- Markdown 相关完整接入动作仍保留在 Knowledge 页面手动触发，Panel 只展示摘要与跳转入口
- 全阶段不新增后端能力，不扩大 Tauri 权限

当前已完成到 M6 的入口层增强包括：

- 默认启动进入 Panel tab
- 主窗口默认尺寸由 `1280x900` 微调为 `1120x820`
- Panel 四卡信息密度收紧，保持现有中文桌面 UI 风格
- Panel 更清楚展示 `markdown_files_count`、`files_count`、`chunks_count`、`index_method` 等 Markdown 接入摘要
- Panel 新增跳转到 Markdown 接入区域的入口，但不在 Panel 内放完整批量入库表单

当前明确不应写成 V1.8 已规划包含的内容：

- 系统托盘
- 全局快捷键
- 置顶 / 透明 / 无边框窗口
- Live2D / 3D
- 复杂动画
- 真正桌宠 / 悬浮窗
- 自动启动后端
- 自动读文件
- `/chat` 自动接入
- 手机端 / 局域网 / 室友测试主线

保留说明：

- 手机端 / 局域网 / 室友测试可以在后续另开版本，不作为当前 V1.8 主线

## 十二、V2.0 当前规划补充

V2.0 当前主题为"AI Hub 桌面工作台产品化界面第一版"。重点是在不扩展后端能力、不引入新框架、不改变功能行为的前提下，统一前端 UI 风格并优化信息架构。

当前已完成 M2-M6：

- 建立了设计 Token 体系（`--space-*`、`--radius-*`、`--shadow-*`、`--surface-*`）
- Panel 主入口产品化（移除开发文字，卡片文案更自然）
- Chat 体验优化（去除"Echo"等技术细节，简化知识库问答结果）
- Knowledge 页面信息架构整理（折叠式分组：Markdown 接入 / 搜索 / 问答）
- Files / Tools 卡片样式与其他页面对齐

当前仍保持：
- Vanilla JS + CSS 架构，未引入 React / Vue
- 所有 API 调用保持手动触发，未自动 chat / summarize / query / 入库
- 未修改后端、Tauri 配置或依赖

V2.0-M8 当前已补充为“视觉强化与首页重构”。该阶段仍属于前端表现层强化，不是功能扩张阶段。建议理解为：

- 继续以 Panel 为默认桌面工作台入口，强化首屏 hero、四卡排版、主操作按钮与状态摘要的第一眼层级
- 继续复用现有 `frontend/public/index.html`、`frontend/public/styles.css`、`frontend/public/app.js` 与 `frontend/public/js/panel/panel.js` 结构，不要求引入新框架
- 可以借鉴 `frontend-design` 的视觉方法做更明确的视觉方向收束，但应保持当前暖色、圆角、柔和卡片体系，优先走 Organic / Workspace / Dashboard 风格
- 所有展示内容继续以真实接口返回和真实状态为准，不允许为了“更像 AI 产品”而伪造摘要数据、运行指标或能力状态
- Chat / Files / Knowledge 的业务逻辑与后端接口边界保持不变，M8 主要处理首页和 Panel 入口层的视觉识别度问题

V2.0-M8 当前明确不应写成已包含的内容：

- 新后端能力或新 API
- Tauri 权限扩展
- React / Vue 重构
- 暗色模式
- 系统托盘、快捷键、悬浮窗
- 真正桌宠
- PDF / Word / Excel
- 自动 Agent
- 编造 AI 指标或伪造状态数据

## 十三、V2.1 / V2.2 / V2.3 / V2.4 当前架构补充

以下四节记录 V2.0 之后已完成的架构演进，均为已落地实现，不是规划。

### V2.1 Chat-first 抽屉式 UI

V2.1 将聊天界面从经典多 Tab 页面重构为 chat-first 布局：

- 左侧抽屉（340px）：后端状态面板、知识库面板（摘要/搜索/接入/问答）、文件预览面板、聊天工作区助手面板
- 右侧主区域：聊天对话区 + 输入框
- 新增 `frontend/public/styles/chat-first.css` 独立样式体系
- 新增 `frontend/public/js/layout/chat-first-shell.js` Shell 状态管理
- 新增 `frontend/public/js/components/orbit-icon.js` 品牌图标组件
- 经典首页 `index-classic.html` + `app.js` + `styles.css` 保留为兼容模式

### V2.2 Classic 功能完整迁移

V2.2 将经典首页的全部功能迁移到 chat-first 架构：

- `chat-first.js` 成为新主入口，导入全部 JS 模块
- 删除重复的 `chat-first.html` 和旧 `frontend/services/api.js`
- Chat / Files / Knowledge / Backend Status 全部功能在 chat-first 抽屉 UI 中可用

### V2.3 Tauri 桌面集成 MVP（Rust 代理层）

V2.3 在 Tauri 桌面端建立了 Rust 原生 HTTP 代理层，替代浏览器端的 `fetch` 直连：

```
┌────────────────────────────────────────────────────┐
│                   Tauri 桌面端                      │
│  ┌──────────────┐        ┌──────────────────────┐  │
│  │  前端 JS      │ invoke │  Rust 代理层          │  │
│  │  client.js    │───────→│  src-tauri/src/lib.rs │  │
│  │  isTauriRuntime()     │  reqwest HTTP client  │  │
│  └──────────────┘        └──────────┬───────────┘  │
│                                     │              │
│                            http://127.0.0.1:8000   │
│                                     │              │
│                            ┌────────▼───────────┐  │
│                            │  FastAPI 后端        │  │
│                            └────────────────────┘  │
└────────────────────────────────────────────────────┘
```

关键实现细节：

- `src-tauri/src/lib.rs`（528 行）使用 `reqwest` 封装全部后端端点
- 每个端点对应一个 `#[tauri::command]`，包括：`fetch_backend_metadata`、`send_chat_message`、`preview_file`、`summarize_file`、`fetch_knowledge_status`、`index_knowledge_file`、`index_knowledge_markdown_directory`、`search_knowledge`、`query_knowledge`
- `frontend/public/js/api/client.js` 通过 `getTauriInvoke()` 检测运行环境，Tauri 模式下走 `window.__TAURI__.core.invoke()`，浏览器模式下走 `fetch`
- `src-tauri/capabilities/default.json` 白名单控制每个 command 的调用权限
- `src-tauri/permissions/desktop_bridge.toml` 定义自定义权限
- 代理层不开放 `fs`、`shell`、系统托盘权限

### V2.4 桌面 App Shell + 自定义标题栏

V2.4 将 Chat-first 抽屉 UI 重构为真正的桌面应用 Shell：

```
┌─────────────────────────────────────────────────┐
│  自定义标题栏 (app-titlebar)                      │
│  [AI Hub]          [─] [□] [×]                  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  主内容区 (独立滚动)                   │
│          │                                      │
│  💬 聊天  │  #page-chat (默认)                   │
│  📁 文件  │  #page-files                        │
│  📚 知识库│  #page-knowledge                     │
│  ⚙ 状态  │  #page-status                        │
│          │                                      │
│  ● 空闲  │                                      │
└──────────┴──────────────────────────────────────┘
```

关键实现细节：

- `frontend/public/index.html`（278 行）完全重写，加载 `chat-first.css`
- 自定义标题栏：最小化 / 最大化 / 关闭按钮，`data-tauri-drag-region` 拖拽区域
- 左侧 Sidebar 固定宽度：品牌区（Orbit 图标 + AI Hub 名称）、四页导航按钮（`data-page` 驱动切换）、底部连接状态指示器（绿点/灰点 + 文字）
- 主内容区四个独立 `<section>`，通过 `.ac
