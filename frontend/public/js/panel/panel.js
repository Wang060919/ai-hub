import { requestChat } from "../api/chat.js";
import { setTextStatus } from "../ui/status.js";
import { setButtonLoading } from "../ui/loading.js";

const MAX_PANEL_CHAT_CHARS = 400;
const MAX_PANEL_CHAT_SUMMARY_CHARS = 220;

function normalizeMessage(value) {
  return String(value || "").trim().slice(0, MAX_PANEL_CHAT_CHARS);
}

function summarizeReply(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "本次没有返回可展示的回答内容。";
  }

  if (normalized.length <= MAX_PANEL_CHAT_SUMMARY_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_PANEL_CHAT_SUMMARY_CHARS)}...`;
}

export function createPanelModule(deps) {
  const { dom } = deps;

  let panelChatSending = false;

  function updateQuickChatButtonState() {
    const hasMessage = Boolean(normalizeMessage(dom.panelChatMessageInput.value));
    dom.panelSendChatButton.disabled = panelChatSending || !hasMessage;
  }

  function setQuickChatLoading(isLoading) {
    panelChatSending = isLoading;
    setButtonLoading(dom.panelSendChatButton, isLoading, {
      loading: "发送中...",
      idle: "发送",
    });
    updateQuickChatButtonState();
  }

  function resetBackendSummary() {
    dom.panelBackendOnline.textContent = "等待检查";
    dom.panelBackendApp.textContent = "-";
    dom.panelBackendVersion.textContent = "-";
    dom.panelBackendSkills.textContent = "0";
    setTextStatus(
      dom.panelBackendStatus,
      "点击“检查后端”后同步更新面板状态摘要。",
      "idle"
    );
  }

  function updateBackendSummary(payload) {
    const healthStatus = payload?.health?.status || "-";
    const versionValue = payload?.version?.version || "-";
    const skills = Array.isArray(payload?.skills?.skills) ? payload.skills.skills : [];

    dom.panelBackendOnline.textContent =
      healthStatus === "ok" ? "在线" : String(healthStatus || "-");
    dom.panelBackendApp.textContent = "AI Hub";
    dom.panelBackendVersion.textContent = versionValue;
    dom.panelBackendSkills.textContent = String(skills.length);
    setTextStatus(
      dom.panelBackendStatus,
      `状态摘要已复用 /api/metadata 结果，当前后端：${payload?.backendUrl || "-"}`,
      "success"
    );
  }

  function setBackendUnavailable(message) {
    dom.panelBackendOnline.textContent = "不可达";
    dom.panelBackendApp.textContent = "-";
    dom.panelBackendVersion.textContent = "-";
    dom.panelBackendSkills.textContent = "0";
    setTextStatus(
      dom.panelBackendStatus,
      message || "后端不可达，面板状态摘要暂不可用。",
      "error"
    );
  }

  function resetKnowledgeSummary() {
    dom.panelKnowledgeFiles.textContent = "-";
    const panelKnowledgeMarkdownFiles = document.querySelector("#panel-knowledge-markdown-files");
    dom.panelKnowledgeChunks.textContent = "-";
    dom.panelKnowledgeIndexMethod.textContent = "-";
    dom.panelKnowledgeFtsEnabled.textContent = "-";
    dom.panelKnowledgeFtsAvailable.textContent = "-";
    if (panelKnowledgeMarkdownFiles) {
      panelKnowledgeMarkdownFiles.textContent = "-";
    }
    setTextStatus(
      dom.panelKnowledgeStatus,
      "刷新知识库状态后，这里会同步显示最新摘要。",
      "idle"
    );
  }

  function updateKnowledgeSummary(payload) {
    const panelKnowledgeMarkdownFiles = document.querySelector("#panel-knowledge-markdown-files");
    dom.panelKnowledgeFiles.textContent = String(payload?.files_count ?? "-");
    dom.panelKnowledgeChunks.textContent = String(payload?.chunks_count ?? "-");
    dom.panelKnowledgeIndexMethod.textContent = payload?.index_method || "-";
    dom.panelKnowledgeFtsEnabled.textContent = String(Boolean(payload?.fts_enabled));
    dom.panelKnowledgeFtsAvailable.textContent = String(Boolean(payload?.fts_available));
    if (panelKnowledgeMarkdownFiles) {
      panelKnowledgeMarkdownFiles.textContent = String(payload?.markdown_files_count ?? "-");
    }
    setTextStatus(
      dom.panelKnowledgeStatus,
      "Markdown 接入摘要已复用 /api/knowledge/status 最新结果。",
      "success"
    );
  }

  function setKnowledgeUnavailable(message) {
    dom.panelKnowledgeFiles.textContent = "-";
    const panelKnowledgeMarkdownFiles = document.querySelector("#panel-knowledge-markdown-files");
    dom.panelKnowledgeChunks.textContent = "-";
    dom.panelKnowledgeIndexMethod.textContent = "-";
    dom.panelKnowledgeFtsEnabled.textContent = "-";
    dom.panelKnowledgeFtsAvailable.textContent = "-";
    if (panelKnowledgeMarkdownFiles) {
      panelKnowledgeMarkdownFiles.textContent = "-";
    }
    setTextStatus(
      dom.panelKnowledgeStatus,
      message || "暂无知识库状态。",
      "idle"
    );
  }

  function resetQuickChat() {
    dom.panelChatMessageInput.value = "";
    dom.panelChatResult.textContent = "最近一次回答摘要会显示在这里。";
    setTextStatus(
      dom.panelChatStatus,
      "不会自动发送；只有手动点击才会调用 `/api/chat`。",
      "idle"
    );
    updateQuickChatButtonState();
  }

  async function sendQuickChat() {
    if (panelChatSending) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const message = normalizeMessage(dom.panelChatMessageInput.value);

    if (!message) {
      setTextStatus(dom.panelChatStatus, "快速聊天消息不能为空。", "error");
      updateQuickChatButtonState();
      return;
    }

    setQuickChatLoading(true);
    setTextStatus(dom.panelChatStatus, "正在发送 /api/chat ...", "idle");

    try {
      const payload = await requestChat(backendUrl, message, []);
      if (!payload.ok) {
        throw new Error(payload.details || payload.error || "Chat request failed");
      }

      const reply = payload?.chat?.reply || "";
      dom.panelChatResult.textContent = summarizeReply(reply);
      dom.panelChatMessageInput.value = "";
      setTextStatus(
        dom.panelChatStatus,
        `快速聊天已收到响应，skill: ${payload?.chat?.skill || "-"}`,
        "success"
      );
    } catch (error) {
      dom.panelChatResult.textContent = "最近一次回答摘要暂不可用。";
      setTextStatus(
        dom.panelChatStatus,
        error instanceof Error ? error.message : "快速聊天请求失败",
        "error"
      );
    } finally {
      setQuickChatLoading(false);
    }
  }

  return {
    updateQuickChatButtonState,
    resetBackendSummary,
    updateBackendSummary,
    setBackendUnavailable,
    resetKnowledgeSummary,
    updateKnowledgeSummary,
    setKnowledgeUnavailable,
    resetQuickChat,
    sendQuickChat,
  };
}
