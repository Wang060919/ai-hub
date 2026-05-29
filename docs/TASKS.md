# AI Hub 任务清单

本文档约束当前开发顺序，记录任务状态与执行进度。

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

**状态**：`DOING`（M1-M6 已完成，等待 M7）

当前定位：

- 这是对现有 `Backend Status`、`Chat`、`Files / Tools`、`Knowledge` 的桌面化入口重组。
- 这不是完整桌宠。
- 这不是插件系统。
- 这不是新后端能力阶段。

任务清单：

- [x] M1：方向与文档口径同步
- [x] M2：Panel 壳层 / 静态布局
- [x] M3：状态卡 + 知识库状态摘要
- [x] M4：快速 Chat 卡
- [x] M5：Files / Knowledge 快捷入口
- [x] M6：轻量回归验证与文档同步
- [ ] M7：可选 Tauri 窗口尺寸微调

V1.6 第一版最小闭环：

- [x] 新增 Panel 入口或 Panel 页面
- [x] 后端状态卡
- [x] 快速聊天卡
- [x] 文件工具快捷入口
- [x] 知识库状态 / 搜索 / 问答快捷入口
- [x] 所有动作继续保持用户手动触发

V1.6-M6 文档同步补充：

- [x] 已同步 M2 完成：Panel 壳层 / 静态布局。
- [x] 已同步 M3/M4/M5 完成：Panel 动态摘要 + 快速 Chat + 快捷入口。
- [x] 已同步 Panel 当前支持：后端状态摘要、知识库状态摘要、快速 Chat 手动发送、跳转到完整页面。
- [x] 已同步 Panel 当前仍不支持：完整桌宠、透明 / 置顶 / 无边框、自动 summarize、自动 query、自动入库、自动扫描、文件上传、截图 OCR、后端新能力。
- [x] 已同步 Panel 是入口层，不替代完整 Chat / Files / Knowledge 页面。
- [x] 已同步本轮实际回归：`git status`、`node --check frontend/public/app.js`、`node --check frontend/public/js/panel/panel.js`、`npm run build`。

V1.6 当前边界：

- [x] 不做 3D / Live2D
- [x] 不做复杂动画
- [x] 不做语音
- [x] 不做截图 OCR
- [x] 不做文件上传
- [x] 不做 embedding / ChromaDB
- [x] 不做 `/chat` 自动接入知识库
- [x] 不做自动扫描目录
- [x] 不做自动长期记忆
- [x] 不做自动执行 PR / 修复
- [x] 不做透明 / 置顶 / 无边框 Tauri 窗口
- [x] 不做大规模前端重构
- [x] 不新增后端能力

V1.6 风险边界：

- [x] Panel 仅是入口层，不替代完整 Chat / Files / Knowledge 页面
- [x] 不自动调用 summarize / query
- [x] 不自动入库
- [x] 不自动读取文件
- [x] 不扩大 API Key 暴露面

---

### V1.7：本地 Markdown 笔记接入 / Obsidian Bridge 第一版

**状态**：`DOING`（M3-M6 已完成，等待 M7 收尾）

定位与边界：

- 只做用户手动指定的 Obsidian / 本地 Markdown 笔记接入
- 复用现有 V1.4 知识库能力
- 支持手动选择或配置 Markdown 目录、单篇 `.md` 笔记
- 不自动扫描全盘
- 不自动读取隐私文件
- 不自动接入 `/chat`
- 不做 PDF / Word / Excel
- 不做 embedding / ChromaDB
- 不做完整笔记系统
- 不做真正桌宠

任务清单：

- [x] M1：文档口径统一 + V1.7 主题规格固定
- [x] M2：Markdown / Obsidian 接入方案设计
- [x] M3：单篇 Markdown 笔记手动入库
- [x] M4：受控目录内 Markdown 手动批量入库
- [x] M5：Panel / Knowledge 入口展示接入状态
- [x] M6：安全边界验证与文档同步
- [ ] M7：收尾 tag

本轮同步说明：

- [x] 新增 `POST /knowledge/index-markdown-directory`，仅支持白名单根目录内相对目录
- [x] 批量入库只处理 `.md`，忽略 `.obsidian`、隐藏目录和隐藏文件、`attachments`、`assets`、`images`
- [x] `max_files` 默认 50，且保持有限上限
- [x] Knowledge 区域新增 Markdown 目录手动批量入库入口
- [x] `/knowledge/status` 新增 `markdown_files_count`，Knowledge / Panel 已展示 Markdown 接入摘要
- [x] 保持单篇 Markdown 入库、search、query、Panel 跳转入口不受影响
- [x] 仍不支持自动扫描全盘、自动读取整个 Vault、`/chat` 自动接入知识库、PDF / Word / Excel、embedding / ChromaDB、Obsidian tags / 双链

---

### V1.8：Tauri 桌面体验增强 + Panel 轻量优化

**状态**：`DOING`（M2-M6 已完成，等待 M7 收尾）

任务清单：

