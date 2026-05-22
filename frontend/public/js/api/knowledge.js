import { readJsonResponse, throwApiError } from "./client.js";

export async function requestKnowledgeStatus(backendUrl) {
  const response = await fetch(
    `/api/knowledge/status?backendUrl=${encodeURIComponent(backendUrl)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/knowledge/status", null);
  }

  return payload.knowledge;
}

export async function requestKnowledgeIndexFile(backendUrl, path, kbId) {
  const response = await fetch("/api/knowledge/index-file", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path, kb_id: kbId }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/knowledge/index-file", "index");
  }

  return payload;
}

export async function requestKnowledgeIndexMarkdownDirectory(
  backendUrl,
  directory,
  kbId,
  recursive,
  forceReindex,
  maxFiles
) {
  const response = await fetch("/api/knowledge/index-markdown-directory", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      backendUrl,
      directory,
      kb_id: kbId,
      recursive,
      force_reindex: forceReindex,
      max_files: maxFiles,
    }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/knowledge/index-markdown-directory", "summary");
  }

  return payload;
}

export async function requestKnowledgeSearch(backendUrl, query, kbId, topK) {
  const response = await fetch("/api/knowledge/search", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, query, kb_id: kbId, top_k: topK }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/knowledge/search", "search");
  }

  return payload;
}

export async function requestKnowledgeQuery(backendUrl, question, kbId, topK) {
  const response = await fetch("/api/knowledge/query", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, question, kb_id: kbId, top_k: topK }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/knowledge/query", "answer");
  }

  return payload;
}
