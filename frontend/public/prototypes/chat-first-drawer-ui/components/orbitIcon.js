export function renderOrbitIcon({
  variant = "line",
  size = "default",
  animated = false,
  className = "",
  decorative = true,
} = {}) {
  const classes = [
    "orbit-icon",
    `orbit-icon--${variant}`,
    `orbit-icon--${size}`,
    animated ? "is-running" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const ariaHidden = decorative ? 'aria-hidden="true"' : "";

  if (variant === "app") {
    return `
      <span class="${classes}" ${ariaHidden}>
        <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="orbit-app-core-${size}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) rotate(90) scale(22)">
              <stop stop-color="#69B8FF"></stop>
              <stop offset="0.48" stop-color="#1E66FF"></stop>
              <stop offset="1" stop-color="#123DCC"></stop>
            </radialGradient>
            <radialGradient id="orbit-app-halo-${size}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) rotate(90) scale(30)">
              <stop stop-color="rgba(46,123,255,0.34)"></stop>
              <stop offset="1" stop-color="rgba(46,123,255,0)"></stop>
            </radialGradient>
          </defs>
          <rect x="4" y="4" width="64" height="64" rx="18" fill="white"></rect>
          <rect x="4.75" y="4.75" width="62.5" height="62.5" rx="17.25" stroke="#E1ECFA"></rect>
          <circle cx="36" cy="36" r="22" fill="url(#orbit-app-halo-${size})"></circle>
          <g class="orbit-icon__rotor">
            <path d="M18 22.5C22.2 16.7 28.7 13.1 36.2 13.1C43.9 13.1 50.8 17.1 54.9 23.4" stroke="#215CFF" stroke-width="2" stroke-linecap="round"></path>
            <path d="M55.1 48.9C50.9 54.8 44.2 58.3 36.6 58.3C29 58.3 22.4 54.8 18.2 49" stroke="#123DCC" stroke-width="2" stroke-linecap="round"></path>
            <path d="M15.1 35.8C15.1 30.6 17 25.8 20 22.1" stroke="#7EB6FF" stroke-width="2" stroke-linecap="round" stroke-dasharray="1.8 5"></path>
            <path d="M57 23.1C59.5 26.6 60.9 30.9 60.9 35.5C60.9 40.9 59 45.8 55.9 49.5" stroke="#7EB6FF" stroke-width="2" stroke-linecap="round"></path>
            <circle cx="36" cy="13.2" r="3.4" fill="#1D63FF"></circle>
            <circle cx="57.2" cy="35.8" r="3.6" fill="#215CFF"></circle>
            <circle cx="18" cy="49.4" r="4.8" fill="#123DCC"></circle>
            <circle cx="12.8" cy="23.9" r="1.9" fill="#123DCC"></circle>
            <circle cx="24" cy="15.4" r="1.6" fill="#7EB6FF"></circle>
            <circle cx="46" cy="57" r="1.6" fill="#7EB6FF"></circle>
          </g>
          <circle cx="36" cy="36" r="15.6" fill="url(#orbit-app-core-${size})"></circle>
          <path d="M36 28.8L38.3 33.7L43.2 36L38.3 38.3L36 43.2L33.7 38.3L28.8 36L33.7 33.7L36 28.8Z" fill="white"></path>
        </svg>
      </span>
    `;
  }

  return `
    <span class="${classes}" ${ariaHidden}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="orbit-icon__rotor">
          <path d="M17.2 18.2C21.2 13.3 26.9 10.5 33.1 10.5C39.4 10.5 45.3 13.6 49.2 18.8" stroke="#173B91" stroke-width="2.2" stroke-linecap="round"></path>
          <path d="M49.4 45.4C45.5 50.4 39.7 53.4 33.2 53.4C26.9 53.4 21.1 50.5 17.2 45.5" stroke="#173B91" stroke-width="2.2" stroke-linecap="round"></path>
          <path d="M13.7 32.2C13.7 27.9 15 24 17.3 20.7" stroke="#173B91" stroke-width="2.2" stroke-linecap="round"></path>
          <path d="M49.4 19.2C51.7 22.4 53.1 26.4 53.1 30.7C53.1 35.3 51.6 39.6 49 43" stroke="#173B91" stroke-width="2.2" stroke-linecap="round"></path>
          <circle cx="33" cy="10.5" r="3.6" fill="#173B91"></circle>
          <circle cx="54" cy="31.1" r="3.6" fill="#173B91"></circle>
          <circle cx="16" cy="46.6" r="4.6" fill="#173B91"></circle>
          <circle cx="33" cy="53.4" r="2.3" fill="#173B91"></circle>
          <circle cx="24" cy="18" r="1.6" fill="#173B91"></circle>
          <circle cx="42.6" cy="45.8" r="1.6" fill="#173B91"></circle>
        </g>
        <circle cx="33" cy="31.9" r="8.1" stroke="#173B91" stroke-width="2.2"></circle>
        <circle cx="33" cy="31.9" r="2.8" fill="#173B91"></circle>
      </svg>
    </span>
  `;
}
