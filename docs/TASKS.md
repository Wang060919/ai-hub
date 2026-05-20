# AI Hub 任务清单

本文档用于约束当前开发顺序，并为后续 AI 工具接手提供最小但清晰的执行记录。

任务状态约定：

- `TODO`：未开始
- `DOING`：进行中
- `DONE`：已完成
- `BLOCKED`：受依赖或环境阻塞

## P0：项目基础文档

- 任务目标：建立统一协作入口，明确项目边界、优先级、任务顺序与已确认决策。
- 具体文件：`AGENTS.md`、`README.md`、`docs/TASKS.md`、`docs/DECISIONS.md`
- 当前状态：`DONE`

## P1：V0.1 FastAPI 微核心

- 任务目标：完成 V0.1 最小后端闭环，验证 `FastAPI + Skill 插件架构`。
- 具体文件：`backend/main.py`、`backend/schemas.py`、`backend/router.py`、`backend/skills/base.py`、`backend/skills/echo.py`、`backend/skills/time.py`
- 验收标准：提供 `POST /chat`，具备统一 JSON 协议，规则路由可用。
- 当前状态：`DONE`

验证记录：

- 已验证 `POST /chat` 可正常命中 `EchoSkill`
- 已验证 `POST /chat` 可正常命中 `TimeSkill`
- Windows 下中文请求需使用 UTF-8 编码发送，避免路由关键词失配

## P2：SQLite 灵感盲存

- 任务目标：完成 `IdeaCaptureSkill`，补齐最小数据写入与查询能力。
- 具体文件：`backend/skills/idea_capture.py` 及相关 SQLite 模块
- 验收标准：支持记录想法与查询最近想法。
- 当前状态：`DONE`

验证记录：

- 已验证 `IdeaCaptureSkill` 可正常写入 SQLite
- 已验证最近想法查询可返回保存结果
- 已验证返回结构包含 `reply`、`skill`、`status`、`data`

## P3：V0.2 DifyEnglishSkill

- 任务目标：接入 Dify 英语学习能力，形成基础 AI 学习闭环。
- 具体文件：`backend/skills/dify_english.py` 及相关配置读取逻辑
- 验收标准：支持命中 Dify 路由、返回学习结果、保留基础错误处理。
- 当前状态：`DONE`

验证记录：

- 已验证 `/chat` 可正常命中 `DifyEnglishSkill`
- 已验证返回 `skill = dify_english`
- 已确认未触碰 `.env` 明文输出与禁止范围

## P4：README、测试与交接

- 任务目标：让后续开发者或 AI 工具可以快速启动、验证并继续开发。
- 具体文件：`README.md`、`scripts/test_api.py` 及相关测试脚本
- 当前状态：`DOING`

进度记录：

- `README.md` 已补充启动与测试说明
- `scripts/test_api.py` 已创建
- 当前仍持续补充新实验能力的测试与交接记录

## 实验记录

V0.3 AI Router 实验记录：

- 当前分支：`feature/v0.3-ai-router`
- RuleRouter 仍然优先
- OllamaRouter 只在 `echo` fallback 时介入
- 该功能仍需用户本地环境验证后再决定是否合并

V0.4 Safe Actions 实验记录：

- 当前分支：`feature/v0.4-safe-actions`
- 当前只生成 `ActionPlan`
- 不执行真实文件操作
- 为未来 OpenClaw / Docker 沙盒预留安全执行前置层
- 已完成 V0.4.1 小修补：`ActionPlan` 输出兼容 `model_dump()`，并补充 low risk 测试用例

V0.5 File Analysis Plan 实验记录：

- 当前分支：`feature/v0.5-file-analysis-plan`
- 当前只生成 `FileAnalysisPlan`
- 不读取真实文件
- 不执行 OCR / PDF / Word / Excel 解析
- 为未来文件理解能力预留

V0.6 File Inventory 实验记录：

