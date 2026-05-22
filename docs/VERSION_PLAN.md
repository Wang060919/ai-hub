# AI Hub 版本计划

本文档是 AI Hub 项目的版本路线图与开发工程线总纲。所有功能开发必须服从本文档的版本边界与前置检查要求。

## 文档优先级

当前 V1.x 主线文档统一按以下顺序使用：

1. `docs/VERSION_PLAN.md`（本文档）— 版本边界与迭代顺序
2. `docs/ARCHITECTURE.md` — 分层架构与接入规范
3. `docs/TASKS.md` — 当前任务状态与执行记录
4. `README.md` — 项目入口与快速启动

历史参考文档如下：

- `docs/AI_Hub_Version_Roadmap.md`
- `docs/AI_Hub_Implementation_Plan.md`
- `docs/AI_Hub_Project_Planning.md`

这些历史文档主要保留 V0.x 阶段规划、早期边界与长期愿景，不再作为当前 V1.x 开发的直接裁决依据；若与当前主线文档冲突，以当前主线文档为准。

---

## V1.2 当前状态

V1.2-M1 到 M7 已完成，当前进入 V1.2-M8：轻量验证与文档同步。本阶段只做收尾验证建议与文档状态同步，不新增功能，不修改业务逻辑。

已完成能力：

- 基础聊天窗口 UI。
- 消息列表区分用户消息和 AI 消息。
- 输入框支持 Enter 发送、Shift + Enter 换行。
- 空输入禁用发送，发送中展示 loading / 禁用状态。
- 错误提示覆盖模型失败、网络失败、后端失败等基础场景。
- DeepSeek adapter：`backend/adapters/deepseek.py`。
- DeepSeekChatSkill：`backend/skills/deepseek_chat.py`。
- `/chat` 已最小接入 DeepSeek，且保留 Echo fallback。
- 默认 `ENABLE_DEEPSEEK_CHAT=false`，不会自动消耗 DeepSeek API 额度。
- 未启用、无 API Key、调用失败或超时时 fallback Echo。
- 真实 DeepSeek 单轮链路此前已完成验证，成功返回 `skill: deepseek_chat`。
- 短上下文管理已接入，保留最近 4 轮内存对话。
- 前端已新增内存 `chatHistory`，页面刷新后丢失。
- 基础 Markdown 渲染已接入。
- 模型输出采用安全渲染路径，不使用 `innerHTML` 直接渲染模型输出。
- API Key 只通过环境变量读取，不写入前端、日志或 Git。

V1.2-M8 建议验证：

- 建议运行 `git status`。
- 建议运行 `npm run build`。
- 建议运行相关后端文件的 `python -m py_compile`。
- 建议手动验证后端 `/health`、`/version`、`/skills`、`/chat`。
- 建议手动验证网页端 Chat。
- DeepSeek 短上下文验证可选，避免重复消耗额度。

V1.2 当前边界：

- 不做历史会话列表。
- 不做多会话切换。
- 不做持久化保存。
- 不做文件上传、文件问答或知识库。
- 不做截图搜索、语音、桌宠形态或本地模型管理。
- 不做 SSE 流式输出。

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

## 一、产品功能线

### V1.0 / V1.0.1：桌面端基础骨架与启动体验优化

**状态**：基本完成

**已完成内容**：

- Tauri 桌面端基础结构
- Backend Status / Chat / Files & Tools 基础页面
- 桌面端启动体验优化
- Git 管理和基础文档

**当前不做**：

- 不自动启动 FastAPI 后端
- 不自动调用 `/chat`
- 不新增文件系统权限
- 不接系统托盘

---

### V1.1：高适配性底层框架

**目标**：把当前还不完善的桌面端骨架，升级成后续功能可以稳定接入的底层框架。

**核心原则**：只做框架，不主攻具体功能。

**内容**：

- 前后端结构整理
- 引入或预留 FastAPI 本地后端
- 建立 API 层
- 建立 core 基础层
- 建立 services 层
- 建立 adapters 层
- 建立 modules 层
- 建立配置管理
- 建立日志和错误处理
- 建立前后端通信规范
- 预留模型路由位置
- 预留文件处理、知识库、屏幕工具、语音、沙盒等模块接入位置
- 更新架构文档

**不包含**：

