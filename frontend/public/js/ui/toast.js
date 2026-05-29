/**
 * Toast notification system — factory pattern.
 * @param {HTMLElement} containerEl — the toast container element
 */
export function createToastManager(containerEl) {
  if (!containerEl) return { show() {}, clear() {} };

  function show(message, type = "info", durationMs) {
    const durations = { success: 3000, error: 5000, info: 3500 };
    const ms = durationMs ?? durations[type] ?? 3500;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;

    containerEl.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add("show");
      });
    });

    const timer = setTimeout(() => dismiss(toast), ms);
    toast.addEventListener("click", () => {
      clearTimeout(timer);
      dismiss(toast);
    });
  }

  function dismiss(toast) {
    if (toast._dismissing) return;
    toast._dismissing = true;
    toast.classList.remove("show");
    toast.classList.add("exit");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }

  function clear() {
    containerEl.innerHTML = "";
  }

  return { show, clear };
}
