import { escapeHtml } from "./js/core/utils.js";
import { renderAssistantMessageContent } from "./js/core/markdown.js";
import { fileToolsCatalog } from "./js/catalog/file-tools-catalog.js";
import { requestMetadata, backendUnavailableMessage } from "./js/api/metadata.js";
import { createChatModule } from "./js/chat/chat.js";
import { createFilesModule } from "./js/files/files.js";
import { createKnowledgeModule } from "./js/knowledge/knowledge.js";
import { createPanelModule } from "./js/panel/panel.js";
import { setTextStatus } from "./js/ui/status.js";

const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const healthStatus = document.querySelector("#health-status");
const appVersion = document.querySelector("#app-version");
const skillsCount = document.querySelector("#skills-count");
const skillsBody = document.querySelector("#skills-body");

const panelTabButton = document.querySelector("#tab-panel");
const statusTabButton = document.querySelector("#tab-status");
const chatTabButton = document.querySelector("#tab-chat");
const filesToolsTabButton = document.querySelector("#tab-files-tools");
const panelOverview = document.querySelector("#panel-overview");
const statusPanel = document.querySelector("#panel-status");
const chatPanel = document.querySelector("#panel-chat");
const filesToolsPanel = document.querySelector("#panel-files-tools");
const panelEntryButtons = document.querySelectorAll("[data-panel-target-tab]");
const panelBackendOnline = document.querySelector("#panel-backend-online");
const panelBackendApp = document.querySelector("#panel-backend-app");
const panelBackendVersion = document.querySelector("#panel-backend-version");
const panelBackendSkills = document.querySelector("#panel-backend-skills");
const panelBackendStatus = document.querySelector("#panel-backend-status");
const panelKnowledgeFiles = document.querySelector("#panel-knowledge-files");
const panelKnowledgeMarkdownFiles = document.querySelector(
  "#panel-knowledge-markdown-files"
);
const panelKnowledgeChunks = document.querySelector("#panel-knowledge-chunks");
const panelKnowledgeIndexMethod = document.querySelector("#panel-knowledge-index-method");
const panelKnowledgeFtsEnabled = document.querySelector("#panel-knowledge-fts-enabled");
const panelKnowledgeFtsAvailable = document.querySelector("#panel-knowledge-fts-available");
const panelKnowledgeStatus = document.querySelector("#panel-knowledge-status");
const panelChatMessageInput = document.querySelector("#panel-chat-message");
const panelSendChatButton = document.querySelector("#panel-send-chat");
const panelChatStatus = document.querySelector("#panel-chat-status");
const panelChatResult = document.querySelector("#panel-chat-result");

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

const loadSkillsHint =
  "请先在后端状态页面点击检查后端读取能力列表。这个页面只展示能力和安全边界，不会上传文件，也不会执行文件操作。";

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
  resetChatResult,
  updateSendChatButtonState,
  handleChatInputKeydown,
  sendChat,
} = createChatModule({
  dom: {
    backendUrlInput,
    chatMessageInput,
    sendChatButton,
    chatStatus,
    chatMessages,
  },
  state,
  renderAssistantMessageContent,
});

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

const {
  updateQuickChatButtonState,
  resetBackendSummary: resetPanelBackendSummary,
  updateBackendSummary: updatePanelBackendSummary,
  setBackendUnavailable: setPanelBackendUnavailable,
  resetKnowledgeSummary: resetPanelKnowledgeSummary,
  updateKnowledgeSummary: updatePanelKnowledgeSummary,
  setKnowledgeUnavailable: setPanelKnowledgeUnavailable,
  resetQuickChat,
  sendQuickChat,
} = createPanelModule({
  dom: {
    backendUrlInput,
    panelBackendOnline,
    panelBackendApp,
    panelBackendVersion,
    panelBackendSkills,
    panelBackendStatus,
    panelKnowledgeFiles,
    panelKnowledgeMarkdownFiles,
    panelKnowledgeChunks,
    panelKnowledgeIndexMethod,
    panelKnowledgeFtsEnabled,
    panelKnowledgeFtsAvailable,
    panelKnowledgeStatus,
    panelChatMessageInput,
    panelSendChatButton,
    panelChatStatus,
    panelChatResult,
  },
});

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
}