- 不实现具体 AI 对话功能
- 不实现文件处理功能
- 不接入 ChromaDB
- 不实现屏幕工具
- 不实现语音
- 不实现插件系统
- 不实现 Docker 沙盒

---

### V1.2：基础 AI 对话功能

**状态**：M1-M7 已完成，M8 收尾验证与文档同步中。

**目标**：实现基础聊天能力，跑通 AI 对话主流程。

**已完成内容**：

- 基础聊天窗口 UI
- 消息列表
- 输入框与发送按钮
- Enter 发送 / Shift + Enter 换行
- loading / error / 空输入禁用
- DeepSeek adapter
- DeepSeekChatSkill
- `/chat` 最小接入 DeepSeek
- 默认关闭 DeepSeek，fallback Echo
- 真实 DeepSeek 单轮验证
- 短上下文管理
- 内存 `chatHistory`
- 基础 Markdown 渲染
- 安全渲染，不用 `innerHTML` 渲染模型输出

**M8 当前内容**：

- 轻量验证建议
- README / TASKS / VERSION_PLAN 文档同步

**不包含**：

- 不做文件上传
- 不做知识库问答
- 不做语音
- 不做多模态
- 不做历史会话列表
- 不做多会话切换
- 不做持久化保存
- 不做 SSE 流式输出

---

### V1.3：文件处理功能

**状态**：M1-M7 已完成，当前进入 V1.3 收尾判断。

**目标**：在不扩展到知识库能力的前提下，先完成白名单目录内文本文件的手动总结闭环。

**已完成内容**：

- `POST /files/preview`
- `POST /files/summarize`
- Files / Tools 页面“生成总结”按钮
- `/api/files/summarize` 前端代理链路
- 白名单目录内只读文本文件预览
- 手动触发的文件总结闭环
- `ENABLE_FILE_SUMMARY` 独立开关，默认 `false`
- DeepSeek 未启用或无 Key 时返回 `SUMMARY_MODEL_DISABLED`
- 真实 DeepSeek 文件总结链路验证
- M7 错误处理与安全边界验证

**已验证返回**：

- `model: deepseek-v4-flash`
- `input_chars: 33`
- `source_chars: 33`
- `truncated: false`

**当前边界**：

- 当前只支持白名单目录内 `.txt` / `.md` / `.log` / `.csv` 文本类文件。
- 当前不支持 PDF / Word / Excel。
- 总结必须由用户手动点击触发。
- 读取预览不会自动调用 AI。
- 当前不做 ChromaDB / RAG / 长期记忆 / 多文件知识库。
- 当前不做文件上传、自动扫描全盘、文件修改 / 删除 / 移动。
- 当前 V1.3 是只读文本文件预览 + 手动总结，不是知识库。

**M7 已验证内容**：

- `/files/preview` 已验证 `.txt` / `.md` / `.log` / `.csv` 正常。
- `/files/preview` 已验证：`FILE_NOT_FOUND`、`PATH_NOT_ALLOWED`、`PATH_IS_NOT_FILE`、`UNSUPPORTED_FILE_TYPE`、`FILE_TOO_LARGE`、`BINARY_FILE_REJECTED`。
- `/files/summarize` 已验证默认关闭返回 `SUMMARY_MODEL_DISABLED`。
- `/files/summarize` 已验证文件不存在、不支持后缀、路径越界能返回对应错误。
- 回归验证已完成：`/chat hello` 返回 Echo，`/health`、`/version`、`/skills` 正常。
- `npm run build` 已通过。
- 相关后端文件 `py_compile` 已通过。

**环境注意事项**：

- 当前项目后端应使用 `ai_hub` 环境 / Python 3.11+。
- 默认 Python 3.9 会因新语法无法启动后端。

**后续待做**：

- V1.3 收尾判断，准备合并或打 tag
- 文件上传
- 根据文件问答
- 文件处理结果导出
- 为 V1.4 知识库阶段预留后续接入点，但当前不落地知识库实现

**不包含**：

- 不做 OCR
- 不做图片识别
- 不做知识库向量化
- 不做批量文件管理

---

### V1.4：知识库与记忆系统

**状态**：M8-M12 已完成，当前进入 V1.4 收尾验证 / tag 或 V1.5 规划。

