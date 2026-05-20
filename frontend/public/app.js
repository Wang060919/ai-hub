const backendUrlInput = document.querySelector("#backend-url");
const checkButton = document.querySelector("#check-backend");
const requestStatus = document.querySelector("#request-status");
const healthStatus = document.querySelector("#health-status");
const appVersion = document.querySelector("#app-version");
const skillsCount = document.querySelector("#skills-count");
const skillsBody = document.querySelector("#skills-body");

const statusTabButton = document.querySelector("#tab-status");
const chatTabButton = document.querySelector("#tab-chat");
const statusPanel = document.querySelector("#panel-status");
const chatPanel = document.querySelector("#panel-chat");

const chatMessageInput = document.querySelector("#chat-message");
const sendChatButton = document.querySelector("#send-chat");
const chatStatus = document.querySelector("#chat-status");
const chatSkill = document.querySelector("#chat-skill");
const chatResultStatus = document.querySelector("#chat-result-status");
const chatReply = document.querySelector("#chat-reply");
const chatDataSection = document.querySelector("#chat-data-section");
const chatData = document.querySelector("#chat-data");

const backendUnavailableMessage = "无法连接后端，请先启动 FastAPI 服务";

function setRequestState(type, message) {
  requestStatus.className = `request-status ${type}`;
  requestStatus.textContent = message;
}

function setChatState(type, message) {
  chatStatus.className = `request-status ${type}`;
  chatStatus.textContent = message;
}

function resetSummary() {
  healthStatus.textContent = "-";
  appVersion.textContent = "-";
  skillsCount.textContent = "0";
}

function resetChatResult() {
  chatSkill.textContent = "-";
  chatResultStatus.textContent = "-";
  chatReply.textContent = "-";
  chatData.textContent = "";
  chatDataSection.hidden = true;
  chatDataSection.open = false;
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

function showTab(activeTab) {
  const showStatus = activeTab === "status";
  statusTabButton.classList.toggle("active", showStatus);
  chatTabButton.classList.toggle("active", !showStatus);
  statusTabButton.setAttribute("aria-selected", String(showStatus));
  chatTabButton.setAttribute("aria-selected", String(!showStatus));
  statusPanel.classList.toggle("hidden", !showStatus);
  chatPanel.classList.toggle("hidden", showStatus);
}

async function readJsonResponse(response) {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Proxy returned a non-JSON response");
  }
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

    const payload = await readJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || payload.details || backendUnavailableMessage);
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

function renderChatResult(payload) {
  chatSkill.textContent = payload.skill || "-";
  chatResultStatus.textContent = payload.status || "-";
  chatReply.textContent = payload.reply || "-";

  if (payload.data !== null && payload.data !== undefined) {
    chatData.textContent = JSON.stringify(payload.data, null, 2);
    chatDataSection.hidden = false;
  } else {
    chatData.textContent = "";
    chatDataSection.hidden = true;
    chatDataSection.open = false;
  }
}

async function sendChat() {
  const backendUrl = backendUrlInput.value.trim();
  const message = chatMessageInput.value.trim();

  if (!message) {
    setChatState("error", "Message cannot be empty");
    resetChatResult();
    return;
  }

  sendChatButton.disabled = true;
  setChatState("idle", "Sending /chat request ...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ backendUrl, message }),
    });

    const payload = await readJsonResponse(response);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.details || payload.error || "Chat request failed");
    }

    renderChatResult(payload.chat);
    setChatState("success", `Chat response received from ${payload.backendUrl}`);
  } catch (error) {
    resetChatResult();
    setChatState(
      "error",
      error instanceof Error ? error.message : "Chat request failed"
    );
  } finally {
    sendChatButton.disabled = false;
  }
}

statusTabButton.addEventListener("click", () => showTab("status"));
chatTabButton.addEventListener("click", () => showTab("chat"));
checkButton.addEventListener("click", checkBackend);
sendChatButton.addEventListener("click", sendChat);
