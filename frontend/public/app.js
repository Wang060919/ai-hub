const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const healthStatus = document.querySelector("#health-status");
const appVersion = document.querySelector("#app-version");
const skillsCount = document.querySelector("#skills-count");
const skillsBody = document.querySelector("#skills-body");
const backendUnavailableMessage =
  "\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef\uff0c\u8bf7\u5148\u542f\u52a8 FastAPI \u670d\u52a1";

function setRequestState(type, message) {
  requestStatus.className = `request-status ${type}`;
  requestStatus.textContent = message;
}

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
}

function renderEmptyRow(message) {
  skillsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${message}</td></tr>`;
}

function renderSkills(skills) {
  if (!Array.isArray(skills) || skills.length === 0) {
    renderEmptyRow("No skills were returned by the backend");
    return;
  }

  skillsBody.innerHTML = skills
    .map(
      (skill) => `
        <tr>
          <td>${skill.name}</td>
          <td>${skill.description}</td>
          <td>${skill.stage}</td>
          <td>${skill.safety_level}</td>
          <td><span class="tag ${skill.executable ? "true" : "false"}">${skill.executable}</span></td>
        </tr>
      `
    )
    .join("");
}

async function checkBackend() {
  const backendUrl = backendUrlInput.value.trim();
  checkButton.disabled = true;
  setRequestState("idle", "Checking /health, /version, and /skills ...");

  try {
    const response = await fetch("/api/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ backendUrl }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || backendUnavailableMessage);
    }

    healthStatus.textContent = payload.health.status || "-";
    appVersion.textContent = payload.version.version || "-";
    skillsCount.textContent = String(payload.skills.skills?.length || 0);
    renderSkills(payload.skills.skills || []);
    setRequestState("success", `Connected: ${payload.backendUrl}`);
  } catch (error) {
    resetSummary();
    renderEmptyRow(backendUnavailableMessage);
    setRequestState(
      "error",
      error instanceof Error ? error.message : backendUnavailableMessage
    );
  } finally {
    checkButton.disabled = false;
  }
}

checkButton.addEventListener("click", checkBackend);
