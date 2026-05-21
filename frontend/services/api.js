const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

async function requestJson(path, options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || DEFAULT_API_BASE_URL);
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseJsonResponse(response, path);

  if (!response.ok) {
    const message = payload?.detail || payload?.reply || `${path} returned ${response.status}`;
    throw new Error(String(message));
  }

  return payload;
}

function normalizeBaseUrl(rawValue) {
  return String(rawValue || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

async function parseJsonResponse(response, path) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path} returned a non-JSON response`);
  }
}

export function getHealth(options = {}) {
  return requestJson("/health", options);
}

export function getVersion(options = {}) {
  return requestJson("/version", options);
}

export function getSkills(options = {}) {
  return requestJson("/skills", options);
}

export function sendChat(message, options = {}) {
  return requestJson("/chat", {
    ...options,
    method: "POST",
    body: { message },
  });
}
