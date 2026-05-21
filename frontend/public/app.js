const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const healthStatus = document.querySelector("#health-status");
const appVersion = document.querySelector("#app-version");
const skillsCount = document.querySelector("#skills-count");
const skillsBody = document.querySelector("#skills-body");

const statusTabButton = document.querySelector("#tab-status");
const chatTabButton = document.querySelector("#tab-chat");
const filesToolsTabButton = document.querySelector("#tab-files-tools");
const statusPanel = document.querySelector("#panel-status");
const chatPanel = document.querySelector("#panel-chat");
const filesToolsPanel = document.querySelector("#panel-files-tools");

const chatMessageInput = document.querySelector("#chat-message");
const sendChatButton = document.querySelector("#send-chat");
const chatStatus = document.querySelector("#chat-status");
const chatMessages = document.querySelector("#chat-messages");

const filesToolsStatus = document.querySelector("#files-tools-status");
const filesToolsGrid = document.querySelector("#files-tools-grid");
const tauriInvoke = window.__TAURI__?.core?.invoke;

const startupCommand =
  "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000";
const backendUnavailableMessage =
  `无法连接后端。这通常是因为 FastAPI 还没有手动启动，不是桌面端坏了。请先在 PowerShell 中运行：${startupCommand}`;
const loadSkillsHint =
  "请先在 Backend Status 页面点击 Check Backend 读取能力列表。这个页面只展示能力和安全边界，不会上传文件，也不会执行文件操作。";

const fileToolsCatalog = [
  {
    displayName: "SafeActionSkill",
    name: "safe_action",
    description:
      "只生成安全操作计划，用于把文件整理意图转成说明，不执行任何真实动作。",
    safetyBoundary:
      "只生成安全操作计划，不执行删除、移动、重命名、复制等真实文件操作。",
    recommendedUse:
      "当你想先确认整理方案、风险点或步骤说明时使用。",
    forbidden: [
      "不执行真实文件操作",
      "不读取真实文件内容",
      "不扫描真实文件系统",
    ],
    example: "帮我整理文件",
  },
  {
    displayName: "FileAnalysisSkill",
    name: "file_analysis",
    description:
      "只根据用户手写的文本描述生成文件分析计划，不会直接读取目标文件。",
    safetyBoundary: "只生成文件分析计划，不读取真实文件。",
    recommendedUse:
      "当用户先提供目标和文件类型，想看分析思路或处理步骤时使用。",
    forbidden: [
      "不打开真实 PDF",
      "不读取 Word、Excel、图片等文件内容",
      "不执行真实文件分析",
    ],
    example: "帮我分析 PDF",
  },
  {
    displayName: "FileInventorySkill",
    name: "file_inventory",
    description:
      "只解析用户手动提供的文件清单文本，并整理出结构化结果。",
    safetyBoundary:
      "只解析用户手动提供的文件清单文本，不扫描真实文件系统。",
    recommendedUse:
      "当用户已经列出文件名、目标和分类想法，想先做文本级整理时使用。",
    forbidden: [
      "不读取真实目录",
      "不自动发现文件",
      "不修改任何文件",
    ],
    example: "文件清单：cet4.pdf，目标：总结重点",
  },
  {
    displayName: "ReadOnlyFileScannerSkill",
    name: "readonly_file_scanner",
    description:
      "设计为只读白名单目录内文件元信息的能力展示，当前页面只展示边界，不触发执行。",
    safetyBoundary:
      "只读白名单目录内文件元信息，不读取文件内容，不递归，不修改文件。",
    recommendedUse:
      "当需要先确认目录可见范围和元信息读取边界时使用。",
    forbidden: [
      "不读取文件正文",
      "不递归扫描子目录",
      "不执行复制、移动、删除、重命名",
    ],
    example: "扫描目录",
  },
  {
    displayName: "ReadOnlyTextPreviewSkill",
    name: "readonly_text_preview",
    description:
      "设计为只读白名单目录内 txt 或 md 小文件预览的能力展示，当前页面只展示边界，不触发执行。",
    safetyBoundary:
      "只读白名单目录内 txt 或 md 小文件预览，默认限制文件大小和预览长度，不读取 PDF、Word、Excel、图片。",
    recommendedUse:
      "当需要向用户解释可预览文件范围和预览限制时使用。",
    forbidden: [
      "不读取 PDF、Word、Excel、图片",
      "不预览超出白名单范围的文件",
      "不修改文件内容",
    ],
    example: "预览文件：data\\scan_sandbox\\a_note.txt",
  },
];

const state = {
  hasCheckedBackend: false,
  skills: [],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setRequestState(type, message) {
  requestStatus.className = `request-status ${type}`;
  requestStatus.textContent = message;
}

function setChatState(type, message) {
  chatStatus.className = `request-status ${type}`;
  chatStatus.textContent = message;
}

function setFilesToolsState(type, message) {
  filesToolsStatus.className = `request-status ${type}`;
  filesToolsStatus.textContent = message;
}

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
}

