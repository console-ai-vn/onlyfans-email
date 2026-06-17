import { useCallback, useEffect, useRef, useState } from "react"
import { PaperPlaneTilt, PaperclipHorizontal } from "@phosphor-icons/react"

interface DMComposerProps {
  onSend: (text: string, attachmentUrl?: string) => void
  disabled?: boolean
}

/**
 * Message input bar with auto-expanding textarea (up to 4 lines),
 * image attachment button, and send button.
 * Keyboard-aware height via visualViewport API.
 */
export default function DMComposer({ onSend, disabled }: DMComposerProps) {
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bottomOffset, setBottomOffset] = useState(0)

  // Keyboard avoidance via visualViewport
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return
    const handleResize = () => {
      const vv = window.visualViewport!
      const keyboardHeight = window.innerHeight - vv.height
      // Only adjust when keyboard opens (not when url bar hides)
      if (keyboardHeight > 50) {
        setBottomOffset(keyboardHeight)
      } else {
        setBottomOffset(0)
      }
    }
    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize)
      window.visualViewport?.removeEventListener("scroll", handleResize)
    }
  }, [])

  // Auto-resize textarea height (1-4 lines)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    const lineHeight = 20
    const maxHeight = lineHeight * 4 + 16 // 4 lines + padding
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`
  }, [text])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleAttach = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      // Reset input for re-selection
      e.target.value = ""

      // Only accept images
      if (!file.type.startsWith("image/")) return

      try {
        setIsUploading(true)
        // Upload via media API: R2 direct upload
        const formData = new FormData()
        formData.append("file", file)
        formData.append(
          "meta",
          JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        )

        const res = await fetch("/api/v1/media/upload/r2", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json() as { url: string }
        onSend("", data.url)
      } catch {
        // Silently fail — user can try again
        console.error("Image upload failed")
      } finally {
        setIsUploading(false)
      }
    },
    [onSend],
  )

  return (
    <div
      className="sticky bottom-0 z-30 border-t border-kumo-line bg-kumo-base px-3 py-2"
      style={{
        paddingBottom: `calc(0.5rem + ${bottomOffset}px)`,
      }}
    >
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          onClick={handleAttach}
          disabled={disabled || isUploading}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-kumo-subtle transition-colors hover:bg-kumo-recessed hover:text-kumo-default disabled:opacity-40"
          aria-label="Attach image"
        >
          {isUploading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-kumo-subtle border-t-transparent" />
          ) : (
            <PaperclipHorizontal size={20} weight="bold" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={disabled}
          rows={1}
          className="min-h-[36px] max-h-[96px] flex-1 resize-none rounded-xl border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-muted focus:border-kumo-brand focus:outline-none disabled:opacity-40"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kumo-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send message"
        >
          <PaperPlaneTilt size={18} weight="fill" />
        </button>
      </div>
    </div>
  )
}
