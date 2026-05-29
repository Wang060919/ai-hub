import { renderAssistantMessageContent } from "./js/core/markdown.js";
import { fileToolsCatalog } from "./js/catalog/file-tools-catalog.js";
import { requestMetadata, backendUnavailableMessage } from "./js/api/metadata.js";
import { requestKnowledgeStatus } from "./js/api/knowledge.js";
import { createChatModule } from "./js/chat/chat.js";
import { createPanelModule } from "./js/panel/panel.js";
import { createFilesModule } from "./js/files/files.js";
import { createKnowledgeModule } from "./js/knowledge/knowledge.js";
import { createDesktopShell } from "./js/layout/chat-first-shell.js";
import { renderOrbitIcon } from "./js/components/orbit-icon.js";
import { setTextStatus } from "./js/ui/status.js";
import { createToastManager } from "./js/ui/toast.js";

/* ---- DOM references (elements that persist across pages) ---- */
const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const orbitAppIcon = document.querySelector("#orbit-app-icon");

/* ---- Chat page DOM ---- */
const chatMessageInput = document.querySelector("#chat-message");
const sendChatButton = document.querySelector("#send-chat");
const chatStatus = document.querySelector("#chat-status");
const chatMessages = document.querySelector("#chat-messages");
const chatModeNormalButton = document.querySelector("#chat-mode-normal");
const chatModeKnowledgeButton = document.querySelector("#chat-mode-knowledge");
const chatKbIdInput = document.querySelector("#chat-kb-id");
const chatTopKInput = document.querySelector("#chat-top-k");
const chatKnowledgeParams = document.querySelector("#chat-knowledge-params");

/* ---- Files page DOM ---- */
const filePreviewPathInput = document.querySelector("#file-preview-path");
const readFilePreviewButton = document.querySelector("#read-file-preview");
const summarizeFilePreviewButton = document.querySelector("#summarize-file-preview");
const filePreviewStatus = document.querySelector("#file-preview-status");
const filePreviewResult = document.querySelector("#file-preview-result");
const fileSummaryStatus = document.querySelector("#file-summary-status");
const fileSummaryResult = document.querySelector("#file-summary-result");

/* ---- Knowledge page DOM ---- */
const refreshKnowledgeButton = document.querySelector("#cf-refresh-knowledge");
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

/* ---- Status page DOM (panel summary) ---- */
const panelBackendOnline = document.querySelector("#panel-backend-online");
const panelBackendApp = document.querySelector("#panel-backend-app");
const panelBackendVersion = document.querySelector("#panel-backend-version");
const panelBackendSkills = document.querySelector("#panel-backend-skills");
const panelBackendStatus = document.querySelector("#panel-backend-status");
const panelKnowledgeFiles = document.querySelector("#panel-knowledge-files");
const panelKnowledgeMarkdownFiles = document.querySelector("#panel-knowledge-markdown-files");
const panelKnowledgeChunks = document.querySelector("#panel-knowledge-chunks");
const panelKnowledgeIndexMethod = document.querySelector("#panel-knowledge-index-method");
const panelKnowledgeFtsEnabled = document.querySelector("#panel-knowledge-fts-enabled");
const panelKnowledgeFtsAvailable = document.querySelector("#panel-knowledge-fts-available");
const panelKnowledgeStatus = document.querySelector("#panel-knowledge-status");

/* ---- State ---- */
const state = {
  backendUrl: backendUrlInput.value.trim(),
  activePage: "chat",
  hasCheckedBackend: false,
  chatSending: false,
  chatHistory: [],
  skills: [],
  fileToolsCatalog,
  knowledgePanelMessage: "检查后端后知识库摘要才会更新。",
  filePreviewLoading: false,
  fileSummaryLoading: false,
  hasPreviewResult: false,
  lastPreviewPath: "",
  knowledgeStatusLoading: false,
  knowledgeIndexLoading: false,
  knowledgeSearchLoading: false,
  knowledgeQueryLoading: false,
};

/* ---- Toast ---- */
const toast = createToastManager(document.querySelector("#toast-container"));

/* ---- Chat module ---- */
const {
  resetChatResult,
  updateSendChatButtonState,
  handleChatInputKeydown,
  sendChat: sendChatRequest,
  getChatMode,
  setChatMode: setChatModeInternal,
  autoResizeTextarea,
  initResizeHandle,
} = createChatModule({
  dom: {
    backendUrlInput,
    chatMessageInput,
    sendChatButton,
    chatStatus,
    chatMessages,
    chatModeNormalButton,
    chatModeKnowledgeButton,
    chatKbIdInput,
    chatTopKInput,
    chatKnowledgeParams,
  },
  state,
  renderAssistantMessageContent,
});

/* ---- Panel module (shared by Status + Knowledge pages) ---- */
const {
  resetBackendSummary,
  updateBackendSummary,
  setBackendUnavailable,
  resetKnowledgeSummary,
  updateKnowledgeSummary,
  setKnowledgeUnavailable,
} = createPanelModule({
  dom: {
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
  },
});

