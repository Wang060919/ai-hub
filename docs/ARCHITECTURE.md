# AI Hub 架构设计

本文档定义 AI Hub 的分层架构、模块职责与接入规范。V1.1 阶段将按此架构重塑项目结构。

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
│  业务逻辑：对话管理 / 文件解析 / 向量检索 │
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
- `chromadb/` — ChromaDB 向量数据库适配
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
- `knowledge/` — 文档切片、向量检索、RAG 问答
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
- `skills/` — 技能网关模块

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
- `backend/modules/knowledge/` — 知识库（V1.4 实现）
- `backend/modules/screen/` — 屏幕工具（V1.5 实现）
- `backend/modules/voice/` — 语音（V1.7 实现）
- `backend/modules/sandbox/` — 沙盒（V1.9 实现）
- `backend/modules/skills/` — 技能网关（V1.6 实现）
- `backend/adapters/chromadb/` — 向量数据库（V1.4 实现）
- `backend/adapters/docker/` — Docker（V1.9 实现）
- `backend/adapters/stt/` + `backend/adapters/tts/` — 语音（V1.7 实现）

# V1.1-M6 最新架构状态

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
