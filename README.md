# AI Hub

AI Hub 是一个面向学习与个人工作流的 AI 项目，当前阶段聚焦于 `FastAPI 微核心 + Skill 插件化网关`，优先验证一个可运行、可路由、可返回、可沉淀数据的后端闭环。

## 当前已完成能力

- `EchoSkill`
- `TimeSkill`
- `IdeaCaptureSkill`
- `DifyEnglishSkill`

## 技术栈

- Python 3.11
- FastAPI
- SQLite
- Dify API

## 环境准备

```powershell
conda create -n ai_hub python=3.11 pip -y
conda activate ai_hub
pip install -r requirements.txt
```

## .env 配置

在项目根目录创建 `.env` 文件，并写入以下变量名与示例值：

```env
DIFY_API_URL=https://api.dify.ai/v1/chat-messages
DIFY_API_KEY=your_dify_api_key_here
```

注意：不要写入或提交真实 Key 到仓库、日志、截图或审查报告。

## 启动服务

```powershell
python -m uvicorn backend.main:app --reload --reload-dir backend
```

## 测试方式

项目提供了一个基础测试脚本：

```powershell
python scripts/test_api.py
```

脚本会依次验证：

- `EchoSkill`
- `TimeSkill`
- `IdeaCaptureSkill` 保存想法
- `IdeaCaptureSkill` 查询最近想法
- `DifyEnglishSkill`

## V0.3 AI Router 实验功能

- 需要本地 Ollama
- 推荐模型：`qwen2.5:7b`
- 启动 Ollama 后可运行：

```powershell
python scripts/test_ai_router.py
```

- RuleRouter 仍然优先，Ollama 只在规则结果为 `echo` 时做兜底增强

## V0.4 Safe Actions 实验功能

- 当前只生成 `ActionPlan`
- 不执行任何真实操作
- 后续版本才考虑 OpenClaw / Docker
- 测试命令：

```powershell
python scripts/test_safe_actions.py
```

## V0.5 File Analysis Plan 实验功能

- 当前只生成 `FileAnalysisPlan`
- 不读取真实文件
- 不做 OCR
- 后续版本才考虑接 OCR / OpenClaw / 文档解析
- 测试命令：

```powershell
python scripts/test_file_analysis.py
```

## V0.6 File Inventory 实验功能

- 当前只解析用户手动输入的文件清单文本
- 不读取真实文件
- 不检查路径是否存在
- 不做 OCR / 文档解析
- 后续版本才考虑接 OpenClaw / OCR / 文档解析
- 测试命令：

```powershell
python scripts/test_file_inventory.py
```

## V0.7 ReadOnlyFileScanner 实验功能

- 只读取文件元信息
- 不读取文件内容
- 默认白名单目录：`data/scan_sandbox`
- 可通过 `AI_HUB_SCAN_ROOT` 配置白名单根目录
- 不递归扫描
- 不执行任何文件操作
- 测试命令：

```powershell
python scripts/test_readonly_file_scanner.py
```

## 当前未实现内容

- Ollama
- ChromaDB
- OpenClaw
- Docker
- OCR
- Tauri
- Live2D

## 后续路线

- V0.3 本地模型路由
- V0.4 OpenClaw + Docker
- V0.5 OCR
- V1.0 Tauri
- V1.1 Live2D

## 安全说明

- `.env` 不要提交
- `data/` 不要提交
- API Key 不要输出到日志或审查报告
