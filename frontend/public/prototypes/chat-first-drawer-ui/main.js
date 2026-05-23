import { renderOrbitIcon } from "./components/orbitIcon.js";
import { createMockWorkspaceAdapter } from "./services/workspaceAdapter.js";

const adapter = createMockWorkspaceAdapter();

const state = {
  isSidebarOpen: false,
  isAssistantRunning: false,
  workspace: null,
  messages: [],
  sources: [],
  availableSources: [],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMessageText(text) {
  return escapeHtml(text)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
}

function renderDrawerPanels(panels) {
  const fileTypeRows = panels.localFiles.fileTypes
    .map(
      (item) => `
        <div class="file-type-row">
          <div class="file-type-meta">
            <span>${escapeHtml(item.label)}</span>
            <span>${escapeHtml(item.value)}</span>
          </div>
          <div class="file-type-bar">
            <span style="width:${item.width}%"></span>
          </div>
        </div>
      `
    )
    .join("");

  return `
    <section class="micro-panel">
      <div class="micro-panel__header">
        <h3>${escapeHtml(panels.knowledgeBase.title)}</h3>
      </div>
      <div class="micro-panel__kpi">
        <div>
          <strong>${escapeHtml(panels.knowledgeBase.filesLabel)}</strong>
          <span>${escapeHtml(panels.knowledgeBase.sizeLabel)}</span>
        </div>
        <div class="micro-panel__status-block">
          <div>${escapeHtml(panels.knowledgeBase.progressLabel)}</div>
          <div class="status success-dot">
            <span></span>
            ${escapeHtml(panels.knowledgeBase.statusLabel)}
          </div>
        </div>
      </div>
      <div class="micro-panel__list">
        ${panels.knowledgeBase.collections
          .map(
            (collection) => `
              <div class="micro-panel__list-row">
                <span>${escapeHtml(collection.label)}</span>
                <span>${escapeHtml(collection.count)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="micro-panel">
      <div class="micro-panel__header micro-panel__header--split">
        <h3>${escapeHtml(panels.localFiles.title)}</h3>
        <div class="micro-panel__actions">
          ${panels.localFiles.actions
            .map(
              (action) =>
                `<button type="button" class="ghost-action">${escapeHtml(action)}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="dropzone-panel">
        <strong>${escapeHtml(panels.localFiles.hint)}</strong>
        <span>${escapeHtml(panels.localFiles.supportText)}</span>
      </div>
      <div class="file-type-grid">${fileTypeRows}</div>
    </section>

    <section class="micro-panel">
      <div class="micro-panel__header">
        <h3>${escapeHtml(panels.markdownNotes.title)}</h3>
      </div>
      <div class="micro-panel__text-line">${escapeHtml(
        panels.markdownNotes.statusLine
      )}</div>
      <div class="status success-dot">
        <span></span>
        ${escapeHtml(panels.markdownNotes.connectionLabel)}
      </div>
      <div class="micro-panel__list">
        ${panels.markdownNotes.notes
          .map((note) => `<div>${escapeHtml(note)}</div>`)
          .join("")}
      </div>
    </section>

    <section class="micro-panel">
      <div class="micro-panel__header">
        <h3>${escapeHtml(panels.localServices.title)}</h3>
      </div>
      <div class="micro-panel__list">
        ${panels.localServices.items
          .map(
            (item) => `
              <div class="micro-panel__list-row">
                <span>${escapeHtml(item.label)}</span>
                <span class="${
                  item.tone === "success"
                    ? "status"
                    : item.tone === "link"
                      ? "link-tone"
                      : ""
                }">
                  ${escapeHtml(item.value)}
                </span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSources() {
  return state.sources
    .map(
      (source) => `
        <span class="source-chip ${
          source.style === "soft" ? "source-chip--soft" : ""
        }">
          ${escapeHtml(source.label)}
        </span>
      `
    )
    .join("");
}

function renderMessages() {
  return state.messages
    .map((message) => {
      if (message.role === "user") {
        return `
          <div class="message-row message-row--user">
            <article class="message-bubble message-bubble--user">
              <p>${formatMessageText(message.text)}</p>
              <div class="message-meta">${escapeHtml(message.timestamp)}</div>
            </article>
          </div>
        `;
      }

      const attachment = message.attachment
        ? `
            <div class="message-attachment">
              <strong>${escapeHtml(message.attachment.title)}</strong>
              <span>${escapeHtml(message.attachment.meta)}</span>
            </div>
          `
        : "";

      const loading = message.pending
        ? `<div class="assistant-loading">Scanning mounted local context…</div>`
        : "";

      return `
        <div class="message-row">
          <div class="assistant-avatar">
            ${renderOrbitIcon({
              variant: "line",
              size: "avatar",
              animated: Boolean(message.pending),
            })}
          </div>
          <article class="message-bubble">
            <p>${formatMessageText(message.text)}</p>
            ${attachment}
            ${loading}
            <div class="message-meta">${escapeHtml(message.timestamp)}</div>
          </article>
        </div>
      `;
    })
    .join("");
}

function renderApp() {
  const root = document.querySelector("#app");
  const { app, workspace, drawerPanels } = state.workspace;

  root.innerHTML = `
    <section class="workspace-shell">
      <section class="workspace-window ${state.isSidebarOpen ? "is-drawer-open" : ""}">
        <header class="workspace-window__topbar">
          <div class="workspace-window__brand">
            ${renderOrbitIcon({ variant: "app", size: "app-badge" })}
            <div class="workspace-window__brand-copy">
              <span class="workspace-window__title">${escapeHtml(app.title)}</span>
              <span class="workspace-window__subtitle">${escapeHtml(
                workspace.activeContextLabel
              )}</span>
            </div>
          </div>
          <div class="workspace-window__chrome">
            <button type="button" class="toolbar-pill">${escapeHtml(
              workspace.modelLabel
            )}</button>
            <button type="button" class="toolbar-icon" aria-label="Workspace settings">⚙</button>
          </div>
        </header>

        <div class="workspace-layout">
          <aside class="data-sources-drawer" aria-label="Data sources drawer">
            <div class="data-sources-drawer__inner">
              ${renderDrawerPanels(drawerPanels)}
            </div>
          </aside>

          <section class="chat-workspace">
            <div class="chat-workspace__header chat-rail">
              <button id="drawer-toggle" type="button" class="drawer-toggle">
                ☰ Data Sources
              </button>
              <div class="chat-workspace__actions">
                <button type="button" class="toolbar-pill toolbar-pill--subtle">Model</button>
                <button type="button" class="toolbar-icon" aria-label="More options">⋯</button>
              </div>
            </div>

            <div class="chat-workspace__date chat-rail">May 23, 2026</div>
            <div class="messages-stack chat-rail">${renderMessages()}</div>

            <div class="context-bar chat-rail">
              <div class="context-bar__left">
                <span class="context-bar__label">Context:</span>
                ${renderSources()}
                <button id="add-source" type="button" class="context-button context-button--ghost">+ Add</button>
              </div>
              <div class="context-bar__right">
                <button type="button" class="context-button">${state.sources.length} Sources</button>
                <button id="clear-sources" type="button" class="context-button context-button--icon" aria-label="Clear sources">×</button>
              </div>
            </div>

            <form id="chat-form" class="chat-input-shell chat-rail">
              <label class="sr-only" for="chat-input">Message</label>
              <textarea
                id="chat-input"
                class="chat-input"
                rows="3"
                placeholder="${escapeHtml(workspace.promptPlaceholder)}"
              ></textarea>
              <div class="chat-input-shell__actions">
                <button type="button" class="attach-button" aria-label="Attach local file">⌁</button>
                <button type="submit" class="send-button" ${
                  state.isAssistantRunning ? "disabled" : ""
                }>➤</button>
              </div>
            </form>

            <footer class="footer-status">
              <span>${escapeHtml(workspace.privacyLabel)}</span>
              <span class="footer-status__separator">|</span>
              <span>Status:</span>
              <span class="online-dot" aria-hidden="true"></span>
              <span>${escapeHtml(workspace.privacyStatus)}</span>
            </footer>
          </section>
        </div>
      </section>
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  const drawerToggle = document.querySelector("#drawer-toggle");
  const addSourceButton = document.querySelector("#add-source");
  const clearSourcesButton = document.querySelector("#clear-sources");
  const chatForm = document.querySelector("#chat-form");
  const chatInput = document.querySelector("#chat-input");

  drawerToggle?.addEventListener("click", () => {
    state.isSidebarOpen = !state.isSidebarOpen;
    renderApp();
  });

  addSourceButton?.addEventListener("click", () => {
    const nextSource = state.availableSources.shift();
    if (!nextSource) {
      return;
    }

    state.sources = [...state.sources, nextSource];
    renderApp();
  });

  clearSourcesButton?.addEventListener("click", () => {
    state.availableSources = [...state.availableSources, ...state.sources];
    state.sources = [];
    renderApp();
  });

  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const inputValue = chatInput?.value.trim() ?? "";
    if (!inputValue || state.isAssistantRunning) {
      return;
    }

    const timestamp = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());

    state.messages = [
      ...state.messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: inputValue,
        timestamp,
      },
      {
        id: `pending-${Date.now()}`,
        role: "assistant",
        text: "Using mounted local sources to prepare a response.",
        timestamp,
        pending: true,
      },
    ];
    state.isAssistantRunning = true;
    renderApp();

    const reply = await adapter.sendMessage(inputValue);
    state.messages = [...state.messages.filter((message) => !message.pending), reply];
    state.isAssistantRunning = false;
    renderApp();
  });
}

async function bootstrap() {
  state.workspace = await adapter.getWorkspaceState();
  state.messages = structuredClone(state.workspace.messages);
  state.sources = structuredClone(state.workspace.contextSources);
  state.availableSources = structuredClone(state.workspace.availableSources);
  renderApp();
}

bootstrap();