- [x] M1：文档口径同步
- [x] M2：默认打开 Panel
- [x] M3：Tauri 默认窗口尺寸微调
- [x] M4：Panel 紧凑化
- [x] M5：Markdown 接入摘要桌面化表达
- [x] M6：轻量回归与文档同步
- [ ] M7：收尾 tag

V1.8 第一版目标：

- [x] 默认启动体验更偏向 Panel
- [x] Tauri 默认窗口尺寸微调
- [x] Panel 信息更紧凑
- [x] 保留完整 Chat / Files / Knowledge 页面入口
- [x] 不新增后端能力
- [x] 不扩大 Tauri 权限

V1.8 当前暂不做：

- [x] 不做系统托盘
- [x] 不做全局快捷键
- [x] 不做置顶窗口
- [x] 不做透明窗口
- [x] 不做无边框窗口
- [x] 不做 Live2D / 3D
- [x] 不做复杂动画
- [x] 不做真正桌宠 / 悬浮窗
- [x] 不做手机端 / 局域网 / 室友测试
- [x] 不做自动启动后端
- [x] 不做自动读文件
- [x] 不做自动接入 `/chat`

V1.8 保留说明：

- [x] 手机端 / 局域网 / 室友测试可以后续另开版本，不作为当前 V1.8 主线

本轮同步说明：

- [x] 已完成默认打开 Panel，且仍保留手动切换到后端状态 / 聊天 / 文件工具 / Knowledge 完整页面的入口。
- [x] 已完成 Tauri 默认窗口尺寸微调，主窗口默认尺寸已从 `1280x900` 调整为 `1120x820`，`resizable` 与合理最小尺寸保持不变。
- [x] 已完成 Panel 紧凑化，主要收敛卡片留白、摘要块密度、按钮区和 Markdown 摘要卡表现。
- [x] 已完成 Markdown 接入摘要桌面化表达，Panel 继续复用 `knowledge/status` 已有字段展示 `markdown_files_count`、`files_count`、`chunks_count`、`index_method`，并增加跳转到 Markdown 接入区域的入口。
- [x] 已完成轻量回归与文档同步：`git status`、`node --check frontend/public/app.js`、`node --check frontend/public/js/panel/panel.js`、`npm run build`、`tauri.conf.json` JSON 格式校验。
- [x] 仍不支持：系统托盘、全局快捷键、置顶 / 透明 / 无边框、真正桌宠、Live2D / 3D、自动启动后端、自动读文件、自动接入 `/chat`。

---

### V1.9：Chat 与 Knowledge 手动联动第一版

**状态**：M1/M2/M3 `DONE`，等待收尾验证。

任务清单：

- [x] M1：Chat 页面新增模式切换按钮组（普通聊天 / 知识库问答）
- [x] M2：Chat 模块扩展知识库问答模式，调用 `/api/knowledge/query`
- [x] M3：Panel 新增"基于知识库提问"轻量跳转入口
- [ ] M4：轻量回归验证与文档同步

当前支持：
- Chat 页面手动知识库问答模式
- 普通 Chat 默认行为不变
- 底层复用 `/api/knowledge/query`
- grounded=false 提示、citations/hits 展示、KNOWLEDGE_MODEL_DISABLED 错误处理

仍不支持：
- `/chat` 默认自动接入知识库
- 自动记忆、自动读取文件
- embedding / ChromaDB
- 自动入库

---

### V2.0：AI Hub 桌面工作台产品化界面第一版

**状态**：`DONE`

任务清单：

- [x] M1：UI 现状审查与产品化改版方案
- [x] M2：设计 Token 与基础样式统一（CSS 变量体系）
- [x] M3：Panel 主入口改版（移除开发文字、产品化文案）
- [x] M4：Chat 页面体验优化（去除技术细节、简化知识库展示）
- [x] M5：Knowledge 页面信息架构整理（折叠分组、Markdown 接入合并）
- [x] M6：Files / Tools 页面统一（卡片样式对齐）
- [x] M7：回归验证、文档同步、tag
- [x] M8：视觉强化与首页重构

当前支持：
- 统一的设计 Token 体系（间距、圆角、阴影、表面色）
- Panel 产品化文案（移除开发期占位文字）
- Chat 去技术化表达（空状态、错误提示）
- Chat 知识库问答结果简化（合并 citations/hits 为统一"参考来源"）
- Knowledge 折叠式分组（Markdown 接入、搜索、问答三大组）
- 各页面卡片、按钮、输入框样式统一

V2.0-M8 目标：

- [ ] 强化首页作为桌面工作台入口的识别度
- [ ] 重构 Panel 首屏视觉层级
- [ ] 做出肉眼可见的 UI 提升
- [ ] 让页面更像成熟桌面 AI 工作台，而不是开发工具集合

V2.0-M8 允许做：

