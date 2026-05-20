# AI Hub AGENTS Guide

## 1. 项目目标

AI Hub 是一个面向学习与个人工作流的桌面 AI 智能中枢。

当前项目不是直接实现完整的 Personal AI OS，而是先验证一条可运行、可扩展、可交接的技术路线：

- FastAPI 微核心
- Skill 插件化网关
- 统一 JSON 协议
- 轻量数据沉淀

本项目的第一目标，是在有限时间内建立稳定的后端闭环，而不是一次性实现所有远期愿景。

## 2. 当前阶段

当前项目已进入多版本实验阶段，当前代码基线已包含：

- `V0.2 DifyEnglishSkill`
- `V0.3 Ollama AI Router`
- `V0.4 SafeActionSkill`
- `V0.5 FileAnalysisSkill`
- `V0.6 FileInventorySkill`
- `V1.0 Phase 1 Desktop MVP`
- `V1.0 Phase 2 Desktop Chat Page`
- `V1.0 Phase 3 Files / Tools Page`
- `V1.0 Phase 4 Tauri Desktop Wrapper`

当前阶段原则：

- 先跑通后端闭环
- `RuleRouter` 优先，AI Router 只做补充或 fallback
- 先 SQLite，后其他存储
- 先命令行 / API，后桌面 UI
- PR 合并前必须完成必要测试与审查修补

## 3. 文档优先级

所有 AI 开发工具都必须按以下顺序读取并服从文档：

1. `docs/AI_Hub_Version_Roadmap.md`
2. `docs/AI_Hub_Implementation_Plan.md`
3. `docs/AI_Hub_Project_Planning.md`

如果三份文档之间出现范围冲突、优先级冲突或愿景膨胀，必须按以上顺序裁决。

默认规则：

- 路线图决定版本边界
- 实施计划决定当前冲刺内容
- 项目规划负责保留长期愿景与架构原则

## 4. 当前允许开发内容

当前阶段允许围绕现有实验能力做小步迭代与修补：

- FastAPI 后端
- `POST /chat` 接口
- 标准 JSON 协议
- `BaseSkill`
- `EchoSkill`
- `TimeSkill`
- `IdeaCaptureSkill`
- `DifyEnglishSkill`
- `Ollama AI Router`
- `SafeActionSkill`
- `FileAnalysisSkill`
- `FileInventorySkill`
- SQLite 灵感盲存

从 `V1.0 Phase 1` 起，允许开发 `frontend` 页面，但只限当前桌面实验范围内的页面与交互：

- `Backend Status`
- `Chat`
- `Files / Tools`

从 `V1.0 Phase 4` 起，允许引入最小 `Tauri Desktop Wrapper`，但仅限作为桌面容器包装现有前端：

- 允许创建和维护 `src-tauri/`
- 允许最小窗口配置与桌面启动脚本
- 允许通过 Tauri 加载现有前端页面
- 不允许借机扩展新的桌面能力边界

当前默认目标：

- 保持现有 Skill / Router / JSON 协议稳定可交接
- 保持现有 frontend 页面稳定可运行
- 在不突破安全边界的前提下完成 Tauri 桌面容器修补

如果某项工作不能直接支持当前版本实验或稳定性修补，则默认不属于当前阶段。

## 5. 当前禁止开发内容

当前阶段仍禁止擅自接入以下内容：

- ChromaDB
- OpenClaw
- Docker 沙盒
- OCR
- Live2D
- IoT
- GraphRAG
- Always-On

当前阶段对 Tauri 和前端的限制如下：

- Tauri 只允许作为桌面容器包装现有前端
- 不允许新增 `fs` 权限
- 不允许新增 `shell` 权限
- 不允许接系统托盘
- 不允许自动启动后端
- 不允许借 Tauri 新增文件选择、文件上传、真实文件读取或真实文件操作
- 不允许自动调用 `/chat`
- 不允许自动触发 Dify
- 不允许为了桌面包装引入不必要的新基础设施

补充禁止项：

- 不得读取或输出 `.env` 原文
- 不得输出任何 API Key 真实值
- 不得无授权执行真实文件操作
- 不得以“顺手预埋”为理由扩展复杂基础设施
- 不得为了远期愿景引入当前不需要的依赖、服务或中间件

如果确实需要提及这些能力，只能写在文档、注释或 TODO 中，不能进入当前代码实现。

## 6. 技术栈要求

当前阶段技术栈保持收敛：

- Python
- FastAPI
- SQLite
- Node.js
- 最小 Tauri Desktop Wrapper

当前阶段推荐风格：

