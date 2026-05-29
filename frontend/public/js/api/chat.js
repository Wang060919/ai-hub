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

export async function requestChatStream(
  backendUrl,
  message,
  messages,
  { onToken, onDone, onError, signal }
) {
  if (isTauriRuntime()) {
    try {
      const result = await requestChat(backendUrl, message, messages);
      if (!result.ok) {
        onError(result.details || result.error || "Chat request failed");
        return;
      }
      const chat = result.chat || {};
      if (chat.status === "error") {
        onError(chat.reply || "Chat request failed");
        return;
      }
      onToken(chat.reply || "");
      onDone({ skill: chat.skill, status: chat.status });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Chat request failed");
    }
    return;
  }

  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ backendUrl, message, messages }),
    signal,
  });

  if (!response.ok) {
    onError(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastToken = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        let event;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        if (event.type === "token") {
          const content = event.content || "";
          if (content && content !== lastToken) {
            lastToken = content;
            onToken(content);
          }
        } else if (event.type === "done") {
          onDone(event);
        } else if (event.type === "error") {
          onError(event.message || "Stream error");
        }
      }
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    onError(error instanceof Error ? error.message : "Stream read failed");
  }
}
