# AI Hub

AI Hub 是一个长期演进的个人 AI 桌面工作站 / 本地 AI Hub / 可扩展 AI Agent 平台。

## 当前状态

V1.0 / V1.0.1 已基本完成：

- Tauri 桌面端基础结构
- Backend Status / Chat / Files & Tools 基础页面
- 桌面端启动体验优化
- Git 管理和基础文档

## 技术栈

- Python 3.11 + FastAPI
- SQLite
- Node.js + Tauri (桌面壳)
- Dify API

## 版本路线

| 版本 | 主题 | 状态 |
|------|------|------|
| V1.0 / V1.0.1 | 桌面端基础骨架与启动体验优化 | 基本完成 |
| V1.1 | 高适配性底层框架 | 待开始 |
| V1.2 | 基础 AI 对话功能 | M8 收尾验证与文档同步中 |
| V1.3 | 文件处理功能 | M1-M7 已完成，进入收尾判断 |
| V1.4 | 知识库与记忆系统 | M8-M10 已完成，M11 待确认 |
| V1.5 | 屏幕感知工具组与学习辅助模式 | 待开始 |
| V1.6 | 技能网关 / 插件系统 | 待开始 |
| V1.7 | 语音交互 | 待开始 |
| V1.8 | 手机端 / 局域网 / 室友测试 | 待开始 |
| V1.9 | Docker 安全沙盒与自动化执行 | 待开始 |
| V2.0 | 个人 AI Agent 工作站完全体 | 远期 |

详见 [docs/VERSION_PLAN.md](docs/VERSION_PLAN.md)。

## 环境准备

```powershell
conda create -n ai_hub python=3.11 pip -y
conda activate ai_hub
pip install -r requirements.txt
```

## .env 配置

在项目根目录创建 `.env` 文件，写入：

```env
DIFY_API_URL=https://api.dify.ai/v1/chat-messages
DIFY_API_KEY=your_dify_api_key_here
```

不要提交真实 Key 到仓库、日志或审查报告。

## 启动服务

```powershell
# 启动后端
python -m uvicorn backend.main:app --reload --reload-dir backend

# 浏览器模式
npm run dev

# Tauri 桌面开发模式（需安装 Rust）
npm run desktop:dev
```

桌面端不会自动启动后端，用户需手动先启动 FastAPI 后端。

## 测试

```powershell
python scripts/test_api.py
```

## 开发原则

- V1.1 只做高适配性底层框架，不强行塞具体业务功能
- V1.2 及后续版本每次只主攻一个功能模块
- 后续功能必须按 modules / services / adapters / api / frontend 的分层规则接入
- 不允许把大量逻辑堆进单个 app.js 或单个页面文件
- 不允许未讨论清楚就直接实现功能
- 不允许为了速度破坏整体架构
- 功能不删减，但按版本逐步落地
- 开发工程线和产品功能线分开记录
- 所有开发、文档更新和功能验证必须遵守反幻觉原则：以真实文件、Git 状态、命令输出或用户确认信息为准，不能把推测、计划中能力或未验证结果写成事实。

## 每个功能开发前的要求

每个功能正式开发前，必须完成以下检查：

1. **功能设想确认**：解决什么问题？什么场景使用？完整流程是什么？符合 AI Hub 长期定位吗？
2. **功能边界确认**：当前版本做什么、不做什么？哪些放后续版本？是否存在过度设计？
3. **架构接入确认**：属于哪个 module？需要哪些 service/adapter？是否需要新增 API？前端入口、配置项、日志和错误处理怎么做？
4. **最小可用版本确认**：第一版只做最小闭环，先跑通主流程再逐步增强
5. **实现前任务清单**：列出新增/修改的文件，说明每一步目的、可能影响的现有功能、验证方式和回滚方式
6. **实现后轻量验证**：检查 git status、核心功能能否打开、主流程能否跑通、是否有明显报错、文档是否同步更新