**目标**：已完成本地文本知识库第一版最小闭环与前端 Knowledge 最小入口，当前进入收尾验证与版本整理。

**已完成内容**：

- `GET /knowledge/status`
- `POST /knowledge/index-file`
- `POST /knowledge/search`
- `POST /knowledge/query`
- 本地文本知识库切片入库
- 基于 SQLite FTS5 / LIKE fallback 的全文检索
- 基于检索 hits 的 DeepSeek 增强回答
- hits 为空时直接返回 `grounded=false`，不调用 DeepSeek
- 第一版 `citations` 由 hits 直接映射生成
- 传给模型的知识片段已做最大上下文长度控制
- `/knowledge/query` 为独立接口，未接入 `/chat`
- 真实 DeepSeek 知识库问答验证已通过
- manual-test 测试知识库记录和测试文件已清理
- M11 错误处理与安全边界验证已完成

**M10 已验证结果**：

- `HTTP_STATUS: 200`
- `model: deepseek-v4-flash`
- `grounded: true`
- `hits` 非空
- `citations` 非空
- `answer.text` 中文正常

**M11 已验证内容**：

- `/knowledge/index-file` 已验证白名单内 `.txt` / `.md` 正常入库。
- `/knowledge/index-file` 已验证重复入库返回 `reused_existing=true`。
- `/knowledge/index-file` 已验证修改文件后 `force_reindex=true` 返回 `replaced_existing=true`。
- `/knowledge/index-file` 已验证错误码：`FILE_NOT_FOUND`、`PATH_NOT_ALLOWED`、`UNSUPPORTED_FILE_TYPE`、`INVALID_CHUNK_PARAMS`。
- `/knowledge/status` 已验证 `files_count` / `chunks_count`、`fts_available=true`、`fts_enabled=true`、`index_method=sqlite_fts`。
- `/knowledge/search` 已验证命中时 `hits` 非空、无关查询 `hits=[]`、空 `query` 返回 `INVALID_QUERY`、`top_k` 生效。
- `/knowledge/query` 已验证无命中时不调用 DeepSeek，返回 `grounded=false`。
- `/knowledge/query` 已验证有命中但模型未启用或无 Key 时返回 `KNOWLEDGE_MODEL_DISABLED`。
- `/knowledge/query` 已验证不 fallback Echo，不走 `/chat`。
- 回归验证已完成：`/chat hello` 返回 Echo、`/files/preview` 正常、`/files/summarize` 默认关闭返回 `SUMMARY_MODEL_DISABLED`、`/health` / `/version` / `/skills` 正常。
- `npm run build` 已通过。
- `conda run -n ai_hub python -m py_compile ...` 已通过。
- 临时测试文件已删除，`kb_id=m11-validation` 的 `knowledge_files` / `knowledge_chunks` / `knowledge_chunks_fts` 已清理，清理后计数为 `0 / 0 / 0`。

**M11 说明**：

- 本轮没有修改功能代码。
- 本轮 Python 验证统一使用 `conda run -n ai_hub python ...`。
- 当前 Codex 执行环境读不到 `DEEPSEEK_API_KEY`，因此本轮没有把真实 DeepSeek 命中回答写成 Codex 已验证。
- 真实 DeepSeek 命中回答验证仍以用户手动验证结果为准。

**当前边界**：

- 当前 V1.4 仍是本地文本知识库第一版。
- 当前不支持 embedding。
- 当前不支持 ChromaDB。
- 当前不支持自动长期记忆。
- 当前不支持自动监听聊天入库。
- 当前不支持自动接入 `/chat`。
- 当前已支持前端 Knowledge 最小入口。
- 当前前端 Knowledge 入口只支持手动操作，不自动触发 query / 入库。
- 当前不支持 PDF / Word / Excel 知识入库。
- 当前不做 GraphRAG。
- 当前不做知识图谱可视化。
- 当前不做多知识库管理。

**下一步待确认**：

- V1.4 收尾验证与 tag
- 或进入 V1.5 规划

---

### V1.5：屏幕感知工具组与学习辅助模式

