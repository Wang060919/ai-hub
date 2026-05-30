/**
 * Conversation manager — multi-session with localStorage persistence.
 * Inspired by Chatbox/LobeChat conversation sidebar patterns.
 */

const STORAGE_KEY = "aihub-conversations";

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {}
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function summarizeLabel(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "新会话";
  return first.content.slice(0, 30) + (first.content.length > 30 ? "..." : "");
}

export function createConversationManager(deps) {
  const { onSwitch, onNew } = deps;

  let conversations = loadConversations();
  let activeId = null;

  // Ensure at least one conversation
  if (conversations.length === 0) {
    const id = generateId();
    conversations = [{ id, label: "新会话", messages: [], createdAt: Date.now() }];
    saveConversations(conversations);
  }

  activeId = conversations[0].id;

  const listEl = document.querySelector("#conversations-list");
  const newBtn = document.querySelector("#new-conversation-btn");

  function render() {
    if (!listEl) return;
    listEl.innerHTML = "";

    conversations.forEach((conv) => {
      const item = document.createElement("button");
      item.className = "chat-conversation-item" + (conv.id === activeId ? " active" : "");
      item.type = "button";

      const label = document.createElement("span");
      label.className = "chat-conversation-item-label";
      label.textContent = conv.label;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "chat-conversation-item-delete";
      deleteBtn.type = "button";
      deleteBtn.textContent = "×";
      deleteBtn.title = "删除会话";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      item.append(label, deleteBtn);
      item.addEventListener("click", () => switchTo(conv.id));
      listEl.append(item);
    });
  }

  function switchTo(id) {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    activeId = id;
    render();
    if (onSwitch) onSwitch(conv);
  }

  function createNew() {
    const id = generateId();
    const conv = { id, label: "新会话", messages: [], createdAt: Date.now() };
    conversations.unshift(conv);
    saveConversations(conversations);
    activeId = id;
    render();
    if (onNew) onNew(conv);
    if (onSwitch) onSwitch(conv);
  }

  function deleteConversation(id) {
    conversations = conversations.filter((c) => c.id !== id);
    if (conversations.length === 0) {
      const newId = generateId();
      conversations = [{ id: newId, label: "新会话", messages: [], createdAt: Date.now() }];
    }
    saveConversations(conversations);
    if (activeId === id) {
      activeId = conversations[0].id;
      const conv = conversations.find((c) => c.id === activeId);
      if (onSwitch) onSwitch(conv);
    }
    render();
  }

  function saveCurrentMessages(messages) {
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    conv.messages = messages;
    if (messages.length > 0 && conv.label === "新会话") {
      conv.label = summarizeLabel(messages);
    }
    saveConversations(conversations);
    render();
  }

  function getActive() {
    return conversations.find((c) => c.id === activeId);
  }

  function getActiveMessages() {
    const conv = getActive();
    return conv ? conv.messages : [];
  }

  // Wire up new button
  if (newBtn) {
    newBtn.addEventListener("click", createNew);
  }

  render();

  return {
    createNew,
    switchTo,
    saveCurrentMessages,
    getActive,
    getActiveMessages,
    render,
  };
}
