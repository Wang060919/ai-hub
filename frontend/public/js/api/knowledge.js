import {
  getTauriInvokeDirect,
  isTauriRuntime,
  normalizeErrorMessage,
  readJsonResponse,
  throwApiError,
  throwTauriApiError,
} from "./client.js";

export async function requestKnowledgeStatus(backendUrl) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("fetch_knowledge_status", { backendUrl });

      if (!payload.ok) {
        throwTauriApiError(payload, "/knowledge/status", null);
      }

      return payload.knowledge;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/knowledge/status failed"));
    }
  }

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
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("index_knowledge_file", {
        backendUrl,
        path,
        kbId,
      });

      if (!payload.ok) {
        throwTauriApiError(payload, "/knowledge/index-file", "index");
      }

      return payload;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/knowledge/index-file failed"));
    }
  }

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
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("index_knowledge_markdown_directory", {
        backendUrl,
        directory,
        kbId,
        recursive,
        forceReindex,
        maxFiles,
      });

      if (!payload.ok) {
        throwTauriApiError(payload, "/knowledge/index-markdown-directory", "summary");
      }

      return payload;
    } catch (error) {
      throw new Error(
        normalizeErrorMessage(error, "/knowledge/index-markdown-directory failed")
      );
    }
  }

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
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("search_knowledge", {
        backendUrl,
        query,
        kbId,
        topK,
      });

      if (!payload.ok) {
        throwTauriApiError(payload, "/knowledge/search", "search");
      }

      return payload;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/knowledge/search failed"));
    }
  }

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
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      const payload = await tauriInvoke("query_knowledge", {
        backendUrl,
        question,
        kbId,
        topK,
      });

      if (!payload.ok) {
        throwTauriApiError(payload, "/knowledge/query", "answer");
      }

      return payload;
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, "/knowledge/query failed"));
    }
  }

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
