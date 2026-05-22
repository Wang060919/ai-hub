import { escapeHtml } from "./js/core/utils.js";
import { requestMetadata } from "./js/api/metadata.js";
import { requestChat } from "./js/api/chat.js";
import { createFilesModule } from "./js/files/files.js";
import { createKnowledgeModule } from "./js/knowledge/knowledge.js";
import { setTextStatus } from "./js/ui/status.js";
import { setButtonLoading } from "./js/ui/loading.js";
import { renderErrorBox } from "./js/ui/error.js";

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

const {
  updateKnowledgeButtonState,
  refreshKnowledgeStatus,
  addToKnowledge,
  searchKnowledge,
  queryKnowledge,
} = createKnowledgeModule({
  dom: {
    backendUrlInput,
    refreshKnowledgeStatusButton,
    knowledgeStatusMessage,
    knowledgeStatusResult,
    knowledgeIndexPathInput,
    knowledgeIndexKbIdInput,
    knowledgeIndexSubmitButton,
    knowledgeIndexStatus,
    knowledgeIndexResult,
    knowledgeSearchQueryInput,
    knowledgeSearchKbIdInput,
    knowledgeSearchTopKInput,
    knowledgeSearchSubmitButton,
    knowledgeSearchStatus,
    knowledgeSearchResult,
    knowledgeQueryQuestionInput,
    knowledgeQueryKbIdInput,
    knowledgeQueryTopKInput,
    knowledgeQuerySubmitButton,
    knowledgeQueryStatus,
    knowledgeQueryResult,
  },
  state,
});

const {
  updateFilePreviewButtonState,
  readFilePreview,
  summarizeFilePreview,
  resetFileSummaryResult,
  handleFilePreviewPathInput,
} = createFilesModule({
  dom: {
    backendUrlInput,
    filePreviewPathInput,
    readFilePreviewButton,
    summarizeFilePreviewButton,
    filePreviewStatus,
    filePreviewResult,
    fileSummaryStatus,
    fileSummaryResult,
  },
  state,
});

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
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
    setTextStatus(filesToolsStatus, loadSkillsHint, "idle");
    return;
  }

  const skillsByName = new Map(state.skills.map((skill) => [skill.name, skill]));

  filesToolsGrid.innerHTML = fileToolsCatalog
    .map((tool) => buildToolCard(tool, skillsByName.get(tool.name)))
    .join("");

  const matchedCount = fileToolsCatalog.filter((tool) =>
    skillsByName.has(tool.name)
  ).length;

  setTextStatus(
    filesToolsStatus,
    `已复用 /skills 的 ${matchedCount}/${fileToolsCatalog.length} 个文件相关能力。当前页面只展示能力和安全边界，不会上传文件，也不会执行文件操作。`,
    matchedCount === fileToolsCatalog.length ? "success" : "idle"
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

async function checkBackend() {
  const backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setTextStatus(requestStatus, "Checking /health, /version, and /skills ...", "idle");

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
    setTextStatus(requestStatus, `Connected: ${payload.backendUrl}`, "success");
    void refreshKnowledgeStatus();
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    resetSummary();
    renderEmptyRow(backendUnavailableMessage);
    renderFilesTools();
    knowledgeStatusResult.classList.add("hidden");
    knowledgeStatusResult.innerHTML = "";
    setTextStatus(knowledgeStatusMessage, "Knowledge status unavailable until backend is reachable.", "error");
    setTextStatus(
      requestStatus,
      error instanceof Error ? error.message : backendUnavailableMessage,
      "error"
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
    setTextStatus(chatStatus, "Message cannot be empty", "error");
    updateSendChatButtonState();
    return;
  }

  appendChatMessage("user", message);
  const contextMessages = buildChatContextMessages(message);
  chatMessageInput.value = "";
  updateSendChatButtonState();
  setChatSending(true);
  setTextStatus(chatStatus, "Sending /chat request ...", "idle");
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
    setTextStatus(chatStatus, `Chat response received from ${payload.backendUrl}`, "success");
  } catch (error) {
    removeChatLoading(loadingMessage);
    renderChatError(
      error instanceof Error ? error.message : "Chat request failed"
    );
    setTextStatus(
      chatStatus,
      error instanceof Error ? error.message : "Chat request failed",
      "error"
    );
  } finally {
    setChatSending(false);
  }
}

async function copyExample(example) {
  if (!navigator.clipboard?.writeText) {
    setTextStatus(filesToolsStatus, "当前环境不支持剪贴板复制，请手动复制示例文本。", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(example);
    setTextStatus(
      filesToolsStatus,
      `示例已复制：${example}。复制不会自动发送，也不会执行任何文件操作。`,
      "success"
    );
  } catch {
    setTextStatus(filesToolsStatus, "复制失败，请手动复制示例文本。", "error");
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