V1.4-M13 文档修正补充：上方 V1.4 节若仍保留旧表述，以本补充为准。V1.4 当前应视为 M8-M12 已完成，已支持前端 Knowledge 最小入口；该入口仅支持手动刷新 `GET /knowledge/status`、手动调用 `POST /knowledge/index-file`、手动调用 `POST /knowledge/search`、手动调用 `POST /knowledge/query`，页面加载只自动刷新 status，不自动入库，不自动 search，不自动 query。当前知识库实现为本地文本知识库第一版，检索方式为 SQLite FTS5 + LIKE fallback 的全文检索，而不是 embedding / 向量检索；ChromaDB 不属于 V1.4 已实现范围。V1.4 下一步应为收尾验证 / tag，或进入 V1.5 规划。

**状态**：V1.5-M1 到 M9 已完成前端结构整理核心目标，当前进入收尾与文档同步。

**当前已完成内容**：

- API 调用层抽取到 `frontend/public/js/api/`
- 通用 UI 工具抽取到 `frontend/public/js/ui/`
- 通用 core 工具抽取到 `frontend/public/js/core/`
- `fileToolsCatalog` 提取到 `frontend/public/js/catalog/`
- Knowledge 业务模块拆分到 `frontend/public/js/knowledge/`
- Files 业务模块拆分到 `frontend/public/js/files/`
- Chat 业务模块拆分到 `frontend/public/js/chat/`
- 中文 UI 文案统一
- Markdown 渲染器提取
- 前端结构最终复核通过

**当前 `app.js` 职责**：

- DOM 引用
- state 组装
- 模块初始化
- 事件绑定
- Tab 切换
- backend metadata 检查
- 少量页面级展示逻辑

**当前验证结论**：

- 全量前端 JS `node --check` 已通过
- `npm run build` 已通过
- 前端结构复核已通过
- `git status` clean

**当前仍不做**：

- 桌宠 / 悬浮窗
- React / Vue
- 新依赖
- 后端知识库改造
- embedding / ChromaDB
- `/chat` 自动接入知识库
- 文件上传
- Tauri 权限扩展

**目标**：提供屏幕内容识别与学习辅助工具。

**内容**：

- 框选识别
- 当前窗口识别
- 当前屏幕识别
- 框选翻译
- 代码报错分析
- 题目辅助：
  - 只做题模式
  - 帮助学习模式
- 实时监控模式：
  - 用户主动开启
  - 可选全屏 / 当前窗口 / 框选区域
  - 可选监控频率
  - 可选输出方式
- 识别结果可选择保存到知识库 / 错题本

**不包含**：

- 不做 Always-On 常驻监控
- 不做自动截屏上传
- 不做隐私数据分析

**下一步建议**：

- 先完成 V1.5 收尾验证与 tag
- 然后进入 V1.6 桌面小面板 / 项目管家面板第一版
- 或在 V1.5 tag 后安装并试用 Superpowers

---

### V1.6：桌面小面板 / 项目管家面板第一版

**状态**：M1-M6 已完成，等待 M7。

**目标**：将现有 `Backend Status`、`Chat`、`Files / Tools`、`Knowledge` 能力重组为更适合桌面端使用的小面板入口，先验证桌面入口层，不直接进入完整桌宠形态，也不扩展为新的后端能力阶段。

**定位说明**：

- V1.6 不是完整桌宠
- V1.6 不是插件系统
- V1.6 不是新后端能力阶段
- V1.6 是对现有能力的桌面化入口重组

**第一版最小闭环**：

- 新增 Panel 入口或 Panel 页面
- 后端状态卡
- 快速聊天卡
- 文件工具快捷入口
- 知识库状态 / 搜索 / 问答快捷入口
- 所有动作保持用户手动触发

**推荐里程碑**：

- M1：方向与文档口径同步（已完成）
- M2：Panel 壳层 / 静态布局（已完成）
- M3：状态卡 + 知识库状态摘要（已完成）
- M4：快速 Chat 卡（已完成）
- M5：Files / Knowledge 快捷入口（已完成）
- M6：轻量回归验证与文档同步（已完成）
- M7：可选 Tauri 窗口尺寸微调

**当前已完成能力**：

- Panel 顶层 tab 与静态壳层布局
- Panel 后端状态摘要，复用现有 `/api/metadata` 结果
- Panel 知识库状态摘要，复用现有 `/api/knowledge/status` 结果
- Panel 快速 Chat 手动发送，复用现有 `/api/chat`
- Panel 跳转到完整后端状态、聊天、文件工具、知识库区域

