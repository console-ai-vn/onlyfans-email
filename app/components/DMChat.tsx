import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, UserCircle } from "@phosphor-icons/react"
import ChatBubble from "~/components/ChatBubble"
import DMComposer from "~/components/DMComposer"
import TypingIndicator from "~/components/TypingIndicator"
import OnlineBadge from "~/components/OnlineBadge"
import MediaPreview from "~/components/MediaPreview"
import { useDM } from "~/hooks/useDM"
import { useTyping } from "~/hooks/useTyping"
import { useMessages, useOnlineStatus } from "~/queries/dm"
import type { DMMessage } from "~/queries/dm"

interface DMChatProps {
  conversationId: string
  userEmail: string
  recipientEmail: string
  recipientName?: string
}

/**
 * Formats a date string into a display label ("Today", "Yesterday", "Jun 15").
 */
function dateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (msgDate.getTime() === today.getTime()) return "Today"
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

/**
 * Chat view component.
 * Message list with date separators, auto-scroll to bottom,
 * input bar fixed above tab bar, image preview overlay.
 */
export default function DMChat({
  conversationId,
  userEmail,
  recipientEmail,
  recipientName,
}: DMChatProps) {
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLenRef = useRef(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Query messages from REST
  const { data: restMessages = [], isLoading } = useMessages(conversationId)

  // Real-time DM (WebSocket + polling fallback)
  const { sendMessage: wsSendMessage, messages: wsMessages, isConnected, isTyping: wsTyping } = useDM(userEmail)

  // Typing indicator hook
  const { isPartnerTyping, setTyping } = useTyping(userEmail, recipientEmail, wsTyping)

  // Online status
  const { data: onlineData } = useOnlineStatus(recipientEmail)
  const online = onlineData?.online ?? false
  const lastSeen = onlineData?.lastSeen

  // Merge WS + REST messages, dedup by id
  const allMessages = useMemo(() => {
    const map = new Map<string, DMMessage>()
    for (const m of restMessages) map.set(m.id, m)
    for (const m of wsMessages) map.set(m.id, m)
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
  }, [restMessages, wsMessages])

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (allMessages.length > prevLenRef.current) {
      scrollToBottom()
    }
    prevLenRef.current = allMessages.length
  }, [allMessages.length, scrollToBottom])

  // Scroll to bottom on first load
  useEffect(() => {
    if (allMessages.length > 0 && prevLenRef.current === 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [])

  // Message send handler
  const handleSend = useCallback(
    (text: string, attachmentUrl?: string) => {
      if (!text && !attachmentUrl) return
      wsSendMessage(recipientEmail, text || "📷 Image", attachmentUrl)
      setTyping(false)
    },
    [recipientEmail, wsSendMessage, setTyping],
  )

  // Attach tap handler for images in messages
  const handleImageTap = useCallback((url: string) => {
    setPreviewUrl(url)
  }, [])

  // Group messages by date for date separators
  const grouped = useMemo(() => {
    const groups: { label: string; messages: DMMessage[] }[] = []
    for (const msg of allMessages) {
      const label = dateLabel(msg.timestamp)
      const last = groups[groups.length - 1]
      if (last && last.label === label) {
        last.messages.push(msg)
      } else {
        groups.push({ label, messages: [msg] })
      }
    }
    return groups
  }, [allMessages])

  return (
    <div className="flex flex-col h-dvh bg-kumo-base">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-kumo-line bg-kumo-base/95 backdrop-blur-md px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-9 items-center justify-center rounded-full hover:bg-kumo-recessed transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} weight="bold" className="text-kumo-default" />
        </button>

        <div className="relative shrink-0">
          <UserCircle size={36} className="text-kumo-inactive" weight="light" />
          <OnlineBadge online={online} lastSeen={lastSeen} />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-kumo-default truncate">
            {recipientName || recipientEmail}
          </h1>
          <p className="text-[11px] text-kumo-muted">
            {online ? "Online" : lastSeen ? `Last seen ${lastSeen}` : "Offline"}
          </p>
        </div>

        {/* Connection status indicator */}
        {isConnected && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            LIVE
          </span>
        )}
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
        {isLoading && allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="block size-2 rounded-full bg-kumo-inactive animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-kumo-muted">Loading messages…</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <UserCircle size={48} className="text-kumo-inactive" weight="light" />
            <p className="text-sm font-medium text-kumo-default">No messages yet</p>
            <p className="text-xs text-kumo-subtle">
              Say hello to start the conversation
            </p>
          </div>
        ) : (
          <>
            {/* Date separators + messages */}
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="flex items-center justify-center my-4">
                  <span className="rounded-full bg-kumo-recessed px-3 py-0.5 text-[10px] font-medium text-kumo-muted">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((msg) => {
                  const isSent = msg.senderEmail === userEmail
                  const time = formatTime(msg.timestamp)
                  const hasAttachment = !!msg.attachmentUrl

                  return (
                    <div key={msg.id}>
                      <ChatBubble
                        text={msg.text}
                        isSent={isSent}
                        timestamp={time}
                        status={isSent ? msg.status : undefined}
                      />
                      {hasAttachment && msg.attachmentUrl && (
                        <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}>
                          <button
                            type="button"
                            className="max-w-[75%] overflow-hidden rounded-xl"
                            onClick={() => handleImageTap(msg.attachmentUrl!)}
                          >
                            <img
                              src={msg.attachmentUrl}
                              alt="Attachment"
                              className="max-h-48 w-auto rounded-xl object-cover"
                              loading="lazy"
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Typing indicator */}
            <TypingIndicator
              visible={isPartnerTyping}
              name={recipientName || recipientEmail}
            />
          </>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <DMComposer
        onSend={handleSend}
        disabled={false}
      />

      {/* Media preview overlay */}
      <MediaPreview
        url={previewUrl || ""}
        visible={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  )
}

