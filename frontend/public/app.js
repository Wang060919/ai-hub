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
const filePreviewPathInput = document.querySelector("#file-preview-path");
const readFilePreviewButton = document.querySelector("#read-file-preview");
const summarizeFilePreviewButton = document.querySelector("#summarize-file-preview");
const filePreviewStatus = document.querySelector("#file-preview-status");
const filePreviewResult = document.querySelector("#file-preview-result");
const fileSummaryStatus = document.querySelector("#file-summary-status");
const fileSummaryResult = document.querySelector("#file-summary-result");
const refreshKnowledgeStatusButton = document.querySelector("#refresh-knowledge-status");
const knowledgeStatusMessage = document.querySelector("#knowledge-status-message");
const knowledgeStatusResult = document.querySelector("#knowledge-status-result");
const knowledgeIndexPathInput = document.querySelector("#knowledge-index-path");
const knowledgeIndexKbIdInput = document.querySelector("#knowledge-index-kb-id");
const knowledgeIndexSubmitButton = document.querySelector("#knowledge-index-submit");
const knowledgeIndexStatus = document.querySelector("#knowledge-index-status");
const knowledgeIndexResult = document.querySelector("#knowledge-index-result");
const knowledgeSearchQueryInput = document.querySelector("#knowledge-search-query");
const knowledgeSearchKbIdInput = document.querySelector("#knowledge-search-kb-id");
const knowledgeSearchTopKInput = document.querySelector("#knowledge-search-top-k");
const knowledgeSearchSubmitButton = document.querySelector("#knowledge-search-submit");
const knowledgeSearchStatus = document.querySelector("#knowledge-search-status");
const knowledgeSearchResult = document.querySelector("#knowledge-search-result");
const knowledgeQueryQuestionInput = document.querySelector("#knowledge-query-question");
const knowledgeQueryKbIdInput = document.querySelector("#knowledge-query-kb-id");
const knowledgeQueryTopKInput = document.querySelector("#knowledge-query-top-k");
const knowledgeQuerySubmitButton = document.querySelector("#knowledge-query-submit");
const knowledgeQueryStatus = document.querySelector("#knowledge-query-status");
const knowledgeQueryResult = document.querySelector("#knowledge-query-result");
const tauriInvoke = window.__TAURI__?.core?.invoke;
const MAX_CHAT_HISTORY_TURNS = 4;
const MAX_CHAT_HISTORY_MESSAGES = MAX_CHAT_HISTORY_TURNS * 2;
const MAX_CHAT_CONTEXT_MESSAGES = MAX_CHAT_HISTORY_MESSAGES + 1;
const MAX_CHAT_MESSAGE_CHARS = 1500;
const MAX_CHAT_CONTEXT_CHARS = 8000;

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
  chatSending: false,
  filePreviewLoading: false,
  fileSummaryLoading: false,
  knowledgeStatusLoading: false,
  knowledgeIndexLoading: false,
  knowledgeSearchLoading: false,
  knowledgeQueryLoading: false,
  hasPreviewResult: false,
  chatHistory: [],
  lastPreviewPath: "",
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

function setFilePreviewState(type, message) {
  filePreviewStatus.className = `request-status ${type}`;
  filePreviewStatus.textContent = message;
}

function setFileSummaryState(type, message) {
  fileSummaryStatus.className = `request-status ${type}`;
  fileSummaryStatus.textContent = message;
}

function setKnowledgeStatusState(type, message) {
  knowledgeStatusMessage.className = `request-status ${type}`;
  knowledgeStatusMessage.textContent = message;
}

function setKnowledgeIndexState(type, message) {
  knowledgeIndexStatus.className = `request-status ${type}`;
  knowledgeIndexStatus.textContent = message;
}

function setKnowledgeSearchState(type, message) {
  knowledgeSearchStatus.className = `request-status ${type}`;
  knowledgeSearchStatus.textContent = message;
}

function setKnowledgeQueryState(type, message) {
  knowledgeQueryStatus.className = `request-status ${type}`;
  knowledgeQueryStatus.textContent = message;
}

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
}

