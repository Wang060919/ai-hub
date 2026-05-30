import {
  isTauriRuntime,
  normalizeErrorMessage,
  readJsonResponse,
  getTauriInvokeDirect,
} from "./client.js";

export async function getModelSettings(backendUrl) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      return await tauriInvoke("get_model_settings", { backendUrl });
    } catch (error) {
      return {
        ok: false,
        error: normalizeErrorMessage(error, "Failed to get model settings"),
      };
    }
  }

  const response = await fetch(`/api/settings/model?backendUrl=${encodeURIComponent(backendUrl)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse(response);
}

export async function updateModelSettings(backendUrl, config) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      return await tauriInvoke("update_model_settings", { backendUrl, config });
    } catch (error) {
      return {
        ok: false,
        error: normalizeErrorMessage(error, "Failed to update model settings"),
      };
    }
  }

  const response = await fetch(`/api/settings/model?backendUrl=${encodeURIComponent(backendUrl)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  return readJsonResponse(response);
}

export async function fetchModelList(backendUrl, apiUrl, apiKey) {
  if (isTauriRuntime()) {
    try {
      const tauriInvoke = getTauriInvokeDirect();
      return await tauriInvoke("fetch_model_list", { backendUrl, apiUrl, apiKey });
    } catch (error) {
      return { error: normalizeErrorMessage(error, "Failed to fetch model list") };
    }
  }

  const response = await fetch(
    `/api/settings/models?backendUrl=${encodeURIComponent(backendUrl)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_url: apiUrl, api_key: apiKey }),
    }
  );

  return readJsonResponse(response);
}
