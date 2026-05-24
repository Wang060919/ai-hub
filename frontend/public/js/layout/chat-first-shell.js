/**
 * Desktop App Shell — page navigation and connection indicator.
 * V2.4: simplified from the old drawer/context/footer shell.
 */

function setActivePage(pageId) {
  document.querySelectorAll(".desktop-page").forEach((p) => {
    p.classList.toggle("active", p.id === `page-${pageId}`);
  });

  document.querySelectorAll(".sidebar-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
}

function setConnectionStatus(status) {
  const dot = document.querySelector("#sidebar-connection-dot");
  const label = document.querySelector("#sidebar-connection-label");
  if (!dot || !label) return;

  dot.className = `sidebar-connection-dot ${status}`;
  label.textContent = status === "connected" ? "已连接" : status === "error" ? "连接失败" : "空闲";
}

function bindWindowControls() {
  const currentWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  const buttons = document.querySelectorAll("[data-window-action]");

  if (!currentWindow) {
    buttons.forEach((btn) => {
      btn.disabled = true;
    });
    return;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.windowAction;

      if (action === "minimize") {
        currentWindow.minimize();
      } else if (action === "toggle-maximize") {
        currentWindow.toggleMaximize();
      } else if (action === "close") {
        currentWindow.close();
      }
    });
  });
}

function bindTitlebarDrag() {
  const currentWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  if (!currentWindow?.startDragging) return;

  document.querySelectorAll(".app-titlebar, .app-titlebar-brand, .app-titlebar-drag").forEach((area) => {
    area.addEventListener("pointerdown", async (event) => {
      if (event.target.closest(".app-titlebar-actions, .app-titlebar-controls, button")) return;
      await currentWindow.startDragging();
    });
  });
}

export function createDesktopShell({ dom, state, actions }) {
  function navigateTo(page) {
    state.activePage = page;
    setActivePage(page);
  }

  function setConnected(connected, hasError) {
    if (hasError) {
      setConnectionStatus("error");
    } else if (connected) {
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("idle");
    }
  }

  function syncAll() {
    setConnected(state.hasCheckedBackend, false);
  }

  function bindEvents() {
    document.querySelectorAll(".sidebar-nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        navigateTo(page);
      });
    });

    bindWindowControls();
    bindTitlebarDrag();
  }

  return {
    bindEvents,
    navigateTo,
    setConnected,
    syncAll,
  };
}