- 当前分支：`feature/v0.6-file-inventory`
- 当前只解析用户提供的文件清单文本
- 不读取真实文件
- 不检查真实路径
- 为未来文件理解和批量处理能力预留

V0.7 ReadOnlyFileScanner 实验记录：

- 当前分支：`feature/v0.7-readonly-file-scanner`
- 只读扫描白名单目录
- 只读取文件名、后缀、大小、修改时间
- 不读取文件内容
- 不执行真实文件操作
- 为未来真实文件理解能力做安全前置

V0.7.1 ReadOnlyFileScanner 小修补：

- 当前分支：`fix/v0.7.1-readonly-scan-polish`
- 只优化扫描结果展示
- 增加 `file_type_summary`
- 增加 `total_size_human`
- 文件与目录结果固定排序
- 不扩大文件系统权限

V0.8 ReadOnlyTextPreview 实验记录：

- 当前分支：`feature/v0.8-readonly-text-preview`
- 只读预览白名单目录内 txt / md 小文件
- 不解析 PDF / Word / Excel / 图片
- 不执行真实文件操作
- 为未来文件理解能力做安全前置

V0.9 API Stabilization 实验记录：

- 当前分支：`feature/v0.9-api-stabilization`
- 新增后端元信息接口：`/health`、`/version`、`/skills`
- 为 `V1.0 Tauri` 桌面端 MVP 做准备
- 不新增 Skill
- 不扩大文件权限

V1.0 Phase 1 Desktop MVP 实验记录：

- 当前分支：`feature/v1.0-desktop-mvp`
- 桌面端外壳 + 后端状态页
- 只连接 `/health`、`/version`、`/skills`
- 不接聊天
- 不接文件操作

V1.0 Phase 2 Desktop Chat Page 实验记录：

- 当前分支：`feature/v1.0-desktop-chat-page`
- 在状态壳基础上新增 `Backend Status` 和 `Chat` 两个分区
- `Chat` 页手动调用 `POST /chat`
- 只做文本聊天
- 不做文件上传
- 不执行真实文件操作
- 测试时优先使用不会触发 Dify 的输入，例如：`hello ai hub`、`现在几点了`、`随便说句话`
- 不把 Dify 测试作为默认构建验证

V1.0 Phase 3 Files / Tools Page 实验记录：

- 当前分支：`feature/v1.0-desktop-files-tools-page`
- 在现有前端桌面壳中新增 `Files / Tools` 第三个分区
- 只展示 `SafeActionSkill`、`FileAnalysisSkill`、`FileInventorySkill`、`ReadOnlyFileScannerSkill`、`ReadOnlyTextPreviewSkill`
- 优先复用 `Backend Status` 已读取的 `/skills` 数据
- 只做能力展示，不执行工具
- 不新增后端接口
- 不自动调用 `/chat`
- 不做文件上传、文件读取或真实文件操作

## 执行规则

V1.0 Phase 4 Tauri Desktop Wrapper 实验记录：

- 当前分支：`feature/v1.0-tauri-desktop-wrapper`
- 把现有 frontend 页面包装进真正的 Tauri 桌面窗口
- 保留 `Backend Status`、`Chat`、`Files / Tools` 三个页面
- 只做桌面包装，不新增后端能力
- 不新增文件权限
- 不新增 shell 权限
- 不自动启动 FastAPI 后端
- 不自动调用 `/chat`

V1.0.1 Desktop Startup Polish 记录：

- 当前分支：`fix/v1.0.1-desktop-startup-polish`
- 目标：优化桌面端启动体验与后端连接提示
- 范围：只改前端提示和文档说明
- 不新增业务能力
- 不新增任何权限
- 不自动启动后端
- 不自动调用 `/chat`
- 不触发 Dify 作为默认测试

- 优先级顺序固定为：`P0 > P1 > P2 > P3 > P4`
- 每次只执行一个小任务
- 不得跨级并行扩展多个任务块
- 若任务超出当前阶段边界，必须停止并回看 `AGENTS.md`