**M6 本轮已实际完成的轻量回归**：

- `git status`
- `node --check frontend/public/app.js`
- `node --check frontend/public/js/panel/panel.js`
- `npm run build`

**风险边界**：

- Panel 是入口层，不替代完整 Chat / Files / Knowledge 页面
- 不自动调用 summarize / query
- 不自动入库
- 不自动读取文件
- 不扩大 API Key 暴露面

**不包含**：

- 不做 3D / Live2D
- 不做复杂动画
- 不做语音
- 不做截图 OCR
- 不做文件上传
- 不做 embedding / ChromaDB
- 不做 `/chat` 自动接入知识库
- 不做自动扫描目录
- 不做自动长期记忆
- 不做自动执行 PR / 修复
- 不做透明 / 置顶 / 无边框 Tauri 窗口
- 不做大规模前端重构
- 不新增后端能力

**后续说明**：

- 真正桌宠形态应在 V1.6 第一版面板完成并验证后，再单独规划。
- 技能网关 / 插件系统不再作为当前 V1.6 主线，后续如恢复该方向，应在更靠后的版本重新定义。

---

### V1.7：本地 Markdown 笔记接入 / Obsidian Bridge 第一版

**状态**：V1.7-M3 到 M6 已完成，当前等待 M7 收尾 tag。

**目标**：在不扩展后端能力边界的前提下，基于现有 V1.4 本地文本知识库第一版，建立面向 Obsidian / 本地 Markdown 笔记的手动接入闭环。

**定位说明**：

- V1.7 不是完整笔记系统
- V1.7 不是真正桌宠
- V1.7 不新增模型侧知识增强自动化
- V1.7 是对现有 Markdown 与知识库能力的受控接入整理

**第一版范围**：

- 只做用户手动指定的 Obsidian Vault 或本地 Markdown 目录接入
- 复用现有 V1.4 知识库接口与索引能力
- 支持手动指定单篇 `.md` 笔记
- 支持手动指定受控目录内的 Markdown 笔记
- Knowledge / Panel 展示 Markdown 接入状态摘要
- 所有入库、搜索、问答动作继续保持手动触发

**明确不做**：

- 不自动扫描全盘
- 不自动读取隐私文件
- 不自动接入 `/chat`
- 不做 PDF / Word / Excel
- 不做 embedding / ChromaDB
- 不做完整笔记系统
- 不做真正桌宠
- 不支持 Obsidian tags / 双链

**当前已完成内容**：

- `POST /knowledge/index-file` 保持单篇 Markdown 手动入库
- 新增 `POST /knowledge/index-markdown-directory`，支持受控目录内 `.md` 手动批量入库
- `GET /knowledge/status` 已补充 `markdown_files_count` 摘要字段
- Knowledge 区域已新增“Markdown 目录手动批量入库”小区域
- Panel 继续只展示 Markdown 接入摘要和跳转入口，不在 Panel 内放完整批量表单
- 批量入库安全边界包含：相对目录、禁止 `../` 越界、仅处理 `.md`、忽略 `.obsidian` / 隐藏项 / `attachments` / `assets` / `images`、`max_files` 限制、手动点击才执行

**推荐里程碑**：

- M1：文档口径统一 + V1.7 主题规格固定
- M2：Markdown / Obsidian 接入方案设计
- M3：单篇 Markdown 笔记手动入库（已完成）
- M4：受控目录内 Markdown 手动批量入库（已完成）
- M5：Panel / Knowledge 入口展示接入状态（已完成）
- M6：安全边界验证与文档同步（已完成）
- M7：收尾 tag

**不包含**：

- 不做多人声纹识别
- 不做离线语音模型
- 不做实时翻译

---

### V1.8：Tauri 桌面体验增强 + Panel 轻量优化

**目标**：在不扩展后端能力边界和 Tauri 权限的前提下，继续优化桌面端入口体验，让当前 Tauri 壳层与 Panel 更适合日常轻量使用。

**定位说明**：

- V1.8 不是手机端 / 局域网测试版本
- V1.8 不是真正桌宠
- V1.8 不新增后端能力
- V1.8 继续保持 Panel 是入口层，不替代完整页面

