import { getModelSettings, updateModelSettings, fetchModelList } from "../api/settings.js";
import { setTextStatus } from "../ui/status.js";

const STORAGE_KEY = "aihub-provider-presets";

function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

export function createSettingsModule(deps) {
  const { dom, onSaved, onPresetsChanged, toast } = deps;
  let _editingPresetId = null;
  let _isEditingCurrent = false;
  let _currentApiKey = "";

  function show() {
    dom.settingsPanel.classList.remove("hidden");
    dom.settingsToggleBtn.classList.add("active");
    renderPresetsList();
    hidePresetForm();
  }

  function hide() {
    dom.settingsPanel.classList.add("hidden");
    dom.settingsToggleBtn.classList.remove("active");
  }

  function toggle() {
    if (dom.settingsPanel.classList.contains("hidden")) {
      show();
    } else {
      hide();
    }
  }

  const closeBtn = dom.settingsPanel.querySelector(".chat-settings-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", hide);
  }

  // --- Preset list ---

  function renderPresetsList() {
    const listEl = document.querySelector("#settings-presets-list");
    if (!listEl) return;

    const activeChip = document.querySelector("#chat-provider-bar .chat-provider-chip.active");
    const activePresetId = activeChip?.dataset?.provider || "default";
    const backendUrl = dom.backendUrlInput.value.trim();

    // Build list: "当前模型" first (from backend), then localStorage presets
    listEl.innerHTML = "";

    // Current model item (from backend)
    const currentItem = document.createElement("div");
    currentItem.className = "settings-preset-item" + (activePresetId === "default" ? " active" : "");
    const currentInfo = document.createElement("div");
    currentInfo.className = "settings-preset-info";
    const currentName = document.createElement("div");
    currentName.className = "settings-preset-name";
    currentName.textContent = "当前模型";
    if (activePresetId === "default") {
      const badge = document.createElement("span");
      badge.className = "settings-preset-active-badge";
      badge.textContent = "使用中";
      currentName.append(badge);
    }
    const currentMeta = document.createElement("div");
    currentMeta.className = "settings-preset-meta";
    currentMeta.textContent = "后端运行时配置";
    currentInfo.append(currentName, currentMeta);
    const currentActions = document.createElement("div");
    currentActions.className = "settings-preset-actions";
    const currentEditBtn = document.createElement("button");
    currentEditBtn.className = "settings-preset-btn";
    currentEditBtn.type = "button";
    currentEditBtn.textContent = "✏";
    currentEditBtn.title = "编辑当前模型";
    currentEditBtn.addEventListener("click", () => editCurrentModel());
    currentActions.append(currentEditBtn);
    currentItem.append(currentInfo, currentActions);
    listEl.append(currentItem);

    // LocalStorage presets
    const presets = loadPresets();
    presets.forEach((preset) => {
      const item = document.createElement("div");
      item.className = "settings-preset-item" + (preset.id === activePresetId ? " active" : "");

      const info = document.createElement("div");
      info.className = "settings-preset-info";
      const nameRow = document.createElement("div");
      nameRow.className = "settings-preset-name";
      nameRow.textContent = preset.label || preset.id;
      if (preset.id === activePresetId) {
        const badge = document.createElement("span");
        badge.className = "settings-preset-active-badge";
        badge.textContent = "使用中";
        nameRow.append(badge);
      }
      const meta = document.createElement("div");
      meta.className = "settings-preset-meta";
      meta.textContent = `${preset.model || "?"}  ·  ${preset.apiUrl || "未设置"}`;
      info.append(nameRow, meta);

      const actions = document.createElement("div");
      actions.className = "settings-preset-actions";

      const applyBtn = document.createElement("button");
      applyBtn.className = "settings-preset-btn apply";
      applyBtn.type = "button";
      applyBtn.textContent = "✓";
      applyBtn.title = "应用到当前配置";
      applyBtn.addEventListener("click", () => {
        applyPresetToCurrent(preset);
      });

      const editBtn = document.createElement("button");
      editBtn.className = "settings-preset-btn";
      editBtn.type = "button";
      editBtn.textContent = "✏";
      editBtn.title = "编辑";
      editBtn.addEventListener("click", () => showPresetForm(preset));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "settings-preset-btn delete";
      deleteBtn.type = "button";
      deleteBtn.textContent = "×";
      deleteBtn.title = "删除";
      deleteBtn.addEventListener("click", () => {
        if (confirm(`确定删除预设 "${preset.label || preset.id}" 吗？`)) {
          removePreset(preset.id);
        }
      });

      actions.append(applyBtn, editBtn, deleteBtn);
      item.append(info, actions);
      listEl.append(item);
    });
  }

  // Edit current model — load from backend, save to backend
  async function editCurrentModel() {
    _isEditingCurrent = true;
    _editingPresetId = null;
    const formEl = document.querySelector("#settings-preset-form");
    const titleEl = document.querySelector("#settings-preset-form-title");
    if (!formEl) return;

    titleEl.textContent = "编辑当前模型";
    setTextStatus(dom.settingsStatus, "加载当前配置...", "idle");

    // Show form immediately with empty fields
    document.querySelector("#preset-form-label").value = "当前模型";
    document.querySelector("#preset-form-label").disabled = true;
    document.querySelector("#preset-form-api-url").value = "";
    document.querySelector("#preset-form-api-key").value = "";
    document.querySelector("#preset-form-api-key").placeholder = "sk-...";
    document.querySelector("#preset-form-model").value = "";
    document.querySelector("#preset-form-timeout").value = 30;
    formEl.classList.remove("hidden");

    try {
      const result = await getModelSettings(dom.backendUrlInput.value.trim());
      if (result.api_url !== undefined) {
        document.querySelector("#preset-form-api-url").value = result.api_url || "";
        document.querySelector("#preset-form-api-key").value = "";
        document.querySelector("#preset-form-api-key").placeholder = result.api_key_masked || "未配置";
        document.querySelector("#preset-form-model").value = result.model || "";
        document.querySelector("#preset-form-timeout").value = result.timeout || 30;
        setTextStatus(dom.settingsStatus, "已加载当前配置。", "success");
      } else {
        setTextStatus(dom.settingsStatus, "加载失败，请检查后端连接。", "error");
      }
    } catch {
      setTextStatus(dom.settingsStatus, "加载失败，请检查后端连接。", "error");
    }
  }

  function applyPresetToCurrent(preset) {
    // Fill the current model config fields (via provider bar's onSwitch logic)
    // Directly save to backend
    const backendUrl = dom.backendUrlInput.value.trim();
    const payload = { api_url: preset.apiUrl, model: preset.model };
    if (preset.apiKey) payload.api_key = preset.apiKey;
    if (preset.timeout) payload.timeout = preset.timeout;

    setTextStatus(dom.settingsStatus, `正在应用预设 "${preset.label}"...`, "idle");

    updateModelSettings(backendUrl, payload).then((result) => {
      if (result.api_url !== undefined) {
        setTextStatus(dom.settingsStatus, `已应用预设 "${preset.label}"。`, "success");
        if (onSaved) onSaved(result);
      } else {
        setTextStatus(dom.settingsStatus, "应用失败：" + (result.error || "未知错误"), "error");
      }
    }).catch(() => {
      setTextStatus(dom.settingsStatus, "应用失败，请检查后端连接。", "error");
    });
  }

  // --- Preset form ---

  function showPresetForm(preset) {
    const formEl = document.querySelector("#settings-preset-form");
    const titleEl = document.querySelector("#settings-preset-form-title");
    if (!formEl) return;

    _isEditingCurrent = false;
    _editingPresetId = preset ? preset.id : null;
    titleEl.textContent = preset ? "编辑模型预设" : "添加模型预设";

    const labelInput = document.querySelector("#preset-form-label");
    labelInput.value = preset?.label || "";
    labelInput.disabled = false;

    document.querySelector("#preset-form-api-url").value = preset?.apiUrl || "";
    document.querySelector("#preset-form-api-key").value = "";
    document.querySelector("#preset-form-api-key").placeholder = preset?.apiKey ? "已保存（留空不修改）" : "sk-...";
    document.querySelector("#preset-form-model").value = preset?.model || "";
    document.querySelector("#preset-form-timeout").value = preset?.timeout || 30;

    formEl.classList.remove("hidden");
  }

  function hidePresetForm() {
    const formEl = document.querySelector("#settings-preset-form");
    if (formEl) formEl.classList.add("hidden");
    _editingPresetId = null;
    _isEditingCurrent = false;
    const labelInput = document.querySelector("#preset-form-label");
    if (labelInput) labelInput.disabled = false;
  }

  async function savePresetForm() {
    const label = document.querySelector("#preset-form-label").value.trim();
    const apiUrl = document.querySelector("#preset-form-api-url").value.trim();
    const apiKey = document.querySelector("#preset-form-api-key").value.trim();
    const model = document.querySelector("#preset-form-model").value.trim();
    const timeout = Number(document.querySelector("#preset-form-timeout").value) || 30;

    if (!apiUrl || !model) {
      setTextStatus(dom.settingsStatus, "API URL 和模型名称不能为空。", "error");
      return;
    }

    if (_isEditingCurrent) {
      // Save to backend
      const backendUrl = dom.backendUrlInput.value.trim();
      const payload = { api_url: apiUrl, model: model };
      if (apiKey) payload.api_key = apiKey;
      if (Number.isFinite(timeout) && timeout >= 1) payload.timeout = Math.floor(timeout);

      setTextStatus(dom.settingsStatus, "保存中...", "idle");
      try {
        const result = await updateModelSettings(backendUrl, payload);
        if (result.api_url !== undefined) {
          setTextStatus(dom.settingsStatus, "当前模型配置已保存。", "success");
          hidePresetForm();
          if (onSaved) onSaved(result);
        } else {
          setTextStatus(dom.settingsStatus, "保存失败：" + (result.error || "未知错误"), "error");
        }
      } catch {
        setTextStatus(dom.settingsStatus, "保存失败，请检查后端连接。", "error");
      }
    } else {
      // Save to localStorage
      if (!label) {
        setTextStatus(dom.settingsStatus, "名称不能为空。", "error");
        return;
      }

      const presets = loadPresets();
      if (_editingPresetId) {
        const preset = presets.find((p) => p.id === _editingPresetId);
        if (preset) {
          preset.label = label;
          preset.apiUrl = apiUrl;
          if (apiKey) preset.apiKey = apiKey;
          preset.model = model;
          preset.timeout = timeout;
        }
      } else {
        const id = "custom-" + Date.now().toString(36);
        presets.push({ id, label, apiUrl, apiKey, model, timeout });
      }

      savePresetsToStorage(presets);
      setTextStatus(dom.settingsStatus, _editingPresetId ? "预设已更新。" : "预设已添加。", "success");
      hidePresetForm();
      renderPresetsList();
      if (onPresetsChanged) onPresetsChanged();
    }
  }

  function removePreset(id) {
    const presets = loadPresets().filter((p) => p.id !== id);
    savePresetsToStorage(presets);
    renderPresetsList();
    if (onPresetsChanged) onPresetsChanged();
  }

  // --- Fetch models in preset form ---

  function setupPresetFetchModels() {
    const btn = document.querySelector("#preset-form-fetch-models");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const backendUrl = dom.backendUrlInput.value.trim();
      const apiUrl = document.querySelector("#preset-form-api-url").value.trim();
      const apiKeyInput = document.querySelector("#preset-form-api-key").value.trim();

      if (!apiUrl) {
        setTextStatus(dom.settingsStatus, "请先填写 API URL。", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "获取中...";

      try {
        // When editing current model, use backend's stored key as fallback
        const keyToSend = apiKeyInput || (_isEditingCurrent ? _currentApiKey : "");
        const result = await fetchModelList(backendUrl, apiUrl, keyToSend);
        if (result.error) {
          setTextStatus(dom.settingsStatus, result.error, "error");
          return;
        }

        const models = (result.models || []).sort();
        if (models.length === 0) {
          setTextStatus(dom.settingsStatus, "该 API 未返回模型列表。", "error");
          return;
        }

        renderPresetModelDropdown(models);
        setTextStatus(dom.settingsStatus, `已获取 ${models.length} 个模型。`, "success");
      } catch (err) {
        setTextStatus(dom.settingsStatus, "获取失败：" + (err.message || "未知错误"), "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "获取模型列表";
      }
    });
  }

  function renderPresetModelDropdown(models) {
    const modelInput = document.querySelector("#preset-form-model");
    if (!modelInput) return;

    let dropdown = modelInput.parentElement.querySelector(".settings-model-dropdown");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "settings-model-dropdown";
      modelInput.parentElement.append(dropdown);
    }

    dropdown.innerHTML = "";
    models.forEach((modelId) => {
      const item = document.createElement("div");
      item.className = "settings-model-item";
      item.textContent = modelId;
      item.addEventListener("click", () => {
        modelInput.value = modelId;
        dropdown.classList.add("hidden");
      });
      dropdown.append(item);
    });

    dropdown.classList.remove("hidden");

    const onOutsideClick = (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
        document.removeEventListener("click", onOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener("click", onOutsideClick), 0);
  }

  // --- Wire up buttons ---

  const addPresetBtn = document.querySelector("#settings-add-preset");
  if (addPresetBtn) {
    addPresetBtn.addEventListener("click", () => showPresetForm(null));
  }

  const presetSaveBtn = document.querySelector("#preset-form-save");
  const presetCancelBtn = document.querySelector("#preset-form-cancel");
  if (presetSaveBtn) presetSaveBtn.addEventListener("click", savePresetForm);
  if (presetCancelBtn) presetCancelBtn.addEventListener("click", hidePresetForm);

  setupPresetFetchModels();

  return { toggle, show, hide, renderPresetsList };
}
