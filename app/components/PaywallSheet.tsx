import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@cloudflare/kumo"
import { LockIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react"
import type { ContentTier } from "./ContentTierBadge"

interface PaywallSheetProps {
  visible: boolean
  creator: {
    name: string
    avatarUrl?: string | null
  }
  contentTier: ContentTier
  keyPrice?: number
  previewText?: string
  previewImage?: string
  onClose: () => void
  onSubscribe: () => void
  onUnlock: () => void
}

export default function PaywallSheet({
  visible,
  creator,
  contentTier,
  keyPrice,
  previewText,
  previewImage,
  onClose,
  onSubscribe,
  onUnlock,
}: PaywallSheetProps) {
  const [show, setShow] = useState(false)
  const [animating, setAnimating] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Animate in/out
  useEffect(() => {
    if (visible) {
      previousFocusRef.current = document.activeElement as HTMLElement
      setShow(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)))
      // Focus close button after animation
      setTimeout(() => closeBtnRef.current?.focus(), 350)
    } else {
      setAnimating(false)
      const timer = setTimeout(() => {
        setShow(false)
        previousFocusRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [visible])

  // Keyboard: Escape to close
  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      // Trap focus
      if (e.key === "Tab" && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [visible, onClose])

  // Touch swipe-down to dismiss
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      touchCurrentY.current = e.touches[0].clientY
      const delta = touchCurrentY.current - touchStartY.current
      if (delta > 0 && sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`
        sheetRef.current.style.transition = "none"
      }
    },
    []
  )

  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentY.current - touchStartY.current
    if (sheetRef.current) {
      sheetRef.current.style.transform = ""
      sheetRef.current.style.transition = ""
    }
    if (delta > 80) onClose()
    touchStartY.current = 0
    touchCurrentY.current = 0
  }, [onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )
}: PaywallSheetProps) {
  const [animating, setAnimating] = useState(false)
  const [show, setShow] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)

  useEffect(() => {
    if (visible) {
      setShow(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const handleBackdropClick = useCallback(() => {
    if (visible) onClose()
  }, [visible, onClose])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    },
    [],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      touchCurrentY.current = e.touches[0].clientY
      const delta = touchCurrentY.current - touchStartY.current
      if (delta > 80 && sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`
      }
    },
    [],
  )

  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentY.current - touchStartY.current
    if (delta > 120) {
      onClose()
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = ""
    }
    touchStartY.current = 0
    touchCurrentY.current = 0
  }, [onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={contentTier === "ppv" ? "Unlock premium content" : "Subscribe to view content"}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-kumo-base shadow-2xl transition-transform duration-300 ease-out ${
          animating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ willChange: "transform" }}
      >
        {/* Handle bar */}
        <div className="sticky top-0 z-10 flex justify-center bg-kumo-base pt-3 pb-1" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-kumo-line" />
        </div>

        {/* Close button */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close paywall"
          className="absolute top-3 right-3 z-20 rounded-full bg-kumo-fill p-1.5 text-kumo-subtle hover:bg-kumo-line transition-colors"
        >
          <XIcon size={16} aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="px-6 pb-8 pt-2">
          {/* Creator info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 overflow-hidden rounded-full bg-kumo-fill ring-2 ring-kumo-line">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-lg font-bold text-kumo-subtle">
                  {creator.name[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-kumo-default">
                {creator.name}
              </p>
              <p className="text-xs text-kumo-subtle">
                {contentTier === "ppv"
                  ? "Exclusive content"
                  : "Subscriber content"}
              </p>
            </div>
          </div>

          {/* Blurred preview */}
          <div className="relative mb-5 overflow-hidden rounded-xl border border-kumo-line">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Content preview"
                className="h-48 w-full object-cover blur-lg pointer-events-none select-none"
              />
            ) : previewText ? (
              <div
                className="h-32 w-full p-4 bg-kumo-recessed pointer-events-none select-none blur-lg"
              >
                <p className="text-sm text-kumo-default line-clamp-4">
                  {previewText}
                </p>
              </div>
            ) : (
              <div
                className="h-32 w-full bg-kumo-recessed flex items-center justify-center pointer-events-none select-none blur-lg"
              >
                <LockIcon size={24} className="text-kumo-subtle" />
              </div>
            )}

            {/* Lock overlay on preview */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
              <div className="flex size-14 items-center justify-center rounded-full bg-kumo-base/90 shadow-lg backdrop-blur">
                {contentTier === "ppv" ? (
                  <LockKeyIcon size={28} className="text-amber-500" weight="fill" />
                ) : (
                  <LockIcon size={28} className="text-kumo-brand" weight="fill" />
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {contentTier === "subscribers" && (
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-kumo-brand hover:bg-kumo-brand/90"
                onClick={onSubscribe}
              >
                Subscribe — from 190,000₫/mo
              </Button>
            )}

            {contentTier === "ppv" && (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-kumo-brand hover:bg-kumo-brand/90"
                  onClick={onSubscribe}
                >
                  Subscribe — get all content
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={onUnlock}
                >
                  Unlock with 1 Key
                  {keyPrice != null && (
                    <span className="ml-1 text-kumo-subtle">
                      ({new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(keyPrice)})
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Maybe later */}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-sm text-kumo-subtle hover:text-kumo-default transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
