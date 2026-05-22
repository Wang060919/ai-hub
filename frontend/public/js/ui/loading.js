export function setButtonLoading(button, isLoading, labels) {
  button.classList.toggle("sending", isLoading);
  button.textContent = isLoading ? labels.loading : labels.idle;
}
