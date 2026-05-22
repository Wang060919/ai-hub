import { escapeHtml } from "../core/utils.js";
import { setTextStatus } from "../ui/status.js";
import { setButtonLoading } from "../ui/loading.js";
import { renderErrorBox } from "../ui/error.js";
import {
  requestKnowledgeStatus,
  requestKnowledgeIndexFile,
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
    dom.refreshKnowledgeStatusButton.disabled = state.knowledgeStatusLoading;
    dom.knowledgeIndexSubmitButton.disabled =
      state.knowledgeIndexLoading || !dom.knowledgeIndexPathInput.value.trim();
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
  const setKnowledgeSearchLoading = createSetKnowledgeSearchLoading(dom, state, updateKnowledgeButtonState);
  const setKnowledgeQueryLoading = createSetKnowledgeQueryLoading(dom, state, updateKnowledgeButtonState);

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

  return {
    updateKnowledgeButtonState,
    refreshKnowledgeStatus,
    addToKnowledge,
    searchKnowledge,
    queryKnowledge,
  };
}