/* ---- Files module ---- */
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

/* ---- Knowledge module ---- */
const {
  updateKnowledgeButtonState,
  refreshKnowledgeStatus: refreshKnowledgeStatusDetail,
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

/* ---- Shell ---- */
const shell = createDesktopShell({ dom: {}, state, actions: {} });

/* ---- Helpers ---- */
function renderOrbitBrand() {
  orbitAppIcon.innerHTML = renderOrbitIcon({
    variant: "app",
    size: "app-badge",
  });
}

function setChatMode(mode) {
  setChatModeInternal(mode);
  shell.syncAll();
}

function clearChat() {
  resetChatResult();
  shell.syncAll();
}

async function refreshKnowledgeStatus() {
  if (!state.hasCheckedBackend) {
    setKnowledgeUnavailable("检查后端后知识库摘要才会更新。");
    shell.syncAll();
    return null;
  }

  try {
    const payload = await requestKnowledgeStatus(backendUrlInput.value.trim());
    updateKnowledgeSummary(payload);
    state.knowledgePanelMessage = "知识库摘要反映最新手动刷新。";
    void refreshKnowledgeStatusDetail();
    return payload;
  } catch (error) {
    state.knowledgePanelMessage =
      error instanceof Error ? error.message : "刷新知识库状态失败。";
    setKnowledgeUnavailable(state.knowledgePanelMessage);
    return null;
  } finally {
    shell.syncAll();
  }
}

async function checkBackend() {
  state.backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setTextStatus(requestStatus, "正在检查 /health、/version 和 /skills ...", "idle");

  try {
    const payload = await requestMetadata(state.backendUrl);
    if (!payload.ok) {
      throw new Error(payload.error || payload.details || backendUnavailableMessage);
    }

    state.hasCheckedBackend = true;
    state.skills = payload.skills.skills || [];
    updateBackendSummary(payload);
    setTextStatus(requestStatus, `已连接：${payload.backendUrl}`, "success");
    toast.show(`已连接后端：${payload.backendUrl}`, "success");
    await refreshKnowledgeStatus();
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    setBackendUnavailable(
      error instanceof Error ? error.message : backendUnavailableMessage
    );
    setKnowledgeUnavailable("检查后端后知识库摘要才会更新。");
    setTextStatus(
      requestStatus,
      error instanceof Error ? error.message : backendUnavailableMessage,
      "error"
    );
    toast.show(error instanceof Error ? error.message : backendUnavailableMessage, "error");
    shell.setConnected(false, true);
  } finally {
    checkButton.disabled = false;
    shell.syncAll();
  }
}

async function sendChat() {
  await sendChatRequest();
  shell.syncAll();
}

/* ---- Event wiring ---- */

// Backend check
checkButton.addEventListener("click", () => {
  void checkBackend();
});

// Backend URL input
backendUrlInput.addEventListener("input", () => {
  state.backendUrl = backendUrlInput.value.trim();
  shell.syncAll();
});

// Chat events
sendChatButton.addEventListener("click", () => {
  void sendChat();
});
chatMessageInput.addEventListener("input", updateSendChatButtonState);
chatMessageInput.addEventListener("input", autoResizeTextarea);
chatMessageInput.addEventListener("keydown", handleChatInputKeydown);
chatModeNormalButton.addEventListener("click", () => setChatMode("chat"));
chatModeKnowledgeButton.addEventListener("click", () => setChatMode("knowledge"));

// Files events
readFilePreviewButton.addEventListener("click", readFilePreview);
summarizeFilePreviewButton.addEventListener("click", summarizeFilePreview);
filePreviewPathInput.addEventListener("input", handleFilePreviewPathInput);

// Knowledge events
refreshKnowledgeButton.addEventListener("click", () => {
  void refreshKnowledgeStatus();
});
refreshKnowledgeStatusButton.addEventListener("click", () => {
  void refreshKnowledgeStatusDetail();
});
knowledgeIndexSubmitButton.addEventListener("click", addToKnowledge);
knowledgeSearchSubmitButton.addEventListener("click", searchKnowledge);
knowledgeQuerySubmitButton.addEventListener("click", queryKnowledge);
knowledgeIndexPathInput.addEventListener("input", updateKnowledgeButtonState);
knowledgeSearchQueryInput.addEventListener("input", updateKnowledgeButtonState);
knowledgeQueryQuestionInput.addEventListener("input", updateKnowledgeButtonState);

/* ---- Init ---- */
renderOrbitBrand();
resetBackendSummary();
resetKnowledgeSummary();
resetChatResult();
resetFileSummaryResult();
updateSendChatButtonState();
updateFilePreviewButtonState();
updateKnowledgeButtonState();
setChatMode("chat");
initResizeHandle();
shell.bindEvents();
shell.restoreSidebarState();
shell.syncAll();
