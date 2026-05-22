# AI Hub 任务清单

本文档约束当前开发顺序，记录任务状态与执行进度。

## 任务状态约定

- `TODO`：未开始
- `DOING`：进行中
- `DONE`：已完成
- `BLOCKED`：受依赖或环境阻塞

---

## 功能开发前通用化检查要求

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

---

## 一、产品功能线

### V1.0 / V1.0.1：桌面端基础骨架与启动体验优化

**状态**：`DONE`

已完成内容：

- Tauri 桌面端基础结构
- Backend Status / Chat / Files & Tools 基础页面
- 桌面端启动体验优化
- Git 管理和基础文档

---

### V1.1：高适配性底层框架

**状态**：`DOING`（M2-M5 已完成，待 M7 轻量验证）

**原则**：只做框架，不主攻具体功能。

任务清单：

- [ ] 前后端结构整理
- [ ] 建立 core 基础层（config / logging / errors / events）
- [ ] 建立 model_router 预留位置
- [ ] 建立 skill_registry 预留位置
- [ ] 建立 services 层目录结构
- [ ] 建立 adapters 层目录结构
- [ ] 建立 modules 层目录结构
- [ ] 建立 API 层路由拆分
- [ ] 建立配置管理系统
- [ ] 建立统一日志和错误处理
- [ ] 建立前后端通信规范文档
- [ ] 预留以下模块接入位置：文件处理、知识库、屏幕工具、语音、沙盒、技能网关
- [ ] 更新 ARCHITECTURE.md 反映实际结构

---

### V1.2：基础 AI 对话窗口

**状态**：`DOING`（M1-M7 已完成，M8 收尾验证与文档同步中）

**目标**：完成 AI Hub 的基础 AI 对话闭环。用户打开桌面端后，可以在简洁的聊天窗口中输入问题、获得真实模型回复，并支持连续追问。

**第一版范围**：

- 先做单会话
- 先接 DeepSeek API
- 暂不做历史会话列表
- 暂不做文件上传、知识库、截图搜索、桌宠形态
- 后续再扩展流式输出、多模型切换和本地保存

任务清单：

- [x] 简洁聊天页面 UI
- [x] 消息列表组件：区分用户消息和 AI 消息
- [x] 底部输入框：支持 Enter 发送、Shift + Enter 换行
- [x] 发送按钮状态：空输入禁用、发送中禁用
- [x] loading 状态展示：AI 回复生成中
- [x] 错误提示组件：模型失败、网络失败、后端失败
- [x] Markdown 渲染：标题、列表、代码块、表格、加粗
- [x] 安全渲染：模型输出不通过 `innerHTML` 直接渲染
- [x] 统一 AI 调用接口：`POST /api/chat`
- [x] DeepSeek 模型适配层
- [x] `DeepSeekChatSkill`
- [x] `/chat` 最小接入 DeepSeek
- [x] 默认关闭 DeepSeek，fallback Echo
- [x] 短上下文管理：保留最近 4 轮内存对话
- [x] 普通完整回复链路验证
- [x] 手动对话测试：普通问题、连续追问、错误场景
- [x] 更新 README / TASKS 进度说明

V1.2-M5 DeepSeek 接入同步：

- [x] M5a：DeepSeek 接入方案确认
- [x] M5b：新增 `backend/adapters/deepseek.py`
- [x] M5c：新增 `DeepSeekChatSkill`
- [x] M5d：`/chat` 路由已最小接入 DeepSeek，仅在 echo fallback 分支尝试
- [x] M5e：fallback 机制已验证，默认关闭、未启用、无 Key 或调用失败时回退 Echo
- [x] M5f：真实 DeepSeek 链路已验证，成功返回 `skill: deepseek_chat`

M5 安全边界：

- `ENABLE_DEEPSEEK_CHAT=false` 为默认值，不会自动消耗 DeepSeek API 额度。
- API Key 只通过环境变量读取，不写入前端、日志或 Git。
- 已验证默认 Echo 链路仍可用。

V1.2-M6 短上下文管理同步：

- [x] M6a：`ChatRequest` 已兼容可选 `messages`，旧 `{"message":"..."}` 请求继续兼容。
- [x] M6b：DeepSeek adapter 已支持 `messages` payload，单轮 message 调用继续可用。
- [x] M6c：`DeepSeekChatSkill` 已支持 messages 调用，未修改 `BaseSkill`。
- [x] M6d：router 只在 DeepSeek 分支使用 messages，Echo fallback 和非 echo skill 不受上下文影响。
- [x] M6e：前端已新增内存 `chatHistory`，浏览器代理已透传 `messages`。

