import {
  isTauriRuntime,
  normalizeErrorMessage,
  readJsonResponse,
  getTauriInvokeDirect,
} from "./client.js";

export async function requestChat(backendUrl, message, messages = []) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      return await tauriInvoke("send_chat_message", { backendUrl, message });
    } catch (error) {
      const details = normalizeErrorMessage(error, "Chat request failed");
      const isInputError =
        details.includes("Backend URL") ||
        details.includes("Message cannot be empty");

      return {
        ok: false,
        error: isInputError ? details : "Chat request failed",
        details,
      };
    }
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, message, messages }),
  });

  return readJsonResponse(response);
}
