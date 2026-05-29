/**
 * Lightweight input history — stores last N values in localStorage.
 * @param {string} storageKey — localStorage key
 * @param {number} maxEntries — max items to keep (default 5)
 */
export function createInputHistory(storageKey, maxEntries = 5) {
  function getHistory() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list.slice(0, maxEntries)));
    } catch {}
  }

  function addEntry(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    const list = getHistory().filter((v) => v !== trimmed);
    list.unshift(trimmed);
    saveHistory(list);
  }

  function createDropdown(inputEl, onSelect) {
    let dropdown = null;

    function show() {
      hide();
      const history = getHistory();
      if (history.length === 0) return;

      dropdown = document.createElement("div");
      dropdown.className = "input-history-dropdown";
      history.forEach((value) => {
        const item = document.createElement("div");
        item.className = "input-history-item";
        item.textContent = value;
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          inputEl.value = value;
          inputEl.dispatchEvent(new Event("input"));
          hide();
          if (onSelect) onSelect(value);
        });
        dropdown.append(item);
      });

      const wrapper = inputEl.closest(".form-field") || inputEl.parentElement;
      if (wrapper) {
        wrapper.style.position = "relative";
        wrapper.append(dropdown);
      }
    }

    function hide() {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }
    }

    return { show, hide };
  }

  return { getHistory, addEntry, createDropdown };
}
