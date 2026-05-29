import { escapeHtml } from "../core/utils.js";
import { setTextStatus } from "../ui/status.js";
import { setButtonLoading } from "../ui/loading.js";
import { renderErrorBox } from "../ui/error.js";
import { requestFilePreview, requestFileSummary } from "../api/files.js";
import { createInputHistory } from "../ui/input-history.js";

function renderFilePreview(dom, payload) {
  const file = payload.file || {};
  const preview = payload.preview || {};
  const truncated = preview.truncated ? "true" : "false";

  dom.filePreviewResult.classList.remove("hidden");
  dom.filePreviewResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>name</span>
        <strong>${escapeHtml(file.name || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>suffix</span>
        <strong>${escapeHtml(file.suffix || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>size_human</span>
        <strong>${escapeHtml(file.size_human || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>modified_at</span>
        <strong>${escapeHtml(file.modified_at || "-")}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>truncated</span>
        <strong>${truncated}</strong>
      </div>
    </div>
    <div class="file-preview-text-wrap">
      <pre class="file-preview-text"><code>${escapeHtml(preview.text || "")}</code></pre>
      <button class="file-preview-expand-btn" type="button" aria-label="全屏预览">⛶</button>
    </div>
  `;

  const expandBtn = dom.filePreviewResult.querySelector(".file-preview-expand-btn");
  const textWrap = dom.filePreviewResult.querySelector(".file-preview-text-wrap");
  if (expandBtn && textWrap) {
    expandBtn.addEventListener("click", () => {
      textWrap.classList.toggle("expanded");
      expandBtn.textContent = textWrap.classList.contains("expanded") ? "⛶" : "⛶";
      expandBtn.setAttribute("aria-label", textWrap.classList.contains("expanded") ? "退出全屏" : "全屏预览");
    });
    const escapeHandler = (e) => {
      if (e.key === "Escape" && textWrap.classList.contains("expanded")) {
        textWrap.classList.remove("expanded");
        expandBtn.setAttribute("aria-label", "全屏预览");
      }
    };
    document.addEventListener("keydown", escapeHandler);
  }
}

function renderFileSummary(dom, payload) {
  const file = payload.file || {};
  const summary = payload.summary || {};
  const truncated = summary.truncated ? "true" : "false";

  dom.fileSummaryResult.classList.remove("hidden");
  dom.fileSummaryResult.innerHTML = `
    <div class="file-preview-meta">
      <div class="file-preview-meta-item">
        <span>model</span>
        <strong>${escapeHtml(summary.model || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>input_chars</span>
        <strong>${escapeHtml(summary.input_chars ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>source_chars</span>
        <strong>${escapeHtml(summary.source_chars ?? "-")}</strong>
      </div>
      <div class="file-preview-meta-item wide">
        <span>relative_path</span>
        <strong>${escapeHtml(file.relative_path || "-")}</strong>
      </div>
      <div class="file-preview-meta-item">
        <span>truncated</span>
        <strong>${truncated}</strong>
      </div>
    </div>
    <div class="file-summary-text">${escapeHtml(summary.text || "")}</div>
  `;
}

function createUpdateFilePreviewButtonState(dom, state) {
  return function updateFilePreviewButtonState() {
    const hasPath = Boolean(dom.filePreviewPathInput.value.trim());
    dom.readFilePreviewButton.disabled = state.filePreviewLoading || !hasPath;
    dom.summarizeFilePreviewButton.disabled =
      state.filePreviewLoading ||
      state.fileSummaryLoading ||
      !hasPath ||
      !state.hasPreviewResult ||
      state.lastPreviewPath !== dom.filePreviewPathInput.value.trim();
  };
}

function createResetFileSummaryResult(dom, state) {
  return function resetFileSummaryResult() {
    state.fileSummaryLoading = false;
    state.hasPreviewResult = false;
    state.lastPreviewPath = "";
    dom.fileSummaryResult.classList.add("hidden");
    dom.fileSummaryResult.innerHTML = "";
    setTextStatus(
      dom.fileSummaryStatus,
      "仅预览成功后且点击按钮时才能生成总结。",
      "idle"
    );
  };
}

function createHandleFilePreviewPathInput(dom, state, resetFileSummaryResult, updateFilePreviewButtonState) {
  return function handleFilePreviewPathInput() {
    if (state.lastPreviewPath && state.lastPreviewPath !== dom.filePreviewPathInput.value.trim()) {
      resetFileSummaryResult();
    }
    updateFilePreviewButtonState();
  };
}

function createSetFilePreviewLoading(dom, state, updateFilePreviewButtonState) {
  return function setFilePreviewLoading(isLoading) {
    state.filePreviewLoading = isLoading;
    setButtonLoading(dom.readFilePreviewButton, isLoading, {
      loading: "读取中...",
      idle: "读取预览",
    });
    updateFilePreviewButtonState();
  };
}

function createSetFileSummaryLoading(dom, state, updateFilePreviewButtonState) {
  return function setFileSummaryLoading(isLoading) {
    state.fileSummaryLoading = isLoading;
    setButtonLoading(dom.summarizeFilePreviewButton, isLoading, {
      loading: "总结中...",
      idle: "生成总结",
    });
    updateFilePreviewButtonState();
  };
}

export function createFilesModule(deps) {
  const { dom, state } = deps;

  const updateFilePreviewButtonState = createUpdateFilePreviewButtonState(dom, state);
  const resetFileSummaryResult = createResetFileSummaryResult(dom, state);
  const handleFilePreviewPathInput = createHandleFilePreviewPathInput(
    dom,
    state,
    resetFileSummaryResult,
    updateFilePreviewButtonState
  );
  const setFilePreviewLoading = createSetFilePreviewLoading(dom, state, updateFilePreviewButtonState);
  const setFileSummaryLoading = createSetFileSummaryLoading(dom, state, updateFilePreviewButtonState);

  /* Input history for file path */
  const filePathHistory = createInputHistory("aihub-file-paths", 5);
  const historyDropdown = filePathHistory.createDropdown(dom.filePreviewPathInput, () => {
    dom.readFilePreviewButton.disabled = false;
  });

  dom.filePreviewPathInput.addEventListener("focus", () => historyDropdown.show());
  dom.filePreviewPathInput.addEventListener("blur", () => {
    setTimeout(() => historyDropdown.hide(), 150);
  });

  async function readFilePreview() {
    if (state.filePreviewLoading) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const path = dom.filePreviewPathInput.value.trim();

    if (!path) {
      setTextStatus(dom.filePreviewStatus, "文件路径不能为空", "error");
      updateFilePreviewButtonState();
      return;
    }

    setFilePreviewLoading(true);
    state.hasPreviewResult = false;
    state.lastPreviewPath = "";
    dom.filePreviewResult.classList.add("hidden");
    dom.filePreviewResult.innerHTML = "";
    resetFileSummaryResult();
    setTextStatus(dom.filePreviewStatus, "正在读取 /files/preview ...", "idle");

    try {
      const payload = await requestFilePreview(backendUrl, path);
      renderFilePreview(dom, payload);
      state.hasPreviewResult = true;
      state.lastPreviewPath = path;
      filePathHistory.addEntry(path);
      setTextStatus(dom.filePreviewStatus, "预览已从 /files/preview 加载", "success");
    } catch (error) {
      renderErrorBox(dom.filePreviewResult, error, "文件预览失败");
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        dom.filePreviewStatus,
        `${code}${error instanceof Error ? error.message : "文件预览失败"}`,
        "error"
      );
    } finally {
      setFilePreviewLoading(false);
    }
  }

  async function summarizeFilePreview() {
    if (state.fileSummaryLoading || dom.summarizeFilePreviewButton.disabled) {
      return;
    }

    const backendUrl = dom.backendUrlInput.value.trim();
    const path = dom.filePreviewPathInput.value.trim();

    if (!state.hasPreviewResult || state.lastPreviewPath !== path) {
      setTextStatus(
        dom.fileSummaryStatus,
        "请先加载当前路径的预览再生成总结。",
        "error"
      );
      updateFilePreviewButtonState();
      return;
    }

    setFileSummaryLoading(true);
    dom.fileSummaryResult.classList.add("hidden");
    dom.fileSummaryResult.innerHTML = "";
    setTextStatus(dom.fileSummaryStatus, "正在发送 /api/files/summarize ...", "idle");

    try {
      const payload = await requestFileSummary(backendUrl, path);
      renderFileSummary(dom, payload);
      setTextStatus(dom.fileSummaryStatus, "总结已从 /api/files/summarize 加载", "success");
    } catch (error) {
      renderErrorBox(dom.fileSummaryResult, error, "文件总结失败");
      const code = error?.code ? `${error.code}: ` : "";
      setTextStatus(
        dom.fileSummaryStatus,
        `${code}${error instanceof Error ? error.message : "文件总结失败"}`,
        "error"
      );
    } finally {
      setFileSummaryLoading(false);
    }
  }

  return {
    updateFilePreviewButtonState,
    readFilePreview,
    summarizeFilePreview,
    resetFileSummaryResult,
    handleFilePreviewPathInput,
  };
}
