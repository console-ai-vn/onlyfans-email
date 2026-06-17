interface TypingIndicatorProps {
  visible: boolean
  name?: string
}

/**
 * Animated 3-dot typing indicator.
 * Each dot bounces with staggered delay: 0ms / 150ms / 300ms.
 * Shows partner name when visible.
 */
export default function TypingIndicator({ visible, name }: TypingIndicatorProps) {
  if (!visible) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        <span
          className="block size-2 rounded-full bg-kumo-subtle animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="block size-2 rounded-full bg-kumo-subtle animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="block size-2 rounded-full bg-kumo-subtle animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      {name && (
        <span className="text-xs text-kumo-subtle">{name} is typing…</span>
      )}
    </div>
  )
}
