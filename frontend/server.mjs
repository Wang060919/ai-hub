import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const publicDir = join(projectRoot, "frontend", "public");
const distDir = join(projectRoot, "frontend", "dist");
const preferredRoot = existsSync(distDir) ? distDir : publicDir;
const host = process.env.AI_HUB_FRONTEND_HOST || "127.0.0.1";
const port = Number(process.env.AI_HUB_FRONTEND_PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};
const backendUnavailableMessage =
  "\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef\uff0c\u8bf7\u5148\u542f\u52a8 FastAPI \u670d\u52a1";

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf-8")));
    request.on("error", rejectBody);
  });
}

function normalizeBackendUrl(rawValue) {
  const trimmedValue = String(rawValue || "").trim();
  if (!trimmedValue) {
    throw new Error("Backend URL cannot be empty");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error("Backend URL is invalid. Use a value like http://127.0.0.1:8000");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Backend URL must start with http:// or https://");
  }

  parsedUrl.pathname = "";
  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.toString().replace(/\/$/, "");
}

async function fetchJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

async function postJson(baseUrl, path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let jsonPayload = null;

  if (rawText) {
    try {
      jsonPayload = JSON.parse(rawText);
    } catch {
      throw new Error(`${path} returned a non-JSON response`);
    }
  }

  if (!response.ok) {
    const message =
      jsonPayload?.detail ||
      jsonPayload?.reply ||
      `${path} returned ${response.status}`;
    throw new Error(String(message));
  }

  return jsonPayload ?? {};
}

async function postJsonWithStatus(baseUrl, path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let jsonPayload = null;

  if (rawText) {
    try {
      jsonPayload = JSON.parse(rawText);
    } catch {
      throw new Error(`${path} returned a non-JSON response`);
    }
  }

  return {
    statusCode: response.status,
    payload: jsonPayload ?? {},
  };
}

async function fetchJsonWithStatus(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const rawText = await response.text();
  let jsonPayload = null;

  if (rawText) {
    try {
      jsonPayload = JSON.parse(rawText);
    } catch {
      throw new Error(`${path} returned a non-JSON response`);
    }
  }

  return {
    statusCode: response.status,
    payload: jsonPayload ?? {},
  };
}

async function handleMetadataProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);

    const [health, version, skills] = await Promise.all([
      fetchJson(baseUrl, "/health"),
      fetchJson(baseUrl, "/version"),
      fetchJson(baseUrl, "/skills"),
    ]);

    sendJson(response, 200, {
      ok: true,
      backendUrl: baseUrl,
      health,
      version,
      skills,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: message.includes("Backend URL") ? message : backendUnavailableMessage,
      details: message,
    });
  }
}

async function handleChatProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const message = String(payload.message || "").trim();
    const messages = Array.isArray(payload.messages)
      ? payload.messages
          .filter(
            (item) =>
              item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string"
          )
          .map((item) => ({
            role: item.role,
            content: item.content,
          }))
      : undefined;

    if (!message) {
      sendJson(response, 400, {
        ok: false,
        error: "Message cannot be empty",
      });
      return;
    }

    const chatPayload = messages ? { message, messages } : { message };
    const chat = await postJson(baseUrl, "/chat", chatPayload);

    sendJson(response, 200, {
      ok: true,
      backendUrl: baseUrl,
      chat,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    const isInputError =
      message.includes("Backend URL") || message.includes("Message cannot be empty");

    sendJson(response, isInputError ? 400 : 502, {
      ok: false,
      error: isInputError ? message : "Chat request failed",
      details: message,
    });
  }
}

async function handleFilePreviewProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const path = String(payload.path || "").trim();
    const previewChars = Number(payload.preview_chars);

    if (!path) {
      sendJson(response, 400, {
        ok: false,
        error: {
          code: "PATH_NOT_ALLOWED",
          message: "File path cannot be empty",
        },
      });
      return;
    }

    const previewPayload = { path };
    if (Number.isFinite(previewChars)) {
      previewPayload.preview_chars = previewChars;
    }

    const result = await postJsonWithStatus(baseUrl, "/files/preview", previewPayload);
    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      preview: result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
    });
  }
}