M6 边界：

- 当前只做内存短上下文，页面刷新后丢失。
- 不做持久化、不做历史会话列表、不做多会话管理。
- 不做 SSE、知识库、文件上传、桌宠、语音或 Docker 沙盒。
- 已验证 DeepSeek 连续追问能记住前文。
- 下一步进入 V1.2-M7：基础 Markdown 渲染。

V1.2-M7 Markdown 渲染同步：

- [x] M7a：基础 Markdown 渲染已接入聊天消息展示。
- [x] M7b：支持标题、列表、代码块、表格、加粗等基础格式。
- [x] M7c：模型输出采用安全渲染路径，不使用 `innerHTML` 直接渲染模型输出。
- [x] M7d：未新增 V1.3 文件、知识库、截图、语音或桌宠能力。

V1.2-M8 轻量验证与文档同步：

- [x] M8a：同步 V1.2-M7 完成状态到 `docs/TASKS.md`。
- [x] M8b：同步 V1.2 当前状态到 `docs/VERSION_PLAN.md`。
- [x] M8c：简短更新 `README.md` 的 V1.2 当前能力说明。
- [ ] M8d：建议运行 `git status`。
- [ ] M8e：建议运行 `npm run build`。
- [ ] M8f：建议运行相关后端文件的 `python -m py_compile`。
- [ ] M8g：建议手动验证后端 `/health`、`/version`、`/skills`、`/chat`。
- [ ] M8h：建议手动验证网页端 Chat。
- [ ] M8i：DeepSeek 短上下文验证可选，避免重复消耗额度。

M8 边界：

- 本阶段只做 V1.2 收尾验证与文档同步。
- 不新增功能，不修改业务逻辑。
- 不把建议验证写成已验证。

**暂不纳入本版本**：

- 历史会话列表
- 多会话切换
- 文件上传分析
- 知识库 RAG
- 截图搜索 / 框选翻译
- 桌宠形态
- 本地模型管理
- 手机端

---

### V1.3：文件处理功能

**状态**：`DOING`（M1-M7 已完成，当前进入 V1.3 收尾判断）

任务清单：

- [ ] 文件上传接口
- [ ] PDF 基础解析
- [ ] Word 基础解析
- [x] TXT 基础解析（白名单目录内文本类文件）
- [x] Markdown 基础解析（白名单目录内文本类文件）
- [x] 文件内容提取 API（当前 `/files/summarize` 手动总结链路已接入）
- [x] 文件总结功能（当前仅支持手动触发总结）
- [ ] 根据文件问答
- [ ] 文件处理结果导出
- [ ] 为知识库预留数据结构

V1.3-M6 文档同步：

- [x] M6a：`POST /files/summarize` 已完成并用于手动文件总结。
- [x] M6b：Files / Tools 页面已新增“生成总结”按钮。
- [x] M6c：前端总结必须由用户手动点击触发，读取预览不会自动调用 AI。
- [x] M6d：新增 `ENABLE_FILE_SUMMARY` 独立开关，默认 `false`。
- [x] M6e：DeepSeek 未启用或无 Key 时返回 `SUMMARY_MODEL_DISABLED`。
- [x] M6f：已真实验证 DeepSeek 文件总结链路。

M6 已验证返回：

- `model: deepseek-v4-flash`
- `input_chars: 33`
- `source_chars: 33`
- `truncated: false`

M6 边界：

- 当前只支持白名单目录内 `.txt` / `.md` / `.log` / `.csv` 文本类文件。
- 当前不支持 PDF / Word / Excel。
- 当前不做自动总结，必须手动点击“生成总结”。
- 当前不做读取预览自动调用 AI。
- 当前不做 ChromaDB / RAG / 长期记忆 / 多文件知识库。
- 下一步是 V1.3-M7：错误处理与安全边界验证。

V1.3-M7 错误处理与安全边界验证：

