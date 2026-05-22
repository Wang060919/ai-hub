function getTauriInvoke() {
  return window.__TAURI__?.core?.invoke;
}

export function isTauriRuntime() {
  return typeof getTauriInvoke() === "function";
}

export function normalizeErrorMessage(error, fallbackMessage) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function readJsonResponse(response) {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Proxy returned a non-JSON response");
  }
}

export function throwApiError(response, payload, operationName, nestedKey) {
  const nestedError = nestedKey ? payload?.[nestedKey]?.error : undefined;

  const code =
    payload?.error?.code ||
    nestedError?.code ||
    `HTTP_${response.status}`;

  const message =
    payload?.error?.message ||
    nestedError?.message ||
    payload?.details ||
    `${code}: ${operationName} failed`;

  const error = new Error(message);
  error.code = code;
  throw error;
}

export function getTauriInvokeDirect() {
  return getTauriInvoke();
}