function resetChatResult() {
  chatMessages.innerHTML =
    '<div class="chat-empty-state">Send a message to start the Echo chat loop.</div>';
}

function renderEmptyRow(message) {
  skillsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function renderSkills(skills) {
  if (!Array.isArray(skills) || skills.length === 0) {
    renderEmptyRow("No skills were returned by the backend");
    return;
  }

  skillsBody.innerHTML = skills
    .map(
      (skill) => `
        <tr>
          <td>${escapeHtml(skill.name)}</td>
          <td>${escapeHtml(skill.description)}</td>
          <td>${escapeHtml(skill.stage)}</td>
          <td>${escapeHtml(skill.safety_level)}</td>
          <td><span class="tag ${skill.executable ? "true" : "false"}">${escapeHtml(skill.executable)}</span></td>
        </tr>
      `
    )
    .join("");
}

function buildToolCard(tool, matchedSkill) {
  const found = Boolean(matchedSkill);
  const stage = found ? matchedSkill.stage : "Not found in /skills";
  const safetyLevel = found ? matchedSkill.safety_level : "Not found in /skills";
  const executableTag = found
    ? `<span class="tag ${matchedSkill.executable ? "true" : "false"}">${escapeHtml(
        matchedSkill.executable
      )}</span>`
    : '<span class="tag warning">Not found</span>';
  const statusText = found
    ? "Loaded from backend /skills metadata."
    : "This skill was not returned by the current backend.";

  return `
    <article class="tool-card ${found ? "" : "missing"}">
      <div class="tool-card-header">
        <div>
          <h3>${escapeHtml(tool.displayName)}</h3>
          <p class="tool-skill-name">skill name: ${escapeHtml(tool.name)}</p>
        </div>
        ${executableTag}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-item">
          <span class="tool-meta-label">stage</span>
          <p class="tool-meta-value">${escapeHtml(stage)}</p>
        </div>
        <div class="tool-meta-item">
          <span class="tool-meta-label">safety_level</span>
          <p class="tool-meta-value">${escapeHtml(safetyLevel)}</p>
        </div>
        <div class="tool-meta-item">
          <span class="tool-meta-label">status</span>
          <p class="tool-meta-value">${escapeHtml(statusText)}</p>
        </div>
      </div>

      <section class="tool-section">
        <h4>能力说明</h4>
        <p>${escapeHtml(found ? matchedSkill.description : tool.description)}</p>
      </section>

      <section class="tool-section">
        <h4>安全边界说明</h4>
        <p>${escapeHtml(tool.safetyBoundary)}</p>
      </section>

      <section class="tool-section">
        <h4>推荐使用场景</h4>
        <p>${escapeHtml(tool.recommendedUse)}</p>
      </section>

      <section class="tool-section">
        <h4>禁止事项</h4>
        <ul class="tool-list">
          ${tool.forbidden.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>

      <section class="tool-section">
        <h4>示例提示词</h4>
        <div class="tool-copy-block">
          <p class="tool-example">${escapeHtml(tool.example)}</p>
          <button class="copy-button" type="button" data-copy-example="${escapeHtml(
            tool.example
          )}">复制示例</button>
        </div>
      </section>
    </article>
  `;
}

function renderFilesTools() {
  if (!state.hasCheckedBackend) {
    filesToolsGrid.innerHTML = "";
    setFilesToolsState("idle", loadSkillsHint);
    return;
  }

  const skillsByName = new Map(state.skills.map((skill) => [skill.name, skill]));

  filesToolsGrid.innerHTML = fileToolsCatalog
    .map((tool) => buildToolCard(tool, skillsByName.get(tool.name)))
    .join("");

  const matchedCount = fileToolsCatalog.filter((tool) =>
    skillsByName.has(tool.name)
  ).length;

  setFilesToolsState(
    matchedCount === fileToolsCatalog.length ? "success" : "idle",
    `已复用 /skills 的 ${matchedCount}/${fileToolsCatalog.length} 个文件相关能力。当前页面只展示能力和安全边界，不会上传文件，也不会执行文件操作。`
  );
}

function showTab(activeTab) {
  const isStatus = activeTab === "status";
  const isChat = activeTab === "chat";
  const isFilesTools = activeTab === "files-tools";

  statusTabButton.classList.toggle("active", isStatus);
  chatTabButton.classList.toggle("active", isChat);
  filesToolsTabButton.classList.toggle("active", isFilesTools);

  statusTabButton.setAttribute("aria-selected", String(isStatus));
  chatTabButton.setAttribute("aria-selected", String(isChat));
  filesToolsTabButton.setAttribute("aria-selected", String(isFilesTools));

  statusPanel.classList.toggle("hidden", !isStatus);
  chatPanel.classList.toggle("hidden", !isChat);
  filesToolsPanel.classList.toggle("hidden", !isFilesTools);
}

async function readJsonResponse(response) {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Proxy returned a non-JSON response");
  }
}

function isTauriRuntime() {
  return typeof tauriInvoke === "function";
}

