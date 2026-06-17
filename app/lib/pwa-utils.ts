// PWA utilities — install prompt + SW registration
// ~1KB, no library deps

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

/** Listen for the beforeinstallprompt event. Returns an unsubscribe function. */
export function listenInstallPrompt(
  callback: (event: BeforeInstallPromptEvent) => void
): () => void {
  const handler = (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    callback(deferredPrompt)
  }
  window.addEventListener("beforeinstallprompt", handler)
  return () => window.removeEventListener("beforeinstallprompt", handler)
}

/** Trigger the PWA install prompt. Returns true if the user accepted. */
export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  return outcome === "accepted"
}

/** Register the service worker. Call once at app boot. */
export function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err)
    })
  }
}

/**
 * Count page visits to decide when to show the install banner.
 * Uses localStorage key `onyx-visit-count`. Returns the current count.
 */
export function incrementVisitCount(): number {
  const raw = localStorage.getItem("onyx-visit-count")
  const count = raw ? Number.parseInt(raw, 10) || 0 : 0
  const next = count + 1
  localStorage.setItem("onyx-visit-count", String(next))
  return next
}

export function getVisitCount(): number {
  const raw = localStorage.getItem("onyx-visit-count")
  return raw ? Number.parseInt(raw, 10) || 0 : 0
}