function renderEmptyRow(message) {
  skillsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function renderSkills(skills) {
  if (!Array.isArray(skills) || skills.length === 0) {
    renderEmptyRow("后端未返回任何技能");
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
  const stage = found ? matchedSkill.stage : "未在 /skills 中找到";
  const safetyLevel = found ? matchedSkill.safety_level : "未在 /skills 中找到";
  const executableTag = found
    ? `<span class="tag ${matchedSkill.executable ? "true" : "false"}">${escapeHtml(
        matchedSkill.executable
      )}</span>`
    : '<span class="tag warning">Not found</span>';
  const statusText = found
    ? "已从后端 /skills 元数据加载。"
    : "当前后端未返回此技能。";

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
  const isPanel = activeTab === "panel";
  const isStatus = activeTab === "status";
  const isChat = activeTab === "chat";
  const isFilesTools = activeTab === "files-tools";

  panelTabButton.classList.toggle("active", isPanel);
  statusTabButton.classList.toggle("active", isStatus);
  chatTabButton.classList.toggle("active", isChat);
  filesToolsTabButton.classList.toggle("active", isFilesTools);

  panelTabButton.setAttribute("aria-selected", String(isPanel));
  statusTabButton.setAttribute("aria-selected", String(isStatus));
  chatTabButton.setAttribute("aria-selected", String(isChat));
  filesToolsTabButton.setAttribute("aria-selected", String(isFilesTools));

  panelOverview.classList.toggle("hidden", !isPanel);
  statusPanel.classList.toggle("hidden", !isStatus);
  chatPanel.classList.toggle("hidden", !isChat);
  filesToolsPanel.classList.toggle("hidden", !isFilesTools);
}

function openTabTarget(tabName, sectionId) {
  showTab(tabName);

  if (!sectionId) {
    return;
  }

  const targetSection = document.querySelector(`#${sectionId}`);
  if (targetSection instanceof HTMLElement) {
    targetSection.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

async function refreshKnowledgeStatusWithPanel() {
  const payload = await refreshKnowledgeStatus();
  if (payload) {
    updatePanelKnowledgeSummary(payload);
  } else {
    setPanelKnowledgeUnavailable(
      state.hasCheckedBackend
        ? "暂无知识库状态。"
        : "后端未确认可用前，知识库摘要暂不可用。"
    );
  }
}

async function checkBackend() {
  const backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setTextStatus(requestStatus, "正在检查 /health、/version 和 /skills ...", "idle");

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
    updatePanelBackendSummary(payload);
    renderSkills(skills);
    renderFilesTools();
    setTextStatus(requestStatus, `已连接：${payload.backendUrl}`, "success");
    void refreshKnowledgeStatusWithPanel();
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    resetSummary();
    setPanelBackendUnavailable(
      error instanceof Error ? error.message : backendUnavailableMessage
    );
    setPanelKnowledgeUnavailable("暂无知识库状态。");
    renderEmptyRow(backendUnavailableMessage);
    renderFilesTools();
    knowledgeStatusResult.classList.add("hidden");
    knowledgeStatusResult.innerHTML = "";
    setTextStatus(knowledgeStatusMessage, "后端不可达，无法获取知识库状态。", "error");
    setTextStatus(
      requestStatus,
      error instanceof Error ? error.message : backendUnavailableMessage,
      "error"
    );
  } finally {
    checkButton.disabled = false;
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

panelTabButton.addEventListener("click", () => showTab("panel"));
statusTabButton.addEventListener("click", () => showTab("status"));
chatTabButton.addEventListener("click", () => showTab("chat"));
filesToolsTabButton.addEventListener("click", () => showTab("files-tools"));
checkButton.addEventListener("click", checkBackend);
sendChatButton.addEventListener("click", sendChat);
chatMessageInput.addEventListener("input", updateSendChatButtonState);
chatMessageInput.addEventListener("keydown", handleChatInputKeydown);
panelSendChatButton.addEventListener("click", () => {
  void sendQuickChat();
});
panelChatMessageInput.addEventListener("input", updateQuickChatButtonState);
readFilePreviewButton.addEventListener("click", readFilePreview);
summarizeFilePreviewButton.addEventListener("click", summarizeFilePreview);
filePreviewPathInput.addEventListener("input", handleFilePreviewPathInput);
refreshKnowledgeStatusButton.addEventListener("click", () => {
  void refreshKnowledgeStatusWithPanel();
});
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

panelEntryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.getAttribute("data-panel-target-tab");
    const sectionId = button.getAttribute("data-panel-target-section");

    if (!tabName) {
      return;
    }

    openTabTarget(tabName, sectionId);
  });
});

renderFilesTools();
resetPanelBackendSummary();
resetPanelKnowledgeSummary();
resetChatResult();
resetQuickChat();
resetFileSummaryResult();
updateSendChatButtonState();
updateQuickChatButtonState();
updateFilePreviewButtonState();
updateKnowledgeButtonState();
showTab("panel");
void refreshKnowledgeStatusWithPanel();
