import { escapeHtml } from "../core/utils.js";

export function renderErrorBox(container, error, fallbackMessage = "Request failed") {
  const code = error?.code || "REQUEST_FAILED";
  const message = error instanceof Error ? error.message : fallbackMessage;

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="file-preview-error">
      <strong>${escapeHtml(code)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
