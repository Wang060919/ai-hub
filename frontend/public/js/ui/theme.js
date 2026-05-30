/**
 * Theme manager — dark/light mode toggle with localStorage persistence.
 */

const STORAGE_KEY = "aihub-theme";

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  const icon = document.querySelector("#theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "☀" : "🌙";
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function createThemeManager() {
  let currentTheme = getStoredTheme();

  function init() {
    applyTheme(currentTheme);
    const btn = document.querySelector("#sidebar-theme-toggle");
    if (btn) {
      btn.addEventListener("click", toggle);
    }
  }

  function toggle() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
  }

  function getTheme() {
    return currentTheme;
  }

  return { init, toggle, getTheme };
}