function normalizeErrorMessage(error, fallbackMessage) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

async function requestMetadata(backendUrl) {
  if (isTauriRuntime()) {
    try {
      return await tauriInvoke("fetch_backend_metadata", { backendUrl });
    } catch (error) {
      const details = normalizeErrorMessage(error, backendUnavailableMessage);
      return {
        ok: false,
        error: details.includes("Backend URL")
          ? details
          : backendUnavailableMessage,
        details,
      };
    }
  }

  const response = await fetch("/api/metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl }),
  });

  return readJsonResponse(response);
}

async function requestChat(backendUrl, message) {
  if (isTauriRuntime()) {
    try {
      return await tauriInvoke("send_chat_message", { backendUrl, message });
    } catch (error) {
      const details = normalizeErrorMessage(error, "Chat request failed");
      const isInputError =
        details.includes("Backend URL") ||
        details.includes("Message cannot be empty");

      return {
        ok: false,
        error: isInputError ? details : "Chat request failed",
        details,
      };
    }
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, message }),
  });

  return readJsonResponse(response);
}

async function checkBackend() {
  const backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setRequestState("idle", "Checking /health, /version, and /skills ...");

  try {
    const payload = await requestMetadata(backendUrl);
    if (!payload.ok) {
      throw new Error(payload.error || payload.details || backendUnavailableMessage);
    }

    const skills = payload.skills.skills || [];
    state.hasCheckedBackend = true;
    state.skills = skills;

    healthStatus.textContent = payload.health.status || "-";
    appVersion.textContent = payload.version.version || "-";
    skillsCount.textContent = String(skills.length || 0);
    renderSkills(skills);
    renderFilesTools();
    setRequestState("success", `Connected: ${payload.backendUrl}`);
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    resetSummary();
    renderEmptyRow(backendUnavailableMessage);
    renderFilesTools();
    setRequestState(
      "error",
      error instanceof Error ? error.message : backendUnavailableMessage
    );
  } finally {
    checkButton.disabled = false;
  }
}

function clearChatEmptyState() {
  const emptyState = chatMessages.querySelector(".chat-empty-state");
  if (emptyState) {
    emptyState.remove();
  }
}

function appendChatMessage(role, content, metadata = "") {
  clearChatEmptyState();

  const messageItem = document.createElement("article");
  messageItem.className = `chat-message ${role}`;

  const label = document.createElement("div");
  label.className = "chat-message-label";
  label.textContent = role === "user" ? "You" : "AI Hub";

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble";
  bubble.textContent = content || "-";

  messageItem.append(label, bubble);

  if (metadata) {
    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = metadata;
    messageItem.append(meta);
  }

  chatMessages.append(messageItem);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderChatResult(payload) {
  const skill = payload.skill || "-";
  const status = payload.status || "-";
  appendChatMessage(
    "assistant",
    payload.reply || "-",
    `skill: ${skill} | status: ${status}`
  );
}

function renderChatError(message) {
  appendChatMessage("assistant", message, "status: error");
}

function setChatSending(isSending) {
  sendChatButton.disabled = isSending;
}

async function sendChat() {
  const backendUrl = backendUrlInput.value.trim();
  const message = chatMessageInput.value.trim();

  if (!message) {
    setChatState("error", "Message cannot be empty");
    return;
  }

  appendChatMessage("user", message);
  chatMessageInput.value = "";
  setChatSending(true);
  setChatState("idle", "Sending /chat request ...");

  try {
    const payload = await requestChat(backendUrl, message);
    if (!payload.ok) {
      throw new Error(payload.details || payload.error || "Chat request failed");
    }

    renderChatResult(payload.chat);
    setChatState("success", `Chat response received from ${payload.backendUrl}`);
  } catch (error) {
    renderChatError(
      error instanceof Error ? error.message : "Chat request failed"
    );
    setChatState(
      "error",
      error instanceof Error ? error.message : "Chat request failed"
    );
  } finally {
    setChatSending(false);
  }
}

async function copyExample(example) {
  if (!navigator.clipboard?.writeText) {
    setFilesToolsState("error", "当前环境不支持剪贴板复制，请手动复制示例文本。");
    return;
  }

  try {
    await navigator.clipboard.writeText(example);
    setFilesToolsState(
      "success",
      `示例已复制：${example}。复制不会自动发送，也不会执行任何文件操作。`
    );
  } catch {
    setFilesToolsState("error", "复制失败，请手动复制示例文本。");
  }
}

statusTabButton.addEventListener("click", () => showTab("status"));
chatTabButton.addEventListener("click", () => showTab("chat"));
filesToolsTabButton.addEventListener("click", () => showTab("files-tools"));
checkButton.addEventListener("click", checkBackend);
sendChatButton.addEventListener("click", sendChat);
filesToolsGrid.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const example = target.dataset.copyExample;
  if (target.matches(".copy-button") && example) {
    void copyExample(example);
  }
});

renderFilesTools();
