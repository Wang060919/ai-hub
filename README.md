# AI Hub

AI Hub 是一个长期演进的个人 AI 桌面工作站 / 本地 AI Hub / 可扩展 AI Agent 平台。

## 当前状态

V2.4 已完成：

- V2.0 产品化界面（设计 Token、Panel/Chat/Knowledge/Files 统一 UI）
- V2.1 Chat-first 抽屉式 UI
- V2.2 Classic 功能完整迁移至 Chat-first 架构
- V2.3 Tauri 桌面集成 MVP（Rust Reqwest 代理层）
- V2.4 桌面 App Shell 重构（自定义标题栏、Sidebar 四页导航、填满窗口布局）

## 技术栈

- Python 3.9+ + FastAPI
- SQLite
- Node.js + Tauri（桌面壳）
- Dify API

## 版本路线

| 版本 | 主题 | 状态 |
|------|------|------|
| V1.0 / V1.0.1 | 桌面端基础骨架与启动体验优化 | 已完成 |
| V1.1 | 高适配性底层框架 | 已完成 |
| V1.2 | 基础 AI 对话功能 | 收尾中 |
| V1.3 | 文件处理功能（只读预览 + 手动总结） | 收尾中 |
| V1.4 | 本地文本知识库第一版 | 收尾中 |
| V1.5 | 前端结构整理与桌面应用分层 | 收尾中 |
| V1.6 | 桌面小面板 / 项目管家面板第一版 | 收尾中 |
| V1.7 | 本地 Markdown 笔记接入 / Obsidian Bridge 第一版 | 收尾中 |
| V1.8 | Tauri 桌面体验增强 + Panel 轻量优化 | 收尾中 |
| V1.9 | Chat 与 Knowledge 手动联动第一版 | 收尾中 |
| V2.0 | AI Hub 桌面工作台产品化界面第一版 | 已完成 |
| V2.1 | Chat-first 抽屉式 UI 原型 | 已完成 |
| V2.2 | Classic 功能迁移至 Chat-first | 已完成 |
| V2.3 | Tauri 桌面集成 MVP（Rust 代理层） | 已完成 |
| V2.4 | 桌面 App Shell + 自定义标题栏 | 已完成 |

各版本详细状态见 [docs/VERSION_PLAN.md](docs/VERSION_PLAN.md) 和 [docs/TASKS.md](docs/TASKS.md)。

## 文档优先级

1. [版本计划](docs/VERSION_PLAN.md)
2. [架构设计](docs/ARCHITECTURE.md)
3. [任务清单](docs/TASKS.md)
4. [README](README.md)

历史参考文档（V0.x 阶段，不再作为当前开发裁决依据）：

- `docs/AI_Hub_Version_Roadmap.md`
- `docs/AI_Hub_Implementation_Plan.md`
- `docs/AI_Hub_Project_Planning.md`

## 环境准备

```powershell
conda create -n ai_hub python=3.9 pip -y
conda activate ai_hub
pip install -r requirements.txt
```

## .env 配置

在项目根目录创建 `.env` 文件：

```env
DIFY_API_URL=https://api.dify.ai/v1/chat-messages
DIFY_API_KEY=your_dify_api_key_here
```

不要提交真实 Key 到仓库、日志或审查报告。

## 启动服务

```powershell
# 启动后端
python -m uvicorn backend.main:app --reload --reload-dir backend

# 浏览器模式（静态文件服务）
npm run dev

# Tauri 桌面开发模式（需安装 Rust）
npm run desktop:dev
```

桌面端不会自动启动后端，用户需先手动启动 FastAPI 后端。

## 测试

```powershell
python scripts/test_api.py
```

## 开发原则

- 每次只主攻一个功能模块，按版本逐步落地
- 后续功能必须按 services / adapters / api / frontend 的分层规则接入
- 不允许把大量逻辑堆进单个 app.js 或单个页面文件
- 不允许未讨论清楚就直接实现功能
- 不允许为了速度破坏整体架构
- 功能不删减，但按版本逐步落地
- 开发工程线和产品功能线分开记录
- 所有开发、文档更新和功能验证必须遵守反幻觉原则：以真实文件、Git 状态、命令输出或用户确认信息为准

## 每个功能开发前的要求

1. **功能设想确认**：解决什么问题？什么场景使用？符合 AI Hub 长期定位吗？
2. **功能边界确认**：当前版本做什么、不做什么？是否存在过度设计？
3. **架构接入确认**：属于哪个 service？需要哪些 adapter？是否需要新增 API？
4. **最小可用版本确认**：第一版只做最小闭环
5. **实现前任务清单**：列出新增/修改的文件，说明验证方式和回滚方式
6. **实现后轻量验证**：检查 git status、核心功能能否跑通、文档是否同步更新

## 通用化原则

AI Hub 当前优先服务个人使用，但所有新增功能都应避免写死本机路径、API Key、单一模型、端口或外部服务配置；外部 API 或付费调用默认关闭，并提供安全 fallback。

## 安全说明

- `.env` 不要提交
- `data/` 不要提交
- API Key 不要输出到日志或审查报告

## 文档索引

- [版本计划](docs/VERSION_PLAN.md) — 完整版本路线与开发工程线
- [架构设计](docs/ARCHITECTURE.md) — 分层架构与模块设计
- [任务清单](docs/TASKS.md) — 当前任务状态与执行记录
- [历史决策](docs/DECISIONS.md) — 技术决策记录
- [历史路线图](docs/AI_Hub_Version_Roadmap.md) — V0.x 阶段路线与边界参考
- [历史实施计划](docs/AI_Hub_Implementation_Plan.md) — V0.x 阶段实施节奏参考
- [历史项目规划](docs/AI_Hub_Project_Planning.md) — 早期愿景与架构背景参考