- [ ] 首页 / Panel hero 区域视觉强化
- [ ] Panel 四张卡片重新排版
- [ ] 强化主操作按钮层级
- [ ] 优化状态摘要展示
- [ ] 优化颜色、背景、边框、阴影、字重、留白
- [ ] 使用 `frontend-design` 的视觉思路，但保持当前暖色、圆角、柔和卡片体系
- [ ] 优先采用 Organic / Workspace / Dashboard 风格，不推翻当前整体风格

V2.0-M8 不做：

- [x] 不新增后端能力
- [x] 不新增 API
- [x] 不改 Tauri 权限
- [x] 不新增依赖
- [x] 不引入 React / Vue
- [x] 不做暗色模式
- [x] 不做系统托盘 / 快捷键 / 悬浮窗
- [x] 不做真正桌宠
- [x] 不做 PDF / Word / Excel
- [x] 不做自动 Agent
- [x] 不伪造状态数据
- [x] 不编造 AI 指标

V2.0-M8 推荐实现范围：

- [ ] `frontend/public/index.html`
- [ ] `frontend/public/styles.css`
- [ ] `frontend/public/app.js`（如确实需要）
- [ ] `frontend/public/js/panel/panel.js`（如确实需要）
- [x] 原则上不改 Chat / Knowledge / Files 业务逻辑

V2.0-M8 推荐验收标准：

- [ ] 启动后默认 Panel 首屏有明显视觉提升
- [ ] 第一眼能看出这是 AI Hub 桌面工作台
- [ ] 主操作入口更明确
- [ ] Panel 不再像功能说明列表
- [ ] Chat / Files / Knowledge 原功能不受影响
- [ ] `npm run build` 通过

仍不支持：
- 新后端能力 / API
- PDF / Word / Excel
- React / Vue 重构
- 暗色模式
- 系统托盘 / 快捷键 / 悬浮窗
- 真正桌宠
- 自动 Agent
- 自动 chat / summarize / query / 入库

---

### V2.1：Chat-first 抽屉式 UI 原型

**状态**：`DONE`

**目标**：聊天界面重构为左侧抽屉 + 右侧主区域的 chat-first 布局。

任务清单：

- [x] 新增 `chat-first.html` 原型页面
- [x] 新增 `styles/chat-first.css` 独立样式体系
- [x] 新增 `js/layout/chat-first-shell.js` Shell 状态管理
- [x] 抽屉内集成后端状态、知识库、文件预览面板
- [x] 新增 `orbit-icon.js` 品牌图标组件
- [x] 新增 `prototypes/chat-first-drawer-ui/` 原型目录
- [x] chat-first 设为默认首页
- [x] 清理重复文件和旧 `services/api.js`

不包含：不改后端 API、不改 Tauri、不新增依赖。

---

### V2.2：Classic 功能迁移至 Chat-first

**状态**：`DONE`

**目标**：将经典首页全部功能迁移到 chat-first 架构下。

任务清单：

- [x] Chat 功能在 chat-first 中可用
- [x] Files 功能在 chat-first 中可用
- [x] Knowledge 功能在 chat-first 中可用
- [x] Backend Status 在 chat-first 中可用
- [x] `chat-first.js` 作为新主入口，导入全部 JS 模块
- [x] 经典首页归档为 `index-classic.html`
- [x] 删除重复的 `chat-first.html`

---

### V2.3：Tauri 桌面集成 MVP（Rust 代理层）

**状态**：`DONE`

**目标**：在 Tauri 桌面端建立 Rust reqwest 代理层，封装全部后端端点。

任务清单：

- [x] `src-tauri/src/lib.rs` 实现完整 Rust 代理（528 行）
- [x] 代理全部后端端点（chat / files / knowledge / metadata）
- [x] `capabilities/default.json` 配置权限白名单
- [x] `permissions/desktop_bridge.toml` 自定义权限定义
- [x] `client.js` 新增 `isTauriRuntime()` 双模式路由
- [x] Tauri 模式走 Rust invoke，浏览器模式走 fetch
- [x] 不开放 fs/shell/系统托盘权限

---

### V2.4：桌面 App Shell + 自定义标题栏

**状态**：`DONE`

**目标**：Chat-first 抽屉 UI 重构为桌面 App Shell：标题栏 + Sidebar + 四页独立布局。

任务清单：

- [x] `index.html` 重写为桌面 Shell DOM 结构（278 行）
- [x] 自定义标题栏：最小化/最大化/关闭按钮 + 拖拽区域
- [x] 左侧 Sidebar：品牌区 + 四页导航 + 连接状态指示器
- [x] 主内容区四个独立页面区域（chat/files/knowledge/status）
- [x] `chat-first.css` 适配 Shell 布局（填满窗口、独立滚动）
- [x] `chat-first-shell.js` 改造为页面路由控制器
- [x] `chat-first.js` 重新编排全部模块
- [x] 移除 Web 模式元素：顶栏后端地址、上下文栏、页脚
- [x] `npm run build` 通过
- [x] `node --check` 全量通过
- [x] Git 提交 `feat: add custom desktop titlebar`

仍不支持：新后端能力、React/Vue、暗色模式、系统托盘、桌宠、自动 Agent。

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

- [ ] 制