**第一版目标**：

- 默认启动体验更偏向 Panel
- Tauri 默认窗口尺寸微调
- Panel 信息更紧凑
- 保留完整 Chat / Files / Knowledge 页面入口
- 不新增后端能力
- 不扩大 Tauri 权限

**推荐里程碑**：

- M1：文档口径同步
- M2：默认打开 Panel（已完成）
- M3：Tauri 默认窗口尺寸微调（已完成）
- M4：Panel 紧凑化（已完成）
- M5：Markdown 接入摘要桌面化表达（已完成）
- M6：轻量回归与文档同步（已完成）
- M7：收尾 tag

**明确不做**：

- 不做系统托盘
- 不做全局快捷键
- 不做置顶窗口
- 不做透明窗口
- 不做无边框窗口
- 不做 Live2D / 3D
- 不做复杂动画
- 不做真正桌宠 / 悬浮窗
- 不做手机端 / 局域网 / 室友测试
- 不做自动启动后端
- 不做自动读文件
- 不做自动接入 `/chat`

**M2-M6 当前已完成内容**：

- 默认启动进入 Panel tab，同时保留切换到后端状态、聊天、文件工具与 Knowledge 完整页面的能力
- Tauri 主窗口默认尺寸从 `1280x900` 微调为 `1120x820`，`resizable` 与 `minWidth / minHeight` 保持不变
- Panel 四张卡片完成紧凑化，主要优化留白、卡片内摘要块密度和动作区
- Panel 中的 Markdown 接入摘要继续复用现有 `knowledge/status` 返回，清楚展示 `markdown_files_count`、`files_count`、`chunks_count`、`index_method`
- Panel 新增进入 Markdown 接入区域的跳转入口，但不在 Panel 内放完整批量入库表单
- 本轮轻量回归已覆盖 `git status`、`node --check frontend/public/app.js`、`node --check frontend/public/js/panel/panel.js`、`npm run build` 与 `tauri.conf.json` JSON 格式校验

**保留说明**：

- 手机端 / 局域网 / 室友测试可以后续另开版本，不作为当前 V1.8 主线

---

### V1.9：Chat 与 Knowledge 手动联动第一版

**状态**：M1/M2/M3 已完成，当前等待收尾验证。

**目标**：在 Chat 页面增加手动"知识库问答模式"，让用户可以在 Chat 页面选择"基于知识库回答"，但不改变普通 Chat 默认行为。

**定位说明**：

- V1.9 不改后端
- V1.9 不新增 API
- V1.9 不新增依赖
- V1.9 不改变 `/chat` 默认行为
- V1.9 不自动接入知识库

**第一版范围**：

- Chat 页面新增模式切换按钮组（普通聊天 / 知识库问答）
- 知识库问答模式调用现有 `/api/knowledge/query`
- kb_id / top_k 可配置，默认为 `default` / `4`
- 展示 answer.text、citations、hits
- grounded=false 时提示"未找到可靠知识片段"
- KNOWLEDGE_MODEL_DISABLED 时显示对应错误，不 fallback
- Panel 新增"基于知识库提问"轻量跳转入口

**当前已完成**：

- `frontend/public/index.html` — Chat 区域新增模式切换按钮与知识库参数
- `frontend/public/js/chat/chat.js` — 扩展 Chat 模块支持知识库模式
- `frontend/public/app.js` — 挂载模式切换逻辑
- `frontend/public/js/panel/panel.js` — 无需修改（Panel 入口通过 HTML + app.js 跳转）
- `frontend/public/styles.css` — 新增模式按钮、知识库回答结果样式

**明确不做**：

- 不改后端
- 不新增 API
- 不改 `/chat` 默认行为
- 不让 `/chat` 自动接入知识库
- 不做 embedding / ChromaDB
- 不做自动记忆
- 不自动读取文件
- 不自动入库

**不包含**：

- 不做容器编排
- 不做多节点调度
- 不做生产级容器管理

---

### V2.0：个人 AI Agent 工作站完全体

**目标**：整合所有模块，形成完整工作站体验。

**内容**：

- 多模型调度
- AI 对话
- 文件处理
- 知识库
- 长期记忆
- 屏幕感知工具组
- 语音交互
- 插件技能
- Docker 沙盒
- 自动化任务
- 桌面端 + 移动端
- OpenClaw / Hermes 联动

