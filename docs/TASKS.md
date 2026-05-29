# AI Hub 任务清单

本文档约束当前开发顺序，记录任务状态与执行进度。

## 文档优先级

1. [VERSION_PLAN.md](VERSION_PLAN.md) — 版本边界与迭代顺序
2. [ARCHITECTURE.md](ARCHITECTURE.md) — 分层架构与接入规范
3. **TASKS.md** — 当前任务状态与执行记录
4. [README.md](../README.md) — 项目入口与快速启动

历史参考文档（V0.x，不再作为当前裁决依据）：
`AI_Hub_Version_Roadmap.md` · `AI_Hub_Implementation_Plan.md` · `AI_Hub_Project_Planning.md`

## 任务状态约定

- `TODO`：未开始　|　`DOING`：进行中　|　`DONE`：已完成　|　`BLOCKED`：受阻

---

## 功能开发前通用化检查要求

1. 不写死本机路径、API Key、单一模型、端口或外部服务配置
2. 外部 API / 付费调用默认关闭，必须显式启用
3. 没有配置或调用失败时，提供安全 fallback
4. 配置集中管理，错误提示面向普通用户

---

## 一、产品功能线

### V1.0 / V1.0.1：桌面端基础骨架与启动体验优化
**状态**：`DONE`

- Tauri 桌面端基础结构
- Backend Status / Chat / Files & Tools 基础页面
- 不自动启动后端、不自动调用 `/chat`、不新增 fs/shell 权限

---

### V1.1：高适配性底层框架
**状态**：`DONE`

- core 基础层（config / logging / errors）
- services / adapters / api 层目录结构
- API 路由拆分与配置管理系统
- 前后端通信规范

---

### V1.2：基础 AI 对话窗口
**状态**：`DONE`

已完成：
- 聊天 UI（消息列表、输入框、Enter 发送、loading/error 状态）
- DeepSeek adapter + `/chat` 最小接入，默认关闭，fallback Echo
- 短上下文管理（保留最近 4 轮内存对话）
- Markdown 渲染，安全渲染路径（不使用 innerHTML）

边界：不做历史会话、多会话、持久化保存、SSE 流式输出。

---

### V1.3：文件处理功能（只读预览 + 手动总结）
**状态**：`DONE`

已完成：
- `POST /files/preview`（白名单目录内 `.txt` / `.md` / `.log` / `.csv`）
- `POST /files/summarize`（手动触发，默认 `ENABLE_FILE_SUMMARY=false`）
- 完整错误码验证（`FILE_NOT_FOUND`、`PATH_NOT_ALLOWED` 等 6 种）

边界：不支持 PDF/Word/Excel，不做自动总结，不做文件修改/删除/移动。

---

### V1.4：本地文本知识库第一版
**状态**：`DONE`

已完成：
- `GET /knowledge/status`、`POST /knowledge/index-file`、`POST /knowledge/search`、`POST /knowledge/query`
- FTS 检索，`/knowledge/query` 基于 hits 调用 DeepSeek 生成回答
- 完整错误处理验证（`INVALID_CHUNK_PARAMS`、`KNOWLEDGE_MODEL_DISABLED` 等）

边界：不做 embedding/ChromaDB，`/chat` 未自动接入知识库，不支持 PDF/Word/Excel。

---

### V1.5：前端结构整理与桌面应用分层
**状态**：`DONE`

已完成：
- `frontend/public/js/` 分层：`api/`、`ui/`、`core/`、`catalog/`、`chat/`、`files/`、`knowledge/`
- `app.js` 职责收敛：DOM 引用、state 组装、模块初始化、Tab 切换
- 全量 `node --check` 通过，`npm run build` 通过

---

### V1.6：桌面小面板 / 项目管家面板第一版
**状态**：`DONE`

已完成：
- Panel 壳层 + 后端状态摘要 + 快速 Chat + Files/Knowledge 快捷入口
- 知识库状态摘要（files_count、chunks_count、index_method、fts_enabled）

边界：不是完整桌宠，不替代 Chat/Files/Knowledge 完整页面，不新增后端能力。

---

### V1.7：本地 Markdown 笔记接入 / Obsidian Bridge 第一版
**状态**：`DONE`

已完成：
- 单篇 Markdown 手动入库（`POST /knowledge/index-file`）
- 受控目录 Markdown 批量入库（`POST /knowledge/index-markdown-directory`）
- Panel/Knowledge 展示 Markdown 接入状态摘要

边界：只支持白名单目录内 `.md`，不做 Obsidian tags/双链，不自动扫描。

---

### V1.8：Tauri 桌面体验增强 + Panel 轻量优化
**状态**：`DONE`

已完成：
- 默认启动进入 Panel
- Tauri 窗口尺寸微调（`1120x820`）
- Panel 紧凑化，Markdown 接入摘要桌面化表达

边界：不新增后端能力，不扩大 Tauri 权限。

---

### V1.9：Chat 与 Knowledge 手动联动第一版
**状态**：`DONE`

已完成：
- [x] Chat 页面新增模式切换（普通聊天 / 知识库问答）
- [x] 知识库问答模式调用 `/api/knowledge/query`
- [x] Panel 新增"基于知识库提问"跳转入口
- [x] M4：轻量回归验证通过（git clean、py_compile、node --check、npm run build、后端端点正常）

边界：`/chat` 仍未自动接入知识库，不做自动记忆/自动入库。

---

### V2.0：AI Hub 桌面工作台产品化界面第一版
**状态**：`DONE`

- 设计 Token 体系（CSS 变量、圆角/间距/阴影/表面色统一）
- Panel/Chat/Knowledge/Files 页面产品化文案与视觉统一
- M8 视觉强化与首页重构完成

---

### V2.1：Chat-first 抽屉式 UI 原型
**状态**：`DONE`

- chat-first.html + chat-first.css + chat-first-shell.js
- 抽屉内集成后端状态、知识库、文件预览面板

---

### V2.2：Classic 功能迁移至 Chat-first
**状态**：`DONE`

- Chat/Files/Knowledge/Backend Status 全部迁移至 chat-first 架构
- 经典首页归档为 `index-classic.html`

---

### V2.3：Tauri 桌面集成 MVP（Rust 代理层）
**状态**：`DONE`

- `src-tauri/src/lib.rs` Rust 代理全部后端端点
- 前端 `client.js` Tauri/浏览器双模式路由
- 不开放 fs/shell/系统托盘权限

---

### V2.4：桌面 App Shell + 自定义标题栏
**状态**：`DONE`

- 自定义标题栏（最小化/最大化/关闭 + 拖拽区域）
- 左侧 Sidebar：品牌区 + 四页导航 + 连接状态指示器
- 主内容区四页独立布局（chat/files/knowledge/status）
- chat-first.css 适配 Shell 布局（填满窗口、独立滚动）

---

## 二、开发工程线

开发工程线不面向用户，用于提高开发效率。

### E1：Git 分支与提交规范
**状态**：`TODO`
- [ ] 制定分支命名规则
- [ ] 制定 commit message 格式
- [ ] 建立 PR 审查流程

### E2：文档管理规范
**状态**：`DONE`
- [x] 文档优先级体系
- [x] VERSION_PLAN.md / ARCHITECTURE.md / TASKS.md 建立
- [x] README.md 维护

### E3：前端组件化
**状态**：`TODO`
- [ ] 抽取通用 UI 组件
- [ ] 建立组件目录结构
- [ ] 制定组件复用规范

### E4：轻量验证流程
**状态**：`TODO`
- [ ] 建立标准化验证脚本（py_compile / node --check / npm run build）
- [ ] 验证结果自动记录
