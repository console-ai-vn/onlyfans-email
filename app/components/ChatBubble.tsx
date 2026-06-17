import { Check, Checks } from "@phosphor-icons/react"

interface ChatBubbleProps {
  text: string
  isSent: boolean
  timestamp: string
  status?: "sent" | "delivered" | "read"
}

/**
 * Chat message bubble.
 * Sent: right-aligned, brand bg, white text, left-bottom square corner.
 * Received: left-aligned, recessed bg, default text, right-bottom square corner.
 * Status checks: single ✓ (sent), double ✓✓ (delivered), blue ✓✓ (read).
 */
export default function ChatBubble({ text, isSent, timestamp, status }: ChatBubbleProps) {
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${
          isSent
            ? "bg-kumo-brand text-white rounded-br-xl rounded-tl-xl rounded-tr-xl rounded-bl-none"
            : "bg-kumo-recessed text-kumo-default rounded-bl-xl rounded-tl-xl rounded-tr-xl rounded-br-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
        <div className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-kumo-muted/70">{timestamp}</span>
          {isSent && status && (
            <span>
              {status === "read" && (
                <Checks size={12} weight="fill" className="text-blue-400" />
              )}
              {status === "delivered" && (
                <Checks size={12} weight="fill" className="text-kumo-muted/60" />
              )}
              {status === "sent" && (
                <Check size={12} weight="bold" className="text-kumo-muted/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