async function handleFileSummarizeProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const path = String(payload.path || "").trim();
    const maxInputChars = Number(payload.max_input_chars);

    if (!path) {
      sendJson(response, 400, {
        ok: false,
        error: {
          code: "PATH_NOT_ALLOWED",
          message: "File path cannot be empty",
        },
      });
      return;
    }

    const summarizePayload = { path };
    if (Number.isFinite(maxInputChars)) {
      summarizePayload.max_input_chars = maxInputChars;
    }

    const result = await postJsonWithStatus(
      baseUrl,
      "/files/summarize",
      summarizePayload,
    );
    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      summary: result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
    });
  }
}

async function handleKnowledgeStatusProxy(request, response, requestUrl) {
  try {
    const baseUrl = normalizeBackendUrl(requestUrl.searchParams.get("backendUrl"));
    const result = await fetchJsonWithStatus(baseUrl, "/knowledge/status");

    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      ...result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
      details: message,
    });
  }
}

async function handleKnowledgeIndexFileProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const path = String(payload.path || "").trim();
    const kbId = String(payload.kb_id || "default").trim() || "default";

    if (!path) {
      sendJson(response, 400, {
        ok: false,
        error: {
          code: "PATH_NOT_ALLOWED",
          message: "File path cannot be empty",
        },
      });
      return;
    }

    const result = await postJsonWithStatus(baseUrl, "/knowledge/index-file", {
      path,
      kb_id: kbId,
    });

    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      ...result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
      details: message,
    });
  }
}

async function handleKnowledgeSearchProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const query = String(payload.query || "").trim();
    const kbId = String(payload.kb_id || "default").trim() || "default";
    const topK = Number(payload.top_k);

    if (!query) {
      sendJson(response, 400, {
        ok: false,
        error: {
          code: "INVALID_QUERY",
          message: "Query cannot be empty",
        },
      });
      return;
    }

    const result = await postJsonWithStatus(baseUrl, "/knowledge/search", {
      query,
      kb_id: kbId,
      top_k: Number.isFinite(topK) && topK >= 1 ? Math.floor(topK) : 4,
    });

    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      ...result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
      details: message,
    });
  }
}

async function handleKnowledgeQueryProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const baseUrl = normalizeBackendUrl(payload.backendUrl);
    const question = String(payload.question || "").trim();
    const kbId = String(payload.kb_id || "default").trim() || "default";
    const topK = Number(payload.top_k);

    if (!question) {
      sendJson(response, 400, {
        ok: false,
        error: {
          code: "INVALID_QUESTION",
          message: "Question cannot be empty",
        },
      });
      return;
    }

    const result = await postJsonWithStatus(baseUrl, "/knowledge/query", {
      question,
      kb_id: kbId,
      top_k: Number.isFinite(topK) && topK >= 1 ? Math.floor(topK) : 4,
    });

    sendJson(response, result.statusCode, {
      ok: result.statusCode >= 200 && result.statusCode < 300,
      backendUrl: baseUrl,
      ...result.payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : backendUnavailableMessage;

    sendJson(response, 502, {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message,
      },
      details: message,
    });
  }
}

function serveStaticFile(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = resolve(preferredRoot, `.${normalize(safePath)}`);

  if (!resolvedPath.startsWith(preferredRoot) || !existsSync(resolvedPath) || statSync(resolvedPath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  const extension = extname(resolvedPath);
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(resolvedPath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/metadata") {
    await handleMetadataProxy(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
    await handleChatProxy(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/files/preview") {
    await handleFilePreviewProxy(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/files/summarize") {
    await handleFileSummarizeProxy(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/knowledge/status") {
    await handleKnowledgeStatusProxy(request, response, requestUrl);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/knowledge/index-file") {
    await handleKnowledgeIndexFileProxy(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/knowledge/search") {
    await handleKnowledgeSearchProxy(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/knowledge/query") {
    await handleKnowledgeQueryProxy(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStaticFile(requestUrl.pathname, response);
    return;
  }

  response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Method Not Allowed");
});

server.listen(port, host, () => {
  console.log(`AI Hub Desktop Shell is available at http://${host}:${port}`);
});