- 规则路由优先
- Skill 接口统一
- JSON 协议清晰稳定
- 依赖尽量少
- 错误处理保持基础可用
- 桌面端优先复用现有前端，不重复实现业务逻辑

当前阶段不应擅自引入：

- 本地大模型运行时
- 向量数据库
- 容器编排
- 超出最小包装范围的桌面端能力
- 多模态或设备联动相关组件

## 7. 代码目录约定

当前阶段仍以现有后端闭环和桌面包装为主组织目录。

推荐目录如下：

```text
backend/
  main.py
  schemas.py
  router.py
  skills/
    base.py
    echo.py
    time.py
    idea_capture.py
frontend/
  public/
  server.mjs
  build.mjs
src-tauri/
  tauri.conf.json
  capabilities/
  src/
```

目录约定规则：

- `backend/main.py` 负责 FastAPI 应用入口
- `backend/schemas.py` 负责请求与响应协议定义
- `backend/router.py` 负责规则路由
- `backend/skills/base.py` 负责 `BaseSkill`
- `backend/skills/` 下按单个 Skill 拆分文件
- `frontend/` 负责当前桌面实验前端页面
- `src-tauri/` 只负责最小桌面容器包装

当前阶段不要创建：

- `desktop/`
- `docker/`
- `ocr/`
- `rag/`
- `iot/`

除非版本路线图明确进入对应阶段，否则这些目录都不应出现。

## 8. 每次修改后的输出要求

每次完成修改后，AI 开发工具必须明确输出以下内容：

- 修改了哪些文件
- 每个修改的目的是什么
- 这些修改属于哪个阶段目标
- 是否引入了新依赖
- 是否触碰了禁止开发范围
- 下一步最应该做什么

如果本次没有写代码，也要说明：

- 做了什么文档整理或方案收敛
- 为什么这一步符合当前阶段

输出要求必须简洁、直接、可供下一位 AI 工具继续接手。

## 9. 禁止过度设计规则

本项目当前最重要的约束仍然是禁止过度设计。

具体规则如下：

- 不为了未来能力提前抽象多层架构
- 不为了“可扩展性”提前引入复杂插件系统实现
- 不为了“AI 感”提前接入本地模型
- 不为了“产品完整度”提前开发超出当前阶段的前端或桌面能力
- 不为了“长期记忆”提前接入 ChromaDB、GraphRAG
- 不为了“自动化愿景”提前实现 OpenClaw、Docker 沙盒

判断是否过度设计的标准：

- 是否直接服务当前版本实验与稳定性修补
- 是否会增加当前环境配置成本
- 是否会拖慢 8 天冲刺进度
- 是否会让后续接手者理解成本上升

如果答案偏向“会”，则不做。

## 10. 协作执行规则

Claude Code、Codex、Gemini 等工具在本项目中应遵守以下协作方式：

- 优先做当前阶段必做项与 PR 审查修补
- 不擅自扩展版本范围
- 不修改已定稿文档的核心边界，除非用户明确要求
- 修改前先确认是否属于当前允许开发内容
- 修改后保持输出可交接
- 默认先走规则路由与安全边界校验
- 测试通过后再考虑合并到 `main`

若遇到用户请求与路线图冲突，应优先提醒当前版本边界，而不是直接扩展实现。

## 11. 敏感信息安全规则

所有 AI 开发工具在本项目中必须遵守以下敏感信息安全规则：

- 禁止读取、展示、复制、输出 `.env` 原文内容。
- 禁止在审查报告、调试输出、聊天回复、提交说明或任何文档中输出 `DIFY_API_KEY` 或任何 API Key 的真实值。
- 如果需要检查 `.env` 是否存在，只能检查文件是否存在、变量名是否存在，不能输出变量值。
- 如果需要确认 `.env` 是否被 Git 跟踪，只能使用 `git check-ignore` 或 `git ls-files`，不得使用 `cat`、`type`、`Get-Content` 等方式读取 `.env` 内容。
- 所有日志、报告、文档、截图说明中都必须隐藏 Key，例如：`DIFY_API_KEY=***已隐藏***`。
- 如果任何 Key 曾被 AI 工具、聊天窗口、命令输出、日志系统或报告文本展示过，必须立即视为泄露，并要求用户尽快轮换该 Key。

## 12. 一句话执行准则

当前执行准则：在现有多版本实验基线上继续做小步修补，优先保证 RuleRouter、安全边界、测试通过和可交接性；`frontend` 与最小 `Tauri Desktop Wrapper` 仅在 V1.0 已明确允许的范围内推进，禁止擅自接入高风险能力。
