import { backendUnavailableMessage } from "../api/metadata.js";

function formatBackendLabel(isChecked) {
  return isChecked ? "Checked" : "Not checked";
}

function formatModeLabel(mode) {
  return mode === "knowledge" ? "Knowledge" : "Chat";
}

function formatHistoryTurns(chatHistory) {
  const turns = Math.min(Math.floor((chatHistory?.length || 0) / 2), 4);
  return `${turns}/4 turns`;
}

export function createChatFirstShell({ dom, state, actions }) {
  function setDrawerOpen(isOpen) {
    state.drawerOpen = Boolean(isOpen);
    dom.root.classList.toggle("cf-shell--drawer-open", state.drawerOpen);
    dom.drawerToggle.setAttribute("aria-expanded", String(state.drawerOpen));
    dom.drawerToggle.textContent = state.drawerOpen
      ? "Hide Drawer"
      : "Show Drawer";
  }

  function getFilesToolsSummary() {
    const total = Array.isArray(state.fileToolsCatalog)
      ? state.fileToolsCatalog.length
      : 0;
    const matched = Array.isArray(state.skills)
      ? state.fileToolsCatalog.filter((tool) =>
          state.skills.some((skill) => skill.name === tool.name)
        ).length
      : 0;

    if (!state.hasCheckedBackend) {
      return "Check backend to load tool availability.";
    }

    return `${matched}/${total} mapped from current /skills metadata.`;
  }

  function syncTopbar() {
    dom.topbarBackendValue.textContent = state.backendUrl || "http://127.0.0.1:8000";
    dom.topbarModelValue.textContent = "Route: Existing backend";
    dom.topbarStatusValue.textContent = formatBackendLabel(state.hasCheckedBackend);
    dom.topbarStatusValue.dataset.tone = state.hasCheckedBackend ? "success" : "idle";
  }

  function syncContextBar() {
    const currentMode = actions.getChatMode();
    dom.contextMode.textContent = `Mode: ${formatModeLabel(currentMode)}`;
    dom.contextBackend.textContent = `Backend: ${formatBackendLabel(state.hasCheckedBackend)}`;
    dom.contextHistory.textContent = `History: ${formatHistoryTurns(state.chatHistory)}`;
    dom.contextSafety.textContent = "Manual only";
    dom.contextUploads.textContent = "No auto file upload";

    dom.helperModeValue.textContent = formatModeLabel(currentMode);
    dom.helperBackendValue.textContent = state.hasCheckedBackend ? "Checked" : "Pending";
  }

  function syncBackendPanel() {
    dom.backendMessage.textContent = state.backendPanelMessage;
  }

  function syncKnowledgePanel() {
    dom.knowledgeMessage.textContent = state.knowledgePanelMessage;
  }

  function syncFilesPanel() {
    dom.filesSummary.textContent = getFilesToolsSummary();
  }

  function syncHelperPanel() {
    dom.helperClassicLink.href = "./index.html?tab=chat";
  }

  function syncFooter() {
    if (state.hasCheckedBackend) {
      dom.footerStatus.textContent = "Connected";
      dom.footerDot.className = "cf-footer__dot cf-footer__dot--connected";
    } else {
      dom.footerStatus.textContent = "Idle";
      dom.footerDot.className = "cf-footer__dot cf-footer__dot--idle";
    }
  }

  function syncAll() {
    syncTopbar();
    syncContextBar();
    syncBackendPanel();
    syncKnowledgePanel();
    syncFilesPanel();
    syncHelperPanel();
    syncFooter();
  }

  function bindEvents() {
    dom.drawerToggle.addEventListener("click", () => {
      setDrawerOpen(!state.drawerOpen);
    });

    dom.contextModeChatButton.addEventListener("click", () => {
      actions.setChatMode("chat");
      syncAll();
    });

    dom.contextModeKnowledgeButton.addEventListener("click", () => {
      actions.setChatMode("knowledge");
      syncAll();
    });

    dom.helperModeChatButton.addEventListener("click", () => {
      actions.setChatMode("chat");
      syncAll();
    });

    dom.helperModeKnowledgeButton.addEventListener("click", () => {
      actions.setChatMode("knowledge");
      syncAll();
    });

    dom.clearChatButton.addEventListener("click", () => {
      actions.clearChat();
      syncAll();
    });

    dom.helperClearChatButton.addEventListener("click", () => {
      actions.clearChat();
      syncAll();
    });

    dom.checkBackendButton.addEventListener("click", async () => {
      await actions.checkBackend();
      syncAll();
    });

    dom.refreshKnowledgeButton.addEventListener("click", async () => {
      await actions.refreshKnowledgeStatus();
      syncAll();
    });
  }

  function setBackendUnavailable(message) {
    dom.backendMessage.textContent = message || backendUnavailableMessage;
    syncAll();
  }

  return {
    bindEvents,
    setDrawerOpen,
    setBackendUnavailable,
    syncAll,
  };
}