---

## 二、开发工程线

开发工程线不是正式用户功能，用于提高开发效率与团队协作质量。

### E1：Git 分支与提交规范

- 统一分支命名规则
- 统一 commit message 格式
- PR 审查流程

### E2：文档管理规范

- 文档更新与版本同步规则
- 文档索引维护
- 历史文档归档策略

### E3：前端组件化

- 抽取通用 UI 组件
- 建立组件目录结构
- 组件复用规范

### E4：Vite 热更新

- 确保前端开发热更新可用
- 减少手动刷新

### E5：Preview 页面

- 为开发中的组件和页面提供独立预览入口
- 桌宠形象、功能按键、悬浮菜单的实时可视化预览属于开发工程线，不属于正式用户功能

### E6：Storybook（可选）

- 组件文档与交互测试
- 视团队需要决定是否引入

### E7：轻量验证流程

- 每次修改后执行最小验证
- 检查 git status
- 检查核心功能是否能打开
- 检查主流程是否能跑通
- 检查是否有明显报错
- 检查文档是否同步更新

### E8：打包发布流程

- Tauri 桌面端打包
- 版本号管理
- 发布说明生成

---

## 三、每个功能开发前的要求

每个功能正式开发前，必须先完成以下检查，不允许直接开写代码。

### 1. 功能设想确认

- 这个功能具体解决什么问题？
- 用户会在什么场景下使用？
- 用户从入口到完成操作的完整流程是什么？
- 是否符合 AI Hub 的长期定位？

### 2. 功能边界确认

- 当前版本做什么？
- 当前版本不做什么？
- 哪些能力放到后续版本？
- 是否存在过度设计？

### 3. 架构接入确认

- 这个功能属于哪个 module？
- 需要哪些 service？
- 需要哪些 adapter？
- 是否需要新增 API？
- 前端入口放在哪里？
- 配置项放在哪里？
- 日志和错误处理怎么做？

### 4. 最小可用版本确认

- 第一版只做最小闭环
- 不一次性塞太多功能
- 先跑通主流程，再逐步增强

### 5. 实现前任务清单

- 列出要新增的文件
- 列出要修改的文件
- 说明每一步修改目的
- 说明可能影响的现有功能
- 说明验证方式
- 说明回滚方式

### 6. 实现后轻量验证

- 检查 git status
- 检查核心功能是否能打开
- 检查主流程是否能跑通
- 检查是否有明显报错
- 检查 README / TASKS / VERSION_PLAN 是否同步更新

---

## 四、开发原则

1. V1.1 只做高适配性底层框架，不在 V1.1 里强行塞具体业务功能
2. V1.2 及后续版本每次只主攻一个功能模块
3. 后续功能必须按 modules / services / adapters / api / frontend 的分层规则接入
4. 不允许把大量逻辑堆进单个 app.js 或单个页面文件
5. 不允许未讨论清楚就直接实现功能
6. 不允许为了速度破坏整体架构
7. 功能不删减，但按版本逐步落地
8. 开发工程线和产品功能线分开记录

# V1.1-M6 当前进度同步

V1.1 高适配性底层框架当前状态：进行中，M2-M5 已完成。

已完成里程碑：

- V1.1-M2 后端分层目录骨架已完成。
- V1.1-M3 core 基础模块已完成。
- V1.1-M4 API 路由拆分已完成。
- V1.1-M5 前端预留结构已完成。

当前已经落地的结构：

- 后端已预留 `backend/core/`、`backend/api/`、`backend/services/`、`backend/adapters/`、`backend/modules/`。
- `backend/core/` 已包含 `config.py`、`logging.py`、`errors.py`。
- API 路由已拆分到 `backend/api/routes/health.py`、`backend/api/routes/meta.py`、`backend/api/routes/chat.py`。
- 前端已预留 `frontend/components/`、`frontend/pages/`、`frontend/preview/`、`frontend/services/api.js`。

当前边界：

- 未新增业务功能。
- 未接真实模型。
- 未进入 V1.2 AI 对话功能。
- 未重构现有前端页面。
- 未改变现有接口路径、请求格式或响应格式。

V1.1 下一步：

- V1.1-M7 轻量验证。

---

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
