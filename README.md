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
- 不建议把 `AI_HUB_SCAN_ROOT` 设置为 `C:\`、`D:\`、用户主目录等大范围目录，推荐使用专门沙盒目录，如 `data/scan_sandbox` 或 `D:\AI-Workspace\ai-hub-sandbox`
- 不递归扫描
- 不执行任何文件操作
- V0.7.1 会返回 `file_type_summary`
- V0.7.1 会返回 `total_size_human`
- V0.7.1 会按规则排序目录和文件结果
- V0.7.1 仍然只读，不读取文件内容
- 测试命令：

```powershell
python scripts/test_readonly_file_scanner.py
```

## V0.8 ReadOnlyTextPreview 实验功能

- 只读取白名单目录内的 txt / md 小文件
- 默认最大 64KB
- 默认最多返回前 2000 字符
- 不读取复杂文档
- 不 OCR
- 不修改文件
- 测试命令：

```powershell
python scripts/test_readonly_text_preview.py
```

## V0.9 API Stabilization 实验功能

- 新增 `/health`
- 新增 `/version`
- 新增 `/skills`
- 这些接口用于桌面端读取后端状态和能力
- 不调用 Dify，不消耗模型额度
- 测试命令：

```powershell
python scripts/test_api_metadata.py
```

## V1.0 Desktop MVP 第一阶段

- 当前阶段提供最小桌面端前端外壳和后端状态页
- 页面只连接 `/health`、`/version`、`/skills`
- 不调用 `/chat`
- 不消耗 Dify 额度
- 不接文件操作

### 启动后端

```powershell
python -m uvicorn backend.main:app --reload --reload-dir backend
```

### 启动前端壳

```powershell
npm run dev
```

- 默认访问地址：`http://127.0.0.1:4173`
- 页面默认后端地址：`http://127.0.0.1:8000`
- 当前仓库未初始化完整 Tauri 工程，因此本阶段先提供可运行的前端壳用于验证桌面端状态页

## V1.0 Phase 2 Desktop Chat Page

- 在现有前端状态壳基础上新增 `Backend Status` 和 `Chat` 两个分区
- `Backend Status` 保留 `/health`、`/version`、`/skills` 检查能力
- `Chat` 页只会在手动点击 `Send` 后调用 `POST /chat`
- 当前阶段只支持文本聊天
- 不做文件上传
- 不执行真实文件操作

### Chat 页测试提醒

- `Chat` 页可能命中不同 Skill
- 如果输入触发 `DifyEnglishSkill`，可能消耗 Dify 额度
- 测试时优先使用不会触发 Dify 的输入：
  - `hello ai hub`
  - `现在几点了`
  - `随便说句话`
- 不要把 Dify 测试作为默认构建验证

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
