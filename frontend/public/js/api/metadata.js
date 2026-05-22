import {
  isTauriRuntime,
  normalizeErrorMessage,
  readJsonResponse,
  getTauriInvokeDirect,
} from "./client.js";

const startupCommand =
  "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000";
const backendUnavailableMessage =
  `无法连接后端。这通常是因为 FastAPI 还没有手动启动，不是桌面端坏了。请先在 PowerShell 中运行：${startupCommand}`;

export async function requestMetadata(backendUrl) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      return await tauriInvoke("fetch_backend_metadata", { backendUrl });
    } catch (error) {
      const details = normalizeErrorMessage(error, backendUnavailableMessage);
      return {
        ok: false,
        error: details.includes("Backend URL")
          ? details
          : backendUnavailableMessage,
        details,
      };
    }
  }

  const response = await fetch("/api/metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl }),
  });

  return readJsonResponse(response);
}
