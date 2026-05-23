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
  }

  return {
    bindEvents,
    navigateTo,
    setConnected,
    syncAll,
  };
}