function resetFileSummaryResult() {
  state.fileSummaryLoading = false;
  state.hasPreviewResult = false;
  state.lastPreviewPath = "";
  fileSummaryResult.classList.add("hidden");
  fileSummaryResult.innerHTML = "";
  setFileSummaryState(
    "idle",
    "Summary is available only after preview succeeds and only when you click the button."
  );
}

function resetChatResult() {
  chatMessages.innerHTML =
    '<div class="chat-empty-state">Send a message to start the Echo chat loop.</div>';
  state.chatHistory = [];
}

function normalizeChatContent(content) {
  return String(content || "").trim().slice(0, MAX_CHAT_MESSAGE_CHARS);
}

function trimChatMessages(messages, maxMessages) {
  const normalizedMessages = messages
    .map((message) => ({
      role: message.role,
      content: normalizeChatContent(message.content),
    }))
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content
    )
    .slice(-maxMessages);

  const trimmedMessages = [];
  let totalChars = 0;

  for (let index = normalizedMessages.length - 1; index >= 0; index -= 1) {
    const message = normalizedMessages[index];
    const nextTotal = totalChars + message.content.length;
    if (nextTotal > MAX_CHAT_CONTEXT_CHARS && trimmedMessages.length > 0) {
      break;
    }

    trimmedMessages.unshift(message);
    totalChars = nextTotal;
  }

  return trimmedMessages;
}

function isMarkdownFence(line) {
  return line.trim().startsWith("```");
}

function matchUnorderedListItem(line) {
  return line.match(/^\s*[-*]\s+(.+)$/);
}

function matchOrderedListItem(line) {
  return line.match(/^\s*\d+\.\s+(.+)$/);
}

function appendPlainText(parent, text) {
  if (text) {
    parent.append(document.createTextNode(text));
  }
}

function appendInlineMarkdown(parent, text, options = {}) {
  const allowBold = options.allowBold !== false;
  let index = 0;

  while (index < text.length) {
    const nextCode = text.indexOf("`", index);
    const nextBold = allowBold ? text.indexOf("**", index) : -1;
    const hasCode = nextCode !== -1;
    const hasBold = nextBold !== -1;

    if (!hasCode && !hasBold) {
      appendPlainText(parent, text.slice(index));
      return;
    }

    const useCode = hasCode && (!hasBold || nextCode < nextBold);
    const tokenIndex = useCode ? nextCode : nextBold;
    appendPlainText(parent, text.slice(index, tokenIndex));

    if (useCode) {
      const endCode = text.indexOf("`", tokenIndex + 1);
      if (endCode === -1) {
        appendPlainText(parent, text.slice(tokenIndex));
        return;
      }

      const code = document.createElement("code");
      code.className = "markdown-inline-code";
      code.textContent = text.slice(tokenIndex + 1, endCode);
      parent.append(code);
      index = endCode + 1;
      continue;
    }

    const endBold = text.indexOf("**", tokenIndex + 2);
    if (endBold === -1) {
      appendPlainText(parent, text.slice(tokenIndex));
      return;
    }

    const strong = document.createElement("strong");
    appendInlineMarkdown(strong, text.slice(tokenIndex + 2, endBold), {
      allowBold: false,
    });
    parent.append(strong);
    index = endBold + 2;
  }
}

function appendParagraph(container, lines) {
  const paragraph = document.createElement("p");
  lines.forEach((line, index) => {
    if (index > 0) {
      paragraph.append(document.createElement("br"));
    }
    appendInlineMarkdown(paragraph, line);
  });
  container.append(paragraph);
}

function appendList(container, lines, startIndex, ordered) {
  const list = document.createElement(ordered ? "ol" : "ul");
  let index = startIndex;

  while (index < lines.length) {
    const match = ordered
      ? matchOrderedListItem(lines[index])
      : matchUnorderedListItem(lines[index]);

    if (!match) {
      break;
    }

    const item = document.createElement("li");
    appendInlineMarkdown(item, match[1]);
    list.append(item);
    index += 1;
  }

  container.append(list);
  return index;
}

function appendCodeBlock(container, codeLines) {
  const pre = document.createElement("pre");
  pre.className = "markdown-code-block";

  const code = document.createElement("code");
  code.textContent = codeLines.join("\n");

  pre.append(code);
  container.append(pre);
}

