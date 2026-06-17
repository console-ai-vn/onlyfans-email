import { Button } from "@cloudflare/kumo"
import { DownloadSimpleIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { incrementVisitCount, triggerInstall } from "~/lib/pwa-utils"

interface InstallBannerProps {
  /** Callback when the banner is dismissed */
  onDismiss?: () => void
}

/**
 * Shows "Add ONYX to Home Screen" banner after 3 visits.
 * Uses localStorage visit count. Listens for beforeinstallprompt.
 */
export default function InstallBanner({ onDismiss }: InstallBannerProps) {
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
      return
    }

    // Count visits
    const count = incrementVisitCount()
    if (count < 3) return

    // Show after a short delay so the page has loaded
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleInstall = async () => {
    const accepted = await triggerInstall()
    if (accepted) {
      setVisible(false)
      setInstalled(true)
      onDismiss?.()
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  if (!visible || installed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md md:hidden animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-kumo-line bg-kumo-base/95 px-4 py-3 shadow-lg backdrop-blur-md">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kumo-brand text-sm font-bold text-white">
          O
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-kumo-default">Add ONYX to Home Screen</p>
          <p className="text-xs text-kumo-subtle">Quick access, full-screen experience</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleInstall}>
          <DownloadSimpleIcon size={16} weight="bold" />
          Install
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default"
          aria-label="Dismiss"
        >
          <XIcon size={16} />
        </button>
      </div>
    </div>
  )
}
