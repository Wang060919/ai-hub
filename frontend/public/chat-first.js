import { renderAssistantMessageContent } from "./js/core/markdown.js";
import { fileToolsCatalog } from "./js/catalog/file-tools-catalog.js";
import { requestMetadata, backendUnavailableMessage } from "./js/api/metadata.js";
import { requestKnowledgeStatus } from "./js/api/knowledge.js";
import { createChatModule } from "./js/chat/chat.js";
import { createPanelModule } from "./js/panel/panel.js";
import { createChatFirstShell } from "./js/layout/chat-first-shell.js";
import { renderOrbitIcon } from "./js/components/orbit-icon.js";
import { setTextStatus } from "./js/ui/status.js";

const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const orbitAppIcon = document.querySelector("#orbit-app-icon");

const chatMessageInput = document.querySelector("#chat-message");
const sendChatButton = document.querySelector("#send-chat");
const chatStatus = document.querySelector("#chat-status");
const chatMessages = document.querySelector("#chat-messages");
const chatModeNormalButton = document.querySelector("#chat-mode-normal");
const chatModeKnowledgeButton = document.querySelector("#chat-mode-knowledge");
const chatKbIdInput = document.querySelector("#chat-kb-id");
const chatTopKInput = document.querySelector("#chat-top-k");
const chatKnowledgeParams = document.querySelector("#chat-knowledge-params");

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

const root = document.querySelector("#chat-first-root");
const drawerToggle = document.querySelector("#cf-drawer-toggle");
const topbarBackendValue = document.querySelector("#cf-topbar-backend-value");
const topbarModelValue = document.querySelector("#cf-topbar-model-value");
const topbarStatusValue = document.querySelector("#cf-topbar-status-value");
const backendMessage = document.querySelector("#cf-backend-message");
const knowledgeMessage = document.querySelector("#cf-knowledge-message");
const filesSummary = document.querySelector("#cf-files-summary");
const helperModeValue = document.querySelector("#cf-helper-mode-value");
const helperBackendValue = document.querySelector("#cf-helper-backend-value");
const helperClassicLink = document.querySelector("#cf-helper-classic-link");
const refreshKnowledgeButton = document.querySelector("#cf-refresh-knowledge");
const contextMode = document.querySelector("#cf-context-mode");
const contextBackend = document.querySelector("#cf-context-backend");
const contextHistory = document.querySelector("#cf-context-history");
const contextSafety = document.querySelector("#cf-context-safety");
const contextUploads = document.querySelector("#cf-context-uploads");
const contextModeChatButton = document.querySelector("#cf-context-mode-chat");
const contextModeKnowledgeButton = document.querySelector("#cf-context-mode-knowledge");
const clearChatButton = document.querySelector("#cf-clear-chat");
const helperModeChatButton = document.querySelector("#cf-helper-mode-chat");
const helperModeKnowledgeButton = document.querySelector("#cf-helper-mode-knowledge");
const helperClearChatButton = document.querySelector("#cf-helper-clear-chat");
const footerStatus = document.querySelector("#cf-footer-status");
const footerDot = document.querySelector("#cf-footer-dot");

const state = {
  backendUrl: backendUrlInput.value.trim(),
  drawerOpen: false,
  hasCheckedBackend: false,
  chatSending: false,
  chatHistory: [],
  skills: [],
  fileToolsCatalog,
  backendPanelMessage: "Backend metadata is not loaded yet.",
  knowledgePanelMessage: "Knowledge summary stays idle until backend is checked.",
};

const {
  resetChatResult,
  updateSendChatButtonState,
  handleChatInputKeydown,
  sendChat: sendChatRequest,
  getChatMode,
  setChatMode: setChatModeInternal,
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
    setKnowledgeUnavailable("Knowledge summary stays idle until backend is checked.");
    shell.syncAll();
    return null;
  }

  try {
    const payload = await requestKnowledgeStatus(backendUrlInput.value.trim());
    updateKnowledgeSummary(payload);
    state.knowledgePanelMessage = "Knowledge summary reflects the latest manual refresh.";
    return payload;
  } catch (error) {
    state.knowledgePanelMessage =
      error instanceof Error ? error.message : "Failed to refresh knowledge status.";
    setKnowledgeUnavailable(
      state.knowledgePanelMessage
    );
    return null;
  } finally {
    shell.syncAll();
  }
}

async function checkBackend() {
  state.backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setTextStatus(requestStatus, "Checking /health, /version, and /skills ...", "idle");

  try {
    const payload = await requestMetadata(state.backendUrl);
    if (!payload.ok) {
      throw new Error(payload.error || payload.details || backendUnavailableMessage);
    }

    state.hasCheckedBackend = true;
    state.skills = payload.skills.skills || [];
    state.backendPanelMessage = "Backend metadata loaded from the current AI Hub server.";
    updateBackendSummary(payload);
    setTextStatus(requestStatus, `Connected: ${payload.backendUrl}`, "success");
    await refreshKnowledgeStatus();
  } catch (error) {
    state.hasCheckedBackend = false;
    state.skills = [];
    state.backendPanelMessage =
      error instanceof Error ? error.message : backendUnavailableMessage;
    state.knowledgePanelMessage = "Knowledge summary stays idle until backend is checked.";
    setBackendUnavailable(
      state.backendPanelMessage
    );
    setKnowledgeUnavailable(state.knowledgePanelMessage);
    setTextStatus(
      requestStatus,
      error instanceof Error ? error.message : backendUnavailableMessage,
      "error"
    );
    shell.setBackendUnavailable(state.backendPanelMessage);
  } finally {
    checkButton.disabled = false;
    shell.syncAll();
  }
}

async function sendChat() {
  await sendChatRequest();
  shell.syncAll();
}

const shell = createChatFirstShell({
  dom: {
    root,
    drawerToggle,
    checkBackendButton: checkButton,
    topbarBackendValue,
    topbarModelValue,
    topbarStatusValue,
    backendMessage,
    knowledgeMessage,
    filesSummary,
    helperModeValue,
    helperBackendValue,
    helperClassicLink,
    refreshKnowledgeButton,
    contextMode,
    contextBackend,
    contextHistory,
    contextSafety,
    contextUploads,
    contextModeChatButton,
    contextModeKnowledgeButton,
    clearChatButton,
    helperModeChatButton,
    helperModeKnowledgeButton,
    helperClearChatButton,
    footerStatus,
    footerDot,
  },
  state,
  actions: {
    getChatMode,
    setChatMode,
    clearChat,
    checkBackend,
    refreshKnowledgeStatus,
  },
});

backendUrlInput.addEventListener("input", () => {
  state.backendUrl = backendUrlInput.value.trim();
  shell.syncAll();
});

sendChatButton.addEventListener("click", () => {
  void sendChat();
});
chatMessageInput.addEventListener("input", updateSendChatButtonState);
chatMessageInput.addEventListener("keydown", handleChatInputKeydown);
chatModeNormalButton.addEventListener("click", () => setChatMode("chat"));
chatModeKnowledgeButton.addEventListener("click", () => setChatMode("knowledge"));

function applyInitialClassicNavigation() {
  const query = new URLSearchParams(window.location.search);
  if (query.get("drawer") === "open") {
    shell.setDrawerOpen(true);
  }
}

renderOrbitBrand();
resetBackendSummary();
resetKnowledgeSummary();
resetChatResult();
updateSendChatButtonState();
setChatMode("chat");
shell.bindEvents();
applyInitialClassicNavigation();
shell.syncAll();
