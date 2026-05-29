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

  function updateCharCounter() {
    const counter = document.querySelector("#chat-char-counter");
    if (!counter) return;
    const len = dom.chatMessageInput.value.length;
    const ratio = len / MAX_CHAT_MESSAGE_CHARS;
    if (ratio < 0.8) {
      counter.textContent = "";
      counter.className = "chat-composer-counter";
    } else {
      counter.textContent = `${len} / ${MAX_CHAT_MESSAGE_CHARS}`;
      counter.className = ratio >= 1
        ? "chat-composer-counter at-limit"
        : "chat-composer-counter near-limit";
    }
  }

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
      warning.textContent = "未在知识库中找到可靠匹配，以下回答仅供参考。";
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

  function buildSourcesBlock(citations, hits) {
    const sources = [];
    if (Array.isArray(citations)) {
      citations.forEach((c) => {
        sources.push({ path: c.relative_path || "-", chunk: c.chunk_index ?? "-", index: c.index });
      });
    }
    if (sources.length === 0 && Array.isArray(hits)) {
      hits.forEach((h) => {
        sources.push({ path: h.relative_path || "-", chunk: h.chunk_index ?? "-" });
      });
    }
    if (sources.length === 0) {
      return null;
    }

    const container = document.createElement("details");
    container.className = "chat-knowledge-details";

    const summary = document.createElement("summary");
    summary.textContent = `参考来源（${sources.length}）`;
    container.append(summary);

    const list = document.createElement("ol");
    list.className = "chat-citation-list";
    sources.forEach((s) => {
      const item = document.createElement("li");
      item.className = "chat-citation-item";
      const label = s.index != null ? `[${s.index}] ` : "";
      item.textContent = `${label}${s.path}（第 ${s.chunk} 段）`;
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

    const sourcesBlock = buildSourcesBlock(citations, hits);
    if (sourcesBlock) {
      bubble.append(sourcesBlock);
    }

    messageItem.append(label, bubble);

    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = answer.model ? `模型：${answer.model}` : "";
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
      errorDiv.textContent = "知识库问答功能未启用：后端环境尚未配置 AI 模型，请联系管理员开启 DeepSeek。";
    } else {
      errorDiv.textContent = message || "知识库问答请求失败，请稍后重试。";
    }
    bubble.append(errorDiv);

    messageItem.append(label, bubble);

    clearChatEmptyState();
    dom.chatMessages.append(messageItem);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  }

  function resetChatResult() {
    dom.chatMessages.innerHTML = `
      <div class="chat-empty-state">
        <div class="chat-empty-state-icon" aria-hidden="true"></div>
        <div class="chat-empty-state-title">开始对话</div>
        <p class="chat-empty-state-subtitle">输入消息，按 Enter 发送，Shift+Enter 换行</p>
        <div class="chat-empty-state-hints">
          <button class="chat-empty-state-hint" type="button">你好，介绍一下你自己</button>
          <button class="chat-empty-state-hint" type="button">帮我分析一个文件</button>
          <button class="chat-empty-state-hint" type="button">搜索知识库</button>
        </div>
      </div>
    `;
    const hints = dom.chatMessages.querySelectorAll(".chat-empty-state-hint");
    hints.forEach((hint) => {
      hint.addEventListener("click", () => {
        dom.chatMessageInput.value = hint.textContent;
        dom.chatMessageInput.dispatchEvent(new Event("input"));
        dom.chatMessageInput.focus();
      });
    });
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

    const avatar = document.createElement("span");
    avatar.className = "chat-message-avatar";
    avatar.textContent = role === "user" ? "U" : "A";
    label.append(avatar);

    const labelText = document.createTextNode(role === "user" ? "你" : "AI Hub");
    label.append(labelText);

    const bubble = document.createElement("div");
    bubble.className = "chat-message-bubble";
    if (role === "assistant" && !options.loading) {
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
    const messageItem = appendChatMessage(
      "assistant",
      "",
      "",
      { loading: true }
    );
    const bubble = messageItem.querySelector(".chat-message-bubble");
    bubble.textContent = "";
    const indicator = document.createElement("div");
    indicator.className = "chat-typing-indicator";
    indicator.innerHTML = "<span></span><span></span><span></span>";
    bubble.append(indicator);
    return messageItem;
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
    if (isLoading) {
      dom.sendChatButton.innerHTML = '<span class="spinner spinner--sm spinner--white"></span> 发送中';
      dom.chatMessageInput.disabled = true;
    } else {
      dom.sendChatButton.textContent = "发送";
      dom.chatMessageInput.disabled = false;
      resetTextareaHeight();
    }
    updateSendChatButtonState();
  }

  function autoResizeTextarea() {
    const ta = dom.chatMessageInput;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    updateCharCounter();
  }

  function resetTextareaHeight() {
    dom.chatMessageInput.style.height = "";
  }

  function initResizeHandle() {
    const handle = document.querySelector("#chat-resize-handle");
    const ta = dom.chatMessageInput;
    if (!handle || !ta) return;

    let startY, startHeight;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startY = e.clientY;
      startHeight = ta.offsetHeight;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    });

    function onMouseMove(e) {
      const delta = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + delta, 80), 200);
      ta.style.height = newHeight + "px";
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
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
    setTextStatus(dom.chatStatus, "正在查询知识库...", "idle");
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
        "已基于知识库内容生成回答。",
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
          "知识库问答功能未启用，请检查后端 AI 模型配置。",
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
    setTextStatus(dom.chatStatus, "正在发送消息...", "idle");
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
        "已收到回复。",
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
    autoResizeTextarea,
    initResizeHandle,
  };
}