function renderAssistantMessageContent(container, content) {
  const rawContent = String(content || "");
  const normalizedContent = rawContent.trim() ? rawContent : "-";
  const lines = normalizedContent.replaceAll("\r\n", "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isMarkdownFence(line)) {
      const codeLines = [];
      index += 1;

      while (index < lines.length && !isMarkdownFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && isMarkdownFence(lines[index])) {
        index += 1;
      }

      appendCodeBlock(container, codeLines);
      continue;
    }

    if (matchUnorderedListItem(line)) {
      index = appendList(container, lines, index, false);
      continue;
    }

    if (matchOrderedListItem(line)) {
      index = appendList(container, lines, index, true);
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownFence(lines[index]) &&
      !matchUnorderedListItem(lines[index]) &&
      !matchOrderedListItem(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    appendParagraph(container, paragraphLines);
  }
}

function buildChatContextMessages(currentMessage) {
  return trimChatMessages(
    [
      ...state.chatHistory,
      {
        role: "user",
        content: currentMessage,
      },
    ],
    MAX_CHAT_CONTEXT_MESSAGES
  );
}

function recordSuccessfulChatTurn(userMessage, assistantMessage) {
  state.chatHistory = trimChatMessages(
    [
      ...state.chatHistory,
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: assistantMessage,
      },
    ],
    MAX_CHAT_HISTORY_MESSAGES
  );
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

async function requestChat(backendUrl, message, messages = []) {
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
    body: JSON.stringify({ backendUrl, message, messages }),
  });

  return readJsonResponse(response);
}

