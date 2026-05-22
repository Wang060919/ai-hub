import { escapeHtml } from "../core/utils.js";
import { setTextStatus } from "../ui/status.js";
import { setButtonLoading } from "../ui/loading.js";
import { renderErrorBox } from "../ui/error.js";
import {
  requestKnowledgeStatus,
  requestKnowledgeIndexFile,
  requestKnowledgeIndexMarkdownDirectory,
  requestKnowledgeSearch,
  requestKnowledgeQuery,
} from "../api/knowledge.js";

function normalizeTopK(input, fallback = 4) {
  const value = Number(input?.value);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

function renderKnowledgeStatus(dom, payload) {
  const knowledge = payload || {};

  dom.knowledgeStatusResult.classList.remove("hidden");
  dom.knowledgeStatusResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>files_count</span>
        <strong>${escapeHtml(knowledge.files_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>chunks_count</span>
        <strong>${escapeHtml(knowledge.chunks_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(knowledge.index_method || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>markdown_files_count</span>
        <strong>${escapeHtml(knowledge.markdown_files_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>fts_enabled</span>
        <strong>${escapeHtml(String(Boolean(knowledge.fts_enabled)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>fts_available</span>
        <strong>${escapeHtml(String(Boolean(knowledge.fts_available)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>enabled</span>
        <strong>${escapeHtml(String(Boolean(knowledge.enabled)))}</strong>
      </div>
    </div>
  `;
}

function normalizePositiveInteger(input, fallback, minValue = 1, maxValue = 200) {
  const value = Number(input?.value);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(minValue, Math.min(maxValue, Math.floor(value)));
}

function renderKnowledgeIndexResult(dom, payload) {
  const file = payload?.file || {};
  const index = payload?.index || {};

  dom.knowledgeIndexResult.classList.remove("hidden");
  dom.knowledgeIndexResult.innerHTML = `
    <div class="knowledge-index-result-heading">
      <p class="field-label">Markdown / Obsidian 单篇笔记入库结果</p>
    </div>
    <div class="file-preview-meta">
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>chunk_count</span>
        <strong>${escapeHtml(index.chunk_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>reused_existing</span>
        <strong>${escapeHtml(String(Boolean(index.reused_existing)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>replaced_existing</span>
        <strong>${escapeHtml(String(Boolean(index.replaced_existing)))}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(index.index_method || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>kb_id</span>
        <strong>${escapeHtml(file.kb_id || "-")}</strong>
      </div>
    </div>
  `;
}

function renderKnowledgeDirectoryIndexResult(dom, payload) {
  const summary = payload?.summary || {};
  const errors = Array.isArray(payload?.errors) ? payload.errors.slice(0, 5) : [];
  const results = Array.isArray(payload?.results) ? payload.results.slice(0, 8) : [];

  dom.knowledgeDirectoryIndexResult.classList.remove("hidden");
  dom.knowledgeDirectoryIndexResult.innerHTML = `
    <div class="knowledge-index-result-heading">
      <p class="field-label">Markdown 目录手动批量入库结果</p>
    </div>
    <div class="file-preview-meta">
      <div class="file-preview-meta-item wide">
        <span>directory</span>
        <strong>${escapeHtml(payload?.directory || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>matched_files</span>
        <strong>${escapeHtml(summary.matched_files ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>indexed_files</span>
        <strong>${escapeHtml(summary.indexed_files ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>reused_files</span>
        <strong>${escapeHtml(summary.reused_files ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>failed_files</span>
        <strong>${escapeHtml(summary.failed_files ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>skipped_files</span>
        <strong>${escapeHtml(summary.skipped_files ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>kb_id</span>
        <strong>${escapeHtml(payload?.kb_id || "-")}</strong>
      </div>
    </div>
    <div class="summary-result-panel">
      <div>
        <p class="field-label">已处理结果（最多展示 8 条）</p>
        ${
          results.length === 0
            ? '<div class="file-summary-text">results=[]</div>'
            : `
              <ol class="knowledge-hit-list">
                ${results
                  .map(
                    (item) => `
                      <li class="knowledge-hit-card">
                        <strong>${escapeHtml(item.path || "-")}</strong>
                        <p class="knowledge-hit-meta">
                          status=${escapeHtml(item.status || "-")} | chunk_count=${escapeHtml(
                            item.chunk_count ?? "-"
                          )} | reused_existing=${escapeHtml(String(Boolean(item.reused_existing)))}
                        </p>
                        ${
                          item.error_code || item.error_message
                            ? `<pre class="knowledge-hit-content">${escapeHtml(
                                `${item.error_code || "ERROR"}: ${item.error_message || ""}`
                              )}</pre>`
                            : ""
                        }
                      </li>
                    `
                  )
                  .join("")}
              </ol>
            `
        }
      </div>
      <div>
        <p class="field-label">失败摘要（最多展示 5 条）</p>
        ${
          errors.length === 0
            ? '<div class="file-summary-text">errors=[]</div>'
            : `
              <ol class="knowledge-citation-list">
                ${errors
                  .map(
                    (error) => `
                      <li class="knowledge-citation-card">
                        <strong>${escapeHtml(error.path || "-")}</strong>
                        <p class="knowledge-citation-meta">
                          ${escapeHtml(error.code || "ERROR")}
                        </p>
                        <p class="knowledge-hit-content">${escapeHtml(error.message || "")}</p>
                      </li>
                    `
                  )
                  .join("")}
              </ol>
            `
        }
      </div>
    </div>
  `;
}

function renderKnowledgeHits(hits) {
  if (!Array.isArray(hits) || hits.length === 0) {
    return `<div class="file-summary-text">hits=[]</div>`;
  }

  return `
    <ol class="knowledge-hit-list">
      ${hits
        .map(
          (hit) => `
            <li class="knowledge-hit-card">
              <strong>${escapeHtml(hit.relative_path || "-")}</strong>
              <p class="knowledge-hit-meta">
                chunk_index=${escapeHtml(hit.chunk_index ?? "-")} | score=${escapeHtml(
                  hit.score ?? "-"
                )}
              </p>
              <pre class="knowledge-hit-content">${escapeHtml(hit.content || "")}</pre>
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

function renderKnowledgeSearchResult(dom, payload) {
  const search = payload?.search || {};

  dom.knowledgeSearchResult.classList.remove("hidden");
  dom.knowledgeSearchResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>query</span>
        <strong>${escapeHtml(search.query || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>top_k</span>
        <strong>${escapeHtml(search.top_k ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>hits_count</span>
        <strong>${escapeHtml(search.hits_count ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>kb_id</span>
        <strong>${escapeHtml(search.kb_id || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>index_method</span>
        <strong>${escapeHtml(search.index_method || "-")}</strong>
      </div>
    </div>
    ${renderKnowledgeHits(payload?.hits)}
  `;
}

function renderKnowledgeQueryResult(dom, payload) {
  const answer = payload?.answer || {};
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];

  dom.knowledgeQueryResult.classList.remove("hidden");
  dom.knowledgeQueryResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>model</span>
        <strong>${escapeHtml(answer.model || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>grounded</span>
        <strong>${escapeHtml(String(Boolean(answer.grounded)))}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>answer.text</span>
        <strong class="knowledge-answer-text">${escapeHtml(answer.text || "")}</strong>
      </div>
    </div>
    <div class="summary-result-panel">
      <div>
        <p class="field-label">citations</p>
        ${
          citations.length === 0
            ? '<div class="file-summary-text">citations=[]</div>'
            : `
              <ol class="knowledge-citation-list">
                ${citations
                  .map(
                    (citation) => `
                      <li class="knowledge-citation-card">
                        <strong>[${escapeHtml(citation.index ?? "-")}] ${escapeHtml(
                          citation.relative_path || "-"
                        )}</strong>
                        <p class="knowledge-citation-meta">
                          chunk_id=${escapeHtml(citation.chunk_id ?? "-")} | chunk_index=${escapeHtml(
                            citation.chunk_index ?? "-"
                          )}
                        </p>
                      </li>
                    `
                  )
                  .join("")}
              </ol>
            `
        }
      </div>
      <div>
        <p class="field-label">hits</p>
        ${renderKnowledgeHits(payload?.hits)}
      </div>
    </div>
  `;
}

function createUpdateKnowledgeButtonState(dom, state) {
  return function updateKnowledgeButtonState() {
    const knowledgeDirectoryIndexPathInput =
      dom.knowledgeDirectoryIndexPathInput || document.querySelector("#knowledge-directory-index-path");
    const knowledgeDirectoryIndexSubmitButton =
      dom.knowledgeDirectoryIndexSubmitButton || document.querySelector("#knowledge-directory-index-submit");

    dom.refreshKnowledgeStatusButton.disabled = state.knowledgeStatusLoading;
    dom.knowledgeIndexSubmitButton.disabled =
      state.knowledgeIndexLoading || !dom.knowledgeIndexPathInput.value.trim();
    if (knowledgeDirectoryIndexSubmitButton && knowledgeDirectoryIndexPathInput) {
      knowledgeDirectoryIndexSubmitButton.disabled =
        state.knowledgeDirectoryIndexLoading || !knowledgeDirectoryIndexPathInput.value.trim();
    }
    dom.knowledgeSearchSubmitButton.disabled =
      state.knowledgeSearchLoading || !dom.knowledgeSearchQueryInput.value.trim();
    dom.knowledgeQuerySubmitButton.disabled =
      state.knowledgeQueryLoading || !dom.knowledgeQueryQuestionInput.value.trim();
  };
}

function createSetKnowledgeStatusLoading(dom, state, updateKnowledgeButtonState) {
  return function setKnowledgeStatusLoading(isLoading) {
    state.knowledgeStatusLoading = isLoading;
    setButtonLoading(dom.refreshKnowledgeStatusButton, isLoading, {
      loading: "刷新中...",
      idle: "刷新知识库状态",
    });
    updateKnowledgeButtonState();
  };
}

function createSetKnowledgeIndexLoading(dom, state, updateKnowledgeButtonState) {
  return function setKnowledgeIndexLoading(isLoading) {
    state.knowledgeIndexLoading = isLoading;
    setButtonLoading(dom.knowledgeIndexSubmitButton, isLoading, {
      loading: "接入中...",
      idle: "接入 Markdown 笔记",
    });
    updateKnowledgeButtonState();
  };
}

function createSetKnowledgeSearchLoading(dom, state, updateKnowledgeButtonState) {
  return function setKnowledgeSearchLoading(isLoading) {
    state.knowledgeSearchLoading = isLoading;
    setButtonLoading(dom.knowledgeSearchSubmitButton, isLoading, {
      loading: "搜索中...",
      idle: "搜索知识库",
    });
    updateKnowledgeButtonState();
  };
}

function createSetKnowledgeDirectoryIndexLoading(dom, state, updateKnowledgeButtonState) {
  return function setKnowledgeDirectoryIndexLoading(isLoading) {
    state.knowledgeDirectoryIndexLoading = isLoading;
    const button =
      dom.knowledgeDirectoryIndexSubmitButton || document.querySelector("#knowledge-directory-index-submit");
    if (button) {
      setButtonLoading(button, isLoading, {
        loading: "批量接入中...",
        idle: "批量接入 Markdown 目录",
      });
    }
    updateKnowledgeButtonState();
  };
}

function createSetKnowledgeQueryLoading(dom, state, updateKnowledgeButtonState) {
  return function setKnowledgeQueryLoading(isLoading) {
    state.knowledgeQueryLoading = isLoading;
    setButtonLoading(dom.knowledgeQuerySubmitButton, isLoading, {
      loading: "问答中...",
      idle: "知识库问答",
    });
    updateKnowledgeButtonState();
  };
}

export function createKnowledgeModule(deps) {
  const { dom, state } = deps;

  const updateKnowledgeButtonState = createUpdateKnowledgeButtonState(dom, state);
  const setKnowledgeStatusLoading = createSetKnowledgeStatusLoading(dom, state, updateKnowledgeButtonState);
  const setKnowledgeIndexLoading = createSetKnowledgeIndexLoading(dom, state, updateKnowledgeButtonState);
  const setKnowledgeDirectoryIndexLoading = createSetKnowledgeDirectoryIndexLoading(
    dom,
    state,
    updateKnowledgeButtonState
  );
  const setKnowledgeSearchLoading = createSetKnowledgeSearchLoading(dom, state, updateKnowledgeButtonState);
  const setKnowledgeQueryLoading = createSetKnowledgeQueryLoading(dom, state, updateKnowledgeButtonState);
  const knowledgeDirectoryIndexPathInput =
    dom.knowledgeDirectoryIndexPathInput || document.querySelector("#knowledge-directory-index-path");
  const knowledgeDirectoryIndexKbIdInput =
    dom.knowledgeDirectoryIndexKbIdInput || document.querySelector("#knowledge-directory-index-kb-id");
  const knowledgeDirectoryIndexRecursiveInput =
    dom.knowledgeDirectoryIndexRecursiveInput || document.querySelector("#knowledge-directory-index-recursive");
  const knowledgeDirectoryIndexForceReindexInput =
    dom.knowledgeDirectoryIndexForceReindexInput ||
    document.querySelector("#knowledge-directory-index-force-reindex");
  const knowledgeDirectoryIndexMaxFilesInput =
    dom.knowledgeDirectoryIndexMaxFilesInput || document.querySelector("#knowledge-directory-index-max-files");
  const knowledgeDirectoryIndexSubmitButton =
    dom.knowledgeDirectoryIndexSubmitButton || document.querySelector("#knowledge-directory-index-submit");
  const knowledgeDirectoryIndexStatus =
    dom.knowledgeDirectoryIndexStatus || document.querySelector("#knowledge-directory-index-status");
  const knowledgeDirectoryIndexResult =
    dom.knowledgeDirectoryIndexResult || document.querySelector("#knowledge-directory-index-result");

  async function refreshKnowledgeStatus() {
    if (state.knowledgeStatusLoading) {
      return null;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    setKnowledgeStatusLoading(true);
    dom.knowledgeStatusResult.classList.add("hidden");
    dom.knowledgeStatusResult.innerHTML = "";
    setTextStatus(dom.knowledgeStatusMessage, "正在加载 /api/knowledge/status ...", "idle");

    try {
      const payload = await requestKnowledgeStatus(backendUrl);
      renderKnowledgeStatus(dom, payload);
      setTextStatus(dom.knowledgeStatusMessage, "知识库状态已从 /api/knowledge/status 加载", "success");
      return payload;
    } catch (error) {
      renderErrorBox(dom.knowledgeStatusResult, error, "知识库请求失败");
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        dom.knowledgeStatusMessage,
        `${code}${error instanceof Error ? error.message : "知识库状态获取失败"}`,
        "error"
      );
      return null;
    } finally {
      setKnowledgeStatusLoading(false);
    }
  }

  async function addToKnowledge() {
    if (state.knowledgeIndexLoading || dom.knowledgeIndexSubmitButton.disabled) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const path = dom.knowledgeIndexPathInput.value.trim();
    const kbId = dom.knowledgeIndexKbIdInput.value.trim() || "default";

    if (!path) {
      setTextStatus(dom.knowledgeIndexStatus, "Markdown 相对路径不能为空", "error");
      updateKnowledgeButtonState();
      return;
    }

    setKnowledgeIndexLoading(true);
    dom.knowledgeIndexResult.classList.add("hidden");
    dom.knowledgeIndexResult.innerHTML = "";
    setTextStatus(
      dom.knowledgeIndexStatus,
      "正在调用 /api/knowledge/index-file 接入单篇 Markdown 笔记...",
      "idle"
    );

    try {
      const payload = await requestKnowledgeIndexFile(backendUrl, path, kbId);
      renderKnowledgeIndexResult(dom, payload);
      setTextStatus(
        dom.knowledgeIndexStatus,
        "单篇 Markdown 笔记已通过 /api/knowledge/index-file 手动入库。",
        "success"
      );
      void refreshKnowledgeStatus();
    } catch (error) {
      renderErrorBox(dom.knowledgeIndexResult, error, "Markdown 笔记入库请求失败");
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        dom.knowledgeIndexStatus,
        `${code}${error instanceof Error ? error.message : "Markdown 笔记手动入库失败"}`,
        "error"
      );
    } finally {
      setKnowledgeIndexLoading(false);
    }
  }

  async function addDirectoryToKnowledge() {
    if (
      state.knowledgeDirectoryIndexLoading ||
      !knowledgeDirectoryIndexSubmitButton ||
      knowledgeDirectoryIndexSubmitButton.disabled
    ) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const directory = knowledgeDirectoryIndexPathInput?.value.trim() || "";
    const kbId = knowledgeDirectoryIndexKbIdInput?.value.trim() || "default";
    const recursive = Boolean(knowledgeDirectoryIndexRecursiveInput?.checked);
    const forceReindex = Boolean(knowledgeDirectoryIndexForceReindexInput?.checked);
    const maxFiles = normalizePositiveInteger(knowledgeDirectoryIndexMaxFilesInput, 50);

    if (!directory) {
      setTextStatus(knowledgeDirectoryIndexStatus, "Markdown 相对目录不能为空", "error");
      updateKnowledgeButtonState();
      return;
    }

    setKnowledgeDirectoryIndexLoading(true);
    knowledgeDirectoryIndexResult?.classList.add("hidden");
    if (knowledgeDirectoryIndexResult) {
      knowledgeDirectoryIndexResult.innerHTML = "";
    }
    setTextStatus(
      knowledgeDirectoryIndexStatus,
      "正在调用 /api/knowledge/index-markdown-directory 手动批量接入 Markdown 目录...",
      "idle"
    );

    try {
      const payload = await requestKnowledgeIndexMarkdownDirectory(
        backendUrl,
        directory,
        kbId,
        recursive,
        forceReindex,
        maxFiles
      );
      if (knowledgeDirectoryIndexResult) {
        dom.knowledgeDirectoryIndexResult = knowledgeDirectoryIndexResult;
        renderKnowledgeDirectoryIndexResult(dom, payload);
      }
      setTextStatus(
        knowledgeDirectoryIndexStatus,
        "Markdown 目录已通过 /api/knowledge/index-markdown-directory 手动批量入库。",
        "success"
      );
      void refreshKnowledgeStatus();
    } catch (error) {
      if (knowledgeDirectoryIndexResult) {
        renderErrorBox(knowledgeDirectoryIndexResult, error, "Markdown 目录批量入库请求失败");
      }
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        knowledgeDirectoryIndexStatus,
        `${code}${error instanceof Error ? error.message : "Markdown 目录批量入库失败"}`,
        "error"
      );
    } finally {
      setKnowledgeDirectoryIndexLoading(false);
    }
  }

  async function searchKnowledge() {
    if (state.knowledgeSearchLoading || dom.knowledgeSearchSubmitButton.disabled) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const query = dom.knowledgeSearchQueryInput.value.trim();
    const kbId = dom.knowledgeSearchKbIdInput.value.trim() || "default";
    const topK = normalizeTopK(dom.knowledgeSearchTopKInput);

    if (!query) {
      setTextStatus(dom.knowledgeSearchStatus, "查询不能为空", "error");
      updateKnowledgeButtonState();
      return;
    }

    setKnowledgeSearchLoading(true);
    dom.knowledgeSearchResult.classList.add("hidden");
    dom.knowledgeSearchResult.innerHTML = "";
    setTextStatus(dom.knowledgeSearchStatus, "正在发送 /api/knowledge/search ...", "idle");

    try {
      const payload = await requestKnowledgeSearch(backendUrl, query, kbId, topK);
      renderKnowledgeSearchResult(dom, payload);
      setTextStatus(dom.knowledgeSearchStatus, "知识库搜索结果已从 /api/knowledge/search 加载", "success");
    } catch (error) {
      renderErrorBox(dom.knowledgeSearchResult, error, "知识库请求失败");
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        dom.knowledgeSearchStatus,
        `${code}${error instanceof Error ? error.message : "知识库搜索失败"}`,
        "error"
      );
    } finally {
      setKnowledgeSearchLoading(false);
    }
  }

  async function queryKnowledge() {
    if (state.knowledgeQueryLoading || dom.knowledgeQuerySubmitButton.disabled) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const question = dom.knowledgeQueryQuestionInput.value.trim();
    const kbId = dom.knowledgeQueryKbIdInput.value.trim() || "default";
    const topK = normalizeTopK(dom.knowledgeQueryTopKInput);

    if (!question) {
      setTextStatus(dom.knowledgeQueryStatus, "问题不能为空", "error");
      updateKnowledgeButtonState();
      return;
    }

    setKnowledgeQueryLoading(true);
    dom.knowledgeQueryResult.classList.add("hidden");
    dom.knowledgeQueryResult.innerHTML = "";
    setTextStatus(dom.knowledgeQueryStatus, "正在发送 /api/knowledge/query ...", "idle");

    try {
      const payload = await requestKnowledgeQuery(backendUrl, question, kbId, topK);
      renderKnowledgeQueryResult(dom, payload);
      setTextStatus(dom.knowledgeQueryStatus, "知识库答案已从 /api/knowledge/query 加载", "success");
    } catch (error) {
      renderErrorBox(dom.knowledgeQueryResult, error, "知识库请求失败");
      if (error?.code === "KNOWLEDGE_MODEL_DISABLED") {
        setTextStatus(
          dom.knowledgeQueryStatus,
          "KNOWLEDGE_MODEL_DISABLED：后端环境未启用 DeepSeek。",
          "error"
        );
      } else {
        const code = error?.code ? `${error.code}: ` : "";
        setTextStatus(
          dom.knowledgeQueryStatus,
          `${code}${error instanceof Error ? error.message : "知识库问答失败"}`,
          "error"
        );
      }
    } finally {
      setKnowledgeQueryLoading(false);
    }
  }

  knowledgeDirectoryIndexSubmitButton?.addEventListener("click", addDirectoryToKnowledge);
  knowledgeDirectoryIndexPathInput?.addEventListener("input", updateKnowledgeButtonState);
  knowledgeDirectoryIndexMaxFilesInput?.addEventListener("input", updateKnowledgeButtonState);

  return {
    updateKnowledgeButtonState,
    refreshKnowledgeStatus,
    addToKnowledge,
    addDirectoryToKnowledge,
    searchKnowledge,
    queryKnowledge,
  };
}
