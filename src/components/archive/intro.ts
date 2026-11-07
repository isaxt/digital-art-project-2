import { CONFIG } from "../../config";

const EVT = "ocf:open-intro";

export function hasSeenIntro(): boolean {
  try { return window.localStorage.getItem(CONFIG.introKey) === "1"; } catch { return false; }
}
export function markIntroSeen() {
  try { window.localStorage.setItem(CONFIG.introKey, "1"); } catch { /* storage unavailable: it may show again next visit */ }
}
export function openIntro() { window.dispatchEvent(new Event(EVT)); }
export function onOpenIntro(fn: () => void) {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
