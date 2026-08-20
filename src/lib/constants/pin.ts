export const PIN_STORAGE_KEY = "is_pin_verified";
export const DEFAULT_APP_PIN = "123456";

const AUTH_PIN_ROUTES = new Set(["/login", "/register"]);

export function getAppPin() {
  return process.env.NEXT_PUBLIC_APP_PIN?.trim() || DEFAULT_APP_PIN;
}

export function isAuthPinRoute(pathname: string) {
  return AUTH_PIN_ROUTES.has(pathname);
}

export function readPinVerified() {
  try {
    return window.sessionStorage.getItem(PIN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writePinVerified() {
  try {
    window.sessionStorage.setItem(PIN_STORAGE_KEY, "true");
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function clearPinVerified() {
  try {
    window.sessionStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}
