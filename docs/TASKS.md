# AI Hub 任务清单

本文档用于约束 8 天冲刺和后续 Gemini 接管时的执行顺序。默认只围绕 V0.1 和 V0.2 展开，禁止超范围扩展。

任务状态约定：

- `TODO`：未开始
- `DOING`：进行中
- `DONE`：已完成
- `BLOCKED`：被依赖或环境阻塞

## P0：项目基础文档

- 任务目标：建立统一协作入口，明确项目边界、优先级、任务顺序与已确认决策，确保 Claude Code、Codex、Gemini 可以无歧义接力开发。
- 具体文件：`AGENTS.md`、`GEMINI.md`、`README.md`、`docs/TASKS.md`、`docs/DECISIONS.md`
- 验收标准：协作文档齐全；项目边界清晰；文档优先级明确；后续 AI 工具知道先读什么、做什么、不能做什么。
- 当前状态：`TODO`

## P1：V0.1 FastAPI 微核心

- 任务目标：完成 V0.1 最小后端闭环，证明 “FastAPI + Skill 插件架构” 成立。
- 具体文件：`backend/main.py`、`backend/schemas.py`、`backend/router.py`、`backend/skills/base.py`、`backend/skills/echo.py`、`backend/skills/time.py`
- 验收标准：存在可运行的 FastAPI 入口；提供 `POST /chat`；定义标准 JSON 协议；实现 `BaseSkill`、`EchoSkill`、`TimeSkill`；规则路由可用。
- 当前状态：`DONE`

验证记录：

- 已通过 `python -m uvicorn backend.main:app --reload` 成功启动 FastAPI 服务。
- 已通过手动接口测试验证 `POST /chat` 可以正常调用 `EchoSkill`。
- 已通过手动接口测试验证 `POST /chat` 可以正常调用 `TimeSkill`。
- 在 PowerShell 中发送中文请求体时，需使用 UTF-8 bytes 方式编码，否则中文会变成 `????`，导致时间关键词无法正确匹配路由。

## P2：SQLite 灵感盲存

- 任务目标：补齐 V0.1 的首个真实业务能力，让系统具备最基本的数据写入与查询能力。
- 具体文件：`backend/skills/idea_capture.py`、与 SQLite 相关的最小数据访问文件或模块、必要的 schema 定义文件
- 验收标准：实现 `IdeaCaptureSkill`；具备 `ideas` 表；字段包含 `id`、`content`、`status`、`created_at`、`updated_at`；支持记录想法；支持查询最近想法。
- 当前状态：`DONE`

验证记录：

- 已验证 `POST /chat` 可以正常触发 `IdeaCaptureSkill`。
- 已验证“记录想法：明天整理技能路由”可成功写入 SQLite。
- 已验证生成 `data/ai_hub.db`，且 `ideas` 表内容正常，中文无乱码。
- 已验证“最近想法”可成功返回刚才保存的想法。
- 已验证返回结构包含 `reply`、`skill`、`status`、`data.ideas`。
- Windows 下使用 `uvicorn --reload` 时，曾因扫描 `data/` 目录触发 `FileNotFoundError`；后续建议使用 `python -m uvicorn backend.main:app --reload --reload-dir backend`。

## P3：V0.2 DifyEnglishSkill

- 任务目标：接入已有 Dify 四级英语助手，形成真实 AI 学习闭环。
- 具体文件：`backend/skills/dify_english.py`、环境变量说明文件、与 Dify 请求封装相关的最小模块
- 验收标准：实现 `DifyEnglishSkill`；使用 `DIFY_API_URL`、`DIFY_API_KEY`；支持查词、出题、判题、错词整理；API Key 不写死；有基础错误处理。
- 当前状态：`DONE`

验证记录：

- 已验证 `/chat` 可以正常触发 `DifyEnglishSkill`。
- 已验证测试输入“帮我查一个四级单词：refute”可正常命中 Dify 路由。
- 已验证返回 `skill = dify_english`。
- 已验证返回 `status = success`。
- 已验证 `reply` 成功返回 `refute` 的四级词条解释。
- 已验证 `data` 中包含 `conversation_id` 和 `message_id`。
- 已验证 `.env` 读取问题已修复：使用项目根目录 `.env`，并支持 `utf-8-sig` 与 BOM 处理。
- 已验证 Dify 请求必须携带浏览器 `User-Agent`，否则 Dify 云端可能返回 Cloudflare `403`，错误码 `1010`。
- 已确认本阶段没有新增依赖。
- 已确认未触碰 Ollama、ChromaDB、OpenClaw、Docker、OCR、Tauri、Live2D、前端等禁止范围。
- 已完成 v0.2 稳定性加固：SQLite 初始化已优化为应用启动时执行一次，Dify 配置读取已缓存，router 关键词已做模块级预计算，`requirements.txt` 已显式加入 `pydantic`。

## P4：README、测试与交接

- 任务目标：让后续开发者或 AI 工具可以快速跑起项目、验证核心流程并继续开发。
- 具体文件：`README.md`、`.env.example`、基础测试说明文件或测试目录、必要的交接说明文档
- 验收标准：README 能说明安装、启动、环境变量配置、`/chat` 调用方式；存在基础测试命令说明；能指导他人验证 Echo、Time、Idea、Dify。
- 当前状态：`TODO`

进度记录：

- `README.md` 已补充。
- `scripts/test_api.py` 已创建。
- P4 仍待最终交接文档整理后再标 `DONE`。

V0.3 AI Router 实验记录：

- 当前分支：`feature/v0.3-ai-router`。
- RuleRouter 仍然优先。
- OllamaRouter 只在 `echo` fallback 时介入。
- `qwen2.5:7b` 作为当前本地候选模型。
- 该功能仍需用户本地测试后再决定是否合并 `main`。

V0.4 Safe Actions 实验记录：

- 当前分支：`feature/v0.4-safe-actions`。
- 当前只生成 `ActionPlan`。
- 不执行真实文件操作。
- 为未来 OpenClaw / Docker 沙盒预留安全执行前置层。

## 执行规则

- 优先级顺序固定为：`P0 > P1 > P2 > P3 > P4`
- 每次只执行一个小任务
- 不得跨级并行扩展多个任务块
- 若任务超出当前阶段边界，必须停止并回看 `AGENTS.md`
