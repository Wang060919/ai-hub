/**
 * Provider presets — quick switching between AI providers.
 * Stores per-provider config in localStorage.
 */

const STORAGE_KEY = "aihub-provider-presets";

const DEFAULT_PRESETS = [
  {
    id: "default",
    label: "当前模型",
    apiUrl: "",
    apiKey: "",
    model: "",
    timeout: 30,
    isDefault: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    model: "deepseek-chat",
    timeout: 30,
  },
  {
    id: "openai",
    label: "OpenAI",
    apiUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o",
    timeout: 30,
  },
  {
    id: "anthropic",
    label: "Claude",
    apiUrl: "https://api.anthropic.com/v1",
    apiKey: "",
    model: "claude-sonnet-4-20250514",
    timeout: 30,
  },
  {
    id: "ollama",
    label: "Ollama",
    apiUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
    model: "llama3.2",
    timeout: 60,
  },
];

function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.length > 0) return saved;
    }
  } catch {}
  return [...DEFAULT_PRESETS];
}

function savePresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {}
}

export function createProviderPresets(deps) {
  const { onSwitch, onNeedApiKey, onAddClick } = deps;
  let activeId = "default";

  const barEl = document.querySelector("#chat-provider-bar");
  if (!barEl) return { getActive: () => null, getPresets: () => [] };

  function render() {
    const presets = loadPresets();
    barEl.innerHTML = "";

    presets.forEach((preset) => {
      const chip = document.createElement("button");
      chip.className = "chat-provider-chip" + (preset.id === activeId ? " active" : "");
      chip.type = "button";
      chip.dataset.provider = preset.id;

      const hasKey = preset.isDefault || Boolean(preset.apiKey && preset.apiKey.trim());

      if (preset.isDefault) {
        chip.textContent = preset.label;
      } else if (hasKey) {
        chip.textContent = preset.label;
        const modelSpan = document.createElement("span");
        modelSpan.className = "chat-provider-model";
        modelSpan.textContent = ` · ${preset.model}`;
        chip.append(modelSpan);
      } else {
        chip.textContent = preset.label;
        const modelSpan = document.createElement("span");
        modelSpan.className = "chat-provider-model";
        modelSpan.textContent = ` · 未配置`;
        chip.append(modelSpan);
        chip.classList.add("needs-config");
      }

      chip.addEventListener("click", (e) => {
        if (e.target.closest(".chat-provider-chip-delete")) return;
        if (!preset.isDefault && !hasKey) {
          if (onNeedApiKey) onNeedApiKey(preset);
          return;
        }
        switchTo(preset.id);
      });

      if (!preset.isDefault) {
        const deleteBtn = document.createElement("span");
        deleteBtn.className = "chat-provider-chip-delete";
        deleteBtn.textContent = "×";
        deleteBtn.title = "移除此预设";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removePreset(preset.id);
        });
        chip.append(deleteBtn);
      }

      barEl.append(chip);
    });

    // Add button — opens settings panel add form
    const addBtn = document.createElement("button");
    addBtn.className = "chat-provider-add-btn";
    addBtn.type = "button";
    addBtn.textContent = "+";
    addBtn.title = "添加自定义模型";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (onAddClick) onAddClick();
    });
    barEl.append(addBtn);
  }

  function switchTo(id) {
    const presets = loadPresets();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    activeId = id;
    render();
    if (onSwitch) onSwitch(preset);
  }

  function getActive() {
    const presets = loadPresets();
    return presets.find((p) => p.id === activeId);
  }

  function getPresets() {
    return loadPresets();
  }

  function updatePreset(id, updates) {
    const presets = loadPresets();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    Object.assign(preset, updates);
    savePresets(presets);
    render();
  }

  function removePreset(id) {
    const presets = loadPresets().filter((p) => p.id !== id);
    if (activeId === id) activeId = "default";
    savePresets(presets);
    render();
  }

  function addPreset(preset) {
    const presets = loadPresets();
    if (presets.find((p) => p.id === preset.id)) return;
    presets.push(preset);
    savePresets(presets);
    render();
  }

  render();

  return { switchTo, getActive, getPresets, updatePreset, removePreset, addPreset, render };
}