async function requestFilePreview(backendUrl, path) {
  const response = await fetch("/api/files/preview", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code =
      payload?.error?.code ||
      payload?.preview?.error?.code ||
      `HTTP_${response.status}`;
    const message =
      payload?.error?.message ||
      payload?.preview?.error?.message ||
      `${code}: /files/preview failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload.preview;
}

async function requestFileSummary(backendUrl, path) {
  const response = await fetch("/api/files/summarize", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code =
      payload?.error?.code ||
      payload?.summary?.error?.code ||
      `HTTP_${response.status}`;
    const message =
      payload?.error?.message ||
      payload?.summary?.error?.message ||
      `${code}: /api/files/summarize failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload.summary;
}

async function requestKnowledgeStatus(backendUrl) {
  const response = await fetch(
    `/api/knowledge/status?backendUrl=${encodeURIComponent(backendUrl)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code = payload?.error?.code || `HTTP_${response.status}`;
    const message =
      payload?.error?.message || payload?.details || `${code}: /api/knowledge/status failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload.knowledge;
}

async function requestKnowledgeIndexFile(backendUrl, path, kbId) {
  const response = await fetch("/api/knowledge/index-file", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path, kb_id: kbId }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code =
      payload?.error?.code ||
      payload?.index?.error?.code ||
      `HTTP_${response.status}`;
    const message =
      payload?.error?.message ||
      payload?.index?.error?.message ||
      `${code}: /api/knowledge/index-file failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload;
}

async function requestKnowledgeSearch(backendUrl, query, kbId, topK) {
  const response = await fetch("/api/knowledge/search", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, query, kb_id: kbId, top_k: topK }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code =
      payload?.error?.code ||
      payload?.search?.error?.code ||
      `HTTP_${response.status}`;
    const message =
      payload?.error?.message ||
      payload?.search?.error?.message ||
      `${code}: /api/knowledge/search failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload;
}

async function requestKnowledgeQuery(backendUrl, question, kbId, topK) {
  const response = await fetch("/api/knowledge/query", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, question, kb_id: kbId, top_k: topK }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    const code =
      payload?.error?.code ||
      payload?.answer?.error?.code ||
      `HTTP_${response.status}`;
    const message =
      payload?.error?.message ||
      payload?.answer?.error?.message ||
      `${code}: /api/knowledge/query failed`;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  return payload;
}

function renderFilePreview(payload) {
  const file = payload.file || {};
  const preview = payload.preview || {};
  const truncated = preview.truncated ? "true" : "false";

  filePreviewResult.classList.remove("hidden");
  filePreviewResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>name</span>
        <strong>${escapeHtml(file.name || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>suffix</span>
        <strong>${escapeHtml(file.suffix || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>size_human</span>
        <strong>${escapeHtml(file.size_human || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>modified_at</span>
        <strong>${escapeHtml(file.modified_at || "-")}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>truncated</span>
        <strong>${truncated}</strong>
      </div>
    </div>
    <pre class="file-preview-text"><code>${escapeHtml(preview.text || "")}</code></pre>
  `;
}

function renderFileSummary(payload) {
  const file = payload.file || {};
  const summary = payload.summary || {};
  const truncated = summary.truncated ? "true" : "false";

  fileSummaryResult.classList.remove("hidden");
  fileSummaryResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>model</span>
        <strong>${escapeHtml(summary.model || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>input_chars</span>
        <strong>${escapeHtml(summary.input_chars ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>source_chars</span>
        <strong>${escapeHtml(summary.source_chars ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>truncated</span>
        <strong>${truncated}</strong>
      </div>
    </div>
    <div class="file-summary-text">${escapeHtml(summary.text || "")}</div>
  `;
}

function renderFilePreviewError(error) {
  const code = error?.code || "REQUEST_FAILED";
  const message = error instanceof Error ? error.message : "File preview failed";

  filePreviewResult.classList.remove("hidden");
  filePreviewResult.innerHTML = `
    <div class="file-preview-error">
      <strong>${escapeHtml(code)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function renderFileSummaryError(error) {
  const code = error?.code || "REQUEST_FAILED";
  const message = error instanceof Error ? error.message : "File summary failed";

  fileSummaryResult.classList.remove("hidden");
  fileSummaryResult.innerHTML = `
    <div class="file-preview-error">
      <strong>${escapeHtml(code)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function renderKnowledgeError(container, error) {
  const code = error?.code || "REQUEST_FAILED";
  const message = error instanceof Error ? error.message : "Knowledge request failed";

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="file-preview-error">
      <strong>${escapeHtml(code)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function renderKnowledgeStatus(payload) {
  const knowledge = payload || {};

  knowledgeStatusResult.classList.remove("hidden");
  knowledgeStatusResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>files_count</span>
        <strong>${escapeHtml(knowledge.files_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>chunks_count</span>
        <strong>${escapeHtml(knowledge.chunks_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(knowledge.index_method || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>fts_enabled</span>
        <strong>${escapeHtml(String(Boolean(knowledge.fts_enabled)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>fts_available</span>
        <strong>${escapeHtml(String(Boolean(knowledge.fts_available)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>enabled</span>
        <strong>${escapeHtml(String(Boolean(knowledge.enabled)))}</strong>
      </div>
    </div>
  `;
}

function renderKnowledgeIndexResult(payload) {
  const file = payload?.file || {};
  const index = payload?.index || {};

  knowledgeIndexResult.classList.remove("hidden");
  knowledgeIndexResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>chunk_count</span>
        <strong>${escapeHtml(index.chunk_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>reused_existing</span>
        <strong>${escapeHtml(String(Boolean(index.reused_existing)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>replaced_existing</span>
        <strong>${escapeHtml(String(Boolean(index.replaced_existing)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(index.index_method || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>kb_id</span>
        <strong>${escapeHtml(file.kb_id || "-")}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
    </div>
  `;
}

function renderKnowledgeHits(hits) {
  if (!Array.isArray(hits) || hits.length === 0) {
    return `<div class="file-summary-text">hits=[]</div>`;
  }

  return `
    <ol class="knowledge-hit-list">
      ${hits
        .map(
          (hit) => `
            <li class="knowledge-hit-card">
              <strong>${escapeHtml(hit.relative_path || "-")}</strong>
              <p class="knowledge-hit-meta">
                chunk_index=${escapeHtml(hit.chunk_index ?? "-")} | score=${escapeHtml(
                  hit.score ?? "-"
                )}
              </p>
              <pre class="knowledge-hit-content">${escapeHtml(hit.content || "")}</pre>
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

function renderKnowledgeSearchResult(payload) {
  const search = payload?.search || {};

  knowledgeSearchResult.classList.remove("hidden");
  knowledgeSearchResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>query</span>
        <strong>${escapeHtml(search.query || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>top_k</span>
        <strong>${escapeHtml(search.top_k ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>hits_count</span>
        <strong>${escapeHtml(search.hits_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>kb_id</span>
        <strong>${escapeHtml(search.kb_id || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(search.index_method || "-")}</strong>
      </div>
    </div>
    ${renderKnowledgeHits(payload?.hits)}
  `;
}

function renderKnowledgeQueryResult(payload) {
  const answer = payload?.answer || {};
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];

  knowledgeQueryResult.classList.remove("hidden");
  knowledgeQueryResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>model</span>
        <strong>${escapeHtml(answer.model || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>grounded</span>
        <strong>${escapeHtml(String(Boolean(answer.grounded)))}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>answer.text</span>
        <strong class="knowledge-answer-text">${escapeHtml(answer.text || "")}</strong>
      </div>
    </div>
    <div class="summary-result-panel">
      <div>
        <p class="field-label">citations</p>
        ${
          citations.length === 0
            ? '<div class="file-summary-text">citations=[]</div>'
            : `
              <ol class="knowledge-citation-list">
                ${citations
                  .map(
                    (citation) => `
                      <li class="knowledge-citation-card">
                        <strong>[${escapeHtml(citation.index ?? "-")}] ${escapeHtml(
                          citation.relative_path || "-"
                        )}</strong>
                        <p class="knowledge-citation-meta">
                          chunk_id=${escapeHtml(citation.chunk_id ?? "-")} | chunk_index=${escapeHtml(
                            citation.chunk_index ?? "-"
                          )}
                        </p>
                      </li>
                    `
                  )
                  .join("")}
              </ol>
            `
        }
      </div>
      <div>
        <p class="field-label">hits</p>
        ${renderKnowledgeHits(payload?.hits)}
      </div>
    </div>
  `;
}

function normalizeTopK(input, fallback = 4) {
  const value = Number(input?.value);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

function updateFilePreviewButtonState() {
  const hasPath = Boolean(filePreviewPathInput.value.trim());
  readFilePreviewButton.disabled = state.filePreviewLoading || !hasPath;
  summarizeFilePreviewButton.disabled =
    state.filePreviewLoading ||
    state.fileSummaryLoading ||
    !hasPath ||
    !state.hasPreviewResult ||
    state.lastPreviewPath !== filePreviewPathInput.value.trim();
}

function setFilePreviewLoading(isLoading) {
  state.filePreviewLoading = isLoading;
  readFilePreviewButton.classList.toggle("sending", isLoading);
  readFilePreviewButton.textContent = isLoading ? "读取中..." : "读取预览";
  updateFilePreviewButtonState();
}

function setFileSummaryLoading(isLoading) {
  state.fileSummaryLoading = isLoading;
  summarizeFilePreviewButton.classList.toggle("sending", isLoading);
  summarizeFilePreviewButton.textContent = isLoading ? "总结中..." : "生成总结";
  updateFilePreviewButtonState();
}

function handleFilePreviewPathInput() {
  if (state.lastPreviewPath && state.lastPreviewPath !== filePreviewPathInput.value.trim()) {
    resetFileSummaryResult();
  }
  updateFilePreviewButtonState();
}

function updateKnowledgeButtonState() {
  refreshKnowledgeStatusButton.disabled = state.knowledgeStatusLoading;
  knowledgeIndexSubmitButton.disabled =
    state.knowledgeIndexLoading || !knowledgeIndexPathInput.value.trim();
  knowledgeSearchSubmitButton.disabled =
    state.knowledgeSearchLoading || !knowledgeSearchQueryInput.value.trim();
  knowledgeQuerySubmitButton.disabled =
    state.knowledgeQueryLoading || !knowledgeQueryQuestionInput.value.trim();
}

function setKnowledgeStatusLoading(isLoading) {
  state.knowledgeStatusLoading = isLoading;
  refreshKnowledgeStatusButton.classList.toggle("sending", isLoading);
  refreshKnowledgeStatusButton.textContent = isLoading
    ? "Refreshing..."
    : "Refresh Knowledge Status";
  updateKnowledgeButtonState();
}

function setKnowledgeIndexLoading(isLoading) {
  state.knowledgeIndexLoading = isLoading;
  knowledgeIndexSubmitButton.classList.toggle("sending", isLoading);
  knowledgeIndexSubmitButton.textContent = isLoading ? "Adding..." : "Add To Knowledge";
  updateKnowledgeButtonState();
}

function setKnowledgeSearchLoading(isLoading) {
  state.knowledgeSearchLoading = isLoading;
  knowledgeSearchSubmitButton.classList.toggle("sending", isLoading);
  knowledgeSearchSubmitButton.textContent = isLoading ? "Searching..." : "Search Knowledge";
  updateKnowledgeButtonState();
}

function setKnowledgeQueryLoading(isLoading) {
  state.knowledgeQueryLoading = isLoading;
  knowledgeQuerySubmitButton.classList.toggle("sending", isLoading);
  knowledgeQuerySubmitButton.textContent = isLoading ? "Asking..." : "Ask Knowledge";
  updateKnowledgeButtonState();
}

async function readFilePreview() {
  if (state.filePreviewLoading) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const path = filePreviewPathInput.value.trim();

  if (!path) {
    setFilePreviewState("error", "File path cannot be empty");
    updateFilePreviewButtonState();
    return;
  }

  setFilePreviewLoading(true);
  state.hasPreviewResult = false;
  state.lastPreviewPath = "";
  filePreviewResult.classList.add("hidden");
  filePreviewResult.innerHTML = "";
  resetFileSummaryResult();
  setFilePreviewState("idle", "Reading /files/preview ...");

  try {
    const payload = await requestFilePreview(backendUrl, path);
    renderFilePreview(payload);
    state.hasPreviewResult = true;
    state.lastPreviewPath = path;
    setFilePreviewState("success", "Preview loaded from /files/preview");
  } catch (error) {
    renderFilePreviewError(error);
    const code = error?.code ? `${error.code}: ` : "";
    setFilePreviewState(
      "error",
      `${code}${error instanceof Error ? error.message : "File preview failed"}`
    );
  } finally {
    setFilePreviewLoading(false);
  }
}

async function summarizeFilePreview() {
  if (state.fileSummaryLoading || summarizeFilePreviewButton.disabled) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const path = filePreviewPathInput.value.trim();

  if (!state.hasPreviewResult || state.lastPreviewPath !== path) {
    setFileSummaryState(
      "error",
      "Please load a preview for the current path before summarizing."
    );
    updateFilePreviewButtonState();
    return;
  }

  setFileSummaryLoading(true);
  fileSummaryResult.classList.add("hidden");
  fileSummaryResult.innerHTML = "";
  setFileSummaryState("idle", "Sending /api/files/summarize ...");

  try {
    const payload = await requestFileSummary(backendUrl, path);
    renderFileSummary(payload);
    setFileSummaryState("success", "Summary loaded from /api/files/summarize");
  } catch (error) {
    renderFileSummaryError(error);
    const code = error?.code ? `${error.code}: ` : "";
    setFileSummaryState(
      "error",
      `${code}${error instanceof Error ? error.message : "File summary failed"}`
    );
  } finally {
    setFileSummaryLoading(false);
  }
}

async function refreshKnowledgeStatus() {
  if (state.knowledgeStatusLoading) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  setKnowledgeStatusLoading(true);
  knowledgeStatusResult.classList.add("hidden");
  knowledgeStatusResult.innerHTML = "";
  setKnowledgeStatusState("idle", "Loading /api/knowledge/status ...");

  try {
    const payload = await requestKnowledgeStatus(backendUrl);
    renderKnowledgeStatus(payload);
    setKnowledgeStatusState("success", "Knowledge status loaded from /api/knowledge/status");
  } catch (error) {
    renderKnowledgeError(knowledgeStatusResult, error);
    const code = error?.code ? `${error.code}: ` : "";
    setKnowledgeStatusState(
      "error",
      `${code}${error instanceof Error ? error.message : "Knowledge status failed"}`
    );
  } finally {
    setKnowledgeStatusLoading(false);
  }
}

async function addToKnowledge() {
  if (state.knowledgeIndexLoading || knowledgeIndexSubmitButton.disabled) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const path = knowledgeIndexPathInput.value.trim();
  const kbId = knowledgeIndexKbIdInput.value.trim() || "default";

  if (!path) {
    setKnowledgeIndexState("error", "File path cannot be empty");
    updateKnowledgeButtonState();
    return;
  }

  setKnowledgeIndexLoading(true);
  knowledgeIndexResult.classList.add("hidden");
  knowledgeIndexResult.innerHTML = "";
  setKnowledgeIndexState("idle", "Sending /api/knowledge/index-file ...");

  try {
    const payload = await requestKnowledgeIndexFile(backendUrl, path, kbId);
    renderKnowledgeIndexResult(payload);
    setKnowledgeIndexState("success", "Knowledge file indexed via /api/knowledge/index-file");
    void refreshKnowledgeStatus();
  } catch (error) {
    renderKnowledgeError(knowledgeIndexResult, error);
    const code = error?.code ? `${error.code}: ` : "";
    setKnowledgeIndexState(
      "error",
      `${code}${error instanceof Error ? error.message : "Knowledge index failed"}`
    );
  } finally {
    setKnowledgeIndexLoading(false);
  }
}

async function searchKnowledge() {
  if (state.knowledgeSearchLoading || knowledgeSearchSubmitButton.disabled) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const query = knowledgeSearchQueryInput.value.trim();
  const kbId = knowledgeSearchKbIdInput.value.trim() || "default";
  const topK = normalizeTopK(knowledgeSearchTopKInput);

  if (!query) {
    setKnowledgeSearchState("error", "Query cannot be empty");
    updateKnowledgeButtonState();
    return;
  }

  setKnowledgeSearchLoading(true);
  knowledgeSearchResult.classList.add("hidden");
  knowledgeSearchResult.innerHTML = "";
  setKnowledgeSearchState("idle", "Sending /api/knowledge/search ...");

  try {
    const payload = await requestKnowledgeSearch(backendUrl, query, kbId, topK);
    renderKnowledgeSearchResult(payload);
    setKnowledgeSearchState("success", "Knowledge hits loaded from /api/knowledge/search");
  } catch (error) {
    renderKnowledgeError(knowledgeSearchResult, error);
    const code = error?.code ? `${error.code}: ` : "";
    setKnowledgeSearchState(
      "error",
      `${code}${error instanceof Error ? error.message : "Knowledge search failed"}`
    );
  } finally {
    setKnowledgeSearchLoading(false);
  }
}

async function queryKnowledge() {
  if (state.knowledgeQueryLoading || knowledgeQuerySubmitButton.disabled) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const question = knowledgeQueryQuestionInput.value.trim();
  const kbId = knowledgeQueryKbIdInput.value.trim() || "default";
  const topK = normalizeTopK(knowledgeQueryTopKInput);

  if (!question) {
    setKnowledgeQueryState("error", "Question cannot be empty");
    updateKnowledgeButtonState();
    return;
  }

  setKnowledgeQueryLoading(true);
  knowledgeQueryResult.classList.add("hidden");
  knowledgeQueryResult.innerHTML = "";
  setKnowledgeQueryState("idle", "Sending /api/knowledge/query ...");

  try {
    const payload = await requestKnowledgeQuery(backendUrl, question, kbId, topK);
    renderKnowledgeQueryResult(payload);
    setKnowledgeQueryState("success", "Knowledge answer loaded from /api/knowledge/query");
  } catch (error) {
    renderKnowledgeError(knowledgeQueryResult, error);
    if (error?.code === "KNOWLEDGE_MODEL_DISABLED") {
      setKnowledgeQueryState(
        "error",
        "KNOWLEDGE_MODEL_DISABLED: DeepSeek is not enabled in the backend environment."
      );
    } else {
      const code = error?.code ? `${error.code}: ` : "";
      setKnowledgeQueryState(
        "error",
        `${code}${error instanceof Error ? error.message : "Knowledge query failed"}`
      );
    }
  } finally {
    setKnowledgeQueryLoading(false);
  }
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
    void refreshKnowledgeStatus();
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    resetSummary();
    renderEmptyRow(backendUnavailableMessage);
    renderFilesTools();
    knowledgeStatusResult.classList.add("hidden");
    knowledgeStatusResult.innerHTML = "";
    setKnowledgeStatusState("error", "Knowledge status unavailable until backend is reachable.");
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

function appendChatMessage(role, content, metadata = "", options = {}) {
  clearChatEmptyState();

  const messageItem = document.createElement("article");
  messageItem.className = `chat-message ${role}`;
  if (options.loading) {
    messageItem.classList.add("loading");
  }

  const label = document.createElement("div");
  label.className = "chat-message-label";
  label.textContent = role === "user" ? "You" : "AI Hub";

  const bubble = document.createElement("div");
  bubble.className = "chat-message-bubble";
  if (role === "assistant") {
    bubble.classList.add("markdown-content");
    renderAssistantMessageContent(bubble, content || "-");
  } else {
    bubble.textContent = content || "-";
  }

  messageItem.append(label, bubble);

  if (metadata) {
    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = metadata;
    messageItem.append(meta);
  }

  chatMessages.append(messageItem);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageItem;
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

function renderChatLoading() {
  return appendChatMessage("assistant", "Waiting for /chat response ...", "status: sending", {
    loading: true,
  });
}

function removeChatLoading(loadingMessage) {
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

function updateSendChatButtonState() {
  const hasMessage = Boolean(chatMessageInput.value.trim());
  sendChatButton.disabled = state.chatSending || !hasMessage;
}

function setChatSending(isSending) {
  state.chatSending = isSending;
  sendChatButton.classList.toggle("sending", isSending);
  updateSendChatButtonState();
}

function handleChatInputKeydown(event) {
  if (event.isComposing) {
    return;
  }

  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  if (!sendChatButton.disabled) {
    void sendChat();
  }
}

async function sendChat() {
  if (state.chatSending) {
    return;
  }

  const backendUrl = backendUrlInput.value.trim();
  const message = chatMessageInput.value.trim();

  if (!message) {
    setChatState("error", "Message cannot be empty");
    updateSendChatButtonState();
    return;
  }

  appendChatMessage("user", message);
  const contextMessages = buildChatContextMessages(message);
  chatMessageInput.value = "";
  updateSendChatButtonState();
  setChatSending(true);
  setChatState("idle", "Sending /chat request ...");
  const loadingMessage = renderChatLoading();

  try {
    const payload = await requestChat(backendUrl, message, contextMessages);
    if (!payload.ok) {
      throw new Error(payload.details || payload.error || "Chat request failed");
    }

    removeChatLoading(loadingMessage);
    renderChatResult(payload.chat);
    if (payload.chat?.status === "success") {
      recordSuccessfulChatTurn(message, payload.chat.reply || "");
    }
    setChatState("success", `Chat response received from ${payload.backendUrl}`);
  } catch (error) {
    removeChatLoading(loadingMessage);
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
chatMessageInput.addEventListener("input", updateSendChatButtonState);
chatMessageInput.addEventListener("keydown", handleChatInputKeydown);
readFilePreviewButton.addEventListener("click", readFilePreview);
summarizeFilePreviewButton.addEventListener("click", summarizeFilePreview);
filePreviewPathInput.addEventListener("input", handleFilePreviewPathInput);
refreshKnowledgeStatusButton.addEventListener("click", refreshKnowledgeStatus);
knowledgeIndexSubmitButton.addEventListener("click", addToKnowledge);
knowledgeSearchSubmitButton.addEventListener("click", searchKnowledge);
knowledgeQuerySubmitButton.addEventListener("click", queryKnowledge);
knowledgeIndexPathInput.addEventListener("input", updateKnowledgeButtonState);
knowledgeSearchQueryInput.addEventListener("input", updateKnowledgeButtonState);
knowledgeQueryQuestionInput.addEventListener("input", updateKnowledgeButtonState);
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
resetFileSummaryResult();
updateSendChatButtonState();
updateFilePreviewButtonState();
updateKnowledgeButtonState();
void refreshKnowledgeStatus();
