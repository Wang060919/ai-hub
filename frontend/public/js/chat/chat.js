import { requestChat } from "../api/chat.js";
import { requestKnowledgeQuery } from "../api/knowledge.js";
import { escapeHtml } from "../core/utils.js";
import { setTextStatus } from "../ui/status.js";

const MAX_CHAT_HISTORY_TURNS = 4;
const MAX_CHAT_HISTORY_MESSAGES = MAX_CHAT_HISTORY_TURNS * 2;
const MAX_CHAT_CONTEXT_MESSAGES = MAX_CHAT_HISTORY_MESSAGES + 1;
const MAX_CHAT_MESSAGE_CHARS = 1500;
const MAX_CHAT_CONTEXT_CHARS = 8000;

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

export function createChatModule(deps) {
  const { dom, state, renderAssistantMessageContent } = deps;

  let chatMode = "chat";

  function getChatMode() {
    return chatMode;
  }

  function setChatMode(mode) {
    chatMode = mode;
    const isKnowledge = mode === "knowledge";
    dom.chatKnowledgeParams.classList.toggle("hidden", !isKnowledge);
    dom.chatModeNormalButton.classList.toggle("active", !isKnowledge);
    dom.chatModeNormalButton.setAttribute("aria-checked", String(!isKnowledge));
    dom.chatModeKnowledgeButton.classList.toggle("active", isKnowledge);
    dom.chatModeKnowledgeButton.setAttribute("aria-checked", String(isKnowledge));
    dom.chatMessageInput.placeholder = isKnowledge
      ? "输入问题，基于知识库回答"
      : "试试：hello ai hub";
  }

  function buildAnswerBubble(bubble, answer) {
    const grounded = answer.grounded !== false;
    bubble.classList.add("markdown-content");

    if (!grounded) {
      const warning = document.createElement("div");
      warning.className = "chat-knowledge-warning";
      warning.textContent = "未找到可靠知识片段，以下回答可能不准确。";
      bubble.append(warning);
    }

    const textBlock = document.createElement("div");
    textBlock.className = "knowledge-chat-text";
    if (answer.text) {
      renderAssistantMessageContent(textBlock, answer.text);
    } else {
      textBlock.textContent = "-";
    }
    bubble.append(textBlock);

    return { grounded };
  }

  function buildCitationsBlock(citations) {
    if (!Array.isArray(citations) || citations.length === 0) {
      return null;
    }

    const container = document.createElement("details");
    container.className = "chat-knowledge-details";

    const summary = document.createElement("summary");
    summary.textContent = `引用来源（${citations.length}）`;
    container.append(summary);

    const list = document.createElement("ol");
    list.className = "chat-citation-list";
    citations.forEach((citation) => {
      const item = document.createElement("li");
      item.className = "chat-citation-item";
      item.textContent = `[${citation.index ?? "-"}] ${citation.relative_path || "-"} (chunk ${citation.chunk_index ?? "-"})`;
      list.append(item);
    });
    container.append(list);

    return container;
  }

  function buildHitsBlock(hits) {
    if (!Array.isArray(hits) || hits.length === 0) {
      return null;
    }

    const container = document.createElement("details");
    container.className = "chat-knowledge-details";

    const summary = document.createElement("summary");
    summary.textContent = `命中文件（${hits.length}）`;
    container.append(summary);

    const list = document.createElement("ol");
    list.className = "chat-citation-list";
    hits.forEach((hit) => {
      const item = document.createElement("li");
      item.className = "chat-citation-item";
      const path = hit.relative_path || "-";
      const score = hit.score != null ? ` | score=${hit.score}` : "";
      item.innerHTML = `<strong>${escapeHtml(path)}</strong> chunk_index=${escapeHtml(hit.chunk_index ?? "-")}${escapeHtml(score)}`;
      list.append(item);
    });
    container.append(list);

    return container;
  }

  function renderKnowledgeChatResult(payload) {
    const answer = payload?.answer || {};
    const citations = Array.isArray(payload?.citations) ? payload.citations : [];
    const hits = Array.isArray(payload?.hits) ? payload.hits : [];

    const messageItem = document.createElement("article");
    messageItem.className = "chat-message assistant";

    const label = document.createElement("div");
    label.className = "chat-message-label";
    label.textContent = "AI Hub · 知识库";

    const bubble = document.createElement("div");
    bubble.className = "chat-message-bubble";

    const { grounded } = buildAnswerBubble(bubble, answer);

    const citationsBlock = buildCitationsBlock(citations);
    if (citationsBlock) {
      bubble.append(citationsBlock);
    }

    const hitsBlock = buildHitsBlock(hits);
    if (hitsBlock) {
      bubble.append(hitsBlock);
    }

    messageItem.append(label, bubble);

    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = `model: ${answer.model || "-"} | grounded: ${String(grounded)}`;
    messageItem.append(meta);

    clearChatEmptyState();
    dom.chatMessages.append(messageItem);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }

  function renderKnowledgeChatError(message, code) {
    const isModelDisabled = code === "KNOWLEDGE_MODEL_DISABLED";

    const messageItem = document.createElement("article");
    messageItem.className = "chat-message assistant";

    const label = document.createElement("div");
    label.className = "chat-message-label";
    label.textContent = "AI Hub · 知识库";

    const bubble = document.createElement("div");
    bubble.className = "chat-message-bubble";

    const errorDiv = document.createElement("div");
    errorDiv.className = "chat-knowledge-warning";
    if (isModelDisabled) {
      errorDiv.textContent = "KNOWLEDGE_MODEL_DISABLED：后端环境未启用 DeepSeek，无法回答知识库问题。";
    } else {
      errorDiv.textContent = message || "知识库问答请求失败";
    }
    bubble.append(errorDiv);

    messageItem.append(label, bubble);

    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = `status: error${code ? ` | code: ${code}` : ""}`;
    messageItem.append(meta);

    clearChatEmptyState();
    dom.chatMessages.append(messageItem);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }

  function resetChatResult() {
    dom.chatMessages.innerHTML =
      '<div class="chat-empty-state">发送消息以启动 Echo 聊天循环。</div>';
    state.chatHistory = [];
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

  function clearChatEmptyState() {
    const emptyState = dom.chatMessages.querySelector(".chat-empty-state");
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
    label.textContent = role === "user" ? "你" : "AI Hub";

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

    dom.chatMessages.append(messageItem);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
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
    return appendChatMessage(
      "assistant",
      "等待 /chat 响应 ...",
      "status: sending",
      {
        loading: true,
      }
    );
  }

  function removeChatLoading(loadingMessage) {
    if (loadingMessage) {
      loadingMessage.remove();
    }
  }

  function updateSendChatButtonState() {
    const hasMessage = Boolean(dom.chatMessageInput.value.trim());
    dom.sendChatButton.disabled = state.chatSending || !hasMessage;
  }

  function setChatLoading(isLoading) {
    state.chatSending = isLoading;
    dom.sendChatButton.classList.toggle("sending", isLoading);
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
    if (!dom.sendChatButton.disabled) {
      void sendChat();
    }
  }

  async function sendKnowledgeChat() {
    const backendUrl = dom.backendUrlInput.value.trim();
    const question = dom.chatMessageInput.value.trim();
    const kbId = dom.chatKbIdInput.value.trim() || "default";
    const topK = Number(dom.chatTopKInput.value) || 4;

    if (!question) {
      setTextStatus(dom.chatStatus, "问题不能为空", "error");
      updateSendChatButtonState();
      return;
    }

    appendChatMessage("user", question);
    dom.chatMessageInput.value = "";
    updateSendChatButtonState();
    setChatLoading(true);
    setTextStatus(dom.chatStatus, "正在发送 /api/knowledge/query ...", "idle");
    const loadingMessage = renderChatLoading();

    try {
      const payload = await requestKnowledgeQuery(backendUrl, question, kbId, topK);
      removeChatLoading(loadingMessage);
      if (!payload.ok && payload.error) {
        throw Object.assign(
          new Error(payload.details || payload.error.message || "Knowledge query failed"),
          { code: payload.error.code || payload.error }
        );
      }
      renderKnowledgeChatResult(payload);
      setTextStatus(
        dom.chatStatus,
        "知识库回答已从 /api/knowledge/query 加载",
        "success"
      );
    } catch (error) {
      removeChatLoading(loadingMessage);
      renderKnowledgeChatError(
        error instanceof Error ? error.message : "知识库问答请求失败",
        error.code
      );
      if (error.code === "KNOWLEDGE_MODEL_DISABLED") {
        setTextStatus(
          dom.chatStatus,
          "KNOWLEDGE_MODEL_DISABLED：后端环境未启用 DeepSeek。",
          "error"
        );
      } else {
        setTextStatus(
          dom.chatStatus,
          error instanceof Error ? error.message : "知识库问答请求失败",
          "error"
        );
      }
    } finally {
      setChatLoading(false);
    }
  }

  async function sendChat() {
    if (state.chatSending) {
      return;
    }

    if (chatMode === "knowledge") {
      await sendKnowledgeChat();
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const message = dom.chatMessageInput.value.trim();

    if (!message) {
      setTextStatus(dom.chatStatus, "消息不能为空", "error");
      updateSendChatButtonState();
      return;
    }

    appendChatMessage("user", message);
    const contextMessages = buildChatContextMessages(message);
    dom.chatMessageInput.value = "";
    updateSendChatButtonState();
    setChatLoading(true);
    setTextStatus(dom.chatStatus, "正在发送 /chat 请求 ...", "idle");
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
      setTextStatus(
        dom.chatStatus,
        `聊天响应来自 ${payload.backendUrl}`,
        "success"
      );
    } catch (error) {
      removeChatLoading(loadingMessage);
      renderChatError(
        error instanceof Error ? error.message : "聊天请求失败"
      );
      setTextStatus(
        dom.chatStatus,
        error instanceof Error ? error.message : "聊天请求失败",
        "error"
      );
    } finally {
      setChatLoading(false);
    }
  }

  return {
    resetChatResult,
    updateSendChatButtonState,
    handleChatInputKeydown,
    sendChat,
    getChatMode,
    setChatMode,
  };
}