## 安全说明

- `.env` 不要提交
- `data/` 不要提交
- API Key 不要输出到日志或审查报告

## 文档索引

- [版本计划](docs/VERSION_PLAN.md) — 完整版本路线与开发工程线
- [架构设计](docs/ARCHITECTURE.md) — 分层架构与模块设计
- [任务清单](docs/TASKS.md) — 当前任务状态与执行记录
- [历史决策](docs/DECISIONS.md) — 技术决策记录

## 通用化原则补充

AI Hub 当前优先服务个人使用，但所有新增功能都应避免写死本机路径、API Key、单一模型、端口、数据目录和外部服务配置；外部 API 或付费调用默认关闭，并提供安全 fallback。

## V1.2 当前状态

V1.2-M1 到 M7 已完成，当前进入 M8 轻量验证与文档同步。当前能力包括：基础聊天窗口 UI、Enter 发送 / Shift + Enter 换行、loading / error / 空输入禁用、DeepSeek adapter、`DeepSeekChatSkill`、`/chat` 最小接入 DeepSeek、默认关闭 DeepSeek 并 fallback Echo、短上下文管理、内存 `chatHistory`、基础 Markdown 渲染，以及不使用 `innerHTML` 直接渲染模型输出的安全渲染路径。

V1.2 仍不包含历史会话列表、多会话切换、持久化保存、文件上传、知识库、截图搜索、语音、桌宠形态、本地模型管理或 SSE 流式输出。DeepSeek 短上下文复测属于可选验证，建议避免重复消耗额度。

V1.3 当前已完成到 M7：后端已提供 `POST /files/preview` 与 `POST /files/summarize`，Files / Tools 页面已提供“生成总结”按钮，且总结只能由用户手动触发，读取预览不会自动调用 AI。M7 已实际验证 `.txt` / `.md` / `.log` / `.csv` 正常预览，以及 `FILE_NOT_FOUND`、`PATH_NOT_ALLOWED`、`PATH_IS_NOT_FILE`、`UNSUPPORTED_FILE_TYPE`、`FILE_TOO_LARGE`、`BINARY_FILE_REJECTED` 等错误场景；`/files/summarize` 默认关闭返回 `SUMMARY_MODEL_DISABLED`，文件不存在、不支持后缀、路径越界也已验证能返回对应错误。

V1.3 仍只支持白名单目录内只读文本文件预览 + 手动总结，不支持文件上传、PDF / Word / Excel、ChromaDB、RAG、长期记忆、多文件知识库、自动扫描全盘或文件修改 / 删除 / 移动。这还不是 V1.4 知识库能力。环境上，当前后端应使用 `ai_hub` / Python 3.11+；这台机器默认 Python 3.9 会因新语法无法启动后端。

V1.4 当前已完成到 M10：后端已提供独立知识库接口 `POST /knowledge/index-file`、`GET /knowledge/status`、`POST /knowledge/search`、`POST /knowledge/query`。其中 `/knowledge/search` 只做纯检索，`/knowledge/query` 是独立的检索增强回答接口，先检索知识片段，再基于 hits 调用 DeepSeek 生成中文回答；它当前没有自动接入 `/chat`。

V1.4 已完成真实 DeepSeek 知识库问答验证，返回结果已验证 `HTTP_STATUS 200`、`model: deepseek-v4-flash`、`grounded: true`、`hits` 非空、`citations` 非空，且 `answer.text` 中文正常。manual-test 测试知识库记录和测试文件已清理。

V1.4 当前仍是本地文本知识库第一版，不支持 embedding、ChromaDB、自动长期记忆、自动监听聊天入库、自动接入 `/chat`、前端知识库页面，也不支持 PDF / Word / Excel 知识入库。下一步是 V1.4-M11：前端 Knowledge 最小入口，或 V1.4-M11：错误处理与安全边界验证，二选一待确认。
