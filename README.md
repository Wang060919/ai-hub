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
| V1.2 | 基础 AI 对话功能 | 待开始 |
| V1.3 | 文件处理功能 | 待开始 |
| V1.4 | 知识库与记忆系统 | 待开始 |
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

# V1.1-M6 当前状态

V1.1 高适配性底层框架正在推进，当前已完成：

- V1.1-M2 后端分层目录骨架已完成。
- V1.1-M3 core 基础模块已完成。
- V1.1-M4 API 路由拆分已完成。
- V1.1-M5 前端预留结构已完成。

V1.1 下一步是 M7 轻量验证。本阶段只同步底层框架和文档状态，不新增业务功能，不进入 V1.2 AI 对话功能。

---
