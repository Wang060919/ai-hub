import { requestChat } from "../api/chat.js";
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

  function resetChatResult() {
    dom.chatMessages.innerHTML =
      '<div class="chat-empty-state">Send a message to start the Echo chat loop.</div>';
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
      "Waiting for /chat response ...",
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

  async function sendChat() {
    if (state.chatSending) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const message = dom.chatMessageInput.value.trim();

    if (!message) {
      setTextStatus(dom.chatStatus, "Message cannot be empty", "error");
      updateSendChatButtonState();
      return;
    }

    appendChatMessage("user", message);
    const contextMessages = buildChatContextMessages(message);
    dom.chatMessageInput.value = "";
    updateSendChatButtonState();
    setChatLoading(true);
    setTextStatus(dom.chatStatus, "Sending /chat request ...", "idle");
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
        `Chat response received from ${payload.backendUrl}`,
        "success"
      );
    } catch (error) {
      removeChatLoading(loadingMessage);
      renderChatError(
        error instanceof Error ? error.message : "Chat request failed"
      );
      setTextStatus(
        dom.chatStatus,
        error instanceof Error ? error.message : "Chat request failed",
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
  };
}
