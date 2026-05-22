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

### Modules 层（`backend/modules/`）

功能模块，面向前端页面的业务聚合：

- `chat/` — 聊天功能模块
- `files/` — 文件处理功能模块
- `knowledge/` — 知识库功能模块
- `screen/` — 屏幕工具功能模块
- `voice/` — 语音功能模块
- `sandbox/` — 沙盒功能模块
- `skills/` — 技能/路由预留模块（当前仅保留结构位置，不是 V1.6 主线）

Module 规则：

- module 是功能入口，负责组合 service 完成用户请求
- module 不直接调用 adapter
- module 对应前端的一个功能区域

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

1. 确定功能属于哪个 module
2. 在 `backend/modules/<module>/` 下创建模块入口
3. 在 `backend/services/<service>/` 下实现业务逻辑
4. 如需外部依赖，在 `backend/adapters/<adapter>/` 下实现适配
5. 在 `backend/api/routes/` 下添加路由
6. 在 `backend/api/schemas/` 下添加请求/响应模型
7. 在 `frontend/pages/` 下添加页面
8. 在 `frontend/services/` 下封装 API 调用
9. 更新架构文档

## 八、模块预留位置

以下模块在 V1.1 阶段只预留目录和接口定义，不实现具体功能：

- `backend/modules/files/` — 文件处理（V1.3 实现）
- `backend/modules/knowledge/` — 知识库（V1.4 当前为本地文本知识库第一版）
- `backend/modules/screen/` — 屏幕工具（V1.5 实现）
- `backend/modules/voice/` — 语音（后续版本预留，当前未纳入 V1.7 主线）
- `backend/modules/sandbox/` — 沙盒（V1.9 实现）
- `backend/modules/skills/` — 技能/路由预留目录（当前已预留，后续版本再定义主线）
- `backend/adapters/chromadb/` — 向量数据库预留（V1.5+ 预留，当前未实现）
- `backend/adapters/docker/` — Docker（V1.9 实现）
- `backend/adapters/stt/` + `backend/adapters/tts/` — 语音（后续版本预留，当前未纳入 V1.7 主线）

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

# V1.1-M6 最新架构状态

V1.4-M13 文档修正补充：当前知识库服务的实际实现应理解为“本地文本切片 + SQLite FTS5 全文检索 + LIKE fallback + 独立 query 增强回答”，不是 embedding、向量检索或 ChromaDB 已落地。文中若出现“向量检索”或“ChromaDB 在 V1.4 实现”的旧表述，应视为历史预留描述；ChromaDB 目前仅属于 V1.5+ 预留方向，不属于 V1.4 已实现能力。

截至 V1.1-M6，架构落地状态如下：

- V1.1-M2 后端分层目录骨架已完成。
- V1.1-M3 core 基础模块已完成。
- V1.1-M4 API 路由拆分已完成。
- V1.1-M5 前端预留结构已完成。

当前实际目录结构：

```text
backend/
  main.py
  api/
    routes/
      chat.py
      health.py
      meta.py
    schemas/
  core/
    config.py
    errors.py
    logging.py
  adapters/
  services/
  modules/
    chat/
    files/
    knowledge/
    sandbox/
    screen/
    skills/
    voice/
frontend/
  components/
  pages/
  preview/
  services/
    api.js
```

当前边界说明：

- `backend/main.py` 现在只负责 FastAPI app 创建、startup 初始化和 `include_router`。
- `backend/api/routes/chat.py` 复用现有 `backend.router.create_chat_router()`，未改写聊天业务逻辑。
- `backend/core/` 只提供基础配置、日志和错误类型，暂未接入现有启动流程。
- `frontend/services/api.js` 只提供基础 API 调用封装，暂未接入现有页面。
- V1.1 下一步是 M7 轻量验证，不进入 V1.2 AI 对话功能。

---

## 通用化原则

AI Hub 当前阶段优先做个人可用版，但代码不能写死为只能在当前电脑、当前路径、当前 API Key、当前模型或当前账号下运行。

后续新增功能时，必须尽量遵守：

1. 不写死本机路径，例如 `D:\AI-Workspace\ai-hub`。
2. 不把 API Key 写进代码、前端、日志或 Git。
3. 不把 DeepSeek 或任何单一模型写成唯一不可替换模型。
4. 端口、模型名、API URL、超时时间、数据目录、功能开关应尽量配置化。
5. 涉及外部 API 或付费调用的功能默认关闭，必须显式启用。
6. 没有配置或调用失败时，应提供安全 fallback。
7. 配置应集中管理，避免散落在多个文件里。
8. 错误提示应尽量面向普通用户可理解，而不是只适合开发者本人。
9. 当前可以优先服务个人使用，但架构要为后续通用化、迁移、打包和多人测试预留空间。

## 反幻觉原则

AI Hub 的开发和运行都必须避免把推测当事实，避免把计划中的功能写成已经完成，避免编造不存在的文件、接口、配置、测试结果或功能状态。

### 开发阶段要求

1. 所有项目状态必须以真实文件、Git 状态、命令输出或用户确认的信息为准。
2. 未读取文件，不得声称了解文件内容。
3. 未运行验证命令，不得声称测试通过。
4. 不允许编造不存在的接口、模块、配置项、依赖、脚本或功能。
5. 规划中的功能必须标注为“计划中”或“暂未实现”，不能写成“已支持”。
6. 如果某个结论只是推测，必须明确标注“推测”。
7. 如果某个点需要用户确认，必须明确标注“需要确认”，不能擅自决定。
8. Codex / Claude 输出实施结果时，必须说明：
   - 修改了哪些文件
   - 没有修改哪些禁止范围
   - 实际运行过哪些命令
   - 哪些验证只是建议运行，哪些验证已经实际完成
9. 没有命令输出或截图证明时，不得写“已验证通过”。
10. 不允许为了让项目看起来更完整而夸大当前能力。

### 文档阶段要求

1. README、TASKS、VERSION_PLAN、ARCHITECTURE 中必须区分：
   - 已完成
   - 进行中
   - 计划中
   - 暂未实现
2. 文档中的功能状态必须和代码实际能力一致。
3. 不得把 V1.3 及后续功能提前写成当前已支持。
4. 如果某个能力只是预留目录或架构位置，只能写“已预留”，不能写“已实现”。
5. 如果某个功能仅通过接口测试，不能写成“完整产品功能已完成”。

### 产品运行阶段要求

1. AI 回答应尽量区分事实、推测和不确定内容。
2. 文件 / 知识库问答应优先基于用户提供资料，资料中没有依据时应明确说明。
3. 涉及代码、文件、系统操作、自动化任务时，应说明影响范围，并在必要时等待用户确认。
4. 涉及学习、做题、屏幕识别等功能时，应避免编造题干、选项、来源或用户未提供的信息。
5. 涉及外部 API、模型、依赖或版本信息时，应尽量基于实际配置或明确说明“不确定”。

### 后续功能开发固定要求

每个功能开发前，必须先完成：

1. 功能设想确认
2. 功能边界确认
3. 架构接入确认
4. 最小可用版本确认
5. 实现前任务清单
6. 实现后轻量验证

并且每一步都必须避免把推测写成事实。
