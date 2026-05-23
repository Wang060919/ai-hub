import {
  getTauriInvokeDirect,
  isTauriRuntime,
  normalizeErrorMessage,
  readJsonResponse,
  throwApiError,
  throwTauriApiError,
} from "./client.js";

export async function requestFilePreview(backendUrl, path) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("preview_file", { backendUrl, path });

      if (!payload.ok) {
        throwTauriApiError(payload, "/files/preview", "preview");
      }

      return payload;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/files/preview failed"));
    }
  }

  const response = await fetch("/api/files/preview", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/files/preview", "preview");
  }

  return payload.preview;
}

export async function requestFileSummary(backendUrl, path) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("summarize_file", { backendUrl, path });

      if (!payload.ok) {
        throwTauriApiError(payload, "/files/summarize", "summary");
      }

      return payload;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/files/summarize failed"));
    }
  }

  const response = await fetch("/api/files/summarize", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/files/summarize", "summary");
  }

  return payload.summary;
}
