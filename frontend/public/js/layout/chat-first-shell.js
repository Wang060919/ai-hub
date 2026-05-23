import { backendUnavailableMessage } from "../api/metadata.js";

function formatBackendLabel(isChecked) {
  return isChecked ? "已检查" : "未检查";
}

function formatModeLabel(mode) {
  return mode === "knowledge" ? "知识库" : "聊天";
}

function formatHistoryTurns(chatHistory) {
  const turns = Math.min(Math.floor((chatHistory?.length || 0) / 2), 4);
  return `${turns}/4 轮`;
}

export function createChatFirstShell({ dom, state, actions }) {
  function setDrawerOpen(isOpen) {
    state.drawerOpen = Boolean(isOpen);
    dom.root.classList.toggle("cf-shell--drawer-open", state.drawerOpen);
    dom.drawerToggle.setAttribute("aria-expanded", String(state.drawerOpen));
    dom.drawerToggle.textContent = state.drawerOpen
      ? "隐藏面板"
      : "显示面板";
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
      return "检查后端以加载工具可用性。";
    }

    return `${matched}/${total} 已从当前 /skills 元数据映射。`;
  }

  function syncTopbar() {
    dom.topbarBackendValue.textContent = state.backendUrl || "http://127.0.0.1:8000";
    dom.topbarModelValue.textContent = "路由：现有后端";
    dom.topbarStatusValue.textContent = formatBackendLabel(state.hasCheckedBackend);
    dom.topbarStatusValue.dataset.tone = state.hasCheckedBackend ? "success" : "idle";
  }

  function syncContextBar() {
    const currentMode = actions.getChatMode();
    dom.contextMode.textContent = `模式：${formatModeLabel(currentMode)}`;
    dom.contextBackend.textContent = `后端：${formatBackendLabel(state.hasCheckedBackend)}`;
    dom.contextHistory.textContent = `历史：${formatHistoryTurns(state.chatHistory)}`;
    dom.contextSafety.textContent = "仅手动操作";
    dom.contextUploads.textContent = "无自动文件上传";

    dom.helperModeValue.textContent = formatModeLabel(currentMode);
    dom.helperBackendValue.textContent = state.hasCheckedBackend ? "已检查" : "待检查";
  }

  function syncBackendPanel() {
    dom.backendMessage.textContent = state.backendPanelMessage;
  }

  function syncKnowledgePanel() {
    dom.knowledgeMessage.textContent = state.knowledgePanelMessage;
  }

  function syncFilesPanel() {
    if (dom.filesSummary) {
      dom.filesSummary.textContent = getFilesToolsSummary();
    }
  }

  function syncHelperPanel() {
    dom.helperClassicLink.href = "./index-classic.html?tab=chat";
  }

  function syncFooter() {
    if (state.hasCheckedBackend) {
      dom.footerStatus.textContent = "已连接";
      dom.footerDot.className = "cf-footer__dot cf-footer__dot--connected";
    } else {
      dom.footerStatus.textContent = "空闲";
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
