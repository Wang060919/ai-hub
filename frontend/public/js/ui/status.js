export function setTextStatus(element, message, tone = "idle") {
  element.className = `request-status ${tone}`;
  element.textContent = message;
}
