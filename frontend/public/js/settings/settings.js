import { getModelSettings, updateModelSettings, fetchModelList } from "../api/settings.js";
import { setTextStatus } from "../ui/status.js";

export function createSettingsModule(deps) {
  const { dom } = deps;
  let _savedApiKey = "";

  function show() {
    dom.settingsPanel.classList.remove("hidden");
    dom.settingsToggleBtn.classList.add("active");
    loadCurrentSettings();
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

  async function loadCurrentSettings() {
    const backendUrl = dom.backendUrlInput.value.trim();
    setTextStatus(dom.settingsStatus, "加载中...", "idle");
    dom.settingsSaveBtn.disabled = true;

    try {
      const result = await getModelSettings(backendUrl);
      if (result.api_url !== undefined) {
        dom.settingsApiUrl.value = result.api_url || "";
        dom.settingsApiKey.value = "";
        dom.settingsApiKey.placeholder = result.api_key_masked || "未配置";
        dom.settingsModel.value = result.model || "";
        dom.settingsTimeout.value = result.timeout || 30;
        setTextStatus(dom.settingsStatus, "已加载当前配置。", "success");
      } else {
        setTextStatus(dom.settingsStatus, "加载失败，请检查后端连接。", "error");
      }
    } catch {
      setTextStatus(dom.settingsStatus, "加载失败，请检查后端连接。", "error");
    } finally {
      dom.settingsSaveBtn.disabled = false;
    }
  }

  async function saveSettings() {
    const backendUrl = dom.backendUrlInput.value.trim();
    const apiUrl = dom.settingsApiUrl.value.trim();
    const apiKey = dom.settingsApiKey.value.trim();
    const model = dom.settingsModel.value.trim();
    const timeout = Number(dom.settingsTimeout.value);

    if (!apiUrl) {
      setTextStatus(dom.settingsStatus, "API URL 不能为空。", "error");
      return;
    }
    if (!model) {
      setTextStatus(dom.settingsStatus, "模型名称不能为空。", "error");
      return;
    }

    const payload = { api_url: apiUrl, model: model };
    if (apiKey) {
      payload.api_key = apiKey;
    }
    if (Number.isFinite(timeout) && timeout >= 1) {
      payload.timeout = Math.floor(timeout);
    }

    setTextStatus(dom.settingsStatus, "保存中...", "idle");
    dom.settingsSaveBtn.disabled = true;

    try {
      const result = await updateModelSettings(backendUrl, payload);
      if (result.api_url !== undefined) {
        _savedApiKey = apiKey || _savedApiKey;
        dom.settingsApiKey.value = "";
        dom.settingsApiKey.placeholder = result.api_key_masked || "未配置";
        setTextStatus(dom.settingsStatus, "模型配置已保存。", "success");
      } else {
        setTextStatus(dom.settingsStatus, "保存失败：" + (result.error || "未知错误"), "error");
      }
    } catch {
      setTextStatus(dom.settingsStatus, "保存失败，请检查后端连接。", "error");
    } finally {
      dom.settingsSaveBtn.disabled = false;
    }
  }

  async function fetchModels() {
    const backendUrl = dom.backendUrlInput.value.trim();
    const apiUrl = dom.settingsApiUrl.value.trim();
    const apiKey = dom.settingsApiKey.value.trim() || _savedApiKey;

    if (!apiUrl) {
      setTextStatus(dom.settingsStatus, "请先填写 API URL。", "error");
      return;
    }

    setTextStatus(dom.settingsStatus, "获取模型列表中...", "idle");
    dom.settingsFetchModelsBtn.disabled = true;

    try {
      const result = await fetchModelList(backendUrl, apiUrl, apiKey);
      if (result.error) {
        setTextStatus(dom.settingsStatus, result.error, "error");
        return;
      }

      const models = (result.models || []).sort();
      if (models.length === 0) {
        setTextStatus(dom.settingsStatus, "该 API 未返回模型列表。", "error");
        return;
      }

      renderModelDropdown(models);
      setTextStatus(dom.settingsStatus, `已获取 ${models.length} 个模型。`, "success");
    } catch (err) {
      setTextStatus(dom.settingsStatus, "获取模型列表失败：" + (err.message || "未知错误"), "error");
    } finally {
      dom.settingsFetchModelsBtn.disabled = false;
    }
  }

  function renderModelDropdown(models) {
    let dropdown = dom.settingsPanel.querySelector(".settings-model-dropdown");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "settings-model-dropdown";
      dom.settingsModel.parentElement.after(dropdown);
    }

    dropdown.innerHTML = "";
    models.forEach((modelId) => {
      const item = document.createElement("div");
      item.className = "settings-model-item";
      item.textContent = modelId;
      item.addEventListener("click", () => {
        dom.settingsModel.value = modelId;
        dropdown.classList.add("hidden");
      });
      dropdown.append(item);
    });

    dropdown.classList.remove("hidden");
  }

  return { toggle, show, hide, loadCurrentSettings, saveSettings, fetchModels };
}
