export function setButtonLoading(button, isLoading, labels) {
  button.classList.toggle("sending", isLoading);
  if (isLoading) {
    button.innerHTML = '<span class="spinner spinner--sm spinner--white"></span> ' + labels.loading;
  } else {
    button.textContent = labels.idle;
  }
}