- [x] M7a：`/files/preview` 已验证 `.txt` / `.md` / `.log` / `.csv` 小文件正常预览。
- [x] M7b：`/files/preview` 已验证错误码：`FILE_NOT_FOUND`、`PATH_NOT_ALLOWED`、`PATH_IS_NOT_FILE`、`UNSUPPORTED_FILE_TYPE`、`FILE_TOO_LARGE`、`BINARY_FILE_REJECTED`。
- [x] M7c：`/files/summarize` 已验证默认关闭时返回 `SUMMARY_MODEL_DISABLED`。
- [x] M7d：`/files/summarize` 已验证文件不存在、不支持后缀、路径越界时返回对应错误。
- [x] M7e：回归验证已完成：`/chat` 发送 `hello` 正常返回 Echo。
- [x] M7f：回归验证已完成：`/health`、`/version`、`/skills` 正常。
- [x] M7g：`npm run build` 已实际通过。
- [x] M7h：相关后端文件 `py_compile` 已实际通过。

M7 说明：

- 本轮已实际验证后端接口、前端代理、`npm run build` 与 `py_compile`。
- “打开 Files / Tools 页面不应自动调用 `/files/summarize`”与“预览成功后不应自动调用 `/files/summarize`”本轮仅完成源码检查，不写成浏览器运行时验证。
- 当前 V1.3 仍是只读文本文件预览 + 手动总结，不是知识库。
- 当前仍不支持文件上传、PDF / Word / Excel、ChromaDB、RAG、长期记忆、多文件知识库、自动扫描全盘、文件修改 / 删除 / 移动。

环境注意事项：

- 当前项目后端应使用 `ai_hub` 环境 / Python 3.11+。
- 默认 Python 3.9 会因新语法无法启动后端。

下一步：

- 进入 V1.3 收尾判断，准备合并或打 tag。

---

### V1.4：知识库与记忆系统

**状态**：`DOING`（M8-M12 已完成，当前进入 V1.4 收尾验证 / tag 或 V1.5 规划）

任务清单：

- [x] 本地文本知识库状态接口：`GET /knowledge/status`
- [x] 本地文本知识库入库接口：`POST /knowledge/index-file`
- [x] 本地文本知识库纯检索接口：`POST /knowledge/search`
- [x] 本地文本知识库检索增强回答接口：`POST /knowledge/query`
- [ ] ChromaDB 接入
- [ ] 向量化服务
- [ ] 长期记忆存储
- [ ] 学习资料沉淀
- [ ] 错题/薄弱点存储接口
- [ ] 个性化知识图谱接口预留

V1.4-M10 检索增强回答同步：

- [x] M10a：已完成独立 `POST /knowledge/query`，不接入 `/chat`。
- [x] M10b：已实现知识库第一版最小闭环：`/knowledge/index-file` 入库、`/knowledge/status`、`/knowledge/search` 纯检索、`/knowledge/query` 检索增强回答。
- [x] M10c：`/knowledge/query` 先检索 chunks，再基于 hits 调用 DeepSeek 生成回答。
- [x] M10d：hits 为空时不调用 DeepSeek，直接返回 `grounded=false`、空 `hits`、空 `citations`。
- [x] M10e：`/knowledge/query` 不走 `/chat`，不自动接入聊天，不做 Echo fallback。
- [x] M10f：第一版 `citations` 已由 hits 直接映射生成，未做模型真实引用抽取。
- [x] M10g：已加入模型上下文长度控制，避免无界传入知识片段。
- [x] M10h：真实 DeepSeek 知识库问答验证已通过。
- [x] M10i：manual-test 测试知识库记录和测试文件已清理。

M10 已验证结果：

- `HTTP_STATUS: 200`
- `model: deepseek-v4-flash`
- `grounded: true`
- `hits` 非空
- `citations` 非空
- `answer.text` 中文正常

M10 当前边界：

- `/knowledge/query` 是独立接口，当前不自动接入 `/chat`。
- 当前知识库仍是本地文本知识库第一版，不做 embedding，不做 ChromaDB。
- 当前不做自动长期记忆，不做自动监听聊天入库，不做自动知识增强聊天。
- 当前已支持前端 Knowledge 最小入口，但保持手动操作边界。
- 当前不支持 PDF / Word / Excel 知识入库。

V1.4-M11 错误处理与安全边界验证：

- [x] M11a：已验证 `/knowledge/index-file` 支持白名单内 `.txt` / `.md` 正常入库。
- [x] M11b：已验证重复入库同文件返回 `reused_existing=true`。
- [x] M11c：已验证修改文件后 `force_reindex=true` 返回 `replaced_existing=true`。
- [x] M11d：已验证 `/knowledge/index-file` 错误码：`FILE_NOT_FOUND`、`PATH_NOT_ALLOWED`、`UNSUPPORTED_FILE_TYPE`、`INVALID_CHUNK_PARAMS`。
- [x] M11e：已验证 `/knowledge/status` 返回 `files_count` / `chunks_count`、`fts_available=true`、`fts_enabled=true`、`index_method=sqlite_fts`。
- [x] M11f：已验证 `/knowledge/search` 命中时 `hits` 非空、无关查询 `hits=[]`、空 `query` 返回 `INVALID_QUERY`、`top_k` 生效。
- [x] M11g：已验证 `/knowledge/query` 无命中时不调用 DeepSeek，返回 `grounded=false`。
- [x] M11h：已验证 `/knowledge/query` 有命中但模型未启用或无 Key 时返回 `KNOWLEDGE_MODEL_DISABLED`。
- [x] M11i：已验证 `/knowledge/query` 不 fallback Echo，不走 `/chat`。
- [x] M11j：已完成回归验证：`/chat hello` 返回 Echo、`/files/preview` 正常、`/files/summarize` 默认关闭返回 `SUMMARY_MODEL_DISABLED`、`/health` / `/version` / `/skills` 正常。
- [x] M11k：已实际通过 `npm run build`。
- [x] M11l：已实际通过 `conda run -n ai_hub python -m py_compile ...`。
- [x] M11m：已删除临时测试文件，并已清理 `kb_id=m11-validation` 的 `knowledge_files` / `knowledge_chunks` / `knowledge_chunks_fts`，清理后计数为 `0 / 0 / 0`。

M11 说明：

- 本轮没有修改任何功能代码。
- 本轮使用 `conda run -n ai_hub python ...` 完成 Python 验证，没有使用系统默认 Python。
- 当前 Codex 执行环境读不到 `DEEPSEEK_API_KEY`，因此本轮没有把“真实 DeepSeek 命中回答”写成 Codex 已验证。
- 真实 DeepSeek 命中回答验证仍以用户手动验证结果为准，不在本轮 M11 验证中重复声称。

M11 后当前边界：

- 当前仍不支持前端知识库页面。
- 当前仍不支持 embedding。
- 当前仍不支持 ChromaDB。
- 当前仍不支持自动长期记忆。
- 当前仍不支持自动监听聊天入库。
- 当前仍不支持 `/chat` 自动接入知识库。
- 当前仍不支持 PDF / Word / Excel 入库。

V1.4 下一步待确认：

- V1.4 收尾验证与 tag
- 或进入 V1.5 规划

---

### V1.5：屏幕感知工具组与学习辅助模式

V1.4-M13 文档同步补充：上方 V1.4 任务节若仍显示 “M12 或收尾待确认” 或 “当前不做前端知识库页面”，以本补充为准。V1.4 当前状态应视为 M8-M12 已完成，已进入收尾验证 / tag 或 V1.5 规划；M12 前端 Knowledge 最小入口已完成，但仍保持手动操作边界，不自动入库，不自动 search，不自动 query，也不自动把 `/chat` 接入知识库。

**状态**：`DOING`（M1-M9 已完成前端结构整理核心目标，当前进入 V1.5 收尾与文档同步）

V1.5-M9 文档同步补充：

- [x] V1.5 当前状态已同步为“前端桌面应用结构整理已完成核心目标，进入收尾”。
- [x] 已同步前端分层现状：`frontend/public/js/api/`、`ui/`、`core/`、`catalog/`、`chat/`、`files/`、`knowledge/`。
- [x] 已同步当前 `app.js` 职责：DOM 引用、state 组装、模块初始化、事件绑定、Tab 切换、backend metadata 检查、少量页面级展示逻辑。
- [x] 已同步已完成内容：API 层抽取、UI 工具抽取、core 工具抽取、Tool Catalog 提取、Knowledge / Files / Chat 模块拆分、中文 UI 文案统一、Markdown 渲染器提取。
- [x] 已同步验证结论：全量 `node --check` 通过、`npm run build` 通过、前端结构复核通过、`git status` clean。
- [x] 已同步当前仍不做：桌宠 / 悬浮窗、React / Vue、新依赖、后端知识库改造、embedding / ChromaDB、`/chat` 自动接入知识库、文件上传、Tauri 权限扩展。
- [x] 已同步下一步建议：V1.5 收尾验证与 tag，再进入 V1.6 桌面小面板 / 项目管家面板第一版，或在 V1.5 tag 后安装并试用 Superpowers。

V1.5 当前说明：

- 本阶段已完成的是前端结构整理与文档同步，不是桌宠、悬浮窗或 V1.6 面板能力实现。
- 当前没有把 React / Vue 重构写成已完成，也没有把 V1.6 能力写成 V1.5 已完成。

任务清单：

- [ ] 框选识别
- [ ] 当前窗口识别
- [ ] 当前屏幕识别
- [ ] 框选翻译
- [ ] 代码报错分析
- [ ] 题目辅助：只做题模式
- [ ] 题目辅助：帮助学习模式
- [ ] 实时监控模式：用户主动开启
- [ ] 实时监控模式：区域/频率/输出方式可选
- [ ] 识别结果保存到知识库/错题本

V1.5 当前仍不做：

- 桌宠 / 悬浮窗
- React / Vue
- 新依赖
- 后端知识库改造
- embedding / ChromaDB
- `/chat` 自动接入知识库
- 文件上传
- Tauri 权限扩展

---

### V1.6：桌面小面板 / 项目管家面板第一版

**状态**：`DOING`（M1 已完成，等待 M2）

当前定位：

- 这是对现有 `Backend Status`、`Chat`、`Files / Tools`、`Knowledge` 的桌面化入口重组。
- 这不是完整桌宠。
- 这不是插件系统。
- 这不是新后端能力阶段。

任务清单：

- [x] M1：方向与文档口径同步
- [ ] M2：Panel 壳层 / 静态布局
- [ ] M3：状态卡 + 知识库状态摘要
- [ ] M4：快速 Chat 卡
- [ ] M5：Files / Knowledge 快捷入口
- [ ] M6：轻量回归验证与文档同步
- [ ] M7：可选 Tauri 窗口尺寸微调

V1.6 第一版最小闭环：

- [ ] 新增 Panel 入口或 Panel 页面
- [ ] 后端状态卡
- [ ] 快速聊天卡
- [ ] 文件工具快捷入口
- [ ] 知识库状态 / 搜索 / 问答快捷入口
- [ ] 所有动作继续保持用户手动触发

V1.6 当前边界：

- [ ] 不做 3D / Live2D
- [ ] 不做复杂动画
- [ ] 不做语音
- [ ] 不做截图 OCR
- [ ] 不做文件上传
- [ ] 不做 embedding / ChromaDB
- [ ] 不做 `/chat` 自动接入知识库
- [ ] 不做自动扫描目录
- [ ] 不做自动长期记忆
- [ ] 不做自动执行 PR / 修复
- [ ] 不做透明 / 置顶 / 无边框 Tauri 窗口
- [ ] 不做大规模前端重构

V1.6 风险边界：

- [ ] Panel 仅是入口层，不替代完整 Chat / Files / Knowledge 页面
- [ ] 不自动调用 summarize / query
- [ ] 不自动入库
- [ ] 不自动读取文件
- [ ] 不扩大 API Key 暴露面

---

### V1.7：语音交互

**状态**：`TODO`

任务清单：

- [ ] 语音输入捕获
- [ ] VAD 语音活动检测
- [ ] STT 语音转文字
- [ ] TTS 文字转语音
- [ ] 低延迟语音对话流程
- [ ] 桌面语音助手体验

---

### V1.8：手机端 / 局域网 / 室友测试

**状态**：`TODO`

任务清单：

- [ ] 局域网访问配置
- [ ] 手机端页面适配
- [ ] iPad 访问适配
- [ ] 室友测试执行
- [ ] 简单使用说明编写
- [ ] 反馈收集机制
- [ ] 基础访问控制
- [ ] 简单使用限制

---

### V1.9：Docker 安全沙盒与自动化执行

**状态**：`TODO`

任务清单：

- [ ] Docker 安全沙盒环境
- [ ] 隔离代码运行
- [ ] 隔离文件操作
- [ ] 自动化任务执行
- [ ] 高风险操作确认流程
- [ ] 执行日志追踪
- [ ] 权限控制体系

---

### V2.0：个人 AI Agent 工作站完全体

**状态**：`TODO`

任务清单：

- [ ] 多模型调度整合
- [ ] AI 对话优化
- [ ] 文件处理整合
- [ ] 知识库整合
- [ ] 长期记忆整合
- [ ] 屏幕感知工具组整合
- [ ] 语音交互整合
- [ ] 插件技能整合
- [ ] Docker 沙盒整合
- [ ] 自动化任务整合
- [ ] 桌面端 + 移动端联调
- [ ] OpenClaw / Hermes 联动

---

## 二、开发工程线

开发工程线不面向用户，用于提高开发效率。

### E1：Git 分支与提交规范

**状态**：`TODO`

- [ ] 制定分支命名规则
- [ ] 制定 commit message 格式
- [ ] 建立 PR 审查流程

### E2：文档管理规范

**状态**：`DOING`

- [x] 建立文档优先级体系
- [x] 创建 VERSION_PLAN.md
- [x] 创建 ARCHITECTURE.md
- [x] 更新 README.md
- [ ] 持续维护文档同步

### E3：前端组件化

**状态**：`TODO`

- [ ] 抽取通用 UI 组件
- [ ] 建立组件目录结构
- [ ] 制定组件复用规范

### E4：Vite 热更新

**状态**：`TODO`

- [ ] 确认 HMR 配置可用
- [ ] 优化开发体验

### E5：Preview 页面

**状态**：`TODO`

- [ ] 组件/页面独立预览入口
- [ ] 桌宠形象实时可视化预览
- [ ] 功能按键实时可视化预览
- [ ] 悬浮菜单实时可视化预览

注意：桌宠形象、功能按键、悬浮菜单的实时可视化预览属于开发工程线，不属于 AI Hub 正式用户功能。

### E6：Storybook（可选）

**状态**：`TODO`

- [ ] 评估是否需要引入
- [ ] 如引入，建立组件文档与交互测试

### E7：轻量验证流程

**状态**：`TODO`

- [ ] 制定每次修改后的最小验证步骤
- [ ] 核心功能打开检查
- [ ] 主流程跑通检查
- [ ] 明显报错检查
- [ ] 文档同步检查

### E8：打包发布流程

**状态**：`TODO`

- [ ] Tauri 桌面端打包流程
- [ ] 版本号管理规范
- [ ] 发布说明模板

---

## 三、历史实验记录（已完成）

以下为 V0.x 阶段已完成的实验记录，保留作为技术参考：

- V0.1 微核心验证版 — FastAPI + Skill 插件架构验证（`DONE`）
- V0.2 学习能力接入版 — DifyEnglishSkill 接入（`DONE`）
- V0.3 AI Router 实验 — Ollama 路由实验（`DONE`）
- V0.4 Safe Actions 实验 — ActionPlan 生成（`DONE`）
- V0.5 File Analysis Plan 实验 — FileAnalysisPlan 生成（`DONE`）
- V0.6 File Inventory 实验 — 文件清单解析（`DONE`）
- V0.7 ReadOnlyFileScanner 实验 — 只读文件扫描（`DONE`）
- V0.8 ReadOnlyTextPreview 实验 — 文本预览（`DONE`）
- V0.9 API Stabilization 实验 — /health /version /skills 接口（`DONE`）
- V1.0 Phase 1 Desktop MVP — 前端状态壳（`DONE`）
- V1.0 Phase 2 Desktop Chat Page — 聊天页面（`DONE`）
- V1.0 Phase 3 Files / Tools Page — 文件工具页面（`DONE`）
- V1.0 Phase 4 Tauri Desktop Wrapper — Tauri 桌面包装（`DONE`）
- V1.0.1 Desktop Startup Polish — 启动体验优化（`DONE`）

## 执行规则

- 优先级顺序：产品功能线按版本号顺序执行，开发工程线按需穿插
- 每次只执行一个小任务
- 不得跨版本并行开发多个功能模块
- 若任务超出当前版本边界，必须停止并回看 VERSION_PLAN.md
- 完成每个版本后必须更新本文档状态

# V1.1-M6 最新同步

当前 V1.1 高适配性底层框架进度：

- [x] V1.1-M2 后端分层目录骨架已完成
- [x] V1.1-M3 core 基础模块已完成
- [x] V1.1-M4 API 路由拆分已完成
- [x] V1.1-M5 前端预留结构已完成
- [ ] V1.1-M7 轻量验证

说明：

- M2 建立了 `backend/core/`、`backend/api/`、`backend/services/`、`backend/adapters/`、`backend/modules/` 等后端分层目录骨架。
- M3 建立了 `backend/core/config.py`、`backend/core/logging.py`、`backend/core/errors.py`，仅提供基础配置、日志、错误定义，未接入现有业务逻辑。
- M4 将 `/health`、`/version`、`/skills`、`/chat` 路由拆入 `backend/api/routes/`，接口路径、请求格式和响应格式保持不变。
- M5 建立了 `frontend/components/`、`frontend/pages/`、`frontend/preview/`、`frontend/services/api.js`，仅作为前端组件化和 API 封装预留结构，暂未接入现有页面。
- V1.1 下一步是 M7 轻量验证。

---

