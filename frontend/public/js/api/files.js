import { readJsonResponse, throwApiError } from "./client.js";

export async function requestFilePreview(backendUrl, path) {
  const response = await fetch("/api/files/preview", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/files/preview", "preview");
  }

  return payload.preview;
}

export async function requestFileSummary(backendUrl, path) {
  const response = await fetch("/api/files/summarize", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ backendUrl, path }),
  });

  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throwApiError(response, payload, "/api/files/summarize", "summary");
  }

  return payload.summary;
}
